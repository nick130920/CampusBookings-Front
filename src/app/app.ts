import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// PrimeNG imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
// Services
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected title = 'CampusBookings';
  
  // Inject notification service to initialize it
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    // El NotificationService se inicializa automáticamente al ser inyectado
    console.log('🔔 Sistema de notificaciones en tiempo real iniciado');
  }

  ngOnDestroy(): void {
    // Cleanup notifications on app destroy
    this.notificationService.destroy();
  }
}
