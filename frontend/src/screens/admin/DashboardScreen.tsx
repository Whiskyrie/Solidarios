
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  EmptyState,
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
  AdminTabParamList,
  AdminItemsStackParamList,
  AdminInventoryStackParamList,
  AdminDistributionsStackParamList,
  AdminUsersStackParamList,
} from "../../navigation/types";
import { Item } from "../../types/items.types";
import { Distribution } from "../../types/distributions.types";
import { User, UserRole } from "../../types/users.types";
import { Inventory } from "../../types/inventory.types";
import { StatData } from "../../components/cards/StatsCard";

// Definição do tipo de navegação composta para o Dashboard
type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "Dashboard">,
  CompositeScreenProps<
    NativeStackScreenProps<AdminItemsStackParamList>,
    CompositeScreenProps<
      NativeStackScreenProps<AdminInventoryStackParamList>,
      CompositeScreenProps<
        NativeStackScreenProps<AdminDistributionsStackParamList>,
        NativeStackScreenProps<AdminUsersStackParamList>
      >
    >
  >
>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenProps["navigation"]>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Desestruturando as funções dos hooks para usar como dependências
  const { fetchItems } = useItems();
  const { fetchLowStock } = useInventory();
  const { fetchDistributions } = useDistributions();
  const { fetchUsers } = useUsers();

  // Dados agregados para dashboard
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalDistributions: 0,
    lowStockItems: 0,
    totalUsers: 0,
    totalBeneficiaries: 0,
    totalDonors: 0,
  });

  // Dados para cards
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<Distribution[]>([]);
  const [lowStockInventory, setLowStockInventory] = useState<Inventory[]>([]);

  // Função para carregar os dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Carrega todos os dados em paralelo
      const [
        itemsResponse,
        distributionsResponse,
        usersResponse,
        lowStockResponse,
      ] = await Promise.all([
        fetchItems({ page: 1, take: 50 }),
        fetchDistributions({ page: 1, take: 10 }),
        fetchUsers({ page: 1, take: 50 }),
        fetchLowStock({ page: 1, take: 5 }),
      ]);

      // Extrai os dados e a paginação (meta) de forma segura de cada resposta
      const allItems = itemsResponse?.data || [];
      const itemsMeta = itemsResponse?.meta;

      const allDistributions = distributionsResponse?.data || [];
      const distributionsMeta = distributionsResponse?.meta;

      const allUsers = usersResponse?.data || [];
      const usersMeta = usersResponse?.meta;
      
      const allLowStock = lowStockResponse?.data || [];
      const lowStockMeta = lowStockResponse?.meta;

      // Calcula as estatísticas
      const availableItemsCount = allItems.filter(
        (item: Item) => item.status === "disponivel"
      ).length;

      const beneficiariesCount = allUsers.filter(
        (u: User) => u.role === UserRole.BENEFICIARIO
      ).length;
      
      const donorsCount = allUsers.filter(
        (u: User) => u.role === UserRole.DOADOR
      ).length;

      // Atualiza o estado com os dados corretos
      setStats({
        totalItems: itemsMeta?.itemCount ?? allItems.length,
        availableItems: availableItemsCount,
        totalDistributions: distributionsMeta?.itemCount ?? allDistributions.length,
        lowStockItems: lowStockMeta?.itemCount ?? allLowStock.length,
        totalUsers: usersMeta?.itemCount ?? allUsers.length,
        totalBeneficiaries: beneficiariesCount,
        totalDonors: donorsCount,
      });

      // Define os dados para os cards
      setRecentItems(allItems.slice(0, 3));
      setRecentDistributions(allDistributions.slice(0, 3));
      setLowStockInventory(allLowStock.slice(0, 3));

    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError(err.message || "Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchItems, fetchDistributions, fetchUsers, fetchLowStock]);

  // Carrega os dados quando a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Função para pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Renderiza o estado de carregamento
  if (loading && !refreshing) {
    return <Loading visible={true} message="Carregando dashboard..." overlay />;
  }

  // Renderiza o estado de erro
  if (error) {
    return (
      <View style={{flex: 1}}>
        <Header
            title="Dashboard"
            subtitle={`Olá, ${user?.name?.split(" ")[0] || "Administrador"}`}
        />
        <ErrorState
            title="Erro ao carregar dashboard"
            description={error}
            actionLabel="Tentar novamente"
            onAction={loadData}
        />
      </View>
    );
  }

  // Formata os dados para os cards de estatísticas
  const statsData: StatData[] = [
    { title: "Total de Itens", value: stats.totalItems, type: "number", color: theme.colors.primary.main },
    { title: "Disponíveis", value: stats.availableItems, type: "number", color: theme.colors.status.success },
    { title: "Distribuições", value: stats.totalDistributions, type: "number", color: theme.colors.primary.secondary },
    { title: "Estoque Baixo", value: stats.lowStockItems, type: "number", color: stats.lowStockItems > 0 ? theme.colors.status.warning : theme.colors.neutral.darkGray },
  ];

  const usersData: StatData[] = [
    { title: "Total de Usuários", value: stats.totalUsers, type: "number", color: theme.colors.primary.main },
    { title: "Beneficiários", value: stats.totalBeneficiaries, type: "number", color: theme.colors.status.info },
    { title: "Doadores", value: stats.totalDonors, type: "number", color: theme.colors.primary.secondary },
  ];

  // Renderiza o componente principal
  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        subtitle={`Olá, ${user?.name?.split(" ")[0] || "Administrador"}`}
        backgroundColor={theme.colors.primary.main}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <StatsCard title="Estatísticas do Sistema" stats={statsData} style={styles.statsCard} />
        <StatsCard
          title="Comunidade"
          stats={usersData}
          style={styles.statsCard}
          actionLabel="Ver todos os usuários"
          onActionPress={() => navigation.navigate("Users", { screen: "UsersList" })}
        />

        <Card
          title="Itens recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity onPress={() => navigation.navigate("Items", { screen: "ItemsList" })}>
              <Typography variant="bodySecondary" color={theme.colors.primary.secondary}>Ver todos</Typography>
            </TouchableOpacity>
          }
        >
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate("Items", { screen: "ItemDetail", params: { id: item.id } })}
                  compact
                />
              ))
            ) : ( <EmptyState title="Nenhum item recente" description="Itens cadastrados aparecerão aqui." /> )}
        </Card>

        <Card
          title="Distribuições recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity onPress={() => navigation.navigate("Distributions", { screen: "DistributionsList" })}>
              <Typography variant="bodySecondary" color={theme.colors.primary.secondary}>Ver todas</Typography>
            </TouchableOpacity>
          }
        >
            {recentDistributions.length > 0 ? (
              recentDistributions.map((distribution) => (
                <DistributionCard
                  key={distribution.id}
                  distribution={distribution}
                  onPress={() => navigation.navigate("Distributions", { screen: "DistributionDetail", params: { id: distribution.id } })}
                  compact
                  showItems={false}
                />
              ))
            ) : ( <EmptyState title="Nenhuma distribuição" description="Distribuições recentes aparecerão aqui." /> )}
        </Card>

        <Card
          title="Itens com estoque baixo"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity onPress={() => navigation.navigate("Inventory", { screen: "InventoryList" })}>
              <Typography variant="bodySecondary" color={theme.colors.primary.secondary}>Ver todos</Typography>
            </TouchableOpacity>
          }
        >
            {lowStockInventory.length > 0 ? (
              lowStockInventory.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.lowStockItem}
                  onPress={() => navigation.navigate("Inventory", { screen: "InventoryDetail", params: { id: inv.id } })}
                >
                  <View style={styles.lowStockInfo}>
                    <Typography variant="body" numberOfLines={1}>{inv.item.description}</Typography>
                    <Typography variant="small" color={theme.colors.neutral.darkGray}>Qtd: {inv.quantity} | Alerta: {inv.alertLevel}</Typography>
                  </View>
                  <View style={styles.lowStockBadge}>
                    <Typography variant="small" color={theme.colors.status.error}>Estoque Baixo</Typography>
                  </View>
                </TouchableOpacity>
              ))
            ) : ( <EmptyState title="Nenhum item em alerta" description="Itens com estoque baixo aparecerão aqui." /> )}
        </Card>
      </ScrollView>
    </View>
  );
};

// Estilos do componente
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
