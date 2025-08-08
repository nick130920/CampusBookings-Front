import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, map, tap, of } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas basado en permisos
 * 
 * Uso en rutas:
 * 
 * {
 *   path: 'admin/users',
 *   component: UserManagementComponent,
 *   canActivate: [PermissionGuard],
 *   data: { 
 *     permission: 'USERS:READ' 
 *   }
 * }
 * 
 * {
 *   path: 'admin',
 *   component: AdminLayoutComponent,
 *   canActivateChild: [PermissionGuard],
 *   data: { 
 *     anyPermissions: ['USERS:READ', 'SCENARIOS:MANAGE', 'SYSTEM_CONFIG:VIEW']
 *   },
 *   children: [...]
 * }
 * 
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [PermissionGuard],
 *   data: { 
 *     allPermissions: ['SCENARIOS:READ', 'RESERVATIONS:READ']
 *   }
 * }
 * 
 * {
 *   path: 'admin-only',
 *   component: AdminComponent,
 *   canActivate: [PermissionGuard],
 *   data: { 
 *     role: 'ADMIN'
 *   }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkPermissions(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkPermissions(route, state);
  }

  private checkPermissions(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      console.log('🔒 Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return of(false);
    }

    const routeData = route.data;

    // Si no hay datos de permisos, permitir acceso (ruta pública)
    if (!this.hasPermissionData(routeData)) {
      return of(true);
    }

    // Esperar a que los permisos estén cargados
    return this.authorizationService.getUserPermissions().pipe(
      map(userPermissions => {
        if (!userPermissions) {
          console.log('🔒 Permisos de usuario no disponibles');
          this.redirectToUnauthorized();
          return false;
        }

        return this.evaluatePermissions(routeData, userPermissions);
      }),
      tap(hasAccess => {
        if (!hasAccess) {
          console.log('🔒 Acceso denegado a ruta:', state.url);
          this.redirectToUnauthorized();
        } else {
          console.log('✅ Acceso permitido a ruta:', state.url);
        }
      })
    );
  }

  private hasPermissionData(routeData: any): boolean {
    return !!(
      routeData['permission'] || 
      routeData['anyPermissions'] || 
      routeData['allPermissions'] || 
      routeData['role'] || 
      routeData['roles']
    );
  }

  private evaluatePermissions(routeData: any, userPermissions: any): boolean {
    // Verificar rol específico
    if (routeData['role']) {
      return userPermissions.roleName === routeData['role'];
    }

    // Verificar múltiples roles
    if (routeData['roles']) {
      const roles: string[] = routeData['roles'];
      return roles.includes(userPermissions.roleName);
    }

    // Verificar permiso específico
    if (routeData['permission']) {
      const permission: string = routeData['permission'];
      const [resource, action] = permission.split(':');
      return this.authorizationService.hasPermissionSync(resource, action);
    }

    // Verificar cualquiera de los permisos
    if (routeData['anyPermissions']) {
      const permissions: string[] = routeData['anyPermissions'];
      return permissions.some(permission => {
        const [resource, action] = permission.split(':');
        return this.authorizationService.hasPermissionSync(resource, action);
      });
    }

    // Verificar todos los permisos
    if (routeData['allPermissions']) {
      const permissions: string[] = routeData['allPermissions'];
      return permissions.every(permission => {
        const [resource, action] = permission.split(':');
        return this.authorizationService.hasPermissionSync(resource, action);
      });
    }

    // Si llegamos aquí, algo está mal configurado
    console.warn('⚠️ Configuración de permisos inválida en ruta:', routeData);
    return false;
  }

  private redirectToUnauthorized(): void {
    // Redirigir a página de acceso denegado o dashboard principal
    this.router.navigate(['/dashboard']);
  }
}
