import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { AdminDistributionsStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  TextField,
  Button,
  Select,
  NotificationBanner,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useDistributions } from "../../hooks/useDistributions";
import { useUsers } from "../../hooks/useUsers";
import { useItems } from "../../hooks/useItems";
import { UserRole } from "../../types/users.types";

// Validação do formulário
const CreateDistributionSchema = Yup.object().shape({
  beneficiaryId: Yup.string().required("Beneficiário é obrigatório"),
  itemIds: Yup.array()
    .min(1, "Selecione pelo menos um item")
    .required("Itens são obrigatórios"),
  date: Yup.date().required("Data é obrigatória"),
  observations: Yup.string().notRequired(),
});

const CreateDistributionScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<AdminDistributionsStackParamList>>();
  const { createDistribution, isLoading, error, clearError } =
    useDistributions();
  const { users, fetchUsersByRole } = useUsers();
  const { items, fetchItems } = useItems();
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
    description: "",
  });

  useEffect(() => {
    fetchUsersByRole(UserRole.BENEFICIARIO);
    fetchItems(); // Remove the status filter as it is not supported by PageOptionsDto
  }, [fetchUsersByRole, fetchItems]);

  // Função para criar uma nova distribuição
  const handleCreateDistribution = async (values: any) => {
    try {
      const newDistribution = await createDistribution(values);

      if (newDistribution) {
        setNotification({
          visible: true,
          type: "success",
          message: "Distribuição criada com sucesso!",
          description: "A distribuição foi registrada no sistema.",
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err) {
      setNotification({
        visible: true,
        type: "error",
        message: "Erro ao criar distribuição.",
        description: "Não foi possível criar a distribuição. Tente novamente.",
      });
    }
  };

  // Opções de beneficiários
  const beneficiaryOptions = users.map((user) => ({
    label: user.name,
    value: user.id,
  }));

  // Opções de itens
  const itemOptions = items.map((item) => ({
    label: item.description,
    value: item.id,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header
        title="Criar Nova Distribuição"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.main}
      />

      <NotificationBanner
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        description={notification.description}
        onClose={() => setNotification({ ...notification, visible: false })}
      />

      <NotificationBanner
        visible={!!error}
        type="error"
        message="Erro ao criar distribuição"
        description={error || "Ocorreu um erro. Tente novamente."}
        onClose={clearError}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h3" style={styles.title}>
          Registro de Distribuição
        </Typography>

        <Formik
          initialValues={{
            beneficiaryId: "",
            itemIds: [] as string[], // Explicitamente tipado como string[]
            date: new Date().toISOString(),
            observations: "",
          }}
          validationSchema={CreateDistributionSchema}
          onSubmit={handleCreateDistribution}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              <Select
                label="Beneficiário"
                options={beneficiaryOptions}
                selectedValue={values.beneficiaryId}
                onSelect={(value) => setFieldValue("beneficiaryId", value)}
                error={
                  touched.beneficiaryId && errors.beneficiaryId
                    ? errors.beneficiaryId
                    : undefined
                }
              />

              <Select
                label="Itens Distribuídos"
                options={itemOptions}
                selectedValue={
                  values.itemIds.length > 0 ? values.itemIds[0] : undefined
                }
                onSelect={(value) => {
                  const selectedValue = value as string | number;
                  setFieldValue(
                    "itemIds",
                    typeof selectedValue === "string"
                      ? [selectedValue]
                      : [String(selectedValue)]
                  );
                }}
                error={
                  touched.itemIds && errors.itemIds
                    ? Array.isArray(errors.itemIds)
                      ? errors.itemIds.join(", ")
                      : errors.itemIds
                    : undefined
                }
              />

              <TextField
                label="Data da Distribuição"
                value={new Date(values.date).toLocaleDateString()}
                onChangeText={(text) =>
                  setFieldValue("date", new Date(text).toISOString())
                }
                onBlur={handleBlur("date")}
                error={touched.date && errors.date ? errors.date : undefined}
                placeholder="Data da distribuição"
              />

              <TextField
                label="Observações"
                value={values.observations}
                onChangeText={handleChange("observations")}
                onBlur={handleBlur("observations")}
                placeholder="Observações sobre a distribuição"
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonsContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.buttonCancel}
                />
                <Button
                  title="Criar Distribuição"
                  onPress={() => handleSubmit()}
                  loading={isLoading}
                  style={styles.buttonSubmit}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: theme.spacing.m,
  },
  title: {
    marginBottom: theme.spacing.m,
  },
  form: {
    width: "100%",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.m,
  },
  buttonCancel: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  buttonSubmit: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.primary.secondary,
  },
});

export default CreateDistributionScreen;
