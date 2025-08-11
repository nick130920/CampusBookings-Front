import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScenarioTypePermissionService, ScenarioTypePermission, AssignPermissionRequest } from '../../../services/scenario-type-permission.service';
import { ToastService } from '../../../services/toast.service';
import { SidebarService } from '../../../services/sidebar.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-scenario-type-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './scenario-type-permissions.component.html',
  styleUrls: ['./scenario-type-permissions.component.css']
})
export class ScenarioTypePermissionsComponent implements OnInit {
  assignForm: FormGroup;
  permissions: ScenarioTypePermission[] = [];
  users: {id: number, email: string, nombre: string}[] = [];
  scenarioTypes: string[] = [];
  isLoading = false;
  isAssigning = false;

  readonly availableActions = [
    { label: 'Crear', value: 'CREATE' },
    { label: 'Actualizar', value: 'UPDATE' },
    { label: 'Eliminar', value: 'DELETE' },
    { label: 'Gestionar (Todos)', value: 'MANAGE' }
  ];

  constructor(
    private fb: FormBuilder,
    private scenarioTypePermissionService: ScenarioTypePermissionService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    public sidebarService: SidebarService
  ) {
    this.assignForm = this.fb.group({
      userEmail: ['', Validators.required],
      tipoNombre: ['', Validators.required],
      action: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      // Cargar datos en paralelo
      const [users, scenarioTypes] = await Promise.all([
        this.scenarioTypePermissionService.getAvailableUsers().toPromise(),
        this.scenarioTypePermissionService.getAvailableScenarioTypes().toPromise()
      ]);

      this.users = users || [];
      this.scenarioTypes = (scenarioTypes || []).map(type => type);
      
      // Cargar permisos si hay usuarios
      if (this.users.length > 0) {
        this.loadPermissions();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toastService.showError('Error cargando los datos iniciales');
    } finally {
      this.isLoading = false;
    }
  }

  private loadPermissions(): void {
    // Para simplificar, cargar permisos de todos los usuarios
    // En una implementación real, podrías filtrar por usuario seleccionado
    this.permissions = [];
    
    this.users.forEach(user => {
      this.scenarioTypePermissionService.getPermissionsForUser(user.email)
        .subscribe({
          next: (userPermissions) => {
            this.permissions = [...this.permissions, ...userPermissions];
          },
          error: (error) => {
            console.error(`Error cargando permisos para ${user.email}:`, error);
          }
        });
    });
  }

  onAssignPermission(): void {
    if (this.assignForm.valid) {
      this.isAssigning = true;
      const request: AssignPermissionRequest = this.assignForm.value;

      this.scenarioTypePermissionService.assignPermission(request)
        .subscribe({
          next: (permission) => {
            this.toastService.showSuccess(`Permiso asignado exitosamente a ${request.userEmail}`);
            this.permissions = [...this.permissions, permission];
            this.assignForm.reset();
          },
          error: (error) => {
            console.error('Error asignando permiso:', error);
            this.toastService.showError('Error asignando el permiso');
          },
          complete: () => {
            this.isAssigning = false;
          }
        });
    } else {
      this.toastService.showWarning('Por favor complete todos los campos requeridos');
    }
  }

  onRevokePermission(permission: ScenarioTypePermission): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea revocar el permiso ${permission.action} del tipo ${permission.tipoEscenario.nombre} al usuario ${permission.usuario.email}?`,
      header: 'Confirmar Revocación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, revocar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.scenarioTypePermissionService.revokePermission(
          permission.usuario.email,
          permission.tipoEscenario.nombre,
          permission.action
        ).subscribe({
          next: () => {
            this.toastService.showSuccess('Permiso revocado exitosamente');
            this.permissions = this.permissions.filter(p => p.id !== permission.id);
          },
          error: (error) => {
            console.error('Error revocando permiso:', error);
            if (error.status === 404) {
              this.toastService.showWarning('El permiso ya no existe');
              // Remover de la lista local de todas formas
              this.permissions = this.permissions.filter(p => p.id !== permission.id);
            } else {
              this.toastService.showError('Error revocando el permiso');
            }
          }
        });
      }
    });
  }

  getActionSeverity(action: string): string {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'MANAGE': return 'warning';
      default: return 'secondary';
    }
  }

  getActionLabel(action: string): string {
    const actionMap: { [key: string]: string } = {
      'CREATE': 'Crear',
      'UPDATE': 'Actualizar',
      'DELETE': 'Eliminar',
      'MANAGE': 'Gestionar'
    };
    return actionMap[action] || action;
  }
}
