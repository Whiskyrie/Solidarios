import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Componentes
import {
  Typography,
  SearchBar,
  EmptyState,
  Loading,
  ErrorState,
  UserCard,
  Select,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";

// Tipos e rotas
import { FuncionarioBeneficiariesStackParamList } from "../../navigation/types";
import { User, UserRole } from "../../types/users.types";

// Opções de filtro
const FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Recentes", value: "recent" },
];

// Opções de ordenação
const SORT_OPTIONS = [
  { label: "Nome A-Z", value: "name_asc" },
  { label: "Nome Z-A", value: "name_desc" },
  { label: "Mais recentes", value: "date_desc" },
  { label: "Mais antigos", value: "date_asc" },
];

const BeneficiariesScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<FuncionarioBeneficiariesStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    pagination,
    clearError,
  } = useUsers();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<User[]>([]);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Aplicar filtros e busca aos beneficiários
  useEffect(() => {
    if (!users) return;

    // Filtrar apenas beneficiários
    let result = users.filter(user => user.role === UserRole.BENEFICIARIO);

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (filter === "recent") {
      result = result.filter(user => new Date(user.createdAt) > lastMonth);
    }

    // Aplicar ordenação
    switch (sortBy) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date_desc":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "date_asc":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    setFilteredBeneficiaries(result);
  }, [users, searchQuery, filter, sortBy]);

  // Carregar beneficiários
  const loadBeneficiaries = useCallback(
    async (page = 1) => {
      await fetchUsers({ page, take: 20 });
    },
    [fetchUsers]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadBeneficiaries();

      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, [loadBeneficiaries, fadeAnim, slideAnim])
  );

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBeneficiaries(1);
    setRefreshing(false);
  };

  // Função para carregar mais itens
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadBeneficiaries(pagination.page + 1);
    }
  };

  // Componente de cabeçalho seguindo padrão do funcionário
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
          <View>
            <Typography
              variant="h2"
              style={styles.headerTitle}
              color={theme.colors.neutral.white}
            >
              Beneficiários
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.8)"
              style={styles.headerSubtitle}
            >
              {filteredBeneficiaries.length} beneficiários encontrados
            </Typography>
          </View>

          {/* Badge com total de beneficiários */}
          <View style={styles.headerBadge}>
            <Typography
              variant="h3"
              color={theme.colors.neutral.white}
              style={styles.badgeNumber}
            >
              {filteredBeneficiaries.length}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Total
            </Typography>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Empty State personalizado
  const BeneficiariesEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons
          name={searchQuery || filter !== "all" ? "search-off" : "people"}
          size={70}
          color={theme.colors.primary.secondary}
        />
      </View>
      <Typography variant="h4" center style={styles.emptyStateTitle}>
        {searchQuery || filter !== "all"
          ? "Nenhum beneficiário encontrado"
          : "Nenhum beneficiário cadastrado"}
      </Typography>
      <Typography variant="bodySecondary" center style={styles.emptyStateDescription}>
        {searchQuery || filter !== "all"
          ? "Tente ajustar sua busca ou filtros"
          : "Não há beneficiários cadastrados no sistema"}
      </Typography>
    </View>
  );

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !users.length) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Carregando beneficiários..." />
        </View>
      </View>
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <ErrorState
            title="Erro ao carregar beneficiários"
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
              loadBeneficiaries();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar beneficiários..."
          containerStyle={styles.searchBar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Select
              options={FILTER_OPTIONS}
              selectedValue={filter}
              onSelect={(value) => setFilter(String(value))}
              placeholder="Filtrar por"
              containerStyle={styles.filterSelect}
            />

            <Select
              options={SORT_OPTIONS}
              selectedValue={sortBy}
              onSelect={(value) => setSortBy(String(value))}
              placeholder="Ordenar por"
              containerStyle={styles.filterSelect}
            />
          </View>
        </View>

        {/* Lista de beneficiários */}
        <FlatList
          data={filteredBeneficiaries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onPress={() =>
                navigation.navigate("BeneficiaryDetail", {
                  id: item.id,
                })
              }
              showRole={false}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary.main}
              colors={[theme.colors.primary.main]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<BeneficiariesEmptyState />}
        />
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
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 0) + 30,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.strong,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  badgeNumber: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginTop: -theme.spacing.m,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },

  // Busca e filtros
  searchBar: {
    marginBottom: theme.spacing.s,
  },
  filtersContainer: {
    marginBottom: theme.spacing.l,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
  },

  // Lista
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.m,
  },

  // Estados de loading e erro
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

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.m,
    minHeight: 400,
  },
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.l,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.s,
    color: theme.colors.neutral.darkGray,
  },
  emptyStateDescription: {
    textAlign: "center",
    color: theme.colors.neutral.mediumGray,
    lineHeight: 20,
  },
});

export default BeneficiariesScreen;
