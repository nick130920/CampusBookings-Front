import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { AuthErrorInterceptor } from './interceptors/auth-error.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { NotificationService } from './services/notification.service';
import { USCOThemeConfig } from './theme';



// HTTP interceptors
const httpInterceptors = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ 
      eventCoalescing: true
    }),
    provideBrowserGlobalErrorListeners(),    
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi()
    ),
    httpInterceptors,
    provideAnimationsAsync(),
    providePrimeNG(USCOThemeConfig),
    MessageService,
    ConfirmationService,
    NotificationService
  ]
};
