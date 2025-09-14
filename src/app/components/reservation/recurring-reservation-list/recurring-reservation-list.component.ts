import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../../services/auth.service';
import {
  PATRON_RECURRENCIA_LABELS,
  RecurringReservationResponse,
  RecurringReservationService
} from '../../../services/recurring-reservation.service';

@Component({
  selector: 'app-recurring-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  templateUrl: './recurring-reservation-list.component.html',
  styles: []
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
