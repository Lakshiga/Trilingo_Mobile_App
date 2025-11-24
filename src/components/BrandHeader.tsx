import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface BrandHeaderProps {
  title: string;
  subtitle: string;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ title, subtitle }) => {
  const responsive = useResponsive();
  const styles = getStyles(responsive);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    paddingHorizontal: responsive.wp(5),
    paddingVertical: responsive.hp(2.5),
    alignItems: 'center',
  },
  title: {
    fontSize: responsive.wp(7.5),
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: responsive.hp(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsive.wp(4.2),
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default BrandHeader;
