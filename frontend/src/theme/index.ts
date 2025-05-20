/**
 * Exportação principal do tema da aplicação Solidários
 */
import colors from "./colors";
import spacing from "./spacing";
import typography, { applyTextStyle, fontFamily } from "./typography";

// Definição de bordas
const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  extraLarge: 18,
  round: 9999, // Para botões circulares ou arredondados
};

// Definição de sombras
const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 0.5,
  },
  strong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Tema completo
const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  fontFamily,
  applyTextStyle,
};

export type Theme = typeof theme;

export default theme;
