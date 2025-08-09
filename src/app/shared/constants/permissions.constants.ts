/**
 * Constantes y enums para el sistema de permisos
 * Mantiene sincronización con el backend
 */

// Enum para recursos del sistema
export enum Resource {
  SCENARIOS = 'SCENARIOS',
  RESERVATIONS = 'RESERVATIONS', 
  USERS = 'USERS',
  ROLES = 'ROLES',
  REPORTS = 'REPORTS',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG'
}

// Enum para acciones del sistema
export enum Action {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
  CANCEL = 'CANCEL',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT'
}

// Enum para roles
export enum Role {
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  USER = 'USER'
}

// Interfaz para definir permisos de forma type-safe
export interface PermissionDefinition {
  resource: Resource;
  action: Action;
  description?: string;
}

/**
 * Clase para manejar permisos de forma type-safe
 */
export class Permission {
  constructor(
    public readonly resource: Resource,
    public readonly action: Action,
    public readonly description?: string
  ) {}

  /**
   * Convierte el permiso a string en formato "RESOURCE:ACTION"
   */
  toString(): string {
    return `${this.resource}:${this.action}`;
  }

  /**
   * Crea un permiso desde string "RESOURCE:ACTION"
   */
  static fromString(permissionString: string): Permission {
    const [resource, action] = permissionString.split(':') as [Resource, Action];
    return new Permission(resource, action);
  }

  /**
   * Verifica si este permiso coincide con otro
   */
  equals(other: Permission): boolean {
    return this.resource === other.resource && this.action === other.action;
  }
}

/**
 * Catálogo de permisos predefinidos del sistema
 * Sincronizado con el backend
 */
export const PERMISSIONS = {
  // Permisos de Escenarios
  SCENARIOS: {
    READ: new Permission(Resource.SCENARIOS, Action.READ, 'Ver escenarios'),
    CREATE: new Permission(Resource.SCENARIOS, Action.CREATE, 'Crear escenarios'),
    UPDATE: new Permission(Resource.SCENARIOS, Action.UPDATE, 'Actualizar escenarios'),
    DELETE: new Permission(Resource.SCENARIOS, Action.DELETE, 'Eliminar escenarios'),
    MANAGE: new Permission(Resource.SCENARIOS, Action.MANAGE, 'Gestionar escenarios')
  },

  // Permisos de Reservas
  RESERVATIONS: {
    READ: new Permission(Resource.RESERVATIONS, Action.READ, 'Ver reservas'),
    CREATE: new Permission(Resource.RESERVATIONS, Action.CREATE, 'Crear reservas'),
    CANCEL: new Permission(Resource.RESERVATIONS, Action.CANCEL, 'Cancelar reservas'),
    MANAGE: new Permission(Resource.RESERVATIONS, Action.MANAGE, 'Gestionar todas las reservas')
  },

  // Permisos de Usuarios
  USERS: {
    READ: new Permission(Resource.USERS, Action.READ, 'Ver usuarios'),
    MANAGE: new Permission(Resource.USERS, Action.MANAGE, 'Gestionar usuarios')
  },

  // Permisos de Roles
  ROLES: {
    READ: new Permission(Resource.ROLES, Action.READ, 'Ver roles'),
    MANAGE: new Permission(Resource.ROLES, Action.MANAGE, 'Gestionar roles y permisos')
  },

  // Permisos de Reportes
  REPORTS: {
    VIEW: new Permission(Resource.REPORTS, Action.VIEW, 'Ver reportes'),
    EXPORT: new Permission(Resource.REPORTS, Action.EXPORT, 'Exportar reportes')
  },

  // Permisos de Configuración del Sistema
  SYSTEM_CONFIG: {
    VIEW: new Permission(Resource.SYSTEM_CONFIG, Action.VIEW, 'Ver configuración del sistema'),
    MANAGE: new Permission(Resource.SYSTEM_CONFIG, Action.MANAGE, 'Gestionar configuración del sistema')
  }
} as const;

/**
 * Grupos de permisos para facilitar validaciones complejas
 */
