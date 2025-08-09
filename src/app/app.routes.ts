import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { ScenarioListComponent } from './components/scenario/scenario-list/scenario-list.component';
import { ScenarioDetailComponent } from './components/scenario/scenario-detail/scenario-detail.component';
import { ScenarioFormComponent } from './components/scenario/scenario-form/scenario-form.component';
import { ReservationFormComponent } from './components/reservation/reservation-form/reservation-form.component';
import { ReservationListComponent } from './components/reservation/reservation-list/reservation-list.component';
import { AvailabilityCalendarComponent } from './components/scenario/availability-calendar/availability-calendar.component';
import { ReportsComponent } from './components/admin/reports/reports.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [() => !localStorage.getItem('auth_token') ? true : false],
    data: { auth: false } 
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [() => !localStorage.getItem('auth_token') ? true : false],
    data: { auth: false } 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [() => !localStorage.getItem('auth_token') ? true : false],
    data: { auth: false } 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    data: { auth: true },
    children: [
      {
        path: 'escenarios',
        children: [
          { path: '', component: ScenarioListComponent },
          { path: 'nuevo', component: ScenarioFormComponent },
          { path: 'disponibilidad', component: AvailabilityCalendarComponent },
          { path: 'disponibilidad/:scenarioId', component: AvailabilityCalendarComponent },
          { path: 'editar/:id', component: ScenarioFormComponent },
          { path: ':id', component: ScenarioDetailComponent }
        ]
      },
      {
        path: 'reservas',
        children: [
          { path: '', component: ReservationListComponent },
          { path: 'nueva', component: ReservationFormComponent }
        ]
      },
      {
        path: 'admin',
        children: [
          { path: '', component: AdminDashboardComponent },
          { path: 'reportes', component: ReportsComponent },
          { path: 'configuracion', loadComponent: () => import('./components/admin/system-config/system-config.component').then(m => m.SystemConfigComponent) },
          { path: 'roles', loadComponent: () => import('./components/admin/role-management/role-management.component').then(m => m.RoleManagementComponent) },
          { path: 'permisos-tipo', loadComponent: () => import('./components/admin/scenario-type-permissions/scenario-type-permissions.component').then(m => m.ScenarioTypePermissionsComponent) }
        ]
      },
      // Redirecciones para compatibilidad
      {
        path: 'reservations',
        redirectTo: 'reservas',
        pathMatch: 'full'
      }
    ]
  },
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/dashboard' 
  }
];
