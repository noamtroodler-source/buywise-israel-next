import doorway1 from '@/assets/hero-options/doorway-1.jpg';
import doorway2 from '@/assets/hero-options/doorway-2.jpg';
import doorway3 from '@/assets/hero-options/doorway-3.jpg';
import coupleKeysWarm from '@/assets/hero-options/couple-keys-warm.jpg';
import familyDoorwayWarm from '@/assets/hero-options/family-doorway-warm.jpg';
import coupleBalconySunset from '@/assets/hero-options/couple-balcony-sunset.jpg';
import womanSeaviewDoor from '@/assets/hero-options/woman-seaview-door.jpg';
import multigenerationalWelcome from '@/assets/hero-options/multigenerational-welcome.jpg';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const images = [
  { src: coupleKeysWarm, label: 'Couple Receiving Keys - Warm golden light, genuine joy' },
  { src: familyDoorwayWarm, label: 'Family Doorway - Parents & daughter, sunset glow' },
  { src: coupleBalconySunset, label: 'Balcony Sunset - Couple with Tel Aviv view' },
  { src: womanSeaviewDoor, label: 'Sea View Discovery - Woman in awe, coastal view' },
  { src: multigenerationalWelcome, label: 'Multi-generational - Family gathering, warm stone' },
  { src: doorway1, label: 'Original: Doorway 1 - Single person, Mediterranean' },
  { src: doorway2, label: 'Original: Doorway 2 - Couple, Stone archway' },
  { src: doorway3, label: 'Original: Doorway 3 - Father & daughter, Modern' },
];

type OverlayType = 'blue' | 'warm' | 'none';

export default function HeroPreview() {
  const [globalOverlay, setGlobalOverlay] = useState<OverlayType>('warm');

  const getOverlayClass = (type: OverlayType) => {
    switch (type) {
      case 'blue':
        return 'bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50';
      case 'warm':
        return 'bg-gradient-to-r from-amber-900/80 via-amber-800/60 to-amber-700/40';
      case 'none':
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-muted p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Hero Image Options</h1>
      <p className="text-muted-foreground text-center mb-6">
        New warm tone images with visible faces and genuine emotion
      </p>
      
      {/* Global overlay toggle */}
      <div className="flex justify-center gap-2 mb-8">
        <Button 
          variant={globalOverlay === 'warm' ? 'default' : 'outline'}
          onClick={() => setGlobalOverlay('warm')}
          className={globalOverlay === 'warm' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Warm Overlay
        </Button>
        <Button 
          variant={globalOverlay === 'blue' ? 'default' : 'outline'}
          onClick={() => setGlobalOverlay('blue')}
        >
          Blue Overlay
        </Button>
        <Button 
          variant={globalOverlay === 'none' ? 'default' : 'outline'}
          onClick={() => setGlobalOverlay('none')}
        >
          No Overlay
        </Button>
      </div>

      <div className="space-y-12 max-w-6xl mx-auto">
        {images.map((img, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="text-xl font-semibold">{img.label}</h2>
            <div className="relative min-h-[400px] rounded-xl overflow-hidden">
              {/* Background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${img.src})` }}
              >
                {/* Overlay */}
                {globalOverlay !== 'none' && (
                  <div className={`absolute inset-0 ${getOverlayClass(globalOverlay)}`} />
                )}
              </div>
              
              {/* Sample content to show contrast */}
              <div className="relative z-10 p-12 flex flex-col justify-center h-full min-h-[400px]">
                <h3 className={`text-4xl md:text-5xl font-bold leading-tight max-w-2xl ${globalOverlay === 'none' ? 'text-white drop-shadow-lg' : 'text-primary-foreground'}`}>
                  Find Your Perfect Home in Israel
                </h3>
                <p className={`text-lg max-w-xl mt-4 ${globalOverlay === 'none' ? 'text-white/90 drop-shadow-md' : 'text-primary-foreground/90'}`}>
                  Discover thousands of properties across Israel. Whether you're buying, renting, or looking for new developments.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
