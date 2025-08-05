import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// PrimeNG imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
// Services
import { NotificationService } from './services/notification.service';
import { ActivityService } from './services/activity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected title = 'CampusBookings';
  
  // Inject services to initialize them
  private notificationService = inject(NotificationService);
  private activityService = inject(ActivityService);

  ngOnInit(): void {
    // Los servicios se inicializan automáticamente al ser inyectados
    console.log('🔔 Sistema de notificaciones en tiempo real iniciado');
    console.log('🕒 Sistema de monitoreo de actividad iniciado');
  }

  ngOnDestroy(): void {
    // Cleanup notifications on app destroy
    this.notificationService.destroy();
  }
}
