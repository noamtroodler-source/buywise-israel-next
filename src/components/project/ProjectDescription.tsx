import { motion } from 'framer-motion';
 import { ProjectAmenities } from './ProjectAmenities';

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
         <ProjectAmenities amenities={amenities} />
      )}
    </motion.div>
  );
}
