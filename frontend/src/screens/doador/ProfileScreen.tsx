// ProfileScreen.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
  Animated,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorProfileStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Avatar,
  Divider,
  NotificationBanner,
  Badge,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";
import ProfileSkeleton from "../../components/profile/ProfileSkeleton";
import AnimatedStatsCard from "../../components/profile/AnimatedStatsCard";
import MenuItem from "../../components/profile/MenuItem";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useMemo } from "react";

// Tipos
import { NotificationType } from "../../components/feedback/NotificationBanner";

/**
 * Interface para as estatísticas do usuário
 */
interface UserStats {
  totalDonations: number;
  peopleHelped: number;
  impactScore: number;
}

/**
 * Tela de Perfil do Usuário Doador
 * Exibe informações do perfil, estatísticas e menu de opções
 * @returns Componente React
 */
const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();
  const { user, logout } = useAuth();

  // Estado para as estatísticas do usuário
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado separado para notificação (corrigindo bug de renderização infinita)
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    message: string;
    type: NotificationType;
  }>({
    message: "",
    type: "info",
  });

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  /**
   * Mostra uma notificação com a mensagem e tipo especificados
   */
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      setNotificationData({ message, type });
      setNotificationVisible(true);
    },
    []
  );

  /**
   * Esconde a notificação atual
   */
  const hideNotification = useCallback(() => {
    setNotificationVisible(false);
  }, []);

  /**
   * Busca as estatísticas do usuário da API
   */
  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      // Simulação de chamada à API
      // Em um cenário real, isso seria uma chamada de API:
      // const response = await api.get(`/users/${user.id}/stats`);
      // const data = response.data;

      // Simulando delay de rede
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dados simulados - no app real viriam da API
      const data = {
        totalDonations: Math.floor(Math.random() * 30),
        peopleHelped: Math.floor(Math.random() * 100),
        impactScore: Math.floor(Math.random() * 500),
      };

      setUserStats(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      setError("Não foi possível carregar suas estatísticas.");
    }
  }, [user]);

  /**
   * Função para realizar pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshing(false);
  }, [fetchUserStats]);

  /**
   * Efeito para carregar os dados iniciais e animar a entrada da tela
   */
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Animação de fade-in quando a tela é focada
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

      // Buscar dados do usuário
      const loadData = async () => {
        await fetchUserStats();
        setIsLoading(false);
      };

      loadData();

      // Cleanup function
      return () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
      };
    }, [fetchUserStats, fadeAnim, slideAnim])
  );

  /**
   * Animar avatar ao pressionar
   */
  const handleAvatarPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [avatarScale]);

  /**
   * Tratar logout do usuário
   */
  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await logout();
              if (!success) {
                showNotification(
                  "Erro ao sair da conta. Tente novamente.",
                  "error"
                );
              }
            } catch (error) {
              showNotification(
                "Erro ao sair da conta. Tente novamente.",
                "error"
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [logout, showNotification]);

  /**
   * Navega para a tela de edição de perfil
   */
  const navigateToEditProfile = useCallback(() => {
    navigation.navigate("EditProfile");
  }, [navigation]);

  /**
   * Navega para a tela de histórico de doações
   */
  const navigateToDonationHistory = useCallback(() => {
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("MyDonations", {
        screen: "DonationHistory",
      });
    }
  }, [navigation]);

  /**
   * Navega para a tela de impacto
   */
  const navigateToImpact = useCallback(() => {
    navigation.navigate("Impact");
  }, [navigation]);

  // Renderiza o cabeçalho com gradiente e avatar
  const renderProfileHeader = useMemo(() => {
    if (!user) return null;

    return (
      <LinearGradient
        colors={["#173F5F", "#006E58"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#173F5F"
          translucent
        />

        <View style={styles.welcomeSection}>
          <Typography
            variant="h2"
            style={styles.welcomeText}
            color={theme.colors.neutral.white}
          >
            Meu Perfil
          </Typography>

          <Typography
            variant="bodySecondary"
            color="rgba(255,255,255,0.8)"
            style={styles.greetingText}
          >
            Olá, {user?.name?.split(" ")[0] || "Doador"}
          </Typography>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleAvatarPress}
          accessibilityLabel="Editar foto de perfil"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            <Avatar
              name={user.name}
              size="xlarge"
              style={styles.avatar}
              source={user.avatarUrl ? { uri: user.avatarUrl } : undefined}
            />
            <View style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={18} color="#fff" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>
    );
  }, [user, avatarScale, handleAvatarPress]);

  // Se não houver usuário autenticado, não renderiza nada
  if (!user) return null;

  // Renderização do conteúdo principal
  return (
    <View style={styles.container}>
      {/* Notificação - versão corrigida */}
      <NotificationBanner
        visible={notificationVisible}
        type={notificationData.type}
        message={notificationData.message}
        onClose={hideNotification}
      />

      {/* Conteúdo principal */}
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Cabeçalho com gradiente */}
        {renderProfileHeader}

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
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
            {/* Informações de contato */}
            <Animated.View style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Typography variant="h3" style={styles.contactTitle}>
                  Informações de Contato
                </Typography>
                <Badge
                  label="Doador"
                  variant="success"
                  size="medium"
                  style={styles.roleTag}
                />
              </View>

              <View style={styles.contactInfo}>
                <MaterialIcons
                  name="email"
                  size={20}
                  color={theme.colors.primary.secondary}
                  style={styles.contactIcon}
                />
                <View style={styles.contactTextContainer}>
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    Email
                  </Typography>
                  <Typography variant="body">{user.email}</Typography>
                </View>
              </View>

              {user.phone && (
                <View style={styles.contactInfo}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color={theme.colors.primary.secondary}
                    style={styles.contactIcon}
                  />
                  <View style={styles.contactTextContainer}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Telefone
                    </Typography>
                    <Typography variant="body">{user.phone}</Typography>
                  </View>
                </View>
              )}

              {user.address && (
                <View style={styles.contactInfo}>
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color={theme.colors.primary.secondary}
                    style={styles.contactIcon}
                  />
                  <View style={styles.contactTextContainer}>
                    <Typography
                      variant="small"
                      color={theme.colors.neutral.darkGray}
                    >
                      Endereço
                    </Typography>
                    <Typography variant="body">{user.address}</Typography>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Estatísticas do usuário */}
            {error ? (
              <View style={styles.errorContainer}>
                <ErrorState
                  title="Não foi possível carregar estatísticas"
                  description={error}
                  actionLabel="Tentar novamente"
                  onAction={fetchUserStats}
                />
              </View>
            ) : (
              <AnimatedStatsCard
                donations={userStats?.totalDonations || 0}
                peopleHelped={userStats?.peopleHelped || 0}
                impact={userStats?.impactScore || 0}
              />
            )}

            {/* Menu de opções */}
            <View style={styles.menuCard}>
              <MenuItem
                label="Editar Perfil"
                icon="account-circle"
                onPress={navigateToEditProfile}
              />

              <Divider style={styles.menuDivider} />

              <MenuItem
                label="Histórico de Doações"
                icon="history"
                onPress={navigateToDonationHistory}
              />

              <Divider style={styles.menuDivider} />

              <MenuItem
                label="Meu Impacto Social"
                icon="volunteer-activism"
                onPress={navigateToImpact}
              />
            </View>

            {/* Botão de logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Sair da conta"
              accessibilityRole="button"
            >
              <MaterialIcons
                name="logout"
                size={18}
                color={theme.colors.status.error}
              />
              <Typography
                variant="body"
                style={styles.logoutText}
                color={theme.colors.status.error}
              >
                Sair da Conta
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  animatedContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 80,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: "center",
    ...theme.shadows.strong,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 14,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: -50,
    borderRadius: 75,
    padding: 3,
    backgroundColor: theme.colors.neutral.white,
    ...theme.shadows.strong,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: theme.colors.primary.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.medium,
  },
  content: {
    flex: 1,
    marginTop: 50,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  contactCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.medium,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  contactTitle: {
    color: theme.colors.primary.main,
    fontWeight: "600",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: theme.spacing.s,
  },
  contactIcon: {
    marginRight: theme.spacing.xs,
    marginTop: 2,
  },
  contactTextContainer: {
    flex: 1,
  },
  roleTag: {
    alignSelf: "flex-start",
  },
  menuCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.m,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  menuDivider: {
    marginHorizontal: theme.spacing.m,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.status.error}30`,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.s,
    borderWidth: 1.0235,
    borderColor: `${theme.colors.status.error}35`,
    marginVertical: theme.spacing.m,
  },
  logoutText: {
    marginLeft: theme.spacing.xs,
    fontWeight: "600",
  },
  errorContainer: {
    marginVertical: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
});

export default ProfileScreen;
