import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  OnDestroy, 
  OnInit 
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private hasView = false;

  @Input() 
  set hasPermission(value: string | PermissionConfig) {
    this.permissionConfig = this.parsePermissionInput(value);
    this.updateView();
  }

  @Input() hasPermissionElse?: TemplateRef<any>;

  private permissionConfig: PermissionConfig = {};

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthorizationService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en los permisos del usuario
    this.subscription = this.authService.getUserPermissions().subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private parsePermissionInput(input: string | PermissionConfig): PermissionConfig {
    if (typeof input === 'string') {
      // Formato "RESOURCE:ACTION"
      const [resource, action] = input.split(':');
      return { resource, action };
    }
    return input;
  }

  private updateView(): void {
    if (!this.authService.arePermissionsLoaded()) {
      // Si los permisos no están cargados, ocultar por defecto
      this.hideView();
      return;
    }

    this.checkPermission().subscribe(hasPermission => {
      if (hasPermission) {
        this.showView();
      } else {
        this.hideView();
      }
    });
  }

  private checkPermission() {
    const config = this.permissionConfig;

    // Verificar rol específico
    if (config.role) {
      return this.authService.hasRole(config.role);
    }

    // Verificar múltiples roles
    if (config.roles) {
      return this.authService.hasAnyRole(config.roles);
    }

    // Verificar cualquiera de los permisos
    if (config.any) {
      const permissions = config.any.map(p => this.parsePermissionString(p));
      return this.authService.hasAnyPermission(permissions);
    }

    // Verificar todos los permisos
    if (config.all) {
      const permissions = config.all.map(p => this.parsePermissionString(p));
      return this.authService.hasAllPermissions(permissions);
    }

    // Verificar permiso específico
    if (config.resource && config.action) {
      return this.authService.hasPermission(config.resource, config.action);
    }

    // Si no hay configuración válida, denegar por defecto
    return this.authService.hasRole('ADMIN'); // Solo admin por defecto
  }

  private parsePermissionString(permission: string): {resource: string, action: string} {
    const [resource, action] = permission.split(':');
    return { resource, action };
  }

  private showView(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  private hideView(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
    
    // Mostrar template alternativo si existe
    if (this.hasPermissionElse) {
      this.viewContainer.createEmbeddedView(this.hasPermissionElse);
    }
  }
}

interface PermissionConfig {
  resource?: string;
  action?: string;
  role?: string;
  roles?: string[];
  any?: string[]; // Cualquiera de estos permisos
  all?: string[]; // Todos estos permisos
}
