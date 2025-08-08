import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputOtpModule } from 'primeng/inputotp';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';

// Services
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputOtpModule,
    PasswordModule,
    FloatLabelModule,
    MessageModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Formularios para cada paso
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  passwordForm!: FormGroup;

  // Estado del componente
  step = 1; // 1: Email, 2: Código, 3: Nueva contraseña, 4: Éxito
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Para el reenvío de código
  canResend = false;
  countdown = 60;
  private countdownSubscription?: Subscription;
  
  // Email enmascarado para mostrar en paso 2
  maskedEmail = '';
  
  // Token de verificación
  private verificationToken = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.step = 1;
  }

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private initializeForms() {
    // Formulario para el email
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para el código
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // Formulario para la nueva contraseña
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validator personalizado para confirmar contraseña
  private passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Getters para acceso fácil a los controles
  get emailControl() { return this.emailForm.get('email'); }
  get codeControl() { return this.codeForm.get('code'); }
  get newPasswordControl() { return this.passwordForm.get('newPassword'); }
  get confirmPasswordControl() { return this.passwordForm.get('confirmPassword'); }

  // Paso 1: Enviar código al email
  async onSendCode() {
    if (this.emailForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const email = this.emailControl?.value;
      
      // Llamar al servicio para enviar el código
      await this.authService.sendPasswordResetCode(email).toPromise();
      
      // Enmascarar el email para mostrar
      this.maskedEmail = this.maskEmail(email);
      
      this.successMessage = 'Código enviado exitosamente a tu correo electrónico.';
      this.step = 2;
      this.startCountdown();
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Error al enviar el código. Por favor intenta nuevamente.';
      this.toastService.showError(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  // Paso 2: Verificar código
  async onVerifyCode() {
    if (this.codeForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const email = this.emailControl?.value;
      const code = this.codeControl?.value;
      
      // Llamar al servicio para verificar el código
      const response = await this.authService.verifyPasswordResetCode(email, code).toPromise();
      
      this.verificationToken = response.token;
      this.step = 3;
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Código inválido. Por favor verifica e intenta nuevamente.';
      this.toastService.showError(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  // Paso 3: Cambiar contraseña
  async onResetPassword() {
    if (this.passwordForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const newPassword = this.newPasswordControl?.value;
      
      // Llamar al servicio para cambiar la contraseña
      await this.authService.resetPassword(this.verificationToken, newPassword).toPromise();
      
      this.step = 4;
      this.toastService.showSuccess('¡Contraseña restablecida exitosamente!');
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Error al cambiar la contraseña. Por favor intenta nuevamente.';
      this.toastService.showError(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  // Reenviar código
  async onResendCode() {
    this.canResend = false;
    this.countdown = 60;
    this.errorMessage = '';
    
    try {
      const email = this.emailControl?.value;
      await this.authService.sendPasswordResetCode(email).toPromise();
      
      this.successMessage = 'Código reenviado exitosamente.';
      this.startCountdown();
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Error al reenviar el código.';
      this.toastService.showError(this.errorMessage);
      this.canResend = true; // Permitir intentar de nuevo inmediatamente
    }
  }

  // Ir al login después del éxito
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Iniciar cuenta regresiva para reenvío
  private startCountdown() {
    this.canResend = false;
    this.countdown = 60;
    
    this.countdownSubscription = interval(1000)
      .pipe(take(60))
      .subscribe({
        next: () => {
          this.countdown--;
          if (this.countdown <= 0) {
            this.canResend = true;
          }
        },
        complete: () => {
          this.canResend = true;
        }
      });
  }

  // Enmascarar email para privacidad
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  }
}