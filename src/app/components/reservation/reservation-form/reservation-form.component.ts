import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, BehaviorSubject } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem } from 'primeng/api';

// Services
import { ReservationService, CreateReservationRequest, AvailabilityResponse, AlternativeSlot } from '../../../services/reservation.service';
import { ScenarioService, Scenario } from '../../../services/scenario.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { SystemConfigService } from '../../../services/system-config.service';
import { formatForAPI, combineDateTime } from '../../../utils/date.utils';

interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
  available?: boolean;
}

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG Components
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MessageModule,
    ProgressSpinnerModule,
    StepsModule,
    CardModule,
    ChipModule,
    DividerModule,
    TextareaModule,
    ConfirmDialogModule
  ],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {
  // Form y estado
  reservationForm!: FormGroup;
  currentStep = 0;
  isLoading = false;
  isSubmitting = false;
  
  // Data del escenario
  selectedScenario: Scenario | null = null;
  scenarios: Scenario[] = [];
  preselectedScenarioId: number | null = null;
  
  // Disponibilidad y horarios
  availabilityResponse: AvailabilityResponse | null = null;
  isCheckingAvailability = false;
  availabilityMessage = '';
  suggestedSlots: AlternativeSlot[] = [];
  
  // Time slots generados
  availableTimeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;
  
  // Configuración de fechas
  minDate = new Date();
  maxDate = new Date();
  
  // Pasos del wizard
  steps: MenuItem[] = [
    { label: 'Escenario', icon: 'pi pi-building' },
    { label: 'Fecha y Hora', icon: 'pi pi-calendar' },
    { label: 'Detalles', icon: 'pi pi-file-edit' },
    { label: 'Confirmación', icon: 'pi pi-check-circle' }
  ];

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reservationService = inject(ReservationService);
  private scenarioService = inject(ScenarioService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private systemConfigService = inject(SystemConfigService);

  constructor() {
    this.initForm();
    this.setDateLimits();
  }

  ngOnInit(): void {
    // Primero cargar escenarios, luego manejar parámetros
    this.loadScenarios();
    this.setupAvailabilityCheck();
  }

  private initForm(): void {
    this.reservationForm = this.fb.group({
      escenarioId: [null, [Validators.required]],
      fechaSeleccionada: [null, [Validators.required]],
      horaInicio: [null, [Validators.required]],
      horaFin: [null, [Validators.required]],
      duracion: [60, [Validators.required, Validators.min(30), Validators.max(240)]],
      observaciones: ['', [Validators.maxLength(500)]]
    });
  }

  private setDateLimits(): void {
    // Usar configuración dinámica del sistema
    this.minDate = this.systemConfigService.getMinAllowedDate();
    this.maxDate = this.systemConfigService.getMaxAllowedDate();
    
    // Suscribirse a cambios en la configuración
    this.systemConfigService.config$.subscribe(config => {
      this.minDate = this.systemConfigService.getMinAllowedDate();
      this.maxDate = this.systemConfigService.getMaxAllowedDate();
    });
  }

  private loadScenarios(): void {
    this.isLoading = true;
    this.scenarioService.getScenarios().subscribe({
      next: (scenarios) => {
        this.scenarios = scenarios.filter(s => s.disponible);
        this.isLoading = false;
        // Después de cargar escenarios, manejar parámetros de query
        this.checkForPreselectedScenario();
      },
      error: (error) => {
        console.error('Error loading scenarios:', error);
        this.toastService.showError('Error al cargar los escenarios');
        this.isLoading = false;
      }
    });
  }

  private checkForPreselectedScenario(): void {
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      
      if (params['scenarioId']) {
        this.preselectedScenarioId = Number(params['scenarioId']);
        console.log('Preselected scenario ID:', this.preselectedScenarioId);
        
        // Verificar que el escenario existe en la lista
        const scenario = this.scenarios.find(s => s.id === this.preselectedScenarioId);
        console.log('Found scenario:', scenario);
        
        if (scenario) {
          this.reservationForm.patchValue({
            escenarioId: this.preselectedScenarioId
          });
          this.onScenarioChange();
        } else {
          console.warn(`Scenario with ID ${this.preselectedScenarioId} not found in available scenarios`);
        }
      }
      
      // También manejar fecha preseleccionada
      if (params['fecha']) {
        const fechaPreseleccionada = new Date(params['fecha']);
        console.log('Preselected date:', fechaPreseleccionada);
        
        if (!isNaN(fechaPreseleccionada.getTime())) {
          this.reservationForm.patchValue({
            fechaSeleccionada: fechaPreseleccionada
          });
          this.onDateChange();
        }
      }
    });
  }

  private setupAvailabilityCheck(): void {
    // Verificar disponibilidad cuando cambian los campos relevantes
    this.reservationForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => 
        prev?.escenarioId === curr?.escenarioId &&
        prev?.fechaSeleccionada?.getTime() === curr?.fechaSeleccionada?.getTime() &&
        prev?.horaInicio?.getTime() === curr?.horaInicio?.getTime() &&
        prev?.horaFin?.getTime() === curr?.horaFin?.getTime()
      ),
      switchMap(formValue => {
        if (this.canCheckAvailability(formValue)) {
          return this.checkAvailability();
        }
        return of(null);
      }),
      catchError(error => {
        console.error('Error in availability check:', error);
        return of(null);
      })
    ).subscribe();
  }

  onScenarioChange(): void {
    const escenarioId = this.reservationForm.get('escenarioId')?.value;
    if (escenarioId) {
      this.selectedScenario = this.scenarios.find(s => s.id === escenarioId) || null;
      this.generateTimeSlots();
    }
  }

  onDateChange(): void {
    this.generateTimeSlots();
    this.resetTimeSelection();
  }

  onDurationChange(): void {
    this.updateEndTime();
    this.generateTimeSlots();
  }

  onTimeSlotSelect(slot: TimeSlot): void {
    console.log('Selected time slot:', slot);
    this.selectedTimeSlot = slot;
    this.reservationForm.patchValue({
      horaInicio: slot.start,
      horaFin: slot.end
    });
  }

  private generateTimeSlots(): void {
    const fecha = this.reservationForm.get('fechaSeleccionada')?.value;
    const duracion = this.reservationForm.get('duracion')?.value || 60;
    
    if (!fecha) {
      this.availableTimeSlots = [];
      return;
    }

    this.availableTimeSlots = this.reservationService.generateTimeSlots(fecha, duracion);
  }

  private resetTimeSelection(): void {
    this.selectedTimeSlot = null;
    this.reservationForm.patchValue({
      horaInicio: null,
      horaFin: null
    });
  }

  private updateEndTime(): void {
    const horaInicio = this.reservationForm.get('horaInicio')?.value;
    const duracion = this.reservationForm.get('duracion')?.value;
    
    if (horaInicio && duracion) {
      const horaFin = new Date(horaInicio);
      horaFin.setMinutes(horaFin.getMinutes() + duracion);
      this.reservationForm.patchValue({ horaFin });
    }
  }

  private canCheckAvailability(formValue: any): boolean {
    return formValue?.escenarioId && 
           formValue?.fechaSeleccionada && 
           formValue?.horaInicio && 
           formValue?.horaFin;
  }

  private checkAvailability() {
    if (this.isCheckingAvailability) return of(null);
    
    const formValue = this.reservationForm.value;
    this.isCheckingAvailability = true;
    this.availabilityMessage = '';

    console.log('Form values for availability check:', {
      horaInicio: formValue.horaInicio,
      horaFin: formValue.horaFin
    });

    return this.reservationService.verifyAvailabilityFromDates(
      formValue.escenarioId,
      formValue.horaInicio,
      formValue.horaFin
    ).pipe(
      switchMap(response => {
        this.availabilityResponse = response;
        this.availabilityMessage = response.mensaje;
        this.suggestedSlots = response.alternativas || [];
        this.isCheckingAvailability = false;

        // Marcar time slots como disponibles/no disponibles
        this.updateTimeSlotAvailability(response);
        
        return of(response);
      }),
      catchError(error => {
        console.error('Error checking availability:', error);
        this.isCheckingAvailability = false;
        this.availabilityMessage = 'Error al verificar disponibilidad';
        return of(null);
      })
    );
  }

  private updateTimeSlotAvailability(response: AvailabilityResponse): void {
    this.availableTimeSlots.forEach(slot => {
      slot.available = response.disponible;
      if (!response.disponible && response.conflictos) {
        // Verificar si este slot específico tiene conflicto
        const hasConflict = response.conflictos.some(conflicto => {
          const conflictStart = new Date(conflicto.fechaInicio);
          const conflictEnd = new Date(conflicto.fechaFin);
          return !(slot.end <= conflictStart || slot.start >= conflictEnd);
        });
        slot.available = !hasConflict;
      }
    });
  }

  onAlternativeSlotSelect(alternative: AlternativeSlot): void {
    const fechaInicio = new Date(alternative.fechaInicio);
    const fechaFin = new Date(alternative.fechaFin);
    const duracion = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60);

    this.reservationForm.patchValue({
      fechaSeleccionada: fechaInicio,
      horaInicio: fechaInicio,
      horaFin: fechaFin,
      duracion: duracion
    });

    this.selectedTimeSlot = {
      start: fechaInicio,
      end: fechaFin,
      label: this.formatTimeRange(fechaInicio, fechaFin),
      available: true
    };

    this.generateTimeSlots();
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 0: // Escenario
        return this.reservationForm.get('escenarioId')?.valid || false;
      case 1: // Fecha y Hora
        return this.reservationForm.get('fechaSeleccionada')?.valid &&
               this.reservationForm.get('horaInicio')?.valid &&
               this.reservationForm.get('horaFin')?.valid || false;
      case 2: // Detalles
        return true; // Las observaciones son opcionales
      default:
        return true;
    }
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.availabilityResponse?.disponible) {
      this.toastService.showError('El horario seleccionado no está disponible');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.reservationForm.value;

    console.log('Form values for reservation creation:', {
      horaInicio: formValue.horaInicio,
      horaFin: formValue.horaFin
    });

    this.reservationService.createReservationFromDates(
      formValue.escenarioId,
      formValue.horaInicio,
      formValue.horaFin,
      formValue.observaciones || undefined
    ).subscribe({
      next: (reservation) => {
        this.toastService.showSuccess('Reserva creada exitosamente');
        this.router.navigate(['/dashboard/reservas'], {
          queryParams: { created: reservation.id }
        });
      },
      error: (error) => {
        console.error('Error creating reservation:', error);
        this.toastService.showError(
          error.error?.message || 'Error al crear la reserva'
        );
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/escenarios']);
  }

  // Utility methods
  formatTimeRange(start: Date, end: Date): string {
    return `${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  formatAlternativeTimeRange(startStr: string, endStr: string): string {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.formatTimeRange(start, end);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getDurationOptions(): { label: string; value: number }[] {
    return [
      { label: '30 minutos', value: 30 },
      { label: '1 hora', value: 60 },
      { label: '1.5 horas', value: 90 },
      { label: '2 horas', value: 120 },
      { label: '3 horas', value: 180 },
      { label: '4 horas', value: 240 }
    ];
  }

  isStepValid(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return this.reservationForm.get('escenarioId')?.valid || false;
      case 1:
        return (this.reservationForm.get('fechaSeleccionada')?.valid &&
                this.reservationForm.get('horaInicio')?.valid &&
                this.reservationForm.get('horaFin')?.valid) || false;
      case 2:
        return true;
      case 3:
        return this.reservationForm.valid && (this.availabilityResponse?.disponible || false);
      default:
        return false;
    }
  }

  get isFormValid(): boolean {
    return this.reservationForm.valid && (this.availabilityResponse?.disponible || false);
  }
}