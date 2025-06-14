// ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorProfileStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Card,
  Button,
  Avatar,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Interface para estatísticas
interface DonorStats {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  impactScore: number;
}

const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();
  const { user, logout } = useAuth();
  const { fetchItemsByDonor } = useItems();

  // Estados
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DonorStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    impactScore: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Carregar estatísticas do usuário
  const loadUserStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetchItemsByDonor(user.id, {
        page: 1,
        take: 100,
      });

      if (response && response.data) {
        const items = response.data;
        const distributedItems = items.filter(
          (item) => item.status === "distribuido"
        ).length;

        setStats({
          totalDonations: items.length,
          distributedItems,
          peopleHelped: distributedItems,
          impactScore: distributedItems * 3 + items.length,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      setError("Não foi possível carregar suas estatísticas.");
    } finally {
      setLoading(false);
    }
  }, [user, fetchItemsByDonor]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  // Função de logout com confirmação
  const handleLogout = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  // Componente de Header
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
          <View style={styles.userInfo}>
            <Avatar name={user?.name} size="large" style={styles.avatar} />
            <View style={styles.userDetails}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.userName}
              >
                {user?.name}
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.userEmail}
              >
                {user?.email}
              </Typography>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Se estiver carregando
  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Carregando perfil..." />
        </View>
      </View>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <ErrorState
            title="Erro ao carregar perfil"
            description={error}
            actionLabel="Tentar novamente"
            onAction={loadUserStats}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Estatísticas */}
        <Card style={styles.statsCard}>
          <Typography variant="h4" style={styles.sectionTitle}>
            Meu Impacto Social
          </Typography>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Typography
                variant="h2"
                color={theme.colors.primary.secondary}
                style={styles.statValue}
              >
                {stats.totalDonations}
              </Typography>
              <Typography variant="small" style={styles.statLabel}>
                Doações Realizadas
              </Typography>
            </View>

            <View style={styles.statItem}>
              <Typography
                variant="h2"
                color={theme.colors.primary.secondary}
                style={styles.statValue}
              >
                {stats.distributedItems}
              </Typography>
              <Typography variant="small" style={styles.statLabel}>
                Itens Distribuídos
              </Typography>
            </View>

            <View style={styles.statItem}>
              <Typography
                variant="h2"
                color={theme.colors.primary.secondary}
                style={styles.statValue}
              >
                {stats.peopleHelped}
              </Typography>
              <Typography variant="small" style={styles.statLabel}>
                Pessoas Ajudadas
              </Typography>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate("Impact")}
            activeOpacity={0.7}
          >
            <Typography
              variant="bodySecondary"
              color={theme.colors.primary.secondary}
            >
              Ver detalhes do impacto
            </Typography>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={theme.colors.primary.secondary}
            />
          </TouchableOpacity>
        </Card>

        {/* Menu de Opções */}
        <Card style={styles.menuCard}>
          <Typography variant="h4" style={styles.sectionTitle}>
            Menu
          </Typography>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("DonationHistory")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name="history"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <Typography variant="body">Histórico de Doações</Typography>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.neutral.darkGray}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Impact")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name="emoji-events"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <Typography variant="body">Impacto Social</Typography>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.neutral.darkGray}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("EditProfile")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name="edit"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
              </View>
              <Typography variant="body">Editar Perfil</Typography>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.neutral.darkGray}
            />
          </TouchableOpacity>
        </Card>

        {/* Botão de Logout */}
        <Button
          title="Sair da Conta"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
          leftIcon={
            <MaterialIcons
              name="logout"
              size={20}
              color={theme.colors.status.error}
            />
          }
        />
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.medium,
  },
  headerContent: {
    paddingHorizontal: theme.spacing.m,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: theme.spacing.m,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.m,
  },
  statsCard: {
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: theme.spacing.m,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontWeight: "bold",
    marginBottom: theme.spacing.xxs,
  },
  statLabel: {
    textAlign: "center",
    color: theme.colors.neutral.darkGray,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.mediumGray,
  },
  menuCard: {
    marginBottom: theme.spacing.m,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.s,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.s,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginVertical: theme.spacing.xs,
  },
  logoutButton: {
    marginTop: theme.spacing.s,
    borderColor: theme.colors.status.error,
  },
});

export default ProfileScreen;
