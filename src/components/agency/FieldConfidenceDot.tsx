import { cn } from '@/lib/utils';

type Level = 'green' | 'yellow' | 'red';

const dotColors: Record<Level, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export function getFieldConfidence(key: string, value: any, data: any): Level {
  switch (key) {
    case 'price':
      if (!value || value === 0) return 'red';
      if (value < 50000 || value > 50000000) return 'yellow';
      return 'green';
    case 'bedrooms':
      if (value == null) return 'red';
      if (value > 10) return 'yellow';
      return 'green';
    case 'bathrooms':
      if (value == null) return 'yellow';
      return 'green';
    case 'size_sqm':
      if (!value) return 'red';
      if (data.bedrooms && (value < data.bedrooms * 10 || value > data.bedrooms * 100)) return 'yellow';
      return 'green';
    case 'city':
      return value ? 'green' : 'red';
    case 'address':
      if (!value) return 'red';
      if (/\d/.test(value)) return 'green';
      return 'yellow';
    case 'neighborhood':
      return value ? 'green' : 'yellow';
    case 'property_type':
      return value ? 'green' : 'yellow';
    case 'Photos':
      if (!value || value === 0) return 'red';
      if (value < 3) return 'yellow';
      return 'green';
    default:
      return value != null && value !== '' ? 'green' : 'yellow';
  }
}

export function FieldConfidenceDot({ level }: { level: Level }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', dotColors[level])} />
  );
}
