import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastService } from '../../../services/toast.service';
import { Scenario, ScenarioService, ImageUploadConfig, ImageUploadResponse } from '../../../services/scenario.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-scenario-form',
  templateUrl: './scenario-form.component.html',
  styleUrls: ['./scenario-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    AutoCompleteModule,
    DatePickerModule,
    ToggleSwitchModule,
    FloatLabelModule
  ]
})
export class ScenarioFormComponent implements OnInit {
  scenarioForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  scenarioId: number | null = null;

  // Propiedades para manejo de imágenes
  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;
  currentImageUrl: string | null = null;
  imageUploadInProgress = false;
  imageUploadStatus: { success: boolean; message: string } | null = null;
  imageUploadConfig: ImageUploadConfig | null = null;
  isDragOver = false;

  // Opciones para los selects - cargadas dinámicamente del backend
  tiposEscenario: { label: string; value: string }[] = [];
  ubicaciones: { label: string; value: string }[] = [];

  // Características disponibles
  caracteristicasDisponibles: string[] = [
    'Proyector',
    'Aire Acondicionado',
    'WiFi',
    'Computadores',
    'Pizarra',
    'Pizarra Digital',
    'Sillas Móviles',
    'Mesas',
    'Sistema de Sonido',
    'Iluminación Especial',
    'Accesible para Silla de Ruedas',
    'Cocina',
    'Baño Privado'
  ];

