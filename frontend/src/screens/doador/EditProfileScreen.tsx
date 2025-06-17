// EditProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorProfileStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Card,
  Avatar,
  Loading,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Tipos
import {
  UpdateUserRequest,
  ProfileValidationErrors,
} from "../../types/users.types";

const EditProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();
  const { user, updateProfile } = useAuth();

  // Estados
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: user?.name || "",
    phone: user?.phone || "",
    address: {
      street: user?.address?.street || "",
      number: user?.address?.number || "",
      complement: user?.address?.complement || "",
      neighborhood: user?.address?.neighborhood || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      zipCode: user?.address?.zipCode || "",
    },
  });
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Verificar se houve mudanças
  useEffect(() => {
    if (!user) return;

    const hasNameChange = formData.name !== user.name;
    const hasPhoneChange = formData.phone !== (user.phone || "");
    const hasAddressChange =
      formData.address?.street !== (user.address?.street || "") ||
      formData.address?.number !== (user.address?.number || "") ||
      formData.address?.complement !== (user.address?.complement || "") ||
      formData.address?.neighborhood !== (user.address?.neighborhood || "") ||
      formData.address?.city !== (user.address?.city || "") ||
      formData.address?.state !== (user.address?.state || "") ||
      formData.address?.zipCode !== (user.address?.zipCode || "");

    setHasChanges(hasNameChange || hasPhoneChange || hasAddressChange);
  }, [formData, user]);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: ProfileValidationErrors = {};

    // Validar nome
    if (!formData.name?.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (formData.phone && formData.phone.length > 0) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Telefone deve estar no formato (11) 99999-9999";
      }
    }

    // Validar endereço (todos os campos são opcionais, mas se um for preenchido, alguns outros se tornam obrigatórios)
    const addressFields = formData.address;
    const hasAnyAddressField =
      addressFields &&
      Object.values(addressFields).some(
        (value) => value && typeof value === "string" && value.trim().length > 0
      );

    if (hasAnyAddressField) {
      if (!addressFields?.street?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          street: "Rua é obrigatória quando endereço é informado",
        };
      }
      if (!addressFields?.number?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          number: "Número é obrigatório quando endereço é informado",
        };
      }
      if (!addressFields?.neighborhood?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          neighborhood: "Bairro é obrigatório quando endereço é informado",
        };
      }
      if (!addressFields?.city?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          city: "Cidade é obrigatória quando endereço é informado",
        };
      }
      if (!addressFields?.state?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          state: "Estado é obrigatório quando endereço é informado",
        };
      }
      if (!addressFields?.zipCode?.trim()) {
        newErrors.address = {
          ...newErrors.address,
          zipCode: "CEP é obrigatório quando endereço é informado",
        };
      } else if (!/^\d{5}-?\d{3}$/.test(addressFields.zipCode)) {
        newErrors.address = {
          ...newErrors.address,
          zipCode: "CEP deve estar no formato 12345-678",
        };
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Atualizar campo do formulário
  const updateField = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.replace("address.", "");
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Limpar erro do campo
    if (errors[field as keyof ProfileValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
          6
        )}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
          7,
          11
        )}`;
      }
    }
    return value;
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Erro", "Por favor, corrija os campos destacados.");
      return;
    }

    if (!hasChanges) {
      Alert.alert("Aviso", "Nenhuma alteração foi feita.");
      return;
    }

    try {
      setLoading(true);
      await updateProfile(formData);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert(
        "Erro",
        "Não foi possível atualizar o perfil. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirmar cancelamento se houver mudanças
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Header
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>

          <Typography
            variant="h3"
            color={theme.colors.neutral.white}
            style={styles.headerTitle}
          >
            Editar Perfil
          </Typography>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || loading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
            activeOpacity={0.7}
          >
            <Typography
              variant="bodySecondary"
              color={
                hasChanges && !loading
                  ? theme.colors.neutral.white
                  : "rgba(255,255,255,0.5)"
              }
              style={styles.saveButtonText}
            >
              Salvar
            </Typography>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <Card style={styles.avatarCard}>
            <View style={styles.avatarSection}>
              <Avatar name={formData.name} size="large" style={styles.avatar} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="camera-alt"
                  size={16}
                  color={theme.colors.primary.secondary}
                />
                <Typography
                  variant="caption"
                  color={theme.colors.primary.secondary}
                >
                  Alterar foto
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Dados Pessoais */}
          <Card style={styles.formCard}>
            <Typography variant="h4" style={styles.sectionTitle}>
              Dados Pessoais
            </Typography>

            <View style={styles.inputContainer}>
              <Typography variant="bodySecondary" style={styles.inputLabel}>
                Nome completo *
              </Typography>
              <TextInput
                style={[styles.textInput, errors.name && styles.textInputError]}
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="Digite seu nome completo"
                placeholderTextColor={theme.colors.neutral.mediumGray}
              />
              {errors.name && (
                <Typography
                  variant="caption"
                  color={theme.colors.status.error}
                  style={styles.errorText}
                >
                  {errors.name}
                </Typography>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Typography variant="bodySecondary" style={styles.inputLabel}>
                E-mail
              </Typography>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={user?.email || ""}
                editable={false}
                placeholder="E-mail não pode ser alterado"
                placeholderTextColor={theme.colors.neutral.mediumGray}
              />
            </View>

            <View style={styles.inputContainer}>
              <Typography variant="bodySecondary" style={styles.inputLabel}>
                Telefone
              </Typography>
              <TextInput
                style={[
                  styles.textInput,
                  errors.phone && styles.textInputError,
                ]}
                value={formData.phone}
                onChangeText={(value) =>
                  updateField("phone", formatPhone(value))
                }
                placeholder="(11) 99999-9999"
                placeholderTextColor={theme.colors.neutral.mediumGray}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {errors.phone && (
                <Typography
                  variant="caption"
                  color={theme.colors.status.error}
                  style={styles.errorText}
                >
                  {errors.phone}
                </Typography>
              )}
            </View>
          </Card>

          {/* Endereço */}
          <Card style={styles.formCard}>
            <Typography variant="h4" style={styles.sectionTitle}>
              Endereço
            </Typography>

            <View style={styles.addressRow}>
              <View style={[styles.inputContainer, styles.zipCodeInput]}>
                <Typography variant="bodySecondary" style={styles.inputLabel}>
                  CEP
                </Typography>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.address?.zipCode && styles.textInputError,
                  ]}
                  value={formData.address?.zipCode}
                  onChangeText={(value) =>
                    updateField(
                      "address.zipCode",
                      value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2")
                    )
                  }
                  placeholder="12345-678"
                  placeholderTextColor={theme.colors.neutral.mediumGray}
                  keyboardType="numeric"
                  maxLength={9}
                />
                {errors.address?.zipCode && (
                  <Typography
                    variant="caption"
                    color={theme.colors.status.error}
                    style={styles.errorText}
                  >
                    {errors.address.zipCode}
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Typography variant="bodySecondary" style={styles.inputLabel}>
                Rua
              </Typography>
              <TextInput
                style={[
                  styles.textInput,
                  errors.address?.street && styles.textInputError,
                ]}
                value={formData.address?.street}
                onChangeText={(value) => updateField("address.street", value)}
                placeholder="Nome da rua"
                placeholderTextColor={theme.colors.neutral.mediumGray}
              />
              {errors.address?.street && (
                <Typography
                  variant="caption"
                  color={theme.colors.status.error}
                  style={styles.errorText}
                >
                  {errors.address.street}
                </Typography>
              )}
            </View>

            <View style={styles.addressRow}>
              <View style={[styles.inputContainer, styles.numberInput]}>
                <Typography variant="bodySecondary" style={styles.inputLabel}>
                  Número
                </Typography>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.address?.number && styles.textInputError,
                  ]}
                  value={formData.address?.number}
                  onChangeText={(value) => updateField("address.number", value)}
                  placeholder="123"
                  placeholderTextColor={theme.colors.neutral.mediumGray}
                />
                {errors.address?.number && (
                  <Typography
                    variant="caption"
                    color={theme.colors.status.error}
                    style={styles.errorText}
                  >
                    {errors.address.number}
                  </Typography>
                )}
              </View>
              <View style={[styles.inputContainer, styles.complementInput]}>
                <Typography variant="bodySecondary" style={styles.inputLabel}>
                  Complemento
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={formData.address?.complement}
                  onChangeText={(value) =>
                    updateField("address.complement", value)
                  }
                  placeholder="Apto, bloco..."
                  placeholderTextColor={theme.colors.neutral.mediumGray}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Typography variant="bodySecondary" style={styles.inputLabel}>
                Bairro
              </Typography>
              <TextInput
                style={[
                  styles.textInput,
                  errors.address?.neighborhood && styles.textInputError,
                ]}
                value={formData.address?.neighborhood}
                onChangeText={(value) =>
                  updateField("address.neighborhood", value)
                }
                placeholder="Nome do bairro"
                placeholderTextColor={theme.colors.neutral.mediumGray}
              />
              {errors.address?.neighborhood && (
                <Typography
                  variant="caption"
                  color={theme.colors.status.error}
                  style={styles.errorText}
                >
                  {errors.address.neighborhood}
                </Typography>
              )}
            </View>

            <View style={styles.addressRow}>
              <View style={[styles.inputContainer, styles.cityInput]}>
                <Typography variant="bodySecondary" style={styles.inputLabel}>
                  Cidade
                </Typography>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.address?.city && styles.textInputError,
                  ]}
                  value={formData.address?.city}
                  onChangeText={(value) => updateField("address.city", value)}
                  placeholder="Cidade"
                  placeholderTextColor={theme.colors.neutral.mediumGray}
                />
                {errors.address?.city && (
                  <Typography
                    variant="caption"
                    color={theme.colors.status.error}
                    style={styles.errorText}
                  >
                    {errors.address.city}
                  </Typography>
                )}
              </View>
              <View style={[styles.inputContainer, styles.stateInput]}>
                <Typography variant="bodySecondary" style={styles.inputLabel}>
                  Estado
                </Typography>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.address?.state && styles.textInputError,
                  ]}
                  value={formData.address?.state}
                  onChangeText={(value) =>
                    updateField("address.state", value.toUpperCase())
                  }
                  placeholder="UF"
                  placeholderTextColor={theme.colors.neutral.mediumGray}
                  maxLength={2}
                  autoCapitalize="characters"
                />
                {errors.address?.state && (
                  <Typography
                    variant="caption"
                    color={theme.colors.status.error}
                    style={styles.errorText}
                  >
                    {errors.address.state}
                  </Typography>
                )}
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loading visible={loading} message="Salvando alterações..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.medium,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    marginHorizontal: theme.spacing.s,
  },
  saveButton: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  saveButtonText: {
    fontWeight: "600",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  avatarCard: {
    marginBottom: theme.spacing.m,
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
  },
  avatar: {
    marginBottom: theme.spacing.s,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary.secondary}15`,
  },
  formCard: {
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
    fontWeight: "600",
    color: theme.colors.neutral.darkGray,
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
  },
  inputLabel: {
    marginBottom: theme.spacing.xs,
    fontWeight: "500",
    color: theme.colors.neutral.darkGray,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    fontSize: 16,
    color: theme.colors.neutral.black,
    backgroundColor: theme.colors.neutral.white,
  },
  textInputError: {
    borderColor: theme.colors.status.error,
  },
  disabledInput: {
    backgroundColor: theme.colors.neutral.lightGray,
    opacity: 0.6,
    color: theme.colors.neutral.darkGray,
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
  addressRow: {
    flexDirection: "row",
    gap: theme.spacing.s,
  },
  zipCodeInput: {
    flex: 1,
  },
  numberInput: {
    flex: 1,
  },
  complementInput: {
    flex: 2,
  },
  cityInput: {
    flex: 2,
  },
  stateInput: {
    flex: 1,
  },
});

export default EditProfileScreen;
