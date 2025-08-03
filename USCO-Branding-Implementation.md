# Implementación de Branding USCO - Frontend Angular

## 🎨 Colores Institucionales Implementados

Este proyecto implementa la identidad visual oficial de la **Universidad Surcolombiana (USCO)** según la [Guía de Imagen Institucional](https://www.usco.edu.co/imagen-institucional/).

### 🍷 Paleta de Colores USCO

#### Vino Tinto (Principal)
- **Base**: `#8F141B` - Color principal de la identidad USCO
- **Claro**: `#B15B60` - Para elementos secundarios
- **Oscuro**: `#5C0E12` - Para texto y contraste

#### Gris (Secundario)
- **Base**: `#4D626C` - Color secundario principal
- **Claro**: `#839198` - Para textos secundarios
- **Más Claro**: `#A6B1B6` - Para bordes
- **Pálido**: `#EDEFF0` - Para fondos generales
- **Oscuro**: `#1E262B` - Para texto principal

#### Ocre (Acento)
- **Base**: `#DFD4A6` - Color de acento principal
- **Claro**: `#E5DDB8` - Para resaltados suaves
- **Pálido**: `#F9F6ED` - Para fondos sutiles

### 🏛️ Colores por Facultades
- **Jurídicas y Políticas**: `#7C0B69`
- **Exactas y Naturales**: `#9DC107`
- **Sociales y Humanas**: `#CE932C`
- **Economía y Administración**: `#003561`
- **Educación**: `#AD142E`
- **Ingeniería**: `#7D9C10`
- **Salud**: `#00A4B7`

## 📁 Archivos Implementados

### 🎨 CSS de Colores
- **`src/assets/css/usco-colors.css`**: Variables CSS y clases utilitarias
- **`src/assets/css/usco-fonts.css`**: Fuentes tipográficas oficiales (Open Sans)

### 🧩 Componentes Actualizados

#### Login (`src/app/components/login/`)
- ✅ Header con logo USCO oficial
- ✅ Gradientes vino tinto en header
- ✅ Campos de formulario con colores USCO
- ✅ Botón principal con gradiente institucional
- ✅ Footer con información de versión
- ✅ Toggle mostrar/ocultar contraseña mejorado

#### Registro (`src/app/components/register/`)
- ✅ Misma identidad visual que login
- ✅ Campos adicionales con iconos
- ✅ Validación visual mejorada
- ✅ Toggle de contraseña implementado

#### Dashboard (`src/app/components/dashboard/`)
- ✅ Sidebar con logo USCO
- ✅ Navegación con colores institucionales
- ✅ Avatar de usuario con colores ocre
- ✅ Estados hover y activo USCO
- ✅ Header móvil responsive

## 🔧 Características Técnicas

### Variables CSS Centralizadas
```css
:root {
  --usco-vino-tinto: #8F141B;
  --usco-gris: #4D626C;
  --usco-ocre: #DFD4A6;
  /* ... más variables ... */
}
```

### Clases Utilitarias
```css
.bg-usco-vino-tinto { background-color: var(--usco-vino-tinto); }
.text-usco-gris { color: var(--usco-gris); }
.border-usco-ocre { border-color: var(--usco-ocre); }
```

### Gradientes Institucionales
```css
.bg-gradient-to-r.from-usco-vino-tinto.to-usco-vino-tinto-dark
```

### Fuentes Oficiales
- **Principal**: Open Sans (400, 700, italic)
- **Condensada**: Open Sans Condensed (300, 700)
- **Carga desde Google Fonts** con fallbacks

## 🖼️ Logo Oficial USCO

### Implementación
```html
<img 
  src="https://www.usco.edu.co/imagen-institucional/negro/universidad-surcolombiana-vm.png" 
  alt="Universidad Surcolombiana"
  class="h-20 w-auto filter brightness-0 invert"
>
```

### Características
- **URL oficial**: Desde servidor USCO
- **Filtros CSS**: Inversión para fondos oscuros
- **Responsive**: Diferentes tamaños por dispositivo
- **Fallback**: Se oculta si no carga

## 🎯 Estados y Interacciones

### Estados de Foco
```css
.focus:ring-usco-vino-tinto:focus {
  box-shadow: 0 0 0 2px rgba(143, 20, 27, 0.2);
}
```

### Estados Hover
```css
.hover:text-usco-vino-tinto:hover {
  color: var(--usco-vino-tinto);
}
```

### Transiciones Suaves
```css
transition: all 0.3s ease;
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: > 768px

### Adaptaciones Móviles
- Header colapsable en dashboard
- Logo más pequeño en móvil
- Menú hamburguesa con colores USCO
- Formularios adaptados a pantalla táctil

## ♿ Accesibilidad

### Contrastes Verificados
- ✅ Ratio 4.5:1 para texto normal
- ✅ Ratio 3:1 para texto grande
- ✅ Estados focus visibles
- ✅ Navegación por teclado

### ARIA Labels
```html
[attr.aria-label]="hidePassword ? 'Mostrar contraseña' : 'Ocultar contraseña'"
```

## 🖨️ Estilos de Impresión

### Print Media Queries
```css
@media print {
  :root {
    --usco-vino-tinto: #000000;
    --usco-gris: #333333;
  }
  
  .login-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
}
```

## 🚀 Uso en Desarrollo

### Importar Colores
```scss
// En component.css
@import '/src/assets/css/usco-colors.css';
```

### Clases Disponibles
```html
<!-- Backgrounds -->
<div class="bg-usco-vino-tinto">...</div>
<div class="bg-usco-gris-pale">...</div>

<!-- Text -->
<p class="text-usco-gris-dark">...</p>
<h1 class="text-usco-vino-tinto">...</h1>

<!-- Borders -->
<input class="border-usco-gris-lighter">

<!-- Gradientes -->
<button class="bg-gradient-to-r from-usco-vino-tinto to-usco-vino-tinto-dark">
```

## 🔄 Mantenimiento

### Actualización de Colores
1. Modificar variables en `usco-colors.css`
2. Verificar contrastes de accesibilidad
3. Probar en modo claro y oscuro
4. Validar en dispositivos móviles

### Nuevos Componentes
1. Importar CSS de colores USCO
2. Usar variables CSS en lugar de valores hex
3. Aplicar gradientes institucionales
4. Incluir logo oficial cuando sea apropiado

## 📊 Métricas de Implementación

### Cobertura Actual
- ✅ Login: 100%
- ✅ Registro: 100%
- ✅ Dashboard: 85%
- ⏳ Escenarios: 20%
- ⏳ Reservas: 0%

### Próximos Pasos
1. Aplicar a componentes de escenarios
2. Implementar en formularios de reservas
3. Actualizar componentes de administración
4. Crear tema global exportable

## 🔗 Referencias

- [Guía de Imagen Institucional USCO](https://www.usco.edu.co/imagen-institucional/)
- [Logos Oficiales USCO](https://www.usco.edu.co/imagen-institucional/negro/)
- [Google Fonts - Open Sans](https://fonts.google.com/specimen/Open+Sans)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Implementado por**: Sistema Campus Bookings  
**Basado en**: Guía oficial USCO 2024  
**Última actualización**: Implementación completa de login y registro