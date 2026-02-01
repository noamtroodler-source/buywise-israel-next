import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Building2, Home, Key, House, KeyRound, HardHat } from 'lucide-react';
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
      <div className="container relative z-10 py-8 md:py-14">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3 md:space-y-4"
          >
            {/* Headline */}
            <h1 
              className="text-[1.35rem] sm:text-3xl md:text-[2.25rem] lg:text-[2.75rem] font-bold text-white leading-tight tracking-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              Navigate <span className="text-primary">Israel</span> Real Estate
              <span className="block mt-2 sm:mt-3">— With Clarity</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-lg leading-relaxed">
              Built for internationals—transparent costs, market insights, and local context in English. Finally.
            </p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="pt-1 md:pt-2"
            >
              <form onSubmit={handleSearch} className="bg-background rounded-xl p-2 sm:p-2.5 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                    <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-12 gap-2">
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
                        <span className="flex items-center gap-2">Projects</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search Button */}
                  <Button type="submit" className="h-11 px-6 gap-2 rounded-lg">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
                
                {/* First time? Entry point - styled for white background */}
                <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3">
                  First time buying in Israel?{' '}
                  <Link 
                    to="/guides/buying-in-israel" 
                    className="text-primary font-medium hover:underline underline-offset-2"
                  >
                    Start with our guide →
                  </Link>
                </p>
              </form>
            </motion.div>

            {/* Trust Indicators - Pyramid layout on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-1 md:pt-2"
            >
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                {/* Top row on mobile / inline on desktop */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white">
                    <House className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="font-medium">{stats?.forSaleCount ? `${Math.floor(stats.forSaleCount / 5) * 5}+` : '65+'}</span>
                    <span className="text-white/70">For Sale</span>
                  </span>
                  <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white">
                    <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="font-medium">{stats?.rentalsCount ? `${Math.floor(stats.rentalsCount / 5) * 5}+` : '20+'}</span>
                    <span className="text-white/70">Rentals</span>
                  </span>
                </div>
                {/* Bottom centered on mobile / inline on desktop */}
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white">
                  <HardHat className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="font-medium">{stats?.projectsCount ?? 15}+</span>
                  <span className="text-white/70">Projects</span>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
