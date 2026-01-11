import { ChevronDown, ChevronRight, Target, Search, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FavoriteCategory } from '@/hooks/useFavorites';

interface FavoritesSectionHeaderProps {
  category: FavoriteCategory;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const categoryConfig = {
  final_list: {
    icon: Target,
    title: 'Final List',
    description: 'Properties you\'re seriously considering',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  considering: {
    icon: Search,
    title: 'Considering',
    description: 'Properties you like but haven\'t decided yet',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  ruled_out: {
    icon: XCircle,
    title: 'Ruled Out',
    description: 'Properties you\'ve decided against',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
};

export function FavoritesSectionHeader({ 
  category, 
  count, 
  isExpanded, 
  onToggle 
}: FavoritesSectionHeaderProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <motion.button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-lg ${config.bgColor} hover:opacity-90 transition-opacity`}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-background`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {config.title}
            <span className="text-sm font-normal text-muted-foreground">
              ({count})
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
      <div className="text-muted-foreground">
        {isExpanded ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </div>
    </motion.button>
  );
}