import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Typography from '../common/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AnimatedStatsCardProps {
  donations: number;
  peopleHelped: number;
  impact: number;
}

/**
 * Componente para exibição animada das estatísticas do usuário
 */
const AnimatedStatsCard: React.FC<AnimatedStatsCardProps> = ({
  donations,
  peopleHelped,
  impact,
}) => {
  // Estados para valores animados
  const [displayedDonations, setDisplayedDonations] = useState(0);
  const [displayedPeopleHelped, setDisplayedPeopleHelped] = useState(0);
  const [displayedImpact, setDisplayedImpact] = useState(0);
  
  // Ref para animação de scale
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Função de animação ao pressionar
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Animar incremento dos números
  useEffect(() => {
    const duration = 1500; // Duração da animação em ms
    const frames = 60; // Quantidade de frames
    const interval = duration / frames;
    
    let donationsCounter = 0;
    let peopleCounter = 0;
    let impactCounter = 0;
    
    const animate = () => {
      const donationsIncrement = donations / frames;
      const peopleIncrement = peopleHelped / frames;
      const impactIncrement = impact / frames;
      
      const timer = setInterval(() => {
        donationsCounter += donationsIncrement;
        peopleCounter += peopleIncrement;
        impactCounter += impactIncrement;
        
        if (donationsCounter >= donations) {
          donationsCounter = donations;
        }
        
        if (peopleCounter >= peopleHelped) {
          peopleCounter = peopleHelped;
        }
        
        if (impactCounter >= impact) {
          impactCounter = impact;
        }
        
        setDisplayedDonations(Math.floor(donationsCounter));
        setDisplayedPeopleHelped(Math.floor(peopleCounter));
        setDisplayedImpact(Math.floor(impactCounter));
        
        if (
          donationsCounter >= donations && 
          peopleCounter >= peopleHelped && 
          impactCounter >= impact
        ) {
          clearInterval(timer);
        }
      }, interval);
      
      return () => clearInterval(timer);
    };
    
    const timeout = setTimeout(animate, 300);
    return () => clearTimeout(timeout);
  }, [donations, peopleHelped, impact]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel="Estatísticas de impacto social"
    >
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <LinearGradient
          colors={["#173F5F", "#006E58"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Typography variant="h3" color="#fff" style={styles.title}>
            Meu Impacto Social
          </Typography>
        </LinearGradient>
        
        <View style={styles.content}>
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name="volunteer-activism" 
                size={24} 
                color={theme.colors.primary.secondary} 
              />
            </View>
            <Typography 
              variant="h2" 
              color={theme.colors.primary.secondary}
              style={styles.statValue}
            >
              {displayedDonations}
            </Typography>
            <Typography 
              variant="small" 
              color={theme.colors.neutral.darkGray}
              style={styles.statLabel}
            >
              Doações Realizadas
            </Typography>
          </View>

          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name="people" 
                size={24} 
                color={theme.colors.primary.secondary} 
              />
            </View>
            <Typography 
              variant="h2" 
              color={theme.colors.primary.secondary}
              style={styles.statValue}
            >
              {displayedPeopleHelped}
            </Typography>
            <Typography 
              variant="small" 
              color={theme.colors.neutral.darkGray}
              style={styles.statLabel}
            >
              Pessoas Ajudadas
            </Typography>
          </View>

          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name="emoji-events" 
                size={24} 
                color={theme.colors.primary.secondary} 
              />
            </View>
            <Typography 
              variant="h2" 
              color={theme.colors.primary.secondary}
              style={styles.statValue}
            >
              {displayedImpact}
            </Typography>
            <Typography 
              variant="small" 
              color={theme.colors.neutral.darkGray}
              style={styles.statLabel}
            >
              Pontos de Impacto
            </Typography>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.white,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  header: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderTopLeftRadius: theme.borderRadius.medium,
    borderTopRightRadius: theme.borderRadius.medium,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.m,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default AnimatedStatsCard;