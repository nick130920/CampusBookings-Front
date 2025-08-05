import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { catchError, throwError, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ActivityService } from '../services/activity.service';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const activityService = inject(ActivityService);
  
  const token = authService.getToken();
  
  if (token) {
    // Verificar si el token está expirado antes de enviarlo
    if (authService.isTokenExpired(token)) {
      // Token expirado localmente, manejar inmediatamente
      toastService.showWarning(
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        'Sesión Expirada'
      );
      
      authService.logout();
      router.navigate(['/login'], { 
        queryParams: { returnUrl: router.routerState.snapshot.url } 
      });
      
      // Retornar error sin hacer la petición
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Token Expired',
        error: { message: 'Token expired locally' }
      }));
    }
    
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    tap((event: HttpEvent<any>) => {
      // Verificar si es una respuesta HTTP exitosa
      if (event instanceof HttpResponse) {
        // Registrar actividad en peticiones exitosas
        if (authService.isLoggedIn()) {
          activityService.recordActivity();
        }
        
        // Verificar si el backend envió un token renovado
        const newToken = event.headers.get('X-New-Token');
        if (newToken) {
          authService.updateToken(newToken);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // El AuthErrorInterceptor manejará los errores 401 del servidor
      return throwError(() => error);
    })
  );
}
