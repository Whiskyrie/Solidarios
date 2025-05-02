import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import theme from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...rest
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      <View style={styles.contentContainer}>
        {leftIcon && !loading && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        {loading ? (
          <ActivityIndicator 
            color={variant === 'secondary' ? theme.colors.primary.main : theme.colors.neutral.white} 
            size="small" 
          />
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
        
        {rightIcon && !loading && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary.secondary, // Verde Turquesa
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary.main, // Azul Marinho
  },
  accent: {
    backgroundColor: theme.colors.primary.accent, // Amarelo
  },
  small: {
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.s,
    minHeight: 32,
  },
  medium: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    minHeight: 40,
  },
  large: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.fontFamily.primary,
    fontWeight: '600',
  },
  primaryText: {
    color: theme.colors.neutral.white,
  },
  secondaryText: {
    color: theme.colors.primary.main,
  },
  accentText: {
    color: theme.colors.neutral.black,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  disabledText: {
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default Button;