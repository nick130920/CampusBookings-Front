import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FeedbackService, FeedbackResponse, FeedbackRequest, FeedbackUpdateRequest, EstadisticasFeedback, PageResponse } from '../../services/feedback.service';
import { ToastService } from '../../services/toast.service';
import { firstValueFrom } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { RatingModule } from 'primeng/rating';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG Components
    ButtonModule,
    TextareaModule,
    RatingModule,
    CardModule,
    DialogModule,
    MessageModule,
    FloatLabelModule,
    ConfirmDialogModule,
    PaginatorModule,
    ProgressSpinnerModule,
    AvatarModule,
    DividerModule
  ],
  providers: [ConfirmationService],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  @Input() escenarioId!: number;
  @Input() escenarioNombre!: string;
  @Input() mostrarEstadisticas = true;
  @Input() mostrarListaFeedbacks = true;
  @Input() soloLectura = false;
  @Output() feedbackCreado = new EventEmitter<FeedbackResponse>();
  @Output() feedbackActualizado = new EventEmitter<FeedbackResponse>();

  // Formularios
  feedbackForm: FormGroup<{
    calificacion: FormControl<number | null>;
    comentario: FormControl<string | null>;
  }>;

  // Estados
  isLoading = false;
  isSaving = false;
  mostrarFormulario = false;
  modoEdicion = false;
  
  // Datos
  miFeedback: FeedbackResponse | null = null;
  feedbacks: FeedbackResponse[] = [];
  estadisticas: EstadisticasFeedback | null = null;
  
  // Paginación
  currentPage = 0;
  pageSize = 5;
  totalRecords = 0;
  
  // Mensajes
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.feedbackForm = this.fb.group({
      calificacion: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
      comentario: new FormControl<string | null>('', [Validators.maxLength(1000)])
    });
  }

  ngOnInit() {
    if (this.escenarioId) {
      this.cargarDatos();
    }
  }

  // Getters para los controles del formulario
  get calificacion() { return this.feedbackForm.get('calificacion'); }
  get comentario() { return this.feedbackForm.get('comentario'); }

  /**
   * Cargar todos los datos necesarios
   */
  async cargarDatos() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      await Promise.all([
        this.cargarMiFeedback(),
        this.cargarEstadisticas(),
        this.cargarFeedbacks()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.errorMessage = 'Error al cargar los datos del feedback';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cargar el feedback del usuario actual para este escenario
   */
  async cargarMiFeedback() {
    try {
      this.miFeedback = await firstValueFrom(this.feedbackService.obtenerMiFeedbackParaEscenario(this.escenarioId)) || null;
      
      if (this.miFeedback) {
        // Si ya existe feedback, llenar el formulario con los datos actuales
        this.feedbackForm.patchValue({
          calificacion: this.miFeedback.calificacion,
          comentario: this.miFeedback.comentario || ''
        });
      }
    } catch (error) {
      console.error('Error cargando mi feedback:', error);
    }
  }

  /**
   * Cargar estadísticas del escenario
   */
  async cargarEstadisticas() {
    if (!this.mostrarEstadisticas) return;
    
    try {
      this.estadisticas = await firstValueFrom(this.feedbackService.obtenerEstadisticasFeedback(this.escenarioId)) || null;
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  /**
   * Cargar lista de feedbacks
   */
  async cargarFeedbacks() {
    if (!this.mostrarListaFeedbacks) return;
    
    try {
      const response = await firstValueFrom(this.feedbackService.obtenerFeedbacksPorEscenario(
        this.escenarioId, 
        this.currentPage, 
        this.pageSize
      ));

      if (response) {
        this.feedbacks = response.content;
        this.totalRecords = response.totalElements;
      }
    } catch (error) {
      console.error('Error cargando feedbacks:', error);
    }
  }

  /**
   * Mostrar formulario para crear o editar feedback
   */
  mostrarFormularioFeedback() {
    this.mostrarFormulario = true;
    this.modoEdicion = !!this.miFeedback;
    this.errorMessage = '';
  }

  /**
   * Ocultar formulario
   */
  ocultarFormulario() {
    this.mostrarFormulario = false;
    this.errorMessage = '';
    this.feedbackForm.reset();
    
    if (this.miFeedback) {
      this.feedbackForm.patchValue({
        calificacion: this.miFeedback.calificacion,
        comentario: this.miFeedback.comentario || ''
      });
    }
  }

  /**
   * Enviar formulario de feedback
   */
  async onSubmit() {
    if (this.feedbackForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const formValue = this.feedbackForm.value;
      
      if (this.modoEdicion && this.miFeedback) {
        // Actualizar feedback existente
        const request: FeedbackUpdateRequest = {
          calificacion: formValue.calificacion!,
          comentario: formValue.comentario || undefined
        };
        
        const updated = await firstValueFrom(this.feedbackService.actualizarFeedback(this.miFeedback.id, request));
        if (updated) {
          this.miFeedback = updated;
          this.toastService.showSuccess('Feedback actualizado exitosamente');
          this.feedbackActualizado.emit(updated);
        }
      } else {
        // Crear nuevo feedback
        const request: FeedbackRequest = {
          escenarioId: this.escenarioId,
          calificacion: formValue.calificacion!,
          comentario: formValue.comentario || undefined
        };
        
        const created = await firstValueFrom(this.feedbackService.crearFeedback(request));
        if (created) {
          this.miFeedback = created;
          this.toastService.showSuccess('Feedback creado exitosamente');
          this.feedbackCreado.emit(created);
        }
      }
      
      this.ocultarFormulario();
      await this.cargarDatos(); // Recargar datos actualizados
      
    } catch (error: any) {
      console.error('Error guardando feedback:', error);
      this.errorMessage = error.error?.message || 'Error al guardar el feedback';
      this.toastService.showError(this.errorMessage);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Eliminar feedback
   */
  eliminarFeedback() {
    if (!this.miFeedback) return;

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu feedback? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        if (!this.miFeedback) return;
        
        try {
          await firstValueFrom(this.feedbackService.eliminarFeedback(this.miFeedback.id));
          this.miFeedback = null;
          this.feedbackForm.reset();
          this.toastService.showSuccess('Feedback eliminado exitosamente');
          await this.cargarDatos();
        } catch (error) {
          console.error('Error eliminando feedback:', error);
          this.toastService.showError('Error al eliminar el feedback');
        }
      }
    });
  }

  /**
   * Cambiar página en el paginador
   */
  async onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    await this.cargarFeedbacks();
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    return this.feedbackService.formatearFecha(fecha);
  }

  /**
   * Obtener texto de calificación
   */
  obtenerTextoCalificacion(calificacion: number): string {
    return this.feedbackService.obtenerTextoCalificacion(calificacion);
  }

  /**
   * Generar array de estrellas
   */
  generarEstrellas(calificacion: number): boolean[] {
    return this.feedbackService.generarEstrellas(calificacion);
  }

  /**
   * Obtener iniciales del usuario
   */
  obtenerIniciales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  /**
   * Obtener porcentaje para la barra de distribución
   */
  obtenerPorcentaje(cantidad: number): number {
    if (!this.estadisticas || this.estadisticas.totalFeedbacks === 0) {
      return 0;
    }
    return (cantidad / this.estadisticas.totalFeedbacks) * 100;
  }
}
