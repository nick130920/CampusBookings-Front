import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';

// Services
import { ScenarioService, Scenario } from '../../../services/scenario.service';
import { ReservationService } from '../../../services/reservation.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

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
    ChipModule,
    CalendarModule,
    DropdownModule
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
  selectedScenario: Scenario | null = null;
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
    this.minDate = new Date();
    this.maxDate = new Date();
    this.maxDate.setMonth(this.maxDate.getMonth() + 6); // 6 meses en el futuro
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
      this.selectedScenario = this.scenarios.find(s => s.id === scenarioId) || null;
      if (this.selectedScenario) {
        this.searchForm.patchValue({
          scenarioName: this.selectedScenario.nombre,
          scenarioType: this.selectedScenario.tipo,
          location: this.selectedScenario.ubicacion
        });
      }
    } else {
      this.selectedScenario = null;
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
    if (date < new Date()) {
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
        isPast: currentDate < today,
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
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
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
    if (day.isPast || !day.isCurrentMonth) {
      return;
    }

    // Si hay un escenario seleccionado, abrir el formulario de reserva
    if (this.selectedScenario) {
      this.router.navigate(['/reservas/nueva'], {
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

  clearFilters(): void {
    this.searchForm.reset();
    this.selectedScenario = null;
    this.availabilityData = [];
    this.updateCalendarAvailability();
  }
} 