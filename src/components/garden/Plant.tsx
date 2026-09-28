/**
 * Plant SVG component for the Garden view.
 * 
 * Renders different SVG shapes based on PlantStage and colored based on HealthState.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect, G } from 'react-native-svg';
import { useTheme } from '@/src/design/theme';
import type { PlantStage, HealthState } from '@/src/types/models';

interface PlantProps {
  stage: PlantStage;
  health: HealthState;
  size?: number;
  color?: string; // Optional custom color (e.g. category color), defaults to health color
  label?: string; // Name of the habit
}

export function Plant({ stage, health, size = 120, color, label }: PlantProps) {
  const theme = useTheme();

  // Determine base color based on health if custom color isn't provided
  let defaultColor = theme.colors.accent;
  if (health === 'ok') defaultColor = '#7FB069';
  if (health === 'wilting') defaultColor = '#D4A843';
  if (health === 'dying') defaultColor = '#C45B3E';

  const fillColor = color || defaultColor;

  // Scale calculations
  const scale = size / 100;
  
  // Render specific SVG paths based on stage
  const renderPlantShape = () => {
    switch (stage) {
      case 'seed':
        return (
          <G transform={`scale(${scale})`}>
            {/* A small seed sleeping in the ground */}
            <Path d="M40 85 Q50 75 60 85 Z" fill={fillColor} />
            <Path d="M20 90 L80 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );
      
      case 'sprout':
        return (
          <G transform={`scale(${scale})`}>
            {/* Small sprout coming out of ground */}
            <Path d="M50 90 Q50 60 40 50 Q45 60 50 65 Q55 60 60 50 Q50 60 50 90 Z" fill={fillColor} />
            <Path d="M20 90 L80 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'sapling':
        return (
          <G transform={`scale(${scale})`}>
            {/* Sapling with a few leaves */}
            <Path d="M48 90 C48 70 45 40 50 30 C55 40 52 70 52 90 Z" fill={theme.colors.textSecondary} />
            <Path d="M48 60 Q30 55 25 40 Q35 50 49 55 Z" fill={fillColor} />
            <Path d="M52 50 Q70 45 75 30 Q65 40 51 45 Z" fill={fillColor} />
            <Path d="M20 90 L80 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'young_tree':
        return (
          <G transform={`scale(${scale})`}>
            {/* Young tree with canopy */}
            <Path d="M45 90 C45 60 48 30 50 20 C52 30 55 60 55 90 Z" fill={theme.colors.textSecondary} />
            <Circle cx="50" cy="35" r="25" fill={fillColor} opacity={0.9} />
            <Circle cx="35" cy="45" r="15" fill={fillColor} opacity={0.8} />
            <Circle cx="65" cy="45" r="15" fill={fillColor} opacity={0.8} />
            <Path d="M20 90 L80 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'mature_tree':
        return (
          <G transform={`scale(${scale})`}>
            {/* Large tree with wide canopy */}
            <Path d="M42 90 C42 50 47 20 50 10 C53 20 58 50 58 90 Z" fill={theme.colors.textSecondary} />
            <Circle cx="50" cy="30" r="30" fill={fillColor} opacity={0.9} />
            <Circle cx="25" cy="45" r="20" fill={fillColor} opacity={0.8} />
            <Circle cx="75" cy="45" r="20" fill={fillColor} opacity={0.8} />
            <Circle cx="35" cy="20" r="18" fill={fillColor} opacity={0.7} />
            <Circle cx="65" cy="20" r="18" fill={fillColor} opacity={0.7} />
            <Path d="M10 90 L90 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'grove':
        return (
          <G transform={`scale(${scale})`}>
            {/* Main tree */}
            <Path d="M45 90 C45 50 48 20 50 10 C52 20 55 50 55 90 Z" fill={theme.colors.textSecondary} />
            <Circle cx="50" cy="30" r="30" fill={fillColor} opacity={0.9} />
            
            {/* Side tree 1 */}
            <Path d="M23 90 C23 60 25 35 25 30 C25 35 27 60 27 90 Z" fill={theme.colors.textSecondary} />
            <Circle cx="25" cy="45" r="20" fill={fillColor} opacity={0.8} />
            
            {/* Side tree 2 */}
            <Path d="M73 90 C73 60 75 35 75 30 C75 35 77 60 77 90 Z" fill={theme.colors.textSecondary} />
            <Circle cx="75" cy="45" r="20" fill={fillColor} opacity={0.8} />
            
            <Path d="M5 90 L95 90" stroke={theme.colors.border} strokeWidth="2" strokeLinecap="round" />
          </G>
        );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size + (label ? 30 : 0) }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {renderPlantShape()}
      </Svg>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
