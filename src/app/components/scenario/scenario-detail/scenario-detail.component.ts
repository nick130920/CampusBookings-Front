import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { ChipModule } from 'primeng/chip';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../services/toast.service';
import { Scenario, ScenarioService } from '../../../services/scenario.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-scenario-detail',
  templateUrl: './scenario-detail.component.html',
  styleUrls: ['./scenario-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    TabsModule,
    ChipModule,
    ToastModule,
    ConfirmDialogModule
  ]
})
export class ScenarioDetailComponent implements OnInit {
  scenario: Scenario | null = null;
  isLoading = true;
  isAdmin = false;
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private scenarioService: ScenarioService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    console.log('User role:', this.authService.getUserRole(), 'Is admin:', this.isAdmin);
    this.loadScenario();
  }

  loadScenario(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.router.navigate(['/dashboard/escenarios']);
      return;
    }

    this.isLoading = true;
    this.scenarioService.getScenario(id).subscribe({
      next: (data) => {
        this.scenario = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading scenario:', error);
        this.toastService.showError('Error al cargar el escenario');
        this.router.navigate(['/dashboard/escenarios']);
      }
    });
  }

  onDelete(): void {
    if (!this.scenario?.id) return;

    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar este escenario?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (this.scenario?.id) {
          this.scenarioService.deleteScenario(this.scenario.id).subscribe({
            next: () => {
              this.toastService.showSuccess('Escenario eliminado correctamente');
              this.router.navigate(['/dashboard/escenarios']);
            },
            error: (error) => {
              console.error('Error deleting scenario:', error);
              this.toastService.showError('Error al eliminar el escenario');
            }
          });
        }
      }
    });
  }

  onToggleStatus(): void {
    if (!this.scenario) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de que desea marcar este escenario como ${this.scenario.disponible ? 'no disponible' : 'disponible'}?`,
      header: 'Cambiar estado',
      icon: 'pi pi-question-circle',
      rejectButtonProps: {
        label: 'Cancelar',
        icon: 'pi pi-times',
        styleClass: 'p-button-secondary'
      },
      accept: () => {
        if (this.scenario) {
          const updatedScenario = { ...this.scenario, disponible: !this.scenario.disponible };
          this.scenarioService.updateScenario(this.scenario.id!, updatedScenario).subscribe({
            next: (data) => {
              this.scenario = data;
              this.toastService.showSuccess(
                `Escenario marcado como ${data.disponible ? 'disponible' : 'no disponible'}`
              );
            },
            error: (error) => {
              console.error('Error updating scenario status:', error);
              this.toastService.showError('Error al actualizar el estado del escenario');
            }
          });
        }
      }
    });
  }

  /**
   * Construye la URL completa de la imagen desde una ruta relativa
   */
  getFullImageUrl(imagePath: string | null): string | null {
    if (!imagePath) {
      return null;
    }
    
    // Si la imagen ya tiene una URL completa, la devuelve tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Construir URL completa con el dominio del backend
    const baseUrl = environment.apiUrl.replace('/api', ''); // http://localhost:8081
    return `${baseUrl}${imagePath}`;
  }
}
