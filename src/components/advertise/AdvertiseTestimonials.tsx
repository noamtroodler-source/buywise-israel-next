import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "BuyWise Israel has completely transformed how I reach international buyers. The quality of leads is exceptional—these are serious buyers ready to purchase.",
    name: "David Cohen",
    role: "Independent Agent",
    location: "Tel Aviv",
    initials: "DC",
  },
  {
    quote:
      "Managing our team on BuyWise is seamless. The agency dashboard gives us full visibility into performance, and the Anglo market focus is exactly what we needed.",
    name: "Sarah Miller",
    role: "Agency Owner",
    location: "Jerusalem",
    initials: "SM",
  },
  {
    quote:
      "As a developer, showcasing our projects to English-speaking buyers was always a challenge. BuyWise solved that—we've seen a 40% increase in international inquiries.",
    name: "Michael Levi",
    role: "Property Developer",
    location: "Herzliya",
    initials: "ML",
  },
];

export function AdvertiseTestimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Top Professionals
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from real estate professionals growing their business with BuyWise Israel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative bg-card border border-border rounded-2xl p-8"
            >
              {/* Decorative quote */}
              <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/10" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
