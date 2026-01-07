import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building2, Home, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CityCombobox } from '@/components/home/CityCombobox';
import heroImage from '@/assets/cities/hero/tel-aviv.jpg';

type SearchCategory = 'for_sale' | 'for_rent' | 'projects';

export function HeroSplit() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [category, setCategory] = useState<SearchCategory>('for_sale');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category === 'projects') {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      navigate(`/projects?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (category) params.set('status', category);
      navigate(`/listings?${params.toString()}`);
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'for_sale': return <Home className="h-4 w-4" />;
      case 'for_rent': return <Key className="h-4 w-4" />;
      case 'projects': return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center">
      {/* Background Image - Full Width */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Israeli cityscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Find Your Place
              <span className="block text-primary">in Israel</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed">
              An English-first platform built for internationals buying or renting in Israel. 
              Explore with clarity, not pressure.
            </p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-4"
            >
              <form onSubmit={handleSearch} className="bg-background rounded-2xl p-3 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* City Combobox */}
                  <div className="flex-1">
                    <CityCombobox
                      value={selectedCity}
                      onValueChange={setSelectedCity}
                      placeholder="Where are you looking?"
                    />
                  </div>

                  {/* Category Select */}
                  <Select value={category} onValueChange={(val) => setCategory(val as SearchCategory)}>
                    <SelectTrigger className="w-full sm:w-[140px] h-12 gap-2">
                      {getCategoryIcon()}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="for_sale">
                        <span className="flex items-center gap-2">Buy</span>
                      </SelectItem>
                      <SelectItem value="for_rent">
                        <span className="flex items-center gap-2">Rent</span>
                      </SelectItem>
                      <SelectItem value="projects">
                        <span className="flex items-center gap-2">New Projects</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search Button */}
                  <Button type="submit" size="lg" className="h-12 px-8 gap-2 rounded-xl">
                    <Search className="h-5 w-5" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-white/60"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                34 Cities
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                500+ Listings
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                9 Free Tools
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
