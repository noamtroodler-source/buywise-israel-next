import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, FileText, Calculator, MapPin, Home } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'photos', label: 'Photos', icon: <Camera className="h-4 w-4" /> },
  { id: 'details', label: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 'costs', label: 'Costs', icon: <Calculator className="h-4 w-4" /> },
  { id: 'map', label: 'Map', icon: <MapPin className="h-4 w-4" /> },
  { id: 'similar', label: 'Similar', icon: <Home className="h-4 w-4" /> },
];

interface MobileSectionNavProps {
  className?: string;
}

export function MobileSectionNav({ className }: MobileSectionNavProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeSection, setActiveSection] = useState('photos');
  const [isVisible, setIsVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Track which sections are in view
  const handleScroll = useCallback(() => {
    // Show nav after scrolling past hero (~300px)
    setIsVisible(window.scrollY > 300);

    // Find which section is most visible
    let currentSection = 'photos';
    let minDistance = Infinity;

    for (const section of SECTIONS) {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Consider the section active if it's near the top of the viewport
        const distance = Math.abs(rect.top - 100);
        if (distance < minDistance && rect.top < window.innerHeight * 0.6) {
          minDistance = distance;
          currentSection = section.id;
        }
      }
    }

    setActiveSection(currentSection);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll nav to keep active button visible
  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeButtonRef.current.getBoundingClientRect();
      
      // Calculate if button is outside visible area
      if (buttonRect.left < navRect.left || buttonRect.right > navRect.right) {
        activeButtonRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const offset = 120; // Account for header and nav
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  // Only show on mobile/tablet and when scrolled past hero
  if (isDesktop || !isVisible) return null;

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border',
        'overflow-x-auto scrollbar-hide',
        className
      )}
    >
      <div className="flex items-center gap-1 px-4 py-2 min-w-max">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              ref={isActive ? activeButtonRef : undefined}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {section.icon}
              {section.label}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
