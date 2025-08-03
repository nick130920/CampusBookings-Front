import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Scenario {
  id?: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  ubicacion: string;
  capacidad: number;
  disponible: boolean;
  recursos?: string;
  imagenUrl?: string;
  caracteristicas?: string[];
  horarioApertura?: string;
  horarioCierre?: string;
  costoPorHora?: number;
  // Campos de auditoría
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
  actualizadoPor?: string;
}

export interface ImageUploadResponse {
  imageUrl: string;
  originalName: string;
  size: number;
  contentType: string;
  success: boolean;
  message: string;
}

export interface ImageUploadConfig {
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: number;
  maxFilesPerUpload: number;
  allowedExtensions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ScenarioService {
  private apiUrl = `${environment.apiUrl}/v1/escenarios`;
  private imageApiUrl = `${environment.apiUrl}/v1/escenarios/images`;

  constructor(private http: HttpClient) {}

  // Obtener todos los escenarios
  getScenarios(): Observable<Scenario[]> {
    return this.http.get<Scenario[]>(this.apiUrl);
  }

  // Obtener un escenario por ID
  getScenario(id: number): Observable<Scenario> {
    return this.http.get<Scenario>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo escenario
  createScenario(scenario: Scenario): Observable<Scenario> {
    return this.http.post<Scenario>(this.apiUrl, scenario);
  }

  // Actualizar un escenario existente
  updateScenario(id: number, scenario: Scenario): Observable<Scenario> {
    return this.http.put<Scenario>(`${this.apiUrl}/${id}`, scenario);
  }

  // Eliminar un escenario
  deleteScenario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtener tipos de escenario únicos (para filtros)
  getTiposEscenario(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos`);
  }

  // Obtener ubicaciones únicas (para filtros)
  getUbicaciones(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/ubicaciones`);
  }

  // ===== MÉTODOS PARA MANEJO DE IMÁGENES =====

  // Subir una sola imagen
  uploadImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageUploadResponse>(`${this.imageApiUrl}/upload`, formData);
  }

  // Subir múltiples imágenes
  uploadMultipleImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<any>(`${this.imageApiUrl}/upload/multiple`, formData);
  }

  // Eliminar una imagen
  deleteImage(filename: string): Observable<any> {
    return this.http.delete<any>(`${this.imageApiUrl}/${filename}`);
  }

  // Obtener configuración de upload de imágenes
  getImageUploadConfig(): Observable<ImageUploadConfig> {
    return this.http.get<ImageUploadConfig>(`${this.imageApiUrl}/config`);
  }

  // Validar archivo antes del upload
  validateImageFile(file: File, config?: ImageUploadConfig): string | null {
    if (!file) {
      return 'No se ha seleccionado ningún archivo';
    }

    if (!config) {
      // Valores por defecto si no se ha cargado la configuración
      config = {
        allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFileSizeMB: 5,
        maxFilesPerUpload: 10,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      };
    }

    // Validar tamaño
    if (file.size > config.maxFileSize) {
      return `El archivo es demasiado grande. Máximo permitido: ${config.maxFileSizeMB} MB`;
    }

    // Validar tipo
    if (!config.allowedFileTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Formatos soportados: ${config.allowedExtensions.join(', ').toUpperCase()}`;
    }

    // Validar extensión
    const fileName = file.name.toLowerCase();
    const hasValidExtension = config.allowedExtensions.some(ext => 
      fileName.endsWith('.' + ext.toLowerCase())
    );

    if (!hasValidExtension) {
      return `Extensión de archivo no válida. Extensiones permitidas: ${config.allowedExtensions.join(', ').toUpperCase()}`;
    }

    return null; // Archivo válido
  }

  // Generar preview de imagen
  generateImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
