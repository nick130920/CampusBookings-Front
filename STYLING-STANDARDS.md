# Estándares de Estilos CampusBookings Frontend

Este documento establece los estándares de estilos para el proyecto CampusBookings, usando **PrimeNG con tema personalizado USCO** y evitando la repetición de clases CSS.

## 🎨 Sistema de Theming

### Arquitectura del Tema
El sistema de theming está organizado en módulos separados para mejor mantenibilidad:

```
src/app/theme/
├── index.ts          # Barrel exports
├── usco.theme.ts     # Configuración principal del tema
└── theme.utils.ts    # Utilidades y helpers
```

### Configuración Principal
```typescript
// src/app/app.config.ts
import { USCOThemeConfig } from './theme';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG(USCOThemeConfig),
    // ...otros providers
  ]
};
```

### Uso de Design Tokens
```typescript
// Importar utilidades del tema
import { getDesignToken, updateUSCOPrimaryPalette, USCOColors } from './theme';

// Obtener valor de token
const primaryColor = getDesignToken('primary.color');

// Cambiar tema dinámicamente
updateUSCOPrimaryPalette(USCOColors.vinoTinto);
```

### Colores Principales
- **Primary**: `#8F141B` (Vino tinto USCO)
- **Surface**: Escalas de grises y ocres USCO
- **Accent**: `#DFD4A6` (Ocre USCO)

## 📋 Estándares de Uso

### ✅ USAR (Recomendado)

#### 1. Severities de PrimeNG
```html
<!-- ✅ Correcto -->
<p-button severity="primary" label="Acción Principal" />
<p-button severity="secondary" label="Acción Secundaria" />
<p-button severity="info" label="Información" />
<p-button severity="success" label="Éxito" />
<p-button severity="warn" label="Advertencia" />
<p-button severity="danger" label="Peligro" />
```

#### 2. Design Tokens CSS
```html
<!-- ✅ Correcto -->
<h1 style="color: var(--p-surface-950)">Título Principal</h1>
<p style="color: var(--p-surface-900)">Texto secundario</p>
<div style="border-color: var(--p-surface-800)">Contenedor</div>
```

#### 3. Propiedades de Componentes PrimeNG
```html
<!-- ✅ Correcto -->
<p-button [rounded]="true" [text]="true" severity="info" />
<p-tag severity="success" value="Activo" />
<p-chip severity="info" label="Información" />
```

#### 4. Control Flow Moderno
```html
<!-- ✅ Correcto -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

@if (condition) {
  <p>Contenido condicional</p>
}
```

### ❌ EVITAR (Deprecado/No Recomendado)

#### 1. Clases Tailwind Repetitivas
```html
<!-- ❌ Evitar -->
<p-button class="bg-usco-vino-tinto border-usco-vino-tinto hover:bg-usco-vino-tinto-dark" />
<div class="text-usco-gris-dark border-usco-gris-lighter bg-usco-gris-pale" />
```

#### 2. NgFor Deprecado
```html
<!-- ❌ Evitar -->
<option *ngFor="let item of items" [value]="item">{{ item }}</option>

<!-- ✅ Usar -->
@for (item of items; track item) {
  <option [value]="item">{{ item }}</option>
}
```

#### 3. Clases CSS Hardcodeadas
```html
<!-- ❌ Evitar -->
<div class="p-button-primary bg-usco-vino-tinto border-usco-vino-tinto"></div>
```

## 🎯 Mapeo de Design Tokens

### Colores de Texto
- **Títulos principales**: `var(--p-surface-950)`
- **Texto secundario**: `var(--p-surface-900)`
- **Texto deshabilitado**: `var(--p-surface-800)`

### Bordes y Contenedores
- **Bordes principales**: `var(--p-surface-800)`
- **Bordes secundarios**: `var(--p-surface-700)`
- **Fondos sutiles**: `var(--p-surface-50)`

### Ejemplos Prácticos

#### Botones
```html
<!-- Botón primario -->
<p-button severity="primary" label="Crear" icon="pi pi-plus" />

<!-- Botón secundario -->
<p-button severity="secondary" label="Cancelar" />

<!-- Botón de acción en tabla -->
<p-button [rounded]="true" [text]="true" severity="info" icon="pi pi-pencil" />
```

#### Formularios
```html
<!-- Labels -->
<label class="block text-sm font-medium mb-2" style="color: var(--p-surface-950)">
  Nombre del Campo
</label>

<!-- Inputs (automáticamente styled por PrimeNG) -->
<input pInputText class="w-full" />
```

#### Tarjetas y Contenedores
```html
<!-- Card con header personalizado -->
<p-card>
  <ng-template pTemplate="header">
    <div class="p-4 text-white" style="background-color: var(--p-primary-color)">
      <h2>Título de la Sección</h2>
    </div>
  </ng-template>
  <!-- contenido -->
</p-card>
```

#### Tablas
```html
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <!-- Headers automáticamente styled por el tema -->
      <th class="font-semibold">Columna</th>
    </tr>
  </ng-template>
</p-table>
```

## 🔧 Herramientas Útiles

### Utilidades del Tema USCO
```typescript
import { 
  getDesignToken,
  updateUSCOPrimaryPalette,
  toggleDarkMode,
  applyFacultyTheme,
  validateTheme
} from './theme';

// Verificar design tokens
const primaryColor = getDesignToken('primary.color');

// Cambiar tema por facultad
applyFacultyTheme('ingenieria'); // Aplica colores de ingeniería

// Toggle modo oscuro
toggleDarkMode(true);

// Validar configuración del tema
const validation = validateTheme();
console.log('Tema válido:', validation.isValid);
```

### Tokens Disponibles
Los principales design tokens disponibles:
- `primary.color` - Color primario (vino tinto USCO)
- `surface.0` a `surface.950` - Escalas de superficie
- `button.primary.background` - Fondo de botón primario
- `inputtext.background` - Fondo de inputs
- `datatable.header.background` - Fondo de header de tabla

## 📝 Checklist de Migración

- [ ] Reemplazar `*ngFor` con `@for`
- [ ] Reemplazar `*ngIf` con `@if`
- [ ] Cambiar clases CSS hardcodeadas por severities de PrimeNG
- [ ] Usar design tokens para colores personalizados
- [ ] Eliminar clases Tailwind repetitivas
- [ ] Usar propiedades nativas de componentes PrimeNG

## 🎨 Severities Disponibles

| Severity | Uso Recomendado |
|----------|----------------|
| `primary` | Acciones principales, CTAs |
| `secondary` | Acciones secundarias, cancelar |
| `info` | Información, editar |
| `success` | Confirmaciones, estados positivos |
| `warn` | Advertencias, acciones reversibles |
| `danger` | Eliminaciones, acciones destructivas |

## 📚 Referencias

- [PrimeNG Theming](https://primeng.org/theming)
- [Angular Control Flow](https://angular.dev/guide/templates/control-flow)
- [Design Tokens Specification](https://github.com/design-tokens/community-group)

---

**Nota**: Este estándar debe seguirse en todos los componentes nuevos y aplicarse gradualmente en componentes existentes durante el mantenimiento.
