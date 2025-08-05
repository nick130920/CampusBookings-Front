import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';

// Services
import { SystemConfigService, SystemConfig } from '../../../services/system-config.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG Components
    ButtonModule,
    InputNumberModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule
  ],
  templateUrl: './system-config.component.html',
  styleUrls: ['./system-config.component.css']
})
export class SystemConfigComponent implements OnInit {
  configForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  currentConfig: SystemConfig | null = null;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private systemConfigService = inject(SystemConfigService);
  private toastService = inject(ToastService);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCurrentConfig();
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      minDaysAdvance: [2, [Validators.required, Validators.min(0), Validators.max(7)]],
      maxDaysAdvance: [90, [Validators.required, Validators.min(7), Validators.max(365)]]
    });

    // Validación cruzada: maxDays debe ser mayor que minDays
    this.configForm.setValidators(this.validateDateRange.bind(this));
  }

  private validateDateRange(control: AbstractControl): { [key: string]: any } | null {
    const form = control as FormGroup;
    if (!form || !form.get) {
      return null;
    }
    
    const minDays = form.get('minDaysAdvance')?.value;
    const maxDays = form.get('maxDaysAdvance')?.value;
    
    if (minDays && maxDays && minDays >= maxDays) {
      return { dateRangeInvalid: true };
    }
    
    return null;
  }

  private loadCurrentConfig(): void {
    this.isLoading = true;
    this.systemConfigService.loadConfig().subscribe({
      next: (config) => {
        this.currentConfig = config;
        this.configForm.patchValue({
          minDaysAdvance: config.minDaysAdvance,
          maxDaysAdvance: config.maxDaysAdvance
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading config:', error);
        this.toastService.showError('Error al cargar la configuración del sistema');
        this.isLoading = false;
        
        // Usar valores por defecto si hay error
        this.currentConfig = {
          minDaysAdvance: 2,
          maxDaysAdvance: 90
        };
      }
    });
  }

  onSave(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.configForm.value;
    
    this.systemConfigService.updateConfig(formValue).subscribe({
      next: (updatedConfig) => {
        this.currentConfig = updatedConfig;
        this.toastService.showSuccess('Configuración actualizada correctamente');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating config:', error);
        this.toastService.showError('Error al actualizar la configuración');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    if (this.currentConfig) {
      this.configForm.patchValue({
        minDaysAdvance: this.currentConfig.minDaysAdvance,
        maxDaysAdvance: this.currentConfig.maxDaysAdvance
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.configForm.controls).forEach(key => {
      const control = this.configForm.get(key);
      control?.markAsTouched();
    });
  }

  get hasFormErrors(): boolean {
    return this.configForm.invalid && this.configForm.touched;
  }

  get dateRangeError(): boolean {
    return this.configForm.hasError('dateRangeInvalid') && this.configForm.touched;
  }

  get minDaysError(): string | null {
    const control = this.configForm.get('minDaysAdvance');
    if (control?.invalid && control?.touched) {
      if (control?.errors?.['required']) return 'Este campo es requerido';
      if (control?.errors?.['min']) return 'El valor mínimo es 0 días';
      if (control?.errors?.['max']) return 'El valor máximo es 7 días';
    }
    return null;
  }

  get maxDaysError(): string | null {
    const control = this.configForm.get('maxDaysAdvance');
    if (control?.invalid && control?.touched) {
      if (control?.errors?.['required']) return 'Este campo es requerido';
      if (control?.errors?.['min']) return 'El valor mínimo es 7 días';
      if (control?.errors?.['max']) return 'El valor máximo es 365 días';
    }
    return null;
  }
}