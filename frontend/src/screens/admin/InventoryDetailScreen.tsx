import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AdminInventoryStackParamList } from "../../navigation/types";

// Componentes
import {
  Header,
  Typography,
  Button,
  TextField,
  Loading,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useInventory } from "../../hooks/useInventory";

const InventoryDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminInventoryStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  useAuth();
  const {
    inventoryItem,
    isLoading,
    error,
    fetchInventoryById,
    updateInventoryItem, // Corrigido para o nome correto da função
    clearError,
  } = useInventory();

  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [alertLevel, setAlertLevel] = useState("");

  useEffect(() => {
    fetchInventoryById(id);
  }, [id, fetchInventoryById]);

  useEffect(() => {
    if (inventoryItem) {
      setQuantity(inventoryItem.quantity.toString());
      setAlertLevel(inventoryItem.alertLevel?.toString() || "");
    }
  }, [inventoryItem]);

  const handleSave = async () => {
    if (!inventoryItem) return;
    await updateInventoryItem(inventoryItem.id, {
      quantity: parseInt(quantity),
      alertLevel: alertLevel ? parseInt(alertLevel) : undefined,
    });
    setIsEditing(false);
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
          fetchInventoryById(id);
        }}
      />
    );
  }

  if (!inventoryItem) {
    return (
      <ErrorState
        title="Item não encontrado"
        description="O item de inventário não foi encontrado."
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={inventoryItem.item.description}
        subtitle={`Local: ${inventoryItem.location || "Não especificado"}`}
        backgroundColor={theme.colors.primary.accent}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Typography variant="bodySecondary" style={styles.label}>
            Categoria:
          </Typography>
          <Typography variant="body" style={styles.value}>
            {inventoryItem.item.category?.name || "Sem categoria"}
          </Typography>

          <Typography variant="bodySecondary" style={styles.label}>
            Descrição:
          </Typography>
          <Typography variant="body" style={styles.value}>
            {inventoryItem.item.description}
          </Typography>

          <Typography variant="bodySecondary" style={styles.label}>
            Localização:
          </Typography>
          <Typography variant="body" style={styles.value}>
            {inventoryItem.location || "Não especificado"}
          </Typography>

          {isEditing ? (
            <>
              <Typography variant="bodySecondary" style={styles.label}>
                Quantidade:
              </Typography>
              <TextField
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Digite a quantidade"
                containerStyle={styles.input}
              />
              <Typography variant="bodySecondary" style={styles.label}>
                Nível de Alerta:
              </Typography>
              <TextField
                value={alertLevel}
                onChangeText={setAlertLevel}
                keyboardType="numeric"
                placeholder="Digite o nível de alerta (opcional)"
                containerStyle={styles.input}
              />
            </>
          ) : (
            <>
              <Typography variant="bodySecondary" style={styles.label}>
                Quantidade:
              </Typography>
              <Typography
                variant="body"
                style={[
                  styles.value,
                  inventoryItem.quantity <= (inventoryItem.alertLevel || 0) &&
                    styles.lowStock,
                ]}
              >
                {inventoryItem.quantity}
              </Typography>
              <Typography variant="bodySecondary" style={styles.label}>
                Nível de Alerta:
              </Typography>
              <Typography variant="body" style={styles.value}>
                {inventoryItem.alertLevel || "Não definido"}
              </Typography>
            </>
          )}

          <Typography variant="bodySecondary" style={styles.label}>
            Última Atualização:
          </Typography>
          <Typography variant="body" style={styles.value}>
            {new Date(inventoryItem.updatedAt).toLocaleDateString()}
          </Typography>
        </View>

        <View style={styles.actions}>
          {isEditing ? (
            <>
              <Button
                title="Salvar"
                onPress={handleSave}
                style={styles.saveButton}
              />
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => {
                  setIsEditing(false);
                  setQuantity(inventoryItem.quantity.toString());
                  setAlertLevel(inventoryItem.alertLevel?.toString() || "");
                }}
                style={styles.cancelButton}
              />
            </>
          ) : (
            <Button
              title="Editar"
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            />
          )}
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
    padding: theme.spacing.m,
  },
  infoCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    elevation: 2,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontWeight: "bold",
    marginBottom: theme.spacing.xxs,
  },
  value: {
    marginBottom: theme.spacing.s,
  },
  lowStock: {
    color: theme.colors.status.error,
    fontWeight: "bold",
  },
  input: {
    marginBottom: theme.spacing.s,
  },
  actions: {
    marginTop: theme.spacing.m,
  },
  editButton: {
    backgroundColor: theme.colors.primary.accent,
  },
  saveButton: {
    backgroundColor: theme.colors.status.success,
    marginBottom: theme.spacing.s,
  },
  cancelButton: {
    borderColor: theme.colors.status.error,
    color: theme.colors.status.error,
  },
});

export default InventoryDetailScreen;
