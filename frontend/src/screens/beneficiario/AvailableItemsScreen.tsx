// src/screens/beneficiario/AvailableItemsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  ItemCard,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  Select,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";

// Tipos e rotas
import { Item, ItemStatus, ItemType } from "../../types/items.types";
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";

const AvailableItemsScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();
  const { user } = useAuth();
  const {
    items,
    isLoading,
    error,
    fetchItems,
    fetchItemsByStatus,
    pagination,
    clearError,
  } = useItems();
  const { categories, fetchCategories } = useCategories();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Carregar itens disponíveis
  const loadAvailableItems = useCallback(
    async (page = 1) => {
      await fetchItemsByStatus(ItemStatus.DISPONIVEL, { page, take: 20 });
      await fetchCategories();
    },
    [fetchItemsByStatus, fetchCategories]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadAvailableItems();
    }, [loadAvailableItems])
  );

  // Aplicar filtros e busca aos itens
  useEffect(() => {
    if (!items) return;

    let result = [...items];

    // Aplicar filtro de tipo
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Aplicar filtro de categoria
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.categoryId === categoryFilter);
    }

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.conservationState?.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, typeFilter, categoryFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAvailableItems(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadAvailableItems(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !items.length) {
    return (
      <Loading
        visible={true}
        message="Carregando itens disponíveis..."
        overlay
      />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar itens"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadAvailableItems();
        }}
      />
    );
  }

  // Opções de filtro de tipo
  const typeOptions = [
    { label: "Todos os tipos", value: "all" },
    ...Object.entries(ItemType).map(([_, value]) => ({
      label:
        value === ItemType.ROUPA
          ? "Roupas"
          : value === ItemType.CALCADO
          ? "Calçados"
          : value === ItemType.UTENSILIO
          ? "Utensílios"
          : "Outros",
      value,
    })),
  ];

  // Opções de filtro de categoria
  const categoryOptions = [
    { label: "Todas as categorias", value: "all" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Itens Disponíveis"
        subtitle={`Olá, ${user?.name?.split(" ")[0] || "Beneficiário"}`}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar itens..."
          containerStyle={styles.searchBar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Select
              options={typeOptions}
              selectedValue={typeFilter}
              onSelect={(value) => setTypeFilter(String(value))}
              placeholder="Tipo"
              containerStyle={styles.filterSelect}
            />

            <Select
              options={categoryOptions}
              selectedValue={categoryFilter}
              onSelect={(value) => setCategoryFilter(String(value))}
              placeholder="Categoria"
              containerStyle={styles.filterSelect}
            />
          </View>
        </View>

        {/* Lista de itens disponíveis */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate(BENEFICIARIO_ROUTES.ITEM_DETAIL, {
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
              title="Nenhum item disponível"
              description={
                searchQuery || typeFilter !== "all" || categoryFilter !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Não há itens disponíveis no momento"
              }
              actionLabel="Atualizar"
              onAction={handleRefresh}
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

export default AvailableItemsScreen;
