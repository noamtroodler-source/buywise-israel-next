import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

export function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenWhatsApp = () => {
    const phone = '972501234567';
    const url = buildWhatsAppUrl(phone, 'Hi BuyWise! I have a question about...');
    openWhatsApp(url);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenWhatsApp}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 fill-current" />
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-card text-foreground text-sm rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            WhatsApp with us
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

