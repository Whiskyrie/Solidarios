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
import theme from "../../theme";

const { width, height } = Dimensions.get("window");

const SplashScreen: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  // Animações principais
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [animationComplete, setAnimationComplete] = useState(false);
  const [allAnimationsFinished, setAllAnimationsFinished] = useState(false);

  // Converter rotação para string interpolada
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  // Interpolar a escala do efeito de pulso
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.05, 0.95],
  });

  // Iniciar todas as animações uma única vez
  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];
    let completedAnimations = 0;
    const totalAnimations = 3; // Agora temos 3 animações para acompanhar (spin, pulse, main)

    // Função para verificar se todas as animações terminaram
    const checkAllAnimationsFinished = () => {
      completedAnimations++;
      if (completedAnimations >= totalAnimations) {
        setAllAnimationsFinished(true);
        // Chamar callback quando todas as animações estiverem concluídas
        if (onFinish) {
          setTimeout(onFinish, 500); // Um pequeno atraso para garantir que tudo está renderizado
        }
      }
    };

    // Animação de rotação contínua
    const spinAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(rotateAnim, {
          toValue: 2,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
      { iterations: 2 }
    );
    animations.push(spinAnimation);

    // Animação de pulsação contínua
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
      { iterations: 4 }
    );
    animations.push(pulseAnimation);

    // Sequência de animação principal
    const mainAnimation = Animated.sequence([
      // 1. Fade in e zoom inicial
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),

      // 2. Scale down para tamanho normal com bounce
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.7)),
      }),
    ]);
    animations.push(mainAnimation);

    // Iniciar todas as animações com callbacks para verificar o término
    spinAnimation.start(({ finished }) => {
      if (finished) checkAllAnimationsFinished();
    });

    pulseAnimation.start(({ finished }) => {
      if (finished) checkAllAnimationsFinished();
    });

    // Iniciar animação principal com callback
    mainAnimation.start(({ finished }) => {
      if (finished) {
        setAnimationComplete(true);
        checkAllAnimationsFinished();
      }
    });

    // Limpar animações quando o componente for desmontado
    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, []);

  // Função para pular a animação
  const skipAnimation = () => {
    if (onFinish && !allAnimationsFinished) {
      setAllAnimationsFinished(true);
      onFinish();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={skipAnimation}>
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Conteúdo animado */}
        <View style={styles.contentContainer}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate },
                  { scale: pulseScale },
                ],
              },
            ]}
          >
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary.main, // Fundo escuro para contraste com a logo
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 220,
    height: 220,
  },
});

export default SplashScreen;
