import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { BlogPost } from '@/types/content';
import { BlogCard } from './BlogCard';

interface BlogSectionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  posts: BlogPost[];
  isArticleSaved: (postId: string) => boolean;
  onToggleSave: (postId: string) => void;
  onViewAll?: () => void;
  showViewAll?: boolean;
}

export function BlogSection({
  title,
  subtitle,
  icon: Icon,
  posts,
  isArticleSaved,
  onToggleSave,
  onViewAll,
  showViewAll = true,
}: BlogSectionProps) {
  if (posts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {showViewAll && onViewAll && (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-primary gap-1 group"
            onClick={onViewAll}
          >
            View all
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {posts.map((post, index) => (
            <CarouselItem
              key={post.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <BlogCard
                post={post}
                index={index}
                isSaved={isArticleSaved(post.id)}
                onToggleSave={onToggleSave}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 h-10 w-10 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm shadow-lg" />
        <CarouselNext className="hidden md:flex -right-4 h-10 w-10 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm shadow-lg" />
      </Carousel>
    </motion.section>
  );
}
