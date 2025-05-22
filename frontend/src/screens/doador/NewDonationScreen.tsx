// src/screens/doador/NewDonationScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
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
import { CreateItemDto, ItemType } from "../../types/items.types";
import { DOADOR_ROUTES } from "../../navigation/routes";

// Definindo interface para valores do formulário
interface DonationFormValues {
  type: ItemType;
  description: string;
  conservationState: string;
  size: string;
  categoryId: string;
  photos: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
}

// Interface para notificação
interface NotificationState {
  visible: boolean;
  type: "success" | "error";
  message: string;
  description?: string;
}

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
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: "success",
    message: "",
  });

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Função para lidar com a submissão da nova doação
  const handleSubmit = useCallback(
    async (values: DonationFormValues): Promise<void> => {
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
        const itemData: CreateItemDto = {
          ...values,
          donorId: user.id,
          photos: values.photos.map((photo) => photo.uri),
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
            setNotification((prev) => ({ ...prev, visible: false }));
            navigation.navigate(DOADOR_ROUTES.MY_DONATIONS as never);
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao criar item:", err);
        setNotification({
          visible: true,
          type: "error",
          message: "Erro ao criar doação",
          description:
            "Não foi possível cadastrar sua doação. Tente novamente.",
        });
      }
    },
    [user, createItem, navigation]
  );

  // Função para fechar notificações
  const handleCloseNotification = useCallback((): void => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  // Componente renderizador de formulário - Evitando renderização aninhada de VirtualizedLists
  const renderFormContent = useCallback(
    (formikProps: FormikProps<DonationFormValues>): React.ReactElement => {
      const {
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        values,
        errors,
        touched,
      } = formikProps;

      return (
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
            onSelect={(value) => {
              setFieldValue("type", value);
            }}
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
            onSelect={(value) => {
              setFieldValue("type", value);
            }}
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
      );
    },
    [isLoading, navigation]
  );

  return (
    <View style={styles.container}>
      {/* StatusBar e Header com Gradiente */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
        locations={[0, 0.3, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.primary.main}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h1" style={styles.headerTitle}>
              Nova Doação
            </Typography>
            <Typography variant="bodySecondary">
              Olá, {user?.name?.split(" ")[0] || "Doador"}
            </Typography>
          </View>
        </View>
      </LinearGradient>

      {/* Notificações */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={handleCloseNotification}
      />

      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar doação"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      {/* Conteúdo do Formulário */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.formContainer}>
          <Formik<DonationFormValues>
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
            {(formikProps) => (
              <FlatList
                data={[1]} // Usamos apenas um item para renderizar o conteúdo
                renderItem={() => renderFormContent(formikProps)}
                keyExtractor={() => "form"}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 60 : 40 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 5,
    color: theme.colors.primary.main,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: theme.colors.neutral.white,
  },
  scrollContent: {
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
