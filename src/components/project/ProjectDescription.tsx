import { motion } from 'framer-motion';
 import { Badge } from '@/components/ui/badge';
 import { Sparkles } from 'lucide-react';

interface ProjectDescriptionProps {
  description?: string | null;
  amenities?: string[] | null;
}

export function ProjectDescription({ description, amenities }: ProjectDescriptionProps) {
  if (!description && (!amenities || amenities.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">About This Project</h2>
      
      {description && (
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
          {description}
        </p>
      )}
       
       {amenities && amenities.length > 0 && (
         <div className="space-y-3 pt-2">
           <h3 className="text-lg font-semibold flex items-center gap-2">
             <Sparkles className="h-5 w-5 text-primary" />
             Amenities & Features
           </h3>
           <div className="flex flex-wrap gap-2">
             {amenities.map((amenity, index) => (
               <Badge key={index} variant="secondary" className="text-sm font-normal">
                 {amenity}
               </Badge>
             ))}
           </div>
         </div>
      )}
    </motion.div>
  );
}
