// src/screens/beneficiario/ItemDetailScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";

// Componentes
import {
  Typography,
  Header,
  Button,
  Badge,
  Divider,
  Card,
  EmptyState,
  Loading,
  ErrorState,
  StatusIndicator,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos, enums e rotas
import { Item, ItemStatus, ItemType } from "../../types/items.types";
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";
import { formatDate } from "../../utils/formatters";

// Interface para a rota
type ItemDetailScreenRouteProp = RouteProp<
  BeneficiarioStackParamList,
  typeof BENEFICIARIO_ROUTES.ITEM_DETAIL
>;

const ItemDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<ItemDetailScreenRouteProp>();
  const id = route.params?.id || "";
  const navigation =
    useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();

  // Estado
  const { user } = useAuth();
  const { item, fetchItemById, isLoading, error, clearError } = useItems();
  const { createDistribution, isLoading: isDistributionLoading } =
    useDistributions();
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

  // Carregar detalhes do item
  const loadItem = useCallback(async () => {
    await fetchItemById(id);
  }, [fetchItemById, id]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  // Solicitar item
  const handleRequestItem = async () => {
    if (!user || !item) return;

    // Confirmar solicitação
    Alert.alert(
      "Solicitar Item",
      "Deseja solicitar este item? Um administrador entrará em contato para agendar a entrega.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              // Normalmente esta operação seria feita por um funcionário,
              // mas poderíamos desenvolver uma funcionalidade para solicitação
              // pelo beneficiário que depois é processada por um funcionário

              // Exemplo simulado de solicitação
              setNotification({
                visible: true,
                type: "success",
                message: "Solicitação enviada!",
                description:
                  "Nossa equipe entrará em contato em breve para confirmar os detalhes da entrega.",
              });

              // Ocultar notificação após 3 segundos
              setTimeout(() => {
                setNotification({ ...notification, visible: false });
                navigation.goBack();
              }, 3000);
            } catch (err) {
              console.error("Erro ao solicitar item:", err);
              setNotification({
                visible: true,
                type: "error",
                message: "Erro ao solicitar item",
                description:
                  "Não foi possível processar sua solicitação. Tente novamente.",
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
        message="Carregando detalhes do item..."
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
          loadItem();
        }}
      />
    );
  }

  // Se o item não foi carregado
  if (!item) {
    return (
      <EmptyState
        title="Item não encontrado"
        description="O item que você está procurando não está disponível."
        actionLabel="Voltar para itens disponíveis"
        onAction={() => navigation.goBack()}
      />
    );
  }

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
        title="Detalhes do Item"
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
                Data de recebimento:
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

        {/* Ação de solicitar */}
        {item.status === ItemStatus.DISPONIVEL && (
          <Button
            title="Solicitar este item"
            onPress={handleRequestItem}
            loading={isDistributionLoading}
            style={styles.actionButton}
          />
        )}

        {item.status !== ItemStatus.DISPONIVEL && (
          <Card style={styles.unavailableCard}>
            <Typography variant="body" color={theme.colors.status.error} center>
              Este item não está disponível para solicitação no momento.
            </Typography>
          </Card>
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
  actionButton: {
    marginTop: theme.spacing.s,
  },
  unavailableCard: {
    marginTop: theme.spacing.s,
    backgroundColor: theme.colors.notifications.error.background,
    padding: theme.spacing.s,
  },
});

export default ItemDetailScreen;
