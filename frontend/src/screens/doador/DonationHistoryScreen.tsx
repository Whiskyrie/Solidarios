import React from "react";
import { View, StyleSheet } from "react-native";
import Typography from "../../components/common/Typography";
import theme from "../../theme";

const DonationHistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Typography variant="h3">Histórico de Doações</Typography>
      {/* ...implementar lista de histórico */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
  },
});

export default DonationHistoryScreen;
