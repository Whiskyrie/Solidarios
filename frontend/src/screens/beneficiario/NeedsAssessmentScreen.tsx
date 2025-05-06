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
  Select,
  NotificationBanner,
  CategoryPicker,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Mock API service - substitua por uma API real
const mockSubmitNeeds = async (needs: any) => {
  // Simular delay de API
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return true;
};

// Validação do formulário
const NeedsSchema = Yup.object().shape({
  urgency: Yup.string()
    .oneOf(["alta", "media", "baixa"], "Urgência inválida")
    .required("Nível de urgência é obrigatório"),
  categoryIds: Yup.array()
    .min(1, "Selecione pelo menos uma categoria")
    .required("Categorias são obrigatórias"),
  description: Yup.string()
    .required("Descrição é obrigatória")
    .min(10, "Descreva suas necessidades com mais detalhes"),
});

const urgencyOptions = [
  { label: "Alta - Preciso com urgência", value: "alta" },
  { label: "Média - Preciso em breve", value: "media" },
  { label: "Baixa - Não é urgente", value: "baixa" },
];

const NeedsAssessmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
    description: "",
  });

  // Enviar avaliação de necessidades
  const handleSubmitNeeds = async (values: any) => {
    try {
      setIsLoading(true);

      // Adicionar ID do usuário
      const needsData = {
        ...values,
        beneficiaryId: user?.id,
      };

      // Enviar para API (mock)
      await mockSubmitNeeds(needsData);

      // Mostrar notificação de sucesso
      setNotification({
        visible: true,
        type: "success",
        message: "Necessidades registradas com sucesso!",
        description:
          "Notificaremos quando tivermos itens que atendam suas necessidades.",
      });

      // Voltar após 2 segundos
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao registrar necessidades",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Cabeçalho */}
      <Header
        title="Avaliação de Necessidades"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
      />

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h3" style={styles.title}>
          Informe suas necessidades
        </Typography>

        <Typography variant="bodySecondary" style={styles.subtitle}>
          Estas informações nos ajudarão a priorizar doações conforme suas
          necessidades
        </Typography>

        <Formik
          initialValues={{
            urgency: "media",
            categoryIds: [],
            description: "",
            sizes: "",
          }}
          validationSchema={NeedsSchema}
          onSubmit={handleSubmitNeeds}
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
              <Select
                label="Nível de Urgência"
                options={urgencyOptions}
                selectedValue={values.urgency}
                onSelect={(value) => setFieldValue("urgency", value)}
                error={
                  touched.urgency && errors.urgency ? errors.urgency : undefined
                }
                placeholder="Selecione o nível de urgência"
              />

              <CategoryPicker
                name="categoryIds"
                label="Categorias Necessárias"
                required={true}
                multiple={true}
              />
              {touched.categoryIds && errors.categoryIds && (
                <Typography
                  variant="bodySecondary"
                  style={{ color: theme.colors.status.error }}
                >
                  {errors.categoryIds}
                </Typography>
              )}

              <TextField
                label="Tamanhos (se aplicável)"
                value={values.sizes}
                onChangeText={handleChange("sizes")}
                onBlur={handleBlur("sizes")}
                placeholder="Ex: PP, P, M, G, GG, 38, 40, etc."
                helper="Informe os tamanhos para roupas e calçados"
              />

              <TextField
                label="Descrição detalhada"
                value={values.description}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                error={
                  touched.description && errors.description
                    ? errors.description
                    : undefined
                }
                placeholder="Descreva suas necessidades em detalhes..."
                multiline
                numberOfLines={5}
              />

              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />
                <Button
                  title="Enviar"
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
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.neutral.darkGray,
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

export default NeedsAssessmentScreen;
