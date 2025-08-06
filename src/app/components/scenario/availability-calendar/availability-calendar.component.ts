import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, catchError, of, forkJoin } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';

// Services
import { ScenarioService, Scenario } from '../../../services/scenario.service';
import { ReservationService, BloqueOcupado } from '../../../services/reservation.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { SystemConfigService } from '../../../services/system-config.service';

interface CalendarDay {
  date: Date;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  availability: 'DISPONIBLE' | 'RESERVADO' | 'NO_DISPONIBLE' | 'UNKNOWN';
  reservations?: any[];
  ocupaciones?: BloqueOcupado[]; // Nueva propiedad para mostrar rangos específicos
}

interface AvailabilityRequest {
  fechaInicio: string;
  fechaFin: string;
  tipo?: string;
  ubicacion?: string;
  nombre?: string;
}

@Component({
  selector: 'app-availability-calendar',
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
    CardModule,
    ChipModule
  ],
  templateUrl: './availability-calendar.component.html',
  styleUrls: ['./availability-calendar.component.css']
})
export class AvailabilityCalendarComponent implements OnInit {
  // Form y estado
  searchForm!: FormGroup;
  isLoading = false;
  isCheckingAvailability = false;
  
  // Data del escenario
  selectedScenario: (Scenario & { id: number }) | null = null;
  scenarios: Scenario[] = [];
  scenarioTypes: string[] = [];
  locations: string[] = [];
  
  // Calendario
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  calendarDays: CalendarDay[] = [];
  
  // Disponibilidad
  availabilityData: any[] = [];
  
  // Configuración
  minDate = new Date();
  maxDate = new Date();
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private scenarioService = inject(ScenarioService);
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private systemConfigService = inject(SystemConfigService);

  constructor() {
    this.initForm();
    this.setDateLimits();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.generateCalendar();
    this.checkRouteParams();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      scenarioId: [null],
      scenarioName: [''],
      scenarioType: [''],
      location: [''],
      dateRange: [null, Validators.required]
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
      this.generateCalendar(); // Regenerar calendario con nuevos límites
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Cargar escenarios
    this.scenarioService.getScenarios().pipe(
      switchMap(scenarios => {
        this.scenarios = scenarios;
        return this.scenarioService.getTiposEscenario();
      }),
      switchMap(tipos => {
        this.scenarioTypes = tipos;
        return this.scenarioService.getUbicaciones();
      }),
      catchError(error => {
        console.error('Error loading initial data:', error);
        this.toastService.showError('Error al cargar los datos iniciales');
        return of(null);
      })
    ).subscribe(() => {
      this.isLoading = false;
    });
  }

  private checkRouteParams(): void {
    this.route.params.subscribe(params => {
      if (params['scenarioId']) {
        const scenarioId = +params['scenarioId'];
        this.searchForm.patchValue({ scenarioId });
        this.onScenarioChange(scenarioId);
      }
    });
  }

  onScenarioChange(scenarioId: number): void {
    if (scenarioId) {
      const scenario = this.scenarios.find(s => s.id === scenarioId);
      if (scenario && scenario.id) {
        this.selectedScenario = scenario as (Scenario & { id: number });
        this.searchForm.patchValue({
          scenarioName: this.selectedScenario.nombre,
          scenarioType: this.selectedScenario.tipo,
          location: this.selectedScenario.ubicacion
        });
        // Cargar ocupaciones para el mes actual cuando se selecciona un escenario
        this.loadOccupationsForCurrentMonth();
      }
    } else {
      this.selectedScenario = null;
      // Limpiar ocupaciones cuando no hay escenario seleccionado
      this.clearOccupations();
    }
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.toastService.showError('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.searchForm.value;
    const dateRange = formValue.dateRange;
    
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      this.toastService.showError('Por favor seleccione un rango de fechas');
      return;
    }

    this.checkAvailability({
      fechaInicio: this.formatDateForAPI(dateRange[0]),
      fechaFin: this.formatDateForAPI(dateRange[1]),
      tipo: formValue.scenarioType || undefined,
      ubicacion: formValue.location || undefined,
      nombre: formValue.scenarioName || undefined
    });
  }

