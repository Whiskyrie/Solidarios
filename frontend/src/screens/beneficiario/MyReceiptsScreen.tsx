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
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
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
import { Item } from "react-native-paper/lib/typescript/components/Drawer/Drawer";
import { ItemStatus } from "../../types/items.types";

// Filtros de status dos recebimentos
const STATUS_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Recentes", value: "recent" },
  { label: "Pendentes", value: "pending" },
  { label: "Recebidos", value: "completed" },
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

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // CORREÇÃO 1: Mover a função de validação para fora do componente
  // para evitar recriação a cada render
  const validateDistributionsArray = useCallback(
    (data: any): Distribution[] => {
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

      console.warn(
        "[MyReceiptsScreen] Formato de dados inesperado, retornando array vazio"
      );
      return [];
    },
    []
  );

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
          // Assumindo que distribuições sem data de conclusão são pendentes
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

  // CORREÇÃO 4: useCallback para loadReceipts para evitar recriação
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
      // Iniciar animações
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

      // Carregar recebimentos
      loadReceipts(1);
    }, [loadReceipts, fadeAnim, slideAnim])
  );

  // CORREÇÃO 5: useCallback para handleRefresh
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

  // CORREÇÃO 6: useCallback para handleLoadMore
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

  // CORREÇÃO 7: useCallback para handleErrorRetry
  const handleErrorRetry = useCallback(() => {
    clearError();
    loadReceipts(1);
  }, [clearError, loadReceipts]);

  // CORREÇÃO 8: useCallback para renderItem
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

  // Ajuste do componente Header

  // Componente de cabeçalho com gradiente
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Platform.OS === 'android' ? "#4A90E2" : "transparent"}
        translucent={Platform.OS === 'ios'}
      />
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={["#4A90E2", "#7BB3F0", "#A8D0FF"]}
          locations={[0, 0.4, 0.8]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Typography
                variant="h1"
                style={styles.welcomeText}
                color={theme.colors.neutral.white}
              >
                Meus Recebimentos
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255, 255, 255, 0.9)"
              >
                Olá, {user?.name?.split(" ")[0] || "Beneficiário"}
              </Typography>
            </View>
          </View>
        </LinearGradient>
      </View>
    </>
  );

  // Estado de carregamento inicial
  if (isLoading && !dataLoaded && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={[styles.content, styles.loadingContainer]}>
          <Loading visible={true} message="Carregando seus recebimentos..." />
        </View>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
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
        </View>
      </View>
    );
  }

  // Componente EmptyState melhorado - removendo o botão duplicado
  const NoReceiptsView = () => (
    <View style={styles.emptyStateContainer}>
      <EmptyState
        title="Nenhum recebimento encontrado"
        description={
          searchQuery && searchQuery.trim()
            ? "Tente ajustar sua busca ou filtros"
            : "Você ainda não recebeu nenhuma doação. Explore os itens disponíveis!"
        }
        icon={
          <View style={styles.emptyStateIconContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "inbox"}
              size={80}
              color={theme.colors.primary.main}
            />
          </View>
        }
        // Remova o botão daqui para evitar duplicação
        // Usuários podem usar o botão flutuante
      />
    </View>
  );

  // Renderização principal
  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar recebimentos..."
            containerStyle={styles.searchBar}
          />
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
                activeOpacity={0.7}
              >
                {activeFilter === filter.value ? (
                  <LinearGradient
                    colors={["#4A90E2", "#7BB3F0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeFilterItem}
                  >
                    <Typography
                      variant="bodySecondary"
                      color={theme.colors.neutral.white}
                    >
                      {filter.label}
                    </Typography>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterItem}>
                    <Typography
                      variant="bodySecondary"
                      color={theme.colors.neutral.darkGray}
                    >
                      {filter.label}
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de recebimentos */}
        {dataLoaded && filteredDistributions.length === 0 ? (
          <NoReceiptsView />
        ) : (
          <FlatList
            data={filteredDistributions}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary.main]}
                tintColor={theme.colors.primary.main}
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
            ListEmptyComponent={NoReceiptsView}
          />
        )}

        {/* Botão flutuante para itens disponíveis */}
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            onPress={navigateToAvailableItems}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4A90E2", "#7BB3F0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingButton}
            >
              <MaterialIcons name="search" size={20} color="#fff" />
              <Typography
                variant="bodySecondary"
                style={styles.buttonText}
              >
                Ver Disponíveis
              </Typography>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  headerContainer: {
    width: '100%',
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // Garantindo que o gradiente apareça corretamente
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    paddingHorizontal: theme.spacing.m,
  },
  welcomeContainer: {
    marginBottom: theme.spacing.s,
    paddingTop: Platform.OS === "ios" ? 0 : 10,
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 5,
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.s,
    paddingTop: theme.spacing.s,
  },
  searchContainer: {
    marginTop: theme.spacing.s,
  },
  searchBar: {
    marginVertical: theme.spacing.s,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  filtersContainer: {
    marginBottom: theme.spacing.xs,
  },
  filtersScrollContent: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xxs,
  },
  filterItem: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#E0EFFF",
    ...theme.shadows.small,
  },
  activeFilterItem: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  cardContainer: {
    marginBottom: theme.spacing.s,
  },
  distributionCard: {
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl + 60,
  },
  emptyListContent: {
    flexGrow: 1,
    minHeight: 500,
    paddingTop: 100,
    justifyContent: "center",
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
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.main}15`,
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.m,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 500,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    // Adicionar padding inferior para evitar sobreposição com o botão flutuante
    paddingBottom: 100, // Aumentando o padding inferior
  },
  floatingButtonContainer: {
    position: "absolute",
    right: theme.spacing.m,
    // Mover o botão flutuante para cima para dar mais espaço
    bottom: theme.spacing.xl,
    borderRadius: 12,
    overflow: "hidden",
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#ffffff",
    fontSize: 14,
  },
});

export default MyReceiptsScreen;
