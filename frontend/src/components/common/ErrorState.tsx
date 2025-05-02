import React from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from "react-native";
import Typography from "./Typography";
import Button from "./Button";
import theme from "../../theme";

export interface ErrorStateProps {
  title: string;
  description?: string;
  image?: ImageSourcePropType;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  error?: Error | string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  image,
  icon,
  actionLabel = "Tentar novamente",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  error,
}) => {
  return (
    <View style={[styles.container, style]}>
      {image && (
        <Image source={image} style={styles.image} resizeMode="contain" />
      )}

      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Typography
        variant="h3"
        style={styles.title}
        color={theme.colors.status.error}
      >
        {title}
      </Typography>

      {description && (
        <Typography variant="bodySecondary" style={styles.description}>
          {description}
        </Typography>
      )}

      {error && typeof error !== "string" && (
        <Typography variant="small" style={styles.errorDetail}>
          {error.message}
        </Typography>
      )}

      {error && typeof error === "string" && (
        <Typography variant="small" style={styles.errorDetail}>
          {error}
        </Typography>
      )}

      <View style={styles.buttonsContainer}>
        {actionLabel && onAction && (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            style={styles.primaryButton}
          />
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <Button
            title={secondaryActionLabel}
            onPress={onSecondaryAction}
            variant="secondary"
            style={styles.secondaryButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.l,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.m,
  },
  iconContainer: {
    marginBottom: theme.spacing.m,
  },
  title: {
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  description: {
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  errorDetail: {
    textAlign: "center",
    color: theme.colors.status.error,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.notifications.error.background,
    borderRadius: theme.borderRadius.small,
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.s,
  },
  primaryButton: {
    marginHorizontal: theme.spacing.xs,
  },
  secondaryButton: {
    marginHorizontal: theme.spacing.xs,
  },
});

export default ErrorState;
