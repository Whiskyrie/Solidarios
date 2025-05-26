import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../theme";

const { width, height } = Dimensions.get("window");

// Constantes de timing para melhor previsibilidade
const SPLASH_DURATION = 3000; // 3 segundos fixos
const ANIMATION_DURATION = 2500; // 500ms buffer antes do finish

const SplashScreen: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  // Animações simplificadas - apenas 2 principais
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [animationComplete, setAnimationComplete] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Interpolar a escala do efeito de pulso (mais sutil)
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02], // Menos agressivo que antes
  });

  // Combinar escalas para efeito final
  const combinedScale = Animated.multiply(scaleAnim, pulseScale);

  useEffect(() => {
    // Permitir skip após 1 segundo
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 1000);

    // Timer principal da splash - sempre 3 segundos
    const finishTimer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, SPLASH_DURATION);

    // Animação principal simplificada
    const mainAnimation = Animated.sequence([
      // 1. Entrada suave - fade + scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),

      // 2. Settle para tamanho final
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)), // Bounce mais suave
      }),
    ]);

    // Animação de pulsação sutil
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
      { iterations: 2 } // Apenas 2 pulsos
    );

    // Iniciar animações
    mainAnimation.start(({ finished }) => {
      if (finished) {
        setAnimationComplete(true);
      }
    });

    pulseAnimation.start();

    // Cleanup
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(finishTimer);
      mainAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  // Função para pular a animação (apenas se permitido)
  const skipAnimation = () => {
    if (onFinish && canSkip) {
      onFinish();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={skipAnimation}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Background com gradiente consistente */}
        <LinearGradient
          colors={["#b0e6f2", "#e3f7ff", "#ffffff"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Conteúdo animado */}
          <View style={styles.contentContainer}>
            {/* Logo com tamanho otimizado */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: combinedScale }],
                },
              ]}
            >
              <Image
                source={require("../../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Logo do aplicativo"
              />
            </Animated.View>

            {/* Indicador sutil de que pode tocar para pular */}
            {canSkip && (
              <Animated.View
                style={[
                  styles.skipIndicator,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <View style={styles.skipDot} />
              </Animated.View>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
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
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    // Adicionar sombra sutil para profundidade
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 160, // Reduzido de 220px para melhor proporção
    height: 160,
  },
  skipIndicator: {
    position: "absolute",
    bottom: -60,
    alignItems: "center",
  },
  skipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
});

export default SplashScreen;
