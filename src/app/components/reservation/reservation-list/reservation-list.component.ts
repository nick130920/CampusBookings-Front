import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';

// Services
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { AuthService, User } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface ReservationFilter {
  estado?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  escenario?: string;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    // PrimeNG Components
    ButtonModule,
    CardModule,
    ChipModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TabsModule,
    DialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnInit {
  // Data
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  currentUser: User | null = null;
  isAdmin = false;
  
  // Admin data
  allReservations: Reservation[] = [];
  myReservations: Reservation[] = [];
  activeTab: 'my' | 'all' = 'my';
  
  // Loading states
  isLoading = true;
  isRefreshing = false;
  
  // Detail view
  showDetailDialog = false;
  selectedReservation: Reservation | null = null;
  
  // Rejection dialog
  showRejectDialog = false;
  rejectionReason = '';
  
  // Filters
  filters: ReservationFilter = {};
  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada', value: 'APROBADA' },
    { label: 'Rechazada', value: 'RECHAZADA' },
    { label: 'Cancelada', value: 'CANCELADA' }
  ];
  
  // Table configuration
  columns = [
    { field: 'escenarioNombre', header: 'Escenario' },
    { field: 'fechaInicio', header: 'Fecha y Hora' },
    { field: 'estadoNombre', header: 'Estado' },
    { field: 'fechaCreacion', header: 'Creada' },
    { field: 'actions', header: 'Acciones' }
  ];

  // Columnas adicionales para administradores
  adminColumns = [
    { field: 'usuarioNombre', header: 'Usuario' },
    { field: 'escenarioNombre', header: 'Escenario' },
    { field: 'fechaInicio', header: 'Fecha y Hora' },
    { field: 'estadoNombre', header: 'Estado' },
    { field: 'fechaCreacion', header: 'Creada' },
    { field: 'adminActions', header: 'Acciones Admin' }
  ];

  get displayColumns() {
    return this.isAdmin ? this.adminColumns : this.columns;
  }

  // Injected services
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    
    // Si es admin, iniciar en "Todas las Reservas"
    if (this.isAdmin) {
      this.activeTab = 'all';
    }
    
    this.loadReservations();
    this.checkForSuccessMessage();
  }

  private checkForSuccessMessage(): void {
    this.route.queryParams.subscribe(params => {
      if (params['created']) {
        this.toastService.showSuccess('Reserva creada exitosamente');
        // Limpiar el parámetro de la URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  loadReservations(): void {
    this.isLoading = true;
    
    if (this.isAdmin) {
      // Administradores cargan ambas listas
      this.loadAdminReservations();
    } else {
      // Usuarios regulares solo ven sus propias reservas
      this.loadUserReservations();
    }
  }

  private loadAdminReservations(): void {
    if (!this.currentUser?.id) {
      this.toastService.showError('Usuario no encontrado');
      this.isLoading = false;
      return;
    }

    // Cargar todas las reservas Y las reservas propias en paralelo
    const allReservations$ = this.reservationService.getAllReservations();
    const myReservations$ = this.reservationService.getUserReservations(this.currentUser.id);

    // Usar forkJoin para cargar ambas listas al mismo tiempo
    forkJoin([allReservations$, myReservations$]).subscribe({
      next: ([allReservations, myReservations]) => {
        this.allReservations = allReservations;
        this.myReservations = myReservations;
        
        // Mostrar la pestaña activa
        this.updateActiveReservations();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin reservations:', error);
        this.toastService.showError('Error al cargar las reservas');
        this.isLoading = false;
      }
    });
  }

  private loadUserReservations(): void {
    if (!this.currentUser?.id) {
      this.toastService.showError('Usuario no encontrado');
      this.isLoading = false;
      return;
    }

    this.reservationService.getUserReservations(this.currentUser.id).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.filteredReservations = [...reservations];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user reservations:', error);
        this.toastService.showError('Error al cargar las reservas');
        this.isLoading = false;
      }
    });
  }

  private updateActiveReservations(): void {
    if (this.isAdmin) {
      this.reservations = this.activeTab === 'my' ? this.myReservations : this.allReservations;
    }
    this.filteredReservations = [...this.reservations];
    this.applyFilters();
  }

  refreshReservations(): void {
    this.isRefreshing = true;
    if (!this.currentUser?.id) return;

    this.reservationService.getUserReservations(this.currentUser.id).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.applyFilters();
        this.isRefreshing = false;
        this.toastService.showSuccess('Lista actualizada');
      },
      error: (error) => {
        console.error('Error refreshing reservations:', error);
        this.toastService.showError('Error al actualizar las reservas');
        this.isRefreshing = false;
      }
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      // Filtro por estado
      if (this.filters.estado && reservation.estadoNombre !== this.filters.estado) {
        return false;
      }

      // Filtro por fecha desde
      if (this.filters.fechaDesde) {
        const reservationDate = new Date(reservation.fechaInicio);
        if (reservationDate < this.filters.fechaDesde) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (this.filters.fechaHasta) {
        const reservationDate = new Date(reservation.fechaInicio);
        const fechaHasta = new Date(this.filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // Final del día
        if (reservationDate > fechaHasta) {
          return false;
        }
      }

      // Filtro por escenario (texto)
      if (this.filters.escenario) {
        const searchTerm = this.filters.escenario.toLowerCase();
        const escenarioNombre = reservation.escenarioNombre?.toLowerCase() || '';
        if (!escenarioNombre.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  clearFilters(): void {
    this.filters = {};
    this.filteredReservations = [...this.reservations];
  }

  onCancelReservation(reservation: Reservation): void {
    if (!reservation.id) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de que desea cancelar la reserva del ${this.formatDate(reservation.fechaInicio)}?`,
      header: 'Confirmar Cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Confirmar Cancelación',
      rejectLabel: 'Regresar',
      accept: () => {
        if (reservation.id) {
          this.reservationService.cancelReservation(reservation.id).subscribe({
            next: (updatedReservation) => {
              // Actualizar la reserva en la lista
              const index = this.reservations.findIndex(r => r.id === updatedReservation.id);
              if (index !== -1) {
                this.reservations[index] = updatedReservation;
                this.applyFilters();
              }
              this.toastService.showSuccess('Reserva cancelada exitosamente');
            },
            error: (error) => {
              console.error('Error canceling reservation:', error);
              this.toastService.showError(
                error.error?.message || 'Error al cancelar la reserva'
              );
            }
          });
        }
      }
    });
  }

  onCreateNewReservation(): void {
    this.router.navigate(['/dashboard/reservas/nueva']);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status?.toUpperCase()) {
      case 'APROBADA':
        return 'success';
      case 'PENDIENTE':
        return 'info';
      case 'RECHAZADA':
        return 'danger';
      case 'CANCELADA':
        return 'warning';
      default:
        return 'info';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APROBADA':
        return 'pi pi-check-circle';
      case 'PENDIENTE':
        return 'pi pi-clock';
      case 'RECHAZADA':
        return 'pi pi-times-circle';
      case 'CANCELADA':
        return 'pi pi-ban';
      default:
        return 'pi pi-info-circle';
    }
  }

  canCancelReservation(reservation: Reservation): boolean {
    if (!reservation.estadoNombre) return false;
    
    const status = reservation.estadoNombre.toUpperCase();
    const isNotCancelableStatus = ['CANCELADA', 'RECHAZADA'].includes(status);
    
    if (isNotCancelableStatus) return false;

    // Verificar si la reserva no ha pasado
    const reservationDate = new Date(reservation.fechaInicio);
    const now = new Date();
    
    return reservationDate > now;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeRange(startDate: string, endDate: string): string {
    return `${this.formatTime(startDate)} - ${this.formatTime(endDate)}`;
  }

  formatCreatedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  getDurationInMinutes(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}min`;
      }
    }
  }

  get hasFilters(): boolean {
    return !!(this.filters.estado || 
             this.filters.fechaDesde || 
             this.filters.fechaHasta || 
             this.filters.escenario);
  }

  get filteredCount(): number {
    return this.filteredReservations.length;
  }

  get totalCount(): number {
    return this.reservations.length;
  }

  // ==================== MÉTODOS ADMINISTRATIVOS ====================

  /**
   * Aprobar una reserva (solo administradores)
   */
  approveReservation(reservation: Reservation): void {
    if (!this.isAdmin) {
      this.toastService.showError('No tienes permisos para aprobar reservas');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas aprobar la reserva de ${reservation.usuarioNombre || 'este usuario'} para "${reservation.escenarioNombre}"?`,
      header: 'Confirmar Aprobación',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Aprobar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.reservationService.approveReservation(reservation.id).subscribe({
          next: (updatedReservation) => {
            this.toastService.showSuccess('Reserva aprobada exitosamente');
            this.loadReservations(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error approving reservation:', error);
            this.toastService.showError('Error al aprobar la reserva');
          }
        });
      }
    });
  }

  /**
   * Rechazar una reserva (solo administradores)
   */
  rejectReservation(reservation: Reservation): void {
    if (!this.isAdmin) {
      this.toastService.showError('No tienes permisos para rechazar reservas');
      return;
    }

    // Preparar el diálogo de rechazo
    this.selectedReservation = reservation;
    this.rejectionReason = '';
    this.showRejectDialog = true;
  }

  /**
   * Confirmar rechazo con motivo
   */
  confirmRejectReservation(): void {
    if (!this.selectedReservation) return;

    if (!this.rejectionReason.trim()) {
      this.toastService.showError('Por favor, especifica el motivo del rechazo');
      return;
    }

    // Llamar al servicio con el motivo
    this.reservationService.rejectReservationWithReason(this.selectedReservation.id, this.rejectionReason.trim()).subscribe({
      next: (updatedReservation) => {
        this.toastService.showSuccess('Reserva rechazada exitosamente');
        this.loadReservations(); // Recargar la lista
        this.closeRejectDialog();
      },
      error: (error) => {
        console.error('Error rejecting reservation:', error);
        this.toastService.showError('Error al rechazar la reserva');
      }
    });
  }

  /**
   * Cerrar diálogo de rechazo
   */
  closeRejectDialog(): void {
    this.showRejectDialog = false;
    this.selectedReservation = null;
    this.rejectionReason = '';
  }

  /**
   * Verificar si una reserva puede ser aprobada
   */
  canApprove(reservation: Reservation): boolean {
    return this.isAdmin && reservation.estadoNombre === 'PENDIENTE';
  }

  /**
   * Verificar si una reserva puede ser rechazada
   */
  canReject(reservation: Reservation): boolean {
    return this.isAdmin && reservation.estadoNombre === 'PENDIENTE';
  }

  /**
   * Obtener el nombre completo del usuario de una reserva
   */
  getUserDisplayName(reservation: Reservation): string {
    if (reservation.usuarioNombre && reservation.usuarioApellido) {
      return `${reservation.usuarioNombre} ${reservation.usuarioApellido}`;
    } else if (reservation.usuarioNombre) {
      return reservation.usuarioNombre;
    } else if (reservation.usuarioEmail) {
      return reservation.usuarioEmail;
    }
    return 'Usuario desconocido';
  }

  // ==================== MÉTODOS DE PESTAÑAS ====================

  /**
   * Cambiar entre pestañas de admin
   */
  onTabChange(event: any): void {
    this.activeTab = event.value === '0' ? 'my' : 'all';
    this.updateActiveReservations();
  }

  /**
   * Obtener el título dinámico según la pestaña activa
   */
  getPageTitle(): string {
    if (!this.isAdmin) {
      return 'Mis Reservas';
    }
    return this.activeTab === 'my' ? 'Mis Reservas' : 'Gestión de Reservas';
  }

  /**
   * Obtener la descripción dinámica según la pestaña activa
   */
  getPageDescription(): string {
    if (!this.isAdmin) {
      return 'Gestiona y consulta todas tus reservas de espacios';
    }
    return this.activeTab === 'my' 
      ? 'Gestiona y consulta tus reservas personales'
      : 'Administra todas las reservas del sistema';
  }

  // ==================== MÉTODOS DE VISTA DETALLE ====================

  /**
   * Mostrar detalle de una reserva
   */
  showReservationDetail(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.showDetailDialog = true;
  }

  /**
   * Cerrar diálogo de detalle
   */
  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedReservation = null;
  }

  /**
   * Verificar si es una reserva propia en modo admin
   */
  isMyReservation(reservation: Reservation): boolean {
    return reservation.usuarioId === this.currentUser?.id;
  }
}