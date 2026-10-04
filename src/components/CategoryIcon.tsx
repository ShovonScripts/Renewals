/* eslint-disable import/no-unresolved */
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CATEGORIES } from '@/constants/categories';
import type { CategoryId } from '@/types';

export interface CategoryIconProps {
  category: CategoryId;
  size?: number;
}

export function CategoryIcon({ category, size = 24 }: CategoryIconProps) {
  const meta = CATEGORIES[category] || CATEGORIES.other;

  return (
    <View style={[styles.container, { backgroundColor: meta.color + '20' }]}>
      <Ionicons name={meta.icon} size={size} color={meta.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
