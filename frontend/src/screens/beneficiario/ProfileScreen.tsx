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
import { BeneficiarioProfileStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  Card,
  Button,
  Avatar,
  Divider,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";

const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<BeneficiarioProfileStackParamList>>();
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
      <Header title="Meu Perfil" backgroundColor={theme.colors.primary.main} />

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
              <Typography variant="bodySecondary" style={styles.roleTag}>
                Beneficiário
              </Typography>
            </View>
          </View>
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
            onPress={() => navigation.navigate("ReceiptHistory")}
          >
            <Typography variant="body">Histórico de Recebimentos</Typography>
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("NeedsAssessment")}
          >
            <Typography variant="body">Avaliação de Necessidades</Typography>
          </TouchableOpacity>
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
  },
  avatar: {
    marginRight: theme.spacing.m,
  },
  profileInfo: {
    flex: 1,
  },
  roleTag: {
    marginTop: theme.spacing.xs,
    color: theme.colors.primary.secondary,
  },
  menuCard: {
    marginBottom: theme.spacing.m,
  },
  menuItem: {
    paddingVertical: theme.spacing.m,
  },
  logoutButton: {
    backgroundColor: theme.colors.status.error,
  },
});

export default ProfileScreen;
