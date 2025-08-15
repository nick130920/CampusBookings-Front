import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GoogleCalendarStatusResponse {
  connected: boolean;
  authorizationUrl?: string;
  message: string;
}

export interface GoogleCalendarAuthRequest {
  authorizationCode: string;
}

export interface GoogleCalendarSyncResponse {
  success: boolean;
  message: string;
  totalReservas: number;
  reservasSincronizadas: number;
  errores: number;
  connected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/google-calendar`;
  
  // Estado reactivo de la conexión
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    // Verificar estado inicial al cargar el servicio
    this.checkConnectionStatus();
  }

  /**
   * Obtiene la URL de autorización para conectar con Google Calendar
   */
  getAuthorizationUrl(): Observable<GoogleCalendarStatusResponse> {
    return this.http.get<GoogleCalendarStatusResponse>(`${this.baseUrl}/authorization-url`)
      .pipe(
        tap(response => {
          this.connectionStatusSubject.next(response.connected);
        })
      );
  }

  /**
   * Conecta la cuenta con Google Calendar usando el código de autorización
   */
  connectToGoogleCalendar(authRequest: GoogleCalendarAuthRequest): Observable<GoogleCalendarStatusResponse> {
    return this.http.post<GoogleCalendarStatusResponse>(`${this.baseUrl}/connect`, authRequest)
      .pipe(
        tap(response => {
          this.connectionStatusSubject.next(response.connected);
        })
      );
  }

  /**
   * Desconecta la cuenta de Google Calendar
   */
  disconnectFromGoogleCalendar(): Observable<GoogleCalendarStatusResponse> {
    return this.http.post<GoogleCalendarStatusResponse>(`${this.baseUrl}/disconnect`, {})
      .pipe(
        tap(response => {
          this.connectionStatusSubject.next(response.connected);
        })
      );
  }

  /**
   * Verifica el estado actual de la conexión
   */
  checkConnectionStatus(): Observable<GoogleCalendarStatusResponse> {
    return this.http.get<GoogleCalendarStatusResponse>(`${this.baseUrl}/status`)
      .pipe(
        tap(response => {
          this.connectionStatusSubject.next(response.connected);
        })
      );
  }

  /**
   * Sincroniza todas las reservas con Google Calendar
   */
  syncAllReservations(): Observable<GoogleCalendarSyncResponse> {
    return this.http.post<GoogleCalendarSyncResponse>(`${this.baseUrl}/sync-all`, {});
  }

  /**
   * Obtiene el estado actual de conexión (sin hacer petición al servidor)
   */
  getCurrentConnectionStatus(): boolean {
    return this.connectionStatusSubject.value;
  }

  /**
   * Abre una ventana para autorizar Google Calendar
   */
  openAuthorizationWindow(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl, 
        'google-calendar-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('No se pudo abrir la ventana de autorización. Verifica que los popups estén habilitados.'));
        return;
      }

      // Escuchar cuando la ventana se cierre
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Aquí puedes manejar si el usuario cerró la ventana sin autorizar
          reject(new Error('Autorización cancelada por el usuario'));
        }
      }, 1000);

      // Escuchar mensajes de la ventana popup (si implementas el callback)
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          resolve(event.data.code);
        } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          reject(new Error(event.data.error || 'Error en la autorización'));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }
}
