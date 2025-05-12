import React, { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from "react-native";
import theme from "../../theme";
import Typography from "../../components/common/Typography";

const SplashScreen: React.FC = () => {
  // Animação para o logo
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Círculo decorativo superior direito */}
      <View style={styles.topCircle} />

      {/* Círculo decorativo inferior esquerdo */}
      <View style={styles.bottomCircle} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo do app */}
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Typography variant="h2" style={styles.appName}>
          Solidarios
        </Typography>

        <ActivityIndicator
          size="large"
          color={theme.colors.primary.secondary}
          style={styles.loader}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.white,
    overflow: "hidden",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.s,
  },
  appName: {
    fontWeight: "bold",
    color: theme.colors.neutral.black,
    textTransform: "lowercase",
    fontSize: 36,
    margin: 0,
    padding: 0,
  },
  subtitle: {
    color: theme.colors.neutral.black,
    letterSpacing: 4,
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xl,
  },
  loader: {
    marginTop: theme.spacing.m,
  },
  topCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary.accent,
    top: -80,
    right: -80,
  },
  bottomCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.primary.accent,
    bottom: -100,
    left: -100,
  },
});

export default SplashScreen;
