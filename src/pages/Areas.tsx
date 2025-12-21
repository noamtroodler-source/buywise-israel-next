import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';

// City images
import telAvivImg from '@/assets/cities/tel-aviv.jpg';
import herzliyaImg from '@/assets/cities/herzliya.jpg';
import netanyaImg from '@/assets/cities/netanya.jpg';
import haifaImg from '@/assets/cities/haifa.jpg';
import batYamImg from '@/assets/cities/bat-yam.jpg';
import holonImg from '@/assets/cities/holon.jpg';
import ramatGanImg from '@/assets/cities/ramat-gan.jpg';
import givatayimImg from '@/assets/cities/givatayim.jpg';
import ashdodImg from '@/assets/cities/ashdod.jpg';
import nahariyaImg from '@/assets/cities/nahariya.jpg';
import raananaImg from '@/assets/cities/raanana.jpg';
import kfarSabaImg from '@/assets/cities/kfar-saba.jpg';
import modiinImg from '@/assets/cities/modiin.jpg';
import givatShmuelImg from '@/assets/cities/givat-shmuel.jpg';
import hodHasharonImg from '@/assets/cities/hod-hasharon.jpg';
import roshHaayinImg from '@/assets/cities/rosh-haayin.jpg';
import petahTikvaImg from '@/assets/cities/petah-tikva.jpg';
import shohamImg from '@/assets/cities/shoham.jpg';
import haderaImg from '@/assets/cities/hadera.jpg';
import caesareaImg from '@/assets/cities/caesarea.jpg';
import jerusalemImg from '@/assets/cities/jerusalem.jpg';
import beitShemeshImg from '@/assets/cities/beit-shemesh.jpg';
import efratImg from '@/assets/cities/efrat.jpg';
import gushEtzionImg from '@/assets/cities/gush-etzion.jpg';
import maaleAdumimImg from '@/assets/cities/maale-adumim.jpg';
import mevaseretZionImg from '@/assets/cities/mevaseret-zion.jpg';
import givatZeevImg from '@/assets/cities/givat-zeev.jpg';
import zichronYaakovImg from '@/assets/cities/zichron-yaakov.jpg';
import pardesHannaImg from '@/assets/cities/pardes-hanna.jpg';
import kiryatTivonImg from '@/assets/cities/kiryat-tivon.jpg';
import yokneamImg from '@/assets/cities/yokneam.jpg';
import ashkelonImg from '@/assets/cities/ashkelon.jpg';
import beerShevaImg from '@/assets/cities/beer-sheva.jpg';
import eilatImg from '@/assets/cities/eilat.jpg';

interface City {
  name: string;
  slug: string;
  image: string;
  description: string;
  tags: string[];
}

interface Region {
  name: string;
  subtitle: string;
  cities: City[];
}

