import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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

// Hooks e types
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";
import { DoadorProfileStackParamList } from "../../navigation/types";

// Types
interface StatCardProps {
  icon: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradientColors: [string, string, ...string[]];
  value: number;
  label: string;
  subtitle: string;
}

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeColor?: string;
}

interface UserStats {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
}

const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();
  const { user, logout } = useAuth();
  const { fetchItemsByDonor } = useItems();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
  });

  // Animações
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const donations = await fetchItemsByDonor(user.id);
      const donationsArray = Array.isArray(donations)
        ? donations
        : donations?.data || [];

      const distributedItems = donationsArray.filter(
        (item) => item.status === "distributed"
      ).length;

      setStats({
        totalDonations: donationsArray.length,
        distributedItems,
        peopleHelped: distributedItems * 2, // Estimativa
      });

      // Animação de entrada
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
      ]).start();
    } catch (error: any) {
      console.error("[ProfileScreen] Erro ao carregar estatísticas:", error);
      setError("Não foi possível carregar as estatísticas do perfil");
    } finally {
      setLoading(false);
    }
  }, [user, fetchItemsByDonor]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

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

  // Componente de Estatística Individual
  const StatCard: React.FC<StatCardProps> = ({
    icon,
    iconColor,
    gradientColors,
    value,
    label,
    subtitle,
  }) => {
    return (
      <Animated.View
        style={[
          styles.statCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statGradient}
        >
          <View style={styles.statIconContainer}>
            <MaterialIcons name={icon as any} size={28} color={iconColor} />
          </View>

          <View style={styles.statContent}>
            <Typography
              variant="h2"
              color={theme.colors.neutral.white}
              style={styles.statValue}
            >
              {value.toString()}
            </Typography>
            <Typography
              variant="bodySecondary"
              color="rgba(255,255,255,0.9)"
              style={styles.statLabel}
            >
              {label}
            </Typography>
            <Typography
              variant="small"
              color="rgba(255,255,255,0.7)"
              style={styles.statSubtitle}
            >
              {subtitle}
            </Typography>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Componente de Item do Menu
  const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    showBadge = false,
    badgeColor = theme.colors.status.success,
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { borderColor: badgeColor }]}>
          <MaterialIcons
            name={icon}
            size={24}
            color={theme.colors.primary.secondary}
          />
          {showBadge && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]} />
          )}
        </View>
        <View style={styles.menuTextContainer}>
          <Typography variant="body" style={styles.menuTitle}>
            {title}
          </Typography>
          <Typography
            variant="small"
            color={theme.colors.neutral.darkGray}
            style={styles.menuSubtitle}
          >
            {subtitle}
          </Typography>
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={theme.colors.neutral.darkGray}
      />
    </TouchableOpacity>
  );

  // Componente de Header
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
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Avatar name={user?.name} size="large" style={styles.avatar} />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userDetails}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.userName}
              >
                Olá, {user?.name?.split(" ")[0]}!
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.userEmail}
              >
                {user?.email}
              </Typography>
              <View style={styles.userBadge}>
                <MaterialIcons name="verified" size={14} color="#4CAF50" />
                <Typography
                  variant="small"
                  color="rgba(255,255,255,0.9)"
                  style={styles.badgeText}
                >
                  Doador Verificado
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Estados de carregamento e erro
  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <Loading visible={true} message="Carregando perfil..." />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
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

  // Dados das estatísticas
  const statsData: StatCardProps[] = [
    {
      icon: "favorite",
      iconColor: "#FFFFFF",
      gradientColors: ["#FF6B6B", "#FF8E8E"],
      value: stats.totalDonations,
      label: "Doações",
      subtitle: "realizadas",
    },
    {
      icon: "inventory",
      iconColor: "#FFFFFF",
      gradientColors: ["#4ECDC4", "#44B3A8"],
      value: stats.distributedItems,
      label: "Itens",
      subtitle: "distribuídos",
    },
    {
      icon: "groups",
      iconColor: "#FFFFFF",
      gradientColors: ["#45B7D1", "#4A90E2"],
      value: stats.peopleHelped,
      label: "Pessoas",
      subtitle: "ajudadas",
    },
  ];

  // Dados do menu
  const menuItems = [
    {
      icon: "analytics" as keyof typeof MaterialIcons.glyphMap,
      title: "Relatório de Impacto",
      subtitle: "Veja estatísticas detalhadas das suas doações",
      onPress: () => navigation.navigate("Impact"),
    },
    {
      icon: "edit" as keyof typeof MaterialIcons.glyphMap,
      title: "Editar Perfil",
      subtitle: "Atualize suas informações pessoais",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: "history" as keyof typeof MaterialIcons.glyphMap,
      title: "Histórico de Doações",
      subtitle: "Acompanhe todas as suas contribuições",
      onPress: () => navigation.navigate("DonationHistory"),
    },
    {
      icon: "notifications" as keyof typeof MaterialIcons.glyphMap,
      title: "Notificações",
      subtitle: "Gerencie suas preferências de notificação",
      onPress: () => {},
      showBadge: true,
      badgeColor: theme.colors.status.warning,
    },
    {
      icon: "help" as keyof typeof MaterialIcons.glyphMap,
      title: "Ajuda & Suporte",
      subtitle: "Tire suas dúvidas ou reporte problemas",
      onPress: () => {},
    },
    {
      icon: "info" as keyof typeof MaterialIcons.glyphMap,
      title: "Sobre o App",
      subtitle: "Versão 1.0.0 • Termos de uso",
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Impacto Social */}
        <View style={styles.impactSection}>
          <Typography variant="h4" style={styles.sectionTitle}>
            Seu Impacto Social
          </Typography>
          <Typography variant="bodySecondary" style={styles.sectionSubtitle}>
            Veja como suas doações transformam vidas
          </Typography>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#FF6B6B", "#FF8E8E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconContainer}>
                  <MaterialIcons name="favorite" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Typography
                    variant="h2"
                    color={theme.colors.neutral.white}
                    style={styles.statValue}
                  >
                    {stats.totalDonations}
                  </Typography>
                  <Typography
                    variant="bodySecondary"
                    color="rgba(255,255,255,0.9)"
                    style={styles.statLabel}
                  >
                    Doações
                  </Typography>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={["#4ECD6C", "#38A56B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconContainer}>
                  <MaterialIcons name="inventory" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Typography
                    variant="h2"
                    color={theme.colors.neutral.white}
                    style={styles.statValue}
                  >
                    {stats.distributedItems}
                  </Typography>
                  <Typography
                    variant="bodySecondary"
                    color="rgba(255,255,255,0.9)"
                    style={styles.statLabel}
                  >
                    Itens
                  </Typography>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={["#45B7D1", "#4A90E2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconContainer}>
                  <MaterialIcons name="groups" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Typography
                    variant="h2"
                    color={theme.colors.neutral.white}
                    style={styles.statValue}
                  >
                    {stats.peopleHelped}
                  </Typography>
                  <Typography
                    variant="bodySecondary"
                    color="rgba(255,255,255,0.9)"
                    style={styles.statLabel}
                  >
                    Pessoas
                  </Typography>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Menu de Opções */}
        <Card style={styles.menuCard}>
          <Typography variant="h4" style={styles.menuSectionTitle}>
            Configurações
          </Typography>

          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <MenuItem {...item} />
              {index < menuItems.length - 1 && (
                <View style={styles.menuDivider} />
              )}
            </React.Fragment>
          ))}
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

        {/* Espaço extra no final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header Styles
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.m,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerContent: {
    marginTop: theme.spacing.m,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    marginRight: theme.spacing.m,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: theme.spacing.m + 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    marginBottom: theme.spacing.xs,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    marginLeft: theme.spacing.xs,
    fontWeight: "500",
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l, // Correção do espaçamento
  },

  // Impact Section
  impactSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: "transparent", // Garante visibilidade
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
    color: theme.colors.neutral.black,
  },
  sectionSubtitle: {
    color: theme.colors.neutral.darkGray,
    marginBottom: theme.spacing.l,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -theme.spacing.s, // Compensa as margens dos cards
    minHeight: 120, // Garante altura mínima
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xxs,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden", // Garante que o gradiente respeite o borderRadius
    minHeight: 135, // Altura mínima
  },
  statGradient: {
    flex: 1,
    borderRadius: 16,
    padding: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 2,
  },
  statSubtitle: {
    textAlign: "center",
    fontWeight: "400",
  },

  // Menu Styles
  menuCard: {
    marginBottom: theme.spacing.l,
    paddingVertical: theme.spacing.s,
  },
  menuSectionTitle: {
    fontWeight: "700",
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    color: theme.colors.neutral.black,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.m,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: "600",
    marginBottom: 2,
    color: theme.colors.neutral.black,
  },
  menuSubtitle: {
    lineHeight: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: theme.spacing.s,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    marginBottom: theme.spacing.m,
  },

  // Loading & Error States
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: theme.spacing.m,
  },

  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default ProfileScreen;
