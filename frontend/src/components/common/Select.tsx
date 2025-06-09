import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps {
  options: SelectOption[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  selectStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  optionStyle?: StyleProp<ViewStyle>;
  optionTextStyle?: StyleProp<TextStyle>;
}

const Select: React.FC<SelectProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "Selecione uma opção",
  label,
  error,
  disabled = false,
  containerStyle,
  selectStyle,
  labelStyle,
  optionStyle,
  optionTextStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  const handleSelect = (value: string | number) => {
    onSelect(value);
    setModalVisible(false);
  };

  const selectBorderColor = error
    ? theme.colors.status.error
    : theme.colors.neutral.mediumGray;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="bodySecondary" style={[styles.label, labelStyle]}>
          {label}
        </Typography>
      )}

      <TouchableOpacity
        style={[
          styles.select,
          { borderColor: selectBorderColor },
          disabled && styles.disabled,
          selectStyle,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Typography
          variant="body"
          color={
            selectedOption
              ? theme.colors.neutral.black
              : theme.colors.neutral.darkGray
          }
          style={styles.selectedText}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Typography>

        <View style={styles.arrow}>
          <View style={styles.arrowDown} />
        </View>
      </TouchableOpacity>

      {error && (
        <Typography
          variant="small"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {error}
        </Typography>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h4">{label || placeholder}</Typography>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Typography
                  variant="body"
                  color={theme.colors.primary.secondary}
                >
                  Fechar
                </Typography>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, optionStyle]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Typography
                    variant="body"
                    style={[
                      optionTextStyle,
                      item.value === selectedValue && styles.selectedOption,
                    ]}
                  >
                    {item.label}
                  </Typography>
                  {item.value === selectedValue && (
                    <View style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
    height: 48,
    backgroundColor: theme.colors.neutral.white,
  },
  disabled: {
    backgroundColor: theme.colors.neutral.lightGray,
    opacity: 0.7,
  },
  selectedText: {
    flex: 1,
  },
  arrow: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowDown: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: theme.colors.neutral.darkGray,
  },
  errorText: {
    marginTop: theme.spacing.xxs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.mediumGray,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  selectedOption: {
    color: theme.colors.primary.secondary,
    fontWeight: "600",
  },
  checkmark: {
    width: 6,
    height: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: theme.colors.primary.secondary,
    transform: [{ rotate: "45deg" }],
  },
});

export default Select;
