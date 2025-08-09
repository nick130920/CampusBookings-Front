import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionHelperService } from '../services/permission-helper.service';
import { 
  PERMISSIONS, 
  PERMISSION_GROUPS, 
  PermissionHelper,
  UI_PERMISSIONS 
} from '../constants/permissions.constants';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  showMobileMenu = false;
  showUserMenu = false;
  isAdmin = false;

  // Exponer constantes de permisos para usar en el template
  readonly PERMISSIONS = PERMISSIONS;
  readonly PERMISSION_GROUPS = PERMISSION_GROUPS;
  readonly PermissionHelper = PermissionHelper;
  readonly UI_PERMISSIONS = UI_PERMISSIONS;

  constructor(
    private authService: AuthService,
    public permissionHelper: PermissionHelperService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (user?.nombre) {
      const nombres = user.nombre.split(' ');
      const apellidos = user.apellido?.split(' ') || [];
      
      if (nombres.length > 0 && apellidos.length > 0) {
        return (nombres[0].charAt(0) + apellidos[0].charAt(0)).toUpperCase();
      } else if (nombres.length > 0) {
        return nombres[0].charAt(0).toUpperCase();
      }
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showMobileMenu = false;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.showMobileMenu = false;
  }
}