/**
 * Tema Universidad Surcolombiana (USCO) para PrimeNG
 * 
 * Basado en los colores institucionales y mejores prácticas de design tokens
 * @see https://www.usco.edu.co/imagen-institucional/
 * @see https://primeng.org/theming
 */

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import type { Preset } from '@primeuix/themes/types';

/**
 * Constantes de colores institucionales USCO
 */
export const USCOColors = {
  // Colores principales USCO
  vinoTinto: {
    50: '#F4E7E8',   // Más claro
    100: '#E3C5C6',  // Claro
    200: '#DDB8BA',  // 
    300: '#B15B60',  // 
    400: '#A84E53',  // 
    500: '#8F141B',  // Principal - Vino tinto USCO
    600: '#7B1218',  // Oscuro
    700: '#621015',  // Más oscuro
    800: '#4A0C10',  // 
    900: '#31080B',  // 
    950: '#1A0406'   // Más oscuro
  },
  
  gris: {
    50: '#F9F9FA',   // Casi blanco
    100: '#F3F4F6',  // Muy claro
    200: '#E5E7EB',  // Claro
    300: '#D1D5DB',  // 
    400: '#9CA3AF',  // 
    500: '#6B7280',  // Medio
    600: '#4D626C',  // Principal - Gris USCO
    700: '#374151',  // Oscuro
    800: '#1F2937',  // Más oscuro
    900: '#111827',  // 
    950: '#030712'   // Casi negro
  },
  
  ocre: {
    50: '#F9F6ED',   // Pálido
    100: '#F5F2E4',  // Lightest
    200: '#EFEAD3',  // Lighter
    300: '#E5DDB8',  // Light
    400: '#DFD4A6',  // Principal - Ocre USCO
    500: '#D4C584',  // 
    600: '#C7B363',  // Dark
    700: '#B8A054',  // 
    800: '#96834A',  // 
    900: '#776840',  // 
    950: '#433A24'   // Más oscuro
  }
} as const;

/**
 * Tokens primitivos personalizados USCO
 */
const USCOPrimitiveTokens = {
  borderRadius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px'
  },
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  // Paletas de colores USCO
  uscoVino: USCOColors.vinoTinto,
  uscoGris: USCOColors.gris,
  uscoOcre: USCOColors.ocre,
  
  // Alias para compatibilidad con PrimeNG
  red: USCOColors.vinoTinto,
  gray: USCOColors.gris,
  amber: USCOColors.ocre
};

/**
 * Tokens semánticos USCO
 */
const USCOSemanticTokens = {
  transitionDuration: '0.2s',
  
  focusRing: {
    width: '2px',
    style: 'solid',
    color: '{uscoVino.500}',
    offset: '2px'
  },
  
  // Colores principales
  primary: USCOColors.vinoTinto,
  
  // Superficie y fondos
  surface: {
    0: '#ffffff',
    50: '{uscoOcre.50}',
    100: '{uscoOcre.100}',
    200: '{uscoOcre.200}',
    300: '{uscoGris.200}',
    400: '{uscoGris.300}',
    500: '{uscoGris.400}',
    600: '{uscoGris.500}',
    700: '{uscoGris.600}',
    800: '{uscoGris.700}',
    900: '{uscoGris.800}',
    950: '{uscoGris.900}'
  },
  
  // Estados y feedback
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  warn: {
    50: '{uscoOcre.50}',
    100: '{uscoOcre.100}',
    200: '{uscoOcre.200}',
    300: '{uscoOcre.300}',
    400: '{uscoOcre.400}',
    500: '{uscoOcre.500}',
    600: '{uscoOcre.600}',
    700: '{uscoOcre.700}',
    800: '{uscoOcre.800}',
    900: '{uscoOcre.900}',
    950: '{uscoOcre.950}'
  },
  
  danger: {
    50: '{uscoVino.50}',
    100: '{uscoVino.100}',
    200: '{uscoVino.200}',
    300: '{uscoVino.300}',
    400: '{uscoVino.400}',
    500: '{uscoVino.500}',
    600: '{uscoVino.600}',
    700: '{uscoVino.700}',
    800: '{uscoVino.800}',
    900: '{uscoVino.900}',
    950: '{uscoVino.950}'
  }
};

/**
 * Configuraciones específicas de componentes
 */
