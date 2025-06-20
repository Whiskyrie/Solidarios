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
  Dimensions,
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
  ItemCard,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { Order } from "../../types/common.types";

Dimensions.get("window");

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

  // Header com gradiente corrigido - REMOVIDAS AS WAVES
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={["#173F5F", "#0A4E5A", "#006E58"]}
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
              <View style={styles.glassButton}>
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.neutral.white}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.headerTitle}
              >
                Histórico de Doações
              </Typography>
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
                style={styles.headerSubtitle}
              >
                Acompanhe seu impacto social
              </Typography>
            </View>

            <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
              <View style={styles.glassButton}>
                <MaterialIcons
                  name="filter-list"
                  size={20}
                  color={theme.colors.neutral.white}
                />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </>
  );

  // Estatísticas com cores do sistema
  const EnhancedQuickStats = () => {
    const totalDonations = items?.length || 0;
    const distributedItems =
      items?.filter((item) => item.status === "distribuido").length || 0;
    const pendingItems = totalDonations - distributedItems;
    const impactPercentage =
      totalDonations > 0 ? (distributedItems / totalDonations) * 100 : 0;

    return (
      <View style={styles.statsSection}>
        {/* Card de impacto principal */}
        <Card style={styles.mainStatsCard}>
          <LinearGradient
            colors={["#173F5F", "#0A4E5A", "#006E58"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.impactGradient}
          >
            <View style={styles.impactContent}>
              <MaterialIcons name="favorite" size={32} color="white" />
              <View style={styles.impactNumbers}>
                <Typography
                  variant="h1"
                  color="white"
                  style={styles.impactValue}
                >
                  {Math.round(impactPercentage)}%
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.9)">
                  Taxa de Impacto
                </Typography>
              </View>
            </View>
          </LinearGradient>
        </Card>

        {/* Cards de estatísticas em grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View
              style={[
                styles.statContent,
                { backgroundColor: theme.colors.primary.main },
              ]}
            >
              <MaterialIcons name="redeem" size={28} color="white" />
              <Typography variant="h3" color="white" style={styles.statNumber}>
                {totalDonations}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.9)">
                Total de Doações
              </Typography>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View
              style={[
                styles.statContent,
                { backgroundColor: theme.colors.status.success },
              ]}
            >
              <MaterialIcons name="check-circle" size={28} color="white" />
              <Typography variant="h3" color="white" style={styles.statNumber}>
                {distributedItems}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.9)">
                Distribuídos
              </Typography>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View
              style={[
                styles.statContent,
                { backgroundColor: theme.colors.primary.accent },
              ]}
            >
              <MaterialIcons name="pending" size={28} color="white" />
              <Typography variant="h3" color="white" style={styles.statNumber}>
                {pendingItems}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.9)">
                Pendentes
              </Typography>
            </View>
          </Card>
        </View>
      </View>
    );
  };

  // Loading Skeleton mais sutil
  const AttractiveHistorySkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card key={item} style={styles.attractiveSkeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonImageRounded} />
            <View style={styles.skeletonContent}>
              <View
                style={[styles.skeletonLine, styles.skeletonLineAnimated]}
              />
              <View
                style={[styles.skeletonLineSmall, styles.skeletonLineAnimated]}
              />
              <View
                style={[styles.skeletonLineTiny, styles.skeletonLineAnimated]}
              />
            </View>
            <View style={styles.skeletonStatus} />
          </View>
        </Card>
      ))}
    </View>
  );

  // Empty State com gradiente corrigido
  const ModernEmptyState = () => (
    <View style={styles.modernEmptyContainer}>
      <View style={styles.modernEmptyCard}>
        {/* Container separado para o gradiente */}
        <View style={styles.emptyGradientWrapper}>
          <LinearGradient
            colors={["#173F5F", "#0A4E5A", "#006E58"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyGradient}
          >
            <View style={styles.emptyIconContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons
                  name="volunteer-activism"
                  size={48}
                  color="white"
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Conteúdo com fundo branco sólido */}
        <View style={styles.emptyContent}>
          <Typography variant="h3" center style={styles.emptyTitle}>
            Comece sua jornada solidária
          </Typography>
          <Typography
            variant="bodySecondary"
            center
            style={styles.emptyDescription}
          >
            Faça sua primeira doação e acompanhe o impacto que você está gerando
            na vida de outras pessoas
          </Typography>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={navigateToNewDonation}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#173F5F", "#0A4E5A", "#006E58"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Typography variant="button" color="white" style={styles.ctaText}>
                Fazer primeira doação
              </Typography>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Lista de doações melhorada
  const EnhancedDonationsList = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Typography variant="h4" style={styles.listTitle}>
          Suas Doações
        </Typography>
        <TouchableOpacity style={styles.sortButton}>
          <MaterialIcons
            name="sort"
            size={20}
            color={theme.colors.primary.main}
          />
          <Typography variant="caption" color={theme.colors.primary.main}>
            Ordenar
          </Typography>
        </TouchableOpacity>
      </View>

      {items?.map((item) => (
        <View key={item.id} style={styles.itemCardContainer}>
          <ItemCard
            item={item}
            onPress={() =>
              navigation.navigate("DonationDetail", { id: item.id })
            }
            style={styles.enhancedItemCard}
            showDonor={false}
            showCategory={true}
          />
        </View>
      ))}

      {/* Botão de carregar mais */}
      {pagination && pagination.page < pagination.totalPages && (
        <TouchableOpacity
          style={styles.loadMoreContainer}
          onPress={handleLoadMore}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#173F5F", "#0A4E5A", "#006E58"]}
            style={styles.loadMoreGradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="refresh" size={20} color="white" />
                <Typography
                  variant="button"
                  color="white"
                  style={styles.loadingText}
                >
                  Carregando...
                </Typography>
              </View>
            ) : (
              <Typography variant="button" color="white">
                Carregar mais doações
              </Typography>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading inicial
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
            <AttractiveHistorySkeleton />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ErrorState
            title="Ops! Algo deu errado"
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary.main}
              colors={[theme.colors.primary.main]}
            />
          }
        >
          {/* Estatísticas melhoradas */}
          {items && items.length > 0 && <EnhancedQuickStats />}

          {/* Lista de doações ou estado vazio */}
          {items && items.length > 0 ? (
            <EnhancedDonationsList />
          ) : (
            <ModernEmptyState />
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

  // Header corrigido - sem waves fragmentadas
  headerContainer: {
    position: "relative",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 0) + 30,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  filterButton: {
    width: 44,
    height: 44,
  },
  glassButton: {
    flex: 1,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: theme.spacing.m,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },

  // Layout principal
  keyboardView: {
    flex: 1,
    marginTop: -theme.spacing.m,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },

  // Estatísticas
  statsSection: {
    marginBottom: theme.spacing.l,
  },
  mainStatsCard: {
    marginBottom: theme.spacing.m,
    overflow: "hidden",
    elevation: 6,
    shadowColor: theme.colors.primary.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  impactGradient: {
    padding: theme.spacing.l,
    borderRadius: 16,
  },
  impactContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  impactNumbers: {
    alignItems: "flex-end",
  },
  impactValue: {
    fontSize: 36,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    padding: theme.spacing.m,
    alignItems: "center",
    borderRadius: 12,
    minHeight: 100,
    justifyContent: "space-between",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },

  // Lista
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  listTitle: {
    color: theme.colors.primary.main,
    fontWeight: "bold",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary.main}15`,
  },
  itemCardContainer: {
    marginBottom: theme.spacing.s,
  },
  enhancedItemCard: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderRadius: 16,
  },

  // Botão carregar mais
  loadMoreContainer: {
    marginTop: theme.spacing.l,
    borderRadius: 25,
    overflow: "hidden",
  },
  loadMoreGradient: {
    paddingVertical: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: theme.spacing.xs,
  },

  // Skeleton
  skeletonContainer: {
    flex: 1,
  },
  attractiveSkeletonCard: {
    marginBottom: theme.spacing.s,
    borderRadius: 16,
    overflow: "hidden",
    padding: theme.spacing.m,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonImageRounded: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginRight: theme.spacing.s,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 8,
    marginBottom: theme.spacing.xs,
    width: "80%",
  },
  skeletonLineSmall: {
    height: 12,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 6,
    marginBottom: theme.spacing.xs,
    width: "60%",
  },
  skeletonLineTiny: {
    height: 10,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 5,
    width: "40%",
  },
  skeletonLineAnimated: {
    opacity: 0.6,
  },
  skeletonStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral.mediumGray,
  },

  // Empty state corrigido
  modernEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: theme.spacing.l,
    minHeight: 400,
  },
  modernEmptyCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  emptyGradientWrapper: {
    height: 160,
    overflow: "hidden",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emptyGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIconContainer: {
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  emptyContent: {
    padding: theme.spacing.xl,
    alignItems: "center",
    backgroundColor: theme.colors.neutral.white,
  },
  emptyTitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.neutral.black,
    fontWeight: "bold",
  },
  emptyDescription: {
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    textAlign: "center",
    color: theme.colors.neutral.darkGray,
  },
  ctaButton: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 4,
    shadowColor: theme.colors.primary.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  ctaText: {
    marginLeft: theme.spacing.xs,
    fontWeight: "bold",
  },
});

export default DonationHistoryScreen;
