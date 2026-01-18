import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Cohen",
    role: "Independent Agent",
    location: "Tel Aviv",
    image: null,
    initials: "SC",
    quote: "BuyWise has connected me with more English-speaking buyers in 3 months than I found in 2 years on other platforms. The analytics help me understand what's working.",
    rating: 5
  },
  {
    name: "David Goldstein",
    role: "Agency Owner",
    location: "Jerusalem",
    image: null,
    initials: "DG",
    quote: "Managing our team of 8 agents has never been easier. The centralized dashboard and invite codes streamlined our entire onboarding process.",
    rating: 5
  },
  {
    name: "Rachel Levi",
    role: "Senior Agent",
    location: "Ra'anana",
    image: null,
    initials: "RL",
    quote: "The platform truly understands the Anglo market. My clients appreciate the English interface and the detailed neighborhood guides help close deals faster.",
    rating: 5
  }
];

export function AgentTestimonials() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Top Agents
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from agents who are growing their business with BuyWise.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-card rounded-2xl p-8 border relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">{testimonial.initials}</span>
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
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
