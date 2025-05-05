// src/screens/doador/MyDonationsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  ItemCard,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Tipos e rotas
import { Item, ItemStatus } from "../../types/items.types";
import { DOADOR_ROUTES } from "../../navigation/routes";

// Filtros de status
const STATUS_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Disponíveis", value: ItemStatus.DISPONIVEL },
  { label: "Reservados", value: ItemStatus.RESERVADO },
  { label: "Distribuídos", value: ItemStatus.DISTRIBUIDO },
];

const MyDonationsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<DoadorStackParamList>>();
  const { user } = useAuth();
  const { items, isLoading, error, fetchItemsByDonor, pagination, clearError } =
    useItems();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Carregar doações do usuário
  const loadDonations = useCallback(
    async (page = 1) => {
      if (user) {
        await fetchItemsByDonor(user.id, { page, take: 10 });
      }
    },
    [user, fetchItemsByDonor]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadDonations();
    }, [loadDonations])
  );

  // Aplicar filtros e busca aos itens
  useEffect(() => {
    if (!items) return;

    let result = [...items];

    // Aplicar filtro de status
    if (activeFilter !== "all") {
      result = result.filter((item) => item.status === activeFilter);
    }

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query) ||
          item.conservationState?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, activeFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonations(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadDonations(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !items.length) {
    return (
      <Loading visible={true} message="Carregando suas doações..." overlay />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar doações"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadDonations();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Minhas Doações"
        subtitle={`Olá, ${user?.name?.split(" ")[0] || "Doador"}`}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar doações..."
          containerStyle={styles.searchBar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollableFilters
            filters={STATUS_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </View>

        {/* Lista de doações */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate(DOADOR_ROUTES.DONATION_DETAIL, {
                  id: item.id,
                })
              }
              showDonor={false}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma doação encontrada"
              description={
                searchQuery
                  ? "Tente ajustar sua busca ou filtros"
                  : "Você ainda não tem doações registradas"
              }
              actionLabel="Fazer uma doação"
              onAction={() => navigation.navigate(DOADOR_ROUTES.NEW_DONATION)}
            />
          }
        />

        {/* Botão flutuante para nova doação */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate(DOADOR_ROUTES.NEW_DONATION)}
        >
          <Typography
            variant="bodySecondary"
            color={theme.colors.neutral.white}
          >
            + Nova Doação
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente de filtros horizontais com scroll
const ScrollableFilters = ({
  filters,
  activeFilter,
  onFilterChange,
}: {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}) => {
  return (
    <FlatList
      data={filters}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterItem,
            activeFilter === item.value && styles.activeFilterItem,
          ]}
          onPress={() => onFilterChange(item.value)}
        >
          <Typography
            variant="bodySecondary"
            color={
              activeFilter === item.value
                ? theme.colors.primary.secondary
                : theme.colors.neutral.darkGray
            }
          >
            {item.label}
          </Typography>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.filtersScrollContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.s,
  },
  searchBar: {
    marginVertical: theme.spacing.s,
  },
  filtersContainer: {
    marginBottom: theme.spacing.xs,
  },
  filtersScrollContent: {
    paddingVertical: theme.spacing.xs,
  },
  filterItem: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xxs,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  activeFilterItem: {
    backgroundColor: theme.colors.notifications.info.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl + 60, // Espaço extra para o botão flutuante
  },
  floatingButton: {
    position: "absolute",
    right: theme.spacing.m,
    bottom: theme.spacing.m,
    backgroundColor: theme.colors.primary.secondary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    ...theme.shadows.medium,
  },
});

export default MyDonationsScreen;
