// MyDonationsScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  ItemCard,
  EmptyState,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Tipos e rotas
import { Item, ItemStatus } from "../../types/items.types";
import { DOADOR_ROUTES } from "../../navigation/routes";
import { Order } from "../../types/common.types";

// Filtros de status
const STATUS_FILTERS = [
  { label: "Todos", value: "all", icon: "view-list" },
  { label: "Disponíveis", value: ItemStatus.DISPONIVEL, icon: "check-circle" },
  { label: "Reservados", value: ItemStatus.RESERVADO, icon: "schedule" },
  { label: "Distribuídos", value: ItemStatus.DISTRIBUIDO, icon: "done-all" },
];

const MyDonationsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<DoadorStackParamList>>();
  const { user } = useAuth();
  const { items, isLoading, error, fetchItemsByDonor, pagination, clearError } =
    useItems();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterRotation = useRef(new Animated.Value(0)).current;

  // Carregar doações do usuário
  const loadDonations = useCallback(
    async (page = 1) => {
      if (user) {
        try {
          console.log(
            `Carregando doações para o usuário ${user.id}, página ${page}`
          );

          await fetchItemsByDonor(user.id, {
            page,
            take: 10,
            order: Order.DESC,
          });

          setDataLoaded(true);
        } catch (error) {
          console.error("Erro ao carregar doações:", error);
          setDataLoaded(true);
        }
      }
    },
    [user, fetchItemsByDonor]
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

      loadDonations(1);
    }, [loadDonations, fadeAnim, slideAnim])
  );

  // Filtragem de itens
  useEffect(() => {
    if (!items || !Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }

    let result = [...items];

    if (activeFilter !== "all") {
      result = result.filter((item) => item.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          (item.category?.name &&
            item.category.name.toLowerCase().includes(query)) ||
          (item.conservationState &&
            item.conservationState.toLowerCase().includes(query))
      );
    }

    setFilteredItems(result);
  }, [items, activeFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    clearError();
    await loadDonations(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading || refreshing) return;

    if (pagination && pagination.page < pagination.totalPages) {
      setIsLoadingMore(true);
      try {
        await loadDonations(pagination.page + 1);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Função para navegar para a tela de nova doação
  const navigateToNewDonation = () => {
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("NewDonation");
    }
  };

  // Toggle dropdown de filtros
  const toggleFilterDropdown = () => {
    const toValue = showFilterDropdown ? 0 : 1;
    Animated.timing(filterRotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowFilterDropdown(!showFilterDropdown);
  };

  // Componente de cabeçalho redesenhado
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
        {/* Seção de boas-vindas */}
        <View style={styles.welcomeSection}>
          <View>
            <Typography
              variant="h2"
              style={styles.welcomeText}
              color={theme.colors.neutral.white}
            >
              Minhas Doações
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.8)"
              style={styles.greetingText}
            >
              Olá, {user?.name?.split(" ")[0] || "Doador"}
            </Typography>
          </View>

          {/* Contador de doações */}
          <View style={styles.donationCounter}>
            <Typography
              variant="h2"
              color={theme.colors.neutral.white}
              style={styles.counterNumber}
            >
              {items?.length || 0}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              doações
            </Typography>
          </View>
        </View>

        {/* Seção integrada de busca e filtros */}
        <View style={styles.searchFilterSection}>
          <View style={styles.searchContainer}>
            {/* SearchBar customizado para melhor controle de cores */}
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
                placeholder="Buscar doações..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
                selectionColor="rgba(255,255,255,0.8)"
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Botão de filtro compacto */}
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
                {STATUS_FILTERS.find((f) => f.value === activeFilter)?.label}
              </Typography>
              <TouchableOpacity
                onPress={() => setActiveFilter("all")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name="close"
                  size={14}
                  color={theme.colors.primary.secondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dropdown de filtros */}
        {showFilterDropdown && (
          <Animated.View style={styles.filterDropdown}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterOption,
                  activeFilter === filter.value && styles.activeFilterOption,
                ]}
                onPress={() => {
                  setActiveFilter(filter.value);
                  setShowFilterDropdown(false);
                }}
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
      </LinearGradient>
    </>
  );

  // Estado de carregamento inicial
  if (isLoading && !dataLoaded && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Buscando suas doações..." />
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
            title="Erro ao carregar doações"
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
              loadDonations(1);
            }}
          />
        </View>
      </View>
    );
  }

  // Renderiza EmptyState
  const NoItemsView = () => (
    <View style={styles.emptyStateContainer}>
      <EmptyState
        title="Nenhuma doação encontrada"
        description={
          searchQuery
            ? "Tente ajustar sua busca ou filtros"
            : "Você ainda não tem doações registradas. Que tal começar agora?"
        }
        icon={
          <View style={styles.emptyStateIconContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "volunteer-activism"}
              size={80}
              color={theme.colors.primary.secondary}
            />
          </View>
        }
      />
    </View>
  );

  // UI principal
  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate(DOADOR_ROUTES.DONATION_DETAIL, {
                  id: item.id,
                })
              }
              showDonor={false}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredItems.length === 0 && styles.emptyListContent,
          ]}
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
            dataLoaded && filteredItems.length === 0 ? <NoItemsView /> : null
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Botão flutuante para nova doação */}
        <TouchableOpacity
          style={styles.floatingButtonContainer}
          onPress={navigateToNewDonation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#173F5F", "#006E58"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingButton}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.white}
              style={styles.buttonText}
            >
              Nova Doação
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
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
  donationCounter: {
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
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary.secondary,
  },
  activeFilterText: {
    marginLeft: 2,
    marginRight: 4,
    fontWeight: "600",
  },
  filterDropdown: {
    backgroundColor: theme.colors.neutral.white,
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    ...theme.shadows.medium,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
  },
  activeFilterOption: {
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
  listContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
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
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
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
  },
});

export default MyDonationsScreen;
