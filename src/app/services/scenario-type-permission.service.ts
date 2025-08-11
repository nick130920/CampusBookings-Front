import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ScenarioTypePermission {
  id: number;
  usuario: {
    id: number;
    email: string;
    nombre: string;
  };
  tipoEscenario: {
    id: number;
    nombre: string;
  };
  action: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface AssignPermissionRequest {
  userEmail: string;
  tipoNombre: string;
  action: string; // CREATE, UPDATE, DELETE, MANAGE
}

@Injectable({
  providedIn: 'root'
})
export class ScenarioTypePermissionService {
  private readonly apiUrl = `${environment.apiUrl}/v1/scenario-type-permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Asigna un permiso específico a un usuario para un tipo de escenario
   */
  assignPermission(request: AssignPermissionRequest): Observable<ScenarioTypePermission> {
    return this.http.post<ScenarioTypePermission>(`${this.apiUrl}/assign`, null, {
      params: {
        userEmail: request.userEmail,
        tipoNombre: request.tipoNombre,
        action: request.action
      }
    });
  }

  /**
   * Obtiene todos los permisos por tipo asignados a un usuario
   */
  getPermissionsForUser(email: string): Observable<ScenarioTypePermission[]> {
    return this.http.get<ScenarioTypePermission[]>(`${this.apiUrl}/user/${email}`);
  }

  /**
   * Revoca un permiso específico de un usuario para un tipo de escenario
   */
  revokePermission(userEmail: string, tipoNombre: string, action: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/revoke`, {
      params: {
        userEmail,
        tipoNombre,
        action
      }
    });
  }

  /**
   * Obtiene todos los tipos de escenario disponibles
   */
  getAvailableScenarioTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/escenarios/tipos`);
  }

  /**
   * Obtiene todos los usuarios del sistema
   */
  getAvailableUsers(): Observable<{id: number, email: string, nombre: string}[]> {
    return this.http.get<{id: number, email: string, nombre: string}[]>(`${environment.apiUrl}/admin/usuarios`);
  }
}
