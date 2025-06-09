// DonationDetailScreen.tsx - Versão Redesenhada
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
import { DoadorStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Badge,
  Divider,
  Button,
  EmptyState,
  ErrorState,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Tipos e rotas
import { DOADOR_ROUTES } from "../../navigation/routes";
import { formatDate } from "../../utils/formatters";
import { ItemType } from "../../types/items.types";

// Dimensões da tela
const { width: screenWidth } = Dimensions.get("window");

// Interface para a rota
type DonationDetailScreenRouteProp = RouteProp<
  DoadorStackParamList,
  typeof DOADOR_ROUTES.DONATION_DETAIL
>;

// Skeleton Loading Component
const DonationDetailSkeleton: React.FC = () => {
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
        <Animated.View
          style={[styles.skeletonLine, { opacity, width: "60%" }]}
        />
        <Animated.View
          style={[styles.skeletonLine, { opacity, width: "40%" }]}
        />
        <Animated.View style={[styles.skeletonBlock, { opacity }]} />
      </View>
    </View>
  );
};

// Componente de Timeline Animado
const AnimatedTimeline: React.FC<{
  status: "disponivel" | "reservado" | "distribuido";
  receivedDate: string;
}> = ({ status, receivedDate }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotsScale = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const progress =
      status === "disponivel" ? 33 : status === "reservado" ? 66 : 100;

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }),
      ...dotsScale.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.spring(anim, {
            toValue:
              (status === "disponivel" && index === 0) ||
              (status === "reservado" && index <= 1) ||
              status === "distribuido"
                ? 1
                : 0,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [status]);

  const steps = [
    {
      title: "Doação Recebida",
      description: formatDate(receivedDate),
      icon: "volunteer-activism",
      active: true,
    },
    {
      title: "Reservado",
      description:
        status !== "disponivel"
          ? "Item reservado para beneficiário"
          : "Aguardando reserva",
      icon: "bookmark",
      active: status === "reservado" || status === "distribuido",
    },
    {
      title: "Entregue",
      description:
        status === "distribuido"
          ? "Doação entregue com sucesso!"
          : "Aguardando entrega",
      icon: "done-all",
      active: status === "distribuido",
    },
  ];

  return (
    <View style={styles.timelineContainer}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {steps.map((step, index) => (
        <View key={index} style={styles.timelineStep}>
          <Animated.View
            style={[
              styles.stepDot,
              step.active && styles.stepDotActive,
              { transform: [{ scale: dotsScale[index] }] },
            ]}
          >
            <MaterialIcons
              name={step.icon}
              size={16}
              color={step.active ? "#fff" : theme.colors.neutral.mediumGray}
            />
          </Animated.View>
          <View style={styles.stepContent}>
            <Typography
              variant="bodySecondary"
              style={[styles.stepTitle, step.active && styles.stepTitleActive]}
            >
              {step.title}
            </Typography>
            <Typography variant="small" color={theme.colors.neutral.darkGray}>
              {step.description}
            </Typography>
          </View>
        </View>
      ))}
    </View>
  );
};

// Componente de Galeria de Imagens
const ImageGallery: React.FC<{
  images: string[];
}> = ({ images }) => {
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
        <MaterialIcons
          name="image-not-supported"
          size={48}
          color={theme.colors.neutral.white}
        />
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
const DonationDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<DonationDetailScreenRouteProp>();
  const id = route.params?.id;
  const navigation = useNavigation<StackNavigationProp<DoadorStackParamList>>();

  // Estado
  const { user } = useAuth();
  const { item, fetchItemById, removeItem, isLoading, error, clearError } =
    useItems();

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
          title="Doação não encontrada"
          description="O ID da doação é inválido ou não foi fornecido."
          actionLabel="Voltar para minhas doações"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Carregar detalhes da doação
  const loadDonationDetails = useCallback(async () => {
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
      loadDonationDetails();
    }, [loadDonationDetails])
  );

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonationDetails();
    setRefreshing(false);
  };

  // Cancelar doação
  const handleCancelDonation = () => {
    Alert.alert(
      "Cancelar Doação",
      "Tem certeza que deseja cancelar esta doação? Esta ação não pode ser desfeita.",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await removeItem(id);
              setNotification({
                visible: true,
                type: "success",
                message: "Doação cancelada com sucesso!",
              });
              setTimeout(() => {
                navigation.navigate(DOADOR_ROUTES.MY_DONATIONS);
              }, 1500);
            } catch (err) {
              console.error("Erro ao cancelar doação:", err);
              setNotification({
                visible: true,
                type: "error",
                message: "Erro ao cancelar doação",
                description:
                  "Não foi possível cancelar sua doação. Tente novamente.",
              });
            }
          },
        },
      ]
    );
  };

  // Mapeamento de tipos
  const itemTypeLabels: Record<ItemType, string> = {
    [ItemType.ROUPA]: "Roupa",
    [ItemType.CALCADO]: "Calçado",
    [ItemType.UTENSILIO]: "Utensílio",
    [ItemType.OUTRO]: "Outro",
  };

  // Verificar se o usuário é o doador
  const isOwner = user?.id === item?.donorId;

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
            Detalhes da Doação
          </Typography>
          <View style={{ width: 40 }} />
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
        <DonationDetailSkeleton />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar detalhes"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            clearError();
            loadDonationDetails();
          }}
        />
      ) : !item ? (
        <EmptyState
          title="Doação não encontrada"
          description="A doação que você está procurando não está disponível."
          actionLabel="Voltar para minhas doações"
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
                    Data de doação
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
            </View>
          </View>

          {/* Timeline de Status */}
          <View style={styles.timelineCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Acompanhe sua Doação
            </Typography>
            <AnimatedTimeline
              status={item.status}
              receivedDate={item.receivedDate}
            />
          </View>

          {/* Ações */}
          {isOwner && item.status === "disponivel" && (
            <Button
              title="Cancelar Doação"
              onPress={handleCancelDonation}
              variant="secondary"
              style={styles.cancelButton}
            />
          )}
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
    width: 24,
    backgroundColor: theme.colors.neutral.white,
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
    marginLeft: theme.spacing.s,
    flex: 1,
  },
  // Timeline
  timelineCard: {
    backgroundColor: theme.colors.neutral.white,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.m,
  },
  timelineContainer: {
    position: "relative",
  },
  progressBarContainer: {
    position: "absolute",
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
  },
  progressBarBackground: {
    position: "absolute",
    width: 2,
    height: "100%",
    backgroundColor: theme.colors.neutral.lightGray,
  },
  progressBar: {
    position: "absolute",
    width: 2,
    backgroundColor: theme.colors.status.success,
  },
  timelineStep: {
    flexDirection: "row",
    marginBottom: theme.spacing.l,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.m,
  },
  stepDotActive: {
    backgroundColor: theme.colors.status.success,
  },
  stepContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  stepTitle: {
    marginBottom: theme.spacing.xs,
  },
  stepTitleActive: {
    color: theme.colors.primary.main,
    fontWeight: "600",
  },
  // Botões
  cancelButton: {
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderColor: theme.colors.status.error,
  },
});

export default DonationDetailScreen;
