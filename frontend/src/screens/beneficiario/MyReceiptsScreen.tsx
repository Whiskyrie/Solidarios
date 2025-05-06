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
  const [filteredDistributions, setFilteredDistributions] =
    useState(distributions);

  // Carregar recebimentos do usuário
  const loadReceipts = useCallback(
    async (page = 1) => {
      if (user) {
        await fetchDistributionsByBeneficiary(user.id, { page, take: 10 });
      }
    },
    [user, fetchDistributionsByBeneficiary]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  // Aplicar busca aos recebimentos
  useEffect(() => {
    if (!distributions) return;

    let result = [...distributions];

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (distribution) =>
          distribution.items.some((item) =>
            item.description.toLowerCase().includes(query)
          ) || distribution.observations?.toLowerCase().includes(query)
      );
    }

    setFilteredDistributions(result);
  }, [distributions, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReceipts(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadReceipts(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !distributions.length) {
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DistributionCard
              distribution={item}
              onPress={() =>
                navigation.navigate(BENEFICIARIO_ROUTES.RECEIPT_DETAIL, {
                  id: item.id,
                })
              }
              showItems={true}
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
              title="Nenhum recebimento encontrado"
              description={
                searchQuery
                  ? "Tente ajustar sua busca"
                  : "Você ainda não recebeu nenhuma doação"
              }
              actionLabel="Verificar itens disponíveis"
              onAction={() =>
                navigation.navigate(BENEFICIARIO_ROUTES.AVAILABLE_ITEMS)
              }
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
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
});

export default MyReceiptsScreen;
