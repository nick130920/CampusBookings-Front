import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

import { 
  RecurringReservationService, 
  RecurringReservationResponse,
  PATRON_RECURRENCIA_LABELS 
} from '../../../services/recurring-reservation.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-recurring-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DataViewModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    MenuModule,
    ConfirmDialogModule,
    DividerModule,
    ChipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="container mx-auto p-6">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-[#8F141B] mb-2">Mis Reservas Recurrentes</h1>
          <p class="text-gray-600">Gestione sus configuraciones de reservas automáticas</p>
        </div>
        
        <p-button 
          label="Nueva Reserva Recurrente"
          icon="pi pi-plus"
          routerLink="/reservas/recurrente"
          styleClass="p-button-success">
        </p-button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="text-center py-12">
          <p-progressSpinner [style]="{'width': '50px', 'height': '50px'}"></p-progressSpinner>
          <p class="mt-4 text-gray-600">Cargando reservas recurrentes...</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && reservations().length === 0) {
        <p-card>
          <div class="text-center py-12">
            <i class="pi pi-calendar text-6xl text-gray-300 mb-4 block"></i>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">No tienes reservas recurrentes</h3>
            <p class="text-gray-500 mb-6">Crea tu primera reserva recurrente para automatizar tus reservas.</p>
            <p-button 
              label="Crear Primera Reserva Recurrente"
              icon="pi pi-plus"
              routerLink="/reservas/recurrente"
              styleClass="p-button-success">
            </p-button>
          </div>
        </p-card>
      }

      <!-- Reservations List -->
      @if (!loading() && reservations().length > 0) {
        <p-dataView 
          [value]="reservations()" 
          layout="grid"
          [paginator]="true"
          [rows]="6"
          [rowsPerPageOptions]="[6, 12, 18]">
          
          <ng-template pTemplate="grid" let-reservation>
            <div class="col-12 md:col-6 lg:col-4 mb-4">
              <p-card 
                [style]="{'height': '100%', 'border': '1px solid #e5e7eb'}"
                styleClass="h-full">
                
                <!-- Header with status and actions -->
                <ng-template pTemplate="header">
                  <div class="flex justify-between items-start p-4 pb-2">
                    <div class="flex items-center gap-2">
                      <p-tag 
                        [value]="reservation.activa ? 'Activa' : 'Inactiva'"
                        [severity]="reservation.activa ? 'success' : 'warning'"
                        [rounded]="true">
                      </p-tag>
                      
                      @if (!reservation.puedeGenerarMas) {
                        <p-tag 
                          value="Completada"
                          severity="info"
                          [rounded]="true">
                        </p-tag>
                      }
                    </div>
                    
                    <p-menu 
                      #menu 
                      [model]="getMenuItems(reservation)" 
                      [popup]="true">
                    </p-menu>
                    <p-button 
                      icon="pi pi-ellipsis-v"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      (onClick)="menu.toggle($event)">
                    </p-button>
                  </div>
                </ng-template>

                <!-- Content -->
                <div class="space-y-4">
                  <!-- Escenario Info -->
                  <div>
                    <h3 class="font-semibold text-lg text-gray-800 mb-1">
                      {{ reservation.escenarioNombre }}
                    </h3>
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <i class="pi pi-map-marker"></i>
                      <span>ID: {{ reservation.escenarioId }}</span>
                    </div>
                  </div>

                  <!-- Pattern Description -->
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <i class="pi pi-refresh text-[#8F141B]"></i>
                      <span class="font-medium text-sm">{{ getPatronLabel(reservation.patron) }}</span>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      {{ reservation.descripcionCompleta }}
                    </p>
                  </div>

                  <!-- Progress Info -->
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div class="bg-blue-50 p-2 rounded">
                      <div class="text-lg font-bold text-blue-600">
                        {{ reservation.reservasGeneradas }}
                      </div>
                      <div class="text-xs text-blue-500">Generadas</div>
                    </div>
                    
                    <div class="bg-green-50 p-2 rounded">
                      <div class="text-lg font-bold text-green-600">
                        {{ reservation.maxReservas || '∞' }}
                      </div>
                      <div class="text-xs text-green-500">Máximo</div>
                    </div>
                  </div>

                  <!-- Next Dates -->
                  @if (reservation.proximasFechas && reservation.proximasFechas.length > 0) {
                    <div>
                      <h4 class="text-sm font-medium text-gray-700 mb-2">Próximas fechas:</h4>
                      <div class="space-y-1">
                        @for (fecha of reservation.proximasFechas.slice(0, 3); track fecha) {
                          <div class="flex items-center gap-2 text-xs">
                            <i class="pi pi-calendar text-gray-400"></i>
                            <span>{{ fecha | date:'dd/MM/yyyy' }}</span>
                          </div>
                        }
                        @if (reservation.proximasFechas.length > 3) {
                          <div class="text-xs text-gray-500">
                            ...y {{ reservation.proximasFechas.length - 3 }} más
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Observaciones -->
                  @if (reservation.observaciones) {
                    <div>
                      <h4 class="text-sm font-medium text-gray-700 mb-1">Observaciones:</h4>
                      <p class="text-xs text-gray-600">{{ reservation.observaciones }}</p>
                    </div>
                  }
                </div>

                <!-- Footer -->
                <ng-template pTemplate="footer">
                  <div class="flex justify-between items-center text-xs text-gray-500 pt-2">
                    <span>Creada: {{ reservation.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                    @if (reservation.proximaFechaGeneracion) {
                      <span>Próxima: {{ reservation.proximaFechaGeneracion | date:'dd/MM/yyyy' }}</span>
                    }
                  </div>
                </ng-template>
              </p-card>
            </div>
          </ng-template>

          <ng-template pTemplate="empty">
            <div class="text-center py-8">
              <p class="text-gray-500">No se encontraron reservas recurrentes</p>
            </div>
          </ng-template>
        </p-dataView>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card .p-card-header {
        background: linear-gradient(135deg, #8F141B 0%, #D4A574 100%);
        color: white;
        padding: 1rem;
      }

      .p-button.p-button-success {
        background: #8F141B;
        border-color: #8F141B;
      }

      .p-button.p-button-success:hover {
        background: #7A0F16;
        border-color: #7A0F16;
      }

      .p-dataview .p-dataview-content {
        padding: 0;
      }

      .p-tag.p-tag-success {
        background: #22c55e;
      }

      .p-tag.p-tag-warning {
        background: #f59e0b;
      }

      .p-tag.p-tag-info {
        background: #3b82f6;
      }
    }
  `]
})
export class RecurringReservationListComponent implements OnInit {
  private recurringService = inject(RecurringReservationService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Signals
  reservations = signal<RecurringReservationResponse[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadReservations();
  }

  private loadReservations() {
    this.loading.set(true);
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener información del usuario'
      });
      this.loading.set(false);
      return;
    }

    this.recurringService.getUserRecurringReservations(currentUser.id).subscribe({
      next: (reservations: RecurringReservationResponse[]) => {
        this.reservations.set(reservations);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading recurring reservations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las reservas recurrentes'
        });
        this.loading.set(false);
      }
    });
  }

  getMenuItems(reservation: RecurringReservationResponse): MenuItem[] {
    return [
      {
        label: 'Ver Detalles',
        icon: 'pi pi-eye',
        command: () => this.viewDetails(reservation)
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.editReservation(reservation),
        disabled: !reservation.activa
      },
      {
        separator: true
      },
      {
        label: reservation.activa ? 'Desactivar' : 'Activar',
        icon: reservation.activa ? 'pi pi-pause' : 'pi pi-play',
        command: () => reservation.activa ? 
          this.deactivateReservation(reservation) : 
          this.activateReservation(reservation)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.deleteReservation(reservation),
        styleClass: 'text-red-500'
      }
    ];
  }

  viewDetails(reservation: RecurringReservationResponse) {
    // Navigate to details view or show dialog
    console.log('View details for reservation:', reservation.id);
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: `Detalles de reserva recurrente ID: ${reservation.id}`
    });
  }

  editReservation(reservation: RecurringReservationResponse) {
    // Navigate to edit form
    console.log('Edit reservation:', reservation.id);
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Función de edición en desarrollo'
    });
  }

  deactivateReservation(reservation: RecurringReservationResponse) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea desactivar esta reserva recurrente? No se generarán más reservas automáticas.',
      header: 'Confirmar Desactivación',
      icon: 'pi pi-pause',
      acceptLabel: 'Sí, Desactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.recurringService.deactivateRecurringReservation(reservation.id).subscribe({
          next: (updated: RecurringReservationResponse) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Reserva recurrente desactivada exitosamente'
            });
            this.updateReservationInList(updated);
          },
          error: (error: any) => {
            console.error('Error deactivating reservation:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo desactivar la reserva recurrente'
            });
          }
        });
      }
    });
  }

  activateReservation(reservation: RecurringReservationResponse) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea activar esta reserva recurrente? Se reanudarán las reservas automáticas.',
      header: 'Confirmar Activación',
      icon: 'pi pi-play',
      acceptLabel: 'Sí, Activar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.recurringService.activateRecurringReservation(reservation.id).subscribe({
          next: (updated: RecurringReservationResponse) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Reserva recurrente activada exitosamente'
            });
            this.updateReservationInList(updated);
          },
          error: (error: any) => {
            console.error('Error activating reservation:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo activar la reserva recurrente'
            });
          }
        });
      }
    });
  }

  deleteReservation(reservation: RecurringReservationResponse) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar esta reserva recurrente? Esta acción no se puede deshacer.',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.recurringService.deleteRecurringReservation(reservation.id, false).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Reserva recurrente eliminada exitosamente'
            });
            this.removeReservationFromList(reservation.id);
          },
          error: (error: any) => {
            console.error('Error deleting reservation:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la reserva recurrente'
            });
          }
        });
      }
    });
  }

  private updateReservationInList(updated: RecurringReservationResponse) {
    const currentReservations = this.reservations();
    const index = currentReservations.findIndex(r => r.id === updated.id);
    if (index >= 0) {
      currentReservations[index] = updated;
      this.reservations.set([...currentReservations]);
    }
  }

  private removeReservationFromList(id: number) {
    const currentReservations = this.reservations();
    this.reservations.set(currentReservations.filter(r => r.id !== id));
  }

  getPatronLabel(patron: string): string {
    return PATRON_RECURRENCIA_LABELS[patron as keyof typeof PATRON_RECURRENCIA_LABELS] || patron;
  }
}
