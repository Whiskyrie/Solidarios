import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Distribution } from "../../types/distributions.types";
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

  // CORREÇÃO 1: Mover a função de validação para fora do componente
  // para evitar recriação a cada render
  const validateDistributionsArray = useCallback(
    (data: any): Distribution[] => {
      // Log para debug (removido o log excessivo que causava poluição)
      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      // Se data tem uma propriedade 'data' que é array
      if (
        data &&
        typeof data === "object" &&
        data.data &&
        Array.isArray(data.data)
      ) {
        return data.data;
      }

      // Se chegou aqui, não é um formato esperado
      console.warn(
        "[MyReceiptsScreen] Formato de dados inesperado, retornando array vazio"
      );
      return [];
    },
    []
  ); // CORREÇÃO: Dependências vazias pois a função é pura

  // CORREÇÃO 2: useMemo para validar distributions apenas quando realmente mudar
  const validatedDistributions = useMemo(() => {
    const result = validateDistributionsArray(distributions);
    console.log(
      "[MyReceiptsScreen] Validação executada, distribuições:",
      result.length
    );
    return result;
  }, [distributions, validateDistributionsArray]);

  // CORREÇÃO 3: useMemo para filtrar distribuições apenas quando necessário
  const filteredDistributions = useMemo(() => {
    console.log("[MyReceiptsScreen] Aplicando filtros...");

    // Se não há query de busca, retornar todas as distribuições validadas
    if (!searchQuery || !searchQuery.trim()) {
      return validatedDistributions;
    }

    const query = searchQuery.toLowerCase().trim();

    try {
      const result = validatedDistributions.filter((distribution) => {
        // Verificação robusta do item
        if (!distribution || typeof distribution !== "object") {
          return false;
        }

        // Buscar nos itens da distribuição
        const hasMatchingItems =
          distribution.items && Array.isArray(distribution.items)
            ? distribution.items.some((item: any) =>
                item?.description?.toLowerCase().includes(query)
              )
            : false;

        // Buscar nas observações
        const hasMatchingObservations =
          distribution.observations?.toLowerCase().includes(query) || false;

        // Buscar no ID da distribuição
        const hasMatchingId =
          distribution.id?.toLowerCase().includes(query) || false;

        return hasMatchingItems || hasMatchingObservations || hasMatchingId;
      });

      console.log(
        "[MyReceiptsScreen] Filtragem concluída:",
        result.length,
        "itens"
      );
      return result;
    } catch (error) {
      console.error("[MyReceiptsScreen] Erro durante filtragem:", error);
      return [];
    }
  }, [validatedDistributions, searchQuery]); // CORREÇÃO: Dependências específicas

  // CORREÇÃO 4: useCallback para loadReceipts para evitar recriação
  const loadReceipts = useCallback(
    async (page = 1) => {
      if (user?.id) {
        console.log(
          "[MyReceiptsScreen] Carregando recebimentos para usuário:",
          user.id,
          "página:",
          page
        );
        try {
          await fetchDistributionsByBeneficiary(user.id, { page, take: 10 });
        } catch (error) {
          console.error(
            "[MyReceiptsScreen] Erro ao carregar recebimentos:",
            error
          );
        }
      }
    },
    [user?.id, fetchDistributionsByBeneficiary]
  );

  // CORREÇÃO 5: useCallback para handleRefresh
  const handleRefresh = useCallback(async () => {
    console.log("[MyReceiptsScreen] Executando refresh");
    setRefreshing(true);
    try {
      await loadReceipts(1);
    } catch (error) {
      console.error("[MyReceiptsScreen] Erro no refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadReceipts]);

  // CORREÇÃO 6: useCallback para handleLoadMore
  const handleLoadMore = useCallback(() => {
    if (pagination && pagination.page < pagination.totalPages && !isLoading) {
      console.log(
        "[MyReceiptsScreen] Carregando próxima página:",
        pagination.page + 1
      );
      loadReceipts(pagination.page + 1);
    }
  }, [pagination, isLoading, loadReceipts]);

  // CORREÇÃO 7: useCallback para handleErrorRetry
  const handleErrorRetry = useCallback(() => {
    clearError();
    loadReceipts();
  }, [clearError, loadReceipts]);

  // CORREÇÃO 8: useCallback para renderItem
  const renderItem = useCallback(
    ({ item, index }: { item: Distribution; index: number }) => {
      // Verificação robusta do item antes do render
      if (!item || typeof item !== "object") {
        console.warn("[MyReceiptsScreen] Item inválido no índice", index);
        return null;
      }

      try {
        return (
          <DistributionCard
            distribution={item}
            onPress={() => {
              if (item.id) {
                navigation.navigate(BENEFICIARIO_ROUTES.RECEIPT_DETAIL, {
                  id: item.id,
                });
              }
            }}
            showItems={true}
          />
        );
      } catch (renderError) {
        console.error(
          "[MyReceiptsScreen] Erro ao renderizar item:",
          renderError
        );
        return null;
      }
    },
    [navigation]
  );

  // CORREÇÃO 9: useCallback para keyExtractor
  const keyExtractor = useCallback((item: Distribution, index: number) => {
    if (item && typeof item === "object" && item.id) {
      return item.id;
    }
    return `item-${index}`;
  }, []);

  // CORREÇÃO 10: useCallback para navegação para itens disponíveis
  const navigateToAvailableItems = useCallback(() => {
    navigation.navigate(BENEFICIARIO_ROUTES.AVAILABLE_ITEMS);
  }, [navigation]);

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  // CORREÇÃO 11: Remover o useEffect problemático que causava o loop
  // A lógica de filtragem agora está no useMemo acima

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && validatedDistributions.length === 0) {
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
        onAction={handleErrorRetry}
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
          keyExtractor={keyExtractor}
          renderItem={renderItem}
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
              onAction={navigateToAvailableItems}
            />
          }
          // Props para melhor performance
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
