import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { FuncionarioBeneficiariesStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  SearchBar,
  Card,
  Avatar,
  Badge,
  EmptyState,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";

// Tipos e enums
import { User, UserRole } from "../../types/users.types";

const BeneficiariesScreen: React.FC = () => {
  const navigation =
    useNavigation<
      StackNavigationProp<FuncionarioBeneficiariesStackParamList>
    >();
  useAuth();
  const { users, isLoading, error, fetchUsersByRole, pagination, clearError } =
    useUsers();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<User[]>(
    []
  );

  // Carregar beneficiários
  const loadBeneficiaries = useCallback(
    async (page = 1) => {
      await fetchUsersByRole(UserRole.BENEFICIARIO, { page, take: 20 });
    },
    [fetchUsersByRole]
  );

  // Carregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadBeneficiaries();
    }, [loadBeneficiaries])
  );

  // Aplicar filtros de busca
  useEffect(() => {
    // CORREÇÃO: Verificação robusta antes de usar spread operator
    if (!users || !Array.isArray(users)) {
      console.log("[BeneficiariesScreen] Users não é um array válido");
      setFilteredBeneficiaries([]);
      return;
    }

    try {
      // CORREÇÃO: Usar Array.from para garantir cópia segura
      let result = Array.from(users);

      // Aplicar busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (user) =>
            user?.name?.toLowerCase().includes(query) ||
            user?.email?.toLowerCase().includes(query) ||
            user?.phone?.toLowerCase().includes(query) ||
            user?.address?.toLowerCase().includes(query)
        );
      }

      setFilteredBeneficiaries(result);
    } catch (error) {
      console.error("[BeneficiariesScreen] Erro ao filtrar users:", error);
      setFilteredBeneficiaries([]);
    }
  }, [users, searchQuery]);

  // Função para pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBeneficiaries(1);
    setRefreshing(false);
  };

  // Função para carregar mais beneficiários
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadBeneficiaries(pagination.page + 1);
    }
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (isLoading && !refreshing && !users?.length) {
    return (
      <Loading visible={true} message="Carregando beneficiários..." overlay />
    );
  }

  // Se houver erro, mostrar tela de erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar beneficiários"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadBeneficiaries();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Beneficiários"
        subtitle={`${filteredBeneficiaries.length} beneficiários cadastrados`}
        backgroundColor={theme.colors.primary.secondary}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar beneficiários..."
          containerStyle={styles.searchBar}
        />

        {/* Lista de beneficiários */}
        <FlatList
          data={filteredBeneficiaries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={styles.beneficiaryCard}
              onPress={() =>
                navigation.navigate("BeneficiaryDetail", {
                  id: item.id,
                })
              }
            >
              <View style={styles.beneficiaryContainer}>
                <Avatar name={item.name} size="medium" style={styles.avatar} />
                <View style={styles.beneficiaryInfo}>
                  <Typography variant="body" style={styles.name}>
                    {item.name}
                  </Typography>
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    {item.email}
                  </Typography>
                  {item.phone && (
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      {item.phone}
                    </Typography>
                  )}
                  <Badge
                    label="Beneficiário"
                    variant="warning"
                    size="small"
                    style={styles.badge}
                  />
                </View>
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
              title="Nenhum beneficiário encontrado"
              description={
                searchQuery
                  ? "Tente ajustar sua busca"
                  : "Não há beneficiários cadastrados"
              }
              actionLabel="Atualizar"
              onAction={handleRefresh}
            />
          }
        />
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
  beneficiaryCard: {
    marginBottom: theme.spacing.s,
  },
  beneficiaryContainer: {
    flexDirection: "row",
    padding: theme.spacing.xs,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "500",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xxs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
});

export default BeneficiariesScreen;
