import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import heroImage from '@/assets/hero-options/family-doorway-orthodox-2.jpg';

type SearchType = 'for_sale' | 'for_rent' | 'projects';

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('for_sale');
  const [propertyType, setPropertyType] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchType === 'projects') {
      const params = new URLSearchParams();
      if (searchQuery) params.set('city', searchQuery);
      navigate(`/projects?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (searchQuery) params.set('city', searchQuery);
      if (searchType) params.set('status', searchType);
      if (propertyType) params.set('type', propertyType);
      navigate(`/listings?${params.toString()}`);
    }
  };

  return (
    <section className="relative min-h-[600px] lg:min-h-[650px]">
      <div className="flex flex-col lg:flex-row">
        {/* Left Content Side */}
        <div className="relative z-10 w-full lg:w-[45%] bg-primary flex items-center justify-center">
          <div className="w-full max-w-xl px-6 py-16 lg:py-20 mx-auto lg:mx-0 lg:px-12 xl:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
                Find Your Perfect Home in Israel
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/90 max-w-lg">
                Discover thousands of properties across Israel. Whether you're buying, renting, or looking for new developments, 
                we'll help you find the right place to call home.
              </p>

              {/* Search Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="pt-2"
              >
                <form onSubmit={handleSearch} className="bg-background rounded-xl p-4 shadow-xl">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={searchType === 'for_sale' ? 'default' : 'outline'}
                      onClick={() => setSearchType('for_sale')}
                      className="flex-1"
                    >
                      Buy
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === 'for_rent' ? 'default' : 'outline'}
                      onClick={() => setSearchType('for_rent')}
                      className="flex-1"
                    >
                      Rent
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === 'projects' ? 'default' : 'outline'}
                      onClick={() => setSearchType('projects')}
                      className="flex-1"
                    >
                      Projects
                    </Button>
                  </div>

                  {/* Search Fields */}
                  <div className="flex flex-col gap-3">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter city, neighborhood, or address"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                    <div className="flex gap-3">
                      {searchType !== 'projects' && (
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger className="flex-1 h-12">
                            <SelectValue placeholder="Property Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="penthouse">Penthouse</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button type="submit" size="lg" className="h-12 px-6 gap-2 flex-1 lg:flex-none">
                        <Search className="h-5 w-5" />
                        Search
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-6 pt-6"
              >
                <div>
                  <div className="text-2xl font-bold text-accent">10K+</div>
                  <div className="text-sm text-primary-foreground/80">Properties</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">500+</div>
                  <div className="text-sm text-primary-foreground/80">Agents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">50+</div>
                  <div className="text-sm text-primary-foreground/80">Cities</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Image Side */}
        <div className="relative w-full lg:w-[55%] min-h-[300px] lg:min-h-[650px]">
          <img
            src={heroImage}
            alt="Family at their new home"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle left edge gradient for seamless blend */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary to-transparent hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
