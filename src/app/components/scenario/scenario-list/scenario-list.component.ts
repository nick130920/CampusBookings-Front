import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastService } from '../../../services/toast.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Scenario, ScenarioService } from '../../../services/scenario.service';
import { SidebarService } from '../../../services/sidebar.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PERMISSIONS } from '../../../shared/constants/permissions.constants';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    FormsModule,
    HasPermissionDirective
  ]
})
export class ScenarioListComponent implements OnInit, OnDestroy {
  scenarios: Scenario[] = [];
  filteredScenarios: Scenario[] = [];
  isLoading = true;
  isAdmin = false;
  
  // 🚀 Exponer constantes para el template
  readonly PERMISSIONS = PERMISSIONS;
  
  // Sidebar state
  sidebarCollapsed = false;
  private sidebarSubscription?: Subscription;
  
  // Filtros
  filtroTipo = '';
  filtroUbicacion = '';
  tipos: string[] = [];
  ubicaciones: string[] = [];

  constructor(
    private scenarioService: ScenarioService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    console.log('User role:', this.authService.getUserRole(), 'Is admin:', this.isAdmin);
    
    // Suscribirse al estado del sidebar
    this.sidebarSubscription = this.sidebarService.sidebarCollapsed$.subscribe(collapsed => {
      this.sidebarCollapsed = collapsed;
    });
    
    this.loadScenarios();
    this.loadFiltros();
  }

  loadScenarios(): void {
    this.isLoading = true;
    this.scenarioService.getScenarios().subscribe({
      next: (data) => {
        this.scenarios = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading scenarios:', error);
        this.toastService.showError('Error al cargar los escenarios');
        this.isLoading = false;
      }
    });
  }

  loadFiltros(): void {
    this.scenarioService.getTiposEscenario().subscribe({
      next: (tipos) => this.tipos = tipos,
      error: (error) => console.error('Error loading scenario types:', error)
    });

    this.scenarioService.getUbicaciones().subscribe({
      next: (ubicaciones) => this.ubicaciones = ubicaciones,
      error: (error) => console.error('Error loading locations:', error)
    });
  }

  applyFilters(): void {
    this.filteredScenarios = this.scenarios.filter(scenario => {
      const matchesTipo = !this.filtroTipo || scenario.tipo === this.filtroTipo;
      const matchesUbicacion = !this.filtroUbicacion || scenario.ubicacion === this.filtroUbicacion;
      return matchesTipo && matchesUbicacion;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filtroTipo = '';
    this.filtroUbicacion = '';
    this.applyFilters();
  }

  onDelete(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar este escenario?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.scenarioService.deleteScenario(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Escenario eliminado correctamente');
            this.loadScenarios();
          },
          error: (error) => {
            console.error('Error deleting scenario:', error);
            this.toastService.showError('Error al eliminar el escenario');
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}
