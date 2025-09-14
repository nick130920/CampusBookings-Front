import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

import {
	DIAS_SEMANA,
	PATRON_RECURRENCIA_LABELS,
	PatronRecurrencia,
	RecurringReservationPreview,
	RecurringReservationRequest,
	RecurringReservationService
} from '../../../services/recurring-reservation.service';
import { Scenario, ScenarioService } from '../../../services/scenario.service';

@Component({
  selector: 'app-recurring-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    PanelModule,
    TagModule,
    DataViewModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './recurring-reservation.component.html',
  styles: []
})
export class RecurringReservationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recurringService = inject(RecurringReservationService);
  private scenarioService = inject(ScenarioService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // Signals
  scenarios = signal<Scenario[]>([]);
  loadingScenarios = signal(false);
  loadingPreview = signal(false);
  creating = signal(false);
  preview = signal<RecurringReservationPreview | null>(null);
  selectedDays = signal<number[]>([]);

  // Computed
  selectedPatron = computed(() => this.reservaForm.get('patron')?.value);
  minDateFin = computed(() => {
    const fechaInicio = this.reservaForm.get('fechaInicio')?.value;
    return fechaInicio ? new Date(fechaInicio) : this.minDate;
  });

  // Form
  reservaForm: FormGroup;

  // Constants
  readonly DIAS_SEMANA = DIAS_SEMANA;
  readonly minDate = new Date();
  readonly maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 2));

  readonly patronOptions = [
    { label: PATRON_RECURRENCIA_LABELS[PatronRecurrencia.DIARIO], value: PatronRecurrencia.DIARIO },
    { label: PATRON_RECURRENCIA_LABELS[PatronRecurrencia.SEMANAL], value: PatronRecurrencia.SEMANAL },
    { label: PATRON_RECURRENCIA_LABELS[PatronRecurrencia.MENSUAL], value: PatronRecurrencia.MENSUAL }
  ];

  constructor() {
    this.reservaForm = this.fb.group({
      escenarioId: [null, Validators.required],
      patron: [PatronRecurrencia.SEMANAL, Validators.required],
      fechaInicio: [null, Validators.required],
      fechaFin: [null, Validators.required],
      horaInicio: [null, Validators.required],
      horaFin: [null, Validators.required],
      observaciones: [''],
      diaMes: [null],
      intervaloRepeticion: [1, [Validators.min(1), Validators.max(52)]],
      maxReservas: [52, [Validators.min(1), Validators.max(365)]]
    });

    // Watch for patron changes to clear related fields
    this.reservaForm.get('patron')?.valueChanges.subscribe(() => {
      this.selectedDays.set([]);
      this.reservaForm.patchValue({
        diaMes: null
      });
      this.preview.set(null);
    });

    // Watch for form changes to clear preview
    this.reservaForm.valueChanges.subscribe(() => {
      if (this.preview()) {
        this.preview.set(null);
      }
    });
  }

  ngOnInit() {
    this.loadScenarios();
    this.setDefaultDates();
  }

  private loadScenarios() {
    this.loadingScenarios.set(true);
    this.scenarioService.getScenarios().subscribe({
      next: (scenarios: Scenario[]) => {
        this.scenarios.set(scenarios.filter((s: Scenario) => s.disponible));
        this.loadingScenarios.set(false);
      },
      error: (error: any) => {
        console.error('Error loading scenarios:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los escenarios'
        });
        this.loadingScenarios.set(false);
      }
    });
  }

  private setDefaultDates() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const threeMonths = new Date(today);
    threeMonths.setMonth(today.getMonth() + 3);

    this.reservaForm.patchValue({
      fechaInicio: nextWeek,
      fechaFin: threeMonths,
      horaInicio: new Date(0, 0, 0, 8, 0), // 8:00 AM
      horaFin: new Date(0, 0, 0, 9, 0)     // 9:00 AM
    });

    // Set default days for weekly pattern (Monday to Friday)
    this.selectedDays.set([1, 2, 3, 4, 5]);
  }

  onPreview() {
    if (this.reservaForm.valid) {
      const request = this.buildRequest();
      const validationErrors: string[] = this.recurringService.validateRecurringReservation(request);
      
      if (validationErrors.length > 0) {
        validationErrors.forEach((error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: error
          });
        });
        return;
      }

      this.loadingPreview.set(true);
      this.recurringService.previewRecurringReservation(request).subscribe({
        next: (preview: RecurringReservationPreview) => {
          this.preview.set(preview);
          this.loadingPreview.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Vista Previa Generada',
            detail: `Se generarán ${preview.totalReservasAGenerar} reservas`
          });
        },
        error: (error: any) => {
          console.error('Error in preview:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al generar la vista previa'
          });
          this.loadingPreview.set(false);
        }
      });
    }
  }

  onCreate() {
    const previewData = this.preview();
    if (!previewData) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe generar una vista previa antes de crear la reserva recurrente'
      });
      return;
    }

    // Show confirmation if there are conflicts
    if (previewData.conflictos.length > 0) {
      this.confirmationService.confirm({
        message: `Se encontraron ${previewData.conflictos.length} conflictos. Las fechas en conflicto se omitirán. ¿Desea continuar?`,
        header: 'Conflictos Detectados',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, Continuar',
        rejectLabel: 'Cancelar',
        accept: () => this.createRecurringReservation()
      });
    } else {
      this.createRecurringReservation();
    }
  }

  private createRecurringReservation() {
    const request = this.buildRequest();
    
    this.creating.set(true);
    this.recurringService.createRecurringReservation(request).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Reserva recurrente creada exitosamente. Se generaron ${response.reservasGeneradas} reservas iniciales.`
        });
        this.creating.set(false);
        
        // Navigate to recurring reservations list
        setTimeout(() => {
          this.router.navigate(['/dashboard/reservas/recurrentes']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error creating recurring reservation:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al crear la reserva recurrente'
        });
        this.creating.set(false);
      }
    });
  }

  private buildRequest(): RecurringReservationRequest {
    const formValue = this.reservaForm.value;
    
    return {
      escenarioId: formValue.escenarioId,
      patron: formValue.patron,
      fechaInicio: this.formatDate(formValue.fechaInicio),
      fechaFin: this.formatDate(formValue.fechaFin),
      horaInicio: this.formatTime(formValue.horaInicio),
      horaFin: this.formatTime(formValue.horaFin),
      observaciones: formValue.observaciones || undefined,
      diasSemana: formValue.patron === PatronRecurrencia.SEMANAL ? this.selectedDays() : undefined,
      diaMes: formValue.patron === PatronRecurrencia.MENSUAL ? formValue.diaMes : undefined,
      intervaloRepeticion: formValue.intervaloRepeticion || 1,
      maxReservas: formValue.maxReservas || 52
    };
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatTime(time: Date): string {
    if (!time) return '';
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getIntervaloLabel(): string {
    const patron = this.selectedPatron();
    switch (patron) {
      case PatronRecurrencia.DIARIO:
        return 'días';
      case PatronRecurrencia.SEMANAL:
        return 'semanas';
      case PatronRecurrencia.MENSUAL:
        return 'meses';
      default:
        return 'unidades';
    }
  }
}
