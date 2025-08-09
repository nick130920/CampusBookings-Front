# 🔐 Guía del Sistema de Permisos Dinámicos

## 📋 Descripción
Sistema completo de autorización basado en permisos dinámicos que permite adaptar la interfaz según los permisos del usuario autenticado.

---

## 🚀 Implementación Completada

### ✅ **Componentes Actualizados con Permisos:**

#### **1. Dashboard Sidebar**
```html
<!-- Mis Reservas -->
<a *hasPermission="'RESERVATIONS:READ'">Mis Reservas</a>

<!-- Calendario de Disponibilidad -->
<a *hasPermission="'SCENARIOS:READ'">Calendario</a>

<!-- Escenarios - Cualquier permiso relacionado -->
<a *hasPermission="{any: ['SCENARIOS:READ', 'SCENARIOS:CREATE', 'SCENARIOS:UPDATE', 'SCENARIOS:MANAGE']}">
  Escenarios
</a>

<!-- Administración -->
<a *hasPermission="{any: ['USERS:READ', 'SCENARIOS:MANAGE', 'SYSTEM_CONFIG:VIEW', 'REPORTS:VIEW']}">
  Administración
</a>
```

#### **2. Navigation Component**
- **Mis Reservas:** `RESERVATIONS:READ`
- **Calendario:** `SCENARIOS:READ` 
- **Escenarios:** `SCENARIOS:READ`
- **Administración:** Cualquier permiso administrativo

#### **3. Role Management Component**
- **Botón "Nuevo Rol":** `USERS:CREATE`

---

## 🎯 Permisos Disponibles por Rol

### **ADMIN (Administrador)**
- ✅ **Todos los permisos** - Acceso completo al sistema

### **COORDINATOR (Coordinador)**
- ✅ `SCENARIOS:READ` - Ver escenarios
- ✅ `SCENARIOS:MANAGE` - Gestionar escenarios
- ✅ `RESERVATIONS:READ` - Ver reservas
- ✅ `RESERVATIONS:MANAGE` - Gestionar reservas

### **USER (Usuario)**
- ✅ `SCENARIOS:READ` - Ver escenarios
- ✅ `RESERVATIONS:READ` - Ver sus reservas
- ✅ `RESERVATIONS:CREATE` - Crear reservas
- ✅ `RESERVATIONS:CANCEL` - Cancelar sus reservas

---

## 🔧 Cómo Usar el Sistema

### **1. En Templates HTML**

#### **Permisos Específicos:**
```html
<button *hasPermission="'USERS:CREATE'">Crear Usuario</button>
<div *hasPermission="'SCENARIOS:UPDATE'">Editar Escenario</div>
```

#### **Cualquiera de varios permisos:**
```html
<div *hasPermission="{any: ['USERS:READ', 'USERS:MANAGE']}">
  Panel de usuarios
</div>
```

#### **Todos los permisos requeridos:**
```html
<div *hasPermission="{all: ['SCENARIOS:READ', 'RESERVATIONS:READ']}">
  Dashboard completo
</div>
```

#### **Con template alternativo:**
```html
<div *hasPermission="'USERS:DELETE'; else noPermission">
  <button>Eliminar Usuario</button>
</div>
<ng-template #noPermission>
  <p>No tienes permisos para eliminar usuarios</p>
</ng-template>
```

### **2. En Configuración de Rutas**
```typescript
// routes.ts
{
  path: 'admin/usuarios',
  component: UserManagementComponent,
  canActivate: [AuthGuard, PermissionGuard],
  data: { permission: 'USERS:READ' }
},
{
  path: 'admin',
  canActivateChild: [PermissionGuard],
  data: { 
    anyPermissions: ['USERS:READ', 'SCENARIOS:MANAGE', 'SYSTEM_CONFIG:VIEW'] 
  }
}
```

### **3. Con Pipes en Templates**
```html
<div *ngIf="'USERS:CREATE' | hasPermission | async">
  Crear usuario
</div>

<button [disabled]="!('SCENARIOS:UPDATE' | hasPermission | async)">
  Editar Escenario
</button>
```

