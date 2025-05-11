// src/screens/auth/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
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
  Header,
  Radio,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Tipos e rotas
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";
import { UserRole } from "../../types/users.types";
import api from "../../api/api";

// Validação do formulário
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .required("Nome é obrigatório"),
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
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

const roleOptions = [
  { label: "Quero doar", value: UserRole.DOADOR },
  { label: "Preciso de doações", value: UserRole.BENEFICIARIO },
];

const RegisterScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register, isLoading, error, clearErrors } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função para lidar com o registro
  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => {
    // Remover confirmPassword do objeto antes de enviar para a API
    const { confirmPassword, ...registerData } = values;

    console.log("[RegisterScreen] Tentando registrar usuário:", {
      ...registerData,
      password: "***ESCONDIDO***",
      baseURL: api.defaults.baseURL, // Log da URL base atual
    });

    try {
      const success = await register(registerData);
      console.log("[RegisterScreen] Resultado do registro:", success);

      if (!success) {
        // Mapear mensagens de erro para mensagens mais amigáveis
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

        console.log("[RegisterScreen] Erro formatado:", friendlyError);
        setErrorMessage(friendlyError);
        setShowNotification(true);
      }
    } catch (err) {
      console.error("[RegisterScreen] Erro não tratado:", err);
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
      {/* Banner de notificação para erros */}
      <NotificationBanner
        visible={showNotification}
        type="error"
        message="Erro no cadastro"
        description={
          errorMessage ||
          error ||
          "Não foi possível completar seu cadastro. Tente novamente."
        }
        onClose={handleCloseNotification}
        position="top"
      />

      {/* Cabeçalho */}
      <Header title="Criar conta" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Typography variant="h3" style={styles.title}>
            Crie sua conta
          </Typography>

          <Typography variant="bodySecondary" style={styles.subtitle}>
            Preencha os campos abaixo para começar
          </Typography>

          <Formik
            initialValues={{
              name: "",
              email: "",
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
              <View style={styles.form}>
                <TextField
                  label="Nome completo"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={touched.name ? errors.name : undefined}
                  placeholder="Seu nome completo"
                />

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

                <TextField
                  label="Confirmar senha"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  error={
                    touched.confirmPassword ? errors.confirmPassword : undefined
                  }
                  secureTextEntry
                  placeholder="Confirme sua senha"
                />

                <View style={styles.roleSelector}>
                  <Typography variant="bodySecondary" style={styles.roleLabel}>
                    Você quer:
                  </Typography>

                  <Radio
                    options={roleOptions}
                    selectedValue={values.role}
                    onSelect={(value) => setFieldValue("role", value)}
                    direction="vertical"
                  />

                  {touched.role && errors.role && (
                    <Typography
                      variant="small"
                      color={theme.colors.status.error}
                    >
                      {errors.role}
                    </Typography>
                  )}
                </View>

                <Button
                  title="Cadastrar"
                  onPress={() => handleSubmit()}
                  fullWidth
                  loading={isLoading}
                  style={styles.registerButton}
                />
              </View>
            )}
          </Formik>

          <View style={styles.loginContainer}>
            <Typography variant="bodySecondary">Já tem uma conta?</Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  AUTH_ROUTES.LOGIN as keyof AuthStackParamList
                )
              }
              style={styles.loginButton}
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Faça login
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
    padding: theme.spacing.m,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
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
  roleSelector: {
    marginBottom: theme.spacing.m,
  },
  roleLabel: {
    marginBottom: theme.spacing.xs,
  },
  registerButton: {
    marginTop: theme.spacing.s,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.m,
  },
  loginButton: {
    marginLeft: theme.spacing.xs,
  },
});

export default RegisterScreen;
