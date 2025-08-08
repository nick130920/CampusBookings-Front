import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { AuthService, User } from './auth.service';
import { environment } from '../../environments/environment';

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  userId: number;
  roleName: string;
  permissions: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly apiUrl = `${environment.apiUrl}/api/user`;
  private userPermissions$ = new BehaviorSubject<UserPermissions | null>(null);
  private permissionsLoaded = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Cargar permisos cuando el usuario cambie
    this.authService.getCurrentUser$().subscribe(user => {
      if (user) {
        this.loadUserPermissions(user.id);
      } else {
        this.clearPermissions();
      }
    });
  }

  /**
   * Carga los permisos del usuario desde el backend
   */
  private loadUserPermissions(userId: number): void {
    // Usar el nuevo endpoint que no requiere el userId en la URL
    this.http.get<UserPermissions>(`${this.apiUrl}/my-permissions`)
      .pipe(
        catchError(error => {
          console.error('Error cargando permisos del usuario:', error);
          // Si falla, crear permisos básicos de fallback
          const fallbackPermissions: UserPermissions = {
            userId: userId,
            roleName: 'USER',
            permissions: [
              { id: 1, name: 'READ_SCENARIOS', description: 'Ver escenarios', resource: 'SCENARIOS', action: 'READ' },
              { id: 2, name: 'READ_RESERVATIONS', description: 'Ver reservas', resource: 'RESERVATIONS', action: 'READ' },
              { id: 3, name: 'CREATE_RESERVATIONS', description: 'Crear reservas', resource: 'RESERVATIONS', action: 'CREATE' }
            ]
          };
          console.log('🔄 Usando permisos de fallback:', fallbackPermissions);
          return of(fallbackPermissions);
        })
      )
      .subscribe(permissions => {
        this.userPermissions$.next(permissions);
        this.permissionsLoaded = true;
        console.log('📋 Permisos del usuario cargados:', permissions);
      });
  }

  /**
   * Limpia los permisos del usuario
   */
  private clearPermissions(): void {
    this.userPermissions$.next(null);
    this.permissionsLoaded = false;
  }

  /**
   * Obtiene los permisos actuales del usuario
   */
  getUserPermissions(): Observable<UserPermissions | null> {
    return this.userPermissions$.asObservable();
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(resource: string, action: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(userPermissions => {
        if (!userPermissions?.permissions) {
          return false;
        }

        // Verificar permiso específico
        const hasSpecificPermission = userPermissions.permissions.some(permission =>
          permission.resource === resource && permission.action === action
        );

        // Verificar permiso MANAGE (que incluye todas las acciones)
        const hasManagePermission = userPermissions.permissions.some(permission =>
          permission.resource === resource && permission.action === 'MANAGE'
        );

        return hasSpecificPermission || hasManagePermission;
      })
    );
  }

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permissions: Array<{resource: string, action: string}>): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(userPermissions => {
        if (!userPermissions?.permissions) {
          return false;
        }

        return permissions.some(requiredPermission => {
          // Verificar permiso específico
          const hasSpecificPermission = userPermissions.permissions.some(permission =>
            permission.resource === requiredPermission.resource && 
            permission.action === requiredPermission.action
          );

          // Verificar permiso MANAGE
          const hasManagePermission = userPermissions.permissions.some(permission =>
            permission.resource === requiredPermission.resource && 
            permission.action === 'MANAGE'
          );

          return hasSpecificPermission || hasManagePermission;
        });
      })
    );
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: Array<{resource: string, action: string}>): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(userPermissions => {
        if (!userPermissions?.permissions) {
          return false;
        }

        return permissions.every(requiredPermission => {
          // Verificar permiso específico
          const hasSpecificPermission = userPermissions.permissions.some(permission =>
            permission.resource === requiredPermission.resource && 
            permission.action === requiredPermission.action
          );

          // Verificar permiso MANAGE
          const hasManagePermission = userPermissions.permissions.some(permission =>
            permission.resource === requiredPermission.resource && 
            permission.action === 'MANAGE'
          );

          return hasSpecificPermission || hasManagePermission;
        });
      })
    );
  }

  /**
   * Verifica permisos por rol (método de fallback)
   */
  hasRole(roleName: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(userPermissions => userPermissions?.roleName === roleName)
    );
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roleNames: string[]): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(userPermissions => 
        roleNames.some(roleName => userPermissions?.roleName === roleName)
      )
    );
  }

  /**
   * Obtiene los permisos del usuario de forma síncrona (para uso en templates)
   */
  getUserPermissionsSync(): UserPermissions | null {
    return this.userPermissions$.value;
  }

  /**
   * Verifica permisos de forma síncrona (para uso en guards)
   */
  hasPermissionSync(resource: string, action: string): boolean {
    const userPermissions = this.getUserPermissionsSync();
    
    if (!userPermissions?.permissions) {
      return false;
    }

    // Verificar permiso específico
    const hasSpecificPermission = userPermissions.permissions.some(permission =>
      permission.resource === resource && permission.action === action
    );

    // Verificar permiso MANAGE
    const hasManagePermission = userPermissions.permissions.some(permission =>
      permission.resource === resource && permission.action === 'MANAGE'
    );

    return hasSpecificPermission || hasManagePermission;
  }

  /**
   * Recarga los permisos del usuario
   */
  reloadPermissions(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.loadUserPermissions(currentUser.id);
    }
  }

  /**
   * Verifica si los permisos han sido cargados
   */
  arePermissionsLoaded(): boolean {
    return this.permissionsLoaded;
  }
}
