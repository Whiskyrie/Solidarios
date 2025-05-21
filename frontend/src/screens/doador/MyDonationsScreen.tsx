// MyDonationsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { DoadorStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  ItemCard,
  SearchBar,
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
  { label: "Todos", value: "all" },
  { label: "Disponíveis", value: ItemStatus.DISPONIVEL },
  { label: "Reservados", value: ItemStatus.RESERVADO },
  { label: "Distribuídos", value: ItemStatus.DISTRIBUIDO },
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

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Carregar doações do usuário
  const loadDonations = useCallback(
    async (page = 1) => {
      if (user) {
        try {
          console.log(
            `Carregando doações para o usuário ${user.id}, página ${page}`
          );

          // Definir um número razoável de itens por página
          const response = await fetchItemsByDonor(user.id, {
            page,
            take: 10,
            order: Order.DESC, // Mostrar mais recentes primeiro
          });

          console.log("Resposta do fetchItemsByDonor:", response);
          console.log("Estado atual de items após carregar:", items);
          console.log(
            "Estado atual de filteredItems após carregar:",
            filteredItems
          );
        } catch (error) {
          console.error("Erro ao carregar doações:", error);
        }
      }
    },
    [user, fetchItemsByDonor] // Adicionar items e filteredItems como dependências
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

      // Carregar doações - sempre começar pela página 1 ao focar na tela
      loadDonations(1);
    }, [loadDonations, fadeAnim, slideAnim])
  );

  useEffect(() => {
    console.log("useEffect de filtro - items:", items);
    console.log("useEffect de filtro - filteredItems atual:", filteredItems);

    // Se items não existir ou não for um array, não prosseguir
    if (!items || !Array.isArray(items)) {
      console.log(
        "items não é um array válido, definindo filteredItems como []"
      );
      setFilteredItems([]);
      return;
    }

    let result = [...items];
    console.log("Resultado inicial:", result);

    // Aplicar filtro de status
    if (activeFilter !== "all") {
      result = result.filter((item) => item.status === activeFilter);
      console.log("Após filtro de status:", result);
    }

    // Aplicar busca
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
      console.log("Após filtro de busca:", result);
    }

    console.log("Definindo filteredItems como:", result);
    setFilteredItems(result);
  }, [items, activeFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    clearError(); // Limpar erros anteriores
    await loadDonations(1); // Sempre carregar primeira página no refresh
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingMore || isLoading || refreshing) return;

    // Verificar se há mais páginas para carregar
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
    // Navegar para a tab NewDonation
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("NewDonation");
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (
    isLoading &&
    !refreshing &&
    (!items || !Array.isArray(items) || items.length === 0) &&
    !filteredItems.length
  ) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
          locations={[0, 0.3, 0.6]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Typography
                variant="h1"
                style={styles.welcomeText}
                color={theme.colors.primary.main}
              >
                Minhas Doações
              </Typography>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Olá, {user?.name?.split(" ")[0] || "Doador"}
              </Typography>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Buscando suas doações..." />
        </View>
      </View>
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
          locations={[0, 0.3, 0.6]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Typography
                variant="h1"
                style={styles.welcomeText}
                color={theme.colors.primary.main}
              >
                Minhas Doações
              </Typography>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Olá, {user?.name?.split(" ")[0] || "Doador"}
              </Typography>
            </View>
          </View>
        </LinearGradient>
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

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
        locations={[0, 0.3, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Cabeçalho personalizado */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.welcomeContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Typography
              variant="h1"
              style={styles.welcomeText}
              color={theme.colors.primary.main}
            >
              Minhas Doações
            </Typography>
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.darkGray}
            >
              Olá, {user?.name?.split(" ")[0] || "Doador"}
            </Typography>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa animada */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar doações..."
            containerStyle={styles.searchBar}
          />
        </Animated.View>

        {/* Filtros com animação */}
        <Animated.View
          style={[
            styles.filtersContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
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
                    colors={["#173F5F", "#006E58"]}
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
        </Animated.View>

        {/* Lista de doações com animação */}
        <Animated.View
          style={[
            styles.listContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
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
            contentContainerStyle={
              (styles.listContent,
              filteredItems.length === 0
                ? { flex: 1, justifyContent: "center" }
                : {})
            }
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
                actionLabel="Fazer uma doação"
                onAction={navigateToNewDonation}
                style={styles.emptyState}
              />
            }
          />
        </Animated.View>

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
      Platform.OS === "ios" ? 60 : 40 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.medium,
  },
  header: {
    paddingHorizontal: theme.spacing.m,
  },
  welcomeContainer: {
    marginBottom: theme.spacing.s,
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 5,
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.s,
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
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    ...theme.shadows.small,
  },
  activeFilterItem: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl + 60,
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
  emptyState: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MyDonationsScreen;
