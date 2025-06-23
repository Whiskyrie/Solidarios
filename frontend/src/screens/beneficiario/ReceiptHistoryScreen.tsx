import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Loading,
  ErrorState,
  DistributionCard,
  EmptyState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e utilitários
import { Distribution } from "../../types/distributions.types";
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";
// Enum Order adicionado localmente 
export enum Order {
  ASC = "ASC",
  DESC = "DESC",
}

const ReceiptHistoryScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Validação de dados
  const validateDistributionsArray = useCallback((data: any): Distribution[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    console.warn("[ReceiptHistoryScreen] Formato de dados inesperado");
    return [];
  }, []);

  const validatedDistributions = validateDistributionsArray(distributions);

  // Filtrar por busca
  const filteredDistributions = React.useMemo(() => {
    if (!searchQuery.trim()) return validatedDistributions;

    const query = searchQuery.toLowerCase().trim();
    return validatedDistributions.filter((distribution) => {
      const hasMatchingItems = distribution.items?.some((item: any) =>
        item?.description?.toLowerCase().includes(query)
      );
      const hasMatchingObservations = distribution.observations
        ?.toLowerCase()
        .includes(query);
      const hasMatchingId = distribution.id?.toLowerCase().includes(query);

      return hasMatchingItems || hasMatchingObservations || hasMatchingId;
    });
  }, [validatedDistributions, searchQuery]);

  // Carregar histórico de recebimentos
  const loadReceiptHistory = useCallback(
    async (page = 1) => {
      if (user?.id) {
        try {
          await fetchDistributionsByBeneficiary(user.id, {
            page,
            take: 20,
            order: Order.DESC,
          });
          setDataLoaded(true);
        } catch (error) {
          console.error("[ReceiptHistoryScreen] Erro ao carregar:", error);
          setDataLoaded(true);
        }
      }
    },
    [user?.id, fetchDistributionsByBeneficiary]
  );

  // Efeito de animação ao focar na tela
  useFocusEffect(
    useCallback(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

      loadReceiptHistory(1);
    }, [loadReceiptHistory, fadeAnim, slideAnim])
  );

  // Função para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    try {
      await loadReceiptHistory(1);
    } finally {
      setRefreshing(false);
    }
  }, [loadReceiptHistory, clearError]);

  // Função para carregar mais itens
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading || refreshing) return;

    if (pagination && pagination.page < pagination.totalPages) {
      setIsLoadingMore(true);
      loadReceiptHistory(pagination.page + 1).finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [pagination, isLoading, loadReceiptHistory, isLoadingMore, refreshing]);

  // Renderizar item da lista
  const renderItem = useCallback(
    ({ item }: { item: Distribution }) => (
      <View style={styles.cardContainer}>
        <DistributionCard
          distribution={item}
          onPress={() =>
            navigation.navigate(BENEFICIARIO_ROUTES.RECEIPT_DETAIL, {
              id: item.id,
            })
          }
          showItems={true}
          style={styles.distributionCard}
        />
      </View>
    ),
    [navigation]
  );

  const keyExtractor = useCallback(
    (item: Distribution) => item.id,
    []
  );

  // Componente de Header com gradiente
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
          {/* Botão de voltar e título */}
          <View style={styles.headerTop}>
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

            <View style={styles.headerTitleContainer}>
              <Typography
                variant="h2"
                color={theme.colors.neutral.white}
                style={styles.headerTitle}
              >
                Histórico Completo
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.headerSubtitle}
              >
                Todos os seus recebimentos
              </Typography>
            </View>

            {/* Contador de recebimentos */}
            <View style={styles.receiptCounter}>
              <Typography
                variant="h2"
                color={theme.colors.neutral.white}
                style={styles.counterNumber}
              >
                {validatedDistributions.length}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                registros
              </Typography>
            </View>
          </View>

          {/* Barra de busca */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={20}
                color="rgba(255,255,255,0.6)"
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar no histórico..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
                selectionColor="rgba(255,255,255,0.8)"
                underlineColorAndroid="transparent"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="close"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Componente EmptyState
  const NoHistoryView = () => (
    <View style={styles.emptyStateContainer}>
      <EmptyState
        title="Nenhum histórico encontrado"
        description={
          searchQuery
            ? "Tente ajustar sua busca"
            : "Você ainda não possui histórico de recebimentos"
        }
        icon={
          <View style={styles.emptyStateIconContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "history"}
              size={80}
              color={theme.colors.primary.secondary}
            />
          </View>
        }
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    </View>
  );

  // Renderização principal
  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Loading inicial */}
          {isLoading && !dataLoaded && !refreshing && (
            <View style={styles.loadingContainer}>
              <Loading visible={true} message="Carregando histórico..." />
            </View>
          )}

          {/* Erro */}
          {error && (
            <ErrorState
              title="Erro ao carregar histórico"
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
                setDataLoaded(false);
                loadReceiptHistory(1);
              }}
            />
          )}

          {/* Conteúdo principal - SEMPRE renderizar o FlatList */}
          {!isLoading && !error && (
            <FlatList
              data={filteredDistributions}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.listContent,
                // Se não há dados, permitir scroll com padding extra
                dataLoaded && filteredDistributions.length === 0 && {
                  flexGrow: 1,
                  paddingTop: theme.spacing.xl,
                }
              ]}
              style={styles.flatList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary.secondary]}
                  tintColor={theme.colors.primary.secondary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <Loading visible size="small" message="Carregando mais..." />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                dataLoaded ? (
                  <View style={styles.emptyStateContainer}>
                    <EmptyState
                      title="Nenhum histórico encontrado"
                      description={
                        searchQuery
                          ? "Tente ajustar sua busca"
                          : "Você ainda não possui histórico de recebimentos"
                      }
                      icon={
                        <View style={styles.emptyStateIconContainer}>
                          <MaterialIcons
                            name={searchQuery ? "search-off" : "history"}
                            size={80}
                            color={theme.colors.primary.secondary}
                          />
                        </View>
                      }
                      actionLabel="Voltar"
                      onAction={() => navigation.goBack()}
                    />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.strong,
  },
  headerContent: {
    paddingHorizontal: theme.spacing.m,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  receiptCounter: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  counterNumber: {
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 22,
  },
  searchSection: {
    marginTop: theme.spacing.xs,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.neutral.white,
    fontSize: 16,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  animatedContent: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
    paddingBottom: theme.spacing.xl,
  },
  cardContainer: {
    marginBottom: theme.spacing.s,
  },
  distributionCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.white,
    marginHorizontal: theme.spacing.xxs,
    ...theme.shadows.medium,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.m,
  },
  loadingMoreContainer: {
    paddingVertical: theme.spacing.m,
    alignItems: "center",
  },
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
});

export default ReceiptHistoryScreen;
