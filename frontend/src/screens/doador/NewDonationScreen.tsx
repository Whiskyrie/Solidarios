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
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from "react-native";
import { Formik, FormikProps } from "formik";
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
  CategoryPicker,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";

// Tipos e rotas
import { CreateItemDto, ItemType } from "../../types/items.types";
import { DoadorNewDonationStackParamList } from "../../navigation/types";

// Interfaces
interface DonationFormValues {
  type: ItemType;
  description: string;
  conservationState: string;
  size: string;
  categoryId: string;
  photos: Photo[];
}

interface NotificationState {
  visible: boolean;
  type: "success" | "error";
  message: string;
  description?: string;
}

interface Photo {
  uri: string;
  name: string;
  type: string;
}

// Constantes
const MAX_PHOTOS = 5;
const MIN_DESCRIPTION_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 100;

// Schema de validação corrigido - removendo validação restritiva das fotos
const DonationSchema = Yup.object()
  .shape({
    type: Yup.string()
      .oneOf(Object.values(ItemType), "Tipo de item inválido")
      .required("Tipo de item é obrigatório"),
    description: Yup.string()
      .min(
        MIN_DESCRIPTION_LENGTH,
        `Descrição deve ter pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres`
      )
      .max(
        MAX_DESCRIPTION_LENGTH,
        `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`
      )
      .required("Descrição é obrigatória"),
    // Tornar campos opcionais menos restritivos
    conservationState: Yup.string().optional(),
    size: Yup.string().optional(),
    categoryId: Yup.string().optional(),
    // Remover validação de fotos do schema, validar manualmente
  })
  .test("photos-validation", "Pelo menos uma foto é recomendada", function () {
    // Esta validação é opcional - apenas avisa sobre fotos
    return true; // Sempre retorna true para não bloquear o envio
  });

// Opções de configuração
const TYPE_OPTIONS = [
  { label: "Roupa", value: ItemType.ROUPA, icon: "checkroom" },
  { label: "Calçado", value: ItemType.CALCADO, icon: "sports-tennis" },
  { label: "Utensílio", value: ItemType.UTENSILIO, icon: "kitchen" },
  { label: "Outro", value: ItemType.OUTRO, icon: "category" },
];

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

// Configuração do ImagePicker corrigida
const IMAGE_PICKER_CONFIG: ImagePicker.ImagePickerOptions = {
  mediaTypes: "images",
  allowsEditing: true,
  aspect: [4, 3] as [number, number],
  quality: 0.8,
  allowsMultipleSelection: false,
};

const NewDonationScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorNewDonationStackParamList>>();
  const { user } = useAuth();
  const {
    createItem,
    createItemWithPhotos,
    isLoading,
    error,
    clearError,
    items,
  } = useItems();
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
  const [hasGalleryPermission, setHasGalleryPermission] = useState<
    boolean | null
  >(null);

  // Refs para animações e Formik
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formikRef = useRef<FormikProps<DonationFormValues>>(null);

  // Verificar e solicitar permissões
  useEffect(() => {
    checkGalleryPermissions();
  }, []);

  const checkGalleryPermissions = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à sua galeria para adicionar fotos às doações.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Solicitar novamente", onPress: checkGalleryPermissions },
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      setHasGalleryPermission(false);
    }
  };

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
  }, [fadeAnim, slideAnim]);

  // Funções de notificação
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

  // Função para escolher foto - CORRIGIDA
  const pickImage = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Limite atingido",
        `Você pode adicionar no máximo ${MAX_PHOTOS} fotos.`
      );
      return;
    }

    if (hasGalleryPermission === false) {
      Alert.alert(
        "Permissão necessária",
        "Acesso à galeria não foi concedido. Deseja tentar novamente?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Tentar novamente", onPress: checkGalleryPermissions },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync(
        IMAGE_PICKER_CONFIG
      );

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newPhoto: Photo = {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: "image/jpeg",
        };

        setPhotos((prevPhotos) => [...prevPhotos, newPhoto]);

        // Feedback visual para o usuário
        showNotification({
          visible: true,
          type: "success",
          message: "Foto adicionada com sucesso!",
        });

        // Auto-hide notification
        setTimeout(hideNotification, 2000);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      showNotification({
        visible: true,
        type: "error",
        message: "Erro ao selecionar foto",
        description: "Tente novamente ou escolha outra imagem.",
      });
    }
  }, [photos.length, hasGalleryPermission, showNotification, hideNotification]);

  // Função para remover foto
  const removePhoto = useCallback(
    (index: number) => {
      setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
      showNotification({
        visible: true,
        type: "success",
        message: "Foto removida",
      });
      setTimeout(hideNotification, 1500);
    },
    [showNotification, hideNotification]
  );

  // Calcular progresso do formulário
  const calculateProgress = useCallback(
    (values: DonationFormValues) => {
      const requiredFields = ["type", "description"];
      const optionalFields = ["conservationState", "size", "categoryId"];

      const filledRequiredFields = requiredFields.filter(
        (field) =>
          values[field as keyof DonationFormValues] &&
          String(values[field as keyof DonationFormValues]).trim()
      );

      const filledOptionalFields = optionalFields.filter(
        (field) =>
          values[field as keyof DonationFormValues] &&
          String(values[field as keyof DonationFormValues]).trim()
      );

      const hasPhotos = photos.length > 0;

      // Peso para campos obrigatórios (60%), opcionais (30%) e fotos (10%)
      const requiredProgress =
        (filledRequiredFields.length / requiredFields.length) * 0.6;
      const optionalProgress =
        (filledOptionalFields.length / optionalFields.length) * 0.3;
      const photoProgress = hasPhotos ? 0.1 : 0;

      return Math.min(requiredProgress + optionalProgress + photoProgress, 1);
    },
    [photos.length]
  );

  // Função de submit - CORRIGIDA
  const handleSubmit = useCallback(
    async (values: DonationFormValues) => {
      console.log("🚀 HandleSubmit iniciado");
      console.log("📝 Valores:", values);
      console.log("📷 Fotos do state:", photos);

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
        const itemData: CreateItemDto = {
          type: values.type,
          description: values.description.trim(),
          conservationState: values.conservationState?.trim() || "",
          size: values.size?.trim() || "",
          categoryId: values.categoryId || undefined,
          donorId: user.id,
          // Remover photos daqui - será tratado separadamente
        };

        console.log("📤 Dados para API:", itemData);

        // Preparar FormData para fotos se houver
        let photosFormData: FormData | undefined;
        if (photos.length > 0) {
          photosFormData = new FormData();
          photos.forEach((photo, index) => {
            console.log(`📷 Adicionando foto ${index + 1}:`, {
              uri: photo.uri,
              type: photo.type,
              name: photo.name,
            });
            photosFormData!.append("files", {
              uri: photo.uri,
              type: photo.type,
              name: photo.name,
            } as any);
          });
          console.log("📤 FormData preparado com", photos.length, "fotos");
        }

        // Usar a função combinada do hook
        const result = await createItemWithPhotos(itemData, photosFormData);

        if (result.itemResult.success) {
          let successMessage = "Doação cadastrada com sucesso!";
          let successDescription =
            "Sua doação foi registrada e estará disponível para interessados.";

          // Verificar se houve problemas com fotos
          if (photosFormData && result.photoResult) {
            if (!result.photoResult.success) {
              successMessage =
                "Doação cadastrada, mas houve problemas com as fotos";
              successDescription =
                "O item foi criado mas algumas fotos não foram enviadas. Você pode tentar novamente.";
            } else if (result.photoResult.uploadedCount) {
              successDescription += ` ${result.photoResult.uploadedCount} foto(s) enviada(s) com sucesso.`;
            }
          }

          showNotification({
            visible: true,
            type: "success",
            message: successMessage,
            description: successDescription,
          });

          // Reset
          setPhotos([]);

          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        } else {
          throw new Error(result.itemResult.error || "Erro ao criar item");
        }
      } catch (err: any) {
        console.error("❌ Erro:", err);
        showNotification({
          visible: true,
          type: "error",
          message: "Erro ao cadastrar doação",
          description:
            err.response?.data?.message || err.message || "Tente novamente.",
        });
      }
    },
    [user, createItemWithPhotos, navigation, showNotification, photos]
  );

  // Valores iniciais
  const initialValues = useMemo(
    (): DonationFormValues => ({
      type: ItemType.ROUPA,
      description: "",
      conservationState: "",
      size: "",
      categoryId: "",
      photos: [],
    }),
    []
  );

  // Componente de Header
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
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

  // Componente de Upload de Fotos - CORRIGIDO
  const PhotoUploadSection = useCallback(() => {
    const photoData = [
      { type: "add-button", id: "add-button" },
      ...photos.map((photo: Photo, index: number) => ({
        type: "photo",
        photo,
        index,
        id: `photo-${index}`,
      })),
    ];

    const renderPhotoItem = ({ item }: any) => {
      if (item.type === "add-button") {
        return (
          <TouchableOpacity
            style={[
              styles.addPhotoButton,
              photos.length >= MAX_PHOTOS && styles.disabledButton,
            ]}
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <MaterialIcons
              name="add-a-photo"
              size={32}
              color={
                photos.length >= MAX_PHOTOS
                  ? theme.colors.neutral.darkGray
                  : theme.colors.primary.secondary
              }
            />
            <Typography
              variant="caption"
              color={
                photos.length >= MAX_PHOTOS
                  ? theme.colors.neutral.darkGray
                  : theme.colors.primary.secondary
              }
              style={styles.addPhotoText}
            >
              {photos.length >= MAX_PHOTOS
                ? "Limite atingido"
                : "Adicionar Foto"}
            </Typography>
          </TouchableOpacity>
        );
      }

      return (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: item.photo.uri }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={() => removePhoto(item.index)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={styles.photoSection}>
        <Typography variant="h4" style={styles.sectionTitle}>
          Fotos do Item
        </Typography>
        <Typography variant="bodySecondary" style={styles.sectionSubtitle}>
          Adicione até {MAX_PHOTOS} fotos para mostrar melhor o item (
          {photos.length}/{MAX_PHOTOS})
        </Typography>
        <FlatList
          data={photoData}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoListContent}
        />
      </View>
    );
  }, [photos, pickImage, removePhoto]);

  // Componente de Progresso
  const ProgressIndicator = useCallback(
    ({ progress }: { progress: number }) => (
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
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    ),
    []
  );

  // Estrutura de seções do formulário
  const formSections = [
    {
      id: "basic-info",
      type: "card",
      icon: "info",
      title: "Informações do Item",
    },
    { id: "category", type: "card", icon: "label", title: "Categoria" },
    {
      id: "photos",
      type: "card",
      icon: "photo-camera",
      title: "Fotos do Item",
    },
  ];

  // Função para renderizar seções do formulário
  const renderFormSection = useCallback(
    ({ item, formikProps }: any) => {
      const {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        setFieldValue,
      } = formikProps;

      if (item.id === "basic-info") {
        return (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={theme.colors.primary.secondary}
              />
              <Typography variant="h4" style={styles.cardTitle}>
                {item.title}
              </Typography>
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="bodySecondary" style={styles.fieldLabel}>
                <MaterialIcons
                  name="category"
                  size={16}
                  color={theme.colors.neutral.darkGray}
                />{" "}
                Tipo de Item{" "}
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.status.error}
                >
                  *
                </Typography>
              </Typography>
              <Select
                options={TYPE_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                selectedValue={values.type}
                onSelect={(value) => setFieldValue("type", value)}
                error={touched.type && errors.type ? errors.type : undefined}
                selectStyle={styles.selectField}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="bodySecondary" style={styles.fieldLabel}>
                <MaterialIcons
                  name="description"
                  size={16}
                  color={theme.colors.neutral.darkGray}
                />{" "}
                Descrição{" "}
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.status.error}
                >
                  *
                </Typography>
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
                inputContainerStyle={styles.selectField}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="bodySecondary" style={styles.fieldLabel}>
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
                onSelect={(value) => setFieldValue("conservationState", value)}
                error={
                  touched.conservationState && errors.conservationState
                    ? errors.conservationState
                    : undefined
                }
                placeholder="Selecione o estado de conservação"
                selectStyle={styles.selectField}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="bodySecondary" style={styles.fieldLabel}>
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
                error={touched.size && errors.size ? errors.size : undefined}
                placeholder="Ex: PP, P, M, G, GG, 38, 40, etc."
                inputContainerStyle={styles.selectField}
              />
            </View>
          </View>
        );
      }

      if (item.id === "category") {
        return (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={theme.colors.primary.secondary}
              />
              <Typography variant="h4" style={styles.cardTitle}>
                {item.title}
              </Typography>
            </View>
            <CategoryPicker
              name="categoryId"
              label=""
              required={false}
              multiple={false}
            />
          </View>
        );
      }

      if (item.id === "photos") {
        return (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={theme.colors.primary.secondary}
              />
              <Typography variant="h4" style={styles.cardTitle}>
                {item.title}
              </Typography>
            </View>
            <PhotoUploadSection />
          </View>
        );
      }

      return null;
    },
    [PhotoUploadSection]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header />

      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={hideNotification}
      />

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
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Formik
          innerRef={formikRef} // Use innerRef ao invés de ref
          initialValues={initialValues}
          validationSchema={DonationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            isValid,
            isSubmitting,
            handleSubmit: formikHandleSubmit,
          }) => (
            <View style={styles.container}>
              <View style={styles.fixedProgressContainer}>
                <ProgressIndicator progress={calculateProgress(values)} />
              </View>

              <FlatList
                data={formSections}
                renderItem={({ item }) =>
                  renderFormSection({
                    item,
                    formikProps: {
                      values,
                      errors,
                      touched,
                      handleChange,
                      handleBlur,
                      setFieldValue,
                      isValid,
                      isSubmitting,
                    },
                  })
                }
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />

              <View style={styles.bottomActions}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Typography
                      variant="body"
                      color={theme.colors.neutral.darkGray}
                    >
                      Cancelar
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitButtonContainer}
                    onPress={() => {
                      console.log("🔘 Botão de submit clicado!");
                      console.log("📝 Valores atuais:", values);
                      console.log("❌ Erros:", errors);
                      console.log("✅ IsValid:", isValid);
                      console.log("📷 Fotos:", photos);

                      // Verificar se há fotos (se necessário)
                      if (photos.length === 0) {
                        Alert.alert(
                          "Atenção",
                          "Você deseja continuar sem fotos? Adicionar fotos ajuda outros usuários a conhecer melhor o item.",
                          [
                            { text: "Adicionar fotos", style: "cancel" },
                            {
                              text: "Continuar sem fotos",
                              onPress: () => formikHandleSubmit(),
                            },
                          ]
                        );
                      } else {
                        formikHandleSubmit();
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={isLoading || !isValid}
                  >
                    <Typography variant="button" color="white">
                      {isLoading ? "Cadastrando..." : "Cadastrar Doação"}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Formik>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// Estilos atualizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 45 : 25 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 15,
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
  fixedProgressContainer: {
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.mediumGray,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    ...theme.shadows.large,
  },
  scrollContainer: {
    padding: theme.spacing.m,
    paddingBottom: 100,
    paddingTop: theme.spacing.s,
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
  photoListContent: {
    paddingHorizontal: theme.spacing.xs,
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
  },
  disabledButton: {
    opacity: 0.5,
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
  progressContainer: {
    marginBottom: theme.spacing.m,
    width: "94%",
    alignSelf: "center",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary.secondary,
    borderRadius: 2,
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
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    ...theme.shadows.large,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.s,
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    backgroundColor: theme.colors.neutral.lightGray,
    ...theme.shadows.small,
  },
  submitButtonContainer: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.small,
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  submitButtonText: {
    fontWeight: "600",
  },
});

export default NewDonationScreen;
