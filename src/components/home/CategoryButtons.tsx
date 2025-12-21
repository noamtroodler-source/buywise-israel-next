import { Link } from 'react-router-dom';
import { Building2, Home, Castle, Trees, Landmark, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { 
    id: 'apartment', 
    label: 'Apartments', 
    icon: Building2,
    description: 'Modern living spaces'
  },
  { 
    id: 'house', 
    label: 'Houses', 
    icon: Home,
    description: 'Family homes'
  },
  { 
    id: 'penthouse', 
    label: 'Penthouses', 
    icon: Castle,
    description: 'Luxury living'
  },
  { 
    id: 'cottage', 
    label: 'Cottages', 
    icon: Trees,
    description: 'Rural retreats'
  },
  { 
    id: 'land', 
    label: 'Land', 
    icon: Landmark,
    description: 'Build your dream'
  },
  { 
    id: 'commercial', 
    label: 'Commercial', 
    icon: Store,
    description: 'Business spaces'
  },
];

export function CategoryButtons() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Browse by Property Type
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find the perfect property that matches your lifestyle and needs
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={`/listings?type=${category.id}`}
                className="flex flex-col items-center p-6 rounded-xl bg-background border border-border hover:border-primary hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <category.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {category.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}