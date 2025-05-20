// src/screens/doador/MyDonationsScreen.tsx
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

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Carregar doações do usuário
  const loadDonations = useCallback(
    async (page = 1) => {
      if (user) {
        await fetchItemsByDonor(user.id, { page, take: 10 });
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

      loadDonations();
    }, [loadDonations])
  );

  // Aplicar filtros e busca aos itens
  useEffect(() => {
    if (!items) return;

    let result = [...items];

    // Aplicar filtro de status
    if (activeFilter !== "all") {
      result = result.filter((item) => item.status === activeFilter);
    }

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query) ||
          item.conservationState?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, activeFilter, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonations(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadDonations(pagination.page + 1);
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
  if (isLoading && !refreshing && !items.length) {
    return (
      <Loading visible={true} message="Carregando suas doações..." overlay />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar doações"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadDonations();
        }}
      />
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
            contentContainerStyle={styles.listContent}
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
            ListEmptyComponent={
              <EmptyState
                title="Nenhuma doação encontrada"
                description={
                  searchQuery
                    ? "Tente ajustar sua busca ou filtros"
                    : "Você ainda não tem doações registradas"
                }
                actionLabel="Fazer uma doação"
                onAction={navigateToNewDonation}
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

export default MyDonationsScreen;
