import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';

// Services
import { 
  AlertManagementService, 
  AlertaReserva, 
  TipoAlerta, 
  EstadoAlerta, 
  ConfigurarAlertaRequest,
  EstadisticasAlertas 
} from '../../../services/alert-management.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

// PrimeNG Services
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    ToolbarModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    MultiSelectModule,
    CheckboxModule,
    InputNumberModule,
    PanelModule,
    DividerModule,
    ChipModule,
    ProgressBarModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './alerts-management.component.html',
  styleUrl: './alerts-management.component.css'
})
export class AlertsManagementComponent implements OnInit {
  private readonly alertService = inject(AlertManagementService);
  private readonly toastService = inject(ToastService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  // Signals para estado del componente
  readonly alertas = signal<AlertaReserva[]>([]);
  readonly loading = signal<boolean>(false);
  readonly estadisticas = signal<EstadisticasAlertas | null>(null);
  readonly showConfigDialog = signal<boolean>(false);
  readonly showStatsPanel = signal<boolean>(true);

  // Computed values
  readonly alertasFiltradas = computed(() => {
    const alertas = this.alertas();
    if (!this.filtroEstado()) return alertas;
    return alertas.filter(alerta => alerta.estado === this.filtroEstado());
  });

  readonly tasaExito = computed(() => {
    const stats = this.estadisticas();
    if (!stats || stats.totalAlertas === 0) return 0;
    return Math.round((stats.alertasEnviadas / stats.totalAlertas) * 100);
  });

  // Estado del filtro
  readonly filtroEstado = signal<EstadoAlerta | null>(null);

  // Permisos del usuario
  readonly canManageAlerts = computed(() => {
    const user = this.authService.currentUser();
    const role = user?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'COORDINATOR';
  });

  // Formulario de configuración
  configForm: FormGroup;

  // Opciones para dropdowns
  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: EstadoAlerta.PENDIENTE },
    { label: 'Enviado', value: EstadoAlerta.ENVIADO },
    { label: 'Fallido', value: EstadoAlerta.FALLIDO },
    { label: 'Cancelado', value: EstadoAlerta.CANCELADO },
    { label: 'Programado', value: EstadoAlerta.PROGRAMADO }
  ];

  readonly tipoAlertaOptions = [
    { label: 'Recordatorio 24h', value: TipoAlerta.RECORDATORIO_24H },
    { label: 'Recordatorio 2h', value: TipoAlerta.RECORDATORIO_2H },
    { label: 'Recordatorio 30min', value: TipoAlerta.RECORDATORIO_30MIN },
    { label: 'Confirmación llegada', value: TipoAlerta.CONFIRMACION_LLEGADA },
    { label: 'Expiración reserva', value: TipoAlerta.EXPIRACION_RESERVA },
    { label: 'Cambio estado', value: TipoAlerta.CAMBIO_ESTADO },
    { label: 'Cancelación automática', value: TipoAlerta.CANCELACION_AUTOMATICA }
  ];

  readonly canalEnvioOptions = [
    { label: 'Email', value: 'EMAIL' },
    { label: 'WebSocket', value: 'WEBSOCKET' },
    { label: 'Push', value: 'PUSH' }
  ];

  // Enums para template
  readonly TipoAlerta = TipoAlerta;
  readonly EstadoAlerta = EstadoAlerta;

  constructor() {
    this.configForm = this.fb.group({
      tiposAlerta: [[], Validators.required],
      canalesEnvio: [['EMAIL'], Validators.required],
      mensajePersonalizado: [''],
      habilitarRecordatorios: [true],
      horasAnticipacion24h: [24, [Validators.min(1), Validators.max(48)]],
      horasAnticipacion2h: [2, [Validators.min(1), Validators.max(12)]],
      minutosAnticipacion30min: [30, [Validators.min(5), Validators.max(120)]],
      aplicarATodosLosEscenarios: [true]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    
    // Cargar alertas
    this.alertService.obtenerAlertas().subscribe({
      next: (response) => {
        this.alertas.set(response.content);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.showError('Error al cargar alertas');
        console.error('Error cargando alertas:', error);
      }
    });

    // Cargar estadísticas
    this.alertService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticas.set(stats);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  // Acciones de alertas
  enviarAlerta(alerta: AlertaReserva): void {
    if (!this.canManageAlerts()) {
      this.toastService.showError('No tienes permisos para enviar alertas. Contacta al administrador.');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro de enviar manualmente la alerta "${alerta.tipoDescripcion}"?`,
      header: 'Confirmar Envío',
      icon: 'pi pi-send',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.alertService.enviarAlerta(alerta.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Alerta enviada exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            if (error.status === 403) {
              this.toastService.showError('No tienes permisos para enviar alertas. Necesitas rol COORDINATOR o ADMIN.');
            } else {
              this.toastService.showError('Error al enviar alerta');
            }
            console.error('Error enviando alerta:', error);
          }
        });
      }
    });
  }

  cancelarAlerta(alerta: AlertaReserva): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de cancelar la alerta "${alerta.tipoDescripcion}"?`,
      header: 'Confirmar Cancelación',
      icon: 'pi pi-times',
      acceptLabel: 'Cancelar Alerta',
      rejectLabel: 'No',
      accept: () => {
        this.alertService.cancelarAlerta(alerta.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Alerta cancelada exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            this.toastService.showError('Error al cancelar alerta');
            console.error('Error cancelando alerta:', error);
          }
        });
      }
    });
  }

  reenviarAlerta(alerta: AlertaReserva): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de reenviar la alerta "${alerta.tipoDescripcion}"?`,
      header: 'Confirmar Reenvío',
      icon: 'pi pi-refresh',
      acceptLabel: 'Reenviar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.alertService.reenviarAlerta(alerta.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Alerta reenviada exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            this.toastService.showError('Error al reenviar alerta');
            console.error('Error reenviando alerta:', error);
          }
        });
      }
    });
  }

  // Acciones masivas
  procesarAlertasPendientes(): void {
    this.confirmationService.confirm({
      message: '¿Desea procesar todas las alertas pendientes ahora?',
      header: 'Procesar Alertas Pendientes',
      icon: 'pi pi-cog',
      acceptLabel: 'Procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.alertService.procesarAlertasPendientes().subscribe({
          next: () => {
            this.toastService.showSuccess('Alertas procesadas exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            this.toastService.showError('Error al procesar alertas');
            console.error('Error procesando alertas:', error);
          }
        });
      }
    });
  }

  limpiarAlertasVencidas(): void {
    this.confirmationService.confirm({
      message: '¿Desea limpiar todas las alertas vencidas?',
      header: 'Limpiar Alertas Vencidas',
      icon: 'pi pi-trash',
      acceptLabel: 'Limpiar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.alertService.limpiarAlertasVencidas().subscribe({
          next: () => {
            this.toastService.showSuccess('Alertas vencidas limpiadas exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            this.toastService.showError('Error al limpiar alertas');
            console.error('Error limpiando alertas:', error);
          }
        });
      }
    });
  }

  // Configuración de alertas
  mostrarConfiguracion(): void {
    this.showConfigDialog.set(true);
  }

  guardarConfiguracion(): void {
    if (this.configForm.valid) {
      const request: ConfigurarAlertaRequest = this.configForm.value;
      
      this.alertService.configurarAlertas(request).subscribe({
        next: () => {
          this.toastService.showSuccess('Configuración de alertas guardada exitosamente');
          this.showConfigDialog.set(false);
          this.cargarDatos();
        },
        error: (error) => {
          this.toastService.showError('Error al guardar configuración');
          console.error('Error guardando configuración:', error);
        }
      });
    } else {
      this.toastService.showError('Verifique que todos los campos requeridos estén completos');
    }
  }

  // Utilidades
  puedeEnviar(alerta: AlertaReserva): boolean {
    return alerta.estado === EstadoAlerta.PENDIENTE || alerta.estado === EstadoAlerta.PROGRAMADO;
  }

  puedeCancelar(alerta: AlertaReserva): boolean {
    return alerta.estado === EstadoAlerta.PENDIENTE || alerta.estado === EstadoAlerta.PROGRAMADO;
  }

  puedeReenviar(alerta: AlertaReserva): boolean {
    return alerta.estado === EstadoAlerta.FALLIDO;
  }

  getAlertIcon(tipo: TipoAlerta): string {
    return this.alertService.getAlertIcon(tipo);
  }

  getEstadoSeverity(estado: EstadoAlerta): string {
    return this.alertService.getEstadoSeverity(estado);
  }

  getTipoColor(tipo: TipoAlerta): string {
    return this.alertService.getTipoColor(tipo);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onFiltroEstadoChange(estado: EstadoAlerta | null): void {
    this.filtroEstado.set(estado);
  }

  toggleStatsPanel(): void {
    this.showStatsPanel.set(!this.showStatsPanel());
  }
}
