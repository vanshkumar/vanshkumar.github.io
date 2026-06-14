export const INGREDIENTS = [
  'coffee',
  'steam',
  'milk',
  'water',
  'ice',
  'chocolate',
  'caramel',
  'tea',
];

export const INGREDIENT_META = {
  coffee: { label: 'Coffee', icon: 'bean', color: '#5b3524' },
  steam: { label: 'Steam', icon: 'steam', color: '#d8d3cd' },
  milk: { label: 'Milk', icon: 'drop', color: '#f4efe5' },
  water: { label: 'Water', icon: 'drop', color: '#60a8d8' },
  ice: { label: 'Ice', icon: 'cube', color: '#9bd1e8' },
  chocolate: { label: 'Chocolate', icon: 'square', color: '#6b3f2c' },
  caramel: { label: 'Caramel', icon: 'cube', color: '#cf7f31' },
  tea: { label: 'Tea', icon: 'leaf', color: '#4f8a46' },
};

export function ingredientLabel(id) {
  return INGREDIENT_META[id]?.label ?? id;
}
