import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { Order } from "../../types/common.types"; // Adicionar esta importação

// Componentes
import {
  Typography,
  Header,
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

const ReceiptHistoryScreen: React.FC = () => {
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

  // Carregar histórico de recebimentos
  const loadReceiptHistory = useCallback(
    async (page = 1) => {
      if (user) {
        await fetchDistributionsByBeneficiary(user.id, {
          page,
          take: 20,
          order: Order.DESC, // Removido orderBy e mantido apenas order
        });
      }
    },
    [user, fetchDistributionsByBeneficiary]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadReceiptHistory();
    }, [loadReceiptHistory])
  );

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReceiptHistory(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadReceiptHistory(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !distributions.length) {
    return <Loading visible={true} message="Carregando histórico..." overlay />;
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar histórico"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadReceiptHistory();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Histórico de Recebimentos"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Lista de recebimentos */}
        <FlatList
          data={distributions}
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
          ListHeaderComponent={
            <Typography variant="h3" style={styles.title} center>
              Seu Histórico de Recebimentos
            </Typography>
          }
          ListEmptyComponent={
            <EmptyState
              title="Sem histórico"
              description="Você ainda não recebeu nenhuma doação"
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
  },
  title: {
    marginVertical: theme.spacing.m,
  },
  listContent: {
    flexGrow: 1,
    padding: theme.spacing.m,
  },
});

export default ReceiptHistoryScreen;