  private checkAvailability(request: AvailabilityRequest): void {
    this.isCheckingAvailability = true;
    this.availabilityData = [];

    // Llamar al servicio de disponibilidad
    this.scenarioService.checkAvailability(request).pipe(
      catchError(error => {
        console.error('Error checking availability:', error);
        this.toastService.showError('Error al verificar disponibilidad');
        return of([]);
      })
    ).subscribe(data => {
      this.availabilityData = data;
      this.updateCalendarAvailability();
      this.isCheckingAvailability = false;
    });
  }

  private updateCalendarAvailability(): void {
    // Actualizar el estado de disponibilidad en el calendario
    this.calendarDays = this.calendarDays.map(day => {
      const dayAvailability = this.getDayAvailability(day.date);
      return {
        ...day,
        availability: dayAvailability
      };
    });
  }

  private getDayAvailability(date: Date): 'DISPONIBLE' | 'RESERVADO' | 'NO_DISPONIBLE' | 'UNKNOWN' {
    // Verificar si está dentro del rango permitido usando la configuración dinámica
    if (!this.systemConfigService.isDateAllowed(date)) {
      return 'NO_DISPONIBLE';
    }

    const dateStr = this.formatDateForAPI(date);
    const dayData = this.availabilityData.find(item => 
      item.fecha === dateStr || 
      (new Date(item.fechaInicio) <= date && new Date(item.fechaFin) >= date)
    );

    if (!dayData) {
      return 'UNKNOWN';
    }

    return dayData.disponible ? 'DISPONIBLE' : 'RESERVADO';
  }

