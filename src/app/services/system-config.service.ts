import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SystemConfig {
  minDaysAdvance: number;
  maxDaysAdvance: number;
  updatedAt?: string;
  updatedBy?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private readonly API_URL = `${environment.apiUrl}/configuracion`;
  private configSubject = new BehaviorSubject<SystemConfig>({
    minDaysAdvance: 2,
    maxDaysAdvance: 90
  });

  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  /**
   * Cargar configuración desde el servidor
   */
  loadConfig(): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.API_URL}/reservas`).pipe(
      tap(config => this.configSubject.next(config)),
      catchError(error => {
        console.error('Error al cargar configuración:', error);
        // Fallback a configuración por defecto en caso de error
        const defaultConfig: SystemConfig = {
          minDaysAdvance: 2,
          maxDaysAdvance: 90,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Sistema (por defecto)'
        };
        this.configSubject.next(defaultConfig);
        return of(defaultConfig);
      })
    );
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: Partial<SystemConfig>): Observable<SystemConfig> {
    const updateRequest = {
      diasMinimosAnticipacion: config.minDaysAdvance,
      diasMaximosAnticipacion: config.maxDaysAdvance,
      descripcion: config.descripcion || 'Configuración actualizada desde el panel de administración'
    };

    return this.http.put<SystemConfig>(`${this.API_URL}/reservas`, updateRequest).pipe(
      tap(updatedConfig => this.configSubject.next(updatedConfig)),
      catchError(error => {
        console.error('Error al actualizar configuración:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener configuración actual (síncrono)
   */
  getCurrentConfig(): SystemConfig {
    return this.configSubject.value;
  }

  /**
   * Calcular fecha mínima permitida
   */
  getMinAllowedDate(): Date {
    const config = this.getCurrentConfig();
    const date = new Date();
    date.setDate(date.getDate() + config.minDaysAdvance);
    return date;
  }

  /**
   * Calcular fecha máxima permitida
   */
  getMaxAllowedDate(): Date {
    const config = this.getCurrentConfig();
    const date = new Date();
    date.setDate(date.getDate() + config.maxDaysAdvance);
    return date;
  }

  /**
   * Verificar si una fecha está dentro del rango permitido
   */
  isDateAllowed(date: Date): boolean {
    const minDate = this.getMinAllowedDate();
    const maxDate = this.getMaxAllowedDate();
    return date >= minDate && date <= maxDate;
  }

  /**
   * Obtener mensaje de error para fechas no válidas
   */
  getDateErrorMessage(date: Date): string {
    const config = this.getCurrentConfig();
    const minDate = this.getMinAllowedDate();
    const maxDate = this.getMaxAllowedDate();
    
    if (date < minDate) {
      return `Las reservas deben hacerse con mínimo ${config.minDaysAdvance} días de anticipación`;
    }
    
    if (date > maxDate) {
      return `Las reservas pueden hacerse con máximo ${config.maxDaysAdvance} días de anticipación`;
    }
    
    return 'Fecha no válida';
  }
}