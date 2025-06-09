import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AdminUsersStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  Typography,
  Button,
  Loading,
  ErrorState,
  Card,
  Divider,
  Badge,
  Avatar,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";

// Tipos e rotas
import { UserRole } from "../../types/users.types";

// Interface para a rota
type UserDetailScreenRouteProp = RouteProp<
  AdminUsersStackParamList,
  "UserDetail"
>;

const UserDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminUsersStackParamList>>();
  const route = useRoute<UserDetailScreenRouteProp>();
  const { id } = route.params;
  useAuth();
  const { user, fetchUserById, removeUser, isLoading, error, clearError } =
    useUsers();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });

  // Carregar detalhes do usuário
  const loadUser = useCallback(async () => {
    await fetchUserById(id);
  }, [fetchUserById, id]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  // Função para deletar usuário
  const handleDeleteUser = async () => {
    try {
      await removeUser(id);
      setNotification({
        visible: true,
        type: "success",
        message: "Usuário excluído com sucesso!",
      });
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao excluir usuário.",
      });
    }
  };

  // Confirmar exclusão
  const confirmDelete = () => {
    Alert.alert(
      "Excluir Usuário",
      "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          onPress: () => setShowDeleteConfirmation(false),
          style: "cancel",
        },
        { text: "Excluir", onPress: handleDeleteUser, style: "destructive" },
      ]
    );
  };

  // Função para editar usuário
  const handleEditUser = () => {
    // Implementar navegação para tela de edição, se existir
    Alert.alert(
      "Editar Usuário",
      "Funcionalidade de edição será implementada em breve."
    );
  };

  if (isLoading) {
    return <Loading visible={true} message="Carregando detalhes..." overlay />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar detalhes"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadUser();
        }}
      />
    );
  }

  if (!user) {
    return (
      <ErrorState
        title="Usuário não encontrado"
        description="O usuário solicitado não foi encontrado."
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    );
  }

  // Mapeamento de roles para rótulos
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Administrador",
    [UserRole.FUNCIONARIO]: "Funcionário",
    [UserRole.DOADOR]: "Doador",
    [UserRole.BENEFICIARIO]: "Beneficiário",
  };

  // Mapeamento de roles para variantes de badge
  const roleVariants: Record<
    UserRole,
    "error" | "info" | "success" | "warning"
  > = {
    [UserRole.ADMIN]: "error",
    [UserRole.FUNCIONARIO]: "info",
    [UserRole.DOADOR]: "success",
    [UserRole.BENEFICIARIO]: "warning",
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Detalhes do Usuário"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditUser}
            >
              <Typography variant="small" color={theme.colors.neutral.white}>
                Editar
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={() => setShowDeleteConfirmation(true)}
            >
              <Typography variant="small" color={theme.colors.neutral.white}>
                Excluir
              </Typography>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Informações do usuário */}
        <Card style={styles.card}>
          <View style={styles.userContainer}>
            <Avatar name={user.name} size="large" style={styles.avatar} />
            <View style={styles.userInfo}>
              <Typography variant="h3">{user.name}</Typography>
              <Typography variant="bodySecondary">{user.email}</Typography>
              <Badge
                label={roleLabels[user.role]}
                variant={roleVariants[user.role]}
                size="medium"
                style={styles.roleBadge}
              />
            </View>
          </View>
        </Card>

        {/* Detalhes adicionais */}
        <Card title="Informações Adicionais" style={styles.card}>
          {user.phone && (
            <View style={styles.detailRow}>
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
            <View style={styles.detailRow}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Endereço:
              </Typography>
              <Typography variant="body">{user.address}</Typography>
            </View>
          )}

          <View style={styles.detailRow}>
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.darkGray}
            >
              Data de Cadastro:
            </Typography>
            <Typography variant="body">
              {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </View>
        </Card>

        {/* Ações */}
        <View style={styles.actionsContainer}>
          <Button
            title="Editar Informações"
            onPress={handleEditUser}
            style={styles.actionButton}
          />
          <Button
            title="Excluir Usuário"
            variant="secondary"
            onPress={() => setShowDeleteConfirmation(true)}
            style={[styles.actionButton, styles.deleteButton]}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xxl,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.xs,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.error,
  },
  card: {
    marginBottom: theme.spacing.s,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.s,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  userInfo: {
    flex: 1,
  },
  roleBadge: {
    marginTop: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
  },
  actionsContainer: {
    marginTop: theme.spacing.m,
  },
  actionButton: {
    marginBottom: theme.spacing.s,
  },
});

export default UserDetailScreen;
