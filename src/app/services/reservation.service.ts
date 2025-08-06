import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { formatForAPI } from '../utils/date.utils';

export interface Reservation {
  id: number;
  escenarioId: number;
  escenarioNombre?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioApellido?: string;
  usuarioEmail?: string;
  estadoId?: number;
  estadoNombre?: string;
  fechaInicio: string; // ISO format
  fechaFin: string; // ISO format
  observaciones?: string;
  motivoRechazo?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CreateReservationRequest {
  escenarioId: number;
  fechaInicio: string; // ISO format
  fechaFin: string; // ISO format
  observaciones?: string;
}

export interface VerifyAvailabilityRequest {
  escenarioId: number;
  fechaInicio: string; // ISO format
  fechaFin: string; // ISO format
}

export interface AvailabilityResponse {
  disponible: boolean;
  escenarioId: number;
  escenarioNombre?: string;
  fechaInicio: string;
  fechaFin: string;
  mensaje: string;
  conflictos?: ConflictingReservation[];
  alternativas?: AlternativeSlot[];
}

export interface ConflictingReservation {
  reservaId: number;
  fechaInicio: string;
  fechaFin: string;
  usuarioNombre: string;
  estado: string;
}

export interface AlternativeSlot {
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
}

export interface OcupacionesDiaRequest {
  escenarioId: number;
  fecha: string; // Formato YYYY-MM-DD
}

export interface OcupacionesDiaResponse {
  escenarioId: number;
  escenarioNombre: string;
  fecha: string;
  bloquesOcupados: BloqueOcupado[];
}

export interface BloqueOcupado {
  horaInicio: string; // ISO format
  horaFin: string; // ISO format
  motivo: string;
  estado: string;
  reservaId?: number;
}

/**
 * Servicio para gestión de reservas.
 * Implementa las mejores prácticas de Cal.com para reservas en tiempo real.
 */
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva reserva
   */
  createReservation(request: CreateReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, request);
  }

  /**
   * Crear una nueva reserva con objetos Date (convierte automáticamente a formato local)
   */
  createReservationFromDates(
    escenarioId: number, 
    fechaInicio: Date, 
    fechaFin: Date, 
    observaciones?: string
  ): Observable<Reservation> {
    const request: CreateReservationRequest = {
      escenarioId,
      fechaInicio: formatForAPI(fechaInicio),
      fechaFin: formatForAPI(fechaFin),
      observaciones
    };
    return this.createReservation(request);
  }

  /**
   * Verificar disponibilidad en tiempo real (característica clave de Cal.com)
   */
  verifyAvailability(request: VerifyAvailabilityRequest): Observable<AvailabilityResponse> {
    return this.http.post<AvailabilityResponse>(`${this.apiUrl}/verificar-disponibilidad`, request);
  }

  /**
   * Verificar disponibilidad con objetos Date (convierte automáticamente a formato local)
   */
  verifyAvailabilityFromDates(
    escenarioId: number, 
    fechaInicio: Date, 
    fechaFin: Date
  ): Observable<AvailabilityResponse> {
    const request: VerifyAvailabilityRequest = {
      escenarioId,
      fechaInicio: formatForAPI(fechaInicio),
      fechaFin: formatForAPI(fechaFin)
    };
    return this.verifyAvailability(request);
  }

  /**
   * Obtener todas las ocupaciones de un escenario en un día específico.
   * Optimización para evitar múltiples consultas de disponibilidad.
   */
  obtenerOcupacionesDia(request: OcupacionesDiaRequest): Observable<OcupacionesDiaResponse> {
    return this.http.post<OcupacionesDiaResponse>(`${this.apiUrl}/ocupaciones-dia`, request);
  }

  /**
   * Obtener ocupaciones de un día usando un objeto Date
   */
  obtenerOcupacionesDiaFromDate(escenarioId: number, fecha: Date): Observable<OcupacionesDiaResponse> {
    const request: OcupacionesDiaRequest = {
      escenarioId,
      fecha: fecha.toISOString().split('T')[0] // Formato YYYY-MM-DD
    };
    return this.obtenerOcupacionesDia(request);
  }

  /**
   * Obtener reservas del usuario actual
   */
  getUserReservations(userId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/usuario/${userId}`);
  }

  /**
   * Obtener reservas de un escenario específico (admin only)
   */
  getScenarioReservations(scenarioId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/escenario/${scenarioId}`);
  }

  /**
   * Aprobar una reserva (admin only)
   */
  approveReservation(reservationId: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${reservationId}/aprobar`, {});
  }

  /**
   * Rechazar una reserva (admin only)
   */
  rejectReservation(reservationId: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${reservationId}/rechazar`, {});
  }

  /**
   * Cancelar una reserva
   */
  cancelReservation(reservationId: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${reservationId}/cancelar`, {});
  }

  /**
   * Obtener reservas por estado (admin only)
   */
  getReservationsByStatus(status: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/estado/${status}`);
  }

  /**
   * Formatea una fecha para envío al backend
   */
  formatDateForBackend(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parsea una fecha recibida del backend
   */
  parseDateFromBackend(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Valida que una fecha de inicio sea válida para reservas
   */
  validateStartDate(startDate: Date): string | null {
    const now = new Date();
    const maxAdvance = new Date();
    maxAdvance.setDate(now.getDate() + 30);

    if (startDate < now) {
      return 'La fecha de inicio debe ser en el futuro';
    }

    if (startDate > maxAdvance) {
      return 'Solo se pueden hacer reservas con máximo 30 días de anticipación';
    }

    const hour = startDate.getHours();
    if (hour < 8 || hour >= 20) {
      return 'Las reservas solo están permitidas entre las 8:00 AM y 8:00 PM';
    }

    return null;
  }

  /**
   * Valida que el rango de fechas sea válido
   */
  validateDateRange(startDate: Date, endDate: Date): string | null {
    if (endDate <= startDate) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    if (durationMinutes < 30) {
      return 'La reserva debe tener una duración mínima de 30 minutos';
    }

    if (durationHours > 4) {
      return 'La duración máxima de la reserva es de 4 horas';
    }

    const endHour = endDate.getHours();
    if (endHour > 20 || (endHour === 20 && endDate.getMinutes() > 0)) {
      return 'Las reservas deben terminar antes de las 8:00 PM';
    }

    return null;
  }

  /**
   * Genera slots de tiempo sugeridos para un día específico
   */
  generateTimeSlots(date: Date, duration: number = 60): { start: Date, end: Date, label: string }[] {
    const slots = [];
    const baseDate = new Date(date);
    
    for (let hour = 8; hour < 20; hour++) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      // Verificar que no exceda las 8 PM
      if (endTime.getHours() > 20) {
        break;
      }
      
      slots.push({
        start: startTime,
        end: endTime,
        label: `${startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
      });
    }
    
    return slots;
  }

  // ==================== MÉTODOS ADMINISTRATIVOS ====================

  /**
   * Obtener todas las reservas (solo administradores)
   */
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/admin/todas`);
  }

  /**
   * Rechazar una reserva con motivo específico (solo administradores)
   */
  rejectReservationWithReason(reservationId: number, motivo: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${reservationId}/rechazar`, { motivo });
  }
}