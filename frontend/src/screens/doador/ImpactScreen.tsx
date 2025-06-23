import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
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
import { useItems } from "../../hooks/useItems";

// Tipos das estatísticas de impacto
type ImpactStats = {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  clothesDonated: number;
  shoesDonated: number;
  utensilsDonated: number;
  othersDonated: number;
};

type CategoryStats = {
  roupa: number;
  calcado: number;
  utensilio: number;
  outro: number;
};

const ImpactScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList, "Impact">>();
  const { user } = useAuth();
  const { fetchItemsByDonor } = useItems();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ImpactStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    clothesDonated: 0,
    shoesDonated: 0,
    utensilsDonated: 0,
    othersDonated: 0,
  });

  // Mapeamento de categorias para ícones e labels
  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      roupa: "checkroom",
      calcado: "directions-walk",
      utensilio: "kitchen",
      outro: "category",
    };
    return iconMap[category] || "category";
  };

  const getCategoryLabel = (category: string): string => {
    const labelMap = {
      roupa: "Roupas",
      calcado: "Calçados",
      utensilio: "Utensílios",
      outro: "Outros",
    };
    return (labelMap as any)[category] || "Outros";
  };

  // Header melhorado seguindo padrão EditProfileScreen
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

          <Typography
            variant="h3"
            color={theme.colors.neutral.white}
            style={styles.headerTitle}
          >
            Meu Impacto
          </Typography>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>
    </>
  );

  // Loading State elegante
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      {/* Skeleton do card principal */}
      <Card style={styles.skeletonMainCard}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
        <View style={styles.skeletonStatsGrid}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatNumber} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
      </Card>

      {/* Skeleton do card de categorias */}
      <Card style={styles.skeletonBreakdownCard}>
        <View style={styles.skeletonTitle} />
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.skeletonCategoryRow}>
            <View style={styles.skeletonCategoryIcon} />
            <View style={styles.skeletonCategoryName} />
            <View style={styles.skeletonCategoryCount} />
          </View>
        ))}
      </Card>

      {/* Skeleton do card de agradecimento */}
      <Card style={styles.skeletonThankYouCard}>
        <View style={styles.skeletonThankYouIcon} />
        <View style={styles.skeletonThankYouText} />
        <View style={styles.skeletonThankYouTextSmall} />
      </Card>
    </View>
  );

  // Card Principal de Impacto
  const MainImpactCard = () => (
    <Card style={styles.mainImpactCard}>
      <Typography variant="h4" style={styles.cardTitle} center>
        Seu Impacto Social
      </Typography>

      <Typography variant="bodySecondary" style={styles.cardSubtitle} center>
        Transformando vidas através da solidariedade
      </Typography>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Typography
            variant="h1"
            color={theme.colors.primary.secondary}
            center
          >
            {stats.totalDonations}
          </Typography>
          <Typography variant="bodySecondary" center>
            Doações realizadas
          </Typography>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Typography
            variant="h1"
            color={theme.colors.primary.secondary}
            center
          >
            {stats.distributedItems}
          </Typography>
          <Typography variant="bodySecondary" center>
            Itens distribuídos
          </Typography>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Typography variant="h1" color={theme.colors.status.success} center>
            {stats.peopleHelped}
          </Typography>
          <Typography variant="bodySecondary" center>
            Pessoas ajudadas
          </Typography>
        </View>
      </View>
    </Card>
  );

  // Card de Detalhes por Categoria
  const CategoryBreakdownCard = () => {
    const categoryStats: CategoryStats = {
      roupa: stats.clothesDonated,
      calcado: stats.shoesDonated,
      utensilio: stats.utensilsDonated,
      outro: stats.othersDonated,
    };

    return (
      <Card style={styles.breakdownCard}>
        <Typography variant="h4" style={styles.cardTitle}>
          Doações por Categoria
        </Typography>

        <View style={styles.categoryList}>
          {Object.entries(categoryStats).map(([category, count]) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <MaterialIcons
                  name={getCategoryIcon(category)}
                  size={20}
                  color={theme.colors.primary.secondary}
                />
                <Typography variant="body" style={styles.categoryName}>
                  {getCategoryLabel(category)}
                </Typography>
              </View>
              <Typography variant="h4" color={theme.colors.primary.main}>
                {count}
              </Typography>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  // Card de Progresso e Metas (novo)
  const ProgressCard = () => {
    const progressPercentage = Math.min((stats.totalDonations / 10) * 100, 100); // Meta de 10 doações

    return (
      <Card style={styles.progressCard}>
        <Typography variant="h4" style={styles.cardTitle}>
          Progresso das Metas
        </Typography>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Typography variant="body">Meta de doações mensais</Typography>
            <Typography
              variant="bodySecondary"
              color={theme.colors.primary.secondary}
            >
              {stats.totalDonations}/10
            </Typography>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
          </View>

          <Typography variant="caption" color={theme.colors.neutral.darkGray}>
            {progressPercentage < 100
              ? `Faltam ${
                  10 - stats.totalDonations
                } doações para atingir a meta`
              : "🎉 Meta atingida! Parabéns pelo seu impacto!"}
          </Typography>
        </View>
      </Card>
    );
  };

  // Card de Agradecimento
  const ThankYouCard = () => (
    <Card style={styles.thankYouCard}>
      <LinearGradient
        colors={[
          theme.colors.primary.secondary + "20",
          theme.colors.primary.secondary + "10",
        ]}
        style={styles.thankYouGradient}
      >
        <MaterialIcons
          name="favorite"
          size={32}
          color={theme.colors.primary.secondary}
          style={styles.thankYouIcon}
        />
        <Typography variant="body" center style={styles.thankYouText}>
          Obrigado por fazer a diferença! Cada doação sua ajuda a construir uma
          comunidade mais solidária e transforma vidas.
        </Typography>

        {stats.distributedItems > 0 && (
          <Typography variant="caption" center style={styles.thankYouSubtext}>
            Suas {stats.distributedItems} doações distribuídas já chegaram a
            quem precisava ❤️
          </Typography>
        )}
      </LinearGradient>
    </Card>
  );

  // Carregar estatísticas do usuário
  useEffect(() => {
    const loadImpactStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Buscar todos os itens doados pelo usuário
        const response = await fetchItemsByDonor(user.id, {
          page: 1,
          take: 100,
        });

        if (response && response.data) {
          const items = response.data;

          // Calcular estatísticas
          const distributedItems = items.filter(
            (item) => item.status === "distribuido"
          ).length;

          const peopleHelped = distributedItems;

          // Contar itens por tipo
          const clothesDonated = items.filter(
            (item) => item.type === "roupa"
          ).length;
          const shoesDonated = items.filter(
            (item) => item.type === "calcado"
          ).length;
          const utensilsDonated = items.filter(
            (item) => item.type === "utensilio"
          ).length;
          const othersDonated = items.filter(
            (item) => item.type === "outro"
          ).length;

          setStats({
            totalDonations: items.length,
            distributedItems,
            peopleHelped,
            clothesDonated,
            shoesDonated,
            utensilsDonated,
            othersDonated,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas de impacto:", err);
        setError("Não foi possível carregar seus dados de impacto social.");
      } finally {
        setLoading(false);
      }
    };

    loadImpactStats();
  }, [user, fetchItemsByDonor]);

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ErrorState
            title="Erro ao carregar dados"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => {
              setError(null);
              // Recarregar a tela
              const loadStats = async () => {
                // Reimplementar lógica de carregamento
                setLoading(true);
                // ... lógica de carregamento
                setLoading(false);
              };
              loadStats();
            }}
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
        >
          {loading ? (
            <LoadingState />
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
    backgroundColor: theme.colors.neutral.lightGray,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: theme.spacing.m,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
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
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: theme.spacing.m,
  },
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },

  // Cards principais
  mainImpactCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.l,
  },
  cardTitle: {
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    marginBottom: theme.spacing.l,
    opacity: 0.8,
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
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginHorizontal: theme.spacing.s,
  },

  // Card de categorias
  breakdownCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
  },
  categoryList: {
    marginTop: theme.spacing.s,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryName: {
    marginLeft: theme.spacing.s,
  },

  // Card de progresso
  progressCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
  },
  progressContainer: {
    marginTop: theme.spacing.s,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.s,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary.secondary,
    borderRadius: 4,
  },

  // Card de agradecimento
  thankYouCard: {
    marginBottom: theme.spacing.m,
    overflow: "hidden",
  },
  thankYouGradient: {
    padding: theme.spacing.l,
    alignItems: "center",
  },
  thankYouIcon: {
    marginBottom: theme.spacing.m,
  },
  thankYouText: {
    lineHeight: 22,
    color: theme.colors.primary.secondary,
    marginBottom: theme.spacing.s,
  },
  thankYouSubtext: {
    color: theme.colors.primary.secondary,
    opacity: 0.8,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
  },
  skeletonMainCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.l,
  },
  skeletonHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.l,
  },
  skeletonTitle: {
    width: 200,
    height: 24,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  skeletonSubtitle: {
    width: 150,
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
  },
  skeletonStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  skeletonStatItem: {
    alignItems: "center",
    flex: 1,
  },
  skeletonStatNumber: {
    width: 40,
    height: 32,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  skeletonStatLabel: {
    width: 80,
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
  },
  skeletonBreakdownCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
  },
  skeletonCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.s,
    marginTop: theme.spacing.xs,
  },
  skeletonCategoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginRight: theme.spacing.s,
  },
  skeletonCategoryName: {
    flex: 1,
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginRight: theme.spacing.s,
  },
  skeletonCategoryCount: {
    width: 30,
    height: 20,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
  },
  skeletonThankYouCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.l,
    alignItems: "center",
  },
  skeletonThankYouIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginBottom: theme.spacing.m,
  },
  skeletonThankYouText: {
    width: "90%",
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  skeletonThankYouTextSmall: {
    width: "70%",
    height: 16,
    backgroundColor: theme.colors.neutral.mediumGray,
    borderRadius: 4,
  },
});

export default ImpactScreen;
