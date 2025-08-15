import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, catchError, of, Subscription } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { ScenarioService, Scenario } from '../../../services/scenario.service';
import { ReservationService, BloqueOcupado, OcupacionesMesResponse } from '../../../services/reservation.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { SystemConfigService } from '../../../services/system-config.service';
import { SidebarService } from '../../../services/sidebar.service';

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



@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG Components
    ButtonModule,
    SelectModule,
    ProgressSpinnerModule,
    CardModule,
    ChipModule,
    TooltipModule
  ],
  templateUrl: './availability-calendar.component.html',
  styleUrls: ['./availability-calendar.component.css']
})
export class AvailabilityCalendarComponent implements OnInit, OnDestroy {
  // Form y estado
  searchForm!: FormGroup;
  isLoading = false;
  isCheckingAvailability = false;
  
  // Sidebar state
  sidebarCollapsed = false;
  private sidebarSubscription?: Subscription;
  
  // Data del escenario
  selectedScenario: (Scenario & { id: number }) | null = null;
  scenarios: Scenario[] = [];
  
  // Calendario
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  calendarDays: CalendarDay[] = [];
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private scenarioService = inject(ScenarioService);
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private systemConfigService = inject(SystemConfigService);
  private sidebarService = inject(SidebarService);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Suscribirse al estado del sidebar
    this.sidebarSubscription = this.sidebarService.sidebarCollapsed$.subscribe(collapsed => {
      this.sidebarCollapsed = collapsed;
    });
    
    this.loadInitialData();
    this.generateCalendar();
    this.checkRouteParams();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      scenarioId: [null, Validators.required]
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Cargar escenarios
    this.scenarioService.getScenarios().pipe(
      catchError(error => {
        console.error('Error loading scenarios:', error);
        this.toastService.showError('Error al cargar los escenarios');
        return of([]);
      })
    ).subscribe(scenarios => {
      this.scenarios = scenarios;
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
        // Cargar ocupaciones para el mes actual automáticamente
        this.loadOccupationsForCurrentMonth();
      }
    } else {
      this.selectedScenario = null;
      // Limpiar ocupaciones cuando no hay escenario seleccionado
      this.clearOccupations();
    }
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
   * Carga ocupaciones para todo el mes actual en una sola consulta
   */
  private loadOccupationsForCurrentMonth(): void {
    if (!this.selectedScenario) {
      return;
    }

    this.isCheckingAvailability = true;
    
    // Crear fecha del mes actual
    const currentMonthDate = new Date(this.currentYear, this.currentMonth, 1);
    
    // Una sola consulta para todo el mes
    this.reservationService.obtenerOcupacionesMesFromDate(this.selectedScenario.id, currentMonthDate).subscribe({
      next: (ocupacionesResponse) => {
        // Distribuir las ocupaciones en los días del calendario
        this.distributeOccupationsToCalendarDays(ocupacionesResponse);
        this.isCheckingAvailability = false;
      },
      error: (error) => {
        console.error('Error loading month occupations:', error);
        this.isCheckingAvailability = false;
        // En caso de error, limpiar ocupaciones
        this.clearOccupations();
      }
    });
  }

  /**
   * Distribuye las ocupaciones del mes en los días correspondientes del calendario
   */
  private distributeOccupationsToCalendarDays(ocupacionesResponse: OcupacionesMesResponse): void {
    // Limpiar ocupaciones existentes
    this.clearOccupations();
    
    // Distribuir ocupaciones por día
    Object.keys(ocupacionesResponse.ocupacionesPorDia).forEach(diaStr => {
      const dia = parseInt(diaStr);
      const ocupacionesDelDia = ocupacionesResponse.ocupacionesPorDia[dia];
      
      // Encontrar el día correspondiente en el calendario
      const dayIndex = this.calendarDays.findIndex(calendarDay => 
        calendarDay.day === dia && 
        calendarDay.month === this.currentMonth &&
        calendarDay.year === this.currentYear &&
        calendarDay.isCurrentMonth
      );

      if (dayIndex !== -1) {
        this.calendarDays[dayIndex].ocupaciones = ocupacionesDelDia;
        // Actualizar el estado de disponibilidad basado en las ocupaciones
        this.calendarDays[dayIndex].availability = ocupacionesDelDia.length > 0 ? 'RESERVADO' : 'DISPONIBLE';
      }
    });

    // Marcar días sin ocupaciones como disponibles
    this.calendarDays.forEach(day => {
      if (day.isCurrentMonth && !day.isPast && !day.ocupaciones) {
        day.ocupaciones = [];
        day.availability = 'DISPONIBLE';
      }
    });
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

  /**
   * Genera el contenido del tooltip para una ocupación - versión simple
   */
  getOccupationTooltip(bloque: BloqueOcupado): string {
    const estadoIcon = this.getEstadoIcon(bloque.estado);
    return `${bloque.motivo} <i class="${estadoIcon}" style="margin-left: 8px;"></i>`;
  }

  /**
   * Obtiene la etiqueta legible del estado
   */
  private getEstadoLabel(estado: string): string {
    const estados: { [key: string]: string } = {
      'APROBADA': 'Aprobada',
      'PENDIENTE': 'Pendiente',
      'RECHAZADA': 'Rechazada',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  /**
   * Obtiene el icono apropiado para el estado
   */
  private getEstadoIcon(estado: string): string {
    const iconos: { [key: string]: string } = {
      'APROBADA': 'pi pi-check-circle',
      'PENDIENTE': 'pi pi-clock',
      'RECHAZADA': 'pi pi-times-circle',
      'CANCELADA': 'pi pi-ban'
    };
    return iconos[estado] || 'pi pi-info-circle';
  }

  clearScenario(): void {
    this.searchForm.reset();
    this.selectedScenario = null;
    this.clearOccupations();
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
} 