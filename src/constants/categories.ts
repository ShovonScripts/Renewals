import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { CategoryId } from '@/types';

export interface CategoryMeta {
  id: CategoryId;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  labelKey: string;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  passport: {
    id: 'passport',
    icon: 'airplane-outline',
    color: '#0066CC',
    labelKey: 'category.passport',
  },
  visa: {
    id: 'visa',
    icon: 'globe-outline',
    color: '#7B1FA2',
    labelKey: 'category.visa',
  },
  license: {
    id: 'license',
    icon: 'card-outline',
    color: '#0288D1',
    labelKey: 'category.license',
  },
  id_card: {
    id: 'id_card',
    icon: 'id-card-outline',
    color: '#388E3C',
    labelKey: 'category.id_card',
  },
  vehicle: {
    id: 'vehicle',
    icon: 'car-outline',
    color: '#E65100',
    labelKey: 'category.vehicle',
  },
  insurance: {
    id: 'insurance',
    icon: 'shield-checkmark-outline',
    color: '#C2185B',
    labelKey: 'category.insurance',
  },
  subscription: {
    id: 'subscription',
    icon: 'repeat-outline',
    color: '#00897B',
    labelKey: 'category.subscription',
  },
  warranty: {
    id: 'warranty',
    icon: 'ribbon-outline',
    color: '#F57C00',
    labelKey: 'category.warranty',
  },
  domain_hosting: {
    id: 'domain_hosting',
    icon: 'server-outline',
    color: '#303F9F',
    labelKey: 'category.domain_hosting',
  },
  other: {
    id: 'other',
    icon: 'folder-outline',
    color: '#616161',
    labelKey: 'category.other',
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
