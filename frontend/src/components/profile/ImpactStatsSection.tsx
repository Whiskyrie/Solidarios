import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Typography } from "../barrelComponents";
import { StatCard, StatCardProps } from "./StatsCard";
import theme from "../../theme/index";

interface ImpactStatsSectionProps {
  stats: {
    totalDonations: number;
    distributedItems: number;
    peopleHelped: number;
  };
  fadeAnim?: Animated.Value;
  slideAnim?: Animated.Value;
}

export const ImpactStatsSection: React.FC<ImpactStatsSectionProps> = React.memo(
  ({ stats, fadeAnim, slideAnim }) => {
    // Debug apenas uma vez
    console.log("ImpactStatsSection - stats:", stats);

    const statsData: StatCardProps[] = [
      {
        icon: "favorite",
        iconColor: "#FFFFFF",
        gradientColors: ["#FF6B6B", "#FF8E8E"],
        value: stats.totalDonations || 0,
        label: "Doações",
        subtitle: "realizadas",
      },
      {
        icon: "inventory",
        iconColor: "#FFFFFF",
        gradientColors: ["#4ECDC4", "#44B3A8"],
        value: stats.distributedItems || 0,
        label: "Itens",
        subtitle: "distribuídos",
      },
      {
        icon: "groups",
        iconColor: "#FFFFFF",
        gradientColors: ["#45B7D1", "#4A90E2"],
        value: stats.peopleHelped || 0,
        label: "Pessoas",
        subtitle: "ajudadas",
      },
    ];

    return (
      <View style={styles.impactSection}>
        <Typography variant="h4" style={styles.sectionTitle}>
          Seu Impacto Social
        </Typography>
        <Typography variant="bodySecondary" style={styles.sectionSubtitle}>
          Veja como suas doações transformam vidas
        </Typography>

        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View
              key={`stat-${index}-${stat.label}`}
              style={styles.statCardWrapper}
            >
              <StatCard {...stat} fadeAnim={fadeAnim} slideAnim={slideAnim} />
            </View>
          ))}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  impactSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
    color: theme.colors.neutral.black,
  },
  sectionSubtitle: {
    color: theme.colors.neutral.darkGray,
    marginBottom: theme.spacing.l,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -theme.spacing.xs,
  },
  statCardWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
});
