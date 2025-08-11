import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { GoogleCalendarService, GoogleCalendarStatusResponse } from '../../services/google-calendar.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-google-calendar-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule
  ],
  template: `
    <div class="p-4 max-w-2xl mx-auto">
      <p-card>
        <ng-template pTemplate="header">
          <div class="flex items-center gap-3 p-4">
            <i class="pi pi-calendar text-2xl text-primary"></i>
            <div>
              <h2 class="text-xl font-semibold text-gray-800 m-0">
                Integración con Google Calendar
              </h2>
              <p class="text-sm text-gray-600 m-0 mt-1">
                Sincroniza tus reservas automáticamente con tu calendario de Google
              </p>
            </div>
          </div>
        </ng-template>

        <div class="space-y-4">
          <!-- Estado de conexión -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" 
                   [class]="isConnected() ? 'bg-green-500' : 'bg-gray-400'">
              </div>
              <div>
                <h3 class="font-medium text-gray-800">
                  Estado de conexión
                </h3>
                <p class="text-sm text-gray-600">
                  {{ connectionMessage() }}
                </p>
              </div>
            </div>
            
            @if (isLoading()) {
              <p-progressSpinner styleClass="w-8 h-8"></p-progressSpinner>
            }
          </div>

          <!-- Información sobre la integración -->
          <p-message 
            severity="info" 
            text="Al conectar Google Calendar, todas tus reservas aprobadas se sincronizarán automáticamente con tu calendario personal."
            [closable]="false">
          </p-message>

          <p-divider></p-divider>

          <!-- Botones de acción -->
          <div class="flex gap-3 flex-wrap">
            @if (!isConnected()) {
              <p-button 
                label="Conectar Google Calendar"
                icon="pi pi-google"
                [loading]="isLoading()"
                (onClick)="connectToGoogleCalendar()"
                styleClass="p-button-success">
              </p-button>
            } @else {
              <p-button 
                label="Desconectar"
                icon="pi pi-times"
                severity="danger"
                [loading]="isLoading()"
                (onClick)="disconnectFromGoogleCalendar()">
              </p-button>
              
              <p-button 
                label="Sincronizar Todo"
                icon="pi pi-refresh"
                severity="secondary"
                [loading]="isLoading()"
                (onClick)="syncAllReservations()">
              </p-button>
            }
            
            <p-button 
              label="Actualizar Estado"
              icon="pi pi-sync"
              severity="help"
              [loading]="isLoading()"
              (onClick)="checkConnectionStatus()">
            </p-button>
          </div>

          <!-- Características de la integración -->
          @if (isConnected()) {
            <div class="mt-6">
              <h4 class="font-medium text-gray-800 mb-3">
                Características activas:
              </h4>
              <ul class="space-y-2 text-sm text-gray-600">
                <li class="flex items-center gap-2">
                  <i class="pi pi-check text-green-500"></i>
                  Creación automática de eventos al aprobar reservas
                </li>
                <li class="flex items-center gap-2">
                  <i class="pi pi-check text-green-500"></i>
                  Actualización de eventos cuando cambian las reservas
                </li>
                <li class="flex items-center gap-2">
                  <i class="pi pi-check text-green-500"></i>
                  Eliminación de eventos al cancelar reservas
                </li>
                <li class="flex items-center gap-2">
                  <i class="pi pi-check text-green-500"></i>
                  Sincronización en tiempo real
                </li>
              </ul>
            </div>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .text-primary {
      color: #8F141B;
    }
  `]
})
export class GoogleCalendarConfigComponent implements OnInit {
  private googleCalendarService = inject(GoogleCalendarService);
  private toastService = inject(ToastService);

  // Signals para el estado del componente
  isConnected = signal(false);
  isLoading = signal(false);
  connectionMessage = signal('Verificando estado...');

  ngOnInit() {
    this.checkConnectionStatus();
    
    // Suscribirse a cambios en el estado de conexión
    this.googleCalendarService.connectionStatus$.subscribe(status => {
      this.isConnected.set(status);
      this.connectionMessage.set(
        status ? 'Conectado a Google Calendar' : 'No conectado a Google Calendar'
      );
    });
  }

  async connectToGoogleCalendar() {
    this.isLoading.set(true);
    
    try {
      // Obtener URL de autorización
      const response = await this.googleCalendarService.getAuthorizationUrl().toPromise();
      
      if (response?.connected) {
        this.toastService.showSuccess('Ya estás conectado a Google Calendar');
        return;
      }

      if (!response?.authorizationUrl) {
        throw new Error('No se pudo obtener la URL de autorización');
      }

      // Abrir ventana de autorización
      const authCode = await this.googleCalendarService.openAuthorizationWindow(response.authorizationUrl);
      
      // Procesar código de autorización
      const connectResponse = await this.googleCalendarService.connectToGoogleCalendar({
        authorizationCode: authCode
      }).toPromise();

      if (connectResponse?.connected) {
        this.toastService.showSuccess('¡Conectado exitosamente a Google Calendar!');
      } else {
        throw new Error(connectResponse?.message || 'Error al conectar');
      }

    } catch (error: any) {
      console.error('Error conectando a Google Calendar:', error);
      this.toastService.showError(
        error.message || 'Error al conectar con Google Calendar'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async disconnectFromGoogleCalendar() {
    this.isLoading.set(true);
    
    try {
      const response = await this.googleCalendarService.disconnectFromGoogleCalendar().toPromise();
      
      if (!response?.connected) {
        this.toastService.showSuccess('Desconectado exitosamente de Google Calendar');
      } else {
        throw new Error(response.message || 'Error al desconectar');
      }

    } catch (error: any) {
      console.error('Error desconectando de Google Calendar:', error);
      this.toastService.showError(
        error.message || 'Error al desconectar de Google Calendar'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async syncAllReservations() {
    this.isLoading.set(true);
    
    try {
      await this.googleCalendarService.syncAllReservations().toPromise();
      this.toastService.showSuccess('Sincronización completada exitosamente');

    } catch (error: any) {
      console.error('Error sincronizando reservas:', error);
      this.toastService.showError(
        'Error al sincronizar las reservas con Google Calendar'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async checkConnectionStatus() {
    this.isLoading.set(true);
    
    try {
      await this.googleCalendarService.checkConnectionStatus().toPromise();
      
    } catch (error: any) {
      console.error('Error verificando estado:', error);
      this.toastService.showError(
        'Error al verificar el estado de conexión'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
