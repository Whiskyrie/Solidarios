import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFormikContext, getIn } from "formik";
import Typography from "../common/Typography";
import theme from "../../theme";
import useGeocoding from "../../hooks/useGeocoding";
import { AddressSuggestion } from "../../api/geocoding";

export interface AddressAutocompleteProps {
  name: string;
  label?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  onSuggestionsChange?: (
    suggestions: AddressSuggestion[],
    loading: boolean
  ) => void;
  countryCode?: string;
  disabled?: boolean;
}

export interface AddressAutocompleteRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  selectAddress: (address: AddressSuggestion) => void;
}

const AddressAutocomplete = forwardRef<
  AddressAutocompleteRef,
  AddressAutocompleteProps
>(
  (
    {
      name,
      label = "Endereço",
      placeholder = "Digite seu endereço...",
      style,
      required = false,
      onSuggestionsChange,
      countryCode = "br",
      disabled = false,
    },
    ref
  ) => {
    const { values, setFieldValue, touched, errors } = useFormikContext<any>();
    const [inputValue, setInputValue] = useState("");
    const [isAddressSelected, setIsAddressSelected] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const { suggestions, isLoading, searchAddresses, clearSuggestions } =
      useGeocoding({
        countryCode,
        debounceMs: 300,
        minQueryLength: 3,
        maxSuggestions: 8,
      });

    // Obter valores do formulário
    const value = getIn(values, name) || "";
    const fieldError = getIn(touched, name) && getIn(errors, name);

    // Expor métodos através da ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        setInputValue("");
        setFieldValue(name, "");
        setIsAddressSelected(false);
        clearSuggestions();
      },
      selectAddress: (address: AddressSuggestion) => {
        const formattedAddress = formatSelectedAddress(address);
        setInputValue(formattedAddress);
        setFieldValue(name, formattedAddress);
        setIsAddressSelected(true);
        clearSuggestions();
      },
    }));

    // Sincronizar com valor do formulário
    useEffect(() => {
      if (value && value !== inputValue && !isAddressSelected) {
        setInputValue(value);
      }
    }, [value, inputValue, isAddressSelected]);

    // Notificar mudanças para o componente pai
    useEffect(() => {
      if (onSuggestionsChange) {
        onSuggestionsChange(suggestions, isLoading);
      }
    }, [suggestions, isLoading, onSuggestionsChange]);

    const formatSelectedAddress = (suggestion: AddressSuggestion): string => {
      const parts = [];

      // Rua + Número
      if (suggestion.street) {
        if (suggestion.number) {
          parts.push(`${suggestion.street}, ${suggestion.number}`);
        } else {
          parts.push(suggestion.street);
        }
      }

      // Bairro
      if (suggestion.neighborhood) {
        parts.push(suggestion.neighborhood);
      }

      // Cidade
      if (suggestion.city) {
        parts.push(suggestion.city);
      }

      return parts.join(" - ");
    };

    const handleTextChange = (text: string) => {
      setInputValue(text);
      setFieldValue(name, text);
      setIsAddressSelected(false);

      if (text.trim().length >= 3) {
        searchAddresses(text.trim());
      } else {
        clearSuggestions();
      }
    };

    return (
      <View style={[styles.container, style]}>
        {label && (
          <View style={styles.labelContainer}>
            <Typography variant="bodySecondary" style={styles.label}>
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

        <View
          style={[
            styles.inputContainer,
            fieldError && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          <MaterialIcons
            name="location-on"
            size={22}
            color="#666"
            style={styles.inputIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputValue}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#999"
            editable={!disabled}
          />

          {isLoading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary.main}
              style={styles.loadingIndicator}
            />
          )}

          {isAddressSelected && !isLoading && (
            <MaterialIcons
              name="check-circle"
              size={20}
              color={theme.colors.status.success}
              style={styles.checkIcon}
            />
          )}
        </View>

        {fieldError && <Text style={styles.validationError}>{fieldError}</Text>}
      </View>
    );
  }
);

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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F8FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  inputError: {
    borderColor: theme.colors.status.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.neutral.lightGray,
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    color: "#333",
  },
  loadingIndicator: {
    marginLeft: theme.spacing.s,
  },
  checkIcon: {
    marginLeft: theme.spacing.s,
  },
  validationError: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
});

AddressAutocomplete.displayName = "AddressAutocomplete";

export default AddressAutocomplete;
