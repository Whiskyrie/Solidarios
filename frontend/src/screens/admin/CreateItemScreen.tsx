import React, { useState, useEffect } from "react";
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
import { AdminItemsStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  TextField,
  Button,
  Select,
  NotificationBanner,
  CategoryPicker,
  FileUpload,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";
import { ItemType } from "../../types/items.types";

// Validação do formulário
const CreateItemSchema = Yup.object().shape({
  type: Yup.string()
    .oneOf(Object.values(ItemType), "Tipo inválido")
    .required("Tipo é obrigatório"),
  description: Yup.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .required("Descrição é obrigatória"),
  conservationState: Yup.string().required(
    "Estado de conservação é obrigatório"
  ),
  size: Yup.string().when("type", {
    is: (value: ItemType) =>
      value === ItemType.ROUPA || value === ItemType.CALCADO,
    then: (schema) =>
      schema.required("Tamanho é obrigatório para roupas e calçados"),
    otherwise: (schema) => schema.notRequired(),
  }),
  categoryId: Yup.string().required("Categoria é obrigatória"),
});

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

const conservationStateOptions = [
  { label: "Novo", value: "Novo" },
  { label: "Seminovo", value: "Seminovo" },
  { label: "Usado em bom estado", value: "Usado em bom estado" },
  { label: "Usado com marcas de uso", value: "Usado com marcas de uso" },
];

const CreateItemScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminItemsStackParamList>>();
  const { createItem, isLoading, error, clearError } = useItems();
  const { fetchCategories } = useCategories();
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Função para criar um novo item
  const handleCreateItem = async (values: any) => {
    try {
      const newItem = await createItem(values);

      if (newItem) {
        setNotification({
          visible: true,
          type: "success",
          message: "Item criado com sucesso!",
          description: "O item foi adicionado ao sistema.",
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao criar item.",
        description: "Não foi possível criar o item. Tente novamente.",
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
        title="Criar Novo Item"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
      />

      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar item"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h3" style={styles.title}>
          Cadastro de Item
        </Typography>

        <Formik
          initialValues={{
            type: ItemType.ROUPA,
            description: "",
            conservationState: "",
            size: "",
            categoryId: "",
            photos: [] as Array<{ uri: string; name: string; type: string }>, // Tipando explicitamente
            donorId: "", // Adicionando donorId que parece ser necessário
          }}
          validationSchema={CreateItemSchema}
          onSubmit={(values) => {
            // Adicionando o ID do doador (usando um ID fictício para administrador)
            const itemWithDonor = {
              ...values,
              donorId: values.donorId || "admin-id", // Substituir por um ID real ou obtido de alguma forma
            };
            handleCreateItem(itemWithDonor);
          }}
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
                label="Tipo de Item"
                options={typeOptions}
                selectedValue={values.type}
                onSelect={(value) => setFieldValue("type", value)}
                error={touched.type && errors.type ? errors.type : undefined}
              />

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
                placeholder="Descreva o item detalhadamente"
                multiline
                numberOfLines={3}
              />

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
              />

              {(values.type === ItemType.ROUPA ||
                values.type === ItemType.CALCADO) && (
                <TextField
                  label="Tamanho"
                  value={values.size}
                  onChangeText={handleChange("size")}
                  onBlur={handleBlur("size")}
                  error={touched.size && errors.size ? errors.size : undefined}
                  placeholder="Ex: P, M, G, 38, 40, etc."
                />
              )}

              <CategoryPicker
                name="categoryId"
                label="Categoria"
                required={true}
                multiple={false}
              />

              <FileUpload
                name="photos"
                label="Fotos do Item"
                accept="images"
                maxFiles={5}
              />

              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />
                <Button
                  title="Criar Item"
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

export default CreateItemScreen;
