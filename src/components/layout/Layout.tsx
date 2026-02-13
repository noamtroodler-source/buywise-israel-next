import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWhatsApp } from '../shared/FloatingWhatsApp';
import { MobileBottomNav } from './MobileBottomNav';
import { CookieConsentBanner } from '../shared/CookieConsentBanner';
import { CommandPaletteProvider } from '@/hooks/useCommandPalette';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideMobileNav?: boolean;
}

export function Layout({ children, hideFooter, hideMobileNav }: LayoutProps) {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        {!hideFooter && (
          <div className="mb-bottom-nav lg:mb-0">
            <Footer />
          </div>
        )}
        <FloatingWhatsApp />
        {!hideMobileNav && <MobileBottomNav />}
        <CookieConsentBanner />
      </div>
    </CommandPaletteProvider>
  );
}