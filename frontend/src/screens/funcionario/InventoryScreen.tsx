import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Componentes
import {
  Typography,
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
import { FuncionarioInventoryStackParamList } from "../../navigation/types";
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
    useNavigation<StackNavigationProp<FuncionarioInventoryStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

  // Animações
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

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

      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, [loadInventory, fadeAnim, slideAnim])
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

  // Componente de cabeçalho seguindo padrão do funcionário
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Typography
              variant="h2"
              style={styles.headerTitle}
              color={theme.colors.neutral.white}
            >
              Inventário
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.8)"
              style={styles.headerSubtitle}
            >
              {filteredInventory.length} itens encontrados
            </Typography>
          </View>

          {/* Badge com total de itens */}
          <View style={styles.headerBadge}>
            <Typography
              variant="h3"
              color={theme.colors.neutral.white}
              style={styles.badgeNumber}
            >
              {pagination?.totalItems || 0}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Total
            </Typography>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Cards de estatísticas rápidas
  const QuickStatsCards = () => {
    const lowStockCount = filteredInventory.filter(
      (inv) => inv.quantity <= (inv.alertLevel || 0)
    ).length;
    const normalStockCount = filteredInventory.length - lowStockCount;

    return (
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.status.success, "#45B049"]}
              style={styles.statGradient}
            >
              <MaterialIcons name="check-circle" size={24} color="white" />
              <Typography variant="h3" color="white" style={styles.statNumber}>
                {normalStockCount}
              </Typography>
              <Typography variant="caption" color="white">
                Estoque Normal
              </Typography>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={
                lowStockCount > 0
                  ? [theme.colors.status.warning, "#FF8C00"]
                  : [theme.colors.neutral.darkGray, "#666"]
              }
              style={styles.statGradient}
            >
              <MaterialIcons name="warning" size={24} color="white" />
              <Typography variant="h3" color="white" style={styles.statNumber}>
                {lowStockCount}
              </Typography>
              <Typography variant="caption" color="white">
                Estoque Baixo
              </Typography>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  // Empty State personalizado
  const InventoryEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons
          name={searchQuery || filter !== "all" ? "search-off" : "inventory"}
          size={70}
          color={theme.colors.primary.secondary}
        />
      </View>
      <Typography variant="h4" center style={styles.emptyStateTitle}>
        {searchQuery || filter !== "all"
          ? "Nenhum item encontrado"
          : "Inventário vazio"}
      </Typography>
      <Typography variant="bodySecondary" center style={styles.emptyStateDescription}>
        {searchQuery || filter !== "all"
          ? "Tente ajustar sua busca ou filtros"
          : "Não há itens cadastrados no inventário"}
      </Typography>
    </View>
  );

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !inventoryItems.length) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Carregando inventário..." />
        </View>
      </View>
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <ErrorState
            title="Erro ao carregar inventário"
            description={error}
            icon={
              <View style={styles.errorIconContainer}>
                <MaterialIcons
                  name="error-outline"
                  size={70}
                  color={theme.colors.status.error}
                />
              </View>
            }
            actionLabel="Tentar novamente"
            onAction={() => {
              clearError();
              loadInventory();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Cards de estatísticas */}
        <QuickStatsCards />

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
              compact={false}
              showActions={true}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary.main}
              colors={[theme.colors.primary.main]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<InventoryEmptyState />}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 0) + 30,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.strong,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  badgeNumber: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginTop: -theme.spacing.m,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },

  // Estatísticas rápidas
  statsSection: {
    marginBottom: theme.spacing.l,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: theme.spacing.m,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "space-between",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },

  // Busca e filtros
  searchBar: {
    marginBottom: theme.spacing.s,
  },
  filtersContainer: {
    marginBottom: theme.spacing.l,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
  },

  // Lista
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.m,
  },

  // Estados de loading e erro
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.status.error}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.m,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.m,
    minHeight: 400,
  },
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.l,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.s,
    color: theme.colors.neutral.darkGray,
  },
  emptyStateDescription: {
    textAlign: "center",
    color: theme.colors.neutral.mediumGray,
    lineHeight: 20,
  },
});

export default InventoryScreen;
