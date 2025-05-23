import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  DistributionCard,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e rotas
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";

const MyReceiptsScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();
  const { user } = useAuth();
  const {
    distributions,
    isLoading,
    error,
    fetchDistributionsByBeneficiary,
    pagination,
    clearError,
  } = useDistributions();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDistributions, setFilteredDistributions] = useState<any[]>([]);

  // Carregar recebimentos do usuário
  const loadReceipts = useCallback(
    async (page = 1) => {
      if (user?.id) {
        console.log(
          "[MyReceiptsScreen] Carregando recebimentos para usuário:",
          user.id
        );
        await fetchDistributionsByBeneficiary(user.id, { page, take: 10 });
      }
    },
    [user?.id, fetchDistributionsByBeneficiary]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  // Aplicar busca aos recebimentos com validação adequada
  useEffect(() => {
    console.log(
      "[MyReceiptsScreen] Aplicando filtros. Distributions:",
      distributions
    );

    // Validação robusta para garantir que distributions é um array
    if (!distributions || !Array.isArray(distributions)) {
      console.log(
        "[MyReceiptsScreen] Distributions não é um array válido:",
        typeof distributions
      );
      setFilteredDistributions([]);
      return;
    }

    // Criar uma cópia segura do array
    let result: any[] = [];

    try {
      // Usar Array.from para garantir que temos um array válido
      result = Array.from(distributions);

      // Aplicar busca se houver query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter((distribution) => {
          if (!distribution) return false;

          // Buscar nos itens da distribuição
          const hasMatchingItems =
            distribution.items && Array.isArray(distribution.items)
              ? distribution.items.some((item: any) =>
                  item?.description?.toLowerCase().includes(query)
                )
              : false;

          // Buscar nas observações
          const hasMatchingObservations = distribution.observations
            ?.toLowerCase()
            .includes(query);

          // Buscar no ID da distribuição
          const hasMatchingId = distribution.id?.toLowerCase().includes(query);

          return hasMatchingItems || hasMatchingObservations || hasMatchingId;
        });
      }

      console.log(
        "[MyReceiptsScreen] Resultado da filtragem:",
        result.length,
        "itens"
      );
      setFilteredDistributions(result);
    } catch (error) {
      console.error("[MyReceiptsScreen] Erro ao filtrar distributions:", error);
      setFilteredDistributions([]);
    }
  }, [distributions, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    console.log("[MyReceiptsScreen] Executando refresh");
    setRefreshing(true);
    try {
      await loadReceipts(1);
    } catch (error) {
      console.error("[MyReceiptsScreen] Erro no refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages && !isLoading) {
      console.log(
        "[MyReceiptsScreen] Carregando próxima página:",
        pagination.page + 1
      );
      loadReceipts(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (
    isLoading &&
    !refreshing &&
    (!distributions || distributions.length === 0)
  ) {
    return (
      <Loading
        visible={true}
        message="Carregando seus recebimentos..."
        overlay
      />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar recebimentos"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadReceipts();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Meus Recebimentos"
        subtitle={`Olá, ${user?.name?.split(" ")[0] || "Beneficiário"}`}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar recebimentos..."
          containerStyle={styles.searchBar}
        />

        {/* Lista de recebimentos */}
        <FlatList
          data={filteredDistributions}
          keyExtractor={(item, index) => item?.id || `item-${index}`}
          renderItem={({ item }) => {
            if (!item) return null;

            return (
              <DistributionCard
                distribution={item}
                onPress={() =>
                  navigation.navigate(BENEFICIARIO_ROUTES.RECEIPT_DETAIL, {
                    id: item.id,
                  })
                }
                showItems={true}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="Nenhum recebimento encontrado"
              description={
                searchQuery && searchQuery.trim()
                  ? "Tente ajustar sua busca"
                  : "Você ainda não recebeu nenhuma doação"
              }
              actionLabel="Verificar itens disponíveis"
              onAction={() =>
                navigation.navigate(BENEFICIARIO_ROUTES.AVAILABLE_ITEMS)
              }
            />
          }
          // Adicionar props para melhor performance
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
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
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
});

export default MyReceiptsScreen;
