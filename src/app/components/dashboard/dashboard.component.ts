import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/auth.service';
import { NavigationComponent } from '../../shared/navigation/navigation.component';
import { SidebarService } from '../../services/sidebar.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionHelperService } from '../../shared/services/permission-helper.service';
import { AuthorizationService, Permission } from '../../services/authorization.service';
import { 
  PERMISSIONS, 
  PERMISSION_GROUPS, 
  PermissionHelper 
} from '../../shared/constants/permissions.constants';
// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavigationComponent,
    ButtonModule,
    MenuModule,
    AvatarModule,
    HasPermissionDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userEmail = '';
  public currentRoute = ''; // Update this line to make currentRoute public
  
  // Sidebar state
  sidebarCollapsed = false;

  // 🚀 Angular Signals para estado reactivo del usuario
  currentUser = this.authService.currentUser;
  userRole = computed(() => this.authorizationService.currentRole());
  userPermissions = computed(() => this.authorizationService.permissions());
  isAdmin = computed(() => this.authorizationService.isAdmin());
  permissionsLoaded = computed(() => this.authorizationService.permissionsLoaded());
  
  // Computed para datos derivados del usuario
  userInitials = computed(() => {
    const user = this.currentUser();
    const userFullName = user?.nombre || 'Usuario';
    return userFullName.charAt(0).toUpperCase();
  });
  
  userDisplayEmail = computed(() => {
    const user = this.currentUser();
    return user ? user.email : 'Usuario';
  });

  // Exponer constantes de permisos para usar en el template
  readonly PERMISSIONS = PERMISSIONS;
  readonly PERMISSION_GROUPS = PERMISSION_GROUPS;
  readonly PermissionHelper = PermissionHelper;

  constructor(
    public authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService,
    public permissionHelper: PermissionHelperService,
    private authorizationService: AuthorizationService
  ) {
    // 🚀 Effect para logging automático cuando cambian los permisos
    effect(() => {
      const role = this.userRole();
      const permissions = this.userPermissions();
      const isAdmin = this.isAdmin();
      
      console.log('🔄 [DASHBOARD SIGNALS] Estado actualizado:');
      console.log('👤 Rol del usuario:', role);
      console.log('🔑 Es admin:', isAdmin);
      console.log('📊 Cantidad permisos:', permissions.length);
      console.log('📋 Permisos:', permissions.map((p: Permission) => `${p.resource}:${p.action}`));
    });

    // 🚀 Effect para reaccionar a cambios del usuario
    effect(() => {
      const user = this.currentUser();
      console.log('🔄 [DASHBOARD] Usuario actualizado:', {
        email: user?.email,
        role: user?.role,
        nombre: user?.nombre
      });
      
      // Actualizar userEmail para compatibilidad
      this.userEmail = user ? user.email : 'Usuario';
    });
    
    // Sincronizar el estado del sidebar con el servicio
    this.sidebarService.sidebarCollapsed$.subscribe(collapsed => {
      this.sidebarCollapsed = collapsed;
    });
  }

  ngOnInit(): void {
    // Ya no necesitamos obtener el usuario manualmente porque usamos signals
    
    // Suscribirse a los cambios de ruta para actualizar currentRoute
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
    
    // Establecer la ruta inicial
    this.currentRoute = this.router.url;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(name?: string): string {
    // Usar el computed signal para obtener las iniciales
    return this.userInitials();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  // Métodos helper para generar configuraciones de permisos
  getReservationsReadPermission(): string {
    return this.PERMISSIONS.RESERVATIONS.READ.toString();
  }

  getScenariosReadPermission(): string {
    return this.PERMISSIONS.SCENARIOS.READ.toString();
  }

  getScenariosAnyPermission() {
    return this.PermissionHelper.any([
      this.PERMISSIONS.SCENARIOS.READ, 
      this.PERMISSIONS.SCENARIOS.CREATE, 
      this.PERMISSIONS.SCENARIOS.UPDATE, 
      this.PERMISSIONS.SCENARIOS.MANAGE
    ]);
  }

  getAdminPermissions() {
    return this.PermissionHelper.any(this.PERMISSION_GROUPS.ADMIN);
  }

  // 🚀 Método temporal para debugging usando SIGNALS
  debugPermissions() {
    console.log('🐛 DEBUG - Verificando permisos con SIGNALS:');
    console.log('🐛 SCENARIOS:READ:', this.getScenariosReadPermission());
    console.log('🐛 RESERVATIONS:READ:', this.getReservationsReadPermission());
    
    // 🚀 Usar signals directamente (más moderno y reactivo)
    console.log('🔄 [SIGNALS] Estado actual:');
    console.log('👤 Rol (signal):', this.userRole());
    console.log('🔑 Es admin (signal):', this.isAdmin());
    console.log('📊 Permisos cargados (signal):', this.permissionsLoaded());
    console.log('📋 Cantidad permisos (signal):', this.userPermissions().length);
    
    // Probar verificaciones con el nuevo método de signals
    console.log('🚀 Verificación SCENARIOS:READ (signal):', 
      this.authorizationService.hasPermissionSignal('SCENARIOS:READ'));
    console.log('🚀 Verificación RESERVATIONS:READ (signal):', 
      this.authorizationService.hasPermissionSignal('RESERVATIONS:READ'));
    
    // Comparación con métodos legacy (observables)
    this.permissionHelper.hasPermission(this.PERMISSIONS.SCENARIOS.READ).subscribe(result => {
      console.log('📊 DEBUG - Permiso SCENARIOS:READ (observable):', result);
    });
    
    this.permissionHelper.hasPermission(this.PERMISSIONS.RESERVATIONS.READ).subscribe(result => {
      console.log('📊 DEBUG - Permiso RESERVATIONS:READ (observable):', result);
    });

    // Verificar usuario actual
    console.log('🐛 DEBUG - Usuario actual:', this.currentUser);
    console.log('🐛 DEBUG - Email usuario:', this.authService.getCurrentUser()?.email);
    console.log('🐛 DEBUG - Rol usuario (desde auth):', this.authService.getCurrentUser()?.role);
  }
}
