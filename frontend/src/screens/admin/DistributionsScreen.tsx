import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AdminDistributionsStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  DistributionCard,
  Select,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos
import { Distribution } from "../../types/distributions.types";

// Opções de filtro
const FILTER_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Este Mês", value: "thisMonth" },
  { label: "Mês Passado", value: "lastMonth" },
];

// Opções de ordenação
const SORT_OPTIONS = [
  { label: "Recentes", value: "date_desc" },
  { label: "Antigas", value: "date_asc" },
];

const DistributionsScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminDistributionsStackParamList>>();
  useAuth();
  const {
    distributions,
    isLoading,
    error,
    fetchDistributions,
    fetchDistributionsByDateRange,
    pagination,
    clearError,
  } = useDistributions();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);

  // Aplicar filtros e busca às distribuições
  useEffect(() => {
    // CORREÇÃO: Verificação robusta antes de usar spread operator
    if (!distributions || !Array.isArray(distributions)) {
      console.log("[DistributionsScreen] Distributions não é um array válido");
      setFilteredDistributions([]);
      return;
    }

    try {
      // CORREÇÃO: Usar Array.from para garantir cópia segura
      let result = Array.from(distributions);

      // Aplicar busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (dist) =>
            dist?.beneficiary?.name?.toLowerCase().includes(query) ||
            (Array.isArray(dist?.items) &&
              dist.items.some((item) =>
                item?.description?.toLowerCase().includes(query)
              ))
        );
      }

      // Aplicar ordenação
      switch (sortBy) {
        case "date_desc":
          result.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          break;
        case "date_asc":
          result.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          break;
      }

      setFilteredDistributions(result);
    } catch (error) {
      console.error(
        "[DistributionsScreen] Erro ao filtrar distributions:",
        error
      );
      setFilteredDistributions([]);
    }
  }, [distributions, searchQuery, sortBy]);

  // Carregar distribuições
  const loadDistributions = useCallback(
    async (page = 1) => {
      if (filter === "thisMonth") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        await fetchDistributionsByDateRange(startOfMonth, endOfMonth, {
          page,
          take: 20,
        });
      } else if (filter === "lastMonth") {
        const now = new Date();
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        )
          .toISOString()
          .split("T")[0];
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split("T")[0];
        await fetchDistributionsByDateRange(startOfLastMonth, endOfLastMonth, {
          page,
          take: 20,
        });
      } else {
        await fetchDistributions({ page, take: 20 });
      }
    },
    [filter, fetchDistributions, fetchDistributionsByDateRange]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadDistributions();
    }, [loadDistributions])
  );

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDistributions(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadDistributions(pagination.page + 1);
    }
  };

  if (isLoading && !refreshing && !distributions.length) {
    return (
      <Loading visible={true} message="Carregando distribuições..." overlay />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar distribuições"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadDistributions();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Distribuições"
        subtitle={`${filteredDistributions.length} distribuições encontradas`}
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
          placeholder="Buscar distribuições..."
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

        {/* Lista de distribuições */}
        <FlatList
          data={filteredDistributions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DistributionCard
              distribution={item}
              onPress={() =>
                navigation.navigate("DistributionDetail", {
                  id: item.id,
                })
              }
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
              title="Nenhuma distribuição encontrada"
              description={
                searchQuery || filter !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Não há distribuições cadastradas."
              }
              actionLabel="Nova Distribuição"
              onAction={() => navigation.navigate("CreateDistribution")}
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

export default DistributionsScreen;
