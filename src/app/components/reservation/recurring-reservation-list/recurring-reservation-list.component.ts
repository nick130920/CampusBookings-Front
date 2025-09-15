import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../../services/auth.service';
import {
  PATRON_RECURRENCIA_LABELS,
  RecurringReservationResponse,
  RecurringReservationService,
  RecurringReservationUpdateRequest
} from '../../../services/recurring-reservation.service';

@Component({
  selector: 'app-recurring-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DataViewModule,
    DatePickerModule,
    DialogModule,
    FloatLabelModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TextareaModule,
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
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Estilos para el DataView */
    :host ::ng-deep .p-dataview {
      border: none;
      background: transparent;
    }

    :host ::ng-deep .p-dataview .p-dataview-content {
      background: transparent;
      border: none;
      padding: 0;
    }

    :host ::ng-deep .p-paginator {
      border: none;
      background: transparent;
      border-top: 1px solid #e5e7eb;
      margin-top: 1rem;
      padding: 1rem 1.5rem;
    }

    :host ::ng-deep .p-paginator .p-paginator-first,
    :host ::ng-deep .p-paginator .p-paginator-prev,
    :host ::ng-deep .p-paginator .p-paginator-next,
    :host ::ng-deep .p-paginator .p-paginator-last {
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      margin: 0 0.125rem;
    }

    :host ::ng-deep .p-paginator .p-paginator-page {
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      margin: 0 0.125rem;
    }

    :host ::ng-deep .p-paginator .p-paginator-page.p-highlight {
      background-color: #8F141B;
      border-color: #8F141B;
      color: white;
    }
  `]
})
export class RecurringReservationListComponent implements OnInit {
  private recurringService = inject(RecurringReservationService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // Signals
  reservations = signal<RecurringReservationResponse[]>([]);
  loading = signal(false);
  
  // Menu global
  @ViewChild('globalMenu') globalMenu!: Menu;
  currentMenuItems: MenuItem[] = [];
  currentReservation: RecurringReservationResponse | null = null;
  
  // Modales
  showDetailsModal = signal(false);
  showEditModal = signal(false);
  selectedReservation = signal<RecurringReservationResponse | null>(null);
  
  // Formulario de edición
  editForm!: FormGroup;
  saving = signal(false);

  ngOnInit() {
    this.initializeEditForm();
    this.loadReservations();
  }
  
  private initializeEditForm() {
    this.editForm = this.fb.group({
      fechaFin: ['', [Validators.required]],
      maxReservas: [null],
      observaciones: ['']
    });
  }

  showMenu(event: any, reservation: RecurringReservationResponse) {
    this.currentReservation = reservation;
    this.currentMenuItems = this.getMenuItems(reservation);
    this.globalMenu.toggle(event);
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
    this.selectedReservation.set(reservation);
    this.showDetailsModal.set(true);
  }

  editReservation(reservation: RecurringReservationResponse) {
    this.selectedReservation.set(reservation);
    
    // Poblar el formulario con los datos actuales
    this.editForm.patchValue({
      fechaFin: new Date(reservation.fechaFin),
      maxReservas: reservation.maxReservas,
      observaciones: reservation.observaciones || ''
    });
    
    this.showEditModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedReservation.set(null);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedReservation.set(null);
    this.editForm.reset();
    this.saving.set(false);
  }

  saveChanges() {
    if (this.editForm.invalid || !this.selectedReservation()) {
      return;
    }

    this.saving.set(true);
    const reservation = this.selectedReservation()!;
    const formValue = this.editForm.value;

    // Crear el request de actualización
    const updateRequest: RecurringReservationUpdateRequest = {
      fechaFin: formValue.fechaFin.toISOString().split('T')[0], // Formato YYYY-MM-DD
      maxReservas: formValue.maxReservas,
      observaciones: formValue.observaciones
    };

    this.recurringService.updateRecurringReservation(reservation.id, updateRequest).subscribe({
      next: (updatedReservation) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Reserva recurrente actualizada correctamente'
        });
        
        // Actualizar la lista local
        this.loadReservations();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating recurring reservation:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al actualizar la reserva recurrente'
        });
        this.saving.set(false);
      }
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

  getMinDate(): Date {
    const reservation = this.selectedReservation();
    if (reservation) {
      return new Date(reservation.fechaInicio);
    }
    return new Date();
  }
}
