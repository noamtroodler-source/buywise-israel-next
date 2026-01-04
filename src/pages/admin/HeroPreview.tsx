import doorway1 from '@/assets/hero-options/doorway-1.jpg';
import doorway2 from '@/assets/hero-options/doorway-2.jpg';
import doorway3 from '@/assets/hero-options/doorway-3.jpg';

const images = [
  { src: doorway1, label: 'Doorway 1 - Single person, Mediterranean' },
  { src: doorway2, label: 'Doorway 2 - Couple, Stone archway' },
  { src: doorway3, label: 'Doorway 3 - Father & daughter, Modern' },
];

export default function HeroPreview() {
  return (
    <div className="min-h-screen bg-muted p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Hero Images with Blue Overlay</h1>
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
                {/* Blue gradient overlay - same as HeroSection */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
              </div>
              
              {/* Sample content to show contrast */}
              <div className="relative z-10 p-12 flex flex-col justify-center h-full min-h-[400px]">
                <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight max-w-2xl">
                  Find Your Perfect Home in Israel
                </h3>
                <p className="text-lg text-primary-foreground/90 max-w-xl mt-4">
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
