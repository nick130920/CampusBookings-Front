import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservaNotification {
  reservaId: number;
  usuarioId: number;
  usuarioEmail: string;
  escenarioNombre: string;
  estadoAnterior?: string;
  estadoNuevo: string;
  mensaje: string;
  motivo?: string;
  fechaInicio: string;
  fechaFin: string;
  timestamp: string;
  tipo: 'RESERVA_APROBADA' | 'RESERVA_RECHAZADA' | 'RESERVA_CANCELADA' | 'RESERVA_AUTO_RECHAZADA' | 'NUEVA_RESERVA_ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private connected = false;
  private currentUserId: number | null = null;
  private isAdmin = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Subjects para notificaciones
  private notificationsSubject = new BehaviorSubject<ReservaNotification | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  /**
   * Conectar al WebSocket nativo
   */
  connect(userId: number, isAdmin: boolean = false): void {
    if (this.connected && this.currentUserId === userId) {
      console.log('WebSocket already connected for user:', userId);
      return;
    }

    this.currentUserId = userId;
    this.isAdmin = isAdmin;
    this.reconnectAttempts = 0;

    console.log('🔌 Connecting to native WebSocket for user:', userId, 'isAdmin:', isAdmin);

    this.createWebSocketConnection();
  }

  /**
   * Crear conexión WebSocket nativa
   */
  private createWebSocketConnection(): void {
    if (this.socket) {
      this.socket.close();
    }

    const wsUrl = `${environment.apiUrl.replace('http', 'ws').replace('/api', '')}/ws/notifications`;
    console.log('🌐 WebSocket URL:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = (event) => {
        console.log('✅ Connected to native WebSocket:', event);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.connectionStatusSubject.next(true);
        this.sendConnectionMessage();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Received WebSocket message:', data);
          
          // Verificar si el mensaje es para este usuario o para admin
          if (this.shouldProcessMessage(data)) {
            const notification: ReservaNotification = data;
            this.notificationsSubject.next(notification);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.connected = false;
        this.connectionStatusSubject.next(false);
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event);
        this.connected = false;
        this.connectionStatusSubject.next(false);
        
        // Intentar reconexión automática
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          timer(5000).subscribe(() => {
            if (this.currentUserId && !this.connected) {
              this.createWebSocketConnection();
            }
          });
        } else {
          console.error('🚫 Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  /**
   * Enviar mensaje de conexión al servidor
   */
  private sendConnectionMessage(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentUserId) {
      const connectionMessage = {
        type: 'CONNECT',
        userId: this.currentUserId,
        isAdmin: this.isAdmin,
        timestamp: new Date().toISOString()
      };

      this.socket.send(JSON.stringify(connectionMessage));
      console.log('📤 Sent connection message:', connectionMessage);
    }
  }

  /**
   * Verificar si debe procesar el mensaje
   */
  private shouldProcessMessage(data: any): boolean {
    // Procesar si es para este usuario específico
    if (data.usuarioId === this.currentUserId) {
      return true;
    }

    // Procesar si es admin y el mensaje es para admin
    if (this.isAdmin && data.tipo === 'NUEVA_RESERVA_ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Desconectar del WebSocket
   */
  disconnect(): void {
    if (this.socket && this.connected) {
      console.log('🔌 Disconnecting from native WebSocket');
      
      // Enviar mensaje de desconexión
      if (this.currentUserId) {
        const disconnectionMessage = {
          type: 'DISCONNECT',
          userId: this.currentUserId,
          isAdmin: this.isAdmin,
          timestamp: new Date().toISOString()
        };
        
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify(disconnectionMessage));
        }
      }

      this.socket.close();
    }
    
    this.socket = null;
    this.connected = false;
    this.currentUserId = null;
    this.isAdmin = false;
    this.reconnectAttempts = 0;
    this.connectionStatusSubject.next(false);
  }

  /**
   * Obtener observable de notificaciones
   */
  getNotifications(): Observable<ReservaNotification | null> {
    return this.notificationsSubject.asObservable();
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Obtener icono según el tipo de notificación
   */
  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'RESERVA_APROBADA':
        return 'pi pi-check-circle';
      case 'RESERVA_RECHAZADA':
      case 'RESERVA_AUTO_RECHAZADA':
        return 'pi pi-times-circle';
      case 'RESERVA_CANCELADA':
        return 'pi pi-ban';
      case 'NUEVA_RESERVA_ADMIN':
        return 'pi pi-bell';
      default:
        return 'pi pi-info-circle';
    }
  }

  /**
   * Obtener severidad para el toast según el tipo
   */
  getNotificationSeverity(tipo: string): 'success' | 'error' | 'warn' | 'info' {
    switch (tipo) {
      case 'RESERVA_APROBADA':
        return 'success';
      case 'RESERVA_RECHAZADA':
      case 'RESERVA_AUTO_RECHAZADA':
        return 'error';
      case 'RESERVA_CANCELADA':
        return 'warn';
      case 'NUEVA_RESERVA_ADMIN':
        return 'info';
      default:
        return 'info';
    }
  }
}