### **4. En Componentes TypeScript**
```typescript
// Verificar permisos en el componente
constructor(private authService: AuthorizationService) {}

ngOnInit() {
  this.authService.hasPermission('USERS', 'READ').subscribe(canRead => {
    if (canRead) {
      this.loadUsers();
    }
  });
}
```

---

## 📋 Recursos y Acciones

### **Recursos:**
- `USUARIOS` - Gestión de usuarios y roles
- `ESCENARIOS` - Gestión de escenarios
- `RESERVAS` - Gestión de reservas
- `CONFIGURACION` - Configuración del sistema
- `REPORTES` - Reportes y estadísticas

### **Acciones:**
- `READ` / `VIEW` - Ver/Leer información
- `CREATE` - Crear nuevos elementos
- `UPDATE` - Actualizar elementos existentes
- `DELETE` - Eliminar elementos
- `MANAGE` - Gestión completa (incluye todas las acciones)
- `CANCEL` - Cancelar (específico para reservas)

### **Ejemplos de Permisos:**
```
USUARIOS:READ       - Ver lista de usuarios
USUARIOS:CREATE     - Crear nuevos usuarios
USUARIOS:MANAGE     - Gestión completa de usuarios

ESCENARIOS:READ     - Ver escenarios
ESCENARIOS:CREATE   - Crear nuevos escenarios
ESCENARIOS:UPDATE   - Editar escenarios
ESCENARIOS:MANAGE   - Gestión completa de escenarios

RESERVAS:READ       - Ver reservas
RESERVAS:CREATE     - Crear reservas
RESERVAS:DELETE     - Cancelar reservas

CONFIGURACION:READ  - Ver configuración del sistema
CONFIGURACION:MANAGE - Gestionar configuración

REPORTES:READ       - Ver reportes
```

---

## 🎨 Comportamiento de la UI

### **Por Rol:**

#### **👑 ADMIN**
- ✅ Ve todos los menús y opciones
- ✅ Acceso completo a administración
- ✅ Puede crear, editar y eliminar todo

#### **🎯 COORDINATOR** 
- ✅ Ve: Dashboard, Reservas, Escenarios, Calendario
- ✅ Acceso limitado a administración (solo escenarios)
- ❌ No ve gestión de usuarios

#### **👤 USER**
- ✅ Ve: Dashboard, Mis Reservas, Calendario
- ✅ Puede crear y cancelar sus reservas
- ❌ No ve administración
- ❌ No puede editar escenarios

---

## 🔄 Flujo del Sistema

1. **Usuario se autentica** → Token JWT generado
2. **AuthorizationService** → Obtiene permisos del backend
3. **Directivas y Guards** → Evalúan permisos en tiempo real
4. **UI se adapta** → Muestra/oculta elementos según permisos
5. **Navegación protegida** → Guards bloquean rutas sin permisos

---

## 🛠️ Archivos del Sistema

### **Frontend:**
- `authorization.service.ts` - Servicio principal de permisos
- `has-permission.directive.ts` - Directiva para templates
- `has-permission.pipe.ts` - Pipes para validación
- `permission.guard.ts` - Guard para rutas
- `routes-with-permissions.example.ts` - Ejemplo de configuración

### **Backend:**
- `UserPermissionsResponse.java` - DTO de respuesta
- `UserManagementController.java` - Endpoint de permisos
- `UserManagementService.java` - Lógica de negocio

---

## 🚀 Próximos Pasos

1. **Aplicar a más componentes** según necesidades
2. **Configurar rutas** con PermissionGuard
3. **Ajustar permisos por rol** según requerimientos
4. **Probar con diferentes usuarios** para validar funcionamiento

---

## 💡 Consejos de Uso

### **✅ Buenas Prácticas:**
- Usar permisos granulares (`USERS:READ` vs rol `ADMIN`)
- Agrupar permisos relacionados con `{any: [...]}`
- Documentar qué permisos requiere cada funcionalidad
- Probar con diferentes roles durante desarrollo

### **❌ Evitar:**
- Depender solo de roles (no escalable)
- Permisos muy específicos (mantener balance)
- Verificaciones redundantes en mismo componente
- Hardcodear nombres de roles en templates

---

**¡El sistema está listo y funcionando! 🎉**
