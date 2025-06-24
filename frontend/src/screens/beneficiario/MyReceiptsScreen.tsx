import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
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
import { ItemStatus } from "../../types/items.types";

// Filtros de status dos recebimentos
const STATUS_FILTERS = [
  { label: "Todos", value: "all", icon: "inbox" },
  { label: "Recentes", value: "recent", icon: "schedule" },
  { label: "Pendentes", value: "pending", icon: "hourglass-empty" },
  { label: "Recebidos", value: "completed", icon: "check-circle" },
];

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
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterRotation = useRef(new Animated.Value(0)).current;

  // Validação de dados
  const validateDistributionsArray = useCallback(
    (data: any): Distribution[] => {
      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (
        data &&
        typeof data === "object" &&
        data.data &&
        Array.isArray(data.data)
      ) {
        return data.data;
      }

      console.warn(
        "[MyReceiptsScreen] Formato de dados inesperado, retornando array vazio"
      );
      return [];
    },
    []
  );

  const validatedDistributions = useMemo(() => {
    const result = validateDistributionsArray(distributions);
    console.log(
      "[MyReceiptsScreen] Validação executada, distribuições:",
      result.length
    );
    return result;
  }, [distributions, validateDistributionsArray]);

  const filteredDistributions = useMemo(() => {
    console.log("[MyReceiptsScreen] Aplicando filtros...");

    let result = [...validatedDistributions];

    // Aplicar filtro de status
    if (activeFilter !== "all") {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (activeFilter) {
        case "recent":
          result = result.filter((distribution) => {
            const distDate = new Date(distribution.date);
            return distDate >= lastWeek;
          });
          break;
        case "pending":
          result = result.filter((distribution) => {
            const distDate = new Date(distribution.date);
            return (
              distDate >= lastMonth &&
              !distribution.observations?.includes("concluído")
            );
          });
          break;
        case "completed":
          result = result.filter((distribution) => {
            return (
              distribution.observations?.includes("concluído") ||
              distribution.items?.some(
                (item) => item.status === ItemStatus.DISTRIBUIDO
              )
            );
          });
          break;
      }
    }

    // Aplicar busca
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      try {
        result = result.filter((distribution) => {
          if (!distribution || typeof distribution !== "object") {
            return false;
          }

          const hasMatchingItems =
            distribution.items && Array.isArray(distribution.items)
              ? distribution.items.some((item: any) =>
                  item?.description?.toLowerCase().includes(query)
                )
              : false;

          const hasMatchingObservations =
            distribution.observations?.toLowerCase().includes(query) || false;

          const hasMatchingId =
            distribution.id?.toLowerCase().includes(query) || false;

          return hasMatchingItems || hasMatchingObservations || hasMatchingId;
        });
      } catch (error) {
        console.error("[MyReceiptsScreen] Erro durante filtragem:", error);
        return [];
      }
    }

    console.log(
      "[MyReceiptsScreen] Filtragem concluída:",
      result.length,
      "itens"
    );
    return result;
  }, [validatedDistributions, searchQuery, activeFilter]);

  const loadReceipts = useCallback(
    async (page = 1) => {
      if (user?.id) {
        try {
          console.log(
            `[MyReceiptsScreen] Carregando recebimentos para usuário ${user.id}, página ${page}`
          );

          await fetchDistributionsByBeneficiary(user.id, { page, take: 10 });
          setDataLoaded(true);
        } catch (error) {
          console.error(
            "[MyReceiptsScreen] Erro ao carregar recebimentos:",
            error
          );
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

      loadReceipts(1);
    }, [loadReceipts, fadeAnim, slideAnim])
  );

  const handleRefresh = useCallback(async () => {
    console.log("[MyReceiptsScreen] Executando refresh");
    setRefreshing(true);
    clearError();
    try {
      await loadReceipts(1);
    } catch (error) {
      console.error("[MyReceiptsScreen] Erro no refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadReceipts, clearError]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || refreshing) return;

    if (pagination && pagination.page < pagination.totalPages) {
      setIsLoadingMore(true);
      try {
        await loadReceipts(pagination.page + 1);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [pagination, isLoading, loadReceipts, isLoadingMore, refreshing]);

  const handleErrorRetry = useCallback(() => {
    clearError();
    setDataLoaded(false);
    loadReceipts(1);
  }, [clearError, loadReceipts]);

  const navigateToAvailableItems = useCallback(() => {
    navigation.navigate(BENEFICIARIO_ROUTES.AVAILABLE_ITEMS);
  }, [navigation]);

  const toggleFilterDropdown = () => {
    const toValue = showFilterDropdown ? 0 : 1;
    Animated.timing(filterRotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowFilterDropdown(!showFilterDropdown);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Distribution; index: number }) => {
      if (!item || typeof item !== "object") {
        console.warn("[MyReceiptsScreen] Item inválido no índice", index);
        return null;
      }

      try {
        return (
          <View style={styles.cardContainer}>
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
              style={styles.distributionCard}
            />
          </View>
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

  const keyExtractor = useCallback((item: Distribution, index: number) => {
    if (item && typeof item === "object" && item.id) {
      return item.id;
    }
    return `item-${index}`;
  }, []);

  // Renderiza EmptyState
  const NoReceiptsView = () => (
    <View style={styles.emptyStateContainer}>
      <EmptyState
        title="Nenhum recebimento encontrado"
        description={
          searchQuery
            ? "Tente ajustar sua busca ou filtros"
            : "Você ainda não recebeu nenhuma doação. Explore os itens disponíveis!"
        }
        icon={
          <View style={styles.emptyStateIconContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "inbox"}
              size={80}
              color={theme.colors.primary.secondary}
            />
          </View>
        }
        actionLabel="Ver Itens Disponíveis"
        onAction={navigateToAvailableItems}
      />
    </View>
  );

  // Header Component
  const Header = () => (
    <LinearGradient
      colors={["#173F5F", "#006E58"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      {/* Seção de boas-vindas */}
      <View style={styles.welcomeSection}>
        <View>
          <Typography
            variant="h2"
            style={styles.welcomeText}
            color={theme.colors.neutral.white}
          >
            Meus Recebimentos
          </Typography>
          <Typography
            variant="bodySecondary"
            color="rgba(255,255,255,0.8)"
            style={styles.greetingText}
          >
            Olá, {user?.name?.split(" ")[0] || "Beneficiário"}
          </Typography>
        </View>

        {/* Contador de recebimentos */}
        <View style={styles.receiptCounter}>
          <Typography
            variant="h2"
            color={theme.colors.neutral.white}
            style={styles.counterNumber}
          >
            {validatedDistributions?.length || 0}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            recebimentos
          </Typography>
        </View>
      </View>

      {/* Seção integrada de busca e filtros */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchContainer}>
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
              placeholder="Buscar recebimentos..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.searchInput}
              selectionColor="rgba(255,255,255,0.8)"
              underlineColorAndroid="transparent"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleFilterDropdown}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="filter-list"
              size={20}
              color={theme.colors.neutral.white}
            />
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: filterRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              }}
            >
              <MaterialIcons
                name="expand-more"
                size={16}
                color={theme.colors.neutral.white}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Indicador de filtro ativo */}
        {activeFilter !== "all" && (
          <View style={styles.activeFilterIndicator}>
            <MaterialIcons
              name={
                STATUS_FILTERS.find((f) => f.value === activeFilter)?.icon ||
                "filter-list"
              }
              size={14}
              color={theme.colors.primary.secondary}
            />
            <Typography
              variant="caption"
              color={theme.colors.primary.secondary}
              style={styles.activeFilterText}
            >
              {STATUS_FILTERS.find((f) => f.value === activeFilter)?.label ||
                "Filtro ativo"}
            </Typography>
          </View>
        )}

        {/* Dropdown de filtros */}
        {showFilterDropdown && (
          <Animated.View style={styles.filterDropdown}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterOption,
                  activeFilter === filter.value && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setActiveFilter(filter.value);
                  setShowFilterDropdown(false);
                  Animated.timing(filterRotation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={filter.icon}
                  size={18}
                  color={
                    activeFilter === filter.value
                      ? theme.colors.primary.secondary
                      : theme.colors.neutral.darkGray
                  }
                />
                <Typography
                  variant="bodySecondary"
                  color={
                    activeFilter === filter.value
                      ? theme.colors.primary.secondary
                      : theme.colors.neutral.black
                  }
                  style={styles.filterOptionText}
                >
                  {filter.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />
      
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
              <Loading visible={true} message="Buscando seus recebimentos..." />
            </View>
          )}

          {/* Erro */}
          {error && (
            <ErrorState
              title="Erro ao carregar recebimentos"
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
              onAction={handleErrorRetry}
            />
          )}

          {/* Conteúdo principal */}
          {!isLoading && !error && (
            <>
              {dataLoaded && filteredDistributions.length === 0 ? (
                <ScrollView 
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <NoReceiptsView />
                </ScrollView>
              ) : (
                <FlatList
                  data={filteredDistributions}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
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
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}

          {/* Botão flutuante */}
          <TouchableOpacity
            style={styles.floatingButtonContainer}
            onPress={navigateToAvailableItems}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#173F5F", "#006E58"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingButton}
            >
              <MaterialIcons name="search" size={20} color="#fff" />
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.white}
                style={styles.buttonText}
              >
                Ver Disponíveis
              </Typography>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.strong,
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 14,
  },
  receiptCounter: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.xxs,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  counterNumber: {
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 24,
  },
  searchFilterSection: {
    paddingHorizontal: theme.spacing.m,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: theme.spacing.s,
    height: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.neutral.white,
    fontSize: 14,
    fontFamily: "System",
    padding: 0,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.s,
    height: 44,
    borderRadius: 12,
    gap: 4,
  },
  activeFilterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    marginTop: theme.spacing.s,
    alignSelf: "flex-start",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterDropdown: {
    position: "absolute",
    top: 70,
    right: 0,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 12,
    paddingVertical: theme.spacing.s,
    minWidth: 150,
    maxWidth: 200,
    ...theme.shadows.medium,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.xs,
    minHeight: 44,
  },
  filterOptionActive: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
  },
  filterOptionText: {
    flex: 1,
    color: theme.colors.neutral.black,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  animatedContent: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.m,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
    paddingBottom: theme.spacing.xl + 60,
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
  floatingButtonContainer: {
    position: "absolute",
    right: theme.spacing.m,
    bottom: theme.spacing.m,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButton: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 5,
    fontWeight: "600",
  },
});

export default MyReceiptsScreen;
