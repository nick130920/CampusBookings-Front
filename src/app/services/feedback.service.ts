import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeedbackRequest {
  escenarioId: number;
  calificacion: number;
  comentario?: string;
}

export interface FeedbackUpdateRequest {
  calificacion: number;
  comentario?: string;
}

export interface FeedbackResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioApellido: string;
  escenarioId: number;
  escenarioNombre: string;
  calificacion: number;
  comentario?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion?: string;
}

export interface EstadisticasFeedback {
  escenarioId: number;
  escenarioNombre: string;
  calificacionPromedio: number;
  totalFeedbacks: number;
  distribucionCalificaciones: number[]; // Array de 5 elementos (1-5 estrellas)
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/v1/feedback`;

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo feedback
   */
  crearFeedback(request: FeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(this.apiUrl, request);
  }

  /**
   * Actualizar un feedback existente
   */
  actualizarFeedback(id: number, request: FeedbackUpdateRequest): Observable<FeedbackResponse> {
    return this.http.put<FeedbackResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Obtener un feedback por su ID
   */
  obtenerFeedbackPorId(id: number): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener los feedbacks del usuario autenticado
   */
  obtenerMisFeedbacks(page: number = 0, size: number = 10): Observable<PageResponse<FeedbackResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdDate,desc');

    return this.http.get<PageResponse<FeedbackResponse>>(`${this.apiUrl}/mis-feedbacks`, { params });
  }

  /**
   * Obtener feedbacks de un escenario específico
   */
  obtenerFeedbacksPorEscenario(escenarioId: number, page: number = 0, size: number = 10): Observable<PageResponse<FeedbackResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdDate,desc');

    return this.http.get<PageResponse<FeedbackResponse>>(`${this.apiUrl}/escenario/${escenarioId}`, { params });
  }

  /**
   * Obtener el feedback del usuario para un escenario específico
   */
  obtenerMiFeedbackParaEscenario(escenarioId: number): Observable<FeedbackResponse | null> {
    return this.http.get<FeedbackResponse | null>(`${this.apiUrl}/escenario/${escenarioId}/mi-feedback`);
  }

  /**
   * Obtener estadísticas de feedback de un escenario
   */
  obtenerEstadisticasFeedback(escenarioId: number): Observable<EstadisticasFeedback> {
    return this.http.get<EstadisticasFeedback>(`${this.apiUrl}/escenario/${escenarioId}/estadisticas`);
  }

  /**
   * Eliminar un feedback
   */
  eliminarFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Desactivar un feedback
   */
  desactivarFeedback(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener texto descriptivo para la calificación
   */
  obtenerTextoCalificacion(calificacion: number): string {
    const textos = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return textos[calificacion as keyof typeof textos] || 'Sin calificación';
  }

  /**
   * Obtener color para la calificación basado en colores USCO
   */
  obtenerColorCalificacion(calificacion: number): string {
    if (calificacion >= 4) return '#8F141B'; // Vino USCO para calificaciones altas
    if (calificacion >= 3) return '#DAA520'; // Ocre USCO para calificaciones medias
    return '#6B7280'; // Gris para calificaciones bajas
  }

  /**
   * Generar array de estrellas para mostrar calificación
   */
  generarEstrellas(calificacion: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < calificacion);
  }
}
