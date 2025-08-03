import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) { }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, title: string = 'Éxito') {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000
    });
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, title: string = 'Error') {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, title: string = 'Advertencia') {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  showInfo(message: string, title: string = 'Información') {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 3000
    });
  }

  /**
   * Limpia todos los mensajes
   */
  clear() {
    this.messageService.clear();
  }
}