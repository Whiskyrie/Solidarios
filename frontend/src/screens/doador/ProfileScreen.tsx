import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Componentes
import { Button, Loading, ErrorState } from "../../components/barrelComponents";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ImpactStatsSection } from "../../components/profile/ImpactStatsSection";
import { ProfileMenu } from "../../components/profile/ProfileMenu";

// Hooks e utilitários
import { useAuth } from "../../hooks/useAuth";
import { useProfileData } from "../../hooks/useProfileData";
import { PROFILE_TEXTS } from "../../components/constants/profileConstants";
import theme from "../../theme";

const ProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const { user, loading, error, stats, fadeAnim, slideAnim, retry } =
    useProfileData();

  const handleLogout = () => {
    Alert.alert(PROFILE_TEXTS.logoutTitle, PROFILE_TEXTS.logoutMessage, [
      { text: PROFILE_TEXTS.logoutCancel, style: "cancel" },
      {
        text: PROFILE_TEXTS.logoutConfirm,
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProfileHeader user={user} />
        <View style={styles.centerContainer}>
          <Loading visible={true} message={PROFILE_TEXTS.loading} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ProfileHeader user={user} />
        <View style={styles.centerContainer}>
          <ErrorState
            title={PROFILE_TEXTS.errorTitle}
            description={error}
            actionLabel={PROFILE_TEXTS.retryButton}
            onAction={retry}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfileHeader user={user} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ImpactStatsSection
          stats={stats}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        <ProfileMenu />

        <Button
          title={PROFILE_TEXTS.logoutTitle}
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
          leftIcon={
            <MaterialIcons
              name="logout"
              size={20}
              color={theme.colors.status.error}
            />
          }
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: theme.spacing.m,
  },
  logoutButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    marginBottom: theme.spacing.m,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default ProfileScreen;
