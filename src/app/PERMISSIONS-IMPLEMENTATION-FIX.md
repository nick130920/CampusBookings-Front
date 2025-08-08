# 🔧 Corrección del Sistema de Permisos Dinámicos

## 🚨 Problemas Encontrados y Solucionados

### **1. Error 500 en el Backend**
**Problema:** El endpoint de permisos no estaba configurado correctamente para usuarios no administradores.

**Solución:**
- ✅ Creado nuevo endpoint específico: `/api/user/my-permissions`
- ✅ Nuevo controlador `UserPermissionsController` para usuarios autenticados
- ✅ Endpoint seguro que permite a cualquier usuario obtener sus propios permisos

### **2. URL Duplicada en Frontend**
**Problema:** La URL contenía `/api/api/user-management/` (doble `/api`)

**Solución:**
- ✅ Corregida URL en `AuthorizationService`: `${environment.apiUrl}/api/user`
- ✅ Actualizado método para usar `/my-permissions` sin necesidad del `userId`

### **3. Método `extractUserId` Faltante**
**Problema:** El `JwtService` no tenía método para extraer el `userId` del token.

**Solución:**
- ✅ Agregado método `extractUserId()` al `JwtService`
- ✅ Manejo robusto de tipos (Integer/Long) desde JWT claims

---

## 🏗️ Nuevos Componentes Creados

### **Backend:**

#### **1. UserPermissionsController**
```java
@RestController
@RequestMapping("/api/user")
public class UserPermissionsController {
    
    @GetMapping("/my-permissions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('COORDINATOR')")
    public ResponseEntity<UserPermissionsResponse> getMyPermissions()
}
```

**Características:**
- 🔒 Acceso para todos los usuarios autenticados
- 🎯 Extrae automáticamente el `userId` del token JWT
- 🛡️ Seguro y sin necesidad de pasar ID por URL

#### **2. Método extractUserId en JwtService**
```java
public Long extractUserId(String token) {
    return extractClaim(token, claims -> {
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Integer) {
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        return null;
    });
}
```

### **Frontend:**

#### **Permisos de Fallback**
Si el backend falla, el frontend usa permisos básicos por defecto:
```typescript
const fallbackPermissions: UserPermissions = {
  userId: userId,
  roleName: 'USER',
  permissions: [
    { resource: 'SCENARIOS', action: 'READ' },
    { resource: 'RESERVATIONS', action: 'READ' },
    { resource: 'RESERVATIONS', action: 'CREATE' }
  ]
};
```

---

## 🔄 Flujo del Sistema Corregido

1. **Usuario se autentica** → Token JWT con `userId` incluido
2. **AuthorizationService** → Llama a `/api/user/my-permissions`
3. **Backend extrae userId** → Desde el token automáticamente
4. **Retorna permisos** → Basados en el rol del usuario
5. **Frontend se adapta** → Muestra/oculta elementos según permisos

---

## 🚀 Cómo Probar

### **1. Verificar que el Backend está Ejecutando**
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### **2. Verificar el Endpoint Manualmente**
```bash
# Obtener token de autenticación
curl -X POST https://tu-backend.com/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@usco.edu.co","password":"password"}'

# Probar endpoint de permisos
curl -X GET https://tu-backend.com/api/user/my-permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. En el Frontend**
1. **Iniciar sesión** con cualquier usuario
2. **Abrir DevTools** → Console
3. **Buscar logs:**
   - `📋 Permisos del usuario cargados: {...}`
   - Verificar que no hay errores 500

### **4. Probar la UI Dinámica**
- **Dashboard:** Enlaces visibles según permisos
- **Navigation:** Menús adaptativos
- **Role Management:** Botones según permisos

---

## ⚙️ Configuración por Rol

### **👤 USER**
- ✅ Ve: Dashboard, Mis Reservas, Calendario
- ✅ Permisos: `SCENARIOS:READ`, `RESERVATIONS:READ`, `RESERVATIONS:CREATE`

### **🎯 COORDINATOR**
- ✅ Ve: Dashboard, Reservas, Escenarios, Calendario, Administración (limitada)
- ✅ Permisos: `SCENARIOS:MANAGE`, `RESERVATIONS:MANAGE`, etc.

### **👑 ADMIN**
- ✅ Ve: Todas las secciones
- ✅ Permisos: Todos los permisos disponibles

---

## 🛠️ Endpoints Disponibles

### **Usuario Autenticado:**
- `GET /api/user/my-permissions` - Obtener mis permisos

### **Solo Administradores:**
- `GET /api/admin/users` - Lista de usuarios
- `GET /api/admin/users/{id}/permissions` - Permisos de usuario específico
- `PUT /api/admin/users/{id}/role` - Cambiar rol de usuario

---

## 📋 Verificación Final

### **✅ Backend:**
- [ ] Compila sin errores
- [ ] Endpoint `/api/user/my-permissions` responde correctamente
- [ ] JWT incluye `userId` en claims
- [ ] Seguridad por roles funcionando

### **✅ Frontend:**
- [ ] No hay errores en consola
- [ ] Permisos se cargan correctamente
- [ ] UI se adapta según rol del usuario
- [ ] Directivas `*hasPermission` funcionan

### **✅ Integración:**
- [ ] Login exitoso
- [ ] Permisos cargan después del login
- [ ] Navegación se adapta dinámicamente
- [ ] No hay errores 500 ni 403

---

## 🔍 Debug y Troubleshooting

### **Si sigue habiendo errores:**

1. **Verificar logs del backend:**
   ```bash
   tail -f logs/application.log
   ```

2. **Verificar el token JWT:**
   - Ir a [jwt.io](https://jwt.io)
   - Pegar el token y verificar que contiene `userId`

3. **Verificar permisos en BD:**
   ```sql
   SELECT r.nombre, p.name, p.resource, p.action 
   FROM roles r 
   JOIN rol_permissions rp ON r.id = rp.rol_id 
   JOIN permissions p ON rp.permission_id = p.id;
   ```

4. **Verificar claims del token:**
   ```typescript
   // En DevTools Console
   const token = localStorage.getItem('auth_token');
   console.log('Token payload:', JSON.parse(atob(token.split('.')[1])));
   ```

---

**🎉 El sistema debería funcionar correctamente ahora!**
