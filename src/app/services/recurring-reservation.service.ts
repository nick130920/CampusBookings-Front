import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecurringReservationRequest {
  escenarioId: number;
  patron: PatronRecurrencia;
  fechaInicio: string; // YYYY-MM-DD format
  fechaFin: string; // YYYY-MM-DD format
  horaInicio: string; // HH:MM format
  horaFin: string; // HH:MM format
  observaciones?: string;
  diasSemana?: number[]; // Para patrón SEMANAL: [1,2,3,4,5] (1=Lunes, 7=Domingo)
  diaMes?: number; // Para patrón MENSUAL: día específico del mes (1-31)
  intervaloRepeticion?: number; // Cada X días/semanas/meses
  maxReservas?: number; // Límite máximo de reservas a generar
}

export interface RecurringReservationUpdateRequest {
  fechaFin: string; // YYYY-MM-DD format
  maxReservas?: number; // Límite máximo de reservas a generar
  observaciones?: string;
}

export interface RecurringReservationResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  escenarioId: number;
  escenarioNombre: string;
  patron: PatronRecurrencia;
  patronDescripcion: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
  diasSemana?: number[];
  diaMes?: number;
  intervaloRepeticion: number;
  activa: boolean;
  maxReservas?: number;
  reservasGeneradas: number;
  descripcionCompleta: string;
  proximaFechaGeneracion?: string;
  proximasFechas: string[];
  puedeGenerarMas: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: string;
  actualizadoPor?: string;
}

export interface RecurringReservationPreview {
  patron: PatronRecurrencia;
  descripcionPatron: string;
  totalReservasAGenerar: number;
  fechasReservas: FechaReservaResumen[];
  conflictos: string[];
  advertencias: string[];
}

export interface FechaReservaResumen {
  fecha: string;
  diaSemana: string;
  tieneConflicto: boolean;
  detalleConflicto?: string;
}

export enum PatronRecurrencia {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
  MENSUAL = 'MENSUAL',
  PERSONALIZADO = 'PERSONALIZADO'
}

export const PATRON_RECURRENCIA_LABELS = {
  [PatronRecurrencia.DIARIO]: 'Diario',
  [PatronRecurrencia.SEMANAL]: 'Semanal',
  [PatronRecurrencia.MENSUAL]: 'Mensual',
  [PatronRecurrencia.PERSONALIZADO]: 'Personalizado'
};

export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes', abrev: 'L' },
  { value: 2, label: 'Martes', abrev: 'M' },
  { value: 3, label: 'Miércoles', abrev: 'X' },
  { value: 4, label: 'Jueves', abrev: 'J' },
  { value: 5, label: 'Viernes', abrev: 'V' },
  { value: 6, label: 'Sábado', abrev: 'S' },
  { value: 7, label: 'Domingo', abrev: 'D' }
];

@Injectable({
  providedIn: 'root'
})
export class RecurringReservationService {
  private readonly apiUrl = `${environment.apiUrl}/reservas-recurrentes`;

  constructor(private http: HttpClient) {}

  /**
   * Previsualiza las reservas que se generarían con el patrón especificado
   */
  previewRecurringReservation(request: RecurringReservationRequest): Observable<RecurringReservationPreview> {
    return this.http.post<RecurringReservationPreview>(`${this.apiUrl}/previsualizar`, request);
  }

  /**
   * Crea una nueva configuración de reserva recurrente
   */
  createRecurringReservation(request: RecurringReservationRequest): Observable<RecurringReservationResponse> {
    return this.http.post<RecurringReservationResponse>(this.apiUrl, request);
  }

