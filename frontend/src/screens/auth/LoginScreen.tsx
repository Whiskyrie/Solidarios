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
  TextInput,
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
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";
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
        {/* Substituindo o design de arcos pelo novo componente de curvas animadas */}

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
                  {/* Campo de Email com ícone ao lado do label */}
                  <View style={styles.fieldContainer}>
                    <View style={styles.labelContainer}>
                      <MaterialIcons name="email" size={20} color="#484848" />
                      <Typography
                        variant="body"
                        color="#484848"
                        style={styles.fieldLabel}
                      >
                        Email
                      </Typography>
                    </View>
                    <View style={styles.inputContainer}>
                      <TextField
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        error={touched.email ? errors.email : undefined}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Enter Email"
                        placeholderTextColor="#484848"
                        style={styles.inputField}
                        inputStyle={styles.input}
                      />
                    </View>
                  </View>

                  {/* Campo de Senha com ícone ao lado do label e botão de visibilidade corretamente posicionado */}
                  <View style={styles.fieldContainer}>
                    <View style={styles.labelContainer}>
                      <MaterialIcons name="lock" size={20} color="#484848" />
                      <Typography
                        variant="body"
                        color="#484848"
                        style={styles.fieldLabel}
                      >
                        Senha
                      </Typography>
                    </View>

                    {/* Implementação personalizada do campo de senha com botão fixo */}
                    <View style={styles.customPasswordContainer}>
                      <TextInput
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        secureTextEntry={!passwordVisible}
                        placeholder="Password"
                        placeholderTextColor="#484848"
                        style={styles.customPasswordInput}
                      />
                      <TouchableOpacity
                        style={styles.eyeIconButton}
                        onPress={togglePasswordVisibility}
                      >
                        <MaterialIcons
                          name={
                            passwordVisible ? "visibility" : "visibility-off"
                          }
                          size={22}
                          color="#484848"
                        />
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <Typography
                        variant="body"
                        style={styles.errorText}
                        color="#FF3B30"
                      >
                        {errors.password}
                      </Typography>
                    )}
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
                      style={{ fontSize: 12 }}
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
                      colors={["#1E88E5", "#0D47A1"]} // Cores azuis em vez de vermelho/laranja
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButton}
                    >
                      <Typography
                        variant="body"
                        color="#FFFFFF"
                        style={{ fontWeight: "bold" }}
                      >
                        {isLoading ? "Carregando..." : "Login"}
                      </Typography>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>

            <View style={styles.dividerContainer}>
              <Typography
                variant="body"
                color="#666666"
                style={{ fontSize: 12 }}
              >
                Sign-Up Using
              </Typography>
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.googleButton}>
                <LinearGradient
                  colors={["#d72e2e", "#690000"]} // Gradiente vermelho para o botão do Google
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.googleButtonGradient}
                >
                  <FontAwesome name="google" size={18} color="#FFFFFF" />
                  <Typography
                    variant="body"
                    style={styles.socialText}
                    color="#FFFFFF"
                  >
                    Continuar com Google
                  </Typography>
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
                  color="#FF5C3B"
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
    alignItems: "center", // Centraliza o conteúdo horizontalmente
  },
  decorativeGraphics: {
    width: "100%",
    height: 300,
  },
  formContainer: {
    width: "100%",
    maxWidth: 380, // Limitando a largura para garantir que fique centralizado
    alignSelf: "center", // Centraliza o container
    paddingHorizontal: theme.spacing.m,
    alignItems: "center", // Centraliza os conteúdos internos
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
    textAlign: "center", // Centraliza o texto
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: theme.spacing.l,
    lineHeight: 20,
    textAlign: "center", // Centraliza o texto
  },
  form: {
    width: "100%",
  },
  // Estilos para os campos com labels e ícones separados
  fieldContainer: {
    marginBottom: theme.spacing.m,
    width: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // Espaço entre o label e o input
  },
  fieldLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
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
  },
  // Novos estilos para o campo de senha personalizado
  customPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    height: 52, // Altura específica para garantir alinhamento
    position: "relative",
  },
  customPasswordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#333333",
    fontSize: 16,
  },
  eyeIconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.l,
  },
  loginButtonContainer: {
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.large,
    overflow: "hidden",
    width: "100%", // Garante que ocupe toda a largura disponível
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.large,
  },
  dividerContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.m,
    width: "100%",
  },
  socialContainer: {
    width: "100%", // Faz o container ocupar toda a largura disponível
    marginTop: theme.spacing.s,
  },
  googleButton: {
    width: "100%", // Faz o botão do Google ocupar toda a largura
    borderRadius: theme.borderRadius.large,
    overflow: "hidden",
    marginTop: theme.spacing.s,
  },
  googleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50, // Garante uma altura mínima para o botão
  },
  socialText: {
    marginLeft: theme.spacing.m,
    fontWeight: "500",
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.m,
    width: "100%", // Garante que ocupe toda a largura disponível
  },
});

export default LoginScreen;
