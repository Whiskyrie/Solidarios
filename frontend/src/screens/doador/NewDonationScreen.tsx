// src/screens/doador/NewDonationScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation } from "@react-navigation/native";

// Componentes
import {
  Typography,
  Header,
  TextField,
  Select,
  Button,
  CategoryPicker,
  FileUpload,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";

// Tipos e rotas
import { ItemType } from "../../types/items.types";
import { DOADOR_ROUTES } from "../../navigation/routes";

// Validação do formulário
const DonationSchema = Yup.object().shape({
  type: Yup.string()
    .oneOf(Object.values(ItemType), "Tipo de item inválido")
    .required("Tipo de item é obrigatório"),
  description: Yup.string()
    .min(3, "Descrição deve ter pelo menos 3 caracteres")
    .max(100, "Descrição deve ter no máximo 100 caracteres")
    .required("Descrição é obrigatória"),
  conservationState: Yup.string()
    .min(3, "Estado de conservação deve ter pelo menos 3 caracteres")
    .max(50, "Estado de conservação deve ter no máximo 50 caracteres"),
  size: Yup.string().max(20, "Tamanho deve ter no máximo 20 caracteres"),
  categoryId: Yup.string().uuid("ID de categoria inválido"),
  photos: Yup.array()
    .of(
      Yup.object().shape({
        uri: Yup.string().required(),
        name: Yup.string().required(),
        type: Yup.string().required(),
      })
    )
    .max(5, "Máximo de 5 fotos permitidas"),
});

// Opções de tipo de item
const typeOptions = Object.entries(ItemType).map(([_, value]) => ({
  label:
    value === ItemType.ROUPA
      ? "Roupa"
      : value === ItemType.CALCADO
      ? "Calçado"
      : value === ItemType.UTENSILIO
      ? "Utensílio"
      : "Outro",
  value,
}));

// Opções de estado de conservação
const conservationStateOptions = [
  { label: "Novo", value: "Novo" },
  { label: "Seminovo", value: "Seminovo" },
  { label: "Usado em bom estado", value: "Usado em bom estado" },
  { label: "Usado com marcas de uso", value: "Usado com marcas de uso" },
];

const NewDonationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { createItem, isLoading, error, clearError } = useItems();
  const { fetchCategories } = useCategories();
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
    description?: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Função para lidar com a submissão da nova doação
  const handleSubmit = async (values: any) => {
    if (!user) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao criar doação",
        description: "Você precisa estar logado para doar.",
      });
      return;
    }

    try {
      // Adicionar donorId aos valores
      const itemData = {
        ...values,
        donorId: user.id,
      };

      // Criar o item
      const newItem = await createItem(itemData);

      if (newItem) {
        // Mostrar notificação de sucesso
        setNotification({
          visible: true,
          type: "success",
          message: "Doação cadastrada com sucesso!",
          description: "Obrigado pela sua contribuição.",
        });

        // Limpar campos e navegar após 2 segundos
        setTimeout(() => {
          setNotification({ ...notification, visible: false });
          navigation.navigate(DOADOR_ROUTES.MY_DONATIONS as never);
        }, 2000);
      }
    } catch (err) {
      console.error("Erro ao criar item:", err);
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao criar doação",
        description: "Não foi possível cadastrar sua doação. Tente novamente.",
      });
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
        title="Nova Doação"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Notificação de erro do hook */}
      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar doação"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Formik
          initialValues={{
            type: ItemType.ROUPA,
            description: "",
            conservationState: "",
            size: "",
            categoryId: "",
            photos: [],
          }}
          validationSchema={DonationSchema}
          onSubmit={handleSubmit}
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
              <Typography variant="h3" style={styles.formTitle}>
                Informações do Item
              </Typography>

              <Typography variant="bodySecondary" style={styles.formSubtitle}>
                Preencha os detalhes abaixo para cadastrar sua doação
              </Typography>

              {/* Tipo de Item */}
              <Select
                label="Tipo de Item"
                options={typeOptions}
                selectedValue={values.type}
                onSelect={(value) => setFieldValue("type", value)}
                error={touched.type && errors.type ? errors.type : undefined}
              />

              {/* Descrição */}
              <TextField
                label="Descrição"
                value={values.description}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                error={
                  touched.description && errors.description
                    ? errors.description
                    : undefined
                }
                placeholder="Descreva o item que está doando"
                multiline
                numberOfLines={3}
              />

              {/* Estado de Conservação */}
              <Select
                label="Estado de Conservação"
                options={conservationStateOptions}
                selectedValue={values.conservationState}
                onSelect={(value) => setFieldValue("conservationState", value)}
                error={
                  touched.conservationState && errors.conservationState
                    ? errors.conservationState
                    : undefined
                }
                placeholder="Selecione o estado de conservação"
              />

              {/* Tamanho (se aplicável) */}
              <TextField
                label="Tamanho"
                value={values.size}
                onChangeText={handleChange("size")}
                onBlur={handleBlur("size")}
                error={touched.size && errors.size ? errors.size : undefined}
                placeholder="Ex: PP, P, M, G, GG, 38, 40, etc."
                helper="Preencha caso o item tenha tamanho específico"
              />

              {/* Categoria */}
              <CategoryPicker
                name="categoryId"
                label="Categoria"
                required={false}
                multiple={false}
              />

              {/* Upload de Fotos */}
              <FileUpload
                name="photos"
                label="Fotos do Item"
                accept="images"
                maxFiles={5}
              />

              {/* Botões de ação */}
              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />

                <Button
                  title="Cadastrar"
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
    paddingBottom: theme.spacing.xxl,
  },
  form: {
    width: "100%",
  },
  formTitle: {
    marginBottom: theme.spacing.xs,
  },
  formSubtitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.neutral.darkGray,
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

export default NewDonationScreen;
