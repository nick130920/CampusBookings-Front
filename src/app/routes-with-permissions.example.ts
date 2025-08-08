import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';

// Ejemplo de configuración de rutas con permisos dinámicos
export const routesWithPermissions: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    // Dashboard básico no requiere permisos específicos
  },
  {
    path: 'dashboard/reservas',
    loadComponent: () => import('./components/reservation/reservation-list/reservation-list.component').then(m => m.ReservationListComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { 
      permission: 'RESERVATIONS:READ' 
    }
  },
  {
    path: 'dashboard/reservas/nueva',
    loadComponent: () => import('./components/reservation/reservation-form/reservation-form.component').then(m => m.ReservationFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { 
      permission: 'RESERVATIONS:CREATE' 
    }
  },
  {
    path: 'dashboard/escenarios',
    loadComponent: () => import('./components/scenario/scenario-list/scenario-list.component').then(m => m.ScenarioListComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { 
      permission: 'SCENARIOS:READ' 
    }
  },
  {
    path: 'dashboard/escenarios/nuevo',
    loadComponent: () => import('./components/scenario/scenario-form/scenario-form.component').then(m => m.ScenarioFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { 
      permission: 'SCENARIOS:CREATE' 
    }
  },
  {
    path: 'dashboard/escenarios/disponibilidad',
    loadComponent: () => import('./components/scenario/availability-calendar/availability-calendar.component').then(m => m.AvailabilityCalendarComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { 
      permission: 'SCENARIOS:READ' 
    }
  },
  {
    path: 'dashboard/admin',
    canActivate: [AuthGuard, PermissionGuard],
    canActivateChild: [PermissionGuard],
    data: { 
      // Requiere cualquiera de estos permisos para acceder al área administrativa
      anyPermissions: ['USERS:READ', 'SCENARIOS:MANAGE', 'SYSTEM_CONFIG:VIEW']
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/admin/role-management/role-management.component').then(m => m.RoleManagementComponent),
        data: { 
          permission: 'USERS:READ' 
        }
      },
      {
        path: 'escenarios',
        loadComponent: () => import('./components/scenario/scenario-list/scenario-list.component').then(m => m.ScenarioListComponent),
        data: { 
          permission: 'SCENARIOS:MANAGE' 
        }
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./components/admin/system-config/system-config.component').then(m => m.SystemConfigComponent),
        data: { 
          permission: 'SYSTEM_CONFIG:VIEW' 
        }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./components/admin/reports/reports.component').then(m => m.ReportsComponent),
        data: { 
          permission: 'REPORTS:VIEW' 
        }
      }
    ]
  },
  // TODO: Crear componente de perfil
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
  //   canActivate: [AuthGuard],
  //   // El perfil no requiere permisos específicos, todos los usuarios autenticados pueden acceder
  // }
];

/*
RECURSOS Y ACCIONES DISPONIBLES:

RECURSOS:
- USERS (Usuarios)
- SCENARIOS (Escenarios)
- RESERVATIONS (Reservas)
- SYSTEM_CONFIG (Configuración del Sistema)
- REPORTS (Reportes)

ACCIONES:
- READ (Leer/Ver)
- CREATE (Crear)
- UPDATE (Actualizar)
- DELETE (Eliminar)
- MANAGE (Gestionar - incluye todas las acciones)

EJEMPLOS DE PERMISOS:
- USERS:READ - Puede ver usuarios
- USERS:CREATE - Puede crear usuarios
- USERS:MANAGE - Puede hacer todo con usuarios
- SCENARIOS:READ - Puede ver escenarios
- SCENARIOS:CREATE - Puede crear escenarios
- RESERVATIONS:READ - Puede ver reservas
- RESERVATIONS:CREATE - Puede crear reservas
- SYSTEM_CONFIG:VIEW - Puede ver configuración del sistema
- SYSTEM_CONFIG:MANAGE - Puede gestionar configuración del sistema
- REPORTS:VIEW - Puede ver reportes

CONFIGURACIONES DE RUTAS:

1. permission: 'RESOURCE:ACTION' - Requiere permiso específico
2. anyPermissions: ['PERM1', 'PERM2'] - Requiere cualquiera de los permisos
3. allPermissions: ['PERM1', 'PERM2'] - Requiere todos los permisos
4. role: 'ROLE_NAME' - Requiere rol específico
5. roles: ['ROLE1', 'ROLE2'] - Requiere cualquiera de los roles
*/
