import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../services/authorization.service';
import { 
  Permission, 
  PermissionHelper, 
  Role, 
  PERMISSIONS,
  PERMISSION_GROUPS,
  UI_PERMISSIONS 
} from '../constants/permissions.constants';

/**
 * Servicio helper para simplificar validaciones de permisos en componentes
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionHelperService {

  constructor(private authService: AuthorizationService) {}

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission: Permission): Observable<boolean> {
    return this.authService.hasPermission(permission.resource, permission.action);
  }

  /**
   * Verifica si el usuario tiene cualquiera de los permisos especificados
   */
  hasAnyPermission(permissions: Permission[]): Observable<boolean> {
    const permissionDefs = permissions.map(p => ({ resource: p.resource, action: p.action }));
    return this.authService.hasAnyPermission(permissionDefs);
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: Permission[]): Observable<boolean> {
    const permissionDefs = permissions.map(p => ({ resource: p.resource, action: p.action }));
    return this.authService.hasAllPermissions(permissionDefs);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: Role): Observable<boolean> {
    return this.authService.hasRole(role);
  }

  /**
   * Verifica si el usuario tiene cualquiera de los roles especificados
   */
  hasAnyRole(roles: Role[]): Observable<boolean> {
    return this.authService.hasAnyRole(roles);
  }

  // Métodos de conveniencia para permisos comunes

  /**
   * Puede ver escenarios
   */
  canViewScenarios(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.SCENARIOS.READ);
  }

  /**
   * Puede gestionar escenarios
   */
  canManageScenarios(): Observable<boolean> {
    return this.hasAnyPermission([
      PERMISSIONS.SCENARIOS.MANAGE,
      PERMISSIONS.SCENARIOS.CREATE,
      PERMISSIONS.SCENARIOS.UPDATE,
      PERMISSIONS.SCENARIOS.DELETE
    ]);
  }

  /**
   * Puede crear reservas
   */
  canCreateReservations(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.RESERVATIONS.CREATE);
  }

  /**
   * Puede gestionar reservas
   */
  canManageReservations(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.RESERVATIONS.MANAGE);
  }

  /**
   * Puede ver reservas
   */
  canViewReservations(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.RESERVATIONS.READ);
  }

  /**
   * Puede cancelar reservas
   */
  canCancelReservations(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.RESERVATIONS.CANCEL);
  }

  /**
   * Puede acceder a la administración
   */
  canAccessAdmin(): Observable<boolean> {
    return this.hasAnyPermission(PERMISSION_GROUPS.ADMIN);
  }

  /**
   * Puede gestionar usuarios
   */
  canManageUsers(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.USERS.MANAGE);
  }

  /**
   * Puede gestionar roles
   */
  canManageRoles(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.ROLES.MANAGE);
  }

  /**
   * Puede ver reportes
   */
  canViewReports(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.REPORTS.VIEW);
  }

  /**
   * Puede exportar reportes
   */
  canExportReports(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.REPORTS.EXPORT);
  }

  /**
   * Puede gestionar configuración del sistema
   */
  canManageSystemConfig(): Observable<boolean> {
    return this.hasPermission(PERMISSIONS.SYSTEM_CONFIG.MANAGE);
  }

  /**
   * Es administrador
   */
  isAdmin(): Observable<boolean> {
    return this.hasRole(Role.ADMIN);
  }

  /**
   * Es coordinador
   */
  isCoordinator(): Observable<boolean> {
    return this.hasRole(Role.COORDINATOR);
  }

  /**
   * Es usuario básico
   */
  isUser(): Observable<boolean> {
    return this.hasRole(Role.USER);
  }

  // Helpers para generar configuraciones de directivas

  /**
   * Genera configuración para *hasPermission con permisos de navegación
   */
  getNavigationPermissionConfig(section: keyof typeof UI_PERMISSIONS.NAVIGATION) {
    const permissions = UI_PERMISSIONS.NAVIGATION[section];
    if (permissions.length === 0) {
      return true; // Siempre visible (como Dashboard)
    }
    return PermissionHelper.any(permissions);
  }

  /**
   * Genera configuración para *hasPermission con permisos de acciones
   */
  getActionPermissionConfig(action: keyof typeof UI_PERMISSIONS.ACTIONS) {
    const permissions = UI_PERMISSIONS.ACTIONS[action];
    return PermissionHelper.any(permissions);
  }

  /**
   * Convierte Permission a string para usar en directivas
   */
  permissionToString(permission: Permission): string {
    return permission.toString();
  }

  /**
   * Convierte array de Permission a configuración "any"
   */
  permissionsToAnyConfig(permissions: Permission[]) {
    return PermissionHelper.any(permissions);
  }

  /**
   * Convierte array de Permission a configuración "all"
   */
  permissionsToAllConfig(permissions: Permission[]) {
    return PermissionHelper.all(permissions);
  }
}
