import { Injectable } from '@angular/core';
import { fromEvent, merge, Observable, timer } from 'rxjs';
import { debounceTime, startWith, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
  private readonly WARNING_TIME = 5 * 60 * 1000; // Advertir 5 minutos antes
  private readonly DEBOUNCE_TIME = 1000; // 1 segundo de debounce para eventos
  
  private inactivityTimer: any;
  private warningTimer: any;
  private lastActivity: Date = new Date();
  private isWarningShown = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    // Escuchar eventos de login/logout para iniciar/detener monitoreo
    this.setupEventListeners();
  }

  /**
   * Configurar listeners de eventos de autenticación
   */
  private setupEventListeners(): void {
    // Escuchar cuando el usuario se loguea
    window.addEventListener('user-logged-in', () => {
      this.startMonitoring();
    });

    // Escuchar cuando el usuario se desloguea
    window.addEventListener('user-logged-out', () => {
      this.stopMonitoring();
    });

    // Si ya hay un usuario logueado al inicializar, empezar el monitoreo
    if (this.authService.isLoggedIn()) {
      setTimeout(() => this.startMonitoring(), 1000);
    }
  }

  /**
   * Iniciar el monitoreo de actividad del usuario
   */
  startMonitoring(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    // Eventos que consideramos como actividad del usuario
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Crear observable de actividad
    const activityObservable = merge(
      ...activityEvents.map(event => fromEvent(document, event))
    ).pipe(
      debounceTime(this.DEBOUNCE_TIME),
      startWith(null) // Iniciar inmediatamente
    );

    // Suscribirse a la actividad
    activityObservable.subscribe(() => {
      this.recordActivity();
    });

    console.log('🕒 Monitoreo de inactividad iniciado (30 minutos)');
  }

  /**
   * Detener el monitoreo de actividad
   */
  stopMonitoring(): void {
    this.clearTimers();
    console.log('🛑 Monitoreo de inactividad detenido');
  }

  /**
   * Registrar actividad del usuario
   */
  recordActivity(): void {
    this.lastActivity = new Date();
    this.isWarningShown = false;
    
    // Reiniciar timers
    this.resetTimers();
  }

  /**
   * Obtener tiempo de inactividad actual en minutos
   */
  getInactivityTime(): number {
    const now = new Date();
    const diff = now.getTime() - this.lastActivity.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * Verificar si el usuario está inactivo
   */
  isUserInactive(): boolean {
    const inactiveTime = this.getInactivityTime();
    return inactiveTime >= (this.INACTIVITY_TIMEOUT / (1000 * 60));
  }

  /**
   * Reiniciar los timers de inactividad
   */
  private resetTimers(): void {
    this.clearTimers();
    
    // Timer para mostrar advertencia (5 minutos antes de expirar)
    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.INACTIVITY_TIMEOUT - this.WARNING_TIME);

    // Timer para cerrar sesión por inactividad
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Limpiar timers
   */
  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Mostrar advertencia de inactividad
   */
  private showInactivityWarning(): void {
    if (this.isWarningShown || !this.authService.isLoggedIn()) {
      return;
    }

    this.isWarningShown = true;
    
    this.toastService.showWarning(
      'Tu sesión expirará en 5 minutos por inactividad. Realiza cualquier acción para mantenerla activa.',
      'Sesión por Expirar'
    );

    console.log('⚠️ Advertencia de inactividad mostrada');
  }

  /**
   * Manejar timeout por inactividad
   */
  private handleInactivityTimeout(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    console.log('⏰ Sesión expirada por inactividad');
    
    this.toastService.showWarning(
      'Tu sesión ha expirado debido a 30 minutos de inactividad. Por seguridad, debes iniciar sesión nuevamente.',
      'Sesión Expirada por Inactividad'
    );

    // Cerrar sesión
    this.authService.logout();
    
    // Redirigir al login
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { 
          reason: 'inactivity',
          returnUrl: this.router.routerState.snapshot.url 
        }
      });
    }, 2000); // 2 segundos para que lea el mensaje
  }

  /**
   * Extender sesión manualmente (para botones de "mantener sesión")
   */
  extendSession(): void {
    this.recordActivity();
    this.toastService.showInfo('Sesión extendida exitosamente', 'Sesión Activa');
    console.log('🔄 Sesión extendida manualmente');
  }

  /**
   * Obtener el tiempo restante antes de expirar (en minutos)
   */
  getTimeUntilExpiration(): number {
    const timeSinceActivity = new Date().getTime() - this.lastActivity.getTime();
    const timeRemaining = this.INACTIVITY_TIMEOUT - timeSinceActivity;
    return Math.max(0, Math.floor(timeRemaining / (1000 * 60)));
  }
}