import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFormikContext, getIn } from "formik";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
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
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const inputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  // Pontos de snap do bottom sheet
  const snapPoints = useMemo(() => {
    const suggestionHeight = 72; // altura aproximada de cada sugestão
    const headerHeight = 50;
    const maxHeight = 400;
    const calculatedHeight = Math.min(
      suggestions.length * suggestionHeight + headerHeight,
      maxHeight
    );
    return [calculatedHeight];
  }, [suggestions.length]);

  // Sincronizar com valor do formulário
  useEffect(() => {
    if (value && value !== inputValue && !selectedSuggestion) {
      setInputValue(value);
    }
  }, [value, inputValue, selectedSuggestion]);

  // Controlar bottom sheet baseado nas sugestões
  useEffect(() => {
    if (suggestions.length > 0 && inputValue.length >= 3) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [suggestions, inputValue]);

  /**
   * Manipular mudança de texto
   */
  const handleTextChange = (text: string) => {
    setInputValue(text);
    setFieldValue(name, text);
    setSelectedSuggestion(null);

    if (text.trim().length >= 3) {
      searchAddresses(text.trim());
    } else {
      clearSuggestions();
      bottomSheetRef.current?.close();
    }
  };

  /**
   * Selecionar sugestão
   */
  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setSelectedSuggestion(suggestion);
      setInputValue(suggestion.displayName);
      setFieldValue(name, suggestion.displayName);
      bottomSheetRef.current?.close();
      Keyboard.dismiss();

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

      // Limpar sugestões após seleção
      setTimeout(() => {
        clearSuggestions();
      }, 500);
    },
    [name, setFieldValue, values, onAddressSelect, clearSuggestions]
  );

  /**
   * Renderizar item da sugestão
   */
  const renderSuggestionItem = useCallback(
    ({ item }: { item: AddressSuggestion }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="location-on"
          size={24}
          color={theme.colors.primary.main}
          style={styles.suggestionIcon}
        />
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.city && item.state && (
            <Text style={styles.suggestionSubtext} numberOfLines={1}>
              {item.city}, {item.state}
            </Text>
          )}
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.neutral.mediumGray}
        />
      </TouchableOpacity>
    ),
    [handleSelectSuggestion]
  );

  /**
   * Renderizar backdrop customizado
   */
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );

  /**
   * Renderizar header do bottom sheet
   */
  const renderHeader = () => (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetIndicator} />
      <Text style={styles.sheetTitle}>Selecione o endereço</Text>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => bottomSheetRef.current?.close()}
      >
        <MaterialIcons
          name="close"
          size={24}
          color={theme.colors.neutral.darkGray}
        />
      </TouchableOpacity>
    </View>
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
        <MaterialIcons
          name="location-on"
          size={22}
          color={theme.colors.neutral.darkGray}
          style={styles.inputIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral.mediumGray}
          editable={!disabled}
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

      {/* Error Messages */}
      {fieldError && (
        <Typography
          variant="caption"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {fieldError}
        </Typography>
      )}

      {error && (
        <Typography
          variant="caption"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {error}
        </Typography>
      )}

      {/* Bottom Sheet com sugestões */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
      >
        {renderHeader()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Buscando endereços...</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </BottomSheet>
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
  inputIcon: {
    marginRight: theme.spacing.s,
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
  sheetHeader: {
    alignItems: "center",
    paddingBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 2,
    marginVertical: theme.spacing.s,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.neutral.black,
    marginBottom: theme.spacing.xs,
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing.m,
    top: theme.spacing.m,
    padding: theme.spacing.xs,
  },
  suggestionsList: {
    paddingBottom: theme.spacing.l,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  suggestionIcon: {
    marginRight: theme.spacing.m,
  },
  suggestionContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.neutral.black,
    marginBottom: 2,
  },
  suggestionSubtext: {
    fontSize: 14,
    color: theme.colors.neutral.darkGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.neutral.darkGray,
  },
});

export default AddressAutocomplete;
