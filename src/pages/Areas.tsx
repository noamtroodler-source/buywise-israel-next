import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

// City images will be imported after generation
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
}

interface Region {
  name: string;
  cities: City[];
}

const regions: Region[] = [
  {
    name: 'Coastal & Greater Tel Aviv',
    cities: [
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg },
      { name: 'Haifa', slug: 'haifa', image: haifaImg },
      { name: 'Bat Yam', slug: 'bat-yam', image: batYamImg },
      { name: 'Holon', slug: 'holon', image: holonImg },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg },
      { name: 'Givatayim', slug: 'givatayim', image: givatayimImg },
      { name: 'Ashdod', slug: 'ashdod', image: ashdodImg },
      { name: 'Nahariya', slug: 'nahariya', image: nahariyaImg },
    ],
  },
  {
    name: 'Central Israel',
    cities: [
      { name: "Ra'anana", slug: 'raanana', image: raananaImg },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg },
      { name: "Modi'in", slug: 'modiin', image: modiinImg },
      { name: 'Givat Shmuel', slug: 'givat-shmuel', image: givatShmuelImg },
      { name: 'Hod HaSharon', slug: 'hod-hasharon', image: hodHasharonImg },
      { name: "Rosh HaAyin", slug: 'rosh-haayin', image: roshHaayinImg },
      { name: 'Petah Tikva', slug: 'petah-tikva', image: petahTikvaImg },
      { name: 'Shoham', slug: 'shoham', image: shohamImg },
      { name: 'Hadera', slug: 'hadera', image: haderaImg },
      { name: 'Caesarea', slug: 'caesarea', image: caesareaImg },
    ],
  },
  {
    name: 'Jerusalem & Surroundings',
    cities: [
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg },
      { name: 'Beit Shemesh', slug: 'beit-shemesh', image: beitShemeshImg },
      { name: 'Efrat', slug: 'efrat', image: efratImg },
      { name: 'Gush Etzion', slug: 'gush-etzion', image: gushEtzionImg },
      { name: "Ma'ale Adumim", slug: 'maale-adumim', image: maaleAdumimImg },
      { name: 'Mevaseret Zion', slug: 'mevaseret-zion', image: mevaseretZionImg },
      { name: "Givat Ze'ev", slug: 'givat-zeev', image: givatZeevImg },
    ],
  },
  {
    name: 'Northern Israel',
    cities: [
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg },
      { name: 'Pardes Hanna-Karkur', slug: 'pardes-hanna', image: pardesHannaImg },
      { name: 'Kiryat Tivon', slug: 'kiryat-tivon', image: kiryatTivonImg },
      { name: 'Yokneam', slug: 'yokneam', image: yokneamImg },
    ],
  },
  {
    name: 'Southern Israel',
    cities: [
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg },
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg },
      { name: 'Eilat', slug: 'eilat', image: eilatImg },
    ],
  },
];

export default function Areas() {
  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Explore Areas</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover Israel's most desirable neighborhoods across 34 cities in 5 regions.
            </p>
          </div>

          {/* Regions */}
          {regions.map((region, regionIndex) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: regionIndex * 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                {region.name}
                <span className="text-muted-foreground font-normal text-base ml-2">
                  ({region.cities.length} cities)
                </span>
              </h2>
              
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {region.cities.map((city, cityIndex) => (
                  <motion.div
                    key={city.slug}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: regionIndex * 0.1 + cityIndex * 0.03 }}
                  >
                    <Link to={`/areas/${city.slug}`}>
                      <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group h-full">
                        <div className="aspect-[4/3] overflow-hidden relative">
                          <img
                            src={city.image}
                            alt={city.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-semibold text-sm md:text-base">
                                {city.name}
                              </h3>
                              <ChevronRight className="h-4 w-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
