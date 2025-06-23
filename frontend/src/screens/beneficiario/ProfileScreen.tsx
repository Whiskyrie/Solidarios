import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Card,
  Button,
  Divider,
  Loading,
  ErrorState,
  Avatar,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e rotas
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();
  const { user, logout } = useAuth();
  const { distributions, fetchDistributionsByBeneficiary } = useDistributions();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    recentReceipts: 0,
    totalItems: 0,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Carregar dados do perfil
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Buscar apenas alguns dados básicos para o perfil
      const response = await fetchDistributionsByBeneficiary(user.id, { 
        page: 1, 
        take: 5 // Apenas alguns dados para o perfil
      });

      // Calcular estatísticas básicas
      const validDistributions = Array.isArray(distributions) ? distributions : [];
      const totalItems = validDistributions.reduce((sum, dist) => {
        return sum + (Array.isArray(dist.items) ? dist.items.length : 0);
      }, 0);

      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentReceipts = validDistributions.filter(dist => {
        const distDate = new Date(dist.date);
        return distDate >= lastMonth;
      }).length;

      setStats({
        totalReceipts: validDistributions.length,
        recentReceipts,
        totalItems,
      });

      setDataLoaded(true);
    } catch (error) {
      console.error("[ProfileScreen] Erro ao carregar dados:", error);
      setDataLoaded(true);
    }
  }, [user?.id, fetchDistributionsByBeneficiary, distributions]);

  // Animação de entrada
  useFocusEffect(
    useCallback(() => {
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

      // Carregar dados apenas uma vez por foco
      if (!dataLoaded) {
        loadProfileData();
      }
    }, [fadeAnim, slideAnim, dataLoaded, loadProfileData])
  );

  // Refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfileData();
    } catch (error) {
      console.error("[ProfileScreen] Erro no refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadProfileData]);

  // Função de logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      "Confirmar saída",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            logout();
          },
        },
      ]
    );
  }, [logout]);

  // Navegar para editar perfil
  const navigateToEditProfile = useCallback(() => {
    navigation.navigate(BENEFICIARIO_ROUTES.EDIT_PROFILE);
  }, [navigation]);

  // Navegar para histórico
  const navigateToHistory = useCallback(() => {
    navigation.navigate(BENEFICIARIO_ROUTES.RECEIPT_HISTORY);
  }, [navigation]);

  // Header Component
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
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.name || "Usuário"}
              size="large"
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Typography
                variant="h2"
                color={theme.colors.neutral.white}
                style={styles.userName}
              >
                {user?.name || "Beneficiário"}
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.userEmail}
              >
                {user?.email || ""}
              </Typography>
            </View>
          </View>

          {/* Estatísticas rápidas */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.statNumber}
              >
                {stats.totalReceipts}
              </Typography>
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
              >
                Recebimentos
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.statNumber}
              >
                {stats.totalItems}
              </Typography>
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
              >
                Itens recebidos
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.statNumber}
              >
                {stats.recentReceipts}
              </Typography>
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
              >
                Este mês
              </Typography>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollContainer}
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
          {/* Informações pessoais */}
          <Card title="Informações Pessoais" style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialIcons
                name="person"
                size={20}
                color={theme.colors.neutral.darkGray}
              />
              <View style={styles.infoContent}>
                <Typography variant="bodySecondary" color={theme.colors.neutral.darkGray}>
                  Nome completo
                </Typography>
                <Typography variant="body">{user?.name || "Não informado"}</Typography>
              </View>
            </View>

            <Divider spacing={theme.spacing.s} />

            <View style={styles.infoRow}>
              <MaterialIcons
                name="email"
                size={20}
                color={theme.colors.neutral.darkGray}
              />
              <View style={styles.infoContent}>
                <Typography variant="bodySecondary" color={theme.colors.neutral.darkGray}>
                  E-mail
                </Typography>
                <Typography variant="body">{user?.email || "Não informado"}</Typography>
              </View>
            </View>

            <Divider spacing={theme.spacing.s} />

            <View style={styles.infoRow}>
              <MaterialIcons
                name="phone"
                size={20}
                color={theme.colors.neutral.darkGray}
              />
              <View style={styles.infoContent}>
                <Typography variant="bodySecondary" color={theme.colors.neutral.darkGray}>
                  Telefone
                </Typography>
                <Typography variant="body">{user?.phone || "Não informado"}</Typography>
              </View>
            </View>

            {user?.address && (
              <>
                <Divider spacing={theme.spacing.s} />
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color={theme.colors.neutral.darkGray}
                  />
                  <View style={styles.infoContent}>
                    <Typography variant="bodySecondary" color={theme.colors.neutral.darkGray}>
                      Endereço
                    </Typography>
                    <Typography variant="body">{user.address}</Typography>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* Ações rápidas */}
          <Card title="Ações" style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={navigateToEditProfile}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <MaterialIcons
                  name="edit"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
                <Typography variant="body" style={styles.actionText}>
                  Editar perfil
                </Typography>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.colors.neutral.darkGray}
              />
            </TouchableOpacity>

            <Divider spacing={theme.spacing.s} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={navigateToHistory}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <MaterialIcons
                  name="history"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
                <Typography variant="body" style={styles.actionText}>
                  Histórico completo
                </Typography>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.colors.neutral.darkGray}
              />
            </TouchableOpacity>
          </Card>

          {/* Botão de logout */}
          <View style={styles.logoutContainer}>
            <Button
              title="Sair da conta"
              onPress={handleLogout}
              variant="secondary"
              style={styles.logoutButton}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...theme.shadows.strong,
  },
  headerContent: {
    paddingHorizontal: theme.spacing.m,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  avatar: {
    marginRight: theme.spacing.m,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 2,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.s,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.s,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.s,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: theme.spacing.s,
  },
  logoutContainer: {
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  logoutButton: {
    borderColor: theme.colors.status.error,
  },
});

export default ProfileScreen;
