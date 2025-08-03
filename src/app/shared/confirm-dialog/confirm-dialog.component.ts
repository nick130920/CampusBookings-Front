import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// PrimeNG imports
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-exclamation-triangle text-amber-500 text-2xl mr-3"></i>
        <h2 class="text-lg font-semibold text-gray-900">{{ data.title }}</h2>
      </div>
      <div class="mb-6">
        <p class="text-gray-700">{{ data.message }}</p>
      </div>
      <div class="flex justify-end space-x-2">
        <p-button 
          label="{{ data.cancelText || 'Cancelar' }}"
          [outlined]="true"
          severity="secondary"
          (onClick)="dialogRef.close(false)">
        </p-button>
        <p-button 
          label="{{ data.confirmText || 'Aceptar' }}"
          severity="danger"
          (onClick)="dialogRef.close(true)">
        </p-button>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos personalizados para PrimeNG Dialog */
    .p-6 {
      padding: 1.5rem;
    }
  `]
})
export class ConfirmDialogComponent {
  data: ConfirmDialogData;

  constructor(
    public dialogRef: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = this.config.data;
  }
}
