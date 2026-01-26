import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Home, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CitySearchInput } from '@/components/home/CitySearchInput';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import heroImage from '@/assets/cities/hero/tel-aviv.jpg';

type SearchCategory = 'for_sale' | 'for_rent' | 'projects';

export function HeroSplit() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [category, setCategory] = useState<SearchCategory>('for_sale');
  const { data: stats } = usePlatformStats();

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
    <section className="relative min-h-[50vh] md:min-h-[55vh] flex items-center">
      {/* Background Image - Full Width */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Israeli cityscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/45 to-foreground/15" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-10 md:py-14">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              <span className="text-primary">Israel</span> Real Estate,
              <span className="block">Reinvented for You</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-white/80 max-w-lg leading-relaxed">
              Built for internationals—transparent costs, market insights, and local context in English. Finally.
            </p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="pt-2"
            >
              <form onSubmit={handleSearch} className="bg-background rounded-xl p-2.5 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* City Search Input */}
                  <div className="flex-1">
                    <CitySearchInput
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
                  <Button type="submit" className="h-11 px-6 gap-2 rounded-lg">
                    <Search className="h-4 w-4" />
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
              className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-white/70"
            >
              <span className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-accent" />
                {stats?.forSaleCount ? `${Math.floor(stats.forSaleCount / 5) * 5}+` : '65+'} For Sale
              </span>
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-accent" />
                {stats?.rentalsCount ? `${Math.floor(stats.rentalsCount / 5) * 5}+` : '20+'} Rentals
              </span>
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                {stats?.projectsCount ?? 15} Projects
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
