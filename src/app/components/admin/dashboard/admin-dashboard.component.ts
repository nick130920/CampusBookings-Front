import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PermissionHelperService } from '../../../shared/services/permission-helper.service';
import { 
  PERMISSIONS, 
  PERMISSION_GROUPS, 
  PermissionHelper,
  UI_PERMISSIONS 
} from '../../../shared/constants/permissions.constants';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  
  // Exponer constantes para usar en el template
  readonly PERMISSIONS = PERMISSIONS;
  readonly PERMISSION_GROUPS = PERMISSION_GROUPS;
  readonly PermissionHelper = PermissionHelper;
  readonly UI_PERMISSIONS = UI_PERMISSIONS;

  constructor(public permissionHelper: PermissionHelperService) {}

  // Métodos de conveniencia para el template
  
  /**
   * Obtiene la configuración de permisos para gestión de usuarios
   */
  getUsersPermissionConfig() {
    return this.PermissionHelper.any([this.PERMISSIONS.USERS.READ, this.PERMISSIONS.USERS.MANAGE]);
  }

  /**
   * Obtiene la configuración de permisos para gestión de roles
   */
  getRolesPermissionConfig() {
    return this.PermissionHelper.any([this.PERMISSIONS.ROLES.READ, this.PERMISSIONS.ROLES.MANAGE]);
  }

  /**
   * Obtiene la configuración de permisos para gestión de escenarios
   */
  getScenariosPermissionConfig() {
    return this.PermissionHelper.any([
      this.PERMISSIONS.SCENARIOS.READ, 
      this.PERMISSIONS.SCENARIOS.MANAGE,
      this.PERMISSIONS.SCENARIOS.CREATE,
      this.PERMISSIONS.SCENARIOS.UPDATE
    ]);
  }

  /**
   * Obtiene la configuración de permisos para gestión de reservas
   */
  getReservationsPermissionConfig() {
    return this.PermissionHelper.any([
      this.PERMISSIONS.RESERVATIONS.READ,
      this.PERMISSIONS.RESERVATIONS.MANAGE
    ]);
  }

  /**
   * Obtiene la configuración de permisos para reportes
   */
  getReportsPermissionConfig() {
    return this.PermissionHelper.any([
      this.PERMISSIONS.REPORTS.VIEW,
      this.PERMISSIONS.REPORTS.EXPORT
    ]);
  }

  /**
   * Obtiene la configuración de permisos para configuración del sistema
   */
  getSystemConfigPermissionConfig() {
    return this.PermissionHelper.any([
      this.PERMISSIONS.SYSTEM_CONFIG.VIEW,
      this.PERMISSIONS.SYSTEM_CONFIG.MANAGE
    ]);
  }
}