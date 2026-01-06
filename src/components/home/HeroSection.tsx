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

type SearchCategory = 'for_sale' | 'for_rent' | 'projects';

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('for_sale');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category === 'projects') {
      const params = new URLSearchParams();
      if (searchQuery) params.set('city', searchQuery);
      navigate(`/projects?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (searchQuery) params.set('city', searchQuery);
      if (category) params.set('status', category);
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
            Israel Real Estate, Rebuilt for International Buyers
          </h1>
          <p 
            className="text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto"
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}
          >
            English-first discovery. True cost transparency. Market context built into every listing.
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <form onSubmit={handleSearch} className="bg-background rounded-xl p-4 shadow-xl">
              {/* Search Fields */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Where are you considering? Tel Aviv, Jerusalem..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Select value={category} onValueChange={(val) => setCategory(val as SearchCategory)}>
                  <SelectTrigger className="w-full md:w-[160px] h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="for_sale">Buy</SelectItem>
                    <SelectItem value="for_rent">Rent</SelectItem>
                    <SelectItem value="projects">New Projects</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="lg" className="h-12 px-8 gap-2">
                  <Search className="h-5 w-5" />
                  Start Exploring
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Trust Statements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row flex-nowrap justify-center gap-8 md:gap-[100px] mt-12 pt-8 border-t border-primary-foreground/20"
          >
            {[
              { main: "PURPOSE-BUILT", sub: "Not translated from Hebrew" },
              { main: "ISRAEL-FOCUSED TOOLS", sub: "Cost calculators, market insights & context" },
              { main: "INDEPENDENT PLATFORM", sub: "We don't sell. We inform." },
            ].map((statement, index) => (
              <div key={index} className="flex flex-col items-center">
                {/* Yellow dot - 12px diameter */}
                <span className="w-3 h-3 rounded-full bg-accent mb-2" />
                
                {/* Line 1 - Main claim */}
                <span 
                  className="text-lg font-bold text-primary-foreground uppercase"
                  style={{ 
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '1px'
                  }}
                >
                  {statement.main}
                </span>
                
                {/* Line 2 - Reinforcement */}
                <span 
                  className="text-sm font-medium text-primary-foreground/90 mt-2"
                  style={{ 
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '0.3px'
                  }}
                >
                  {statement.sub}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}