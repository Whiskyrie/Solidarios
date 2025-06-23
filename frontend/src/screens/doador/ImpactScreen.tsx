import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { DoadorProfileStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Card,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useProfileData } from "../../hooks/useProfileData"; // Usar este em vez de useItems

const { width: screenWidth } = Dimensions.get("window");

// Tipos das estatísticas de impacto
type ImpactStats = {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  impactScore: number;
};

// Simulação de dados de categorias (já que não temos esses dados específicos)
type CategoryStats = {
  roupa: number;
  calcado: number;
  utensilio: number;
  outro: number;
};

// Configuração das conquistas/badges
const ACHIEVEMENTS = [
  {
    id: 1,
    threshold: 1,
    title: "Primeiro Passo",
    icon: "star",
    color: "#FFD700",
  },
  {
    id: 2,
    threshold: 5,
    title: "Ajudante",
    icon: "favorite",
    color: "#FF6B6B",
  },
  {
    id: 3,
    threshold: 10,
    title: "Solidário",
    icon: "emoji-events",
    color: "#4ECDC4",
  },
  {
    id: 4,
    threshold: 25,
    title: "Herói da Comunidade",
    icon: "military-tech",
    color: "#45B7D1",
  },
  {
    id: 5,
    threshold: 50,
    title: "Transformador de Vidas",
    icon: "diamond",
    color: "#96CEB4",
  },
];

const ImpactScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList, "Impact">>();
  useAuth();
  const {
    stats: profileStats,
    loading: profileLoading,
    error: profileError,
    retry: refreshProfileData,
  } = useProfileData();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ImpactStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    impactScore: 0,
  });

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Mapeamento de categorias para ícones e labels
  const getCategoryConfig = (category: string) => {
    const configMap = {
      roupa: {
        icon: "checkroom",
        label: "Roupas",
        color: "#FF6B6B",
        gradient: ["#FF6B6B", "#FF8E8E"] as const,
      },
      calcado: {
        icon: "directions-walk",
        label: "Calçados",
        color: "#4ECDC4",
        gradient: ["#4ECDC4", "#70D7D1"] as const,
      },
      utensilio: {
        icon: "kitchen",
        label: "Utensílios",
        color: "#45B7D1",
        gradient: ["#45B7D1", "#6BC7DD"] as const,
      },
      outro: {
        icon: "category",
        label: "Outros",
        color: "#96CEB4",
        gradient: ["#96CEB4", "#A8D3C4"] as const,
      },
    };
    return configMap[category as keyof typeof configMap] || configMap.outro;
  };

  // Simular distribuição de categorias baseada no total de doações
  const getCategoryStats = (totalDonations: number): CategoryStats => {
    if (totalDonations === 0) {
      return { roupa: 0, calcado: 0, utensilio: 0, outro: 0 };
    }

    // Distribuição baseada em padrões típicos de doação
    const roupaPercentage = 0.4; // 40% roupas
    const calcadoPercentage = 0.25; // 25% calçados
    const utensilioPercentage = 0.25; // 25% utensílios
    const outroPercentage = 0.1; // 10% outros

    return {
      roupa: Math.floor(totalDonations * roupaPercentage),
      calcado: Math.floor(totalDonations * calcadoPercentage),
      utensilio: Math.floor(totalDonations * utensilioPercentage),
      outro: Math.floor(totalDonations * outroPercentage),
    };
  };

  // Animação de entrada
  useEffect(() => {
    if (!profileLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [profileLoading]);

  // Atualizar stats quando profileStats mudar
  useEffect(() => {
    if (profileStats) {
      console.log(
        "ImpactScreen - Atualizando stats com profileStats:",
        profileStats
      );
      setStats({
        totalDonations: profileStats.totalDonations || 0,
        distributedItems: profileStats.distributedItems || 0,
        peopleHelped: profileStats.peopleHelped || 0,
        impactScore: profileStats.impactScore || 0,
      });
    }
  }, [profileStats]);

  // Header melhorado com gradiente e sombra
  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />
      <LinearGradient
        colors={["#173F5F", "#006E58", "#20B2AA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Typography
              variant="h3"
              color={theme.colors.neutral.white}
              style={styles.headerTitle}
            >
              Meu Impacto
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Transformando vidas juntos
            </Typography>
          </View>

          <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
            <MaterialIcons
              name="share"
              size={20}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  // Loading melhorado com shimmer effect
  const LoadingState = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      shimmer.start();
      return () => shimmer.stop();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-screenWidth, screenWidth],
    });

    return (
      <View style={styles.loadingContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            style={[styles.skeletonCard, { marginBottom: theme.spacing.m }]}
          >
            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
        ))}
      </View>
    );
  };

  // Estado vazio quando não há doações
  const EmptyState = () => (
    <Animated.View
      style={[
        styles.animatedCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.emptyStateCard}>
        <LinearGradient
          colors={[
            theme.colors.primary.secondary + "10",
            theme.colors.primary.secondary + "05",
          ]}
          style={styles.emptyStateGradient}
        >
          <MaterialIcons
            name="volunteer-activism"
            size={64}
            color={theme.colors.primary.secondary}
            style={styles.emptyStateIcon}
          />

          <Typography variant="h4" center style={styles.emptyStateTitle}>
            Sua jornada solidária começa aqui!
          </Typography>

          <Typography variant="body" center style={styles.emptyStateText}>
            Você ainda não fez nenhuma doação, mas isso pode mudar agora! Cada
            item doado é um passo para transformar vidas.
          </Typography>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[
                theme.colors.primary.secondary,
                theme.colors.primary.main,
              ]}
              style={styles.ctaGradient}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Typography
                variant="body"
                color="white"
                style={{ marginLeft: 8 }}
              >
                Fazer primeira doação
              </Typography>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.benefitsContainer}>
            <Typography variant="h4" center style={styles.benefitsTitle}>
              Por que doar?
            </Typography>

            {[
              { icon: "favorite", text: "Ajude quem mais precisa" },
              { icon: "groups", text: "Fortaleça sua comunidade" },
              { icon: "eco", text: "Promova sustentabilidade" },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons
                  name={benefit.icon}
                  size={20}
                  color={theme.colors.primary.secondary}
                />
                <Typography variant="bodySecondary" style={styles.benefitText}>
                  {benefit.text}
                </Typography>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Card>
    </Animated.View>
  );

  // Card principal com animação e melhor hierarquia visual
  const MainImpactCard = () => {
    const currentAchievement = ACHIEVEMENTS.filter(
      (a) => stats.totalDonations >= a.threshold
    ).pop();

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8FFFE"]}
          style={styles.mainImpactCard}
        >
          {/* Badge de conquista */}
          {currentAchievement && (
            <View
              style={[
                styles.achievementBadge,
                { backgroundColor: currentAchievement.color },
              ]}
            >
              <MaterialIcons
                name={currentAchievement.icon}
                size={16}
                color="white"
              />
              <Typography
                variant="caption"
                color="white"
                style={{ marginLeft: 4 }}
              >
                {currentAchievement.title}
              </Typography>
            </View>
          )}

          <View style={styles.cardHeader}>
            <MaterialIcons
              name="favorite"
              size={32}
              color={theme.colors.primary.secondary}
            />
            <Typography variant="h4" style={styles.cardTitle}>
              Seu Impacto Social
            </Typography>
            <Typography variant="bodySecondary" style={styles.cardSubtitle}>
              Cada gesto conta para um mundo melhor
            </Typography>
          </View>

          <View style={styles.statsGrid}>
            <StatItem
              value={stats.totalDonations}
              label="Doações realizadas"
              color={theme.colors.primary.secondary}
              icon="volunteer-activism"
            />
            <View style={styles.statDivider} />
            <StatItem
              value={stats.distributedItems}
              label="Itens distribuídos"
              color="#4ECDC4"
              icon="inventory"
            />
            <View style={styles.statDivider} />
            <StatItem
              value={stats.peopleHelped}
              label="Pessoas ajudadas"
              color={theme.colors.status.success}
              icon="groups"
            />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Componente para item de estatística
  const StatItem = ({
    value,
    label,
    color,
    icon,
  }: {
    value: number;
    label: string;
    color: string;
    icon: string;
  }) => (
    <View style={styles.statItem}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Typography variant="h1" color={color} center style={styles.statValue}>
        {value}
      </Typography>
      <Typography variant="bodySecondary" center style={styles.statLabel}>
        {label}
      </Typography>
    </View>
  );

  // Card de categorias melhorado com gradientes
  const CategoryBreakdownCard = () => {
    const categoryStats = getCategoryStats(stats.totalDonations);
    const total = Object.values(categoryStats).reduce(
      (sum, count) => sum + count,
      0
    );

    if (total === 0) return null; // Não mostrar se não há doações

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card style={styles.breakdownCard}>
          <View style={styles.cardHeaderWithIcon}>
            <MaterialIcons
              name="pie-chart"
              size={24}
              color={theme.colors.primary.secondary}
            />
            <Typography variant="h4" style={styles.cardTitle}>
              Doações por Categoria
            </Typography>
          </View>

          <View style={styles.categoryGrid}>
            {Object.entries(categoryStats).map(([category, count]) => {
              const config = getCategoryConfig(category);
              const percentage =
                total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <View key={category} style={styles.categoryCard}>
                  <LinearGradient
                    colors={config.gradient}
                    style={styles.categoryGradient}
                  >
                    <MaterialIcons name={config.icon} size={24} color="white" />
                    <Typography
                      variant="h3"
                      color="white"
                      style={{ marginTop: 8 }}
                    >
                      {count}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="white"
                      style={{ opacity: 0.9 }}
                    >
                      {percentage}%
                    </Typography>
                  </LinearGradient>
                  <Typography variant="body" style={styles.categoryLabel}>
                    {config.label}
                  </Typography>
                </View>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Card de progresso aprimorado
  const ProgressCard = () => {
    const monthlyGoal = 10;
    const progressPercentage = Math.min(
      (stats.totalDonations / monthlyGoal) * 100,
      100
    );
    const isGoalReached = stats.totalDonations >= monthlyGoal;

    if (stats.totalDonations === 0) return null; // Não mostrar se não há doações

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card style={styles.progressCard}>
          <View style={styles.cardHeaderWithIcon}>
            <MaterialIcons
              name="track-changes"
              size={24}
              color={theme.colors.primary.secondary}
            />
            <Typography variant="h4" style={styles.cardTitle}>
              Meta Mensal
            </Typography>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Typography variant="body">
                {isGoalReached ? "🎉 Meta alcançada!" : "Progresso atual"}
              </Typography>
              <View style={styles.progressBadge}>
                <Typography
                  variant="bodySecondary"
                  color={theme.colors.primary.secondary}
                >
                  {stats.totalDonations}/{monthlyGoal}
                </Typography>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: isGoalReached
                        ? theme.colors.status.success
                        : theme.colors.primary.secondary,
                    },
                  ]}
                />
              </View>
              <Typography variant="caption" style={styles.progressPercentage}>
                {Math.round(progressPercentage)}%
              </Typography>
            </View>

            <Typography variant="caption" color={theme.colors.neutral.darkGray}>
              {isGoalReached
                ? "Parabéns! Continue transformando vidas! 🌟"
                : `Faltam ${
                    monthlyGoal - stats.totalDonations
                  } doações para atingir a meta`}
            </Typography>
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Card de agradecimento com call-to-action
  const ThankYouCard = () => {
    if (stats.totalDonations === 0) return null; // Não mostrar se não há doações

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card style={styles.thankYouCard}>
          <LinearGradient
            colors={[
              theme.colors.primary.secondary + "15",
              theme.colors.primary.secondary + "05",
            ]}
            style={styles.thankYouGradient}
          >
            <View style={styles.heartAnimation}>
              <MaterialIcons
                name="favorite"
                size={40}
                color={theme.colors.primary.secondary}
              />
            </View>

            <Typography variant="h4" center style={styles.thankYouTitle}>
              Obrigado por fazer a diferença!
            </Typography>

            <Typography variant="body" center style={styles.thankYouText}>
              Cada doação sua constrói uma comunidade mais solidária e
              transforma vidas. Você é parte essencial desta rede de
              solidariedade.
            </Typography>

            {stats.distributedItems > 0 && (
              <View style={styles.impactHighlight}>
                <Typography
                  variant="bodySecondary"
                  center
                  style={styles.impactText}
                >
                  ❤️ Suas{" "}
                  <Typography
                    variant="body"
                    color={theme.colors.primary.secondary}
                  >
                    {stats.distributedItems} doações
                  </Typography>{" "}
                  já chegaram a quem precisava
                </Typography>
              </View>
            )}

            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[
                  theme.colors.primary.secondary,
                  theme.colors.primary.main,
                ]}
                style={styles.ctaGradient}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Typography
                  variant="body"
                  color="white"
                  style={{ marginLeft: 8 }}
                >
                  Fazer nova doação
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  // Pull to refresh
  const onRefresh = async () => {
    console.log("ImpactScreen - Iniciando refresh dos dados");
    setRefreshing(true);
    try {
      await refreshProfileData();
    } catch (error) {
      console.error("ImpactScreen - Erro no refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (profileError) {
    return (
      <View style={styles.container}>
        <Header />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ErrorState
            title="Erro ao carregar dados"
            description="Não foi possível carregar seus dados de impacto social."
            actionLabel="Tentar novamente"
            onAction={onRefresh}
          />
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.secondary]}
              tintColor={theme.colors.primary.secondary}
            />
          }
        >
          {profileLoading ? (
            <LoadingState />
          ) : stats.totalDonations === 0 ? (
            <EmptyState />
          ) : (
            <>
              <MainImpactCard />
              <CategoryBreakdownCard />
              <ProgressCard />
              <ThankYouCard />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FFFE",
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: theme.spacing.l,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: theme.spacing.m,
  },
  headerTitle: {
    fontWeight: "700",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },

  // Animações
  animatedCard: {
    marginBottom: theme.spacing.m,
  },

  // Empty State
  emptyStateCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyStateGradient: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyStateIcon: {
    marginBottom: theme.spacing.l,
    opacity: 0.8,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.m,
    fontWeight: "600",
    color: theme.colors.primary.secondary,
  },
  emptyStateText: {
    lineHeight: 24,
    textAlign: "center",
    marginBottom: theme.spacing.l,
    opacity: 0.8,
  },
  benefitsContainer: {
    marginTop: theme.spacing.l,
    width: "100%",
  },
  benefitsTitle: {
    marginBottom: theme.spacing.m,
    color: theme.colors.primary.secondary,
    fontWeight: "600",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  benefitText: {
    marginLeft: theme.spacing.s,
    flex: 1,
  },

  // Cards
  mainImpactCard: {
    borderRadius: 20,
    padding: theme.spacing.l,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  achievementBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.l,
  },
  cardHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  cardTitle: {
    marginLeft: 12,
    marginTop: theme.spacing.s,
    fontWeight: "600",
  },
  cardSubtitle: {
    marginTop: theme.spacing.xs,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.neutral.mediumGray + "30",
    marginHorizontal: theme.spacing.s,
  },

  // Categorias
  breakdownCard: {
    borderRadius: 16,
    padding: theme.spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: theme.spacing.s,
  },
  categoryCard: {
    width: (screenWidth - 80) / 2,
    marginBottom: theme.spacing.m,
    alignItems: "center",
  },
  categoryGradient: {
    width: "100%",
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  categoryLabel: {
    fontWeight: "500",
    textAlign: "center",
  },

  // Progresso
  progressCard: {
    borderRadius: 16,
    padding: theme.spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressContainer: {
    marginTop: theme.spacing.s,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  progressBadge: {
    backgroundColor: theme.colors.primary.secondary + "15",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBarContainer: {
    position: "relative",
    marginBottom: theme.spacing.s,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: theme.colors.neutral.mediumGray + "30",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressPercentage: {
    position: "absolute",
    right: 0,
    top: -20,
    fontWeight: "600",
  },

  // Agradecimento
  thankYouCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  thankYouGradient: {
    padding: theme.spacing.l,
    alignItems: "center",
  },
  heartAnimation: {
    marginBottom: theme.spacing.m,
  },
  thankYouTitle: {
    marginBottom: theme.spacing.m,
    fontWeight: "600",
    color: theme.colors.primary.secondary,
  },
  thankYouText: {
    lineHeight: 24,
    textAlign: "center",
    marginBottom: theme.spacing.m,
    opacity: 0.8,
  },
  impactHighlight: {
    backgroundColor: theme.colors.primary.secondary + "10",
    padding: theme.spacing.m,
    borderRadius: 12,
    marginBottom: theme.spacing.m,
  },
  impactText: {
    textAlign: "center",
  },
  ctaButton: {
    marginTop: theme.spacing.s,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },

  // Loading
  loadingContainer: {
    flex: 1,
  },
  skeletonCard: {
    height: 200,
    backgroundColor: theme.colors.neutral.mediumGray + "20",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.4)",
    width: screenWidth,
  },
});

export default ImpactScreen;
