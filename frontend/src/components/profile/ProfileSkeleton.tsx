import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import theme from "../../theme";

/**
 * Componente de skeleton para carregamento da tela de perfil
 */
const ProfileSkeleton: React.FC = () => {
  // Animação de shimmer
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
    return () => {
      shimmerValue.stopAnimation();
    };
  }, [shimmerValue]);

  // Cor de shimmer animada
  const shimmerColor = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      "rgba(220, 220, 220, 0.5)",
      "rgba(240, 240, 240, 0.8)",
      "rgba(220, 220, 220, 0.5)",
    ],
  });

  // Renderiza um item de skeleton
  const SkeletonItem = ({
    width,
    height,
    style,
  }: {
    width: number | string;
    height: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        styles.skeletonItem,
        { width, height, backgroundColor: shimmerColor },
        style,
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Cartão de contato skeleton */}
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <SkeletonItem width="50%" height={24} />
          <SkeletonItem width={60} height={24} style={{ borderRadius: 12 }} />
        </View>

        <View style={styles.contactRow}>
          <SkeletonItem width={24} height={24} style={{ borderRadius: 12 }} />
          <View style={{ marginLeft: theme.spacing.s, flex: 1 }}>
            <SkeletonItem width="30%" height={16} />
            <SkeletonItem width="70%" height={20} style={{ marginTop: 6 }} />
          </View>
        </View>

        <View style={[styles.contactRow, { marginTop: theme.spacing.s }]}>
          <SkeletonItem width={24} height={24} style={{ borderRadius: 12 }} />
          <View style={{ marginLeft: theme.spacing.s, flex: 1 }}>
            <SkeletonItem width="30%" height={16} />
            <SkeletonItem width="80%" height={20} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Cards de estatísticas skeleton */}
      <View style={styles.statsCard}>
        <SkeletonItem width="100%" height={40} />
        <View style={styles.statsRow}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.statItem}>
              <SkeletonItem
                width={50}
                height={50}
                style={{ borderRadius: 25, marginBottom: theme.spacing.xs }}
              />
              <SkeletonItem
                width={40}
                height={24}
                style={{ borderRadius: 4 }}
              />
              <SkeletonItem
                width={70}
                height={16}
                style={{ marginTop: 8, borderRadius: 4 }}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Menu skeleton */}
      <View style={styles.menuCard}>
        {[1, 2, 3].map((_, index) => (
          <React.Fragment key={index}>
            <View style={styles.menuItem}>
              <SkeletonItem
                width={40}
                height={40}
                style={{ borderRadius: 8, marginRight: theme.spacing.s }}
              />
              <SkeletonItem width="60%" height={24} />
              <SkeletonItem
                width={24}
                height={24}
                style={{ marginLeft: "auto", borderRadius: 12 }}
              />
            </View>
            {index < 2 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Botão de logout skeleton */}
      <SkeletonItem
        width="100%"
        height={50}
        style={{
          borderRadius: theme.borderRadius.medium,
          marginTop: theme.spacing.m,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  contactCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.medium,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.m,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statsCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.medium,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.m,
  },
  statItem: {
    alignItems: "center",
  },
  menuCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.m,
    ...theme.shadows.medium,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral.mediumGray,
    marginHorizontal: theme.spacing.m,
  },
  skeletonItem: {
    borderRadius: 4,
  },
});

export default ProfileSkeleton;
