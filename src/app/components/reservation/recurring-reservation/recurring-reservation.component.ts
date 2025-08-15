import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { DataViewModule } from 'primeng/dataview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { 
  RecurringReservationService, 
  RecurringReservationRequest, 
  RecurringReservationPreview,
  PatronRecurrencia,
  PATRON_RECURRENCIA_LABELS,
  DIAS_SEMANA 
} from '../../../services/recurring-reservation.service';
import { ScenarioService, Scenario } from '../../../services/scenario.service';
import { AuthService } from '../../../services/auth.service';

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
  template: `
    <div class="container mx-auto p-6 max-w-4xl">
      <p-toast></p-toast>
      
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#8F141B] mb-2">Reservas Recurrentes</h1>
        <p class="text-gray-600">Configure reservas que se repiten automáticamente según un patrón específico</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Formulario de Configuración -->
        <div class="space-y-6">
          <p-card header="Configuración de Reserva Recurrente" 
                  [style]="{'border': '1px solid #8F141B20'}">
            <form [formGroup]="reservaForm" (ngSubmit)="onPreview()" class="space-y-4">
              
              <!-- Escenario -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Escenario <span class="text-red-500">*</span>
                </label>
                <p-select 
                  formControlName="escenarioId"
                  [options]="scenarios()"
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione un escenario"
                  [loading]="loadingScenarios()"
                  class="w-full"
                  [style]="{'width': '100%'}"
                  appendTo="body">
                  <ng-template pTemplate="selectedItem" let-selectedOption>
                    <div class="flex items-center gap-2" *ngIf="selectedOption">
                      <span class="font-medium">{{ selectedOption.nombre }}</span>
                      <span class="text-xs text-gray-500">{{ selectedOption.tipo }}</span>
                    </div>
                  </ng-template>
                  <ng-template pTemplate="item" let-scenario>
                    <div class="flex flex-col gap-1 p-2">
                      <span class="font-medium">{{ scenario.nombre }}</span>
                      <div class="flex gap-2 text-xs text-gray-500">
                        <span>{{ scenario.tipo }}</span>
                        <span>•</span>
                        <span>{{ scenario.ubicacion }}</span>
                        <span>•</span>
                        <span>Capacidad: {{ scenario.capacidad }}</span>
                      </div>
                    </div>
                  </ng-template>
                </p-select>
              </div>

              <!-- Patrón de Recurrencia -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Patrón de Recurrencia <span class="text-red-500">*</span>
                </label>
                <p-select 
                  formControlName="patron"
                  [options]="patronOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione el patrón de repetición"
                  class="w-full"
                  [style]="{'width': '100%'}"
                  appendTo="body">
                </p-select>
              </div>

              <!-- Configuración específica del patrón -->
              @if (selectedPatron() === 'SEMANAL') {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Días de la Semana <span class="text-red-500">*</span>
                  </label>
                  <div class="grid grid-cols-7 gap-2">
                    @for (dia of DIAS_SEMANA; track dia.value) {
                      <div class="flex items-center">
                        <p-checkbox 
                          [value]="dia.value"
                          [(ngModel)]="selectedDays"
                          [ngModelOptions]="{standalone: true}"
                          [inputId]="'dia-' + dia.value"
                          class="text-center">
                        </p-checkbox>
                        <label [for]="'dia-' + dia.value" class="ml-1 text-xs font-medium cursor-pointer">
                          {{ dia.abrev }}
                        </label>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (selectedPatron() === 'MENSUAL') {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Día del Mes <span class="text-red-500">*</span>
                  </label>
                  <p-inputNumber 
                    formControlName="diaMes"
                    [min]="1"
                    [max]="31"
                    placeholder="Día del mes (1-31)"
                    class="w-full">
                  </p-inputNumber>
                </div>
              }

              <!-- Intervalo de Repetición -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo de Repetición
                </label>
                <p-inputNumber 
                  formControlName="intervaloRepeticion"
                  [min]="1"
                  [max]="52"
                  placeholder="Cada X {{ getIntervaloLabel() }}"
                  class="w-full">
                </p-inputNumber>
                <small class="text-gray-500">
                  Repetir cada {{ reservaForm.get('intervaloRepeticion')?.value || 1 }} {{ getIntervaloLabel() }}
                </small>
              </div>

              <!-- Rango de Fechas -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio <span class="text-red-500">*</span>
                  </label>
                  <p-datepicker 
                    formControlName="fechaInicio"
                    [minDate]="minDate"
                    [maxDate]="maxDate"
                    placeholder="dd/mm/yyyy"
                    dateFormat="dd/mm/yy"
                    [showIcon]="true"
                    inputId="fechaInicio"
                    class="w-full"
                    appendTo="body">
                  </p-datepicker>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin <span class="text-red-500">*</span>
                  </label>
                  <p-datepicker 
                    formControlName="fechaFin"
                    [minDate]="minDateFin()"
                    [maxDate]="maxDate"
                    placeholder="dd/mm/yyyy"
                    dateFormat="dd/mm/yy"
                    [showIcon]="true"
                    inputId="fechaFin"
                    class="w-full"
                    appendTo="body">
                  </p-datepicker>
                </div>
              </div>

              <!-- Horarios -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio <span class="text-red-500">*</span>
                  </label>
                  <p-datepicker 
                    formControlName="horaInicio"
                    [timeOnly]="true"
                    placeholder="HH:MM"
                    [showIcon]="true"
                    inputId="horaInicio"
                    class="w-full"
                    appendTo="body">
                  </p-datepicker>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin <span class="text-red-500">*</span>
                  </label>
                  <p-datepicker 
                    formControlName="horaFin"
                    [timeOnly]="true"
                    placeholder="HH:MM"
                    [showIcon]="true"
                    inputId="horaFin"
                    class="w-full"
                    appendTo="body">
                  </p-datepicker>
                </div>
              </div>

              <!-- Límite de Reservas -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Límite Máximo de Reservas
                </label>
                <p-inputNumber 
                  formControlName="maxReservas"
                  [min]="1"
                  [max]="365"
                  placeholder="Máximo de reservas a generar"
                  class="w-full">
                </p-inputNumber>
                <small class="text-gray-500">
                  Opcional. Por defecto se generarán hasta 52 reservas.
                </small>
              </div>

              <!-- Observaciones -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <p-textarea 
                  formControlName="observaciones"
                  placeholder="Observaciones adicionales..."
                  rows="3"
                  class="w-full">
                </p-textarea>
              </div>

              <!-- Botones -->
              <div class="flex gap-3 pt-4">
                <p-button 
                  label="Previsualizar"
                  icon="pi pi-eye"
                  [loading]="loadingPreview()"
                  type="submit"
                  [disabled]="!reservaForm.valid"
                  styleClass="p-button-outlined">
                </p-button>
                
                <p-button 
                  label="Crear Reserva Recurrente"
                  icon="pi pi-plus"
                  [loading]="creating()"
                  [disabled]="!preview() || !reservaForm.valid"
                  (onClick)="onCreate()"
                  styleClass="p-button-success">
                </p-button>
              </div>
            </form>
          </p-card>
        </div>

        <!-- Vista Previa -->
        <div class="space-y-6">
          @if (preview(); as previewData) {
            <p-card header="Vista Previa de Reservas" 
                    [style]="{'border': '1px solid #D4A574'}">
              
              <!-- Resumen -->
              <div class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-calendar text-[#D4A574]"></i>
                  <span class="font-medium">{{ previewData.descripcionPatron }}</span>
                </div>
                <div class="text-sm text-gray-600">
                  <p>Total de reservas a generar: <span class="font-medium">{{ previewData.totalReservasAGenerar }}</span></p>
                </div>
              </div>

              <!-- Conflictos y Advertencias -->
              @if (previewData.conflictos.length > 0) {
                <div class="mb-4">
                  <p-panel header="Conflictos Encontrados" [toggleable]="true" [collapsed]="false">
                    <div class="space-y-2">
                      @for (conflicto of previewData.conflictos; track $index) {
                        <div class="flex items-center gap-2 text-sm">
                          <i class="pi pi-exclamation-triangle text-red-500"></i>
                          <span>{{ conflicto }}</span>
                        </div>
                      }
                    </div>
                  </p-panel>
                </div>
              }

              @if (previewData.advertencias.length > 0) {
                <div class="mb-4">
                  <p-panel header="Advertencias" [toggleable]="true" [collapsed]="true">
                    <div class="space-y-2">
                      @for (advertencia of previewData.advertencias; track $index) {
                        <div class="flex items-center gap-2 text-sm">
                          <i class="pi pi-info-circle text-orange-500"></i>
                          <span>{{ advertencia }}</span>
                        </div>
                      }
                    </div>
                  </p-panel>
                </div>
              }

              <!-- Lista de Fechas -->
              <div>
                <h4 class="font-medium mb-3">Fechas de Reservas (Primeras 10)</h4>
                <div class="space-y-2 max-h-96 overflow-y-auto">
                  @for (fecha of previewData.fechasReservas.slice(0, 10); track fecha.fecha) {
                    <div class="flex items-center justify-between p-2 border rounded-md"
                         [class.border-red-200]="fecha.tieneConflicto"
                         [class.bg-red-50]="fecha.tieneConflicto"
                         [class.border-gray-200]="!fecha.tieneConflicto">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{ fecha.fecha | date:'dd/MM/yyyy' }}</span>
                        <span class="text-xs text-gray-500">{{ fecha.diaSemana }}</span>
                      </div>
                      @if (fecha.tieneConflicto) {
                        <p-tag severity="danger" value="Conflicto" [rounded]="true"></p-tag>
                      } @else {
                        <p-tag severity="success" value="Disponible" [rounded]="true"></p-tag>
                      }
                    </div>
                  }
                  
                  @if (previewData.fechasReservas.length > 10) {
                    <div class="text-center text-sm text-gray-500 pt-2">
                      ... y {{ previewData.fechasReservas.length - 10 }} fechas más
                    </div>
                  }
                </div>
              </div>
            </p-card>
          }

          @if (!preview() && !loadingPreview()) {
            <p-card [style]="{'border': '1px solid #e5e7eb'}">
              <div class="text-center text-gray-500 py-8">
                <i class="pi pi-calendar text-4xl mb-4 block"></i>
                <p>Complete el formulario y haga clic en "Previsualizar" para ver las fechas que se generarán</p>
              </div>
            </p-card>
          }

          @if (loadingPreview()) {
            <p-card>
              <div class="text-center py-8">
                <p-progressSpinner [style]="{'width': '50px', 'height': '50px'}"></p-progressSpinner>
                <p class="mt-4 text-gray-600">Generando vista previa...</p>
              </div>
            </p-card>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card .p-card-header {
        background: linear-gradient(135deg, #8F141B 0%, #D4A574 100%);
        color: white;
        font-weight: 600;
      }

      .p-button.p-button-success {
        background: #8F141B;
        border-color: #8F141B;
      }

      .p-button.p-button-success:hover {
        background: #7A0F16;
        border-color: #7A0F16;
      }

      .p-checkbox .p-checkbox-box.p-highlight {
        background: #8F141B;
        border-color: #8F141B;
      }

      .p-dropdown.p-dropdown-open .p-dropdown-label,
      .p-dropdown:not(.p-disabled).p-focus .p-dropdown-label {
        border-color: #8F141B;
      }

      .p-calendar.p-focus .p-inputtext {
        border-color: #8F141B;
      }

      .p-inputnumber.p-focus .p-inputtext {
        border-color: #8F141B;
      }

      .p-inputtextarea.p-focus {
        border-color: #8F141B;
      }
    }
  `]
})
export class RecurringReservationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recurringService = inject(RecurringReservationService);
  private scenarioService = inject(ScenarioService);
  private authService = inject(AuthService);
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
        
        // Navigate to reservations list or dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
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