const USCOComponentTokens = {
  // Botones
  button: {
    root: {
      borderRadius: '{borderRadius.lg}',
      paddingX: '1rem',
      paddingY: '0.75rem',
      gap: '0.5rem',
      label: {
        fontWeight: '{fontWeight.semibold}'
      },
      focusRing: {
        width: '{focusRing.width}',
        style: '{focusRing.style}',
        offset: '{focusRing.offset}'
      },
      primary: {
        background: '{primary.color}',
        hoverBackground: '{primary.600}',
        activeBackground: '{primary.700}',
        borderColor: '{primary.color}',
        hoverBorderColor: '{primary.600}',
        activeBorderColor: '{primary.700}',
        color: '#ffffff',
        hoverColor: '#ffffff',
        activeColor: '#ffffff'
      },
      secondary: {
        background: '{surface.100}',
        hoverBackground: '{surface.200}',
        activeBackground: '{surface.300}',
        borderColor: '{surface.300}',
        hoverBorderColor: '{surface.400}',
        activeBorderColor: '{surface.500}',
        color: '{surface.700}',
        hoverColor: '{surface.800}',
        activeColor: '{surface.900}'
      }
    }
  },
  
  // Inputs
  inputtext: {
    root: {
      borderRadius: '{borderRadius.lg}',
      paddingX: '1rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      background: '{surface.0}',
      borderColor: '{surface.300}',
      hoverBorderColor: '{surface.400}',
      focusBorderColor: '{primary.color}',
      invalidBorderColor: '{danger.500}',
      color: '{surface.700}',
      disabledBackground: '{surface.100}',
      disabledColor: '{surface.400}',
      placeholderColor: '{surface.400}',
      shadow: 'none',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'unset',
        offset: '0',
        shadow: '0 0 0 0.2rem {primary.color}20'
      }
    }
  },
  
  // Cards
  card: {
    root: {
      background: '{surface.0}',
      borderColor: '{surface.200}',
      color: '{surface.700}',
      borderRadius: '{borderRadius.xl}',
      shadow: '0 4px 6px rgba(143, 20, 27, 0.1)'
    }
  },
  
  // Tags
  tag: {
    root: {
      borderRadius: '{borderRadius.md}',
      paddingX: '0.75rem',
      paddingY: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '{fontWeight.medium}',
      primary: {
        background: '{primary.100}',
        color: '{primary.700}'
      },
      secondary: {
        background: '{surface.100}',
        color: '{surface.700}'
      },
      success: {
        background: '{success.100}',
        color: '{success.700}'
      },
      info: {
        background: '{info.100}',
        color: '{info.700}'
      },
      warn: {
        background: '{warn.100}',
        color: '{warn.700}'
      },
      danger: {
        background: '{danger.100}',
        color: '{danger.700}'
      }
    }
  },
  
  // Toolbar
  toolbar: {
    root: {
      borderRadius: '{borderRadius.lg}',
      background: '{surface.0}',
      borderColor: '{surface.200}',
      color: '{surface.700}',
      gap: '1rem',
      paddingX: '1.5rem',
      paddingY: '1rem'
    }
  },
  
  // Dialog
  dialog: {
    root: {
      background: '{surface.0}',
      borderColor: '{surface.200}',
      color: '{surface.700}',
      borderRadius: '{borderRadius.xl}',
      shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    header: {
      background: '{surface.0}',
      borderColor: '{surface.200}',
      color: '{surface.800}',
      padding: '1.5rem'
    },
    content: {
      padding: '1.5rem'
    }
  },
  togglebutton: {
    content: {
      checkedBackground: '{surface.200}'
    }
  }
  
};

/**
 * Preset completo del tema USCO
 */
export const USCOTheme: Preset = definePreset(Aura, {
  primitive: USCOPrimitiveTokens,
  semantic: USCOSemanticTokens,
  components: USCOComponentTokens,
  
  // CSS personalizado global
  css: ({ dt }) => `
    /* Variables CSS personalizadas USCO */
    :root {
      /* Colores USCO para compatibilidad */
      --usco-vino-tinto: ${USCOColors.vinoTinto[500]};
      --usco-gris: ${USCOColors.gris[600]};
      --usco-ocre: ${USCOColors.ocre[400]};
      
      /* Fuentes USCO */
      --font-family-usco: 'Inter', ui-sans-serif, system-ui, sans-serif;
      
      /* Sombras personalizadas */
      --shadow-usco-card: 0 4px 6px rgba(143, 20, 27, 0.1);
      --shadow-usco-dialog: 0 20px 25px -5px rgba(143, 20, 27, 0.1);
    }
    
    /* Estilos globales mejorados */
    .p-component {
      font-family: var(--font-family-usco);
    }
    
    /* Mejoras de accesibilidad */
    .p-button:focus-visible {
      outline: 2px solid ${dt('focusRing.color')};
      outline-offset: 2px;
    }
    
    /* Animaciones suaves */
    .p-button, .p-inputtext, .p-card {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Scrollbar personalizado */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${dt('surface.100')};
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${dt('surface.400')};
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${dt('surface.500')};
    }
  `
});

/**
 * Opciones de configuración del tema
 */
export const USCOThemeOptions = {
  prefix: 'p',
  darkModeSelector: '.dark-mode',
  cssLayer: false
} as const;

/**
 * Configuración completa para providePrimeNG
 */
export const USCOThemeConfig = {
  theme: {
    preset: USCOTheme,
    options: USCOThemeOptions
  },
  ripple: true,
  inputStyle: 'outlined' as const,
  locale: {
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
    monthNames: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    monthNamesShort: [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ],
    today: 'Hoy',
    clear: 'Limpiar',
    dateFormat: 'dd/mm/yy',
    weekHeader: 'Sem'
  }
};
