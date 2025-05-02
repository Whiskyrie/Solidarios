/**
 * Definição da tipografia para o tema da aplicação Solidários
 * Baseado no guia de estilo visual fornecido
 */
import { TextStyle } from "react-native";
import colors from "./colors";

type FontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

interface TypographyStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  color: string;
  lineHeight?: number;
}

// Família de fontes
export const fontFamily = {
  primary: "Inter",
  alternative: "Roboto",
  monospace: "RobotoMono",
};

// Estilos de texto
export const typography: Record<string, TypographyStyle> = {
  h1: {
    fontSize: 24,
    fontFamily: fontFamily.primary,
    fontWeight: "bold",
    color: colors.neutral.black,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontFamily: fontFamily.primary,
    fontWeight: "bold",
    color: colors.neutral.black,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontFamily: fontFamily.primary,
    fontWeight: "600",
    color: colors.neutral.black,
    lineHeight: 26,
  },
  h4: {
    fontSize: 16,
    fontFamily: fontFamily.primary,
    fontWeight: "600",
    color: colors.neutral.black,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontFamily: fontFamily.primary,
    fontWeight: "normal",
    color: "#334155", // Cor específica para texto corpo
    lineHeight: 22,
  },
  bodySecondary: {
    fontSize: 14,
    fontFamily: fontFamily.primary,
    fontWeight: "normal",
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  small: {
    fontSize: 12,
    fontFamily: fontFamily.primary,
    fontWeight: "normal",
    color: colors.neutral.darkGray,
    lineHeight: 18,
  },
  button: {
    fontSize: 14,
    fontFamily: fontFamily.primary,
    fontWeight: "600",
    color: colors.neutral.white,
  },
  buttonSmall: {
    fontSize: 12,
    fontFamily: fontFamily.primary,
    fontWeight: "600",
    color: colors.neutral.white,
  },
};

// Função auxiliar para aplicar estilos de texto
export const applyTextStyle = (
  style: keyof typeof typography,
  overrides?: Partial<TextStyle>
): TextStyle => {
  return {
    ...typography[style],
    ...overrides,
  };
};

export default typography;
