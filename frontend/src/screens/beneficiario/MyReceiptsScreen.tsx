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
  // CORREÇÃO: Tipagem explícita e inicialização como array
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);

  // CORREÇÃO: Função para validar se distributions é um array válido
  const validateDistributionsArray = useCallback(
    (data: any): Distribution[] => {
      // Log para debug
      console.log("[MyReceiptsScreen] Validando distributions:", {
        data,
        type: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : "N/A",
      });

      // Verificações robustas
      if (!data) {
        console.log("[MyReceiptsScreen] Data é null/undefined");
        return [];
      }

      if (Array.isArray(data)) {
        console.log(
          "[MyReceiptsScreen] Data é um array válido com",
          data.length,
          "itens"
        );
        return data;
      }

      // Se data tem uma propriedade 'data' que é array
      if (data.data && Array.isArray(data.data)) {
        console.log(
          "[MyReceiptsScreen] Data.data é um array válido com",
          data.data.length,
          "itens"
        );
        return data.data;
      }

      // Se chegou aqui, não é um formato esperado
      console.error("[MyReceiptsScreen] Formato de dados inesperado:", {
        data,
        type: typeof data,
        keys: Object.keys(data || {}),
      });

      return [];
    },
    []
  );

  // Carregar recebimentos do usuário
  const loadReceipts = useCallback(
    async (page = 1) => {
      if (user?.id) {
        console.log(
          "[MyReceiptsScreen] Carregando recebimentos para usuário:",
          user.id
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

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  // CORREÇÃO: Aplicar busca aos recebimentos com validação robusta
  useEffect(() => {
    console.log("[MyReceiptsScreen] Aplicando filtros...");

    try {
      // CORREÇÃO: Usar a função de validação
      const validDistributions = validateDistributionsArray(distributions);

      // Se não há dados válidos, definir array vazio
      if (validDistributions.length === 0) {
        console.log(
          "[MyReceiptsScreen] Nenhuma distribuição válida encontrada"
        );
        setFilteredDistributions([]);
        return;
      }

      // CORREÇÃO: Usar Array.from para garantir que temos uma cópia segura
      let result: Distribution[] = [];

      try {
        result = Array.from(validDistributions);
        console.log(
          "[MyReceiptsScreen] Array copiado com sucesso:",
          result.length,
          "itens"
        );
      } catch (copyError) {
        console.error("[MyReceiptsScreen] Erro ao copiar array:", copyError);
        setFilteredDistributions([]);
        return;
      }

      // Aplicar busca se houver query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        console.log("[MyReceiptsScreen] Aplicando busca:", query);

        try {
          // CORREÇÃO: Verificação adicional antes do filter
          if (!Array.isArray(result)) {
            console.error(
              "[MyReceiptsScreen] Result não é array antes do filter"
            );
            setFilteredDistributions([]);
            return;
          }

          result = result.filter((distribution) => {
            // CORREÇÃO: Verificação robusta do item
            if (!distribution || typeof distribution !== "object") {
              console.warn(
                "[MyReceiptsScreen] Item de distribuição inválido:",
                distribution
              );
              return false;
            }

            // Buscar nos itens da distribuição
            let hasMatchingItems = false;
            try {
              if (distribution.items && Array.isArray(distribution.items)) {
                hasMatchingItems = distribution.items.some((item: any) => {
                  return item?.description?.toLowerCase().includes(query);
                });
              }
            } catch (itemsError) {
              console.warn(
                "[MyReceiptsScreen] Erro ao buscar nos itens:",
                itemsError
              );
              hasMatchingItems = false;
            }

            // Buscar nas observações
            let hasMatchingObservations = false;
            try {
              hasMatchingObservations =
                distribution.observations?.toLowerCase().includes(query) ||
                false;
            } catch (obsError) {
              console.warn(
                "[MyReceiptsScreen] Erro ao buscar nas observações:",
                obsError
              );
              hasMatchingObservations = false;
            }

            // Buscar no ID da distribuição
            let hasMatchingId = false;
            try {
              hasMatchingId =
                distribution.id?.toLowerCase().includes(query) || false;
            } catch (idError) {
              console.warn("[MyReceiptsScreen] Erro ao buscar no ID:", idError);
              hasMatchingId = false;
            }

            return hasMatchingItems || hasMatchingObservations || hasMatchingId;
          });
        } catch (filterError) {
          console.error(
            "[MyReceiptsScreen] Erro durante o filter:",
            filterError
          );
          setFilteredDistributions([]);
          return;
        }
      }

      console.log(
        "[MyReceiptsScreen] Resultado da filtragem:",
        result.length,
        "itens"
      );
      setFilteredDistributions(result);
    } catch (error) {
      console.error(
        "[MyReceiptsScreen] Erro geral ao filtrar distributions:",
        error
      );
      setFilteredDistributions([]);
    }
  }, [distributions, searchQuery, validateDistributionsArray]);

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

  // CORREÇÃO: Validação mais robusta para loading state
  const validDistributions = validateDistributionsArray(distributions);

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && validDistributions.length === 0) {
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
          // CORREÇÃO: Garantir que sempre passamos um array válido
          data={
            Array.isArray(filteredDistributions) ? filteredDistributions : []
          }
          keyExtractor={(item, index) => {
            // CORREÇÃO: Verificação robusta da chave
            if (item && typeof item === "object" && item.id) {
              return item.id;
            }
            return `item-${index}`;
          }}
          renderItem={({ item, index }) => {
            // CORREÇÃO: Verificação robusta do item antes do render
            if (!item || typeof item !== "object") {
              console.warn(
                "[MyReceiptsScreen] Item inválido no índice",
                index,
                ":",
                item
              );
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
          // CORREÇÃO: Props para melhor performance e estabilidade
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          // CORREÇÃO: Adicionar getItemLayout se possível para melhor performance
          // getItemLayout={(data, index) => ({
          //   length: 100, // altura estimada do item
          //   offset: 100 * index,
          //   index,
          // })}
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
