import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFormikContext, getIn } from "formik";
import Typography from "../common/Typography";
import Badge from "../common/Badge";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import useCategories from "../../hooks/useCategories";
import { Category } from "../../types/categories.types";
import theme from "../../theme";

export interface CategoryPickerProps {
  name: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  multiple?: boolean;
  showBadge?: boolean;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  name,
  label = "Categorias",
  style,
  required = false,
  multiple = false,
  showBadge = true,
}) => {
  // Estado para acompanhar a seleção atual quando é múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasLoadedCategories, setHasLoadedCategories] = useState(false);

  // Formik context para integração com formulários
  const { values, setFieldValue, touched, errors } = useFormikContext<any>();
  const value = getIn(values, name);
  const error = getIn(touched, name) && getIn(errors, name);

  // Hook otimizado para buscar as categorias
  const {
    categories,
    fetchCategories,
    isLoading,
    error: categoriesError,
    isCacheValid,
  } = useCategories();

  // CORREÇÃO: Garantir que categories seja sempre um array
  const safeCategories = useMemo(() => {
    return Array.isArray(categories) ? categories : [];
  }, [categories]);

  // Carregar categorias apenas uma vez, ou se não houver cache válido
  useEffect(() => {
    const loadCategories = async () => {
      // Verificar se já tentou carregar ou se já tem dados
      if (hasLoadedCategories) {
        return;
      }

      // Se não tem cache válido e não tem categorias, carregar
      if (!isCacheValid && safeCategories.length === 0) {
        console.log("[CategoryPicker] Carregando categorias pela primeira vez");
        try {
          await fetchCategories();
        } catch (error) {
          console.error("[CategoryPicker] Erro ao carregar categorias:", error);
        } finally {
          setHasLoadedCategories(true);
        }
      } else if (safeCategories.length > 0) {
        // Se já tem categorias, marcar como carregado
        setHasLoadedCategories(true);
      }
    };

    loadCategories();
  }, [
    fetchCategories,
    hasLoadedCategories,
    isCacheValid,
    safeCategories.length,
  ]);

  // Sincronizar o estado local com o valor do Formik para seleção múltipla
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedIds(value);
    }
  }, [value, multiple]);

  // Manipulador de seleção de categoria
  const handleSelectCategory = useCallback(
    (category: Category) => {
      if (multiple) {
        setSelectedIds((prevIds) => {
          const newSelectedIds = prevIds.includes(category.id)
            ? prevIds.filter((id) => id !== category.id)
            : [...prevIds, category.id];

          setFieldValue(name, newSelectedIds);
          return newSelectedIds;
        });
      } else {
        setFieldValue(name, category.id);
      }
    },
    [multiple, name, setFieldValue]
  );

  // Verificar se uma categoria está selecionada
  const isCategorySelected = useCallback(
    (categoryId: string) => {
      if (multiple) {
        return selectedIds.includes(categoryId);
      }
      return value === categoryId;
    },
    [multiple, selectedIds, value]
  );

  // Encontrar as categorias selecionadas para exibir os badges
  const selectedCategories = useMemo(() => {
    if (multiple) {
      return safeCategories.filter((category) =>
        selectedIds.includes(category.id)
      );
    }

    const selectedCategory = safeCategories.find(
      (category) => category.id === value
    );
    return selectedCategory ? [selectedCategory] : [];
  }, [safeCategories, multiple, selectedIds, value]);

  // Renderizar item de categoria
  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = isCategorySelected(item.id);

      return (
        <TouchableOpacity
          style={[
            styles.categoryItem,
            isSelected && styles.selectedCategoryItem,
          ]}
          onPress={() => handleSelectCategory(item)}
          activeOpacity={0.7}
        >
          <Typography
            variant="body"
            color={
              isSelected
                ? theme.colors.primary.secondary
                : theme.colors.neutral.black
            }
          >
            {item.name}
          </Typography>

          {item.description && (
            <Typography
              variant="small"
              color={
                isSelected
                  ? theme.colors.primary.secondary
                  : theme.colors.neutral.darkGray
              }
              numberOfLines={1}
            >
              {item.description}
            </Typography>
          )}
        </TouchableOpacity>
      );
    },
    [isCategorySelected, handleSelectCategory]
  );

  // CORREÇÃO: Melhor renderização condicional baseada no estado
  if (isLoading && safeCategories.length === 0 && !hasLoadedCategories) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <View style={styles.labelContainer}>
            <Typography variant="bodySecondary" style={styles.label}>
              {label}
            </Typography>
            {required && (
              <Typography
                variant="bodySecondary"
                color={theme.colors.status.error}
              >
                *
              </Typography>
            )}
          </View>
        )}
        <View style={styles.loadingContainer}>
          <Loading message="Carregando categorias..." size="small" />
        </View>
      </View>
    );
  }

  if (categoriesError && safeCategories.length === 0 && hasLoadedCategories) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <View style={styles.labelContainer}>
            <Typography variant="bodySecondary" style={styles.label}>
              {label}
            </Typography>
            {required && (
              <Typography
                variant="bodySecondary"
                color={theme.colors.status.error}
              >
                *
              </Typography>
            )}
          </View>
        )}
        <ErrorState
          title="Erro ao carregar categorias"
          description="Não foi possível carregar a lista de categorias."
          actionLabel="Tentar novamente"
          onAction={() => {
            setHasLoadedCategories(false);
            fetchCategories(undefined, true);
          }}
          error={categoriesError}
        />
      </View>
    );
  }

  // Se não tem categorias e não está carregando, mostrar estado vazio
  if (safeCategories.length === 0 && hasLoadedCategories && !isLoading) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <View style={styles.labelContainer}>
            <Typography variant="bodySecondary" style={styles.label}>
              {label}
            </Typography>
            {required && (
              <Typography
                variant="bodySecondary"
                color={theme.colors.status.error}
              >
                *
              </Typography>
            )}
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Typography
            variant="bodySecondary"
            color={theme.colors.neutral.darkGray}
            style={styles.emptyText}
          >
            Nenhuma categoria disponível
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Typography variant="bodySecondary" style={styles.label}>
            {label}
          </Typography>
          {required && (
            <Typography
              variant="bodySecondary"
              color={theme.colors.status.error}
            >
              *
            </Typography>
          )}
        </View>
      )}

      {safeCategories.length > 0 && (
        <FlatList
          data={safeCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryListContent}
          scrollEnabled={safeCategories.length > 3} // Só habilita scroll se tiver mais de 3 categorias
          nestedScrollEnabled={true} // Permite scroll aninhado
          extraData={selectedIds} // Força re-render quando seleção muda
          showsVerticalScrollIndicator={false}
        />
      )}

      {error && (
        <Typography
          variant="small"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {error}
        </Typography>
      )}

      {showBadge && selectedCategories.length > 0 && (
        <View style={styles.selectedContainer}>
          <Typography variant="small" style={styles.selectedLabel}>
            Selecionadas:
          </Typography>

          <View style={styles.badgesContainer}>
            {selectedCategories.map((category) => (
              <Badge
                key={category.id}
                label={category.name}
                variant="info"
                style={styles.badge}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  label: {
    marginRight: theme.spacing.xxs,
  },
  loadingContainer: {
    padding: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  emptyContainer: {
    padding: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  emptyText: {
    textAlign: "center",
  },
  categoryList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
    borderRadius: theme.borderRadius.medium,
  },
  categoryListContent: {
    padding: theme.spacing.xs,
  },
  categoryItem: {
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.neutral.mediumGray,
  },
  selectedCategoryItem: {
    borderColor: theme.colors.primary.secondary,
    backgroundColor: theme.colors.primary.secondary + "10", // 10% de opacidade
  },
  errorText: {
    marginTop: theme.spacing.xxs,
  },
  selectedContainer: {
    marginTop: theme.spacing.s,
  },
  selectedLabel: {
    marginBottom: theme.spacing.xxs,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badge: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
});

export default CategoryPicker;
