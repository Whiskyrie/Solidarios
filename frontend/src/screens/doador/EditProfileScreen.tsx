import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import * as Yup from "yup";

// Componentes
import {
  Typography,
  Header,
  TextField,
  Button,
  NotificationBanner,
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
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Atualizar perfil do usuário
  const handleUpdateProfile = async (values: any) => {
    if (!user) return;

    try {
      await updateUser(user.id, values);

      // Atualizar o perfil na store global após edição
      await getProfile();

      setNotification({
        visible: true,
        type: "success",
        message: "Perfil atualizado com sucesso!",
      });

      // Voltar após 1.5 segundos
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao atualizar perfil.",
      });
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Cabeçalho */}
      <Header
        title="Editar Perfil"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Notificação de sucesso/erro */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Notificação de erro da API */}
      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao atualizar perfil"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h3" style={styles.title}>
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
              <TextField
                label="Nome completo"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                error={touched.name ? (errors.name as string) : undefined}
                placeholder="Seu nome completo"
              />

              <TextField
                label="Email"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                error={touched.email ? (errors.email as string) : undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
              />

              <TextField
                label="Telefone"
                value={values.phone}
                onChangeText={handleChange("phone")}
                onBlur={handleBlur("phone")}
                error={touched.phone ? (errors.phone as string) : undefined}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />

              <TextField
                label="Endereço"
                value={values.address}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                error={touched.address ? (errors.address as string) : undefined}
                placeholder="Seu endereço completo"
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />
                <Button
                  title="Salvar"
                  onPress={() => handleSubmit()}
                  loading={isLoading}
                  style={styles.buttonSubmit}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },
  title: {
    marginBottom: theme.spacing.m,
  },
  form: {
    width: "100%",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.m,
  },
  buttonCancel: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  buttonSubmit: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.primary.secondary,
  },
});

export default EditProfileScreen;
