import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';

/**
 * Pipe para verificar permisos en templates
 * 
 * Uso:
 * 
 * <!-- Verificar permiso específico -->
 * {{ 'USERS:CREATE' | hasPermission | async }}
 * 
 * <!-- Usar en ngIf -->
 * <div *ngIf="'USERS:CREATE' | hasPermission | async">
 *   <button>Crear Usuario</button>
 * </div>
 * 
 * <!-- Verificar rol -->
 * <div *ngIf="user.role | hasRole | async">Contenido para admin</div>
 * 
 * <!-- Verificar múltiples permisos -->
 * <div *ngIf="(['USERS:READ', 'SCENARIOS:READ'] | hasAnyPermission | async)">
 *   Dashboard
 * </div>
 */
@Pipe({
  name: 'hasPermission',
  standalone: true
})
export class HasPermissionPipe implements PipeTransform {
  constructor(private authService: AuthorizationService) {}

  transform(permission: string): Observable<boolean> {
    if (!permission.includes(':')) {
      throw new Error('Formato de permiso inválido. Use "RESOURCE:ACTION"');
    }

    const [resource, action] = permission.split(':');
    return this.authService.hasPermission(resource, action);
  }
}

@Pipe({
  name: 'hasRole',
  standalone: true
})
export class HasRolePipe implements PipeTransform {
  constructor(private authService: AuthorizationService) {}

  transform(roleName: string): Observable<boolean> {
    return this.authService.hasRole(roleName);
  }
}

@Pipe({
  name: 'hasAnyPermission',
  standalone: true
})
export class HasAnyPermissionPipe implements PipeTransform {
  constructor(private authService: AuthorizationService) {}

  transform(permissions: string[]): Observable<boolean> {
    const permissionObjects = permissions.map(p => {
      const [resource, action] = p.split(':');
      return { resource, action };
    });
    
    return this.authService.hasAnyPermission(permissionObjects);
  }
}

@Pipe({
  name: 'hasAllPermissions',
  standalone: true
})
export class HasAllPermissionsPipe implements PipeTransform {
  constructor(private authService: AuthorizationService) {}

  transform(permissions: string[]): Observable<boolean> {
    const permissionObjects = permissions.map(p => {
      const [resource, action] = p.split(':');
      return { resource, action };
    });
    
    return this.authService.hasAllPermissions(permissionObjects);
  }
}
