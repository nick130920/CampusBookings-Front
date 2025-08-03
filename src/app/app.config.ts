import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { AuthErrorInterceptor } from './interceptors/auth-error.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { NotificationService } from './services/notification.service';

// Configuración del tema USCO para PrimeNG
const USCOPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{red.50}',
      100: '{red.100}',
      200: '{red.200}',
      300: '{red.300}',
      400: '{red.400}',
      500: '#8F141B', // Vino tinto USCO
      600: '#7B1218',
      700: '#621015',
      800: '#4A0C10',
      900: '#31080B',
      950: '#1A0406'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#8F141B',
          contrastColor: '#ffffff',
          hoverColor: '#7B1218',
          activeColor: '#621015'
        },
        highlight: {
          background: '#DFD4A6', // Ocre USCO
          focusBackground: '#F9F6ED',
          color: '#4D626C', // Gris USCO
          focusColor: '#2E3B41'
        }
      },
      dark: {
        primary: {
          color: '#C0392B',
          contrastColor: '#000000',
          hoverColor: '#E74C3C',
          activeColor: '#A93226'
        },
        highlight: {
          background: '#4D626C',
          focusBackground: '#5D737E',
          color: '#DFD4A6',
          focusColor: '#F9F6ED'
        }
      }
    }
  }
});

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
    providePrimeNG({
      theme: {
        preset: USCOPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false
        }
      },
      ripple: true,
      inputStyle: 'outlined'
    }),
    MessageService,
    ConfirmationService,
    NotificationService
  ]
};
