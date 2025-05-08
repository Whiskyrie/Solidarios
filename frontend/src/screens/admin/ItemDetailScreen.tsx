// src/screens/admin/ItemDetailScreen.tsx
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
import { AdminItemsStackParamList } from "../../navigation/types";
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
  ConfirmationDialog,
  Avatar,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useInventory } from "../../hooks/useInventory";

// Tipos e rotas
import { Item, ItemStatus, ItemType } from "../../types/items.types";
import { ADMIN_ROUTES } from "../../navigation/routes";
import { formatDate } from "../../utils/formatters";

// Interface para a rota
type ItemDetailScreenRouteProp = RouteProp<
  AdminItemsStackParamList,
  "ItemDetail"
>;

const ItemDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<ItemDetailScreenRouteProp>();
  const { id } = route.params;
  const navigation =
    useNavigation<StackNavigationProp<AdminItemsStackParamList>>();

  // Estado
  useAuth();
  const {
    item,
    fetchItemById,
    updateItem,
    removeItem,
    isLoading,
    error,
    clearError,
  } = useItems();
  const {
    inventoryItem,
    fetchInventoryByItemId,
    addToInventory,
    updateQuantity,
    isLoading: isInventoryLoading,
  } = useInventory();
  const [currentImage, setCurrentImage] = useState<number>(0);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
    description?: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [newStatus, setNewStatus] = useState<ItemStatus | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Carregar detalhes do item e verificar estoque
  const loadItemDetails = useCallback(async () => {
    try {
      await fetchItemById(id);

      // Tenta buscar item no inventário (pode não existir)
      try {
        await fetchInventoryByItemId(id);
      } catch (error) {
        console.log(
          "Item não encontrado no inventário ou ocorreu um erro:",
          error
        );
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do item:", error);
    }
  }, [fetchItemById, fetchInventoryByItemId, id]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadItemDetails();
    }, [loadItemDetails])
  );

  // Alterar status do item
  const handleChangeStatus = (status: ItemStatus) => {
    setNewStatus(status);
    setShowStatusConfirmation(true);
  };

  // Confirmar alteração de status
  const confirmStatusChange = async () => {
    if (!item || !newStatus) return;

    try {
      await updateItem(item.id, { status: newStatus });

      // Atualizar inventário se necessário
      if (inventoryItem) {
        // Lógica específica para cada status
        if (newStatus === ItemStatus.DISTRIBUIDO) {
          // Remover do inventário ou marcar como 0
          await updateQuantity(item.id, 0, true);
        } else if (
          newStatus === ItemStatus.DISPONIVEL &&
          inventoryItem.quantity === 0
        ) {
          // Restaurar quantidade
          await updateQuantity(item.id, 1, true);
        }
      }

      setNotification({
        visible: true,
        type: "success",
        message: "Status atualizado com sucesso",
      });

      // Recarregar dados
      loadItemDetails();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao atualizar status",
        description:
          "Não foi possível atualizar o status do item. Tente novamente.",
      });
    } finally {
      setShowStatusConfirmation(false);
      setNewStatus(null);
    }
  };

  // Adicionar ao inventário
  const handleAddToInventory = async () => {
    if (!item) return;

    try {
      if (inventoryItem) {
        // Já existe no inventário, perguntar se deseja incrementar
        Alert.alert(
          "Item já no inventário",
          "Este item já está no inventário. Deseja incrementar a quantidade?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Incrementar",
              onPress: async () => {
                await updateQuantity(item.id, 1, false); // Adiciona 1 à quantidade
                setNotification({
                  visible: true,
                  type: "success",
                  message: "Quantidade atualizada no inventário",
                });
                loadItemDetails();
              },
            },
          ]
        );
      } else {
        // Adicionar ao inventário
        await addToInventory({
          itemId: item.id,
          quantity: 1,
        });

        setNotification({
          visible: true,
          type: "success",
          message: "Item adicionado ao inventário",
        });

        loadItemDetails();
      }
    } catch (err) {
      console.error("Erro ao adicionar ao inventário:", err);
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao adicionar ao inventário",
        description:
          "Não foi possível adicionar o item ao inventário. Tente novamente.",
      });
    }
  };

  // Excluir item
  const handleDeleteItem = async () => {
    if (!item) return;

    try {
      await removeItem(item.id);

      setNotification({
        visible: true,
        type: "success",
        message: "Item excluído com sucesso",
      });

      // Voltar para a lista após a exclusão
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao excluir item",
        description: "Não foi possível excluir o item. Tente novamente.",
      });
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  // Editar item
  const handleEditItem = () => {
    // Corrigimos para passar um objeto com os parâmetros corretos
    navigation.navigate("CreateItem", {
      id: item?.id,
      isEditing: true,
    });
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
          loadItemDetails();
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
        actionLabel="Voltar para lista de itens"
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
        backgroundColor={theme.colors.primary.main}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditItem}
            >
              <Typography variant="small" color={theme.colors.neutral.white}>
                Editar
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={() => setShowDeleteConfirmation(true)}
            >
              <Typography variant="small" color={theme.colors.neutral.white}>
                Excluir
              </Typography>
            </TouchableOpacity>
          </View>
        }
      ></Header>
      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmationDialog
        visible={showDeleteConfirmation}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteConfirmation(false)}
        variant="danger"
      />

      {/* Diálogo de confirmação de alteração de status */}
      <ConfirmationDialog
        visible={showStatusConfirmation}
        title="Alterar Status"
        message={`Tem certeza que deseja alterar o status para "${
          newStatus === ItemStatus.DISPONIVEL
            ? "Disponível"
            : newStatus === ItemStatus.RESERVADO
            ? "Reservado"
            : "Distribuído"
        }"?`}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={confirmStatusChange}
        onCancel={() => setShowStatusConfirmation(false)}
        variant="warning"
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

        {/* Status e Ações Rápidas */}
        <Card style={styles.card}>
          <View style={styles.statusContainer}>
            <View>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Status Atual
              </Typography>
              <StatusIndicator status={item.status} showLabel size="large" />
            </View>

            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  item.status === ItemStatus.DISPONIVEL &&
                    styles.activeStatusButton,
                ]}
                onPress={() => handleChangeStatus(ItemStatus.DISPONIVEL)}
                disabled={item.status === ItemStatus.DISPONIVEL}
              >
                <Typography
                  variant="small"
                  color={
                    item.status === ItemStatus.DISPONIVEL
                      ? theme.colors.badges.available.text
                      : theme.colors.neutral.darkGray
                  }
                >
                  Disponível
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  item.status === ItemStatus.RESERVADO &&
                    styles.activeStatusButton,
                ]}
                onPress={() => handleChangeStatus(ItemStatus.RESERVADO)}
                disabled={item.status === ItemStatus.RESERVADO}
              >
                <Typography
                  variant="small"
                  color={
                    item.status === ItemStatus.RESERVADO
                      ? theme.colors.badges.reserved.text
                      : theme.colors.neutral.darkGray
                  }
                >
                  Reservado
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  item.status === ItemStatus.DISTRIBUIDO &&
                    styles.activeStatusButton,
                ]}
                onPress={() => handleChangeStatus(ItemStatus.DISTRIBUIDO)}
                disabled={item.status === ItemStatus.DISTRIBUIDO}
              >
                <Typography
                  variant="small"
                  color={
                    item.status === ItemStatus.DISTRIBUIDO
                      ? theme.colors.badges.distributed.text
                      : theme.colors.neutral.darkGray
                  }
                >
                  Distribuído
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Informações básicas */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Badge
              label={itemTypeLabels[item.type]}
              variant="info"
              size="medium"
            />
            {item.category && (
              <Badge label={item.category.name} variant="info" size="medium" />
            )}
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

            <View style={styles.detailRow}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                ID do item:
              </Typography>
              <Typography variant="body">{item.id}</Typography>
            </View>
          </View>
        </Card>

        {/* Informações do doador */}
        <Card title="Informações do Doador" style={styles.card}>
          <View style={styles.donorContainer}>
            <Avatar
              name={item.donor.name}
              size="medium"
              style={styles.avatar}
            />
            <View style={styles.donorInfo}>
              <Typography variant="body">{item.donor.name}</Typography>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                {item.donor.email}
              </Typography>
              <Badge
                label="Doador"
                variant="success"
                size="small"
                style={styles.roleBadge}
              />
            </View>
          </View>
        </Card>

        {/* Informações de inventário */}
        <Card title="Informações de Inventário" style={styles.card}>
          {inventoryItem ? (
            <View>
              <View style={styles.detailRow}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Quantidade em estoque:
                </Typography>
                <Typography
                  variant="body"
                  color={
                    inventoryItem.quantity <= (inventoryItem.alertLevel || 0)
                      ? theme.colors.status.error
                      : theme.colors.neutral.black
                  }
                >
                  {inventoryItem.quantity} unidade(s)
                </Typography>
              </View>

              {inventoryItem.location && (
                <View style={styles.detailRow}>
                  <Typography
                    variant="bodySecondary"
                    color={theme.colors.neutral.darkGray}
                  >
                    Localização:
                  </Typography>
                  <Typography variant="body">
                    {inventoryItem.location}
                  </Typography>
                </View>
              )}

              {inventoryItem.alertLevel && (
                <View style={styles.detailRow}>
                  <Typography
                    variant="bodySecondary"
                    color={theme.colors.neutral.darkGray}
                  >
                    Nível de alerta:
                  </Typography>
                  <Typography variant="body">
                    {inventoryItem.alertLevel} unidade(s)
                  </Typography>
                </View>
              )}

              <Button
                title="Atualizar Inventário"
                onPress={handleAddToInventory}
                style={styles.inventoryButton}
                loading={isInventoryLoading}
              />
            </View>
          ) : (
            <View style={styles.emptyInventory}>
              <Typography variant="bodySecondary" center>
                Este item ainda não está registrado no inventário.
              </Typography>
              <Button
                title="Adicionar ao Inventário"
                onPress={handleAddToInventory}
                style={styles.inventoryButton}
                loading={isInventoryLoading}
              />
            </View>
          )}
        </Card>
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
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.xs,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.error,
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
  statusContainer: {
    padding: theme.spacing.xs,
  },
  statusActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: theme.spacing.s,
  },
  statusButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    minWidth: 80,
    alignItems: "center",
  },
  activeStatusButton: {
    borderColor: theme.colors.primary.secondary,
    backgroundColor: "rgba(60, 174, 163, 0.1)",
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
  donorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xs,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  donorInfo: {
    flex: 1,
  },
  roleBadge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xxs,
  },
  emptyInventory: {
    padding: theme.spacing.s,
    alignItems: "center",
  },
  inventoryButton: {
    marginTop: theme.spacing.s,
  },
});

export default ItemDetailScreen;
