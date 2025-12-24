import { MapPin, ExternalLink, Train, GraduationCap, ShoppingBag, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyLocationProps {
  address: string;
  city: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function PropertyLocation({ 
  address, 
  city, 
  neighborhood,
  latitude,
  longitude,
}: PropertyLocationProps) {
  const fullAddress = `${address}${neighborhood ? `, ${neighborhood}` : ''}, ${city}, Israel`;
  
  const openGoogleMaps = () => {
    const query = latitude && longitude 
      ? `${latitude},${longitude}`
      : encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openWaze = () => {
    const query = latitude && longitude 
      ? `ll=${latitude},${longitude}`
      : `q=${encodeURIComponent(fullAddress)}`;
    window.open(`https://waze.com/ul?${query}&navigate=yes`, '_blank');
  };

  // Mock nearby essentials data - in production this would come from an API
  const nearbyEssentials = [
    { category: 'Synagogues', icon: Building, items: ['Great Synagogue (0.3 km)', 'Bet Knesset Shalom (0.5 km)'] },
    { category: 'Schools', icon: GraduationCap, items: ['International School (1.2 km)', 'Talmud Torah (0.8 km)'] },
    { category: 'Shopping', icon: ShoppingBag, items: ['City Mall (0.6 km)', 'Supermarket (0.2 km)'] },
    { category: 'Transport', icon: Train, items: ['Bus Stop (0.1 km)', 'Train Station (1.5 km)'] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Location</h3>
      </div>
      
      <div className="space-y-5">
        {/* Address & Map Links */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-foreground">{fullAddress}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openGoogleMaps} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Google Maps
            </Button>
            <Button variant="outline" size="sm" onClick={openWaze} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Waze
            </Button>
          </div>
        </div>

        {/* Nearby Essentials */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Nearby Essentials</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nearbyEssentials.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm text-foreground">{category.category}</span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {category.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* About the City */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <h4 className="font-medium text-foreground mb-2">About {city}</h4>
          <p className="text-sm text-muted-foreground">
            Discover more about life in {city}, including community information, local amenities, and market trends.
          </p>
          <Button variant="link" className="px-0 mt-2 h-auto text-primary">
            View City Guide →
          </Button>
        </div>
      </div>
    </div>
  );
}