const regions: Region[] = [
  {
    name: 'Coastal & Greater Tel Aviv',
    subtitle: 'Beach life, urban energy & metro convenience',
    cities: [
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg, description: "Israel's most expensive and competitive real estate market with urban premium...", tags: ['Urban premium', 'Limited supply'] },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg, description: 'Herzliya is a premium coastal market with distinct neighborhoods...', tags: ['Coastal premium', 'High demand'] },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg, description: 'Netanya offers coastal living with more varied price points...', tags: ['Coastal variety', 'Range of price points'] },
      { name: 'Haifa', slug: 'haifa', image: haifaImg, description: 'Haifa offers urban living at significantly lower prices...', tags: ['Northern metro', 'Value positioning'] },
      { name: 'Bat Yam', slug: 'bat-yam', image: batYamImg, description: 'Affordable coastal living south of Tel Aviv with beach access...', tags: ['Affordable coast', 'Urban renewal'] },
      { name: 'Holon', slug: 'holon', image: holonImg, description: 'Family-friendly city with growing cultural scene...', tags: ['Family city', 'Cultural growth'] },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg, description: 'Diamond exchange district with high-rise living...', tags: ['Business hub', 'High-rise living'] },
      { name: 'Givatayim', slug: 'givatayim', image: givatayimImg, description: 'Quiet residential area adjacent to Tel Aviv...', tags: ['Quiet residential', 'Tel Aviv adjacent'] },
      { name: 'Ashdod', slug: 'ashdod', image: ashdodImg, description: 'Major port city with beaches and affordable housing...', tags: ['Port city', 'Beach access'] },
      { name: 'Nahariya', slug: 'nahariya', image: nahariyaImg, description: 'Northern coastal town with relaxed atmosphere...', tags: ['Northern coast', 'Relaxed lifestyle'] },
    ],
  },
  {
    name: 'Central Israel',
    subtitle: 'Family suburbs, commuter value & growing communities',
    cities: [
      { name: "Ra'anana", slug: 'raanana', image: raananaImg, description: "Ra'anana is an established suburban city with premium pricing...", tags: ['Established suburban', 'Premium pricing'] },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg, description: 'Kfar Saba offers suburban living at more moderate prices...', tags: ['Suburban value', 'Family-oriented'] },
      { name: "Modi'in", slug: 'modiin', image: modiinImg, description: "Modi'in is a planned city built primarily since the 1990s...", tags: ['Planned city', 'Central location'] },
      { name: 'Givat Shmuel', slug: 'givat-shmuel', image: givatShmuelImg, description: 'Givat Shmuel is a small city with significant development...', tags: ['Compact city', 'Developing market'] },
      { name: 'Hod HaSharon', slug: 'hod-hasharon', image: hodHasharonImg, description: 'Growing suburb with excellent schools and parks...', tags: ['Quality schools', 'Green spaces'] },
      { name: "Rosh HaAyin", slug: 'rosh-haayin', image: roshHaayinImg, description: 'Rapidly developing city with mixed housing options...', tags: ['Rapid growth', 'Mixed housing'] },
      { name: 'Petah Tikva', slug: 'petah-tikva', image: petahTikvaImg, description: 'Historic city with diverse neighborhoods and pricing...', tags: ['Historic city', 'Diverse options'] },
      { name: 'Shoham', slug: 'shoham', image: shohamImg, description: 'Upscale community with excellent quality of life...', tags: ['Upscale community', 'High quality'] },
      { name: 'Hadera', slug: 'hadera', image: haderaImg, description: 'Affordable option with improving infrastructure...', tags: ['Affordable', 'Improving area'] },
      { name: 'Caesarea', slug: 'caesarea', image: caesareaImg, description: 'Exclusive community with luxury properties...', tags: ['Luxury market', 'Exclusive area'] },
    ],
  },
  {
    name: 'Jerusalem & Surroundings',
    subtitle: 'History, meaning & community',
    cities: [
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg, description: "Jerusalem's real estate market is characterized by high demand and varied neighborhoods...", tags: ['High demand', 'Varied neighborhoods'] },
      { name: 'Beit Shemesh', slug: 'beit-shemesh', image: beitShemeshImg, description: 'Beit Shemesh has experienced rapid expansion with new construction...', tags: ['Rapid growth', 'New construction'] },
      { name: 'Efrat', slug: 'efrat', image: efratImg, description: 'Efrat is a mid-sized community with a relatively established market...', tags: ['Established community', 'Limited inventory'] },
      { name: 'Gush Etzion', slug: 'gush-etzion', image: gushEtzionImg, description: 'Gush Etzion encompasses multiple distinct communities...', tags: ['Multiple communities', 'Varied options'] },
      { name: "Ma'ale Adumim", slug: 'maale-adumim', image: maaleAdumimImg, description: 'Large suburban city east of Jerusalem with established infrastructure...', tags: ['Established suburb', 'Jerusalem access'] },
      { name: 'Mevaseret Zion', slug: 'mevaseret-zion', image: mevaseretZionImg, description: 'Upscale suburb on the outskirts of Jerusalem...', tags: ['Upscale suburb', 'Nature access'] },
      { name: "Givat Ze'ev", slug: 'givat-zeev', image: givatZeevImg, description: 'Growing community north of Jerusalem with affordable options...', tags: ['Growing community', 'Affordable'] },
    ],
  },
  {
    name: 'Northern Israel',
    subtitle: 'Lifestyle value & scenic living',
    cities: [
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg, description: 'Zichron Yaakov is a historic town on the Carmel coast...', tags: ['Wine country', 'Historic charm'] },
      { name: 'Pardes Hanna-Karkur', slug: 'pardes-hanna', image: pardesHannaImg, description: 'Pardes Hanna-Karkur offers quiet, affordable living in the north...', tags: ['Quiet living', 'Value north'] },
      { name: 'Kiryat Tivon', slug: 'kiryat-tivon', image: kiryatTivonImg, description: 'Kiryat Tivon is a small, green town on the Carmel slopes...', tags: ['Carmel suburbs', 'Nature access'] },
      { name: 'Yokneam', slug: 'yokneam', image: yokneamImg, description: 'Yokneam is a growing high-tech center in the Jezreel Valley...', tags: ['Tech hub north', 'Growing city'] },
    ],
  },
  {
    name: 'Southern Israel',
    subtitle: 'Affordable frontier & resort living',
    cities: [
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg, description: 'Coastal city with beaches and affordable housing options...', tags: ['Coastal affordable', 'Beach lifestyle'] },
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg, description: 'Capital of the Negev with university and tech growth...', tags: ['Negev capital', 'Tech growth'] },
      { name: 'Eilat', slug: 'eilat', image: eilatImg, description: 'Resort city on the Red Sea with unique lifestyle...', tags: ['Resort living', 'Tax benefits'] },
    ],
  },
];

function RegionCarousel({ region, index }: { region: Region; index: number }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-muted/30 rounded-3xl p-8 md:p-10"
    >
      {/* Region Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {region.name}
        </h2>
        <p className="text-muted-foreground">{region.subtitle}</p>
        <p className="text-muted-foreground/70 text-sm mt-1">
          {region.cities.length} cities
        </p>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Navigation Arrows */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-10 w-10 rounded-full border-border bg-background shadow-lg hover:bg-muted disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-10 w-10 rounded-full border-border bg-background shadow-lg hover:bg-muted disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Cities */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {region.cities.map((city) => (
              <div
                key={city.slug}
                className="min-w-0 shrink-0 grow-0 basis-[280px] pl-5"
              >
                <Link to={`/areas/${city.slug}`} className="block group">
                  <div className="bg-background rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {city.name}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {city.description}
                      </p>
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          {city.tags.join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Areas() {
  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Explore Areas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover Israel's most desirable neighborhoods across 34 cities in 5 regions
          </p>
        </motion.div>

        {/* Region Sections */}
        <div className="space-y-8">
          {regions.map((region, index) => (
            <RegionCarousel key={region.name} region={region} index={index} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
