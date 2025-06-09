import React from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useFormikContext, getIn } from "formik";
import TextField, { TextFieldProps } from "../common/TextField";
import Typography from "../common/Typography";
import theme from "../../theme";

export interface FormFieldProps extends Omit<TextFieldProps, "error"> {
  name: string;
  label?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  hint,
  style,
  labelStyle,
  required = false,
  ...rest
}) => {
  const { values, handleChange, handleBlur, touched, errors } =
    useFormikContext<any>();

  const value = getIn(values, name);
  const error = getIn(touched, name) && getIn(errors, name);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Typography
            variant="bodySecondary"
            style={[styles.label, labelStyle]}
          >
            {label}
          </Typography>

          {required && (
            <Typography
              variant="bodySecondary"
              color={theme.colors.status.error}
            >
              *
            </Typography>
          )}
        </View>
      )}

      <TextField
        value={value}
        onChangeText={handleChange(name)}
        onBlur={handleBlur(name)}
        error={error}
        helper={hint}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.s,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xxs,
  },
  label: {
    marginRight: theme.spacing.xxs,
  },
});

export default FormField;
