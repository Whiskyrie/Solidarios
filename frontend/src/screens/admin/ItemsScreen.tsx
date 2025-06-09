// src/screens/admin/ItemsScreen.tsx
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
import { AdminItemsStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  ItemCard,
  SearchBar,
  Select,
  EmptyState,
  Loading,
  ErrorState,
  Typography,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";

// Tipos e rotas
import { Item, ItemStatus, ItemType } from "../../types/items.types";
import { ADMIN_ROUTES } from "../../navigation/routes";

const ItemsScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminItemsStackParamList>>();
  const { items, isLoading, error, fetchItems, pagination, clearError } =
    useItems();
  const { categories, fetchCategories } = useCategories();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Carregar itens
  const loadItems = useCallback(
    async (page = 1) => {
      await fetchItems({ page, take: 20 });
      await fetchCategories();
    },
    [fetchItems, fetchCategories]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Aplicar filtros e busca aos itens
  useEffect(() => {
    if (!items) return;

    let result = [...items];

    // Aplicar filtro de status
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

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
          item.donor?.name.toLowerCase().includes(query) ||
          item.category?.name?.toLowerCase().includes(query) ||
          item.conservationState?.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, statusFilter, typeFilter, categoryFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadItems(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !items.length) {
    return <Loading visible={true} message="Carregando itens..." overlay />;
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
          loadItems();
        }}
      />
    );
  }

  // Opções de filtro de status
  const statusOptions = [
    { label: "Todos os status", value: "all" },
    { label: "Disponíveis", value: ItemStatus.DISPONIVEL },
    { label: "Reservados", value: ItemStatus.RESERVADO },
    { label: "Distribuídos", value: ItemStatus.DISTRIBUIDO },
  ];

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
        title="Gerenciamento de Itens"
        backgroundColor={theme.colors.primary.main}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate(ADMIN_ROUTES.CREATE_ITEM as any)}
          >
            <Typography variant="small" color={theme.colors.neutral.white}>
              + Novo
            </Typography>
          </TouchableOpacity>
        }
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
              options={statusOptions}
              selectedValue={statusFilter}
              onSelect={(value) => setStatusFilter(String(value))}
              placeholder="Status"
              containerStyle={styles.filterSelect}
            />

            <Select
              options={typeOptions}
              selectedValue={typeFilter}
              onSelect={(value) => setTypeFilter(String(value))}
              placeholder="Tipo"
              containerStyle={styles.filterSelect}
            />
          </View>

          <Select
            options={categoryOptions}
            selectedValue={categoryFilter}
            onSelect={(value) => setCategoryFilter(String(value))}
            placeholder="Categoria"
            containerStyle={styles.categoryFilter}
          />
        </View>

        {/* Resumo dos resultados */}
        <View style={styles.resultsHeader}>
          <Typography variant="bodySecondary">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "itens"} encontrados
          </Typography>
          <Badge
            label={`Página ${pagination?.page || 1} de ${
              pagination?.totalPages || 1
            }`}
            variant="info"
            size="small"
          />
        </View>

        {/* Lista de itens */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate("ItemDetail", {
                  id: item.id,
                })
              }
              showDonor
              showCategory
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
              title="Nenhum item encontrado"
              description={
                searchQuery ||
                statusFilter !== "all" ||
                typeFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Não há itens cadastrados no sistema"
              }
              actionLabel="Cadastrar item"
              onAction={() =>
                navigation.navigate(ADMIN_ROUTES.CREATE_ITEM as any)
              }
            />
          }
        />

        {/* Botão flutuante para novo item */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate(ADMIN_ROUTES.CREATE_ITEM as any)}
        >
          <Typography
            variant="bodySecondary"
            color={theme.colors.neutral.white}
          >
            + Novo Item
          </Typography>
        </TouchableOpacity>
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
    marginBottom: theme.spacing.xs,
  },
  filterSelect: {
    flex: 1,
    marginRight: theme.spacing.xs,
    marginBottom: 0,
  },
  categoryFilter: {
    marginBottom: 0,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl + 60, // Espaço extra para o botão flutuante
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  floatingButton: {
    position: "absolute",
    right: theme.spacing.m,
    bottom: theme.spacing.m,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    ...theme.shadows.medium,
  },
});

export default ItemsScreen;
