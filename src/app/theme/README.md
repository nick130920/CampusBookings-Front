# Tema USCO para PrimeNG

Sistema de theming avanzado para CampusBookings basado en los colores institucionales de la Universidad Surcolombiana (USCO).

## 📁 Estructura

```
src/app/theme/
├── index.ts          # Barrel exports - punto de entrada principal
├── usco.theme.ts     # Configuración completa del tema USCO
├── theme.utils.ts    # Utilidades para manejo dinámico del tema
└── README.md         # Esta documentación
```

## 🚀 Inicio Rápido

### Configuración Básica

```typescript
// src/app/app.config.ts
import { USCOThemeConfig } from './theme';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG(USCOThemeConfig),
    // ...
  ]
};
```

### Uso en Componentes

```typescript
// En cualquier componente
import { getDesignToken, USCOColors } from './theme';

export class MyComponent {
  primaryColor = getDesignToken('primary.color').value;
  uscoColors = USCOColors;
}
```

```html
<!-- En templates -->
<div style="background-color: var(--p-primary-color)">
  Fondo con color primario USCO
</div>

<p-button severity="primary" label="Botón USCO" />
```

## 🎨 Design Tokens Principales

### Colores Primarios
- `primary.color` - #8F141B (Vino tinto USCO)
- `primary.50` a `primary.950` - Escala completa del vino tinto

### Superficie
- `surface.0` - #ffffff (Blanco)
- `surface.50` - #F9F6ED (Ocre pálido)
- `surface.900` - #4D626C (Gris USCO)
- `surface.950` - #1E262B (Gris oscuro)

### Componentes
- `button.primary.background` - Fondo de botones primarios
- `datatable.header.background` - Fondo de headers de tabla
- `inputtext.focusBorderColor` - Color de borde en focus

## 🛠️ Utilidades Avanzadas

### Cambio Dinámico de Tema

```typescript
import { updateUSCOPrimaryPalette, applyFacultyTheme } from './theme';

// Cambiar a colores de una facultad específica
applyFacultyTheme('ingenieria'); // Verde ingeniería

// Actualizar solo la paleta primaria
updateUSCOPrimaryPalette({
  500: '#custom-color',
  600: '#custom-darker-color'
});
```

### Modo Oscuro

```typescript
import { toggleDarkMode } from './theme';

// Activar modo oscuro
toggleDarkMode(true);

// El CSS se aplica automáticamente con .dark-mode class
```

### Validación del Tema

```typescript
import { validateTheme, exportThemeConfig } from './theme';

// Verificar que el tema esté correctamente configurado
const validation = validateTheme();
if (!validation.isValid) {
  console.error('Tokens faltantes:', validation.missingTokens);
}

// Exportar configuración actual
const config = exportThemeConfig();
console.log(config); // JSON con toda la configuración
```

## 🏫 Temas por Facultad

El sistema incluye colores específicos para cada facultad de la USCO:

```typescript
import { applyFacultyTheme } from './theme';

// Facultades disponibles
applyFacultyTheme('juridicas');    // #7C0B69 - Morado
applyFacultyTheme('exactas');      // #9DC107 - Verde claro
applyFacultyTheme('sociales');     // #CE932C - Naranja
applyFacultyTheme('economia');     // #003561 - Azul oscuro
applyFacultyTheme('educacion');    // #AD142E - Rojo
applyFacultyTheme('ingenieria');   // #7D9C10 - Verde
applyFacultyTheme('salud');        // #00A4B7 - Turquesa
```

## 📖 Ejemplos de Uso

### Botones con Tema USCO

```html
<!-- Botones automáticamente usan los colores USCO -->
<p-button severity="primary" label="Primario" />
<p-button severity="secondary" label="Secundario" />
<p-button severity="success" label="Éxito" />
<p-button severity="danger" label="Peligro" />
```

### Formularios

```html
<!-- Los inputs automáticamente usan el focus color USCO -->
<input pInputText placeholder="Campo automáticamente styled" />

<!-- Labels con colores del tema -->
<label style="color: var(--p-surface-950)">Etiqueta</label>
```

### Tablas

```html
<!-- Header automáticamente usa el color primario USCO -->
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <th>Columna</th> <!-- Fondo vino tinto automático -->
    </tr>
  </ng-template>
</p-table>
```

### Cards

```html
<!-- Sombras y bordes automáticamente usan colores USCO -->
<p-card>
  <ng-template pTemplate="header">
    <div style="background-color: var(--p-primary-color); color: white;">
      Header con color primario
    </div>
  </ng-template>
  Contenido de la card
</p-card>
```

## 🎯 CSS Custom Properties

El tema genera automáticamente variables CSS que puedes usar directamente:

```css
/* Variables disponibles globalmente */
:root {
  /* Colores principales */
  --p-primary-color: #8F141B;
  --p-primary-50: #F4E7E8;
  --p-primary-950: #1A0406;
  
  /* Superficie */
  --p-surface-0: #ffffff;
  --p-surface-950: #1E262B;
  
  /* Componentes */
  --p-button-primary-background: var(--p-primary-color);
  --p-inputtext-focus-border-color: var(--p-primary-color);
}
```

## 🔄 Migración desde Clases Tailwind

### Antes (Tailwind hardcodeado)
```html
<p-button class="bg-usco-vino-tinto border-usco-vino-tinto hover:bg-usco-vino-tinto-dark" />
<div class="text-usco-gris-dark border-usco-gris-lighter" />
```

### Después (Design Tokens)
```html
<p-button severity="primary" />
<div style="color: var(--p-surface-950); border-color: var(--p-surface-300)" />
```

## 🧪 Testing y Debugging

### Inspeccionar Tokens
```typescript
import { getColorInfo } from './theme';

// Obtener información completa de un token
const info = getColorInfo('primary.color');
console.log({
  value: info.value,      // "#8F141B"
  variable: info.variable, // "var(--p-primary-color)"
  name: info.name         // "--p-primary-color"
});
```

### Exportar Configuración
```typescript
import { exportThemeConfig } from './theme';

// Generar reporte completo del tema
const report = exportThemeConfig();
console.log(report); // JSON con toda la configuración actual
```

## 📚 Referencias

- [PrimeNG Theming Guide](https://primeng.org/theming)
- [Design Tokens W3C Specification](https://design-tokens.github.io/community-group/)
- [USCO Brand Guidelines](https://www.usco.edu.co/imagen-institucional/)
- [Angular Styling Best Practices](https://angular.dev/best-practices/a11y)

## 🤝 Contribución

Para contribuir al sistema de theming:

1. Mantén la consistencia con los colores institucionales USCO
2. Usa design tokens en lugar de valores hardcodeados
3. Documenta nuevos tokens en este README
4. Valida que el tema funcione en modo claro y oscuro
5. Asegúrate de que los cambios no rompan la accesibilidad
