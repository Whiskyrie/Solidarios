import React from "react";
import {
  Text,
  TextProps,
  StyleSheet,
  StyleProp,
  TextStyle,
} from "react-native";
import theme from "../../theme";

/**
 * Variantes de tipografia disponíveis no sistema
 *
 * @description
 * - h1-h4: Títulos hierárquicos
 * - body/bodySecondary: Corpo de texto principal e secundário
 * - small: Texto pequeno para informações auxiliares
 * - caption: Texto muito pequeno para rótulos e indicadores (NOVO)
 * - button: Texto otimizado para botões e CTAs (NOVO)
 */
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "bodySecondary"
  | "small"
  | "caption" // NOVO: Para textos muito pequenos como contadores
  | "button"; // NOVO: Para textos de botões

export interface TypographyProps extends TextProps {
  /** Variante tipográfica a ser aplicada */
  variant?: TypographyVariant;

  /** Cor customizada do texto (sobrescreve a cor padrão da variante) */
  color?: string;

  /** Centraliza o texto horizontalmente */
  center?: boolean;

  /** Transforma o texto em maiúsculas (NOVO) */
  uppercase?: boolean;

  /** Espaçamento entre letras customizado (NOVO) */
  letterSpacing?: number;

  /** Opacidade do texto (0-1) (NOVO) */
  opacity?: number;

  /** Peso da fonte customizado (NOVO) */
  fontWeight?: TextStyle["fontWeight"];

  /** Estilos adicionais */
  style?: StyleProp<TextStyle>;

  /** Conteúdo do texto */
  children: React.ReactNode;

  /** Trunca o texto com reticências se exceder o número de linhas (NOVO) */
  numberOfLines?: number;

  /** Modo de quebra de linha (NOVO) */
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
}

/**
 * Componente Typography
 *
 * @description
 * Componente base para toda a tipografia do aplicativo, garantindo
 * consistência visual e facilitando manutenção de estilos de texto.
 *
 * @example
 * ```tsx
 * // Título principal
 * <Typography variant="h1">Minhas Doações</Typography>
 *
 * // Texto com cor customizada
 * <Typography variant="body" color="#FF5733">Texto colorido</Typography>
 *
 * // Caption com opacidade (novo)
 * <Typography variant="caption" opacity={0.8}>10 doações</Typography>
 *
 * // Botão com texto em maiúsculas (novo)
 * <Typography variant="button" uppercase>Nova Doação</Typography>
 * ```
 */
const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  color,
  center = false,
  uppercase = false,
  letterSpacing,
  opacity,
  fontWeight,
  style,
  children,
  ...rest
}) => {
  const textStyles = [
    styles[variant],
    color && { color },
    center && styles.center,
    uppercase && styles.uppercase,
    letterSpacing !== undefined && { letterSpacing },
    opacity !== undefined && { opacity },
    fontWeight && { fontWeight },
    style,
  ];

  return (
    <Text style={textStyles} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Variantes existentes mantidas sem alteração
  h1: {
    fontSize: theme.typography.h1.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.typography.h1.color,
    lineHeight: theme.typography.h1.lineHeight,
  },
  h2: {
    fontSize: theme.typography.h2.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.typography.h2.color,
    lineHeight: theme.typography.h2.lineHeight,
  },
  h3: {
    fontSize: theme.typography.h3.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.typography.h3.color,
    lineHeight: theme.typography.h3.lineHeight,
  },
  h4: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.typography.h4.color,
    lineHeight: theme.typography.h4.lineHeight,
  },
  body: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.body.fontWeight,
    color: theme.typography.body.color,
    lineHeight: theme.typography.body.lineHeight,
  },
  bodySecondary: {
    fontSize: theme.typography.bodySecondary.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.bodySecondary.fontWeight,
    color: theme.typography.bodySecondary.color,
    lineHeight: theme.typography.bodySecondary.lineHeight,
  },
  small: {
    fontSize: theme.typography.small.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.small.fontWeight,
    color: theme.typography.small.color,
    lineHeight: theme.typography.small.lineHeight,
  },

  // NOVAS VARIANTES
  caption: {
    fontSize: theme.typography.caption?.fontSize || 11,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.caption?.fontWeight || "400",
    color: theme.typography.caption?.color || theme.colors.neutral.mediumGray,
    lineHeight: theme.typography.caption?.lineHeight || 14,
    letterSpacing: theme.typography.caption?.letterSpacing || 0.2,
  },
  button: {
    fontSize: theme.typography.button?.fontSize || 14,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.button?.fontWeight || "600",
    color: theme.typography.button?.color || theme.colors.primary.main,
    lineHeight: theme.typography.button?.lineHeight || 20,
    letterSpacing: theme.typography.button?.letterSpacing || 0.5,
  },

  // Estilos modificadores
  center: {
    textAlign: "center",
  },
  uppercase: {
    textTransform: "uppercase",
  },
});

export default Typography;
