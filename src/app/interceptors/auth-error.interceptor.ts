import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private sessionExpiredShown = false; // Evitar múltiples notificaciones

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.handleSessionExpired();
        }
        return throwError(() => error);
      })
    );
  }

  private handleSessionExpired(): void {
    // Evitar múltiples notificaciones simultáneas
    if (this.sessionExpiredShown) {
      return;
    }
    
    this.sessionExpiredShown = true;

    // Verificar si el usuario está autenticado para determinar el mensaje apropiado
    const isLoggedIn = this.authService.getCurrentUser() !== null;
    
    if (isLoggedIn) {
      // Sesión expiró en el servidor (JWT token expirado)
      this.toastService.showWarning(
        'Tu sesión ha expirado en el servidor. Por favor, inicia sesión nuevamente.',
        'Token Expirado'
      );
    } else {
      // Token no válido o acceso no autorizado
      this.toastService.showError(
        'No tienes autorización para acceder a este recurso. Por favor, inicia sesión.',
        'Acceso Denegado'
      );
    }

    // Limpiar datos de sesión
    this.authService.logout();
    
    // Redirigir al login con la URL de retorno
    const returnUrl = this.router.routerState.snapshot.url;
    
    // Dar un pequeño delay para que el usuario vea el mensaje
    setTimeout(() => {
      this.router.navigate(['/login'], { 
        queryParams: returnUrl !== '/login' ? { returnUrl, reason: 'token-expired' } : { reason: 'token-expired' } 
      });
      
      // Reset flag después de redirigir
      this.sessionExpiredShown = false;
    }, 1500);
  }
}
