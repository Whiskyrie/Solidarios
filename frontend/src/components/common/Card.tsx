import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  rightHeaderContent?: React.ReactNode;
  footer?: React.ReactNode;
  elevation?: "none" | "small" | "medium" | "large";
  fullWidth?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  style,
  contentStyle,
  headerStyle,
  rightHeaderContent,
  footer,
  elevation = "small",
  fullWidth = false,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  type ElevationStyleKey =
    | "elevationNone"
    | "elevationSmall"
    | "elevationMedium"
    | "elevationLarge";
  const elevationKey = `elevation${
    elevation.charAt(0).toUpperCase() + elevation.slice(1)
  }` as ElevationStyleKey;

  const cardStyles = [
    styles.card,
    styles[elevationKey],
    fullWidth && styles.fullWidth,
    style,
  ];

  return (
    <Container
      style={cardStyles}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle || rightHeaderContent) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerTextContainer}>
            {title && (
              <Typography variant="h4" style={styles.title}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="bodySecondary" style={styles.subtitle}>
                {subtitle}
              </Typography>
            )}
          </View>
          {rightHeaderContent && (
            <View style={styles.rightHeaderContent}>{rightHeaderContent}</View>
          )}
        </View>
      )}

      <View style={[styles.content, contentStyle]}>{children}</View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    overflow: "hidden",
  },
  elevationNone: {
    // Sem sombra
  },
  elevationSmall: {
    ...theme.shadows.small,
  },
  elevationMedium: {
    ...theme.shadows.medium,
  },
  elevationLarge: {
    ...theme.shadows.large,
  },
  fullWidth: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.mediumGray,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  rightHeaderContent: {
    marginLeft: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.s,
  },
  footer: {
    padding: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.mediumGray,
  },
});

export default Card;
