import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface RadioOption {
  label: string;
  value: string | number;
}

export interface RadioProps {
  options: RadioOption[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  direction?: "vertical" | "horizontal";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "small" | "medium" | "large";
}

const Radio: React.FC<RadioProps> = ({
  options,
  selectedValue,
  onSelect,
  direction = "vertical",
  disabled = false,
  style,
  size = "medium",
}) => {
  // Definir tamanhos com base no parâmetro size
  const getSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 24;
      case "medium":
      default:
        return 20;
    }
  };

  const radioSize = getSize();
  const innerSize = radioSize * 0.5;

  return (
    <View
      style={[
        styles.container,
        direction === "horizontal" && styles.horizontal,
        style,
      ]}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        const borderColor = disabled
          ? theme.colors.neutral.mediumGray
          : isSelected
          ? theme.colors.primary.secondary
          : theme.colors.neutral.darkGray;

        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.option,
              direction === "horizontal" && styles.horizontalOption,
            ]}
            onPress={() => onSelect(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radio,
                {
                  width: radioSize,
                  height: radioSize,
                  borderColor,
                },
              ]}
            >
              {isSelected && (
                <View
                  style={[
                    styles.selected,
                    {
                      width: innerSize,
                      height: innerSize,
                      backgroundColor: disabled
                        ? theme.colors.neutral.mediumGray
                        : theme.colors.primary.secondary,
                    },
                  ]}
                />
              )}
            </View>
            <Typography
              variant="body"
              style={[
                styles.label,
                disabled && { color: theme.colors.neutral.darkGray },
              ]}
            >
              {option.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xxs,
  },
  horizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xs,
  },
  horizontalOption: {
    marginRight: theme.spacing.m,
  },
  radio: {
    borderWidth: 2,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  selected: {
    borderRadius: 100,
  },
  label: {
    marginLeft: theme.spacing.xs,
  },
});

export default Radio;
