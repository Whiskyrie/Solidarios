import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Componentes
import {
  Typography,
  Header,
  StatsCard,
  Card,
  ItemCard,
  DistributionCard,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useInventory } from "../../hooks/useInventory";
import { useDistributions } from "../../hooks/useDistributions";
import { useUsers } from "../../hooks/useUsers";

// Tipos e rotas
import {
  FuncionarioTabParamList,
  FuncionarioItemsStackParamList,
  FuncionarioInventoryStackParamList,
  FuncionarioDistributionsStackParamList,
} from "../../navigation/types";
import { Item } from "../../types/items.types";
import { Distribution } from "../../types/distributions.types";
import { Inventory } from "../../types/inventory.types";
import { StatData } from "../../components/cards/StatsCard";

// Definição do tipo de navegação composta para o Dashboard
type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<FuncionarioTabParamList, "Dashboard">,
  CompositeScreenProps<
    NativeStackScreenProps<FuncionarioItemsStackParamList>,
    CompositeScreenProps<
      NativeStackScreenProps<FuncionarioInventoryStackParamList>,
      NativeStackScreenProps<FuncionarioDistributionsStackParamList>
    >
  >
>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenProps["navigation"]>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks para dados
  const itemsHook = useItems();
  const inventoryHook = useInventory();
  const distributionsHook = useDistributions();

  // Dados agregados para dashboard
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalDistributions: 0,
    lowStockItems: 0,
  });

  // Dados para cards
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<
    Distribution[]
  >([]);
  const [lowStockInventory, setLowStockInventory] = useState<Inventory[]>([]);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [
        itemsResponse,
        inventoryResponse,
        distributionsResponse,
        lowStockResponse,
      ] = await Promise.all([
        itemsHook.fetchItems({ page: 1, take: 50 }),
        inventoryHook.fetchInventory({ page: 1, take: 50 }),
        distributionsHook.fetchDistributions({ page: 1, take: 10 }),
        inventoryHook.fetchLowStock({ page: 1, take: 5 }),
      ]);

      // Calcular estatísticas
      if (
        itemsResponse &&
        inventoryResponse &&
        distributionsResponse &&
        lowStockResponse
      ) {
        const items = itemsResponse.data;
        const availableItems = items.filter(
          (item) => item.status === "disponivel"
        ).length;

        setStats({
          totalItems: itemsResponse.meta.itemCount,
          availableItems,
          totalDistributions: distributionsResponse.meta.itemCount,
          lowStockItems: lowStockResponse.meta.itemCount,
        });

        // Definir itens recentes
        setRecentItems(items.slice(0, 3));

        // Definir distribuições recentes
        setRecentDistributions(distributionsResponse.data.slice(0, 3));

        // Definir itens com estoque baixo
        setLowStockInventory(lowStockResponse.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError(
        "Não foi possível carregar os dados do dashboard. Tente novamente."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados ao montar componente
  useEffect(() => {
    loadData();
  }, []);

  // Função para pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Renderizar loading state
  if (loading && !refreshing) {
    return <Loading visible={true} message="Carregando dashboard..." overlay />;
  }

  // Renderizar erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar dashboard"
        description={error}
        actionLabel="Tentar novamente"
        onAction={loadData}
      />
    );
  }

  // Formatar dados para o card de estatísticas
  const statsData: StatData[] = [
    {
      title: "Total de Itens",
      value: stats.totalItems,
      type: "number",
      color: theme.colors.primary.main,
    },
    {
      title: "Disponíveis",
      value: stats.availableItems,
      type: "number",
      color: theme.colors.status.success,
    },
    {
      title: "Distribuições",
      value: stats.totalDistributions,
      type: "number",
      color: theme.colors.primary.secondary,
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStockItems,
      type: "number",
      color:
        stats.lowStockItems > 0
          ? theme.colors.status.warning
          : theme.colors.neutral.darkGray,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Dashboard"
        subtitle={`Olá, ${user?.name?.split(" ")[0] || "Funcionário"}`}
        backgroundColor={theme.colors.primary.main}
      />

      {/* Conteúdo */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Cards de estatísticas */}
        <StatsCard
          title="Estatísticas do Sistema"
          stats={statsData}
          style={styles.statsCard}
        />

        {/* Itens recentes */}
        <Card
          title="Itens recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Items", { screen: "ItemsList" })
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver todos
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    navigation.navigate("Items", {
                      screen: "ItemDetail",
                      params: { id: item.id },
                    });
                  }}
                  compact
                />
              ))
            ) : (
              <Typography variant="bodySecondary" style={styles.emptyText}>
                Nenhum item cadastrado recentemente.
              </Typography>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                navigation.navigate("Items", {
                  screen: "CreateItem",
                });
              }}
            >
              <Typography variant="body" color={theme.colors.primary.secondary}>
                + Adicionar novo item
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Distribuições recentes */}
        <Card
          title="Distribuições recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Distributions", {
                  screen: "DistributionsList",
                })
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver todas
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {recentDistributions.length > 0 ? (
              recentDistributions.map((distribution) => (
                <DistributionCard
                  key={distribution.id}
                  distribution={distribution}
                  onPress={() => {
                    navigation.navigate("Distributions", {
                      screen: "DistributionDetail",
                      params: { id: distribution.id },
                    });
                  }}
                  compact
                  showItems={false}
                />
              ))
            ) : (
              <Typography variant="bodySecondary" style={styles.emptyText}>
                Nenhuma distribuição realizada recentemente.
              </Typography>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                navigation.navigate("Distributions", {
                  screen: "CreateDistribution",
                });
              }}
            >
              <Typography variant="body" color={theme.colors.primary.secondary}>
                + Criar nova distribuição
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Itens com estoque baixo */}
        <Card
          title="Itens com estoque baixo"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Inventory", { screen: "InventoryList" })
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver todos
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {lowStockInventory.length > 0 ? (
              lowStockInventory.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.lowStockItem}
                  onPress={() => {
                    navigation.navigate("Inventory", {
                      screen: "InventoryDetail",
                      params: { id: inv.id },
                    });
                  }}
                >
                  <View style={styles.lowStockInfo}>
                    <Typography variant="body" numberOfLines={1}>
                      {inv.item.description}
                    </Typography>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Qtd: {inv.quantity} | Alerta: {inv.alertLevel}
                    </Typography>
                  </View>
                  <View style={styles.lowStockBadge}>
                    <Typography
                      variant="small"
                      color={theme.colors.status.error}
                    >
                      Estoque Baixo
                    </Typography>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Typography variant="bodySecondary" style={styles.emptyText}>
                Não há itens com estoque baixo.
              </Typography>
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.s,
  },
  statsCard: {
    marginBottom: theme.spacing.s,
  },
  card: {
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: theme.spacing.s,
  },
  addButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.lightGray,
  },
  lowStockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  lowStockInfo: {
    flex: 1,
  },
  lowStockBadge: {
    backgroundColor: theme.colors.notifications.error.background,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.s,
  },
});

export default DashboardScreen;
