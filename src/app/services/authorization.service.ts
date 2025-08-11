import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { AuthService, User } from './auth.service';
import { environment } from '../../environments/environment';
import { ScenarioTypePermissionService, ScenarioTypePermission } from './scenario-type-permission.service';

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
  private readonly apiUrl = `${environment.apiUrl}/user`;
  
  // 🚀 Angular Signals - Estado reactivo moderno
  private userPermissionsSignal = signal<UserPermissions | null>(null);
  private permissionsLoadedSignal = signal<boolean>(false);
  private typePermissionsSignal = signal<ScenarioTypePermission[]>([]);
  
  // Signals computados para facilitar el acceso
  public readonly userPermissions = this.userPermissionsSignal.asReadonly();
  public readonly permissionsLoaded = this.permissionsLoadedSignal.asReadonly();
  public readonly currentRole = computed(() => this.userPermissionsSignal()?.roleName || 'USER');
  public readonly permissions = computed(() => this.userPermissionsSignal()?.permissions || []);
  public readonly isAdmin = computed(() => this.currentRole() === 'ADMIN');
  public readonly typePermissions = this.typePermissionsSignal.asReadonly();
  
  // Mantener compatibilidad con código existente (Observable)
  private userPermissions$ = new BehaviorSubject<UserPermissions | null>(null);
  private permissionsLoadedLegacy = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private scenarioTypePermissionService: ScenarioTypePermissionService
  ) {
    // 🚀 Effect para sincronizar signals con observables (compatibilidad)
    effect(() => {
      const permissions = this.userPermissionsSignal();
      this.userPermissions$.next(permissions);
    });

    effect(() => {
      const loaded = this.permissionsLoadedSignal();
      this.permissionsLoadedLegacy = loaded;
    });

    // Cargar permisos cuando el usuario cambie (usando observables para compatibilidad)
    this.authService.getCurrentUser$().subscribe(user => {
      if (user) {
        this.loadUserPermissions(user.id);
        this.loadTypePermissions(user.email);
      } else {
        this.clearPermissions();
      }
    });

    // 🚀 Effect para reaccionar a cambios en el signal del usuario actual
    effect(() => {
      const user = this.authService.currentUser();
      console.log('🔄 AuthorizationService detectó cambio de usuario via signal:', user?.email, 'Rol:', user?.role);
      
      if (user) {
        this.loadUserPermissions(user.id);
        this.loadTypePermissions(user.email);
      } else {
        this.clearPermissions();
      }
    });
  }

  /**
   * Carga los permisos del usuario desde el backend
   */
  private loadUserPermissions(userId: number): void {
    // TEMPORAL: Forzar uso de fallback para desarrollo
    console.log('🔧 TEMPORAL: Usando permisos de fallback para desarrollo');
    
    // Obtener el rol real del usuario actual
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role || 'USER';
    console.log('👤 Rol real del usuario:', userRole);
    
    const fallbackPermissions: UserPermissions = {
      userId: userId,
      roleName: userRole,
      permissions: this.getPermissionsForRole(userRole)
    };
    
    // 🚀 Actualizar signals
    this.userPermissionsSignal.set(fallbackPermissions);
    this.permissionsLoadedSignal.set(true);
    
    console.log('📋 Permisos del usuario cargados (fallback):', fallbackPermissions);
    console.log('📋 Lista de permisos individual:', fallbackPermissions?.permissions?.map(p => `${p.resource}:${p.action} (name: ${p.name})`));
    console.log('📋 Rol del usuario:', fallbackPermissions?.roleName);
  }

  /**
   * Genera permisos basados en el rol del usuario
   */
  private getPermissionsForRole(role: string): any[] {
    const basePermissions = [
      // Permisos básicos para todos los usuarios
      { id: 1, name: 'READ_SCENARIOS', description: 'Ver escenarios', resource: 'SCENARIOS', action: 'READ' },
      { id: 2, name: 'READ_RESERVATIONS', description: 'Ver reservas', resource: 'RESERVATIONS', action: 'READ' },
      { id: 3, name: 'CREATE_RESERVATIONS', description: 'Crear reservas', resource: 'RESERVATIONS', action: 'CREATE' }
    ];

    if (role === 'ADMIN') {
      // Si es ADMIN, agregar todos los permisos administrativos
      return [
        ...basePermissions,
        // Permisos adicionales de escenarios
        { id: 4, name: 'CREATE_SCENARIOS', description: 'Crear escenarios', resource: 'SCENARIOS', action: 'CREATE' },
        { id: 5, name: 'UPDATE_SCENARIOS', description: 'Actualizar escenarios', resource: 'SCENARIOS', action: 'UPDATE' },
        { id: 6, name: 'DELETE_SCENARIOS', description: 'Eliminar escenarios', resource: 'SCENARIOS', action: 'DELETE' },
        { id: 7, name: 'MANAGE_SCENARIOS', description: 'Gestionar escenarios', resource: 'SCENARIOS', action: 'MANAGE' },
        
        // Permisos administrativos de reservas
        { id: 8, name: 'MANAGE_RESERVATIONS', description: 'Gestionar reservas', resource: 'RESERVATIONS', action: 'MANAGE' },
        { id: 9, name: 'CANCEL_RESERVATIONS', description: 'Cancelar reservas', resource: 'RESERVATIONS', action: 'CANCEL' },
        
        // Permisos de usuarios
        { id: 10, name: 'READ_USERS', description: 'Ver usuarios', resource: 'USERS', action: 'READ' },
        { id: 11, name: 'MANAGE_USERS', description: 'Gestionar usuarios', resource: 'USERS', action: 'MANAGE' },
        
        // Permisos de roles
        { id: 12, name: 'READ_ROLES', description: 'Ver roles', resource: 'ROLES', action: 'READ' },
        { id: 13, name: 'MANAGE_ROLES', description: 'Gestionar roles', resource: 'ROLES', action: 'MANAGE' },
        
        // Permisos de reportes
        { id: 14, name: 'VIEW_REPORTS', description: 'Ver reportes', resource: 'REPORTS', action: 'VIEW' },
        { id: 15, name: 'EXPORT_REPORTS', description: 'Exportar reportes', resource: 'REPORTS', action: 'EXPORT' },
        
        // Permisos de configuración
        { id: 16, name: 'VIEW_SYSTEM_CONFIG', description: 'Ver configuración', resource: 'SYSTEM_CONFIG', action: 'VIEW' },
        { id: 17, name: 'MANAGE_SYSTEM_CONFIG', description: 'Gestionar configuración', resource: 'SYSTEM_CONFIG', action: 'MANAGE' }
      ];
    } else {
      // Para usuarios normales, solo permisos básicos
      return basePermissions;
    }
  }

  /**
   * Carga los permisos por tipo del usuario
   */
  private loadTypePermissions(userEmail: string): void {
    this.scenarioTypePermissionService.getPermissionsForUser(userEmail)
      .subscribe({
        next: (typePermissions) => {
          this.typePermissionsSignal.set(typePermissions);
          console.log('📋 Permisos por tipo cargados:', typePermissions);
        },
        error: (error) => {
          console.error('Error cargando permisos por tipo:', error);
          this.typePermissionsSignal.set([]);
        }
      });
  }

  /**
   * Limpia los permisos del usuario
   */
  private clearPermissions(): void {
    // 🚀 Limpiar signals
    this.userPermissionsSignal.set(null);
    this.permissionsLoadedSignal.set(false);
    this.typePermissionsSignal.set([]);
  }

  /**
   * 🚀 SIGNALS API - Métodos reactivos modernos
   */
  
  /**
   * Verifica si el usuario tiene un permiso específico usando signals
   */
  hasPermissionSignal(permissionString: string): boolean {
    const permissions = this.permissions();
    return permissions.some(permission => 
      `${permission.resource}:${permission.action}` === permissionString
    );
  }

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados usando signals
   */
  hasAnyPermissionSignal(permissionStrings: string[]): boolean {
    return permissionStrings.some(permission => this.hasPermissionSignal(permission));
  }

  /**
   * 🚀 Verifica si el usuario tiene permiso para un tipo específico de escenario
   */
  hasPermissionForTypeSignal(resource: string, action: string, type: string): boolean {
    // Verificar primero permisos generales
    if (this.hasPermissionSignal(`${resource}:${action}`)) {
      return true;
    }

    // Verificar permisos por tipo
    const typePermissions = this.typePermissions();
    return typePermissions.some(perm => 
      perm.tipoEscenario.nombre.toLowerCase() === type.toLowerCase() && 
      (perm.action === action || perm.action === 'MANAGE')
    );
  }

  /**
   * 📊 COMPATIBILIDAD CON OBSERVABLES - Métodos legacy
   */
  
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
   * 🚀 Verifica permiso por tipo (versión Observable para compatibilidad)
   */
  hasPermissionForType(resource: string, action: string, type: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        
        // Verificar permisos generales primero
        const hasGeneralPermission = permissions.permissions.some(permission => 
          permission.resource === resource && permission.action === action
        );
        
        if (hasGeneralPermission) return true;
        
        // Verificar permisos por tipo usando signals
        return this.hasPermissionForTypeSignal(resource, action, type);
      })
    );
  }

  /**
   * Verifica si los permisos han sido cargados
   */
  arePermissionsLoaded(): boolean {
    return this.permissionsLoaded(); // 🚀 Llamar al signal
  }
}