  // Para el autocomplete
  caracteristicasSugeridas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private scenarioService: ScenarioService,
    private toastService: ToastService
  ) {
    this.scenarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      tipo: ['', Validators.required],
      ubicacion: ['', Validators.required],
      capacidad: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      disponible: [true],
      caracteristicas: [[]],
      horarioApertura: [''],
      horarioCierre: [''],
      costoPorHora: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Cargar configuración de upload de imágenes
    this.loadImageUploadConfig();
    
    // Cargar datos para los selects
    this.loadTiposEscenario();
    this.loadUbicaciones();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nuevo') {
        this.scenarioId = +id;
        this.isEditMode = true;
        this.loadScenario(this.scenarioId);
      }
    });
  }

  loadScenario(id: number): void {
    this.isLoading = true;
    this.scenarioService.getScenario(id).subscribe({
      next: (scenario) => {
        this.populateForm(scenario);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar el escenario:', error);
                    this.toastService.showError('Error al cargar el escenario');
        this.router.navigate(['/dashboard/escenarios']);
      }
    });
  }

  populateForm(scenario: Scenario): void {
    // Establecer imagen actual
    this.currentImageUrl = scenario.imagenUrl || null;

    // Convertir horarios de string a Date para el datepicker
    let horarioApertura = null;
    let horarioCierre = null;
    
    if (scenario.horarioApertura) {
      horarioApertura = this.parseTimeFromBackend(scenario.horarioApertura);
    }
    
    if (scenario.horarioCierre) {
      horarioCierre = this.parseTimeFromBackend(scenario.horarioCierre);
    }

    // Establecer valores del formulario
    this.scenarioForm.patchValue({
      nombre: scenario.nombre,
      descripcion: scenario.descripcion,
      tipo: scenario.tipo,
      ubicacion: scenario.ubicacion,
      capacidad: scenario.capacidad,
      disponible: scenario.disponible,
      caracteristicas: scenario.caracteristicas || [],
      horarioApertura: horarioApertura,
      horarioCierre: horarioCierre,
      costoPorHora: scenario.costoPorHora || 0
    });
  }

  loadTiposEscenario(): void {
    this.scenarioService.getTiposEscenario().subscribe({
      next: (tipos) => {
        this.tiposEscenario = tipos.map(tipo => ({ label: tipo, value: tipo }));
      },
      error: (error) => {
        console.error('Error al cargar tipos de escenario:', error);
        this.toastService.showError('Error al cargar tipos de escenario');
      }
    });
  }

  loadUbicaciones(): void {
    this.scenarioService.getUbicaciones().subscribe({
      next: (ubicaciones) => {
        this.ubicaciones = ubicaciones.map(ubicacion => ({ label: ubicacion, value: ubicacion }));
      },
      error: (error) => {
        console.error('Error al cargar ubicaciones:', error);
        this.toastService.showError('Error al cargar ubicaciones');
      }
    });
  }

  filterCaracteristicas(event: any): void {
    const query = event.query.toLowerCase();
    this.caracteristicasSugeridas = this.caracteristicasDisponibles.filter(
      caracteristica => caracteristica.toLowerCase().includes(query)
    );
  }

  addCaracteristica(caracteristica: string): void {
    if ((caracteristica || '').trim()) {
      const caracteristicasActuales = this.scenarioForm.get('caracteristicas')?.value || [];
      if (!caracteristicasActuales.includes(caracteristica.trim())) {
        const nuevasCaracteristicas = [...caracteristicasActuales, caracteristica.trim()];
        this.scenarioForm.patchValue({ caracteristicas: nuevasCaracteristicas });
      }
    }
  }

  onSubmit(): void {
    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      this.toastService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const scenarioData = { ...this.scenarioForm.value };

    // Agregar URL de imagen actual (si existe)
    if (this.currentImageUrl) {
      scenarioData.imagenUrl = this.currentImageUrl;
    }

    // Formatear horarios para el backend (LocalTime espera formato HH:mm:ss)
    if (scenarioData.horarioApertura && scenarioData.horarioApertura instanceof Date) {
      scenarioData.horarioApertura = this.formatTimeForBackend(scenarioData.horarioApertura);
    }
    if (scenarioData.horarioCierre && scenarioData.horarioCierre instanceof Date) {
      scenarioData.horarioCierre = this.formatTimeForBackend(scenarioData.horarioCierre);
    }

    // Limpiar campos vacíos
    if (!scenarioData.horarioApertura) delete scenarioData.horarioApertura;
    if (!scenarioData.horarioCierre) delete scenarioData.horarioCierre;
    if (scenarioData.costoPorHora === null) delete scenarioData.costoPorHora;

    if (this.isEditMode && this.scenarioId) {
      // Actualizar escenario existente
      this.scenarioService.updateScenario(this.scenarioId, scenarioData).subscribe({
        next: () => {
          this.toastService.showSuccess('Escenario actualizado correctamente');
          this.router.navigate(['/dashboard/escenarios', this.scenarioId]);
        },
        error: (error) => {
          console.error('Error al actualizar el escenario:', error);
          this.toastService.showError('Error al actualizar el escenario');
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nuevo escenario
      this.scenarioService.createScenario(scenarioData).subscribe({
        next: (scenario) => {
          this.toastService.showSuccess('Escenario creado correctamente');
          this.router.navigate(['/dashboard/escenarios', scenario.id]);
        },
        error: (error) => {
          console.error('Error al crear el escenario:', error);
          this.toastService.showError('Error al crear el escenario');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Convierte un objeto Date a formato HH:mm:ss para el backend
   */
  private formatTimeForBackend(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Convierte una cadena de hora del backend (HH:mm:ss) a objeto Date
   */
  private parseTimeFromBackend(timeString: string): Date {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  /**
   * Construye la URL completa de la imagen desde una ruta relativa
   */
  getFullImageUrl(imagePath: string | null): string | null {
    if (!imagePath) {
      return null;
    }
    
    // Si la imagen ya tiene una URL completa, la devuelve tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Construir URL completa con el dominio del backend
    const baseUrl = environment.apiUrl.replace('/api', ''); // http://localhost:8081
    return `${baseUrl}${imagePath}`;
  }

  onCancel(): void {
    if (this.scenarioId) {
      this.router.navigate(['/dashboard/escenarios', this.scenarioId]);
    } else {
      this.router.navigate(['/dashboard/escenarios']);
    }
  }

  // ===== MÉTODOS PARA MANEJO DE IMÁGENES =====

  /**
   * Carga la configuración de upload de imágenes del backend
   */
  loadImageUploadConfig(): void {
    this.scenarioService.getImageUploadConfig().subscribe({
      next: (config) => {
        this.imageUploadConfig = config;
      },
      error: (error) => {
        console.error('Error cargando configuración de imágenes:', error);
        // Usar configuración por defecto
        this.imageUploadConfig = {
          allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          maxFileSize: 5 * 1024 * 1024,
          maxFileSizeMB: 5,
          maxFilesPerUpload: 10,
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
        };
      }
    });
  }

  /**
   * Maneja la selección de imagen desde el input file
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleImageFile(file);
    }
  }

  /**
   * Maneja el evento de drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Maneja el evento de drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Maneja el evento de drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.handleImageFile(file);
    }
  }

  /**
   * Procesa un archivo de imagen seleccionado
   */
  private handleImageFile(file: File): void {
    // Validar archivo
    const validationError = this.scenarioService.validateImageFile(file, this.imageUploadConfig || undefined);
    if (validationError) {
      this.imageUploadStatus = {
        success: false,
        message: validationError
      };
      return;
    }

    // Establecer archivo seleccionado
    this.selectedImageFile = file;
    
    // Generar preview
    this.scenarioService.generateImagePreview(file).then(preview => {
      this.selectedImagePreview = preview;
    }).catch(error => {
      console.error('Error generando preview:', error);
      this.toastService.showError('Error al generar preview de la imagen');
    });

    // Limpiar estado anterior
    this.imageUploadStatus = null;
  }

  /**
   * Remueve la imagen seleccionada
   */
  removeSelectedImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.selectedImageFile = null;
    this.selectedImagePreview = null;
    this.imageUploadStatus = null;
    
    // Limpiar input file
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Remueve la imagen actual del escenario
   */
  removeCurrentImage(): void {
    this.currentImageUrl = null;
    // El campo imagenUrl se actualizará al enviar el formulario
  }

  /**
   * Sube la imagen seleccionada al servidor
   */
  uploadSelectedImage(): void {
    if (!this.selectedImageFile) {
      return;
    }

    this.imageUploadInProgress = true;
    this.imageUploadStatus = null;

    this.scenarioService.uploadImage(this.selectedImageFile).subscribe({
      next: (response: ImageUploadResponse) => {
        if (response.success) {
          this.imageUploadStatus = {
            success: true,
            message: 'Imagen subida correctamente'
          };
          
          // Actualizar URL de imagen actual
          this.currentImageUrl = response.imageUrl;
          
          // Limpiar selección
          this.selectedImageFile = null;
          this.selectedImagePreview = null;
          
                      this.toastService.showSuccess('Imagen subida correctamente');
        } else {
          this.imageUploadStatus = {
            success: false,
            message: response.message || 'Error al subir la imagen'
          };
        }
        this.imageUploadInProgress = false;
      },
      error: (error) => {
        console.error('Error subiendo imagen:', error);
        this.imageUploadStatus = {
          success: false,
          message: 'Error al subir la imagen'
        };
        this.imageUploadInProgress = false;
        this.toastService.showError('Error al subir la imagen');
      }
    });
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    console.warn('Error cargando imagen:', img.src);
  }

  /**
   * Formatea el tamaño de archivo en formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
