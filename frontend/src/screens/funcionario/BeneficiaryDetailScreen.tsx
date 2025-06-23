import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { FuncionarioBeneficiariesStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
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

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  // Animação de entrada
  useEffect(() => {
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
  }, []);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadBeneficiaryData();
    }, [loadBeneficiaryData])
  );

  // Criar nova distribuição para este beneficiário
  const handleCreateDistribution = () => {
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
            Alert.alert("Simulação", `Discando para ${beneficiary.phone}`);
          },
        },
      ]
    );
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
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Typography variant="h2" color="#fff" style={styles.headerTitle}>
            Beneficiário
          </Typography>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>
    </>
  );

  // Se estiver carregando inicialmente, mostrar loading
  if (
    (isLoadingUser || isLoadingDistributions) &&
    !refreshing &&
    !beneficiary
  ) {
    return (
      <View style={styles.container}>
        <Header />
        <Loading visible={true} message="Carregando dados..." />
      </View>
    );
  }

  // Se houver erro, mostrar tela de erro
  if (userError) {
    return (
      <View style={styles.container}>
        <Header />
        <ErrorState
          title="Erro ao carregar beneficiário"
          description={userError}
          actionLabel="Tentar novamente"
          onAction={() => {
            clearUserError();
            loadBeneficiaryData();
          }}
        />
      </View>
    );
  }

  // Se o beneficiário não existir
  if (!beneficiary) {
    return (
      <View style={styles.container}>
        <Header />
        <ErrorState
          title="Beneficiário não encontrado"
          description="O beneficiário solicitado não está disponível."
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <Animated.ScrollView
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.secondary]}
            tintColor={theme.colors.primary.secondary}
          />
        }
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
              <Typography variant="h3" style={styles.beneficiaryName}>
                {beneficiary.name}
              </Typography>
              <Typography 
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
                style={styles.beneficiaryEmail}
              >
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

          {/* Informações de contato com ícones */}
          <View style={styles.contactInfo}>
            <Typography
              variant="h4"
              color={theme.colors.primary.main}
              style={styles.sectionTitle}
            >
              Informações de Contato
            </Typography>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Telefone
                </Typography>
                <Typography variant="body">
                  {beneficiary.phone || "Não informado"}
                </Typography>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.neutral.darkGray}
                >
                  Endereço
                </Typography>
                <Typography variant="body" style={styles.address}>
                  {beneficiary.address || "Não informado"}
                </Typography>
              </View>
            </View>
          </View>

          {/* Botões de ação com gradiente */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButtonContainer}
              onPress={handleCreateDistribution}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#173F5F", "#006E58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Typography
                  variant="body"
                  color={theme.colors.neutral.white}
                  style={styles.buttonText}
                >
                  Nova Distribuição
                </Typography>
              </LinearGradient>
            </TouchableOpacity>

            <Button
              title="Contatar"
              onPress={handleContactBeneficiary}
              variant="secondary"
              style={styles.secondaryButton}
              leftIcon={
                <MaterialIcons
                  name="phone"
                  size={16}
                  color={theme.colors.primary.secondary}
                />
              }
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
                <View style={styles.distributionSeparator} />
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
                      Carregar mais
                    </Typography>
                  </TouchableOpacity>
                ) : null
              }
            />
          ) : (
            <EmptyState
              title="Sem histórico"
              description="Este beneficiário ainda não recebeu nenhuma doação"
              icon={
                <View style={styles.emptyStateIconContainer}>
                  <MaterialIcons
                    name="history"
                    size={48}
                    color={theme.colors.primary.secondary}
                  />
                </View>
              }
              actionLabel="Nova Distribuição"
              onAction={handleCreateDistribution}
            />
          )}
        </Card>

        {/* Card de estatísticas do beneficiário */}
        <Card title="Estatísticas" style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.status.success}15` }]}>
                <MaterialIcons
                  name="redeem"
                  size={24}
                  color={theme.colors.status.success}
                />
              </View>
              <View style={styles.statInfo}>
                <Typography variant="h3" color={theme.colors.status.success}>
                  {distributions?.length || 0}
                </Typography>
                <Typography variant="small" color={theme.colors.neutral.darkGray}>
                  Doações recebidas
                </Typography>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary.secondary}15` }]}>
                <MaterialIcons
                  name="event"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <View style={styles.statInfo}>
                <Typography variant="h3" color={theme.colors.primary.secondary}>
                  {distributions?.length > 0 ? "Ativo" : "Novo"}
                </Typography>
                <Typography variant="small" color={theme.colors.neutral.darkGray}>
                  Status do beneficiário
                </Typography>
              </View>
            </View>
          </View>
        </Card>
      </Animated.ScrollView>
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
    ...theme.shadows.strong,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.s,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  profileInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  beneficiaryEmail: {
    marginBottom: theme.spacing.xs,
  },
  badge: {
    alignSelf: "flex-start",
  },
  contactInfo: {
    padding: theme.spacing.s,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.s,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.s,
  },
  infoContent: {
    flex: 1,
  },
  address: {
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: theme.spacing.s,
    gap: theme.spacing.s,
  },
  primaryButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.xs,
  },
  buttonText: {
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
  },
  historyCard: {
    marginBottom: theme.spacing.s,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  distributionSeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginVertical: theme.spacing.xs,
  },
  loadMoreButton: {
    padding: theme.spacing.s,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.lightGray,
    marginTop: theme.spacing.xs,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s,
  },
  statsCard: {
    marginBottom: theme.spacing.s,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: theme.spacing.s,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  statInfo: {
    alignItems: "center",
  },
});

export default BeneficiaryDetailScreen;
