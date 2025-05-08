// src/screens/doador/DonationDetailScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  StatusIndicator,
  Badge,
  Card,
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
import { DOADOR_ROUTES } from "../../navigation/routes";
import { formatDate } from "../../utils/formatters";
import { ItemType } from "../../types/items.types";

// Interface para a rota
type DonationDetailScreenRouteProp = RouteProp<
  DoadorStackParamList,
  typeof DOADOR_ROUTES.DONATION_DETAIL
>;

const DonationDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<DonationDetailScreenRouteProp>();
  const id = route.params?.id;
  const navigation = useNavigation<StackNavigationProp<DoadorStackParamList>>();

  // Verificar se temos um ID válido
  if (!id) {
    return (
      <EmptyState
        title="Doação não encontrada"
        description="O ID da doação é inválido ou não foi fornecido."
        actionLabel="Voltar para minhas doações"
        onAction={() => navigation.goBack()}
      />
    );
  }

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
  const [currentImage, setCurrentImage] = useState<number>(0);
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

  // Carregar detalhes da doação
  const loadDonationDetails = useCallback(async () => {
    await fetchItemById(id);
  }, [fetchItemById, id]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadDonationDetails();
    }, [loadDonationDetails])
  );

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

  // Renderizar loading state
  if (isLoading && !item) {
    return (
      <Loading
        visible={true}
        message="Carregando detalhes da doação..."
        overlay
      />
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar detalhes"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadDonationDetails();
        }}
      />
    );
  }

  // Se o item não foi carregado
  if (!item) {
    return (
      <EmptyState
        title="Doação não encontrada"
        description="A doação que você está procurando não está disponível."
        actionLabel="Voltar para minhas doações"
        onAction={() => navigation.goBack()}
      />
    );
  }

  // Verificar se o usuário logado é o doador do item
  const isOwner = user?.id === item.donorId;

  // Mapeamento de tipos de itens para rótulos
  const itemTypeLabels: Record<ItemType, string> = {
    [ItemType.ROUPA]: "Roupa",
    [ItemType.CALCADO]: "Calçado",
    [ItemType.UTENSILIO]: "Utensílio",
    [ItemType.OUTRO]: "Outro",
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Detalhes da Doação"
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Galeria de imagens */}
        <View style={styles.imageContainer}>
          {item.photos && item.photos.length > 0 ? (
            <>
              <Image
                source={{ uri: item.photos[currentImage] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {item.photos.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailContainer}
                >
                  {item.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImage(index)}
                      style={[
                        styles.thumbnail,
                        currentImage === index && styles.selectedThumbnail,
                      ]}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Sem imagens disponíveis
              </Typography>
            </View>
          )}
        </View>

        {/* Informações básicas */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Badge
              label={itemTypeLabels[item.type]}
              variant="info"
              size="medium"
            />
            <StatusIndicator status={item.status} showLabel />
          </View>

          <Typography variant="h3" style={styles.title}>
            {item.description}
          </Typography>

          <Divider spacing={theme.spacing.s} />

          {/* Detalhes do item */}
          <View style={styles.detailsContainer}>
            {item.size && (
              <View style={styles.detailRow}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Tamanho:
                </Typography>
                <Typography variant="body">{item.size}</Typography>
              </View>
            )}

            {item.conservationState && (
              <View style={styles.detailRow}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Estado de conservação:
                </Typography>
                <Typography variant="body">{item.conservationState}</Typography>
              </View>
            )}

            <View style={styles.detailRow}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Data de doação:
              </Typography>
              <Typography variant="body">
                {formatDate(item.receivedDate)}
              </Typography>
            </View>

            {item.category && (
              <View style={styles.detailRow}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Categoria:
                </Typography>
                <Badge label={item.category.name} variant="info" size="small" />
              </View>
            )}
          </View>
        </Card>

        {/* Status da doação */}
        <Card title="Status da Doação" style={styles.card}>
          <View style={styles.statusTimeline}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <View style={styles.statusContent}>
                <Typography variant="bodySecondary" style={styles.statusTitle}>
                  Doação Recebida
                </Typography>
                <Typography
                  variant="small"
                  color={theme.colors.neutral.darkGray}
                >
                  {formatDate(item.receivedDate)}
                </Typography>
              </View>
            </View>

            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  item.status !== "disponivel" && styles.statusDotActive,
                ]}
              />
              <View style={styles.statusContent}>
                <Typography variant="bodySecondary" style={styles.statusTitle}>
                  {item.status === "reservado" || item.status === "distribuido"
                    ? "Reservado para Beneficiário"
                    : "Aguardando Reserva"}
                </Typography>
                {(item.status === "reservado" ||
                  item.status === "distribuido") && (
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    Item reservado para distribuição
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  item.status === "distribuido" && styles.statusDotActive,
                ]}
              />
              <View style={styles.statusContent}>
                <Typography variant="bodySecondary" style={styles.statusTitle}>
                  {item.status === "distribuido"
                    ? "Entregue ao Beneficiário"
                    : "Aguardando Entrega"}
                </Typography>
                {item.status === "distribuido" && (
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    Sua doação foi entregue a quem precisava!
                  </Typography>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Ações disponíveis */}
        {isOwner && item.status === "disponivel" && (
          <Button
            title="Cancelar Doação"
            onPress={handleCancelDonation}
            variant="secondary"
            style={styles.actionButton}
          />
        )}
      </ScrollView>
    </View>
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
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xxl,
  },
  imageContainer: {
    marginBottom: theme.spacing.s,
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
    backgroundColor: theme.colors.neutral.lightGray,
  },
  mainImage: {
    width: "100%",
    height: 250,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  thumbnailContainer: {
    flexDirection: "row",
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedThumbnail: {
    borderColor: theme.colors.primary.secondary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: theme.colors.neutral.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: theme.spacing.s,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  detailsContainer: {
    marginTop: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  statusTimeline: {
    padding: theme.spacing.xs,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: theme.spacing.s,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    marginTop: 4,
    marginRight: theme.spacing.xs,
  },
  statusDotActive: {
    backgroundColor: theme.colors.status.success,
    borderColor: theme.colors.status.success,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: "bold",
  },
  actionButton: {
    marginTop: theme.spacing.s,
  },
});

export default DonationDetailScreen;
