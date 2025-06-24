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
import { FuncionarioProfileStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Componentes
import {
  Typography,
  Card,
  Button,
  Divider,
  Avatar,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";
import { useInventory } from "../../hooks/useInventory";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<FuncionarioProfileStackParamList>>();
  const { user, logout } = useAuth();
  const { distributions, fetchDistributions } = useDistributions();
  const { inventoryItems, fetchInventory } = useInventory();

  // Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDistributions: 0,
    recentDistributions: 0,
    totalItems: 0,
    lowStockItems: 0,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  // Refs para animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Carregar dados do perfil
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Buscar distribuições e itens
      await Promise.all([
        fetchDistributions({ page: 1, take: 50 }),
        fetchInventory({ page: 1, take: 100 })
      ]);

      // Calcular estatísticas básicas
      const validDistributions = Array.isArray(distributions) ? distributions : [];
      const validItems = Array.isArray(inventoryItems) ? inventoryItems : [];

      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentDistributions = validDistributions.filter(dist => {
        const distDate = new Date(dist.date);
        return distDate >= lastMonth;
      }).length;

      // Supondo que o valor mínimo de estoque seja 10 se não houver propriedade específica
      const lowStockItems = validItems.filter(item => 
        item.quantity <= 10
      ).length;

      setStats({
        totalDistributions: validDistributions.length,
        recentDistributions,
        totalItems: validItems.length,
        lowStockItems,
      });

      setDataLoaded(true);
    } catch (error) {
      console.error("[ProfileScreen] Erro ao carregar dados:", error);
      setDataLoaded(true);
    }
  }, [user?.id, fetchDistributions, fetchInventory, distributions, inventoryItems]);

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
              name={user?.name || "Funcionário"}
              size="large"
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Typography
                variant="h2"
                color={theme.colors.neutral.white}
                style={styles.userName}
              >
                {user?.name || "Funcionário"}
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.userEmail}
              >
                {user?.email || ""}
              </Typography>
              <Badge
                label="Funcionário"
                variant="info"
                size="small"
                style={styles.roleBadge}
              />
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
                {stats.totalDistributions}
              </Typography>
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
              >
                Distribuições
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
                Itens gerenciados
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.statNumber}
              >
                {stats.recentDistributions}
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

          {/* Estatísticas detalhadas */}
          <Card title="Estatísticas de Trabalho" style={styles.card}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons
                  name="assignment"
                  size={24}
                  color={theme.colors.primary.secondary}
                />
                <Typography variant="h3" style={styles.statCardNumber}>
                  {stats.totalDistributions}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral.darkGray}>
                  Total de distribuições
                </Typography>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons
                  name="inventory"
                  size={24}
                  color={theme.colors.status.success}
                />
                <Typography variant="h3" style={styles.statCardNumber}>
                  {stats.totalItems}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral.darkGray}>
                  Itens no estoque
                </Typography>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons
                  name="trending-up"
                  size={24}
                  color={theme.colors.status.info}
                />
                <Typography variant="h3" style={styles.statCardNumber}>
                  {stats.recentDistributions}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral.darkGray}>
                  Distribuições este mês
                </Typography>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons
                  name="warning"
                  size={24}
                  color={stats.lowStockItems > 0 ? theme.colors.status.warning : theme.colors.neutral.mediumGray}
                />
                <Typography variant="h3" style={styles.statCardNumber}>
                  {stats.lowStockItems}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral.darkGray}>
                  Itens em falta
                </Typography>
              </View>
            </View>
          </Card>

          {/* Botão de logout */}
          <View style={styles.logoutContainer}>
            <Button
              title="Sair da conta"
              onPress={handleLogout}
              variant="secondary"
              style={styles.logoutButton}
              leftIcon={
                <MaterialIcons
                  name="logout"
                  size={20}
                  color={theme.colors.status.error}
                />
              }
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
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: "flex-start",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.lightGray,
    borderRadius: 12,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  statCardNumber: {
    marginVertical: theme.spacing.xs,
    fontWeight: "bold",
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
  },
});

export default ProfileScreen;