# 🚀 Configuración del Frontend en Vercel

## 📋 Variables de Entorno para Vercel

### **1. Configurar Variables de Entorno en Vercel:**

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `API_URL` | `https://campusbookings-backend-production.up.railway.app/api` | Production |
| `AUTH_ENDPOINT` | `/auth` | Production |
| `ENABLE_DEBUG` | `false` | Production |

### **2. Configuración de Build:**

Asegúrate de que tu `package.json` tenga el script de build correcto:

```json
{
  "scripts": {
    "build": "ng build --configuration production",
    "build:prod": "ng build --configuration production"
  }
}
```

### **3. Configuración de Angular:**

Verifica que tu `angular.json` tenga la configuración de producción:

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true
    }
  }
}
```

## 🔧 Configuración de CORS

### **Backend (Railway):**

El backend ya está configurado para aceptar requests desde:
- `http://localhost:4200` (desarrollo local)
- `https://campus-bookings-front-3zp2nqik9-nick130920s-projects.vercel.app` (Vercel)

### **Variables de Entorno en Railway:**

Asegúrate de que en Railway tengas configurada esta variable:

```bash
SECURITY_CORS_ALLOWED_ORIGINS=https://campus-bookings-front-3zp2nqik9-nick130920s-projects.vercel.app,http://localhost:4200
```

## 🚀 Pasos para el Despliegue

### **1. Actualizar el Frontend:**

```bash
cd CampusBookings-front
git add .
git commit -m "Update production API URL for Railway deployment"
git push
```

### **2. Verificar el Despliegue:**

1. Vercel automáticamente redeployará tu aplicación
2. Verifica que la aplicación funcione en: `https://campus-bookings-front-3zp2nqik9-nick130920s-projects.vercel.app`
3. Prueba el login y otras funcionalidades

### **3. Verificar la Comunicación:**

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Verifica que las requests vayan a: `https://campusbookings-backend-production.up.railway.app/api`

## 🔍 Solución de Problemas

### **Error de CORS:**
- Verifica que la URL del frontend esté en `SECURITY_CORS_ALLOWED_ORIGINS` en Railway
- Asegúrate de que el backend esté desplegado y funcionando

### **Error de Conexión:**
- Verifica que la URL del API en `environment.prod.ts` sea correcta
- Confirma que el backend esté respondiendo en Railway

### **Error de Autenticación:**
- Verifica que JWT_SECRET esté configurado en Railway
- Confirma que las variables de entorno estén correctas

## 📝 Notas Importantes

- **HTTPS**: Vercel y Railway usan HTTPS por defecto
- **CORS**: El backend debe permitir el dominio de Vercel
- **Variables de Entorno**: Configúralas en Vercel para producción
- **Build**: Vercel automáticamente ejecuta `ng build --configuration production`

## 🔗 URLs Importantes

- **Frontend (Vercel)**: `https://campus-bookings-front-3zp2nqik9-nick130920s-projects.vercel.app`
- **Backend (Railway)**: `https://campusbookings-backend-production.up.railway.app`
- **API Endpoint**: `https://campusbookings-backend-production.up.railway.app/api` 