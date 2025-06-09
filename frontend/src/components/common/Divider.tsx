import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  label?: string;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<ViewStyle>;
}

const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  thickness = 1,
  color = theme.colors.neutral.mediumGray,
  label,
  spacing = theme.spacing.m,
  style,
  labelStyle,
}) => {
  const dividerStyle = {
    backgroundColor: color,
    ...(orientation === "horizontal"
      ? { height: thickness, marginVertical: spacing }
      : {
          width: thickness,
          marginHorizontal: spacing,
          height: "100%" as unknown as number,
        }),
  };

  // Se houver label, cria um divider com texto no meio
  if (label && orientation === "horizontal") {
    return (
      <View style={[styles.labelContainer, style]}>
        <View style={[styles.divider, dividerStyle, styles.labelDivider]} />
        <View style={[styles.labelWrapper, labelStyle]}>
          <Typography variant="bodySecondary">{label}</Typography>
        </View>
        <View style={[styles.divider, dividerStyle, styles.labelDivider]} />
      </View>
    );
  }

  return <View style={[styles.divider, dividerStyle, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    flexShrink: 0,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  labelDivider: {
    flex: 1,
    marginVertical: 0,
  },
  labelWrapper: {
    paddingHorizontal: theme.spacing.xs,
  },
});

export default Divider;
