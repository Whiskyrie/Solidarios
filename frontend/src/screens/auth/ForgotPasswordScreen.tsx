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
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import theme from "../../theme";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";
import AuthService from "../../api/auth";
import Ionicons from "react-native-vector-icons/Ionicons";

// Validação do formulário
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
});

Dimensions.get("window");

const ForgotPasswordScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  // Efeito para animação de shake em caso de erro
  useEffect(() => {
    if (errorMessage) {
      // Animação de shake quando houver erro
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
  }, [errorMessage]);

  // Função para lidar com o pedido de recuperação de senha
  const handleForgotPassword = async (values: { email: string }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Simulando a chamada à API (substituir quando o endpoint estiver disponível)
      // await AuthService.forgotPassword(values.email);
      setTimeout(() => {
        setSuccessMessage(
          "Instruções de recuperação de senha foram enviadas para seu email."
        );
        setIsLoading(false);

        // Redirecionar para tela de login após alguns segundos
        setTimeout(() => {
          navigation.navigate(AUTH_ROUTES.LOGIN as keyof AuthStackParamList);
        }, 3000);
      }, 1500);
    } catch (error) {
      setErrorMessage(
        "Não foi possível enviar instruções de recuperação. Tente novamente."
      );
      setIsLoading(false);
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
            <Text style={styles.title}>Esqueceu sua senha?</Text>
            <Text style={styles.subtitle}>
              Informe seu endereço de email e enviaremos instruções para
              recuperar sua senha.
            </Text>
          </Animated.View>

          {/* Formulário animado */}
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
            {/* Mensagens de feedback */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={20} color="#34C759" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            <Formik
              initialValues={{ email: "" }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleForgotPassword}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <>
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

                  {/* Botão de recuperar senha */}
                  <TouchableOpacity
                    style={styles.resetButtonContainer}
                    onPress={() => handleSubmit()}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={["#173F5F", "#006E58"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.resetButton}
                    >
                      {isLoading ? (
                        <View style={styles.loadingIndicator} />
                      ) : (
                        <Text style={styles.resetButtonText}>
                          Enviar instruções
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Formik>
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
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 30,
  },
  logo: {
    width: 85,
    height: 85,
  },
  headerTextContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary.main,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    color: theme.colors.neutral.darkGray,
    textAlign: "center",
    lineHeight: 24,
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
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: "#34C759",
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
  validationError: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
  resetButtonContainer: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
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
    marginTop: 24,
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

export default ForgotPasswordScreen;