  /**
   * Obtiene todas las reservas recurrentes del usuario autenticado
   */
  getUserRecurringReservations(usuarioId: number): Observable<RecurringReservationResponse[]> {
    return this.http.get<RecurringReservationResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Obtiene todas las reservas recurrentes (solo admin)
   */
  getAllRecurringReservations(): Observable<RecurringReservationResponse[]> {
    return this.http.get<RecurringReservationResponse[]>(`${this.apiUrl}/admin/todas`);
  }

  /**
   * Obtiene una reserva recurrente específica por ID
   */
  getRecurringReservationById(id: number): Observable<RecurringReservationResponse> {
    return this.http.get<RecurringReservationResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza una reserva recurrente existente (actualización parcial)
   */
  updateRecurringReservation(id: number, request: RecurringReservationUpdateRequest): Observable<RecurringReservationResponse> {
    return this.http.patch<RecurringReservationResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Desactiva una reserva recurrente
   */
  deactivateRecurringReservation(id: number): Observable<RecurringReservationResponse> {
    return this.http.patch<RecurringReservationResponse>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  /**
   * Activa una reserva recurrente
   */
  activateRecurringReservation(id: number): Observable<RecurringReservationResponse> {
    return this.http.patch<RecurringReservationResponse>(`${this.apiUrl}/${id}/activar`, {});
  }

  /**
   * Elimina una reserva recurrente
   */
  deleteRecurringReservation(id: number, deletesFutureReservations: boolean = false): Observable<void> {
    const params = deletesFutureReservations ? '?eliminarReservasFuturas=true' : '';
    return this.http.delete<void>(`${this.apiUrl}/${id}${params}`);
  }

  /**
   * Genera reservas hasta una fecha específica (solo admin)
   */
  generateReservationsUntilDate(id: number, fechaLimite: string): Observable<number[]> {
    return this.http.post<number[]>(`${this.apiUrl}/${id}/generar-hasta`, null, {
      params: { fechaLimite }
    });
  }

  /**
   * Genera todas las reservas pendientes (solo admin)
   */
  generatePendingReservations(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/admin/generar-pendientes`, {});
  }

  /**
   * Helpers para manejar patrones de recurrencia
   */

  /**
   * Obtiene la etiqueta legible de un patrón de recurrencia
   */
  getPatronLabel(patron: PatronRecurrencia): string {
    return PATRON_RECURRENCIA_LABELS[patron] || patron;
  }

  /**
   * Obtiene la etiqueta de un día de la semana
   */
  getDiaSemanaLabel(dia: number): string {
    const diaObj = DIAS_SEMANA.find(d => d.value === dia);
    return diaObj ? diaObj.label : `Día ${dia}`;
  }

  /**
   * Obtiene la abreviación de un día de la semana
   */
  getDiaSemanaAbrev(dia: number): string {
    const diaObj = DIAS_SEMANA.find(d => d.value === dia);
    return diaObj ? diaObj.abrev : `${dia}`;
  }

  /**
   * Valida si una configuración de reserva recurrente es válida
   */
  validateRecurringReservation(request: RecurringReservationRequest): string[] {
    const errors: string[] = [];

    // Validaciones básicas
    if (!request.escenarioId) {
      errors.push('El escenario es obligatorio');
    }

    if (!request.patron) {
      errors.push('El patrón de recurrencia es obligatorio');
    }

    if (!request.fechaInicio) {
      errors.push('La fecha de inicio es obligatoria');
    }

    if (!request.fechaFin) {
      errors.push('La fecha de fin es obligatoria');
    }

    if (!request.horaInicio) {
      errors.push('La hora de inicio es obligatoria');
    }

    if (!request.horaFin) {
      errors.push('La hora de fin es obligatoria');
    }

    // Validaciones de fechas
    if (request.fechaInicio && request.fechaFin) {
      const fechaInicio = new Date(request.fechaInicio);
      const fechaFin = new Date(request.fechaFin);
      
      if (fechaFin <= fechaInicio) {
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (fechaInicio < new Date()) {
        errors.push('La fecha de inicio debe ser presente o futura');
      }
    }

    // Validaciones de horas
    if (request.horaInicio && request.horaFin) {
      if (request.horaFin <= request.horaInicio) {
        errors.push('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    // Validaciones específicas por patrón
    if (request.patron === PatronRecurrencia.SEMANAL) {
      if (!request.diasSemana || request.diasSemana.length === 0) {
        errors.push('Para patrón semanal debe seleccionar al menos un día de la semana');
      } else {
        const diasInvalidos = request.diasSemana.filter(dia => dia < 1 || dia > 7);
        if (diasInvalidos.length > 0) {
          errors.push('Los días de la semana deben estar entre 1 (Lunes) y 7 (Domingo)');
        }
      }
    }

    if (request.patron === PatronRecurrencia.MENSUAL) {
      if (!request.diaMes) {
        errors.push('Para patrón mensual debe especificar el día del mes');
      } else if (request.diaMes < 1 || request.diaMes > 31) {
        errors.push('El día del mes debe estar entre 1 y 31');
      }
    }

    // Validaciones de límites
    if (request.intervaloRepeticion && request.intervaloRepeticion < 1) {
      errors.push('El intervalo de repetición debe ser al menos 1');
    }

    if (request.maxReservas && request.maxReservas < 1) {
      errors.push('El máximo de reservas debe ser al menos 1');
    }

    if (request.maxReservas && request.maxReservas > 365) {
      errors.push('El máximo de reservas no puede exceder 365');
    }

    return errors;
  }

  /**
   * Genera una descripción legible de la configuración recurrente
   */
  generateDescription(request: RecurringReservationRequest): string {
    let description = '';

    switch (request.patron) {
      case PatronRecurrencia.DIARIO:
        if (request.intervaloRepeticion === 1) {
          description = 'Todos los días';
        } else {
          description = `Cada ${request.intervaloRepeticion} días`;
        }
        break;

      case PatronRecurrencia.SEMANAL:
        if (request.intervaloRepeticion === 1) {
          description = 'Cada semana';
        } else {
          description = `Cada ${request.intervaloRepeticion} semanas`;
        }
        if (request.diasSemana && request.diasSemana.length > 0) {
          const nombresDias = request.diasSemana.map(dia => this.getDiaSemanaLabel(dia));
          description += ` los ${nombresDias.join(', ')}`;
        }
        break;

      case PatronRecurrencia.MENSUAL:
        if (request.intervaloRepeticion === 1) {
          description = 'Cada mes';
        } else {
          description = `Cada ${request.intervaloRepeticion} meses`;
        }
        if (request.diaMes) {
          description += ` el día ${request.diaMes}`;
        }
        break;

      case PatronRecurrencia.PERSONALIZADO:
        description = 'Patrón personalizado';
        break;
    }

    description += ` de ${request.horaInicio} a ${request.horaFin}`;
    description += ` desde ${request.fechaInicio} hasta ${request.fechaFin}`;

    return description;
  }
}
