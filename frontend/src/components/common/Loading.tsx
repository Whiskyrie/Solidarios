import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Modal,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface LoadingProps {
  visible?: boolean;
  message?: string;
  size?: "small" | "large";
  color?: string;
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Loading: React.FC<LoadingProps> = ({
  visible = true,
  message,
  size = "large",
  color = theme.colors.primary.secondary,
  overlay = false,
  style,
}) => {
  const content = (
    <View style={[styles.container, overlay && styles.overlayContainer, style]}>
      <ActivityIndicator size={size} color={color} />

      {message && (
        <Typography variant="bodySecondary" style={styles.message} center>
          {message}
        </Typography>
      )}
    </View>
  );

  if (overlay) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        {content}
      </Modal>
    );
  }

  if (!visible) {
    return null;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.m,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  message: {
    marginTop: theme.spacing.s,
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    ...theme.shadows.small,
  },
});

export default Loading;
