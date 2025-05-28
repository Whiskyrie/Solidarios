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
  onAddressSelect?: (address: AddressSuggestion) => void;
  onSuggestionsChange?: (suggestions: AddressSuggestion[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onInputChange?: (value: string) => void;
  countryCode?: string;
  disabled?: boolean;
}

export interface AddressAutocompleteRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

interface AddressFields {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
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
      onAddressSelect,
      onSuggestionsChange,
      onLoadingChange,
      onInputChange,
      countryCode = "br",
      disabled = false,
    },
    ref
  ) => {
    const { values, setFieldValue, touched, errors } = useFormikContext<any>();
    const [inputValue, setInputValue] = useState("");
    const [selectedSuggestion, setSelectedSuggestion] =
      useState<AddressSuggestion | null>(null);
    const inputRef = useRef<TextInput>(null);

    const { suggestions, isLoading, error, searchAddresses, clearSuggestions } =
      useGeocoding({
        countryCode,
        debounceMs: 500,
        minQueryLength: 3,
        maxSuggestions: 6,
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
        setSelectedSuggestion(null);
        clearSuggestions();
      },
      getValue: () => inputValue,
      setValue: (newValue: string) => {
        setInputValue(newValue);
        setFieldValue(name, newValue);
      },
    }));

    // Sincronizar com valor do formulário
    useEffect(() => {
      if (value && value !== inputValue && !selectedSuggestion) {
        setInputValue(value);
      }
    }, [value, inputValue, selectedSuggestion]);

    // Notificar mudanças nas sugestões para o componente pai
    useEffect(() => {
      if (onSuggestionsChange) {
        onSuggestionsChange(suggestions);
      }
    }, [suggestions, onSuggestionsChange]);

    // Notificar mudanças no loading para o componente pai
    useEffect(() => {
      if (onLoadingChange) {
        onLoadingChange(isLoading);
      }
    }, [isLoading, onLoadingChange]);

    const handleTextChange = (text: string) => {
      setInputValue(text);
      setFieldValue(name, text);
      setSelectedSuggestion(null);

      // Notificar mudança no input para o componente pai
      if (onInputChange) {
        onInputChange(text);
      }

      if (text.trim().length >= 3) {
        searchAddresses(text.trim());
      } else {
        clearSuggestions();
      }
    };

    // Método público para seleção de endereço (chamado pelo componente pai)
    const selectAddress = useCallback(
      (suggestion: AddressSuggestion) => {
        setSelectedSuggestion(suggestion);
        setInputValue(suggestion.displayName);
        setFieldValue(name, suggestion.displayName);

        // Preencher campos relacionados
        const addressFields: AddressFields = {
          street: suggestion.street,
          number: suggestion.number,
          neighborhood: suggestion.neighborhood,
          city: suggestion.city,
          state: suggestion.state,
          postalCode: suggestion.postalCode,
          fullAddress: suggestion.displayName,
        };

        Object.entries(addressFields).forEach(([field, value]) => {
          if (value) {
            const fieldNames = [
              `${field}`,
              `address.${field}`,
              `endereco.${field}`,
              `address${field.charAt(0).toUpperCase() + field.slice(1)}`,
            ];

            fieldNames.forEach((fieldName) => {
              if (getIn(values, fieldName) !== undefined) {
                setFieldValue(fieldName, value);
              }
            });
          }
        });

        if (onAddressSelect) {
          onAddressSelect(suggestion);
        }

        setTimeout(() => clearSuggestions(), 300);
      },
      [name, setFieldValue, values, onAddressSelect, clearSuggestions]
    );

    // Expor o método selectAddress para uso externo
    React.useEffect(() => {
      if (ref && typeof ref === "object" && ref.current) {
        (ref.current as any).selectAddress = selectAddress;
      }
    }, [selectAddress, ref]);

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

          {selectedSuggestion && !isLoading && (
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
