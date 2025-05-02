import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  helperStyle,
  errorStyle,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  const inputContainerBorderColor = error
    ? theme.colors.status.error
    : isFocused
    ? theme.colors.primary.secondary
    : theme.colors.neutral.mediumGray;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="bodySecondary" style={[styles.label, labelStyle]}>
          {label}
        </Typography>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: inputContainerBorderColor,
            backgroundColor: editable
              ? theme.colors.neutral.white
              : theme.colors.neutral.lightGray,
          },
          inputContainerStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: editable
                ? theme.colors.neutral.black
                : theme.colors.neutral.darkGray,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral.darkGray}
          secureTextEntry={secureTextEntry}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || helper) && (
        <Typography
          variant="small"
          color={
            error ? theme.colors.status.error : theme.colors.neutral.darkGray
          }
          style={[styles.helperText, error ? errorStyle : helperStyle]}
        >
          {error || helper}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.s,
  },
  label: {
    marginBottom: theme.spacing.xxs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.xs,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    height: "100%",
    paddingVertical: 0,
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
  helperText: {
    marginTop: theme.spacing.xxs,
  },
});

export default TextField;
