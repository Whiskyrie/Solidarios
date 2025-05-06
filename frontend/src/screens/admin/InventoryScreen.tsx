import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AdminInventoryStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  InventoryCard,
  Select,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useInventory } from "../../hooks/useInventory";

// Tipos e rotas
import { Inventory } from "../../types/inventory.types";

// Opções de filtro
const FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Estoque Baixo", value: "low" },
  { label: "Estoque Normal", value: "normal" },
  { label: "Sem Alerta", value: "noAlert" },
];

// Opções de ordenação
const SORT_OPTIONS = [
  { label: "Recentes", value: "date_desc" },
  { label: "Antigos", value: "date_asc" },
  { label: "Quantidade ↓", value: "quantity_desc" },
  { label: "Quantidade ↑", value: "quantity_asc" },
];

const InventoryScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminInventoryStackParamList>>();
  useAuth();
  const {
    inventoryItems,
    isLoading,
    error,
    fetchInventory,
    fetchLowStock,
    pagination,
    clearError,
  } = useInventory();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);

  // Aplicar filtros e busca ao inventário
  useEffect(() => {
    if (!inventoryItems) return;

    let result = [...inventoryItems];

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.item.description.toLowerCase().includes(query) ||
          inv.location?.toLowerCase().includes(query) ||
          inv.item.category?.name.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros
    if (filter === "low") {
      result = result.filter((inv) => inv.quantity <= (inv.alertLevel || 0));
    } else if (filter === "normal") {
      result = result.filter((inv) => inv.quantity > (inv.alertLevel || 0));
    } else if (filter === "noAlert") {
      result = result.filter((inv) => !inv.alertLevel);
    }

    // Aplicar ordenação
    switch (sortBy) {
      case "date_desc":
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "date_asc":
        result.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
        break;
      case "quantity_desc":
        result.sort((a, b) => b.quantity - a.quantity);
        break;
      case "quantity_asc":
        result.sort((a, b) => a.quantity - b.quantity);
        break;
    }

    setFilteredInventory(result);
  }, [inventoryItems, searchQuery, filter, sortBy]);

  // Carregar inventário
  const loadInventory = useCallback(
    async (page = 1) => {
      if (filter === "low") {
        await fetchLowStock({ page, take: 20 });
      } else {
        await fetchInventory({ page, take: 20 });
      }
    },
    [filter, fetchInventory, fetchLowStock]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory])
  );

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInventory(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadInventory(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !inventoryItems.length) {
    return (
      <Loading visible={true} message="Carregando inventário..." overlay />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar inventário"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadInventory();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Inventário"
        subtitle={`${filteredInventory.length} itens encontrados`}
        backgroundColor={theme.colors.primary.accent}
        rightComponent={
          <Badge
            label={`${pagination?.totalItems || 0} Total`}
            variant="info"
            size="small"
          />
        }
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar no inventário..."
          containerStyle={styles.searchBar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Select
              options={FILTER_OPTIONS}
              selectedValue={filter}
              onSelect={(value) => setFilter(String(value))}
              placeholder="Filtrar por"
              containerStyle={styles.filterSelect}
            />

            <Select
              options={SORT_OPTIONS}
              selectedValue={sortBy}
              onSelect={(value) => setSortBy(String(value))}
              placeholder="Ordenar por"
              containerStyle={styles.filterSelect}
            />
          </View>
        </View>

        {/* Lista de inventário */}
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InventoryCard
              inventory={item}
              onPress={() =>
                navigation.navigate("InventoryDetail", {
                  id: item.id,
                })
              }
              onUpdatePress={() =>
                navigation.navigate("InventoryDetail", {
                  id: item.id,
                })
              }
              showActions={true}
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
              title="Nenhum item no inventário"
              description={
                searchQuery || filter !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Não há itens cadastrados no inventário."
              }
              actionLabel="Verificar itens disponíveis"
              onAction={() => navigation.navigate("InventoryList")}
            />
          }
        />
      </View>
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
    paddingHorizontal: theme.spacing.s,
  },
  searchBar: {
    marginVertical: theme.spacing.s,
  },
  filtersContainer: {
    marginBottom: theme.spacing.s,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: theme.spacing.xxs,
    marginBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.m,
  },
});

export default InventoryScreen;
