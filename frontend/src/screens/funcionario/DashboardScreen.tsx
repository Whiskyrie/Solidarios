import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Componentes
import {
  Typography,
  Card,
  ItemCard,
  DistributionCard,
  Loading,
  ErrorState,
  EmptyState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { useInventory } from "../../hooks/useInventory";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e rotas
import {
  FuncionarioTabParamList,
  FuncionarioItemsStackParamList,
  FuncionarioInventoryStackParamList,
  FuncionarioDistributionsStackParamList,
} from "../../navigation/types";
import { Item } from "../../types/items.types";
import { Distribution } from "../../types/distributions.types";
import { Inventory } from "../../types/inventory.types";

// Definição do tipo de navegação composta para o Dashboard
type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<FuncionarioTabParamList, "Dashboard">,
  CompositeScreenProps<
    NativeStackScreenProps<FuncionarioItemsStackParamList>,
    CompositeScreenProps<
      NativeStackScreenProps<FuncionarioInventoryStackParamList>,
      NativeStackScreenProps<FuncionarioDistributionsStackParamList>
    >
  >
>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenProps["navigation"]>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Hooks para dados
  const itemsHook = useItems();
  const inventoryHook = useInventory();
  const distributionsHook = useDistributions();

  // Dados agregados para dashboard
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalDistributions: 0,
    lowStockItems: 0,
  });

  // Dados para cards
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<
    Distribution[]
  >([]);
  const [lowStockInventory, setLowStockInventory] = useState<Inventory[]>([]);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dados simulados para demonstração
      setStats({
        totalItems: 25,
        availableItems: 18,
        totalDistributions: 12,
        lowStockItems: 3,
      });

      setRecentItems([]);
      setRecentDistributions([]);
      setLowStockInventory([]);

    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError(
        "Não foi possível carregar os dados do dashboard. Tente novamente."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados ao montar componente
  useEffect(() => {
    loadData();

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
  }, []);

  // Função para pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Componente de cabeçalho seguindo padrão do doador
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
        <View style={styles.welcomeSection}>
          <View>
            <Typography
              variant="h2"
              style={styles.welcomeText}
              color={theme.colors.neutral.white}
            >
              Dashboard
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.8)"
              style={styles.greetingText}
            >
              Olá, {user?.name?.split(" ")[0] || "Funcionário"}
            </Typography>
          </View>

          {/* Contador de sistema ativo - seguindo padrão das doações */}
          <View style={styles.systemIndicator}>
            <Typography
              variant="h2"
              color={theme.colors.neutral.white}
              style={styles.counterNumber}
            >
              {stats.totalItems}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              itens cadastrados
            </Typography>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Cards de estatísticas melhoradas seguindo padrão do doador
  const EnhancedStatsCards = () => (
    <View style={styles.statsSection}>
      {/* Card de estatísticas principal */}
      <Card style={styles.mainStatsCard}>
        <LinearGradient
          colors={["#173F5F", "#0A4E5A", "#006E58"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 2 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsContent}>
            <MaterialIcons name="assessment" size={34} color="white" />
            <View style={styles.statsNumbers}>
              <Typography
                variant="h1"
                color="white"
                style={styles.statsValue}
              >
                {stats.totalItems}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.9)">
                Total de Itens
              </Typography>
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Cards de estatísticas em coluna vertical */}
      <View style={styles.statsColumn}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statContent,
              { backgroundColor: theme.colors.status.success },
            ]}
          >
            <MaterialIcons name="check-circle" size={28} color="white" />
            <Typography variant="h3" color="white" style={styles.statNumber}>
              {stats.availableItems}
            </Typography>
            <Typography variant="caption" color="white">
              Disponíveis
            </Typography>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statContent,
              { backgroundColor: theme.colors.primary.secondary },
            ]}
          >
            <MaterialIcons name="local-shipping" size={28} color="white" />
            <Typography variant="h3" color="white" style={styles.statNumber}>
              {stats.totalDistributions}
            </Typography>
            <Typography variant="caption" color="white">
              Distribuições
            </Typography>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statContent,
              { backgroundColor: stats.lowStockItems > 0 
                  ? theme.colors.status.warning 
                  : theme.colors.neutral.darkGray },
            ]}
          >
            <MaterialIcons name="warning" size={28} color="white" />
            <Typography variant="h3" color="white" style={styles.statNumber}>
              {stats.lowStockItems}
            </Typography>
            <Typography variant="caption" color="white">
              Estoque Baixo
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );

  // Empty State para itens recentes
  const RecentItemsEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons
          name="inventory"
          size={50}
          color={theme.colors.primary.secondary}
        />
      </View>
      <Typography variant="h4" center style={styles.emptyStateTitle}>
        Nenhum item cadastrado
      </Typography>
      <Typography variant="bodySecondary" center style={styles.emptyStateDescription}>
        Comece cadastrando o primeiro item no sistema
      </Typography>
    </View>
  );

  // Empty State para distribuições recentes
  const RecentDistributionsEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons
          name="local-shipping"
          size={50}
          color={theme.colors.primary.secondary}
        />
      </View>
      <Typography variant="h4" center style={styles.emptyStateTitle}>
        Nenhuma distribuição
      </Typography>
      <Typography variant="bodySecondary" center style={styles.emptyStateDescription}>
        Ainda não há distribuições realizadas
      </Typography>
    </View>
  );

  // Renderizar loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Carregando dashboard..." />
        </View>
      </View>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <ErrorState
            title="Erro ao carregar dashboard"
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
            onAction={loadData}
          />
        </View>
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
            tintColor={theme.colors.primary.main}
            colors={[theme.colors.primary.main]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estatísticas melhoradas */}
        <EnhancedStatsCards />

        {/* Itens recentes */}
        <Card
          title="Itens Recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Items", { screen: "ItemsList" })
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver todos
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {recentItems.length > 0 ? (
              recentItems.map((item, index) => (
                <View key={item.id}>
                  <ItemCard
                    item={item}
                    onPress={() => {
                      navigation.navigate("Items", {
                        screen: "ItemDetail",
                        params: { id: item.id },
                      });
                    }}
                    compact
                    showDonor={false}
                  />
                  {index < recentItems.length - 1 && (
                    <View style={styles.itemSeparator} />
                  )}
                </View>
              ))
            ) : (
              <RecentItemsEmptyState />
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                navigation.navigate("Items", {
                  screen: "CreateItem",
                });
              }}
            >
              <LinearGradient
                colors={["#173F5F", "#006E58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <MaterialIcons name="add" size={16} color="white" />
                <Typography variant="bodySecondary" color="white">
                  Adicionar novo item
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Distribuições recentes */}
        <Card
          title="Distribuições Recentes"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("DistributionsList")
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver todos
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {recentDistributions.length > 0 ? (
              recentDistributions.map((distribution, index) => (
                <View key={distribution.id}>
                  <DistributionCard
                    distribution={distribution}
                    onPress={() => {
                      navigation.navigate("DistributionDetail", {
                        id: distribution.id,
                      });
                    }}
                    compact
                    showItems={false}
                  />
                  {index < recentDistributions.length - 1 && (
                    <View style={styles.itemSeparator} />
                  )}
                </View>
              ))
            ) : (
              <RecentDistributionsEmptyState />
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                navigation.navigate("CreateDistribution");
              }}
            >
              <LinearGradient
                colors={["#173F5F", "#006E58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <MaterialIcons name="add" size={16} color="white" />
                <Typography variant="bodySecondary" color="white">
                  Criar nova distribuição
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Opções de Acesso Rápido */}
        <Card
          title="Acesso Rápido"
          style={styles.card}
        >
          <View style={styles.quickAccessContainer}>
            {/* Opção Inventário */}
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() =>
                navigation.navigate("InventoryList")
              }
            >
              <View style={styles.quickAccessIcon}>
                <LinearGradient
                  colors={[theme.colors.primary.secondary, "#4ECDC4"]}
                  style={styles.quickAccessGradient}
                >
                  <MaterialIcons name="inventory" size={24} color="white" />
                </LinearGradient>
              </View>
              <Typography variant="body" style={styles.quickAccessText}>
                Inventário
              </Typography>
              <MaterialIcons 
                name="arrow-forward-ios" 
                size={16} 
                color={theme.colors.neutral.mediumGray} 
              />
            </TouchableOpacity>

            <View style={styles.quickAccessSeparator} />

            {/* Opção Distribuições */}
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() =>
                navigation.navigate("DistributionsList")
              }
            >
              <View style={styles.quickAccessIcon}>
                <LinearGradient
                  colors={[theme.colors.primary.main, "#2E8B9A"]}
                  style={styles.quickAccessGradient}
                >
                  <MaterialIcons name="local-shipping" size={24} color="white" />
                </LinearGradient>
              </View>
              <Typography variant="body" style={styles.quickAccessText}>
                Distribuições
              </Typography>
              <MaterialIcons 
                name="arrow-forward-ios" 
                size={16} 
                color={theme.colors.neutral.mediumGray} 
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Itens com estoque baixo */}
        <Card
          title="Alertas de Estoque"
          style={styles.card}
          rightHeaderContent={
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("InventoryList")
              }
            >
              <Typography
                variant="bodySecondary"
                color={theme.colors.primary.secondary}
              >
                Ver inventário
              </Typography>
            </TouchableOpacity>
          }
        >
          <View>
            {lowStockInventory.length > 0 ? (
              lowStockInventory.map((inv, index) => (
                <View key={inv.id}>
                  <TouchableOpacity
                    style={styles.lowStockItem}
                    onPress={() => {
                      navigation.navigate("InventoryDetail", {
                        id: inv.id,
                      });
                    }}
                  >
                    <View style={styles.lowStockIcon}>
                      <MaterialIcons
                        name="warning"
                        size={20}
                        color={theme.colors.status.warning}
                      />
                    </View>
                    <View style={styles.lowStockInfo}>
                      <Typography variant="body" numberOfLines={1}>
                        {inv.item.description}
                      </Typography>
                      <Typography
                        variant="small"
                        color={theme.colors.neutral.darkGray}
                      >
                        Estoque: {inv.quantity} | Alerta: {inv.alertLevel}
                      </Typography>
                    </View>
                    <View style={styles.lowStockBadge}>
                      <Typography
                        variant="small"
                        color={theme.colors.status.error}
                        style={styles.lowStockBadgeText}
                      >
                        Baixo
                      </Typography>
                    </View>
                  </TouchableOpacity>
                  {index < lowStockInventory.length - 1 && (
                    <View style={styles.itemSeparator} />
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIconContainer}>
                  <MaterialIcons
                    name="check-circle"
                    size={50}
                    color={theme.colors.status.success}
                  />
                </View>
                <Typography variant="h4" center style={styles.emptyStateTitle}>
                  Estoque em dia! ✅
                </Typography>
                <Typography variant="bodySecondary" center style={styles.emptyStateDescription}>
                  Todos os itens possuem estoque adequado
                </Typography>
              </View>
            )}
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
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 0) + 30,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.strong,
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.m,
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 14,
  },
  systemIndicator: {
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
    fontSize: 18,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginTop: -theme.spacing.m,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
    // CORREÇÃO: PaddingBottom seguindo padrão das outras telas
    paddingBottom: Platform.OS === "ios" ? theme.spacing.xxl + 90 : theme.spacing.xxl,
  },

  // Estatísticas
  statsSection: {
    marginBottom: theme.spacing.l,
  },
  mainStatsCard: {
    marginBottom: theme.spacing.m,
    overflow: "hidden",
    elevation: 6,
    shadowColor: theme.colors.primary.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statsGradient: {
    padding: theme.spacing.l,
    borderRadius: 12,
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsNumbers: {
    alignItems: "center",
  },
  statsValue: {
    fontSize: 30,
    fontWeight: "bold",
  },
 statsColumn: {
  flexDirection: "column",
  gap: 20,
},
statCard: {
  width: "100%", // Remova flex: 1
  marginHorizontal: 0, // Remova as margens horizontais
  overflow: "hidden",
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  borderWidth: 0,
},
  statContent: {
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
    minHeight: 100,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 2,
  },

  card: {
    marginBottom: theme.spacing.s,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginVertical: theme.spacing.xs,
  },
  addButton: {
    marginTop: theme.spacing.s,
    borderRadius: 8,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  lowStockItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  lowStockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.status.warning}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.s,
  },
  lowStockInfo: {
    flex: 1,
  },
  lowStockBadge: {
    backgroundColor: theme.colors.notifications.error.background,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.s,
  },
  lowStockBadgeText: {
    fontWeight: "500",
  },

  // Estados de loading e erro seguindo padrão do doador
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

  // Empty States seguindo padrão do doador
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  emptyStateIconContainer: {
    backgroundColor: `${theme.colors.primary.secondary}15`,
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.m,
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

  // Novos estilos para os cards de ação rápida
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.m,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.lightGray,
  },
  quickActionIcon: {
    marginRight: theme.spacing.m,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    marginBottom: 4,
    color: theme.colors.neutral.darkGray,
  },
  quickActionDescription: {
    marginBottom: theme.spacing.s,
    color: theme.colors.neutral.mediumGray,
    lineHeight: 18,
  },
  quickActionStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActionStat: {
    alignItems: "center",
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.s,
  },
  createDistributionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary.secondary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.small,
    gap: 4,
  },

  // Novos estilos para acesso rápido
  quickAccessContainer: {
    padding: theme.spacing.xs,
  },
  quickAccessOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  quickAccessIcon: {
    marginRight: theme.spacing.m,
  },
  quickAccessGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickAccessText: {
    flex: 1,
    color: theme.colors.neutral.darkGray,
    fontWeight: "500",
  },
  quickAccessSeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral.lightGray,
    marginHorizontal: theme.spacing.s,
  },
});

export default DashboardScreen;
