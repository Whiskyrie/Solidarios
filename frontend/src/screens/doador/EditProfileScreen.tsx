import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  TextField,
  Button,
  NotificationBanner,
  Avatar,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";

// Validação do formulário
const UpdateProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .required("Nome é obrigatório"),
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
  phone: Yup.string().nullable(),
  address: Yup.string().nullable(),
});

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, getProfile } = useAuth();
  const { updateUser, isLoading, error, clearError } = useUsers();

  // Estado para notificação
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
    description: "",
  });

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  // Efeito de animação inicial
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
  }, [fadeAnim, slideAnim]);

  // Efeito para tratar erros da API - usando useCallback para evitar loops
  const handleError = useCallback(() => {
    if (error) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao atualizar perfil",
        description: error || "Ocorreu um erro. Tente novamente.",
      });
    }
  }, [error]);

  useEffect(() => {
    handleError();
  }, [handleError]);

  // Animar avatar ao pressionar
  const handleAvatarPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [avatarScale]);

  // Atualizar perfil do usuário
  const handleUpdateProfile = useCallback(
    async (values: any) => {
      if (!user) return;

      try {
        await updateUser(user.id, values);
        await getProfile();

        setNotification({
          visible: true,
          type: "success",
          message: "Perfil atualizado com sucesso!",
          description: "",
        });

        // Voltar após 1.5 segundos
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } catch (err) {
        // Erro será tratado pelo useEffect
        console.error("Erro ao atualizar perfil:", err);
      }
    },
    [user, updateUser, getProfile, navigation]
  );

  // Fechar notificação
  const handleCloseNotification = useCallback(() => {
    if (notification.type === "error") {
      clearError();
    }
    setNotification((prev) => ({ ...prev, visible: false }));
  }, [notification.type, clearError]);

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Header com gradiente similar ao ProfileScreen */}
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#173F5F"
          translucent
        />

        {/* Botão de voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Título e avatar */}
        <View style={styles.headerContent}>
          <Typography
            variant="h2"
            style={styles.headerTitle}
            color={theme.colors.neutral.white}
          >
            Editar Perfil
          </Typography>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleAvatarPress}
            accessibilityLabel="Editar foto de perfil"
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.avatarContainer,
                { transform: [{ scale: avatarScale }] },
              ]}
            >
              <Avatar
                name={user.name}
                size="large"
                style={styles.avatar}
                source={user.avatarUrl ? { uri: user.avatarUrl } : undefined}
              />
              <View style={styles.editAvatarButton}>
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={handleCloseNotification}
      />

      {/* Conteúdo principal */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card do formulário */}
          <View style={styles.formCard}>
            <Typography variant="h3" style={styles.formTitle}>
              Atualize seus dados
            </Typography>

            <Formik
              initialValues={{
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
              }}
              validationSchema={UpdateProfileSchema}
              onSubmit={handleUpdateProfile}
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
                  {/* Campo Nome */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="person"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Nome completo *
                    </Typography>
                    <TextField
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      error={touched.name ? (errors.name as string) : undefined}
                      placeholder="Seu nome completo"
                      inputContainerStyle={styles.inputContainer}
                    />
                  </View>

                  {/* Campo Email */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="email"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Email *
                    </Typography>
                    <TextField
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      error={
                        touched.email ? (errors.email as string) : undefined
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="seu@email.com"
                      inputContainerStyle={styles.inputContainer}
                    />
                  </View>

                  {/* Campo Telefone */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="phone"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Telefone
                    </Typography>
                    <TextField
                      value={values.phone}
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      error={
                        touched.phone ? (errors.phone as string) : undefined
                      }
                      keyboardType="phone-pad"
                      placeholder="(00) 00000-0000"
                      inputContainerStyle={styles.inputContainer}
                    />
                  </View>

                  {/* Campo Endereço */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Endereço
                    </Typography>
                    <TextField
                      value={values.address}
                      onChangeText={handleChange("address")}
                      onBlur={handleBlur("address")}
                      error={
                        touched.address ? (errors.address as string) : undefined
                      }
                      placeholder="Seu endereço completo"
                      multiline
                      numberOfLines={3}
                      inputContainerStyle={styles.textAreaContainer}
                    />
                  </View>

                  {/* Botões de ação */}
                  <View style={styles.buttonsContainer}>
                    <Button
                      title="Cancelar"
                      onPress={() => navigation.goBack()}
                      variant="secondary"
                      style={styles.buttonCancel}
                    />
                    <Button
                      title="Salvar Alterações"
                      onPress={() => handleSubmit()}
                      loading={isLoading}
                      style={styles.buttonSubmit}
                    />
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.strong,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 55 : 35 + (StatusBar.currentHeight ?? 0),
    left: theme.spacing.m,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
    marginTop: theme.spacing.m,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: theme.spacing.m,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: -30,
    borderRadius: 50,
    padding: 3,
    backgroundColor: theme.colors.neutral.white,
    ...theme.shadows.strong,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.primary.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.medium,
  },
  content: {
    flex: 1,
    marginTop: 30,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  formCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    ...theme.shadows.medium,
  },
  formTitle: {
    textAlign: "center",
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.l,
  },
  form: {
    width: "100%",
  },
  fieldContainer: {
    marginBottom: theme.spacing.m,
  },
  fieldLabel: {
    marginBottom: theme.spacing.xs,
    fontWeight: "500",
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
  },
  textAreaContainer: {
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    minHeight: 80,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.l,
    gap: theme.spacing.s,
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
  },
  buttonSubmit: {
    flex: 1,
    backgroundColor: theme.colors.primary.secondary,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
  },
});

export default EditProfileScreen;
