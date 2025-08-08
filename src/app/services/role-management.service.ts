import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolResponse {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  usuariosCount: number;
  permissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RolDetailResponse {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  usuariosCount: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolRequest {
  nombre: string;
  descripcion: string;
  permissionIds?: number[];
  activo?: boolean;
}

export interface UpdateRolRequest {
  nombre?: string;
  descripcion?: string;
  permissionIds?: number[];
  activo?: boolean;
}

export interface CreatePermissionRequest {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleManagementService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // === ROLES ===

  /**
   * Crear un nuevo rol
   */
  createRole(request: CreateRolRequest): Observable<RolDetailResponse> {
    return this.http.post<RolDetailResponse>(`${this.apiUrl}/roles`, request);
  }

  /**
   * Actualizar un rol existente
   */
  updateRole(roleId: number, request: UpdateRolRequest): Observable<RolDetailResponse> {
    return this.http.put<RolDetailResponse>(`${this.apiUrl}/roles/${roleId}`, request);
  }

  /**
   * Eliminar un rol
   */
  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${roleId}`);
  }

  /**
   * Obtener todos los roles
   */
  getAllRoles(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.apiUrl}/roles`);
  }

  /**
   * Obtener roles activos únicamente
   */
  getActiveRoles(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.apiUrl}/roles/active`);
  }

  /**
   * Obtener un rol por ID con sus permisos
   */
  getRoleById(roleId: number): Observable<RolDetailResponse> {
    return this.http.get<RolDetailResponse>(`${this.apiUrl}/roles/${roleId}`);
  }

  /**
   * Buscar roles por término de búsqueda
   */
  searchRoles(searchTerm: string): Observable<RolResponse[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<RolResponse[]>(`${this.apiUrl}/roles/search`, { params });
  }

  /**
   * Asignar permisos a un rol
   */
  assignPermissionsToRole(roleId: number, permissionIds: number[]): Observable<RolDetailResponse> {
    return this.http.post<RolDetailResponse>(`${this.apiUrl}/roles/${roleId}/permissions`, permissionIds);
  }

  /**
   * Remover permisos de un rol
   */
  removePermissionsFromRole(roleId: number, permissionIds: number[]): Observable<RolDetailResponse> {
    return this.http.delete<RolDetailResponse>(`${this.apiUrl}/roles/${roleId}/permissions`, { body: permissionIds });
  }

  /**
   * Cambiar estado de un rol (activar/desactivar)
   */
  toggleRoleStatus(roleId: number): Observable<RolResponse> {
    return this.http.patch<RolResponse>(`${this.apiUrl}/roles/${roleId}/toggle-status`, {});
  }

  // === PERMISOS ===

  /**
   * Crear un nuevo permiso
   */
  createPermission(request: CreatePermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/permissions`, request);
  }

  /**
   * Actualizar un permiso existente
   */
  updatePermission(permissionId: number, request: UpdatePermissionRequest): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/permissions/${permissionId}`, request);
  }

  /**
   * Eliminar un permiso
   */
  deletePermission(permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permissions/${permissionId}`);
  }

  /**
   * Obtener todos los permisos
   */
  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }

  /**
   * Obtener un permiso por ID
   */
  getPermissionById(permissionId: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/permissions/${permissionId}`);
  }

  /**
   * Obtener permisos por recurso
   */
  getPermissionsByResource(resource: string): Observable<Permission[]> {
    const params = new HttpParams().set('resource', resource);
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions/by-resource`, { params });
  }

  /**
   * Obtener permisos por acción
   */
  getPermissionsByAction(action: string): Observable<Permission[]> {
    const params = new HttpParams().set('action', action);
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions/by-action`, { params });
  }

  /**
   * Buscar permisos por término de búsqueda
   */
  searchPermissions(searchTerm: string): Observable<Permission[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions/search`, { params });
  }

  /**
   * Obtener recursos disponibles
   */
  getAvailableResources(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/permissions/resources`);
  }

  /**
   * Obtener acciones disponibles
   */
  getAvailableActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/permissions/actions`);
  }
}
