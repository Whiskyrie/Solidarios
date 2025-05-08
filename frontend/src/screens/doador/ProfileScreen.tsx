import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorProfileStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  Card,
  Button,
  Avatar,
  Divider,
  NotificationBanner,
  Badge,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();
  const { user, logout } = useAuth();
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });

  // Tratar logout
  const handleLogout = async () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            const success = await logout();
            if (!success) {
              setNotification({
                visible: true,
                message: "Erro ao sair da conta. Tente novamente.",
                type: "error",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      {/* Cabeçalho */}
      <Header
        title="Meu Perfil"
        backgroundColor={theme.colors.primary.secondary}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cartão do perfil */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={user.name} size="large" style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Typography variant="h3">{user.name}</Typography>
              <Typography variant="bodySecondary">{user.email}</Typography>
              <Badge
                label="Doador"
                variant="success"
                size="small"
                style={styles.roleTag}
              />
            </View>
          </View>

          {user.phone && (
            <View style={styles.contactInfo}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Telefone:
              </Typography>
              <Typography variant="body">{user.phone}</Typography>
            </View>
          )}

          {user.address && (
            <View style={styles.contactInfo}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Endereço:
              </Typography>
              <Typography variant="body">{user.address}</Typography>
            </View>
          )}
        </Card>

        {/* Menu de opções */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Typography variant="body">Editar Perfil</Typography>
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Navegar para a tab DonationHistory através do parent
              const rootNavigation = navigation.getParent();
              if (rootNavigation) {
                rootNavigation.navigate("MyDonations", {
                  screen: "DonationHistory",
                });
              }
            }}
          >
            <Typography variant="body">Histórico de Doações</Typography>
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Impact")}
          >
            <Typography variant="body">Meu Impacto Social</Typography>
          </TouchableOpacity>
        </Card>

        {/* Estatísticas rápidas */}
        <Card title="Minhas Estatísticas" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography variant="h3" color={theme.colors.primary.secondary}>
                0
              </Typography>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                Doações Realizadas
              </Typography>
            </View>

            <View style={styles.statItem}>
              <Typography variant="h3" color={theme.colors.primary.secondary}>
                0
              </Typography>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                Pessoas Ajudadas
              </Typography>
            </View>
          </View>
        </Card>

        {/* Botão de logout */}
        <Button
          title="Sair da Conta"
          variant="secondary"
          style={styles.logoutButton}
          onPress={handleLogout}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  profileCard: {
    marginBottom: theme.spacing.m,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.s,
  },
  avatar: {
    marginRight: theme.spacing.m,
  },
  profileInfo: {
    flex: 1,
  },
  roleTag: {
    marginTop: theme.spacing.xs,
  },
  contactInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  menuCard: {
    marginBottom: theme.spacing.m,
  },
  menuItem: {
    paddingVertical: theme.spacing.m,
  },
  statsCard: {
    marginBottom: theme.spacing.m,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.s,
  },
  statItem: {
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: theme.colors.status.error,
  },
});

export default ProfileScreen;
