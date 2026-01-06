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
import heroImage from '@/assets/hero-real-estate.jpg';

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
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight"
            style={{ textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)' }}
          >
            Where Buying in Israel Actually Begins
          </h1>
          <p 
            className="text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto"
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}
          >
            Get clarity on costs, neighborhoods, and timing — on your terms, at your pace.
          </p>
          <p 
            className="text-sm text-primary-foreground/70 font-light"
            style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}
          >
            Most buyers use BuyWise to get oriented before taking action.
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <form onSubmit={handleSearch} className="bg-background rounded-xl p-4 shadow-xl">
              <p className="text-xs text-muted-foreground mb-3 text-center">
                You don't need to know exactly what you're looking for yet.
              </p>
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={searchType === 'for_sale' ? 'default' : 'outline'}
                  onClick={() => setSearchType('for_sale')}
                  className="flex-1 md:flex-none"
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  variant={searchType === 'for_rent' ? 'default' : 'outline'}
                  onClick={() => setSearchType('for_rent')}
                  className="flex-1 md:flex-none"
                >
                  Rent
                </Button>
                <Button
                  type="button"
                  variant={searchType === 'projects' ? 'default' : 'outline'}
                  onClick={() => setSearchType('projects')}
                  className="flex-1 md:flex-none"
                >
                  Projects
                </Button>
              </div>

              {/* Search Fields */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Start exploring — Tel Aviv, Jerusalem, Modiin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                {searchType !== 'projects' && (
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="w-full md:w-[180px] h-12">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button type="submit" size="lg" className="h-12 px-8 gap-2">
                  <Search className="h-5 w-5" />
                  Start Exploring
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center gap-2 mt-10 pt-6 border-t border-primary-foreground/15"
          >
            <p className="text-sm text-primary-foreground/75 font-light" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
              No paid placements. No rush. No pressure.
            </p>
            <p className="text-sm text-primary-foreground/75 font-light" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
              Clarity before conversion is the business model.
            </p>
            <p className="text-sm text-primary-foreground/75 font-light" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
              Agents come in when they help — not before.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}