export const PERMISSION_GROUPS = {
  // Permisos básicos de usuario
  USER_BASIC: [
    PERMISSIONS.SCENARIOS.READ,
    PERMISSIONS.RESERVATIONS.READ,
    PERMISSIONS.RESERVATIONS.CREATE,
    PERMISSIONS.RESERVATIONS.CANCEL
  ] as Permission[],

  // Permisos de coordinador
  COORDINATOR: [
    ...Object.values(PERMISSIONS.SCENARIOS),
    ...Object.values(PERMISSIONS.RESERVATIONS),
    PERMISSIONS.REPORTS.VIEW
  ] as Permission[],

  // Permisos administrativos
  ADMIN: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.MANAGE,
    PERMISSIONS.ROLES.READ,
    PERMISSIONS.ROLES.MANAGE,
    PERMISSIONS.SYSTEM_CONFIG.VIEW,
    PERMISSIONS.SYSTEM_CONFIG.MANAGE
  ] as Permission[],

  // Permisos de solo lectura
  READ_ONLY: [
    PERMISSIONS.SCENARIOS.READ,
    PERMISSIONS.RESERVATIONS.READ,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.ROLES.READ,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.SYSTEM_CONFIG.VIEW
  ] as Permission[]
};

/**
 * Helpers para validaciones comunes
 */
export class PermissionHelper {
  
  /**
   * Convierte array de permisos a strings
   */
  static toStringArray(permissions: Permission[]): string[] {
    return permissions.map(p => p.toString());
  }

  /**
   * Crea configuración para directiva hasPermission para "cualquiera"
   */
  static any(permissions: Permission[]): { any: string[] } {
    return { any: this.toStringArray(permissions) };
  }

  /**
   * Crea configuración para directiva hasPermission para "todos"
   */
  static all(permissions: Permission[]): { all: string[] } {
    return { all: this.toStringArray(permissions) };
  }

  /**
   * Crea configuración para directiva hasPermission para rol específico
   */
  static role(role: Role): { role: string } {
    return { role };
  }

  /**
   * Crea configuración para directiva hasPermission para múltiples roles
   */
  static roles(roles: Role[]): { roles: string[] } {
    return { roles };
  }

  /**
   * Verifica si un permiso es de administración
   */
  static isAdminPermission(permission: Permission): boolean {
    return PERMISSION_GROUPS.ADMIN.some(p => p.equals(permission));
  }

  /**
   * Obtiene todos los permisos de un recurso específico
   */
  static getResourcePermissions(resource: Resource): Permission[] {
    return Object.values(PERMISSIONS)
      .flatMap(group => Object.values(group))
      .filter(permission => permission.resource === resource);
  }

  /**
   * Obtiene todos los permisos de una acción específica
   */
  static getActionPermissions(action: Action): Permission[] {
    return Object.values(PERMISSIONS)
      .flatMap(group => Object.values(group))
      .filter(permission => permission.action === action);
  }
}

/**
 * Constantes de configuración para la UI
 */
export const UI_PERMISSIONS = {
  // Navegación
  NAVIGATION: {
    DASHBOARD: [] as Permission[], // Siempre visible
    MY_RESERVATIONS: [PERMISSIONS.RESERVATIONS.READ] as Permission[],
    CALENDAR: [PERMISSIONS.SCENARIOS.READ] as Permission[],
    SCENARIOS: [PERMISSIONS.SCENARIOS.READ] as Permission[],
    ADMINISTRATION: PERMISSION_GROUPS.ADMIN
  },

  // Botones y acciones
  ACTIONS: {
    CREATE_RESERVATION: [PERMISSIONS.RESERVATIONS.CREATE] as Permission[],
    CANCEL_RESERVATION: [PERMISSIONS.RESERVATIONS.CANCEL] as Permission[],
    MANAGE_USERS: [PERMISSIONS.USERS.MANAGE] as Permission[],
    MANAGE_ROLES: [PERMISSIONS.ROLES.MANAGE] as Permission[],
    VIEW_REPORTS: [PERMISSIONS.REPORTS.VIEW] as Permission[],
    EXPORT_REPORTS: [PERMISSIONS.REPORTS.EXPORT] as Permission[],
    SYSTEM_CONFIG: [PERMISSIONS.SYSTEM_CONFIG.MANAGE] as Permission[]
  }
};
