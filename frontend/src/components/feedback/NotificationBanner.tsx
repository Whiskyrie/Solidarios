import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import Typography from "../common/Typography";
import theme from "../../theme";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationBannerProps {
  visible: boolean;
  type?: NotificationType;
  message: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  position?: "top" | "bottom";
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Componentes de ícones definidos antes do uso
const CloseIcon = ({ color = "#000000" }: { color?: string }) => (
  <View style={closeIconStyles.container}>
    <View style={[closeIconStyles.line1, { backgroundColor: color }]} />
    <View style={[closeIconStyles.line2, { backgroundColor: color }]} />
  </View>
);

const SuccessIcon = () => (
  <View style={commonIconStyles.container}>
    <View style={commonIconStyles.check} />
  </View>
);

const ErrorIcon = () => (
  <View style={commonIconStyles.container}>
    <View style={commonIconStyles.exclamation} />
  </View>
);

const WarningIcon = () => (
  <View style={commonIconStyles.container}>
    <View style={commonIconStyles.exclamation} />
  </View>
);

const InfoIcon = () => (
  <View style={commonIconStyles.container}>
    <View style={commonIconStyles.info} />
  </View>
);

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  type = "info",
  message,
  description,
  onClose,
  autoClose = true,
  duration = 5000,
  position = "top",
  style,
  icon,
  action,
}) => {
  const translateY = useRef(
    new Animated.Value(position === "top" ? -100 : 100)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getTypeStyles = (): {
    backgroundColor: string;
    iconColor: string;
    textColor: string;
  } => {
    switch (type) {
      case "success":
        return {
          backgroundColor: theme.colors.notifications.success.background,
          iconColor: theme.colors.notifications.success.icon,
          textColor: theme.colors.notifications.success.text,
        };
      case "error":
        return {
          backgroundColor: theme.colors.notifications.error.background,
          iconColor: theme.colors.notifications.error.icon,
          textColor: theme.colors.notifications.error.text,
        };
      case "warning":
        return {
          backgroundColor: theme.colors.notifications.warning.background,
          iconColor: theme.colors.notifications.warning.icon,
          textColor: theme.colors.notifications.warning.text,
        };
      case "info":
      default:
        return {
          backgroundColor: theme.colors.notifications.info.background,
          iconColor: theme.colors.notifications.info.icon,
          textColor: theme.colors.notifications.info.text,
        };
    }
  };

  useEffect(() => {
    const opacityListener = opacity.addListener(({ value }) => {
      opacityValue.current = value;
    });
    return () => {
      opacity.removeListener(opacityListener);
    };
  }, [opacity]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose && onClose) {
        timerRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === "top" ? -100 : 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onClose) {
          onClose();
        }
      });

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, autoClose, duration, onClose, position]);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === "top" ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) {
        onClose();
      }
    });
  };

  const renderIcon = () => {
    if (icon) {
      return <View style={styles.icon}>{icon}</View>;
    }
    const typeStyles = getTypeStyles();
    return (
      <View
        style={[styles.defaultIcon, { backgroundColor: typeStyles.iconColor }]}
      >
        {type === "success" && <SuccessIcon />}
        {type === "error" && <ErrorIcon />}
        {type === "warning" && <WarningIcon />}
        {type === "info" && <InfoIcon />}
      </View>
    );
  };

  if (!visible && opacityValue.current === 0) {
    return null;
  }

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        position === "top" ? styles.topPosition : styles.bottomPosition,
        {
          backgroundColor: typeStyles.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.contentContainer}>
        {renderIcon()}
        <View style={styles.messageContainer}>
          <Typography
            variant="body"
            color={typeStyles.textColor}
            style={styles.message}
          >
            {message}
          </Typography>
          {description && (
            <Typography
              variant="small"
              color={typeStyles.textColor}
              style={styles.description}
            >
              {description}
            </Typography>
          )}
        </View>
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <CloseIcon color={typeStyles.textColor} />
          </TouchableOpacity>
        )}
      </View>
      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            action.onPress();
            handleClose();
          }}
          activeOpacity={0.7}
        >
          <Typography
            variant="bodySecondary"
            color={typeStyles.iconColor}
            style={styles.actionLabel}
          >
            {action.label}
          </Typography>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Estilos para os ícones
const closeIconStyles = StyleSheet.create({
  container: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  line1: {
    width: 16,
    height: 2,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  line2: {
    width: 16,
    height: 2,
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
});

const commonIconStyles = StyleSheet.create({
  container: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  check: {
    width: 7,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  exclamation: {
    width: 2,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  info: {
    width: 2,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
});

// Estilos principais
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: theme.spacing.s,
    right: theme.spacing.s,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.s,
    ...theme.shadows.medium,
    zIndex: 9999,
  },
  topPosition: {
    top: theme.spacing.l,
  },
  bottomPosition: {
    bottom: theme.spacing.l,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  defaultIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.xs,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontWeight: "600",
  },
  description: {
    marginTop: 2,
  },
  closeButton: {
    padding: theme.spacing.xxs,
    marginLeft: theme.spacing.xs,
  },
  actionButton: {
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "flex-end",
  },
  actionLabel: {
    fontWeight: "600",
  },
});

export default NotificationBanner;
