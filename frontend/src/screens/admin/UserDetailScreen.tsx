import React, { useState, useCallback } from "react";
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
  Badge,
  Avatar,
  NotificationBanner,
  ConfirmationDialog,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useUsers } from "../../hooks/useUsers";

// Tipos
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

  const { user, fetchUserById, removeUser, isLoading, error, clearError } = useUsers();

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
    // Adiciona uma condição para evitar o loop, só busca se o usuário for diferente
    if (!isLoading && (!user || user.id !== id)) {
        await fetchUserById(id);
    }
  }, [fetchUserById, id, user, isLoading]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );
  
  // Função para deletar usuário
  const handleDeleteUser = async () => {
    setShowDeleteConfirmation(false);
    const success = await removeUser(id);
    if (success) {
      Alert.alert("Sucesso", "Usuário removido com sucesso.");
      navigation.goBack();
    } else {
      setNotification({
        visible: true,
        type: 'error',
        message: 'Erro ao remover o usuário. Tente novamente.'
      });
    }
  };

  // Função para editar usuário
  const handleEditUser = () => {
    Alert.alert(
      "Editar Usuário",
      "Funcionalidade de edição será implementada em breve."
    );
  };

  if (isLoading && !user) {
    return <Loading visible={true} message="Carregando detalhes..." overlay />;
  }

  if (error && !user) {
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
      <View style={styles.container}>
        <Header title="Usuário não encontrado" onBackPress={() => navigation.goBack()} />
        <ErrorState
          title="Usuário não encontrado"
          description="O usuário solicitado não pode ser carregado."
          actionLabel="Voltar para a lista"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Mapeamento de roles para rótulos e cores
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Administrador",
    [UserRole.FUNCIONARIO]: "Funcionário",
    [UserRole.DOADOR]: "Doador",
    [UserRole.BENEFICIARIO]: "Beneficiário",
  };

  const roleVariants: Record<UserRole, "error" | "info" | "success" | "warning"> = {
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
      />

      {/* Notificação */}
      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <ScrollView contentContainerStyle={styles.contentContainer}>
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
              <Typography variant="body" style={styles.detailLabel}>Telefone:</Typography>
              <Typography variant="body">{user.phone}</Typography>
            </View>
          )}

          {user.address && typeof user.address === 'object' && user.address.street && (
            <View style={styles.detailRow}>
              <Typography variant="body" style={styles.detailLabel}>Endereço:</Typography>
              <Typography variant="body" style={styles.detailValue}>
                {`${user.address.street}, ${user.address.number}\n${user.address.city} - ${user.address.state}`}
              </Typography>
            </View>
          )}

          <View style={styles.detailRow}>
            <Typography variant="body" style={styles.detailLabel}>Data de Cadastro:</Typography>
            <Typography variant="body">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </Typography>
          </View>
        </Card>

        {/* =============================================== */}
        {/* BOTÕES DE AÇÃO ADICIONADOS AQUI       */}
        {/* =============================================== */}
        <View style={styles.actionsContainer}>
          <Button
            title="Editar Usuário"
            onPress={handleEditUser}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Excluir Usuário"
            onPress={() => setShowDeleteConfirmation(true)}
            variant="secondary" // Usando a variante secundária
            // CORREÇÃO: A prop 'color' foi removida e a cor foi aplicada via 'style'
            style={[styles.actionButton, { backgroundColor: theme.colors.status.error }]}
          />
        </View>

      </ScrollView>
      
      <ConfirmationDialog 
        visible={showDeleteConfirmation}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário ${user.name}?`}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  contentContainer: {
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xxl,
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
    alignSelf: 'flex-start',
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: theme.spacing.s,
  },
  detailValue: {
    textAlign: 'right',
    flex: 1,
  },
  actionsContainer: {
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  actionButton: {
    marginBottom: theme.spacing.s,
  },
});

export default UserDetailScreen;
