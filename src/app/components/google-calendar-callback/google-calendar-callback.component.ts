import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-google-calendar-callback',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, MessageModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      @if (isProcessing) {
        <div class="text-center">
          <p-progressSpinner styleClass="w-16 h-16"></p-progressSpinner>
          <h2 class="text-xl font-semibold mt-4 text-gray-800">
            Procesando autorización...
          </h2>
          <p class="text-gray-600 mt-2">
            Por favor espera mientras configuramos tu conexión con Google Calendar
          </p>
        </div>
      } @else if (errorMessage) {
        <div class="text-center max-w-md">
          <p-message 
            severity="error" 
            [text]="errorMessage"
            [closable]="false">
          </p-message>
          <p class="text-gray-600 mt-4">
            Puedes cerrar esta ventana y volver a intentar desde la configuración.
          </p>
        </div>
      } @else {
        <div class="text-center max-w-md">
          <p-message 
            severity="success" 
            text="¡Autorización exitosa! Google Calendar ha sido conectado."
            [closable]="false">
          </p-message>
          <p class="text-gray-600 mt-4">
            Puedes cerrar esta ventana. La sincronización está ahora activa.
          </p>
        </div>
      }
    </div>
  `
})
export class GoogleCalendarCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  isProcessing = true;
  errorMessage = '';

  ngOnInit() {
    this.processCallback();
  }

  private processCallback() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];

      if (error) {
        this.handleError(error);
        return;
      }

      if (code) {
        this.handleSuccess(code);
        return;
      }

      this.handleError('No se recibió código de autorización');
    });
  }

  private handleSuccess(code: string) {
    this.isProcessing = false;
    
    // Enviar el código de autorización a la ventana padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
        code: code
      }, window.location.origin);
      
      window.close();
    }
  }

  private handleError(error: string) {
    this.isProcessing = false;
    this.errorMessage = `Error en la autorización: ${error}`;
    
    // Enviar el error a la ventana padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_CALENDAR_AUTH_ERROR',
        error: error
      }, window.location.origin);
      
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }
}
