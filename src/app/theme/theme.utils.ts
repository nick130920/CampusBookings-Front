/**
 * Utilidades para el manejo del tema USCO
 * 
 * Proporciona funciones helper para trabajar con design tokens y theming
 */

import { $dt, updatePreset, updatePrimaryPalette, updateSurfacePalette } from '@primeuix/themes';
import { USCOColors } from './usco.theme';

/**
 * Obtiene el valor de un design token
 */
export function getDesignToken(token: string) {
  return $dt(token);
}

/**
 * Actualiza la paleta primaria del tema
 */
export function updateUSCOPrimaryPalette(customColors?: Partial<typeof USCOColors.vinoTinto>) {
  const palette = { ...USCOColors.vinoTinto, ...customColors };
  updatePrimaryPalette(palette);
}

/**
 * Actualiza la paleta de superficie del tema
 */
export function updateUSCOSurfacePalette(mode?: 'light' | 'dark' | 'both') {
  const lightPalette = {
    50: USCOColors.ocre[50],
    100: USCOColors.ocre[100],
    200: USCOColors.ocre[200],
    300: USCOColors.gris[200],
    400: USCOColors.gris[300],
    500: USCOColors.gris[400],
    600: USCOColors.gris[500],
    700: USCOColors.gris[600],
    800: USCOColors.gris[700],
    900: USCOColors.gris[800],
    950: USCOColors.gris[900]
  };

  const darkPalette = {
    50: USCOColors.gris[900],
    100: USCOColors.gris[800],
    200: USCOColors.gris[700],
    300: USCOColors.gris[600],
    400: USCOColors.gris[500],
    500: USCOColors.gris[400],
    600: USCOColors.gris[300],
    700: USCOColors.gris[200],
    800: USCOColors.ocre[200],
    900: USCOColors.ocre[100],
    950: USCOColors.ocre[50]
  };

  // Usar updatePreset en lugar de updateSurfacePalette para tener más control
  switch (mode) {
    case 'light':
      updatePreset({
        semantic: {
          colorScheme: {
            light: {
              surface: lightPalette
            }
          }
        }
      });
      break;
    case 'dark':
      updatePreset({
        semantic: {
          colorScheme: {
            dark: {
              surface: darkPalette
            }
          }
        }
      });
      break;
    case 'both':
    default:
      updatePreset({
        semantic: {
          colorScheme: {
            light: {
              surface: lightPalette
            },
            dark: {
              surface: darkPalette
            }
          }
        }
      });
      break;
  }
}

/**
 * Cambia entre modo claro y oscuro
 */
export function toggleDarkMode(isDark: boolean) {
  const body = document.body;
  
  if (isDark) {
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
  }
  
  // Disparar evento personalizado para componentes que lo necesiten
  window.dispatchEvent(new CustomEvent('theme-changed', { 
    detail: { isDark } 
  }));
}

/**
 * Aplica configuración de tema por facultad USCO
 */
export function applyFacultyTheme(faculty: 'juridicas' | 'exactas' | 'sociales' | 'economia' | 'educacion' | 'ingenieria' | 'salud') {
  const facultyColors = {
    juridicas: '#7C0B69',
    exactas: '#9DC107', 
    sociales: '#CE932C',
    economia: '#003561',
    educacion: '#AD142E',
    ingenieria: '#7D9C10',
    salud: '#00A4B7'
  };

  const primaryColor = facultyColors[faculty];
  
  // Generar paleta basada en el color de la facultad
  const palette = generateColorPalette(primaryColor);
  updatePrimaryPalette(palette);
}

/**
 * Genera una paleta de colores basada en un color base
 */
function generateColorPalette(baseColor: string) {
  // Esta es una implementación simplificada
  // En producción, podrías usar una librería como chroma.js para generar paletas más sofisticadas
  return {
    50: lighten(baseColor, 0.9),
    100: lighten(baseColor, 0.8),
    200: lighten(baseColor, 0.6),
    300: lighten(baseColor, 0.4),
    400: lighten(baseColor, 0.2),
    500: baseColor,
    600: darken(baseColor, 0.1),
    700: darken(baseColor, 0.2),
    800: darken(baseColor, 0.3),
    900: darken(baseColor, 0.4),
    950: darken(baseColor, 0.5)
  };
}

/**
 * Aclara un color (implementación básica)
 */
function lighten(color: string, amount: number): string {
  // Implementación simplificada para el ejemplo
  // En producción usar una librería de manipulación de colores
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * amount * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Oscurece un color (implementación básica)
 */
function darken(color: string, amount: number): string {
  // Implementación simplificada para el ejemplo
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * amount * 100);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
}

/**
 * Obtiene información de contraste de un color
 */
export function getColorInfo(token: string) {
  const tokenInfo = $dt(token);
  return {
    value: tokenInfo.value,
    variable: tokenInfo.variable,
    name: tokenInfo.name
  };
}

/**
 * Valida que un tema esté correctamente configurado
 */
export function validateTheme() {
  const requiredTokens = [
    'primary.color',
    'surface.0',
    'surface.950',
    'button.primary.background',
    'inputtext.background'
  ];

  const validation = {
    isValid: true,
    missingTokens: [] as string[],
    tokens: {} as Record<string, any>
  };

  requiredTokens.forEach(token => {
    try {
      const tokenInfo = $dt(token);
      validation.tokens[token] = tokenInfo;
    } catch (error) {
      validation.isValid = false;
      validation.missingTokens.push(token);
    }
  });

  return validation;
}

/**
 * Exporta la configuración actual del tema
 */
export function exportThemeConfig() {
  const config = {
    timestamp: new Date().toISOString(),
    primaryColor: getDesignToken('primary.color'),
    surfaceColors: {
      '0': getDesignToken('surface.0'),
      '50': getDesignToken('surface.50'),
      '100': getDesignToken('surface.100'),
      '500': getDesignToken('surface.500'),
      '950': getDesignToken('surface.950')
    },
    validation: validateTheme()
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Tipos TypeScript para mejor IDE support
 */
export type USCOFaculty = 'juridicas' | 'exactas' | 'sociales' | 'economia' | 'educacion' | 'ingenieria' | 'salud';
export type ThemeMode = 'light' | 'dark' | 'both';
export type USCOColorScale = typeof USCOColors.vinoTinto;
