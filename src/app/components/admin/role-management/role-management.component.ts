import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';

// Directives
import { HasPermissionDirective } from '../../../directives/has-permission.directive';


import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { 
  RoleManagementService, 
  RolResponse, 
  RolDetailResponse, 
  Permission, 
  CreateRolRequest, 
  UpdateRolRequest 
} from '../../../services/role-management.service';
import { UserManagementService, UsuarioDetail, UpdateUsuarioRolRequest } from '../../../services/user-management.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    CardModule,
    ToolbarModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    PanelModule,
    ChipModule,
    SelectModule,
    SelectButtonModule,
    
    // Custom Directives
    HasPermissionDirective
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  // Datos
  roles: RolResponse[] = [];
  permissions: Permission[] = [];
  availableResources: string[] = [];
  availableActions: string[] = [];
  
  // Datos de usuarios
  users: UsuarioDetail[] = [];
  
  // Estado de la UI
  loading = false;
  showRoleForm = false;
  editingRole: RolDetailResponse | null = null;
  showUserRoleDialog = false;
  selectedUser: UsuarioDetail | null = null;
  
  // Formularios
  roleForm: FormGroup;
  searchTerm = '';
  userSearchTerm = '';
  
  // Tabla
  displayedColumns: string[] = ['nombre', 'descripcion', 'activo', 'usuariosCount', 'permissionsCount', 'acciones'];
  
  // Filtros de permisos
  selectedResource = '';
  selectedAction = '';
  
  // Gestión de roles de usuarios
  selectedRoleForUser: RolResponse | null = null;
  
  // Vista actual
  currentView: 'roles' | 'users' = 'roles';
  
  // Opciones para el selector de vista
  viewOptions = [
    { label: 'Gestión de Roles', value: 'roles', icon: 'pi pi-cog' },
    { label: 'Gestión de Usuarios', value: 'users', icon: 'pi pi-users' }
  ];

  constructor(
    private roleService: RoleManagementService,
    private userService: UserManagementService,
    private fb: FormBuilder,
    private toast: ToastService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.roleForm = this.createRoleForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private showAccessDeniedError(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Acceso Denegado',
      detail: 'No tienes permisos de administrador. Contacta al administrador del sistema.',
      life: 8000
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    try {
      await Promise.all([
        this.loadRoles(),
        this.loadPermissions(),
        this.loadAvailableResources(),
        this.loadAvailableActions(),
        this.loadUsers()
      ]);
    } catch (error: any) {
      console.error('Error cargando datos iniciales:', error);
      if (error.status === 403) {
        this.showAccessDeniedError();
      } else {
        this.showError('Error al cargar los datos iniciales');
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadRoles(): Promise<void> {
    try {
      this.roles = await this.roleService.getAllRoles().toPromise() || [];
    } catch (error) {
      console.error('Error cargando roles:', error);
      throw error;
    }
  }

  private async loadPermissions(): Promise<void> {
    try {
      this.permissions = await this.roleService.getAllPermissions().toPromise() || [];
    } catch (error) {
      console.error('Error cargando permisos:', error);
      throw error;
    }
  }

  private async loadAvailableResources(): Promise<void> {
    try {
      this.availableResources = await this.roleService.getAvailableResources().toPromise() || [];
    } catch (error) {
      console.error('Error cargando recursos:', error);
      throw error;
    }
  }

  private async loadAvailableActions(): Promise<void> {
    try {
      this.availableActions = await this.roleService.getAvailableActions().toPromise() || [];
    } catch (error) {
      console.error('Error cargando acciones:', error);
      throw error;
    }
  }

  private createRoleForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      activo: [true],
      permissions: [[]]
    });
  }

  // === OPERACIONES CRUD ===

  showCreateForm(): void {
    this.editingRole = null;
    this.roleForm = this.createRoleForm();
    this.showRoleForm = true;
  }

  async showEditForm(role: RolResponse): Promise<void> {
    try {
      this.loading = true;
      this.editingRole = await this.roleService.getRoleById(role.id).toPromise() || null;
      
      if (this.editingRole) {
        this.roleForm = this.fb.group({
          nombre: [this.editingRole.nombre, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
          descripcion: [this.editingRole.descripcion, [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
          activo: [this.editingRole.activo],
          permissions: [this.editingRole.permissions.map(p => p.id)]
        });
        this.showRoleForm = true;
      }
    } catch (error) {
      console.error('Error cargando detalles del rol:', error);
      this.showError('Error al cargar los detalles del rol');
    } finally {
      this.loading = false;
    }
  }

  async saveRole(): Promise<void> {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.roleForm.value;
    
    try {
      this.loading = true;
      
      if (this.editingRole) {
        // Actualizar rol existente
        const updateRequest: UpdateRolRequest = {
          nombre: formValue.nombre,
          descripcion: formValue.descripcion,
          activo: formValue.activo,
          permissionIds: formValue.permissions
        };
        
        await this.roleService.updateRole(this.editingRole.id, updateRequest).toPromise();
        this.showSuccess('Rol actualizado exitosamente');
      } else {
        // Crear nuevo rol
        const createRequest: CreateRolRequest = {
          nombre: formValue.nombre,
          descripcion: formValue.descripcion,
          activo: formValue.activo,
          permissionIds: formValue.permissions
        };
        
        await this.roleService.createRole(createRequest).toPromise();
        this.showSuccess('Rol creado exitosamente');
      }
      
      await this.loadRoles();
      this.cancelForm();
    } catch (error: any) {
      console.error('Error guardando rol:', error);
      if (error.error?.message?.includes('ya existe')) {
        this.showError('Ya existe un rol con ese nombre');
      } else {
        this.showError('Error al guardar el rol');
      }
    } finally {
      this.loading = false;
    }
  }

  deleteRole(role: RolResponse): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el rol "${role.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.performDeleteRole(role);
      }
    });
  }

  private async performDeleteRole(role: RolResponse): Promise<void> {
    try {
      this.loading = true;
      await this.roleService.deleteRole(role.id).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Rol eliminado exitosamente'
      });
      await this.loadRoles();
    } catch (error: any) {
      console.error('Error eliminando rol:', error);
      const errorMessage = error.error?.message?.includes('usuarios asignados') 
        ? 'No se puede eliminar el rol porque tiene usuarios asignados'
        : 'Error al eliminar el rol';
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    } finally {
      this.loading = false;
    }
  }

  async toggleRoleStatus(role: RolResponse): Promise<void> {
    try {
      this.loading = true;
      await this.roleService.toggleRoleStatus(role.id).toPromise();
      this.showSuccess(`Rol ${role.activo ? 'desactivado' : 'activado'} exitosamente`);
      await this.loadRoles();
    } catch (error: any) {
      console.error('Error cambiando estado del rol:', error);
      if (error.error?.message?.includes('usuarios asignados')) {
        this.showError('No se puede desactivar el rol porque tiene usuarios asignados');
      } else {
        this.showError('Error al cambiar el estado del rol');
      }
    } finally {
      this.loading = false;
    }
  }

  cancelForm(): void {
    this.showRoleForm = false;
    this.editingRole = null;
    this.roleForm = this.createRoleForm();
  }

  // === BÚSQUEDA Y FILTROS ===

  async searchRoles(): Promise<void> {
    if (!this.searchTerm.trim()) {
      await this.loadRoles();
      return;
    }

    try {
      this.loading = true;
      this.roles = await this.roleService.searchRoles(this.searchTerm).toPromise() || [];
    } catch (error) {
      console.error('Error buscando roles:', error);
      this.showError('Error al buscar roles');
    } finally {
      this.loading = false;
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadRoles();
  }

  // === GESTIÓN DE PERMISOS ===

  getFilteredPermissions(): Permission[] {
    return this.permissions.filter(permission => {
      const matchesResource = !this.selectedResource || permission.resource === this.selectedResource;
      const matchesAction = !this.selectedAction || permission.action === this.selectedAction;
      return matchesResource && matchesAction;
    });
  }

  isPermissionSelected(permissionId: number): boolean {
    const selectedPermissions = this.roleForm.get('permissions')?.value || [];
    return selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: number): void {
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    let newPermissions: number[];

    if (currentPermissions.includes(permissionId)) {
      newPermissions = currentPermissions.filter((id: number) => id !== permissionId);
    } else {
      newPermissions = [...currentPermissions, permissionId];
    }

    this.roleForm.patchValue({ permissions: newPermissions });
  }

  selectAllPermissions(): void {
    const allPermissionIds = this.getFilteredPermissions().map(p => p.id);
    this.roleForm.patchValue({ permissions: allPermissionIds });
  }

  clearAllPermissions(): void {
    this.roleForm.patchValue({ permissions: [] });
  }

  // === UTILIDADES ===

  private markFormGroupTouched(): void {
    Object.keys(this.roleForm.controls).forEach(key => {
      const control = this.roleForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }

  getStatusColor(activo: boolean): string {
    return activo ? 'text-green-600' : 'text-red-600';
  }

  getStatusText(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  // === GESTIÓN DE USUARIOS ===

  private async loadUsers(): Promise<void> {
    try {
      this.users = await this.userService.getAllUsers().toPromise() || [];
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      throw error;
    }
  }

  async searchUsers(): Promise<void> {
    if (!this.userSearchTerm.trim()) {
      await this.loadUsers();
      return;
    }

    try {
      this.loading = true;
      this.users = await this.userService.searchUsers(this.userSearchTerm).toPromise() || [];
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      this.showError('Error al buscar usuarios');
    } finally {
      this.loading = false;
    }
  }

  clearUserSearch(): void {
    this.userSearchTerm = '';
    this.loadUsers();
  }

  showChangeRoleDialog(user: UsuarioDetail): void {
    this.selectedUser = user;
    this.selectedRoleForUser = user.rol ? this.roles.find(r => r.id === user.rol!.id) || null : null;
    this.showUserRoleDialog = true;
  }

  async updateUserRole(): Promise<void> {
    if (!this.selectedUser || !this.selectedRoleForUser) {
      return;
    }

    try {
      this.loading = true;
      const request: UpdateUsuarioRolRequest = {
        rolId: this.selectedRoleForUser.id
      };

      await this.userService.updateUserRole(this.selectedUser.id, request).toPromise();
      this.showSuccess(`Rol del usuario ${this.selectedUser.nombre} ${this.selectedUser.apellido} actualizado exitosamente`);
      
      await this.loadUsers();
      this.cancelUserRoleDialog();
    } catch (error: any) {
      console.error('Error actualizando rol del usuario:', error);
      this.showError('Error al actualizar el rol del usuario');
    } finally {
      this.loading = false;
    }
  }

  cancelUserRoleDialog(): void {
    this.showUserRoleDialog = false;
    this.selectedUser = null;
    this.selectedRoleForUser = null;
  }

  getUserRoleName(user: UsuarioDetail): string {
    return user.rol ? user.rol.nombre : 'Sin Rol';
  }

  getUserRoleColor(user: UsuarioDetail): string {
    if (!user.rol) return 'secondary';
    
    switch (user.rol.nombre) {
      case 'ADMIN': return 'danger';
      case 'COORDINATOR': return 'warning';
      case 'USER': return 'info';
      default: return 'secondary';
    }
  }

  getActiveRolesForDropdown(): RolResponse[] {
    return this.roles.filter(role => role.activo);
  }
}
