import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorDonationsStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  EmptyState,
  ItemCard,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { Order } from "../../types/common.types";

const DonationHistoryScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorDonationsStackParamList>>();
  const { user } = useAuth();
  const { items, isLoading, error, fetchItemsByDonor, pagination, clearError } =
    useItems();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);

  // Carregar histórico de doações
  const loadDonationHistory = useCallback(
    async (page = 1) => {
      if (user) {
        await fetchItemsByDonor(user.id, {
          page,
          take: 20,
          order: Order.DESC,
        });
      }
    },
    [user, fetchItemsByDonor]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadDonationHistory();
    }, [loadDonationHistory])
  );

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonationHistory(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadDonationHistory(pagination.page + 1);
    }
  };

  // Função para navegar para a tela de nova doação
  const navigateToNewDonation = () => {
    // Navegando para a tab NewDonation em vez da tela diretamente
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("NewDonation");
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !items?.length) {
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
          loadDonationHistory();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Histórico de Doações"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() =>
              navigation.navigate("DonationDetail", { id: item.id })
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
            title="Sem histórico de doações"
            description="Você ainda não realizou doações"
            actionLabel="Fazer uma doação"
            onAction={navigateToNewDonation}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: theme.colors.neutral.white,
  },
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
});

export default DonationHistoryScreen;
