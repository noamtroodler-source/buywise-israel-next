import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PropertyDescriptionProps {
  description?: string | null;
}

export function PropertyDescription({ description }: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;
  const shouldTruncate = description && description.length > maxLength;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-3"
    >
      <h2 className="text-xl font-semibold text-foreground">About This Property</h2>
      {description ? (
        <div className="relative">
          <p className="text-muted-foreground leading-relaxed">
            {shouldTruncate && !isExpanded 
              ? `${description.slice(0, maxLength)}...` 
              : description}
          </p>
          {shouldTruncate && (
            <Button 
              variant="link" 
              className="px-0 h-auto text-primary"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>Read more <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No description available.</p>
      )}
    </motion.div>
  );
}
