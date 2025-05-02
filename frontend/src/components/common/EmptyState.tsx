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

export interface EmptyStateProps {
  title: string;
  description?: string;
  image?: ImageSourcePropType;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  image,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {image && (
        <Image source={image} style={styles.image} resizeMode="contain" />
      )}

      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Typography variant="h3" style={styles.title}>
        {title}
      </Typography>

      {description && (
        <Typography variant="bodySecondary" style={styles.description}>
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.button}
        />
      )}
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
    marginBottom: theme.spacing.m,
  },
  button: {
    marginTop: theme.spacing.s,
  },
});

export default EmptyState;
