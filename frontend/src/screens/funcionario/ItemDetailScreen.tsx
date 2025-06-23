import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  RefreshControl,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { FuncionarioItemsStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Badge,
  Divider,
  Button,
  EmptyState,
  Loading,
  ErrorState,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Tipos e rotas
import { formatDate } from "../../utils/formatters";
import { ItemType } from "../../types/items.types";

// Dimensões da tela
const { width: screenWidth } = Dimensions.get("window");

// Interface para a rota
type ItemDetailScreenRouteProp = RouteProp<
  FuncionarioItemsStackParamList,
  "ItemDetail"
>;

// Skeleton Loading Component
const ItemDetailSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonImage, { opacity }]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonLine, { opacity, width: "80%" }]} />
        <Animated.View style={[styles.skeletonLine, { opacity, width: "60%" }]} />
        <Animated.View style={[styles.skeletonBlock, { opacity }]} />
      </View>
    </View>
  );
};

// Galeria de Imagens
const ImageGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  if (!images || images.length === 0) {
    return (
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        style={styles.noImageContainer}
      >
        <MaterialIcons name="image" size={64} color="rgba(255,255,255,0.5)" />
        <Typography
          variant="body"
          color={theme.colors.neutral.white}
          style={{ marginTop: 8 }}
        >
          Sem imagens disponíveis
        </Typography>
      </LinearGradient>
    );
  }

  return (
    <Animated.View style={[styles.galleryContainer, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: image }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                index === activeIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// Componente Principal
const ItemDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<ItemDetailScreenRouteProp>();
  const id = route.params?.id;
  const navigation = useNavigation<StackNavigationProp<FuncionarioItemsStackParamList>>();

  // Estado
  const { user } = useAuth();
  const {
    item,
    fetchItemById,
    updateItem,
    removeItem,
    isLoading,
    error,
    clearError,
  } = useItems();

  const [refreshing, setRefreshing] = useState(false);
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

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Verificar se temos um ID válido
  if (!id) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#173F5F", "#006E58"]}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <EmptyState
          title="Item não encontrado"
          description="O ID do item é inválido ou não foi fornecido."
          actionLabel="Voltar para lista de itens"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Carregar detalhes do item
  const loadItemDetails = useCallback(async () => {
    await fetchItemById(id);
  }, [fetchItemById, id]);

  // Animação de entrada
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
  }, []);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadItemDetails();
    }, [loadItemDetails])
  );

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItemDetails();
    setRefreshing(false);
  };

  // Alterar status do item
  const handleStatusChange = (newStatus: string) => {
    Alert.alert(
      "Alterar Status",
      `Tem certeza que deseja alterar o status para "${newStatus}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateItem(id, { status: newStatus });
              setNotification({
                visible: true,
                type: "success",
                message: "Status alterado com sucesso!",
              });
              await loadItemDetails();
            } catch (err) {
              console.error("Erro ao alterar status:", err);
              setNotification({
                visible: true,
                type: "error",
                message: "Erro ao alterar status",
                description: "Não foi possível alterar o status do item.",
              });
            }
          },
        },
      ]
    );
  };

  // Remover item
  const handleRemoveItem = () => {
    Alert.alert(
      "Remover Item",
      "Tem certeza que deseja remover este item?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removeItem(id);
              setNotification({
                visible: true,
                type: "success",
                message: "Item removido com sucesso!",
              });
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
            } catch (err) {
              console.error("Erro ao remover item:", err);
              setNotification({
                visible: true,
                type: "error",
                message: "Erro ao remover item",
                description: "Não foi possível remover o item.",
              });
            }
          },
        },
      ]
    );
  };

  // Editar item
  const handleEditItem = () => {
    navigation.navigate("EditItem", { id });
  };

  // Mapeamento de tipos
  const itemTypeLabels: Record<ItemType, string> = {
    [ItemType.ROUPA]: "Roupa",
    [ItemType.CALCADO]: "Calçado",
    [ItemType.UTENSILIO]: "Utensílio",
    [ItemType.OUTRO]: "Outro",
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />

      {/* Header Gradiente */}
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Typography variant="h2" color="#fff" style={styles.headerTitle}>
            Detalhes do Item
          </Typography>
          <TouchableOpacity
            onPress={handleEditItem}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Conteúdo */}
      {isLoading && !item ? (
        <ItemDetailSkeleton />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar detalhes"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            clearError();
            loadItemDetails();
          }}
        />
      ) : !item ? (
        <EmptyState
          title="Item não encontrado"
          description="O item que você está procurando não está disponível."
          actionLabel="Voltar para lista de itens"
          onAction={() => navigation.goBack()}
        />
      ) : (
        <Animated.ScrollView
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.secondary]}
              tintColor={theme.colors.primary.secondary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Galeria de Imagens */}
          <ImageGallery images={item.photos || []} />

          {/* Card Principal */}
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <Badge
                label={itemTypeLabels[item.type]}
                variant="info"
                size="medium"
              />
              <View style={styles.statusBadge}>
                <MaterialIcons
                  name={
                    item.status === "disponivel"
                      ? "check-circle"
                      : item.status === "reservado"
                      ? "schedule"
                      : "volunteer-activism"
                  }
                  size={16}
                  color={
                    item.status === "disponivel"
                      ? theme.colors.status.success
                      : item.status === "reservado"
                      ? theme.colors.status.warning
                      : theme.colors.status.info
                  }
                />
                <Typography
                  variant="small"
                  color={
                    item.status === "disponivel"
                      ? theme.colors.status.success
                      : item.status === "reservado"
                      ? theme.colors.status.warning
                      : theme.colors.status.info
                  }
                  style={{ marginLeft: 4, fontWeight: "600" }}
                >
                  {item.status === "disponivel"
                    ? "Disponível"
                    : item.status === "reservado"
                    ? "Reservado"
                    : "Distribuído"}
                </Typography>
              </View>
            </View>

            <Typography variant="h3" style={styles.itemTitle}>
              {item.description}
            </Typography>

            <Divider spacing={theme.spacing.m} />

            {/* Detalhes */}
            <View style={styles.detailsGrid}>
              {item.size && (
                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="straighten"
                    size={20}
                    color={theme.colors.primary.secondary}
                  />
                  <View style={styles.detailText}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Tamanho
                    </Typography>
                    <Typography variant="body">{item.size}</Typography>
                  </View>
                </View>
              )}

              {item.conservationState && (
                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="star"
                    size={20}
                    color={theme.colors.primary.secondary}
                  />
                  <View style={styles.detailText}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Conservação
                    </Typography>
                    <Typography variant="body">
                      {item.conservationState}
                    </Typography>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <MaterialIcons
                  name="event"
                  size={20}
                  color={theme.colors.primary.secondary}
                />
                <View style={styles.detailText}>
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    Data de recebimento
                  </Typography>
                  <Typography variant="body">
                    {formatDate(item.receivedDate)}
                  </Typography>
                </View>
              </View>

              {item.category && (
                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="category"
                    size={20}
                    color={theme.colors.primary.secondary}
                  />
                  <View style={styles.detailText}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Categoria
                    </Typography>
                    <Typography variant="body">{item.category.name}</Typography>
                  </View>
                </View>
              )}

              {item.donor && (
                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="person"
                    size={20}
                    color={theme.colors.primary.secondary}
                  />
                  <View style={styles.detailText}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Doador
                    </Typography>
                    <Typography variant="body">{item.donor.name}</Typography>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Ações de Status */}
          <View style={styles.actionsCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Alterar Status
            </Typography>
            <View style={styles.statusActions}>
              {item.status !== "disponivel" && (
                <Button
                  title="Marcar como Disponível"
                  onPress={() => handleStatusChange("disponivel")}
                  variant="secondary"
                  style={styles.statusButton}
                />
              )}
              {item.status !== "reservado" && (
                <Button
                  title="Marcar como Reservado"
                  onPress={() => handleStatusChange("reservado")}
                  variant="secondary"
                  style={styles.statusButton}
                />
              )}
              {item.status !== "distribuido" && (
                <Button
                  title="Marcar como Distribuído"
                  onPress={() => handleStatusChange("distribuido")}
                  variant="primary"
                  style={styles.statusButton}
                />
              )}
            </View>
          </View>

          {/* Ações de Gerenciamento */}
          <View style={styles.managementActions}>
            <Button
              title="Editar Item"
              onPress={handleEditItem}
              variant="primary"
              style={styles.editButtonLarge}
            />
            <Button
              title="Remover Item"
              onPress={handleRemoveItem}
              variant="secondary"
              style={styles.removeButton}
            />
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: theme.spacing.m,
    ...theme.shadows.strong,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  // Skeleton
  skeletonContainer: {
    flex: 1,
    padding: theme.spacing.m,
  },
  skeletonImage: {
    height: 300,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m,
  },
  skeletonContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.s,
  },
  skeletonBlock: {
    height: 100,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.m,
  },
  // Galeria
  galleryContainer: {
    height: 300,
    backgroundColor: theme.colors.neutral.white,
  },
  imageWrapper: {
    width: screenWidth,
    height: 300,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: theme.spacing.m,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: theme.colors.neutral.white,
    width: 24,
  },
  // Card Principal
  mainCard: {
    backgroundColor: theme.colors.neutral.white,
    margin: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  itemTitle: {
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.s,
  },
  detailsGrid: {
    marginTop: theme.spacing.s,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  detailText: {
    flex: 1,
    marginLeft: theme.spacing.s,
  },
  // Ações
  actionsCard: {
    backgroundColor: theme.colors.neutral.white,
    margin: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.primary.main,
  },
  statusActions: {
    gap: theme.spacing.s,
  },
  statusButton: {
    marginBottom: theme.spacing.xs,
  },
  managementActions: {
    flexDirection: "row",
    gap: theme.spacing.s,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  editButtonLarge: {
    flex: 1,
  },
  removeButton: {
    flex: 1,
    borderColor: theme.colors.status.error,
  },
});

export default ItemDetailScreen;