import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Modal,
  Pressable,
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
  countryCode?: string;
  disabled?: boolean;
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

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  name,
  label = "Endereço",
  placeholder = "Digite seu endereço...",
  style,
  required = false,
  onAddressSelect,
  countryCode = "br",
  disabled = false,
}) => {
  const { values, setFieldValue, touched, errors } = useFormikContext<any>();
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { suggestions, isLoading, error, searchAddresses, clearSuggestions } =
    useGeocoding({
      countryCode,
      debounceMs: 500,
      minQueryLength: 3,
      maxSuggestions: 5,
    });

  // Obter valores do formulário
  const value = getIn(values, name) || "";
  const fieldError = getIn(touched, name) && getIn(errors, name);

  // Sincronizar com valor do formulário
  useEffect(() => {
    if (value && value !== inputValue && !selectedSuggestion) {
      setInputValue(value);
    }
  }, [value, inputValue, selectedSuggestion]);

  /**
   * Manipular mudança de texto
   */
  const handleTextChange = (text: string) => {
    setInputValue(text);
    setFieldValue(name, text);
    setSelectedSuggestion(null);

    if (text.trim().length >= 3) {
      searchAddresses(text.trim());
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  /**
   * Selecionar sugestão
   */
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    setInputValue(suggestion.displayName);
    setFieldValue(name, suggestion.displayName);
    setShowSuggestions(false);

    // Preencher campos relacionados se existirem no formulário
    const addressFields: AddressFields = {
      street: suggestion.street,
      number: suggestion.number,
      neighborhood: suggestion.neighborhood,
      city: suggestion.city,
      state: suggestion.state,
      postalCode: suggestion.postalCode,
      fullAddress: suggestion.displayName,
    };

    // Tentar preencher campos comuns
    Object.entries(addressFields).forEach(([field, value]) => {
      if (value) {
        // Verificar se o campo existe no formulário
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

    // Callback personalizado
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }

    // Fechar teclado
    inputRef.current?.blur();
  };

  /**
   * Renderizar item da sugestão
   */
  const renderSuggestionItem = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name="location-on"
        size={20}
        color={theme.colors.neutral.darkGray}
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionContent}>
        <Typography variant="body" numberOfLines={2}>
          {item.displayName}
        </Typography>
        {item.city && item.state && (
          <Typography
            variant="caption"
            color={theme.colors.neutral.darkGray}
            style={styles.suggestionLocation}
          >
            {item.city}, {item.state}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Typography variant="body" color={theme.colors.neutral.darkGray}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Typography>
      </View>

      {/* Input */}
      <View
        style={[
          styles.inputContainer,
          fieldError && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral.mediumGray}
          editable={!disabled}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />

        {isLoading && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary.main}
            style={styles.loadingIndicator}
          />
        )}

        {selectedSuggestion && (
          <MaterialIcons
            name="check-circle"
            size={20}
            color={theme.colors.status.success}
            style={styles.checkIcon}
          />
        )}
      </View>

      {/* Error Message */}
      {fieldError && (
        <Typography
          variant="caption"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {fieldError}
        </Typography>
      )}

      {/* Error de busca */}
      {error && (
        <Typography
          variant="caption"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {error}
        </Typography>
      )}

      {/* Modal com sugestões */}
      <Modal
        visible={showSuggestions && suggestions.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSuggestions(false)}
        >
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.status.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral.lightGray,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.m,
    minHeight: 48,
  },
  inputError: {
    borderColor: theme.colors.status.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.neutral.lightGray,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral.black,
    paddingVertical: theme.spacing.s,
  },
  loadingIndicator: {
    marginLeft: theme.spacing.s,
  },
  checkIcon: {
    marginLeft: theme.spacing.s,
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    paddingTop: 100, // Ajuste conforme necessário
  },
  suggestionsContainer: {
    marginHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    maxHeight: 250,
    ...theme.shadows.medium,
  },
  suggestionsList: {
    borderRadius: theme.borderRadius.medium,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  suggestionIcon: {
    marginRight: theme.spacing.s,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionLocation: {
    marginTop: 2,
  },
});

export default AddressAutocomplete;
