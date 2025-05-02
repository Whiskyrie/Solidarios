import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from "react-native";
import theme from "../../theme";

export interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  searchIcon?: React.ReactNode;
  clearIcon?: React.ReactNode;
  autoSearch?: boolean;
  delayMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onClear,
  placeholder = "Buscar...",
  containerStyle,
  inputStyle,
  searchIcon,
  clearIcon,
  autoSearch = true,
  delayMs = 500,
  ...rest
}) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Função para lidar com a mudança de texto
  const handleChangeText = (text: string) => {
    onChangeText(text);

    // Se autoSearch estiver habilitado, configura um timer para chamar onSearch
    if (autoSearch && onSearch) {
      if (timer) {
        clearTimeout(timer);
      }

      const newTimer = setTimeout(() => {
        onSearch(text);
      }, delayMs);

      setTimer(newTimer);
    }
  };

  // Função para limpar o texto
  const handleClear = () => {
    onChangeText("");
    if (onClear) {
      onClear();
    } else if (onSearch) {
      onSearch("");
    }
  };

  // Função para executar a busca
  const handleSearch = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {searchIcon ? (
        <View style={styles.searchIcon}>{searchIcon}</View>
      ) : (
        <View style={styles.searchIcon}>
          <SearchIcon />
        </View>
      )}

      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral.darkGray}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        {...rest}
      />

      {value !== "" && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          {clearIcon ? clearIcon : <ClearIcon />}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Componente de ícone de pesquisa padrão
const SearchIcon = () => (
  <View style={searchIconStyles.container}>
    <View style={searchIconStyles.circle} />
    <View style={searchIconStyles.handle} />
  </View>
);

const searchIconStyles = StyleSheet.create({
  container: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.neutral.darkGray,
    borderRadius: 5,
    position: "absolute",
    top: 0,
    left: 0,
  },
  handle: {
    width: 6,
    height: 1.5,
    backgroundColor: theme.colors.neutral.darkGray,
    position: "absolute",
    bottom: 2,
    right: 2,
    transform: [{ rotate: "45deg" }],
  },
});

// Componente de ícone para limpar padrão
const ClearIcon = () => (
  <View style={clearIconStyles.container}>
    <View style={clearIconStyles.line1} />
    <View style={clearIconStyles.line2} />
  </View>
);

const clearIconStyles = StyleSheet.create({
  container: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  line1: {
    width: 14,
    height: 1.5,
    backgroundColor: theme.colors.neutral.darkGray,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  line2: {
    width: 14,
    height: 1.5,
    backgroundColor: theme.colors.neutral.darkGray,
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.s,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.primary,
    fontSize: 14,
    color: theme.colors.neutral.black,
    height: "100%",
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: theme.spacing.xs,
    padding: 2,
  },
});

export default SearchBar;
