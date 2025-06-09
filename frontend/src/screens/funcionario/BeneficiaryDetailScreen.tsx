import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { FuncionarioBeneficiariesStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  Card,
  Badge,
  Avatar,
  Button,
  Divider,
  EmptyState,
  Loading,
  ErrorState,
  DistributionCard,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e rotas

// Interface para a rota
type BeneficiaryDetailScreenRouteProp = RouteProp<
  FuncionarioBeneficiariesStackParamList,
  "BeneficiaryDetail"
>;

const BeneficiaryDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<BeneficiaryDetailScreenRouteProp>();
  const { id } = route.params;
  const navigation =
    useNavigation<
      StackNavigationProp<FuncionarioBeneficiariesStackParamList>
    >();

  // Estado
  const { user: currentUser } = useAuth();
  const {
    user: beneficiary,
    isLoading: isLoadingUser,
    error: userError,
    fetchUserById,
    clearError: clearUserError,
  } = useUsers();
  const {
    distributions,
    isLoading: isLoadingDistributions,
    error: distributionsError,
    fetchDistributionsByBeneficiary,
    pagination,
    clearError: clearDistributionsError,
  } = useDistributions();

  const [refreshing, setRefreshing] = useState(false);

  // Carregar beneficiário e suas distribuições
  const loadBeneficiaryData = useCallback(async () => {
    await fetchUserById(id);
    await fetchDistributionsByBeneficiary(id, { page: 1, take: 10 });
  }, [fetchUserById, fetchDistributionsByBeneficiary, id]);

  // Carregar mais distribuições
  const handleLoadMoreDistributions = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchDistributionsByBeneficiary(id, {
        page: pagination.page + 1,
        take: 10,
      });
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBeneficiaryData();
    setRefreshing(false);
  };

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadBeneficiaryData();
    }, [loadBeneficiaryData])
  );

  // Criar nova distribuição para este beneficiário
  const handleCreateDistribution = () => {
    // Usando um tipo mais específico para a navegação entre stacks
    (navigation as any).navigate("Distributions", {
      screen: "CreateDistribution",
      params: { preselectedBeneficiaryId: id },
    });
  };

  // Contatar beneficiário
  const handleContactBeneficiary = () => {
    if (!beneficiary?.phone) {
      Alert.alert(
        "Contato indisponível",
        "Este beneficiário não possui telefone cadastrado.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Contatar beneficiário",
      `Deseja ligar para ${beneficiary.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ligar",
          onPress: () => {
            // Aqui normalmente iria uma integração com a API de telefone
            Alert.alert("Simulação", `Discando para ${beneficiary.phone}`);
          },
        },
      ]
    );
  };

  // Se estiver carregando inicialmente, mostrar loading
  if (
    (isLoadingUser || isLoadingDistributions) &&
    !refreshing &&
    !beneficiary
  ) {
    return <Loading visible={true} message="Carregando dados..." overlay />;
  }

  // Se houver erro, mostrar tela de erro
  if (userError) {
    return (
      <ErrorState
        title="Erro ao carregar beneficiário"
        description={userError}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearUserError();
          loadBeneficiaryData();
        }}
      />
    );
  }

  // Se o beneficiário não existir
  if (!beneficiary) {
    return (
      <ErrorState
        title="Beneficiário não encontrado"
        description="O beneficiário solicitado não está disponível."
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Detalhes do Beneficiário"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do perfil do beneficiário */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={beneficiary.name}
              size="large"
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Typography variant="h3">{beneficiary.name}</Typography>
              <Typography variant="bodySecondary">
                {beneficiary.email}
              </Typography>
              <Badge
                label="Beneficiário"
                variant="warning"
                size="medium"
                style={styles.badge}
              />
            </View>
          </View>

          <Divider spacing={theme.spacing.s} />

          {/* Informações de contato */}
          <View style={styles.contactInfo}>
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.darkGray}
              style={styles.sectionTitle}
            >
              Informações de contato
            </Typography>

            <View style={styles.infoRow}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Telefone:
              </Typography>
              <Typography variant="body">
                {beneficiary.phone || "Não informado"}
              </Typography>
            </View>

            <View style={styles.infoRow}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Endereço:
              </Typography>
              <Typography variant="body" style={styles.address}>
                {beneficiary.address || "Não informado"}
              </Typography>
            </View>
          </View>

          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <Button
              title="Nova Distribuição"
              onPress={handleCreateDistribution}
              style={styles.primaryButton}
            />
            <Button
              title="Contatar"
              onPress={handleContactBeneficiary}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </View>
        </Card>

        {/* Histórico de recebimentos */}
        <Card title="Histórico de Recebimentos" style={styles.historyCard}>
          {distributionsError ? (
            <ErrorState
              title="Erro ao carregar histórico"
              description={distributionsError}
              actionLabel="Tentar novamente"
              onAction={() => {
                clearDistributionsError();
                fetchDistributionsByBeneficiary(id, { page: 1, take: 10 });
              }}
            />
          ) : distributions && distributions.length > 0 ? (
            <FlatList
              data={distributions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DistributionCard
                  distribution={item}
                  onPress={() =>
                    (navigation as any).navigate("Distributions", {
                      screen: "DistributionDetail",
                      params: { id: item.id },
                    })
                  }
                  compact
                  showItems
                />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <Divider spacing={theme.spacing.xs} />
              )}
              onEndReached={handleLoadMoreDistributions}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                pagination && pagination.page < pagination.totalPages ? (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreDistributions}
                  >
                    <Typography
                      variant="bodySecondary"
                      color={theme.colors.primary.secondary}
                    >
                      Ver mais
                    </Typography>
                  </TouchableOpacity>
                ) : null
              }
            />
          ) : (
            <EmptyState
              title="Sem histórico"
              description="Este beneficiário ainda não recebeu nenhuma doação"
              actionLabel="Nova Distribuição"
              onAction={handleCreateDistribution}
            />
          )}
        </Card>

        {/* Necessidades registradas */}
        <Card title="Necessidades Registradas" style={styles.needsCard}>
          {/* Este é um exemplo - você pode implementar a funcionalidade real ou remover */}
          <EmptyState
            title="Nenhuma necessidade registrada"
            description="O beneficiário ainda não registrou suas necessidades"
          />
        </Card>
      </ScrollView>
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
  },
  contentContainer: {
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    marginBottom: theme.spacing.s,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xs,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  profileInfo: {
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
  },
  contactInfo: {
    marginTop: theme.spacing.s,
    padding: theme.spacing.xs,
  },
  sectionTitle: {
    marginBottom: theme.spacing.s,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xs,
  },
  address: {
    flex: 1,
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  primaryButton: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  historyCard: {
    marginBottom: theme.spacing.s,
  },
  needsCard: {
    marginBottom: theme.spacing.s,
  },
  loadMoreButton: {
    padding: theme.spacing.s,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.lightGray,
  },
});

export default BeneficiaryDetailScreen;
