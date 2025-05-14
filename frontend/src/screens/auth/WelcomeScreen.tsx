import React, { useRef, useEffect } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import theme from "../../theme";
import { AUTH_ROUTES } from "../../navigation/routes";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

const { width, height } = Dimensions.get("window");

const WelcomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Executar animações em sequência
    Animated.sequence([
      // Primeiro anima o logo
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      // Depois fade-in e slide do texto e botões
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <LinearGradient
        colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Logo Animado */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Conteúdo de texto animado */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Bem-vindo ao Solidários</Text>
          <Text style={styles.subtitle}>
            Conectando quem pode doar a quem precisa receber
          </Text>
        </Animated.View>

        {/* Botões animados */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#173F5F", "#006E58"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate(AUTH_ROUTES.REGISTER as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>Criar uma conta</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Rodapé animado */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.footerText}>© 2025 Solidários</Text>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 220,
    maxHeight: 220,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: height * 0.05,
    width: "90%",
    maxWidth: 350,
  },
  title: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary.main,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 16,
    color: theme.colors.neutral.darkGray,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  loginButton: {
    width: "100%",
    marginBottom: 18,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontFamily: theme.fontFamily.primary,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary.secondary,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  registerButtonText: {
    fontFamily: theme.fontFamily.primary,
    color: theme.colors.primary.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 30,
  },
  footerText: {
    fontFamily: theme.fontFamily.primary,
    fontSize: 12,
    color: theme.colors.neutral.darkGray,
  },
});

export default WelcomeScreen;
