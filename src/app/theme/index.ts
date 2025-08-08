/**
 * Barrel export para el tema USCO
 * 
 * Centraliza todas las exportaciones relacionadas con el tema
 */

// Tema principal y configuración
export { 
  USCOTheme, 
  USCOThemeOptions, 
  USCOThemeConfig, 
  USCOColors 
} from './usco.theme';

// Utilidades del tema
export {
  getDesignToken,
  updateUSCOPrimaryPalette,
  updateUSCOSurfacePalette,
  toggleDarkMode,
  applyFacultyTheme,
  getColorInfo,
  validateTheme,
  exportThemeConfig,
  type USCOFaculty,
  type ThemeMode,
  type USCOColorScale
} from './theme.utils';

// Re-exportar utilidades de PrimeUI para conveniencia
export { 
  $dt, 
  updatePreset, 
  updatePrimaryPalette, 
  updateSurfacePalette 
} from '@primeuix/themes';
