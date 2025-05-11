// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import * as Yup from "yup";

// Componentes
import {
  Typography,
  TextField,
  Button,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Tipos e rotas
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";
import api from "../../api/api";

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

  // Função para lidar com o login
  const handleLogin = async (values: { email: string; password: string }) => {
    console.log("[LoginScreen] Tentando fazer login com:", {
      email: values.email,
      baseURL: api.defaults.baseURL, // Log da URL base atual
    });
    try {
      const success = await login(values);
      console.log("[LoginScreen] Resultado do login:", success);
      if (!success) {
        // Mapear mensagens de erro para mensagens mais amigáveis
        let friendlyError = error;

        if (error?.includes("Unauthorized") || error?.includes("credentials")) {
          friendlyError = "Email ou senha incorretos. Tente novamente.";
        } else if (error?.includes("not found")) {
          friendlyError = "Usuário não encontrado. Verifique seu email.";
        } else if (!friendlyError) {
          friendlyError = "Não foi possível fazer login. Tente novamente.";
        }

        console.log("[LoginScreen] Erro formatado:", friendlyError);
        setErrorMessage(friendlyError);
        setShowNotification(true);
      }
    } catch (err) {
      console.error("[LoginScreen] Erro não tratado:", err);
      setErrorMessage(
        "Ocorreu um erro inesperado. Tente novamente mais tarde."
      );
      setShowNotification(true);
    }
  };

  // Fechar notificação de erro
  const handleCloseNotification = () => {
    setShowNotification(false);
    clearErrors();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de notificação para erros */}
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

        <View style={styles.logoContainer}>
          {/* Substitua pelo seu logo */}
          <View style={styles.logoPlaceholder}>
            <Typography variant="h1" center color={theme.colors.neutral.white}>
              Solidários
            </Typography>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Typography variant="h2" center style={styles.title}>
            Bem-vindo(a) de volta!
          </Typography>

          <Typography variant="bodySecondary" center style={styles.subtitle}>
            Faça login para continuar
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
                <TextField
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={touched.email ? errors.email : undefined}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="seu@email.com"
                />

                <TextField
                  label="Senha"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  secureTextEntry
                  placeholder="Sua senha"
                />

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      AUTH_ROUTES.FORGOT_PASSWORD as keyof AuthStackParamList
                    )
                  }
                  style={styles.forgotPassword}
                >
                  <Typography
                    variant="bodySecondary"
                    color={theme.colors.primary.secondary}
                  >
                    Esqueceu sua senha?
                  </Typography>
                </TouchableOpacity>

                <Button
                  title="Entrar"
                  onPress={() => handleSubmit()}
                  fullWidth
                  loading={isLoading}
                  style={styles.loginButton}
                />
              </View>
            )}
          </Formik>

          <View style={styles.registerContainer}>
            <Typography variant="bodySecondary">Não tem uma conta?</Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  AUTH_ROUTES.REGISTER as keyof AuthStackParamList
                )
              }
              style={styles.registerButton}
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Cadastre-se
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.m,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoPlaceholder: {
    width: 200,
    height: 80,
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.m,
    ...theme.shadows.medium,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.m,
  },
  form: {
    width: "100%",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.m,
  },
  loginButton: {
    marginTop: theme.spacing.s,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.m,
  },
  registerButton: {
    marginLeft: theme.spacing.xs,
  },
});

export default LoginScreen;
