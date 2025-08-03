import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    DynamicDialogModule,
    // Import standalone components here
    ConfirmDialogComponent
  ],
  exports: [
    // Export the standalone component
    ConfirmDialogComponent,
    // Re-export the modules that components might need
    DialogModule,
    ButtonModule,
    DynamicDialogModule
  ]
})
export class SharedModule { }
