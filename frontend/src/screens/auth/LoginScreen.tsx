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
  Image,
  TextInput,
  ActivityIndicator,
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
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .matches(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
    .matches(/[0-9]/, "Deve conter pelo menos um número")
    .matches(/[^A-Za-z0-9]/, "Deve conter pelo menos um caractere especial")
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
      <LinearGradient
        colors={["#c3f6f8", "#d2def5"]}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
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
              <Image
                source={require("../../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Typography variant="h2" style={styles.title} color="#333333">
                Login
              </Typography>

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
                    {/* Campo de Email */}
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
                    <View style={styles.customPasswordContainer}>
                      <TextInput
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        placeholder="Enter Email"
                        placeholderTextColor="#484848"
                        style={styles.customPasswordInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {values.email.length > 0 && (
                        <TouchableOpacity
                          style={styles.eyeIconButton}
                          onPress={() => handleChange("email")("")}
                        >
                          <MaterialIcons
                            name="cancel"
                            size={20}
                            color="#9E9E9E"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {touched.email && errors.email && (
                      <Typography
                        variant="body"
                        style={styles.errorText}
                        color="#FF3B30"
                      >
                        {errors.email}
                      </Typography>
                    )}

                    {/* Campo de Senha */}
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

                    {/* Link Esqueceu Senha */}
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

                    {/* Botão de Login */}
                    <TouchableOpacity
                      onPress={() => handleSubmit()}
                      disabled={isLoading}
                      style={styles.loginButtonContainer}
                    >
                      <LinearGradient
                        colors={["#1E88E5", "#0D47A1"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginButton}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Typography
                            variant="body"
                            color="#FFFFFF"
                            style={styles.socialText}
                          >
                            Login
                          </Typography>
                        )}
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
                    colors={["#d72e2e", "#690000"]}
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

              {/* Redirecionamento para Registro */}
              <View style={styles.registerContainer}>
                <Typography
                  variant="body"
                  color="#666666"
                  style={{ fontSize: 14 }}
                >
                  Não tem uma conta?
                </Typography>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(AUTH_ROUTES.REGISTER as any)
                  }
                >
                  <Typography
                    variant="body"
                    color="#0f5cd0"
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      marginLeft: 5,
                    }}
                  >
                    Registre-se
                  </Typography>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.m,
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.m,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: theme.spacing.l,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
    alignSelf: "center",
  },
  form: {
    width: "100%",
  },
  fieldContainer: {
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.m,
    width: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  customPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    height: 52,
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
    width: "100%",
  },
  loginButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.extraLarge,
  },
  dividerContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.m,
    width: "100%",
  },
  socialContainer: {
    width: "100%",
    marginTop: theme.spacing.s,
  },
  googleButton: {
    width: "100%",
    borderRadius: theme.borderRadius.extraLarge,
    overflow: "hidden",
    marginTop: theme.spacing.s,
  },
  googleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  socialText: {
    marginLeft: theme.spacing.m,
    fontWeight: "700",
    fontSize: 16,
    fontFamily: theme.fontFamily.monospace,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.m,
    width: "100%",
  },
});

export default LoginScreen;
