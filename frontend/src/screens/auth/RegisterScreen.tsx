import React, { useState, useEffect, useRef } from "react";
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

// Esquema de validação
const RegisterSchema = Yup.object().shape({
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

// Definição dos papéis com ícones
const roles = [
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
];

const RegisterScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register, isLoading, error, clearErrors } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Efeito de animação ao carregar a tela
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animação de seleção
  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Efeito para mostrar erro
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  const handleRegister = async (values: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => {
    clearErrors();
    setErrorMessage(null);

    // Remover confirmPassword e campos não esperados pelo backend
    const { confirmPassword, phone, address, ...registerData } = values;

    // Garantir que os dados estejam no formato correto
    const payload = {
      name: registerData.name.trim(),
      email: registerData.email.trim().toLowerCase(),
      password: registerData.password,
      role: registerData.role,
    };

    console.log("[RegisterScreen] Dados sendo enviados:", {
      ...payload,
      password: "***HIDDEN***",
    });

    try {
      const success = await register(payload);

      if (success) {
        setTimeout(() => {
          if (payload.role === UserRole.DOADOR) {
            navigation.reset({
              index: 0,
              routes: [{ name: "DoadorApp" as never }],
            });
          } else if (payload.role === UserRole.BENEFICIARIO) {
            navigation.reset({
              index: 0,
              routes: [{ name: "BeneficiarioApp" as never }],
            });
          }
        }, 500);
      } else {
        let friendlyError = error;

        if (error?.includes("Bad Request")) {
          friendlyError =
            "Os dados fornecidos são inválidos. Verifique o formato dos campos.";
        } else if (
          error?.includes("duplicate") ||
          error?.includes("already exists")
        ) {
          friendlyError =
            "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.";
        } else if (!friendlyError) {
          friendlyError =
            "Não foi possível completar seu cadastro. Tente novamente.";
        }

        setErrorMessage(friendlyError);
      }
    } catch (err) {
      setErrorMessage(
        "Ocorreu um erro inesperado. Tente novamente mais tarde."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
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
            onPress={() => navigation.goBack()}
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
              source={require("../../../assets/icon.png")}
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
            {errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <Formik
              initialValues={{
                name: "",
                email: "",
                phone: "",
                address: "",
                password: "",
                confirmPassword: "",
                role: UserRole.DOADOR,
              }}
              validationSchema={RegisterSchema}
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
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="person"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nome completo"
                      placeholderTextColor="#999"
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                    />
                  </View>
                  {touched.name && errors.name && (
                    <Text style={styles.validationError}>{errors.name}</Text>
                  )}

                  {/* Campo de email */}
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="email"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                    />
                  </View>
                  {touched.email && errors.email && (
                    <Text style={styles.validationError}>{errors.email}</Text>
                  )}

                  {/* Campo de telefone */}
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="phone"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Telefone (ex: 11 99999-9999)"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={values.phone}
                      onChangeText={(text) => {
                        const formattedPhone = maskPhone(text);
                        setFieldValue("phone", formattedPhone);
                      }}
                      onBlur={handleBlur("phone")}
                    />
                  </View>
                  {touched.phone && errors.phone && (
                    <Text style={styles.validationError}>{errors.phone}</Text>
                  )}

                  {/* Campo de endereço */}
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="location-on"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Endereço completo"
                      placeholderTextColor="#999"
                      value={values.address}
                      onChangeText={handleChange("address")}
                      onBlur={handleBlur("address")}
                    />
                  </View>
                  {touched.address && errors.address && (
                    <Text style={styles.validationError}>{errors.address}</Text>
                  )}

                  {/* Campo de senha */}
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="lock"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Senha"
                      placeholderTextColor="#999"
                      secureTextEntry={!passwordVisible}
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                      <MaterialIcons
                        name={passwordVisible ? "visibility" : "visibility-off"}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.validationError}>
                      {errors.password}
                    </Text>
                  )}

                  {/* Campo de confirmação de senha */}
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="lock"
                      size={22}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmar senha"
                      placeholderTextColor="#999"
                      secureTextEntry={!confirmPasswordVisible}
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                    >
                      <MaterialIcons
                        name={
                          confirmPasswordVisible
                            ? "visibility"
                            : "visibility-off"
                        }
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text style={styles.validationError}>
                      {errors.confirmPassword}
                    </Text>
                  )}

                  {/* Seleção de papel com cards */}
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>Você quer:</Text>

                    <View style={styles.roleRow}>
                      {roles.map((role) => {
                        const isSelected = values.role === role.value;
                        return (
                          <Animated.View
                            key={role.value}
                            style={{
                              transform: [
                                { scale: isSelected ? scaleAnim : 1 },
                              ],
                              flex: 1,
                              maxWidth: "48%",
                            }}
                          >
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={[
                                styles.roleCard,
                                isSelected && styles.roleCardSelected,
                              ]}
                              onPress={() => {
                                setFieldValue("role", role.value);
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

                    {touched.role && errors.role && (
                      <Text style={styles.validationError}>{errors.role}</Text>
                    )}
                  </View>

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
                        <View style={styles.loadingIndicator} />
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
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  AUTH_ROUTES.LOGIN as keyof AuthStackParamList
                )
              }
            >
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
    width: 80,
    height: 80,
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
  loadingIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    borderTopColor: "transparent",
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
