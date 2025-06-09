import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { AdminUsersStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  TextField,
  Button,
  Select,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useUsers } from "../../hooks/useUsers";
import { UserRole } from "../../types/users.types";

// Validação do formulário
const CreateUserSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .required("Nome é obrigatório"),
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
  password: Yup.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .required("Senha é obrigatória"),
  role: Yup.string()
    .oneOf(Object.values(UserRole), "Função inválida")
    .required("Função é obrigatória"),
});

const roleOptions = [
  { label: "Administrador", value: UserRole.ADMIN },
  { label: "Funcionário", value: UserRole.FUNCIONARIO },
  { label: "Doador", value: UserRole.DOADOR },
  { label: "Beneficiário", value: UserRole.BENEFICIARIO },
];

const CreateUserScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminUsersStackParamList>>();
  const { createUser, isLoading, error, clearError } = useUsers();
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Função para criar um novo usuário
  const handleCreateUser = async (values: any) => {
    try {
      const newUser = await createUser({
        ...values,
        isActive: true,
      });

      if (newUser) {
        setNotification({
          visible: true,
          type: "success",
          message: "Usuário criado com sucesso!",
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao criar usuário.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header
        title="Criar Novo Usuário"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
      />

      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar usuário"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h3" style={styles.title}>
          Cadastro de Usuário
        </Typography>

        <Formik
          initialValues={{
            name: "",
            email: "",
            password: "",
            role: UserRole.DOADOR,
          }}
          validationSchema={CreateUserSchema}
          onSubmit={handleCreateUser}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
          }) => (
            <View style={styles.form}>
              <TextField
                label="Nome completo"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                error={touched.name ? (errors.name as string) : undefined}
                placeholder="Nome do usuário"
              />

              <TextField
                label="Email"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                error={touched.email ? (errors.email as string) : undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@exemplo.com"
              />

              <TextField
                label="Senha"
                value={values.password}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                error={
                  touched.password ? (errors.password as string) : undefined
                }
                secureTextEntry
                placeholder="Senha inicial"
              />

              <Select
                label="Função"
                options={roleOptions}
                selectedValue={values.role}
                onSelect={(value: any) => {
                  const roleValue =
                    typeof value === "string" ? value : value.toString();
                  setFieldValue("role", roleValue);
                }}
                error={touched.role && errors.role ? errors.role : undefined}
              />

              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />
                <Button
                  title="Criar Usuário"
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

export default CreateUserScreen;
