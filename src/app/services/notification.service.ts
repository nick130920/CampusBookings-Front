import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { WebSocketService, ReservaNotification } from './websocket.service';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubscription: Subscription | null = null;
  private connectionSubscription: Subscription | null = null;
  private processedNotifications = new Set<string>(); // Para evitar notificaciones duplicadas
  private isInitialized = false; // Para evitar múltiples inicializaciones

  constructor(
    private messageService: MessageService,
    private webSocketService: WebSocketService,
    private authService: AuthService
  ) {
    if (!this.isInitialized) {
      this.initializeNotifications();
      this.isInitialized = true;
    }
  }

  /**
   * Inicializar el sistema de notificaciones
   */
  private initializeNotifications(): void {
    // Variable para evitar reconexiones innecesarias
    let currentUserId: number | null = null;
    let currentIsAdmin: boolean = false;

    // Escuchar cambios en el estado de autenticación
    this.authService.getCurrentUser$().subscribe(user => {
      if (user) {
        const isAdmin = user.role === 'ADMIN';
        
        // Solo reconectar si cambió el usuario o el estado de admin
        // No reconectar para cambios de rol que no afecten admin status
        if (currentUserId !== user.id || currentIsAdmin !== isAdmin) {
          console.log('🔄 Reconectando WebSocket - Usuario cambió o status admin cambió');
          currentUserId = user.id;
          currentIsAdmin = isAdmin;
          this.connectWebSocket(user.id, isAdmin);
        } else {
          console.log('👤 Rol actualizado pero sin necesidad de reconectar WebSocket');
        }
      } else {
        currentUserId = null;
        currentIsAdmin = false;
        this.disconnectWebSocket();
      }
    });
  }

  /**
   * Conectar al WebSocket
   */
  private connectWebSocket(userId: number, isAdmin: boolean): void {
    console.log('Connecting to WebSocket notifications for user:', userId);
    
    // Desconectar conexiones previas
    this.disconnectWebSocket();

    // Conectar al WebSocket
    this.webSocketService.connect(userId, isAdmin);

    // Suscribirse a notificaciones
    this.notificationSubscription = this.webSocketService.getNotifications().subscribe(
      notification => {
        if (notification) {
          // Crear un ID único para la notificación
          const notificationId = `${notification.tipo}_${notification.usuarioId}_${notification.timestamp}`;
          
          // Verificar si ya fue procesada para evitar duplicados
          if (this.processedNotifications.has(notificationId)) {
            console.log('⚠️ Notificación ya procesada, ignorando:', notificationId);
            return;
          }
          
          // Marcar como procesada
          this.processedNotifications.add(notificationId);
          
          // Limpiar notificaciones antigas (mantener solo las últimas 50)
          if (this.processedNotifications.size > 50) {
            const entries = Array.from(this.processedNotifications);
            entries.slice(0, 25).forEach(id => this.processedNotifications.delete(id));
          }
          
          this.showNotification(notification);
          
          // Manejar actualización de rol específicamente
          if (notification.tipo === 'USER_ROLE_UPDATED') {
            this.handleRoleUpdate(notification);
          }
        }
      }
    );

    // Suscribirse al estado de conexión
    this.connectionSubscription = this.webSocketService.getConnectionStatus().subscribe(
      connected => {
        if (connected) {
          console.log('✅ Notificaciones en tiempo real activadas');
          this.showConnectionStatus('Notificaciones en tiempo real activadas', 'success');
        } else {
          console.log('❌ Desconectado de notificaciones en tiempo real');
        }
      }
    );
  }

  /**
   * Desconectar del WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
      this.notificationSubscription = null;
    }

    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
      this.connectionSubscription = null;
    }

    // Limpiar notificaciones procesadas al desconectar
    this.processedNotifications.clear();

    this.webSocketService.disconnect();
  }

  /**
   * Mostrar notificación en pantalla
   */
  private showNotification(notification: ReservaNotification): void {
    // Solo mostrar el toast para USER_ROLE_UPDATED en handleRoleUpdate
    if (notification.tipo === 'USER_ROLE_UPDATED') {
      console.log('📢 Role update notification received, will be handled separately');
      return;
    }

    const severity = this.webSocketService.getNotificationSeverity(notification.tipo);
    const icon = this.webSocketService.getNotificationIcon(notification.tipo);
    
    // Formatear mensaje para el toast
    let detail = notification.mensaje;
    if (notification.motivo) {
      detail += `\n\nMotivo: ${notification.motivo}`;
    }

    // Crear toast con información completa
    this.messageService.add({
      severity: severity,
      summary: this.getNotificationTitle(notification.tipo),
      detail: detail,
      life: 8000, // 8 segundos
      sticky: notification.tipo === 'RESERVA_RECHAZADA' || notification.tipo === 'RESERVA_AUTO_RECHAZADA',
      data: {
        icon: icon,
        reservaId: notification.reservaId,
        escenario: notification.escenarioNombre,
        tipo: notification.tipo
      }
    });

    // Log para debugging
    console.log('📢 Notification displayed:', {
      tipo: notification.tipo,
      mensaje: notification.mensaje,
      reservaId: notification.reservaId,
      escenario: notification.escenarioNombre
    });

    // Reproducir sonido (opcional)
    this.playNotificationSound(notification.tipo);
  }

  /**
   * Obtener título de la notificación
   */
  private getNotificationTitle(tipo: string): string {
    switch (tipo) {
      case 'RESERVA_APROBADA':
        return '✅ Reserva Aprobada';
      case 'RESERVA_RECHAZADA':
        return '❌ Reserva Rechazada';
      case 'RESERVA_AUTO_RECHAZADA':
        return '⚠️ Reserva Auto-Rechazada';
      case 'RESERVA_CANCELADA':
        return '🚫 Reserva Cancelada';
      case 'NUEVA_RESERVA_ADMIN':
        return '🔔 Nueva Reserva Pendiente';
      case 'USER_ROLE_UPDATED':
        return '👤 Rol Actualizado';
      default:
        return '📢 Notificación';
    }
  }

  /**
   * Mostrar estado de conexión
   */
  private showConnectionStatus(message: string, severity: 'success' | 'info' | 'warn' | 'error'): void {
    this.messageService.add({
      severity: severity,
      summary: 'Estado de Conexión',
      detail: message,
      life: 3000
    });
  }

  /**
   * Reproducir sonido de notificación (opcional)
   */
  private playNotificationSound(tipo: string): void {
    try {
      // Solo reproducir sonido para notificaciones importantes
      if (tipo === 'RESERVA_APROBADA' || tipo === 'RESERVA_RECHAZADA' || tipo === 'NUEVA_RESERVA_ADMIN' || tipo === 'USER_ROLE_UPDATED') {
        // Crear un audio context para reproducir un beep simple
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar tono según el tipo
        switch (tipo) {
          case 'RESERVA_APROBADA':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Tono alto
            break;
          case 'RESERVA_RECHAZADA':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Tono bajo
            break;
          case 'USER_ROLE_UPDATED':
            oscillator.frequency.setValueAtTime(700, audioContext.currentTime); // Tono medio-alto
            break;
          default:
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Tono medio
        }
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      // Silenciar errores de audio
      console.debug('Audio notification not available:', error);
    }
  }

  /**
   * Manejar actualización de rol del usuario
   */
  private handleRoleUpdate(notification: ReservaNotification): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      
      // Verificar que la notificación es para el usuario actual
      if (!currentUser || currentUser.id !== notification.usuarioId) {
        console.warn('⚠️ Notificación de rol no es para el usuario actual, ignorando');
        return;
      }
      
      // Verificar que el rol realmente cambió
      if (currentUser.role === notification.estadoNuevo) {
        console.log('ℹ️ El rol ya está actualizado, no es necesario procesar');
        return;
      }
      
      // Actualizar rol en el AuthService
      this.authService.updateUserRole(notification.estadoNuevo);
      
      console.log('🔄 Rol actualizado en tiempo real:', {
        usuarioId: notification.usuarioId,
        rolAnterior: notification.estadoAnterior,
        rolNuevo: notification.estadoNuevo
      });
      
      // Mostrar toast específico para cambio de rol (solo una vez)
      this.messageService.add({
        severity: 'warn',
        summary: '👤 Rol Actualizado',
        detail: `Tu rol ha sido cambiado de ${notification.estadoAnterior} a ${notification.estadoNuevo}. Los permisos se han actualizado automáticamente.`,
        life: 8000, // 8 segundos
        sticky: false // No sticky para evitar acumulación
      });
      
    } catch (error) {
      console.error('Error manejando actualización de rol:', error);
    }
  }

  /**
   * Mostrar notificación manual (para testing)
   */
  showTestNotification(): void {
    this.messageService.add({
      severity: 'info',
      summary: '🧪 Notificación de Prueba',
      detail: 'Sistema de notificaciones en tiempo real funcionando correctamente',
      life: 3000
    });
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(): void {
    this.messageService.clear();
  }

  /**
   * Destruir servicio
   */
  destroy(): void {
    this.disconnectWebSocket();
    this.isInitialized = false;
  }
}