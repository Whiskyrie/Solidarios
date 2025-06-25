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
import { FuncionarioItemsStackParamList } from "../../navigation/types";
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

const ItemsListScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<FuncionarioItemsStackParamList>>();
  const { user } = useAuth();
  const { items, isLoading, error, fetchItems, pagination, clearError } = useItems();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Mudança aqui
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ItemStatus | "all">("all");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterDropdownAnim = useRef(new Animated.Value(0)).current;

  // Filtros
  const filterOptions = [
    { label: "Todos", value: "all" as const },
    { label: "Disponível", value: "disponivel" as ItemStatus },
    { label: "Reservado", value: "reservado" as ItemStatus },
    { label: "Distribuído", value: "distribuido" as ItemStatus },
  ];

  // Carregar itens
  const loadItems = useCallback(
    async (page = 1) => {
      if (user) {
        try {
          await fetchItems({ page, take: 20 });
        } catch (error) {
          console.error("Erro ao carregar itens:", error);
        } finally {
          setInitialLoading(false); // Sempre marcar como carregado
        }
      }
    },
    [fetchItems, user]
  );

  // Efeito de animação ao focar na tela
  useFocusEffect(
    useCallback(() => {
      // Só mostrar loading inicial se for a primeira vez
      if (initialLoading) {
        setInitialLoading(true);
      }
      
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

      loadItems(1);
    }, [loadItems, fadeAnim, slideAnim, initialLoading])
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
    await loadItems(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading || refreshing) return;

    if (pagination && pagination.page < pagination.totalPages) {
      setIsLoadingMore(true);
      try {
        await loadItems(pagination.page + 1);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Função para navegar para novo item
  const navigateToNewItem = () => {
    navigation.navigate("CreateItem");
  };

  // Toggle filtros
  const toggleFilterDropdown = () => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    
    Animated.timing(filterDropdownAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Header com gradiente
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.welcomeSection}>
          <View>
            <Typography
              variant="h2"
              style={styles.welcomeText}
              color={theme.colors.neutral.white}
            >
              Gerenciar Itens
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.8)"
              style={styles.greetingText}
            >
              Olá, {user?.name?.split(" ")[0] || "Funcionário"}
            </Typography>
          </View>

          {/* Contador de itens */}
          <View style={styles.itemCounter}>
            <Typography
              variant="h2"
              color={theme.colors.neutral.white}
              style={styles.counterNumber}
            >
              {items?.length || 0}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              itens
            </Typography>
          </View>
        </View>

        {/* Seção integrada de busca e filtros */}
        <View style={styles.searchFilterSection}>
          <View style={styles.searchContainer}>
            {/* SearchBar customizado */}
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
                placeholder="Buscar itens..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
                selectionColor="rgba(255,255,255,0.8)"
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Botão de filtro */}
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
                style={[
                  styles.filterIndicator,
                  {
                    transform: [
                      {
                        rotate: filterDropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={16}
                  color={theme.colors.neutral.white}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Dropdown de filtros */}
          {showFilters && (
            <Animated.View
              style={[
                styles.filterDropdown,
                {
                  opacity: filterDropdownAnim,
                  transform: [
                    {
                      translateY: filterDropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterOption,
                    activeFilter === filter.value && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setActiveFilter(filter.value);
                    toggleFilterDropdown();
                  }}
                >
                  <Typography
                    variant="body"
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
    </>
  );

  // Estado de carregamento inicial
  if (initialLoading && isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Buscando itens..." />
        </View>
      </View>
    );
  }

  // Estado de erro
  if (error && !initialLoading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <ErrorState
            title="Erro ao carregar itens"
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
              setInitialLoading(true);
              loadItems(1);
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
        title="Nenhum item encontrado"
        description={
          searchQuery
            ? "Tente ajustar sua busca ou filtros"
            : "Nenhum item cadastrado no sistema ainda."
        }
        icon={
          <View style={styles.emptyStateIconContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "inventory"}
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

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate("ItemDetail", { id: item.id })}
              showDonor={true}
              showCategory={true}
            />
          )}
          contentContainerStyle={styles.listContainer}
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
              <Loading visible={true} message="Carregando mais itens..." />
            ) : null
          }
          ListEmptyComponent={
            !initialLoading && filteredItems.length === 0 ? <NoItemsView /> : null
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Botão flutuante para novo item */}
        <TouchableOpacity
          style={styles.floatingButtonContainer}
          onPress={navigateToNewItem}
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
              Novo Item
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: theme.spacing.m,
    ...theme.shadows.large,
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
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 14,
  },
  itemCounter: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minWidth: 80,
  },
  counterNumber: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 2,
  },
  searchFilterSection: {
    paddingHorizontal: theme.spacing.m,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  searchIcon: {
    marginRight: theme.spacing.s,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.neutral.white,
    fontSize: 16,
    paddingVertical: 0,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    gap: theme.spacing.xs,
  },
  filterIndicator: {
    marginLeft: 4,
  },
  filterDropdown: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 12,
    marginTop: theme.spacing.s,
    ...theme.shadows.medium,
    overflow: "hidden",
  },
  filterOption: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  filterOptionActive: {
    backgroundColor: theme.colors.primary.secondary + "10",
  },
  filterOptionText: {
    textAlign: "center",
  },
  content: {
    flex: 1,
    marginTop: -theme.spacing.s,
  },
  listContainer: {
    padding: theme.spacing.m,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorIconContainer: {
    marginBottom: theme.spacing.m,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateIconContainer: {
    marginBottom: theme.spacing.m,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: theme.spacing.l,
    right: theme.spacing.m,
    borderRadius: 28,
    overflow: "hidden",
    ...theme.shadows.strong,
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    gap: theme.spacing.s,
  },
  buttonText: {
    fontWeight: "600",
  },
});

export default ItemsListScreen;