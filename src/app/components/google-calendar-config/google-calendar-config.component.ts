import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { GoogleCalendarService, GoogleCalendarStatusResponse, GoogleCalendarSyncResponse } from '../../services/google-calendar.service';
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
    DividerModule,
    DialogModule
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

      <!-- Diálogo de estadísticas de sincronización -->
      <p-dialog 
        [visible]="showSyncResults()" 
        (visibleChange)="onDialogVisibleChange($event)"
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        header="Resultados de Sincronización"
        styleClass="max-w-md">
        
        @if (syncResults()) {
          <div class="space-y-4">
            <!-- Estado general -->
            <div class="text-center">
              @if (syncResults()!.success) {
                <i class="pi pi-check-circle text-4xl text-green-500"></i>
                <h3 class="text-lg font-semibold text-green-800 mt-2">
                  ¡Sincronización Exitosa!
                </h3>
              } @else {
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                <h3 class="text-lg font-semibold text-orange-800 mt-2">
                  Sincronización con Advertencias
                </h3>
              }
              <p class="text-sm text-gray-600 mt-1">
                {{ syncResults()!.message }}
              </p>
            </div>

            <!-- Estadísticas -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-800 mb-3">Estadísticas Detalladas:</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total de reservas:</span>
                  <span class="font-medium">{{ syncResults()!.totalReservas }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Sincronizadas:</span>
                  <span class="font-medium text-green-600">{{ syncResults()!.reservasSincronizadas }}</span>
                </div>
                @if (syncResults()!.errores > 0) {
                  <div class="flex justify-between">
                    <span class="text-gray-600">Errores:</span>
                    <span class="font-medium text-red-600">{{ syncResults()!.errores }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Mensaje adicional si hay errores -->
            @if (syncResults()!.errores > 0) {
              <p-message 
                severity="warn" 
                text="Algunas reservas no pudieron sincronizarse. Puedes intentar de nuevo más tarde o verificar el estado de esas reservas específicas."
                [closable]="false">
              </p-message>
            }
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button 
            label="Cerrar" 
            icon="pi pi-times"
            severity="secondary"
            (onClick)="closeSyncResults()">
          </p-button>
        </ng-template>
      </p-dialog>
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
  
  // Signals para el diálogo de resultados de sincronización
  showSyncResults = signal(false);
  syncResults = signal<GoogleCalendarSyncResponse | null>(null);

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
      const response = await firstValueFrom(this.googleCalendarService.getAuthorizationUrl());
      
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
      const connectResponse = await firstValueFrom(this.googleCalendarService.connectToGoogleCalendar({
        authorizationCode: authCode
      }));

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
      const response = await firstValueFrom(this.googleCalendarService.disconnectFromGoogleCalendar());
      
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
      const response = await firstValueFrom(this.googleCalendarService.syncAllReservations());
      
      if (response) {
        // Guardar los resultados y mostrar el diálogo
        this.syncResults.set(response);
        this.showSyncResults.set(true);
        
        // También mostrar un toast básico
        if (response.success) {
          this.toastService.showSuccess('Sincronización completada');
        } else {
          this.toastService.showWarning('Sincronización completada con advertencias');
        }
      }

    } catch (error: any) {
      console.error('Error sincronizando reservas:', error);
      
      // Mostrar información de error en el diálogo
      this.syncResults.set({
        success: false,
        connected: this.isConnected(),
        message: error.error?.message || error.message || 'Error desconocido durante la sincronización',
        totalReservas: 0,
        reservasSincronizadas: 0,
        errores: 1
      });
      this.showSyncResults.set(true);
      
      this.toastService.showError(
        'Error al sincronizar las reservas con Google Calendar'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  closeSyncResults() {
    this.showSyncResults.set(false);
    this.syncResults.set(null);
  }

  onDialogVisibleChange(visible: boolean) {
    if (!visible) {
      this.closeSyncResults();
    }
  }

  async checkConnectionStatus() {
    this.isLoading.set(true);
    
    try {
      await firstValueFrom(this.googleCalendarService.checkConnectionStatus());
      
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
