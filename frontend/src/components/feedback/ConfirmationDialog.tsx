import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Typography from "../common/Typography";
import Button from "../common/Button";
import theme from "../../theme";

export type ConfirmationVariant = "default" | "success" | "danger" | "warning";

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ConfirmationVariant;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  variant = "default",
  style,
  icon,
}) => {
  // Determinar cores com base na variante
  const getColors = (): { primary: string; text: string } => {
    switch (variant) {
      case "success":
        return {
          primary: theme.colors.status.success,
          text: theme.colors.neutral.white,
        };
      case "danger":
        return {
          primary: theme.colors.status.error,
          text: theme.colors.neutral.white,
        };
      case "warning":
        return {
          primary: theme.colors.status.warning,
          text: theme.colors.neutral.black,
        };
      case "default":
      default:
        return {
          primary: theme.colors.primary.secondary,
          text: theme.colors.neutral.white,
        };
    }
  };

  const colors = getColors();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, style]}>
              {/* Cabeçalho */}
              <View
                style={[styles.header, { backgroundColor: colors.primary }]}
              >
                {icon && <View style={styles.icon}>{icon}</View>}
                <Typography
                  variant="h3"
                  color={colors.text}
                  style={styles.title}
                >
                  {title}
                </Typography>
              </View>

              {/* Conteúdo */}
              <View style={styles.content}>
                {message && (
                  <Typography variant="body" style={styles.message}>
                    {message}
                  </Typography>
                )}

                {/* Botões */}
                <View style={styles.buttonsContainer}>
                  <Button
                    title={cancelLabel}
                    onPress={onCancel}
                    variant="secondary"
                    style={styles.cancelButton}
                  />

                  <Button
                    title={confirmLabel}
                    onPress={onConfirm}
                    variant={variant === "default" ? "primary" : "accent"}
                    style={[
                      styles.confirmButton,
                      variant === "danger" && styles.dangerButton,
                      variant === "success" && styles.successButton,
                      variant === "warning" && styles.warningButton,
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
    ...theme.shadows.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.s,
  },
  icon: {
    marginRight: theme.spacing.s,
  },
  title: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.s,
  },
  message: {
    marginBottom: theme.spacing.m,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    marginRight: theme.spacing.s,
  },
  confirmButton: {
    minWidth: 100,
  },
  dangerButton: {
    backgroundColor: theme.colors.status.error,
  },
  successButton: {
    backgroundColor: theme.colors.status.success,
  },
  warningButton: {
    backgroundColor: theme.colors.status.warning,
  },
});

export default ConfirmationDialog;
