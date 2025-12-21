import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const cities = [
  {
    name: 'Tel Aviv',
    image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&auto=format&fit=crop&q=60',
    count: '2,500+',
  },
  {
    name: 'Jerusalem',
    image: 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800&auto=format&fit=crop&q=60',
    count: '1,800+',
  },
  {
    name: 'Haifa',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60',
    count: '1,200+',
  },
  {
    name: 'Herzliya',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=60',
    count: '800+',
  },
];

export function PopularCities() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Popular Cities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore properties in Israel's most sought-after locations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={`/listings?city=${encodeURIComponent(city.name)}`}
                className="group block relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-primary-foreground mb-1">
                    {city.name}
                  </h3>
                  <p className="text-sm text-primary-foreground/80">
                    {city.count} properties
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}