  private generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) { // 6 semanas * 7 días
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      this.calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        isCurrentMonth: currentDate.getMonth() === this.currentMonth,
        isToday: this.isSameDay(currentDate, today),
        isPast: !this.systemConfigService.isDateAllowed(currentDate),
        availability: 'UNKNOWN'
      });
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
    // Cargar ocupaciones del nuevo mes si hay un escenario seleccionado
    if (this.selectedScenario) {
      this.loadOccupationsForCurrentMonth();
    }
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
    // Cargar ocupaciones del nuevo mes si hay un escenario seleccionado
    if (this.selectedScenario) {
      this.loadOccupationsForCurrentMonth();
    }
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.generateCalendar();
  }

  getMonthName(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[this.currentMonth];
  }

  getDayName(dayIndex: number): string {
    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    return days[dayIndex];
  }

  getAvailabilityClass(availability: string): string {
    switch (availability) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'RESERVADO':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'NO_DISPONIBLE':
        return 'bg-gray-100 text-gray-500 border-gray-300';
      default:
        return 'bg-white text-gray-900 border-gray-200';
    }
  }

  getDayClasses(day: CalendarDay): string {
    let classes = 'calendar-day';
    
    if (day.isCurrentMonth) {
      classes += ' current-month';
    } else {
      classes += ' other-month';
    }
    
    if (day.isPast) {
      classes += ' past-day';
    }
    
    if (day.isToday) {
      classes += ' today';
    }
    
    return classes;
  }

  getDayNumberClasses(day: CalendarDay): string {
    let classes = 'day-number';
    
    if (day.isCurrentMonth) {
      classes += ' current-month';
    } else {
      classes += ' other-month';
    }
    
    if (day.isPast) {
      classes += ' past-day';
    }
    
    if (day.isToday) {
      classes += ' today';
    }
    
    return classes;
  }

  getAvailabilityText(availability: string): string {
    switch (availability) {
      case 'DISPONIBLE':
        return 'DISPONIBLE';
      case 'RESERVADO':
        return 'RESERVADO';
      case 'NO_DISPONIBLE':
        return 'NO DISPONIBLE';
      default:
        return '';
    }
  }

  onDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      return;
    }
    
    // Verificar restricciones de fecha usando la configuración dinámica
    if (!this.systemConfigService.isDateAllowed(day.date)) {
      const errorMessage = this.systemConfigService.getDateErrorMessage(day.date);
      this.toastService.showWarning(errorMessage);
      return;
    }

    // Si hay un escenario seleccionado, abrir el formulario de reserva
    if (this.selectedScenario) {
      this.router.navigate(['/dashboard/reservas/nueva'], {
        queryParams: {
          scenarioId: this.selectedScenario.id,
          fecha: this.formatDateForAPI(day.date)
        }
      });
    } else {
      this.toastService.showInfo('Seleccione un escenario para hacer una reserva');
    }
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Carga ocupaciones para todos los días visibles del mes actual cuando hay un escenario seleccionado
   */
  private loadOccupationsForCurrentMonth(): void {
    if (!this.selectedScenario) {
      return;
    }

    this.isCheckingAvailability = true;
    
    // Obtener todos los días únicos del mes actual que están en el calendario
    const daysToCheck = this.calendarDays
      .filter(day => day.isCurrentMonth && !day.isPast)
      .map(day => day.date);

    // Agrupar por semanas para reducir el número de consultas
    const maxConcurrentRequests = 7; // Máximo 7 consultas paralelas
    const batches: Date[][] = [];
    
    for (let i = 0; i < daysToCheck.length; i += maxConcurrentRequests) {
      batches.push(daysToCheck.slice(i, i + maxConcurrentRequests));
    }

    // Procesar cada batch secuencialmente para no sobrecargar el servidor
    this.processBatches(batches, 0);
  }

  /**
   * Procesa los batches de consultas secuencialmente
   */
  private processBatches(batches: Date[][], batchIndex: number): void {
    if (batchIndex >= batches.length) {
      this.isCheckingAvailability = false;
      return;
    }

    const currentBatch = batches[batchIndex];
    
    if (!this.selectedScenario) {
      this.isCheckingAvailability = false;
      return;
    }
    
    const occupationRequests = currentBatch.map(date => 
      this.reservationService.obtenerOcupacionesDiaFromDate(this.selectedScenario!.id, date)
    );

    // Procesar el batch actual
    forkJoin(occupationRequests).subscribe({
      next: (responses) => {
        // Procesar las respuestas y actualizar el calendario
        responses.forEach((ocupacionResponse, index) => {
          const day = currentBatch[index];
          this.updateDayWithOccupations(day, ocupacionResponse.bloquesOcupados);
        });
        
        // Procesar el siguiente batch después de un breve delay
        setTimeout(() => {
          this.processBatches(batches, batchIndex + 1);
        }, 100);
      },
      error: (error) => {
        console.error(`Error loading occupations for batch ${batchIndex}:`, error);
        // Continuar con el siguiente batch aunque falle uno
        setTimeout(() => {
          this.processBatches(batches, batchIndex + 1);
        }, 100);
      }
    });
  }

  /**
   * Actualiza un día específico con sus ocupaciones
   */
  private updateDayWithOccupations(date: Date, bloquesOcupados: BloqueOcupado[]): void {
    const dayIndex = this.calendarDays.findIndex(day => 
      this.isSameDay(day.date, date)
    );

    if (dayIndex !== -1) {
      this.calendarDays[dayIndex].ocupaciones = bloquesOcupados;
      // Actualizar el estado de disponibilidad basado en las ocupaciones
      this.calendarDays[dayIndex].availability = bloquesOcupados.length > 0 ? 'RESERVADO' : 'DISPONIBLE';
    }
  }

  /**
   * Limpia las ocupaciones de todos los días
   */
  private clearOccupations(): void {
    this.calendarDays.forEach(day => {
      day.ocupaciones = [];
      day.availability = 'UNKNOWN';
    });
  }

  /**
   * Convierte una hora en formato string a texto legible (ej: "09:00")
   */
  formatTimeFromDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  /**
   * Genera el texto del rango de horas para mostrar en el calendario
   */
  getOccupationTimeRange(bloque: BloqueOcupado): string {
    const inicio = this.formatTimeFromDateTime(bloque.horaInicio);
    const fin = this.formatTimeFromDateTime(bloque.horaFin);
    return `${inicio}-${fin}`;
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.selectedScenario = null;
    this.availabilityData = [];
    this.clearOccupations();
    this.updateCalendarAvailability();
  }
} 