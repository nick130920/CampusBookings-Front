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
          { path: 'editar/:id', component: ScenarioFormComponent },
          { path: ':id', component: ScenarioDetailComponent },
          { path: 'disponibilidad', component: AvailabilityCalendarComponent },
          { path: 'disponibilidad/:scenarioId', component: AvailabilityCalendarComponent }
        ]
      },
      {
        path: 'reservations',
        children: [
          { path: '', component: ReservationListComponent },
          { path: 'new', component: ReservationFormComponent }
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
          { path: 'reservas', component: ReservationListComponent },
          { path: '', redirectTo: 'reservas', pathMatch: 'full' }
        ]
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
