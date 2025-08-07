import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

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
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';

// Services
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { AuthService, User } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { SidebarService } from '../../../services/sidebar.service';

// Utils
import { formatRelativeDate } from '../../../utils/date.utils';

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
    DialogModule,
    SelectButtonModule
  ],
  providers: [ConfirmationService],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnInit, OnDestroy {
  // Data
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  currentUser: User | null = null;
  isAdmin = false;
  
  // Admin data
  allReservations: Reservation[] = [];
  myReservations: Reservation[] = [];
  private _activeTabValue: string = 'my';
  
  get activeTabValue(): string {
    return this._activeTabValue;
  }
  
  set activeTabValue(value: string) {
    if (this._activeTabValue !== value) {
      console.log('🔍 DEBUG: activeTabValue changed from', this._activeTabValue, 'to', value);
      this._activeTabValue = value;
      // Solo actualizar si ya tenemos datos cargados
      if (this.isAdmin && (this.allReservations.length > 0 || this.myReservations.length > 0)) {
        this.updateActiveReservations();
      }
    }
  }
  
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

  // Sidebar state
  sidebarCollapsed = false;
  private sidebarSubscription?: Subscription;

  // Injected services
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    
    console.log('🔍 DEBUG: ngOnInit - currentUser:', this.currentUser);
    console.log('🔍 DEBUG: ngOnInit - isAdmin:', this.isAdmin);
    
    // Suscribirse al estado del sidebar
    this.sidebarSubscription = this.sidebarService.sidebarCollapsed$.subscribe(collapsed => {
      this.sidebarCollapsed = collapsed;
    });
    
    // Si es admin, iniciar en "Mis Reservas" por defecto
    if (this.isAdmin) {
      this._activeTabValue = 'my'; // 'my' = Mis Reservas, 'all' = Todas las Reservas
      console.log('🔍 DEBUG: ngOnInit - activeTabValue inicial para admin:', this.activeTabValue);
    }
    
    this.loadReservations();
    this.checkForSuccessMessage();
    
    // Prueba temporal del cálculo de fechas
    this.testDateCalculation();
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
      this.isRefreshing = false;
      return;
    }

    console.log('🔍 DEBUG: Cargando reservas para admin con ID:', this.currentUser.id);

    // Cargar todas las reservas Y las reservas propias en paralelo
    const allReservations$ = this.reservationService.getAllReservations();
    const myReservations$ = this.reservationService.getUserReservations(this.currentUser.id);

    // Usar forkJoin para cargar ambas listas al mismo tiempo
    forkJoin([allReservations$, myReservations$]).subscribe({
      next: ([allReservations, myReservations]) => {
        console.log('🔍 DEBUG: Todas las reservas recibidas:', allReservations.length);
        console.log('🔍 DEBUG: Mis reservas recibidas:', myReservations.length);
        console.log('🔍 DEBUG: Tab activo:', this.activeTabValue);
        
        this.allReservations = allReservations;
        this.myReservations = myReservations;
        
        // Log de las primeras reservas para verificar datos
        if (myReservations.length > 0) {
          console.log('🔍 DEBUG: Primera reserva mía:', {
            id: myReservations[0].id,
            usuarioId: myReservations[0].usuarioId,
            escenario: myReservations[0].escenarioNombre
          });
        }
        
        // Mostrar la pestaña activa
        this.updateActiveReservations();
        
        // Solo mostrar mensaje de éxito si es un refresh manual
        const wasRefreshing = this.isRefreshing;
        this.isLoading = false;
        this.isRefreshing = false;
        
        if (wasRefreshing) {
          this.toastService.showSuccess('Lista actualizada');
        }
      },
      error: (error) => {
        console.error('Error loading admin reservations:', error);
        this.toastService.showError('Error al cargar las reservas');
        this.isLoading = false;
        this.isRefreshing = false;
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
      this.reservations = this.activeTabValue === 'my' ? this.myReservations : this.allReservations;
    }
    this.filteredReservations = [...this.reservations];
    this.applyFilters();
  }

  refreshReservations(): void {
    this.isRefreshing = true;
    
    if (this.isAdmin) {
      // Administradores refrescan ambas listas
      this.loadAdminReservations();
    } else {
      // Usuarios regulares solo sus propias reservas
      if (!this.currentUser?.id) {
        this.isRefreshing = false;
        return;
      }

      this.reservationService.getUserReservations(this.currentUser.id).subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.filteredReservations = [...reservations];
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
              this.updateReservationInLists(updatedReservation);
              
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
    return formatRelativeDate(dateString);
  }

  // Método temporal para verificar el cálculo de fechas
  testDateCalculation(): void {
    const testCases = [
      '2025-08-04T20:57:38.521106', // Caso del usuario
      '2025-08-05T10:00:00',        // Ayer
      '2025-08-06T15:30:00',        // Hoy
      '2025-08-01T08:00:00',        // Hace 5 días
      '2025-07-20T12:00:00'         // Hace más de una semana
    ];

    console.log('=== PRUEBA DE CÁLCULO DE FECHAS ===');
    console.log('Fecha actual:', new Date().toISOString());
    testCases.forEach(testDate => {
      const result = this.formatCreatedDate(testDate);
      console.log(`${testDate} → "${result}"`);
    });
    console.log('=================================');
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
            
            this.updateReservationInLists(updatedReservation);
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
        
        this.updateReservationInLists(updatedReservation);
        
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
   * Método para cambiar programáticamente el tab (útil para testing)
   */
  // Opciones para el SelectButton
  viewOptions = [
    { label: 'Mis Reservas', value: 'my', icon: 'pi pi-user' },
    { label: 'Todas las Reservas', value: 'all', icon: 'pi pi-globe' }
  ];

  switchToTab(tabValue: 'my' | 'all'): void {
    console.log('🔍 DEBUG: switchToTab called with:', tabValue);
    this.activeTabValue = tabValue;
  }

  /**
   * Obtener el título dinámico según la pestaña activa
   */
  getPageTitle(): string {
    if (!this.isAdmin) {
      return 'Mis Reservas';
    }
    return this.activeTabValue === 'my' ? 'Mis Reservas' : 'Gestión de Reservas';
  }

  /**
   * Obtener la descripción dinámica según la pestaña activa
   */
  getPageDescription(): string {
    if (!this.isAdmin) {
      return 'Gestiona y consulta todas tus reservas de espacios';
    }
    return this.activeTabValue === 'my' 
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

  /**
   * Actualizar una reserva en todas las listas relevantes (helper method)
   */
  private updateReservationInLists(updatedReservation: Reservation): void {
    if (this.isAdmin) {
      // Actualizar en allReservations
      const allIndex = this.allReservations.findIndex(r => r.id === updatedReservation.id);
      if (allIndex !== -1) {
        this.allReservations[allIndex] = updatedReservation;
      }
      
      // Actualizar en myReservations si es propia
      const myIndex = this.myReservations.findIndex(r => r.id === updatedReservation.id);
      if (myIndex !== -1) {
        this.myReservations[myIndex] = updatedReservation;
      }
      
      this.updateActiveReservations();
    } else {
      // Actualizar en la lista principal para usuarios normales
      const index = this.reservations.findIndex(r => r.id === updatedReservation.id);
      if (index !== -1) {
        this.reservations[index] = updatedReservation;
        this.applyFilters();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}