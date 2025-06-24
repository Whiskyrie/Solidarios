import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AdminUsersStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  SearchBar,
  Select,
  EmptyState,
  Loading,
  ErrorState,
  Typography,
  Badge,
  Card,
  Button,
} from "../../components/barrelComponents";
import theme from "../../theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Hooks
import { useUsers } from "../../hooks/useUsers";

// Tipos e rotas
import { User, UserRole } from "../../types/users.types";
import { ADMIN_ROUTES } from "../../navigation/routes";
import { useAuth } from "../../hooks/useAuth";

const UsersScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminUsersStackParamList>>();
  const { users, isLoading, error, fetchUsers, pagination, clearError } =
    useUsers();
  const { logout } = useAuth();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Função de logout
  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  // Carregar usuários
  const loadUsers = useCallback(
    async (page = 1) => {
      await fetchUsers({ page, take: 20 });
    },
    [fetchUsers]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  // Aplicar filtros e busca aos usuários
  useEffect(() => {
    // CORREÇÃO: Garante que o código só continue se 'users' for um array.
    // Isso previne o erro "iterator method is not callable".
    if (!Array.isArray(users)) {
      setFilteredUsers([]); // Limpa a lista para evitar mostrar dados antigos ou incorretos.
      return; // Interrompe a execução se 'users' não for um array.
    }

    let result = [...users];

    // Aplicar filtro de tipo de usuário
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers(1);
    setRefreshing(false);
  };

  // Função para carregar mais usuários
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadUsers(pagination.page + 1);
    }
  };

  // Opções de filtro de tipo de usuário
  const roleOptions = [
    { label: "Todos os tipos", value: "all" },
    { label: "Administradores", value: UserRole.ADMIN },
    { label: "Funcionários", value: UserRole.FUNCIONARIO },
    { label: "Doadores", value: UserRole.DOADOR },
    { label: "Beneficiários", value: UserRole.BENEFICIARIO },
  ];

  if (isLoading && !refreshing) {
    return <Loading visible={true} message="Carregando usuários..." overlay />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar usuários"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadUsers();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Gerenciamento de Usuários"
        backgroundColor={theme.colors.primary.main}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar usuários..."
          containerStyle={styles.searchBar}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Select
            options={roleOptions}
            selectedValue={roleFilter}
            onSelect={(value) => setRoleFilter(String(value))}
            placeholder="Tipo de Usuário"
            containerStyle={styles.filterSelect}
          />
        </View>

        {/* Resumo dos resultados */}
        <View style={styles.resultsHeader}>
          <Typography variant="bodySecondary">
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "usuário" : "usuários"} encontrados
          </Typography>
          <Badge
            label={`Página ${pagination?.page || 1} de ${
              pagination?.totalPages || 1
            }`}
            variant="info"
            size="small"
          />
        </View>

        {/* Lista de usuários */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={styles.userCard}
              onPress={() =>
                navigation.navigate("UserDetail", {
                  id: item.id,
                })
              }
            >
              <View style={styles.userInfo}>
                <Typography variant="body" style={styles.userName}>
                  {item.name}
                </Typography>
                <Typography
                  variant="small"
                  color={theme.colors.neutral.darkGray}
                >
                  {item.email}
                </Typography>
                <Badge
                  label={
                    item.role === UserRole.ADMIN
                      ? "Administrador"
                      : item.role === UserRole.FUNCIONARIO
                      ? "Funcionário"
                      : item.role === UserRole.DOADOR
                      ? "Doador"
                      : "Beneficiário"
                  }
                  variant={
                    item.role === UserRole.ADMIN
                      ? "info"
                      : item.role === UserRole.FUNCIONARIO
                      ? "info"
                      : item.role === UserRole.DOADOR
                      ? "success"
                      : "warning"
                  }
                  size="small"
                  style={styles.roleBadge}
                />
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="Nenhum usuário encontrado"
              description={
                searchQuery || roleFilter !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Não há usuários cadastrados no sistema"
              }
              actionLabel="Cadastrar usuário"
              onAction={() =>
                navigation.navigate(ADMIN_ROUTES.CREATE_USER as any)
              }
            />
          }
          ListFooterComponent={
            /* Botão de logout no final da lista */
            <View style={styles.logoutContainer}>
              <Button
                title="Sair da conta"
                onPress={handleLogout}
                variant="secondary"
                style={styles.logoutButton}
                leftIcon={
                  <MaterialIcons
                    name="logout"
                    size={20}
                    color={theme.colors.status.error}
                  />
                }
              />
            </View>
          }
        />

        {/* Botão flutuante para novo usuário */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate(ADMIN_ROUTES.CREATE_USER as any)}
        >
          <Typography
            variant="bodySecondary"
            color={theme.colors.neutral.white}
          >
            + Novo Usuário
          </Typography>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.s,
  },
  searchBar: {
    marginVertical: theme.spacing.s,
  },
  filtersContainer: {
    marginBottom: theme.spacing.s,
  },
  filterSelect: {
    marginBottom: 0,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.s, // Reduzido o padding inferior
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  floatingButton: {
    position: "absolute",
    right: theme.spacing.m,
    bottom: theme.spacing.m,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    ...theme.shadows.medium,
  },
  userCard: {
    marginBottom: theme.spacing.s,
    padding: theme.spacing.s,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    marginBottom: theme.spacing.xxs,
  },
  roleBadge: {
    marginTop: theme.spacing.xxs,
  },
  logoutContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xl, // Espaço para não sobrepor o botão flutuante
  },
  logoutButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },
});

export default UsersScreen;
