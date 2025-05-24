// src/screens/doador/NewDonationScreen.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";

// Componentes
import {
  Typography,
  TextField,
  Select,
  Button,
  CategoryPicker,
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
import { DoadorNewDonationStackParamList } from "../../navigation/types";

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

// Opções de tipo de item com ícones
const TYPE_OPTIONS = [
  {
    label: "Roupa",
    value: ItemType.ROUPA,
    icon: "checkroom",
  },
  {
    label: "Calçado",
    value: ItemType.CALCADO,
    icon: "sports-tennis",
  },
  {
    label: "Utensílio",
    value: ItemType.UTENSILIO,
    icon: "kitchen",
  },
  {
    label: "Outro",
    value: ItemType.OUTRO,
    icon: "category",
  },
];

// Opções de estado de conservação com ícones
const CONSERVATION_STATE_OPTIONS = [
  { label: "Novo", value: "Novo", icon: "new-releases" },
  { label: "Seminovo", value: "Seminovo", icon: "star-half" },
  {
    label: "Usado em bom estado",
    value: "Usado em bom estado",
    icon: "thumb-up",
  },
  {
    label: "Usado com marcas de uso",
    value: "Usado com marcas de uso",
    icon: "info",
  },
];

// Interface para notificação
interface NotificationState {
  visible: boolean;
  type: "success" | "error";
  message: string;
  description?: string;
}

// Interface para foto
interface Photo {
  uri: string;
  name: string;
  type: string;
}

const NewDonationScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorNewDonationStackParamList>>();
  const { user } = useAuth();
  const { createItem, isLoading, error, clearError, items } = useItems();
  const {
    fetchCategories,
    categories,
    isLoading: categoriesLoading,
  } = useCategories();

  // Estados
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: "success",
    message: "",
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animação de entrada
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
  }, []);

  // Função para atualizar notificação
  const showNotification = useCallback(
    (notificationData: NotificationState) => {
      setNotification(notificationData);
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  // Carregar categorias
  useEffect(() => {
    if (fetchCategories && (!categories || categories.length === 0)) {
      fetchCategories();
    }
  }, [fetchCategories, categories]);

  // Função para escolher foto
  const pickImage = async () => {
    if (photos.length >= 5) {
      Alert.alert("Limite atingido", "Você pode adicionar no máximo 5 fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: Photo = {
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        type: "image/jpeg",
      };
      setPhotos((prev) => [...prev, newPhoto]);
    }
  };

  // Função para remover foto
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Calcular progresso do formulário
  const calculateProgress = (values: any) => {
    const fields = ["type", "description", "conservationState", "size"];
    const filledFields = fields.filter(
      (field) => values[field] && values[field].trim()
    );
    const progress =
      (filledFields.length + (photos.length > 0 ? 1 : 0)) / (fields.length + 1);
    return progress;
  };

  // Função de submit
  const handleSubmit = useCallback(
    async (values: any) => {
      if (!user) {
        showNotification({
          visible: true,
          type: "error",
          message: "Erro ao criar doação",
          description: "Você precisa estar logado para doar.",
        });
        return;
      }

      try {
        const itemData = {
          ...values,
          donorId: user.id,
          photos: photos,
        };

        const newItem = await createItem(itemData);

        if (newItem) {
          showNotification({
            visible: true,
            type: "success",
            message: "Doação cadastrada com sucesso!",
            description: "Obrigado pela sua contribuição.",
          });

          setTimeout(() => {
            hideNotification();
            const rootNavigation = navigation.getParent();
            if (rootNavigation) {
              rootNavigation.navigate("MyDonations");
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao criar item:", err);
        showNotification({
          visible: true,
          type: "error",
          message: "Erro ao criar doação",
          description:
            "Não foi possível cadastrar sua doação. Tente novamente.",
        });
      }
    },
    [user, createItem, navigation, showNotification, hideNotification, photos]
  );

  // Valores iniciais
  const initialValues = useMemo(
    () => ({
      type: ItemType.ROUPA,
      description: "",
      conservationState: "",
      size: "",
      categoryId: "",
    }),
    []
  );

  // Componente de Header melhorado
  const Header = useCallback(
    () => (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#173F5F"
          translucent
        />
        <LinearGradient
          colors={["#173F5F", "#006E58"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Botão de voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Seção de boas-vindas */}
          <View style={styles.welcomeSection}>
            <View style={styles.titleSection}>
              <Typography
                variant="h2"
                style={styles.headerTitle}
                color={theme.colors.neutral.white}
              >
                Nova Doação
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.headerSubtitle}
              >
                Sua generosidade faz a diferença
              </Typography>
            </View>

            {/* Contador de doações */}
            <View style={styles.donationCounter}>
              <MaterialIcons
                name="volunteer-activism"
                size={24}
                color="white"
              />
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.counterNumber}
              >
                {items?.length || 0}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                doações feitas
              </Typography>
            </View>
          </View>
        </LinearGradient>
      </>
    ),
    [navigation, items?.length]
  );

  // Componente de upload de fotos visual
  const PhotoUploadSection = ({ photos, onPickImage, onRemovePhoto }: any) => (
    <View style={styles.photoSection}>
      <Typography variant="h4" style={styles.sectionTitle}>
        Fotos do Item
      </Typography>
      <Typography variant="bodySecondary" style={styles.sectionSubtitle}>
        Adicione até 5 fotos para mostrar melhor o item
      </Typography>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.photoScroll}
      >
        {/* Botão para adicionar foto */}
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={onPickImage}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="add-a-photo"
            size={32}
            color={theme.colors.primary.secondary}
          />
          <Typography
            variant="caption"
            color={theme.colors.primary.secondary}
            style={styles.addPhotoText}
          >
            Adicionar Foto
          </Typography>
        </TouchableOpacity>

        {/* Fotos adicionadas */}
        {photos.map((photo: Photo, index: number) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => onRemovePhoto(index)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Componente de progresso visual
  const ProgressIndicator = ({ progress }: { progress: number }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Typography
          variant="bodySecondary"
          color={theme.colors.neutral.darkGray}
        >
          Progresso do formulário
        </Typography>
        <Typography
          variant="bodySecondary"
          color={theme.colors.primary.secondary}
        >
          {Math.round(progress * 100)}%
        </Typography>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header />

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={hideNotification}
      />

      {/* Notificação de erro do hook */}
      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar doação"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

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
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Formik
            initialValues={initialValues}
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
                {/* Indicador de progresso */}
                <ProgressIndicator progress={calculateProgress(values)} />

                {/* Seção de informações básicas */}
                <View style={styles.formCard}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="info"
                      size={24}
                      color={theme.colors.primary.secondary}
                    />
                    <Typography variant="h4" style={styles.cardTitle}>
                      Informações do Item
                    </Typography>
                  </View>

                  {/* Tipo de Item */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="category"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Tipo de Item *
                    </Typography>
                    <Select
                      options={TYPE_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                      selectedValue={values.type}
                      onSelect={(value) => setFieldValue("type", value)}
                      error={
                        touched.type && errors.type ? errors.type : undefined
                      }
                      selectStyle={styles.selectField} // ← Mudança aqui
                    />
                  </View>

                  {/* Descrição */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="description"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Descrição *
                    </Typography>
                    <TextField
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
                      style={styles.textField}
                    />
                  </View>

                  {/* Estado de Conservação */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="grade"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Estado de Conservação
                    </Typography>
                    <Select
                      options={CONSERVATION_STATE_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                      selectedValue={values.conservationState}
                      onSelect={(value) =>
                        setFieldValue("conservationState", value)
                      }
                      error={
                        touched.conservationState && errors.conservationState
                          ? errors.conservationState
                          : undefined
                      }
                      placeholder="Selecione o estado de conservação"
                      selectStyle={styles.selectField} // ← Mudança aqui
                    />
                  </View>

                  {/* Tamanho */}
                  <View style={styles.fieldContainer}>
                    <Typography
                      variant="bodySecondary"
                      style={styles.fieldLabel}
                    >
                      <MaterialIcons
                        name="straighten"
                        size={16}
                        color={theme.colors.neutral.darkGray}
                      />{" "}
                      Tamanho
                    </Typography>
                    <TextField
                      value={values.size}
                      onChangeText={handleChange("size")}
                      onBlur={handleBlur("size")}
                      error={
                        touched.size && errors.size ? errors.size : undefined
                      }
                      placeholder="Ex: PP, P, M, G, GG, 38, 40, etc."
                      style={styles.textField}
                    />
                  </View>
                </View>

                {/* Seção de categoria */}
                <View style={styles.formCard}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="label"
                      size={24}
                      color={theme.colors.primary.secondary}
                    />
                    <Typography variant="h4" style={styles.cardTitle}>
                      Categoria
                    </Typography>
                  </View>

                  <CategoryPicker
                    name="categoryId"
                    label=""
                    required={false}
                    multiple={false}
                  />
                </View>

                {/* Seção de fotos */}
                <View style={styles.formCard}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="photo-camera"
                      size={24}
                      color={theme.colors.primary.secondary}
                    />
                    <Typography variant="h4" style={styles.cardTitle}>
                      Fotos do Item
                    </Typography>
                  </View>

                  <PhotoUploadSection
                    photos={photos}
                    onPickImage={pickImage}
                    onRemovePhoto={removePhoto}
                  />
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>

        {/* Botões de ação fixos */}
        <View style={styles.bottomActions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Typography variant="body" color={theme.colors.neutral.darkGray}>
                Cancelar
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButtonContainer}
              onPress={() => {
                // Trigger form submission
                // Note: You'll need to access the Formik handleSubmit here
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#173F5F", "#006E58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <MaterialIcons
                    name="hourglass-empty"
                    size={20}
                    color="white"
                  />
                ) : (
                  <MaterialIcons
                    name="volunteer-activism"
                    size={20}
                    color="white"
                  />
                )}
                <Typography
                  variant="body"
                  color={theme.colors.neutral.white}
                  style={styles.submitButtonText}
                >
                  {isLoading ? "Cadastrando..." : "Cadastrar Doação"}
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 20,
    ...theme.shadows.large,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    left: theme.spacing.m,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
    marginTop: 40,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  donationCounter: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minWidth: 80,
  },
  counterNumber: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  form: {
    width: "100%",
  },
  progressContainer: {
    marginBottom: theme.spacing.m,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary.secondary,
    borderRadius: 2,
  },
  formCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  cardTitle: {
    marginLeft: theme.spacing.s,
    fontWeight: "600",
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
  textField: {
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
  },
  selectField: {
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
  },
  photoSection: {
    marginTop: theme.spacing.s,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.neutral.darkGray,
  },
  photoScroll: {
    marginHorizontal: -theme.spacing.s,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary.secondary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.s,
  },
  addPhotoText: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: 12,
  },
  photoContainer: {
    position: "relative",
    marginLeft: theme.spacing.s,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.status.error,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.neutral.white,
    paddingTop: theme.spacing.s,
    paddingBottom: Platform.OS === "ios" ? 34 : theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.mediumGray,
    ...theme.shadows.large,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.s,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
  },
  submitButtonContainer: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  submitButtonText: {
    fontWeight: "600",
  },
});

export default NewDonationScreen;
