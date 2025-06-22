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
  ConfirmationDialog, // Adicionado para a confirmação
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
        rightComponent={
          <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={handleEditUser}>
                <Typography 
                  variant="small" 
                  color={theme.colors.neutral.white}
                  numberOfLines={1} // Garante que o texto fique em uma única linha
                >
                  Editar
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
              <Typography variant="body" style={{ fontWeight: 'bold' }}>Telefone:</Typography>
              <Typography variant="body">{user.phone}</Typography>
            </View>
          )}

          {user.address && typeof user.address === 'object' && user.address.street && (
            <View style={styles.detailRow}>
              <Typography variant="body" style={{ fontWeight: 'bold' }}>Endereço:</Typography>
              <Typography variant="body" style={{textAlign: 'right', flex: 1}}>
                {`${user.address.street}, ${user.address.number}\n${user.address.city} - ${user.address.state}`}
              </Typography>
            </View>
          )}

          <View style={styles.detailRow}>
            <Typography variant="body" style={{ fontWeight: 'bold' }}>Data de Cadastro:</Typography>
            <Typography variant="body">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </Typography>
          </View>
        </Card>
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
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    // Aumentamos o padding para dar mais "corpo" ao botão
    paddingVertical: theme.spacing.xs,     // Antes era xxs
    paddingHorizontal: theme.spacing.s,  // Antes era xs
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.xs,
    // Adicionado para garantir que o texto fique perfeitamente centralizado
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray
  },
});

export default UserDetailScreen;