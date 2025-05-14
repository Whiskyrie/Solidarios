import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";

import {
  Typography,
  TextField,
  Button,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";
import colors from "../../theme/colors";
import { useAuth } from "../../hooks/useAuth";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";

// Validação do formulário
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
  password: Yup.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .required("Senha é obrigatória"),
});

const LoginScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login, isLoading, error, clearErrors } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const success = await login(values);
      if (!success) {
        let friendlyError = error;
        if (error?.includes("Unauthorized") || error?.includes("credentials")) {
          friendlyError = "Email ou senha incorretos. Tente novamente.";
        } else if (error?.includes("not found")) {
          friendlyError = "Usuário não encontrado. Verifique seu email.";
        } else if (!friendlyError) {
          friendlyError = "Não foi possível fazer login. Tente novamente.";
        }
        setErrorMessage(friendlyError);
        setShowNotification(true);
      }
    } catch (err) {
      setErrorMessage(
        "Ocorreu um erro inesperado. Tente novamente mais tarde."
      );
      setShowNotification(true);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    clearErrors();
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Curvas onduladas melhoradas - Posicionadas primeiro para ficar atrás do conteúdo */}
        <View style={styles.waveContainer}>
          <LinearGradient
            colors={[colors.primary.main, "rgba(23, 63, 95, 0)"]}
            style={styles.waveGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.wave, styles.wave1]} />
          <View style={[styles.wave, styles.wave2]} />
          <View style={[styles.wave, styles.wave3]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <NotificationBanner
            visible={showNotification}
            type="error"
            message="Erro de autenticação"
            description={
              errorMessage ||
              error ||
              "Verifique suas credenciais e tente novamente."
            }
            onClose={handleCloseNotification}
            position="top"
          />

          <Animated.View
            style={[
              styles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Typography variant="h2" style={styles.title} color="#333333">
              Login
            </Typography>

            {/* Adiciona mensagem de boas-vindas */}
            <Typography
              variant="bodySecondary"
              style={styles.welcomeText}
              color="#666666"
            >
              Bem-vindo de volta! Sentimos sua falta.
            </Typography>

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <TextField
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      error={touched.email ? errors.email : undefined}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Email"
                      placeholderTextColor="#999999"
                      rightIcon={
                        <MaterialIcons name="email" size={20} color="#999999" />
                      }
                      style={styles.inputField}
                      inputStyle={styles.input}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextField
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={touched.password ? errors.password : undefined}
                      secureTextEntry={!passwordVisible}
                      placeholder="Senha"
                      placeholderTextColor="#999999"
                      rightIcon={
                        <TouchableOpacity onPress={togglePasswordVisibility}>
                          <MaterialIcons
                            name={
                              passwordVisible ? "visibility" : "visibility-off"
                            }
                            size={20}
                            color="#999999"
                          />
                        </TouchableOpacity>
                      }
                      style={styles.inputField}
                      inputStyle={styles.input}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate(AUTH_ROUTES.FORGOT_PASSWORD as any)
                    }
                    style={styles.forgotPassword}
                  >
                    <Typography
                      variant="body"
                      color="#666666"
                      style={{ fontSize: 14 }}
                    >
                      Esqueceu sua senha?
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSubmit()}
                    disabled={isLoading}
                    style={styles.loginButtonContainer}
                  >
                    <LinearGradient
                      colors={[colors.primary.main, colors.primary.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButton}
                    >
                      <Typography
                        variant="body"
                        color="#FFFFFF"
                        style={{ fontWeight: "bold", fontSize: 16 }}
                      >
                        {isLoading ? "Carregando..." : "Login"}
                      </Typography>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Typography
                variant="body"
                color="#666666"
                style={{ paddingHorizontal: 10 }}
              >
                ou
              </Typography>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Google com gradiente vermelho */}
            <TouchableOpacity style={styles.googleButtonContainer}>
              <LinearGradient
                colors={["#EA4335", "#C62828"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.googleButton}
              >
                <FontAwesome name="google" size={20} color="#FFFFFF" />
                <Typography
                  variant="body"
                  color="#FFFFFF"
                  style={{ marginLeft: 10, fontWeight: "500" }}
                >
                  Continuar com Google
                </Typography>
              </LinearGradient>
            </TouchableOpacity>

            {/* Adiciona botão de redirecionamento para a tela de registro */}
            <View style={styles.registerContainer}>
              <Typography
                variant="body"
                color="#666666"
                style={{ fontSize: 14 }}
              >
                Não tem uma conta?
              </Typography>
              <TouchableOpacity
                onPress={() => navigation.navigate(AUTH_ROUTES.REGISTER as any)}
              >
                <Typography
                  variant="body"
                  color={colors.primary.main}
                  style={{ fontSize: 14, fontWeight: "bold", marginLeft: 5 }}
                >
                  Registre-se
                </Typography>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.m,
    paddingTop: 90, // Aumentado para dar mais espaço para as ondas
  },
  waveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200, // Aumentado para melhor visualização
    overflow: "hidden", // Alterado de "visible" para "hidden"
    zIndex: 0, // Alterado de -1 para 0
  },
  waveGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    opacity: 0.25, // Aumentado para melhor visibilidade
  },
  wave: {
    position: "absolute",
    height: 40,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
  },
  wave1: {
    top: 0,
    height: 90,
    backgroundColor: `${colors.primary.main}40`, // Aumentei a opacidade de 20 para 40
    transform: [{ scaleX: 1.5 }],
  },
  wave2: {
    top: 40,
    height: 60,
    backgroundColor: `${colors.primary.secondary}40`, // Aumentei a opacidade
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 110,
    transform: [{ scaleX: 1.3 }],
  },
  wave3: {
    top: 80,
    height: 50,
    backgroundColor: `${colors.status.success}40`, // Aumentei a opacidade
    borderBottomLeftRadius: 110,
    borderBottomRightRadius: 70,
    transform: [{ scaleX: 1.4 }],
  },
  formContainer: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.l,
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.large,
    paddingVertical: theme.spacing.l,
    // Adicionando uma sombra sutil para destacar o formulário
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: theme.spacing.m, // Aumentado o espaçamento
    textAlign: "center",
    paddingVertical: 5, // Adicionado padding vertical
    includeFontPadding: true, // Garante que o padding da fonte seja incluído
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  inputField: {
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingVertical: 16,
  },
  input: {
    color: "#333333",
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.l,
  },
  loginButtonContainer: {
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.large,
    overflow: "hidden",
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 20, // Adicionado padding horizontal
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.large,
    minHeight: 55, // Definida uma altura mínima para o botão
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing.l,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  googleButtonContainer: {
    borderRadius: theme.borderRadius.large,
    overflow: "hidden",
    marginTop: theme.spacing.s,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 55, // Altura mínima consistente com o botão de login
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.s,
  },
});

export default LoginScreen;
