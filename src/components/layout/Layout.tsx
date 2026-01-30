import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWhatsApp } from '../shared/FloatingWhatsApp';
import { MobileBottomNav } from './MobileBottomNav';
import { CookieConsentBanner } from '../shared/CookieConsentBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {/* Footer has extra padding on mobile to clear bottom nav */}
      <div className="mb-bottom-nav md:mb-0">
        <Footer />
      </div>
      <FloatingWhatsApp />
      <MobileBottomNav />
      <CookieConsentBanner />
    </div>
  );
}