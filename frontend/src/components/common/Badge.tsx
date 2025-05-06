import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Typography from "./Typography";
import theme from "../../theme";
import { ItemStatus } from "../../types/items.types";

export const BADGE_VARIANTS = {
  available: "available",
  reserved: "reserved",
  distributed: "distributed",
  lowStock: "lowStock",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "small" | "medium";
  style?: StyleProp<ViewStyle>;
}

// Função auxiliar para mapear ItemStatus para BadgeVariant
export const mapStatusToBadgeVariant = (status: ItemStatus): BadgeVariant => {
  switch (status) {
    case ItemStatus.DISPONIVEL:
      return "available";
    case ItemStatus.RESERVADO:
      return "reserved";
    case ItemStatus.DISTRIBUIDO:
      return "distributed";
    default:
      return "info";
  }
};

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "info",
  size = "medium",
  style,
}) => {
  // Determinar as cores baseadas na variante
  let backgroundColor, textColor;

  switch (variant) {
    case "available":
      backgroundColor = theme.colors.badges.available.background;
      textColor = theme.colors.badges.available.text;
      break;
    case "reserved":
      backgroundColor = theme.colors.badges.reserved.background;
      textColor = theme.colors.badges.reserved.text;
      break;
    case "distributed":
      backgroundColor = theme.colors.badges.distributed.background;
      textColor = theme.colors.badges.distributed.text;
      break;
    case "lowStock":
      backgroundColor = theme.colors.badges.lowStock.background;
      textColor = theme.colors.badges.lowStock.text;
      break;
    case "success":
      backgroundColor = theme.colors.notifications.success.background;
      textColor = theme.colors.notifications.success.text;
      break;
    case "warning":
      backgroundColor = theme.colors.notifications.warning.background;
      textColor = theme.colors.notifications.warning.text;
      break;
    case "error":
      backgroundColor = theme.colors.notifications.error.background;
      textColor = theme.colors.notifications.error.text;
      break;
    case "info":
    default:
      backgroundColor = theme.colors.notifications.info.background;
      textColor = theme.colors.notifications.info.text;
  }

  return (
    <View style={[styles.container, { backgroundColor }, styles[size], style]}>
      <Typography
        variant={size === "small" ? "small" : "bodySecondary"}
        color={textColor}
        style={styles.text}
      >
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xxs,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.xs,
  },
  text: {
    fontWeight: "500",
  },
});

export default Badge;
