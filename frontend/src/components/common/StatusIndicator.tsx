import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Typography from "./Typography";
import theme from "../../theme";
import { ItemStatus } from "../../types/items.types";

export type StatusType = "success" | "warning" | "error" | "info" | "neutral";

export interface StatusIndicatorProps {
  type?: StatusType;
  status?: ItemStatus;
  label?: string;
  size?: "small" | "medium" | "large";
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type = "neutral",
  status,
  label,
  size = "medium",
  style,
  showLabel = true,
}) => {
  // Se status for fornecido, derivar o tipo a partir dele
  if (status) {
    switch (status) {
      case ItemStatus.DISPONIVEL:
        type = "success";
        label = label || "Disponível";
        break;
      case ItemStatus.RESERVADO:
        type = "warning";
        label = label || "Reservado";
        break;
      case ItemStatus.DISTRIBUIDO:
        type = "info";
        label = label || "Distribuído";
        break;
      default:
        type = "neutral";
    }
  }

  // Determinar cor com base no tipo
  let backgroundColor;
  switch (type) {
    case "success":
      backgroundColor = theme.colors.status.success;
      break;
    case "warning":
      backgroundColor = theme.colors.status.warning;
      break;
    case "error":
      backgroundColor = theme.colors.status.error;
      break;
    case "info":
      backgroundColor = theme.colors.status.info;
      break;
    case "neutral":
    default:
      backgroundColor = theme.colors.neutral.darkGray;
  }

  // Determinar tamanho do indicador
  let indicatorSize;
  let textVariant: "small" | "bodySecondary";

  switch (size) {
    case "small":
      indicatorSize = 8;
      textVariant = "small";
      break;
    case "large":
      indicatorSize = 16;
      textVariant = "bodySecondary";
      break;
    case "medium":
    default:
      indicatorSize = 12;
      textVariant = "small";
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.indicator,
          {
            width: indicatorSize,
            height: indicatorSize,
            backgroundColor,
          },
        ]}
      />

      {showLabel && label && (
        <Typography variant={textVariant} style={styles.label}>
          {label}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    borderRadius: 50,
  },
  label: {
    marginLeft: theme.spacing.xs,
  },
});

export default StatusIndicator;
