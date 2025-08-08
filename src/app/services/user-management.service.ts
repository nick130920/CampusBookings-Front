import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioDetail {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    usuariosCount: number;
    permissionsCount: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  reservasCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUsuarioRolRequest {
  rolId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   */
  getAllUsers(): Observable<UsuarioDetail[]> {
    return this.http.get<UsuarioDetail[]>(this.apiUrl);
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(userId: number): Observable<UsuarioDetail> {
    return this.http.get<UsuarioDetail>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Buscar usuarios por término de búsqueda
   */
  searchUsers(searchTerm: string): Observable<UsuarioDetail[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<UsuarioDetail[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Cambiar el rol de un usuario
   */
  updateUserRole(userId: number, request: UpdateUsuarioRolRequest): Observable<UsuarioDetail> {
    return this.http.put<UsuarioDetail>(`${this.apiUrl}/${userId}/role`, request);
  }

  /**
   * Obtener usuarios por rol
   */
  getUsersByRole(roleId: number): Observable<UsuarioDetail[]> {
    return this.http.get<UsuarioDetail[]>(`${this.apiUrl}/by-role/${roleId}`);
  }
}
