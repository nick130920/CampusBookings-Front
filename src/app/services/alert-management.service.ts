import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AlertaReserva {
  id: number;
  reservaId: number;
  reservaEscenario: string;
  reservaUsuario: string;
  reservaFechaInicio: string;
  reservaFechaFin: string;
  tipo: TipoAlerta;
  tipoDescripcion: string;
  fechaEnvio: string;
  estado: EstadoAlerta;
  estadoDescripcion: string;
  mensaje: string;
  canalEnvio: string;
  fechaEnviado?: string;
  intentosEnvio?: number;
  motivoFallo?: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export enum TipoAlerta {
  RECORDATORIO_24H = 'RECORDATORIO_24H',
  RECORDATORIO_2H = 'RECORDATORIO_2H',
  RECORDATORIO_30MIN = 'RECORDATORIO_30MIN',
  CONFIRMACION_LLEGADA = 'CONFIRMACION_LLEGADA',
  EXPIRACION_RESERVA = 'EXPIRACION_RESERVA',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  CANCELACION_AUTOMATICA = 'CANCELACION_AUTOMATICA'
}

export enum EstadoAlerta {
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  FALLIDO = 'FALLIDO',
  CANCELADO = 'CANCELADO',
  PROGRAMADO = 'PROGRAMADO'
}

export interface ConfigurarAlertaRequest {
  tiposAlerta: TipoAlerta[];
  canalesEnvio: string[];
  mensajePersonalizado?: string;
  habilitarRecordatorios?: boolean;
  horasAnticipacion24h?: number;
  horasAnticipacion2h?: number;
  minutosAnticipacion30min?: number;
  tipoEscenarioId?: number;
  aplicarATodosLosEscenarios?: boolean;
}

export interface EstadisticasAlertas {
  totalAlertas: number;
  alertasPendientes: number;
  alertasEnviadas: number;
  alertasFallidas: number;
  alertasCanceladas: number;
}

export interface AlertasPage {
  content: AlertaReserva[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/alertas`;

  // Signals para estado reactivo
  private readonly _alertas = signal<AlertaReserva[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _estadisticas = signal<EstadisticasAlertas | null>(null);

  // BehaviorSubjects para observables
  private readonly alertasSubject = new BehaviorSubject<AlertaReserva[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  // Public signals
  readonly alertas = this._alertas.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Public observables
  readonly alertas$ = this.alertasSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  /**
   * Obtiene todas las alertas con paginación
   */
  obtenerAlertas(page: number = 0, size: number = 20): Observable<AlertasPage> {
    this._loading.set(true);
    this.loadingSubject.next(true);
    
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AlertasPage>(`${this.apiUrl}`, { params }).pipe(
      tap(response => {
        this._alertas.set(response.content);
        this.alertasSubject.next(response.content);
        this._loading.set(false);
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Obtiene alertas por reserva
   */
  obtenerAlertasPorReserva(reservaId: number): Observable<AlertaReserva[]> {
    return this.http.get<AlertaReserva[]>(`${this.apiUrl}/reserva/${reservaId}`);
  }

  /**
   * Obtiene alertas por usuario
   */
  obtenerAlertasPorUsuario(usuarioId: number): Observable<AlertaReserva[]> {
    return this.http.get<AlertaReserva[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Obtiene alertas pendientes
   */
  obtenerAlertasPendientes(): Observable<AlertaReserva[]> {
    return this.http.get<AlertaReserva[]>(`${this.apiUrl}/pendientes`);
  }

  /**
   * Configura alertas personalizadas
   */
  configurarAlertas(request: ConfigurarAlertaRequest): Observable<AlertaReserva[]> {
    return this.http.post<AlertaReserva[]>(`${this.apiUrl}/configurar`, request);
  }

  /**
   * Envía una alerta manualmente
   */
  enviarAlerta(alertaId: number): Observable<AlertaReserva> {
    return this.http.post<AlertaReserva>(`${this.apiUrl}/${alertaId}/enviar`, {}).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Cancela una alerta
   */
  cancelarAlerta(alertaId: number): Observable<AlertaReserva> {
    return this.http.post<AlertaReserva>(`${this.apiUrl}/${alertaId}/cancelar`, {}).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Reenvía una alerta fallida
   */
  reenviarAlerta(alertaId: number): Observable<AlertaReserva> {
    return this.http.post<AlertaReserva>(`${this.apiUrl}/${alertaId}/reenviar`, {}).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Procesa alertas pendientes manualmente
   */
  procesarAlertasPendientes(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/procesar`, {}).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Obtiene estadísticas de alertas
   */
  obtenerEstadisticas(): Observable<EstadisticasAlertas> {
    return this.http.get<EstadisticasAlertas>(`${this.apiUrl}/estadisticas`).pipe(
      tap(stats => this._estadisticas.set(stats))
    );
  }

  /**
   * Limpia alertas vencidas
   */
  limpiarAlertasVencidas(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/limpiar-vencidas`, {}).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Elimina alertas de una reserva cancelada
   */
  eliminarAlertasDeReservaCancelada(reservaId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/reserva/${reservaId}`).pipe(
      tap(() => this.refreshAlertas())
    );
  }

  /**
   * Refresca la lista de alertas
   */
  private refreshAlertas(): void {
    this.obtenerAlertas().subscribe();
  }

  /**
   * Mapea tipo de alerta a icono
   */
  getAlertIcon(tipo: TipoAlerta): string {
    const iconMap = {
      [TipoAlerta.RECORDATORIO_24H]: 'pi pi-calendar',
      [TipoAlerta.RECORDATORIO_2H]: 'pi pi-clock',
      [TipoAlerta.RECORDATORIO_30MIN]: 'pi pi-exclamation-triangle',
      [TipoAlerta.CONFIRMACION_LLEGADA]: 'pi pi-map-marker',
      [TipoAlerta.EXPIRACION_RESERVA]: 'pi pi-times-circle',
      [TipoAlerta.CAMBIO_ESTADO]: 'pi pi-sync',
      [TipoAlerta.CANCELACION_AUTOMATICA]: 'pi pi-ban'
    };
    return iconMap[tipo] || 'pi pi-bell';
  }

  /**
   * Mapea estado de alerta a severity de PrimeNG
   */
  getEstadoSeverity(estado: EstadoAlerta): string {
    const severityMap = {
      [EstadoAlerta.PENDIENTE]: 'warning',
      [EstadoAlerta.ENVIADO]: 'success',
      [EstadoAlerta.FALLIDO]: 'danger',
      [EstadoAlerta.CANCELADO]: 'secondary',
      [EstadoAlerta.PROGRAMADO]: 'info'
    };
    return severityMap[estado] || 'secondary';
  }

  /**
   * Obtiene color para tipo de alerta
   */
  getTipoColor(tipo: TipoAlerta): string {
    const colorMap = {
      [TipoAlerta.RECORDATORIO_24H]: '#8F141B',
      [TipoAlerta.RECORDATORIO_2H]: '#ff9800',
      [TipoAlerta.RECORDATORIO_30MIN]: '#f44336',
      [TipoAlerta.CONFIRMACION_LLEGADA]: '#4caf50',
      [TipoAlerta.EXPIRACION_RESERVA]: '#757575',
      [TipoAlerta.CAMBIO_ESTADO]: '#2196f3',
      [TipoAlerta.CANCELACION_AUTOMATICA]: '#e91e63'
    };
    return colorMap[tipo] || '#8F141B';
  }
}
