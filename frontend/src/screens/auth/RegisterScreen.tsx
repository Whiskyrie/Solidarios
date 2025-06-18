import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

import theme from "../../theme";
import { useAuth } from "../../hooks/useAuth";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";
import { UserRole } from "../../types/users.types";
import { maskPhone } from "../../utils/authUtils";

// Tipos para o formulário
interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

// Esquema de validação
const registerValidationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .required("Nome é obrigatório"),
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
  phone: Yup.string()
    .matches(
      /^\(\d{2}\) \d{5}-\d{4}$/,
      "Formato de telefone inválido. Use: (99) 99999-9999"
    )
    .required("Telefone é obrigatório"),
  address: Yup.string()
    .min(5, "Endereço deve ter pelo menos 5 caracteres")
    .required("Endereço é obrigatório"),
  password: Yup.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .required("Senha é obrigatória"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas devem ser iguais")
    .required("Confirmação de senha é obrigatória"),
  role: Yup.string()
    .oneOf([UserRole.DOADOR, UserRole.BENEFICIARIO], "Perfil inválido")
    .required("Perfil é obrigatório"),
});

// Configuração dos papéis de usuário
const USER_ROLES = [
  {
    value: UserRole.DOADOR,
    label: "Quero doar",
    icon: "volunteer-activism",
  },
  {
    value: UserRole.BENEFICIARIO,
    label: "Preciso de doações",
    icon: "redeem",
  },
] as const;

// Constantes de animação
const ANIMATION_DURATION = 700;
const SHAKE_ANIMATION_STEPS = [10, -10, 10, 0];
const SCALE_ANIMATION_VALUE = 1.03;

const RegisterScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register, isLoading, error, clearErrors } = useAuth();

  // Estados de controle da UI
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Referencias para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animações de entrada
  useEffect(() => {
    const animateEntry = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    };

    animateEntry();
  }, [fadeAnim, slideAnim]);

  // Animação de erro
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      animateShake();
    }
  }, [error]);

  // Animação de shake para erros
  const animateShake = useCallback(() => {
    const shakeSequence = SHAKE_ANIMATION_STEPS.map((value) =>
      Animated.timing(shakeAnim, {
        toValue: value,
        duration: 50,
        useNativeDriver: true,
      })
    );

    Animated.sequence(shakeSequence).start();
  }, [shakeAnim]);

  // Animação de seleção
  const animateSelection = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: SCALE_ANIMATION_VALUE,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  // Handlers
  const handleRegister = async (values: RegisterFormValues) => {
    clearErrors();
    setErrorMessage(null);

    const { confirmPassword, ...registerData } = values;

    const payload = {
      name: registerData.name.trim(),
      email: registerData.email.trim().toLowerCase(),
      password: registerData.password,
      role: registerData.role,
      phone: registerData.phone,
      address: registerData.address,
    };

    try {
      const success = await register(payload);

      if (success) {
        setTimeout(() => {
          navigation.navigate("Login", {
            email: payload.email,
            autoLogin: true,
            password: payload.password,
          });
        }, 1000);
      }
    } catch {
      setErrorMessage(
        "Ocorreu um erro inesperado. Tente novamente mais tarde."
      );
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setConfirmPasswordVisible((prev) => !prev);
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const navigateToLogin = useCallback(() => {
    navigation.navigate(AUTH_ROUTES.LOGIN as keyof AuthStackParamList);
  }, [navigation]);

  // Componentes renderizadores
  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  };

  const renderInputField = (
    icon: string,
    placeholder: string,
    value: string,
    onChange: (text: string) => void,
    onBlur: (e: any) => void,
    error?: string,
    touched?: boolean,
    keyboardType?: "default" | "email-address" | "phone-pad",
    autoCapitalize?: "none" | "sentences" | "words" | "characters",
    secureTextEntry?: boolean,
    maxLength?: number,
    rightElement?: React.ReactNode
  ) => (
    <>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name={icon}
          size={22}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "sentences"}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
        />
        {rightElement}
      </View>
      {touched && error && <Text style={styles.validationError}>{error}</Text>}
    </>
  );

  const renderPasswordField = (
    field: "password" | "confirmPassword",
    placeholder: string,
    value: string,
    onChange: (text: string) => void,
    onBlur: (e: any) => void,
    isVisible: boolean,
    toggleVisibility: () => void,
    error?: string,
    touched?: boolean
  ) => (
    <>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="lock"
          size={22}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={!isVisible}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={toggleVisibility}
        >
          <MaterialIcons
            name={isVisible ? "visibility" : "visibility-off"}
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      {touched && error && <Text style={styles.validationError}>{error}</Text>}
    </>
  );

  const renderRoleSelection = (
    selectedRole: UserRole,
    onRoleChange: (role: UserRole) => void
  ) => (
    <View style={styles.roleContainer}>
      <Text style={styles.roleLabel}>Você quer:</Text>
      <View style={styles.roleRow}>
        {USER_ROLES.map((role) => {
          const isSelected = selectedRole === role.value;
          return (
            <Animated.View
              key={role.value}
              style={{
                transform: [{ scale: isSelected ? scaleAnim : 1 }],
                flex: 1,
                maxWidth: "48%",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => {
                  onRoleChange(role.value);
                  animateSelection();
                }}
              >
                <View style={styles.roleIconContainer}>
                  <MaterialIcons
                    name={role.icon}
                    size={24}
                    color={isSelected ? "#006E58" : "#666"}
                  />
                </View>
                <Text
                  style={[
                    styles.roleText,
                    isSelected && styles.roleTextSelected,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão de voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-undo"
              size={22}
              color={theme.colors.primary.main}
            />
          </TouchableOpacity>

          {/* Logo animada */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require("../../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Título e subtítulo animados */}
          <Animated.View
            style={[
              styles.headerTextContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>Crie sua conta</Text>
            <Text style={styles.subtitle}>
              Preencha os campos abaixo para começar
            </Text>
          </Animated.View>

          {/* Formulário de registro */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {renderErrorMessage()}

            <Formik<RegisterFormValues>
              initialValues={{
                name: "",
                email: "",
                phone: "",
                address: "",
                password: "",
                confirmPassword: "",
                role: UserRole.DOADOR,
              }}
              validationSchema={registerValidationSchema}
              onSubmit={handleRegister}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
              }) => (
                <>
                  {/* Campo de nome */}
                  {renderInputField(
                    "person",
                    "Nome completo",
                    values.name,
                    handleChange("name"),
                    handleBlur("name"),
                    errors.name,
                    touched.name
                  )}

                  {/* Campo de email */}
                  {renderInputField(
                    "email",
                    "Email",
                    values.email,
                    handleChange("email"),
                    handleBlur("email"),
                    errors.email,
                    touched.email,
                    "email-address",
                    "none"
                  )}

                  {/* Campo de telefone */}
                  {renderInputField(
                    "phone",
                    "Telefone (ex: (11) 99999-9999)",
                    values.phone,
                    (text: string) => {
                      const formattedPhone = maskPhone(text);
                      setFieldValue("phone", formattedPhone);
                    },
                    handleBlur("phone"),
                    errors.phone,
                    touched.phone,
                    "phone-pad",
                    "none",
                    false,
                    15
                  )}

                  {/* Campo de endereço simples */}
                  {renderInputField(
                    "location-on",
                    "Endereço completo",
                    values.address,
                    handleChange("address"),
                    handleBlur("address"),
                    errors.address,
                    touched.address
                  )}

                  {/* Campos de senha */}
                  {renderPasswordField(
                    "password",
                    "Senha",
                    values.password,
                    handleChange("password"),
                    handleBlur("password"),
                    passwordVisible,
                    togglePasswordVisibility,
                    errors.password,
                    touched.password
                  )}

                  {renderPasswordField(
                    "confirmPassword",
                    "Confirmar senha",
                    values.confirmPassword,
                    handleChange("confirmPassword"),
                    handleBlur("confirmPassword"),
                    confirmPasswordVisible,
                    toggleConfirmPasswordVisibility,
                    errors.confirmPassword,
                    touched.confirmPassword
                  )}

                  {/* Seleção de papel */}
                  {renderRoleSelection(values.role, (role) =>
                    setFieldValue("role", role)
                  )}
                  {touched.role && errors.role && (
                    <Text style={styles.validationError}>{errors.role}</Text>
                  )}

                  {/* Botão de registro */}
                  <TouchableOpacity
                    style={styles.registerButtonContainer}
                    onPress={() => handleSubmit()}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={["#173F5F", "#006E58"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.registerButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator size={24} color="#fff" />
                      ) : (
                        <Text style={styles.registerButtonText}>Cadastrar</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </Animated.View>

          {/* Link para login */}
          <Animated.View
            style={[
              styles.loginContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Faça login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 80,
    paddingBottom: 40,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerTextContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary.main,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    color: theme.colors.neutral.darkGray,
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    padding: 8,
  },
  validationError: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
  roleContainer: {
    marginVertical: 16,
  },
  roleLabel: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleCard: {
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  roleCardSelected: {
    borderColor: "#006E58",
    borderWidth: 2,
    backgroundColor: "rgba(0,110,88,0.05)",
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  roleText: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  roleTextSelected: {
    color: "#006E58",
    fontWeight: "500",
  },
  registerButtonContainer: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 12,
  },
  registerButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  registerButtonText: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  loginText: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 14,
    color: theme.colors.neutral.darkGray,
  },
  loginLink: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary.secondary,
    marginLeft: 5,
  },
});

export default RegisterScreen;
