import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { DoadorDonationsStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Card,
  Button,
  ItemCard,
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
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("NewDonation");
    }
  };

  // Header melhorado seguindo padrão EditProfileScreen
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>

          <Typography
            variant="h3"
            color={theme.colors.neutral.white}
            style={styles.headerTitle}
          >
            Histórico de Doações
          </Typography>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>
    </>
  );

  // Loading Skeleton melhorado
  const HistorySkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineSmall} />
              <View style={styles.skeletonLineTiny} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );

  // Empty State melhorado
  const EmptyHistoryState = () => (
    <Card style={styles.emptyStateCard}>
      <View style={styles.emptyStateContent}>
        <MaterialIcons
          name="history"
          size={64}
          color={theme.colors.neutral.mediumGray}
        />
        <Typography variant="h4" center style={styles.emptyTitle}>
          Nenhuma doação encontrada
        </Typography>
        <Typography
          variant="bodySecondary"
          center
          style={styles.emptyDescription}
        >
          Quando você fizer doações, elas aparecerão aqui para acompanhar seu
          impacto social
        </Typography>
        <Button
          title="Fazer primeira doação"
          onPress={navigateToNewDonation}
          style={styles.emptyActionButton}
        />
      </View>
    </Card>
  );

  // Componente de estatísticas rápidas
  const QuickStats = () => {
    const totalDonations = items?.length || 0;
    const distributedItems =
      items?.filter((item) => item.status === "distribuido").length || 0;

    return (
      <Card style={styles.statsCard}>
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Typography
              variant="h3"
              color={theme.colors.primary.secondary}
              center
            >
              {totalDonations}
            </Typography>
            <Typography
              variant="caption"
              center
              color={theme.colors.neutral.darkGray}
            >
              Total de doações
            </Typography>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Typography variant="h3" color={theme.colors.status.success} center>
              {distributedItems}
            </Typography>
            <Typography
              variant="caption"
              center
              color={theme.colors.neutral.darkGray}
            >
              Itens distribuídos
            </Typography>
          </View>
        </View>
      </Card>
    );
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !items?.length) {
    return (
      <View style={styles.container}>
        <Header />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <HistorySkeleton />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ErrorState
            title="Erro ao carregar histórico"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => {
              clearError();
              loadDonationHistory();
            }}
          />
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Estatísticas rápidas */}
          {items && items.length > 0 && <QuickStats />}

          {/* Lista de doações ou estado vazio */}
          {items && items.length > 0 ? (
            <View style={styles.listContainer}>
              <Typography variant="h4" style={styles.listTitle}>
                Suas Doações
              </Typography>

              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    navigation.navigate("DonationDetail", { id: item.id })
                  }
                  style={styles.itemCard}
                  showDonor={false}
                  showCategory={true}
                />
              ))}

              {/* Botão de carregar mais */}
              {pagination && pagination.page < pagination.totalPages && (
                <Button
                  title="Carregar mais doações"
                  variant="secondary"
                  onPress={handleLoadMore}
                  style={styles.loadMoreButton}
                  loading={isLoading}
                />
              )}
            </View>
          ) : (
            <EmptyHistoryState />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
      Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: theme.spacing.m,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: theme.spacing.m,
  },
  headerRight: {
    width: 40, // Para manter simetria
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },

  // Estatísticas rápidas
  statsCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginHorizontal: theme.spacing.m,
  },

  // Lista de doações
  listContainer: {
    flex: 1,
  },
  listTitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.primary.main,
  },
  itemCard: {
    marginBottom: theme.spacing.s,
  },
  loadMoreButton: {
    marginTop: theme.spacing.m,
    marginHorizontal: theme.spacing.s,
  },

  // Skeleton loading
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    marginBottom: theme.spacing.s,
    opacity: 0.7,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.s,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginRight: theme.spacing.s,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: "80%",
  },
  skeletonLineSmall: {
    height: 12,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: "60%",
  },
  skeletonLineTiny: {
    height: 10,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    width: "40%",
  },

  // Empty state
  emptyStateCard: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  emptyStateContent: {
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  emptyDescription: {
    marginBottom: theme.spacing.l,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyActionButton: {
    paddingHorizontal: theme.spacing.l,
  },
});

export default DonationHistoryScreen;
