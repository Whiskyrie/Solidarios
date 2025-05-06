// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Tipos e rotas
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { AUTH_ROUTES } from "../../navigation/routes";

// API
import AuthService from "../../api/auth";

// Validação do formulário
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
});

const ForgotPasswordScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: "info" as "success" | "error" | "warning" | "info",
    message: "",
    description: "",
  });

  // Função para lidar com o pedido de recuperação de senha
  const handleForgotPassword = async (values: { email: string }) => {
    setIsLoading(true);
    try {
      // Implementar quando o endpoint de recuperação de senha estiver disponível na API
      // Exemplo: await AuthService.forgotPassword(values.email);

      // Por enquanto, simularemos uma operação bem-sucedida
      setTimeout(() => {
        setNotification({
          visible: true,
          type: "success",
          message: "Email enviado",
          description:
            "Instruções de recuperação de senha foram enviadas para seu email.",
        });
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro",
        description:
          "Não foi possível enviar instruções de recuperação. Tente novamente.",
      });
      setIsLoading(false);
    }
  };

  // Fechar notificação
  const handleCloseNotification = () => {
    setNotification({ ...notification, visible: false });

    // Se for uma notificação de sucesso, voltar para a tela de login
    if (notification.type === "success") {
      navigation.navigate(AUTH_ROUTES.LOGIN as keyof AuthStackParamList);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      {/* Banner de notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={handleCloseNotification}
        position="top"
      />

      {/* Cabeçalho */}
      <Header title="Recuperar senha" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Typography variant="h3" style={styles.title}>
            Esqueceu sua senha?
          </Typography>

          <Typography variant="bodySecondary" style={styles.subtitle}>
            Informe seu endereço de email e enviaremos instruções para recuperar
            sua senha.
          </Typography>

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

                <Button
                  title="Enviar instruções"
                  onPress={() => handleSubmit()}
                  fullWidth
                  loading={isLoading}
                  style={styles.submitButton}
                />
              </View>
            )}
          </Formik>

          <View style={styles.loginContainer}>
            <Typography variant="bodySecondary">Lembrou sua senha?</Typography>
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
  submitButton: {
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

export default ForgotPasswordScreen;
