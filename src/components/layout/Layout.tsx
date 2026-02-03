import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWhatsApp } from '../shared/FloatingWhatsApp';
import { MobileBottomNav } from './MobileBottomNav';
import { CookieConsentBanner } from '../shared/CookieConsentBanner';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideMobileNav?: boolean;
}

export function Layout({ children, hideFooter, hideMobileNav }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {/* Footer has extra padding on mobile to clear bottom nav */}
      {!hideFooter && (
        <div className="mb-bottom-nav md:mb-0">
          <Footer />
        </div>
      )}
      <FloatingWhatsApp />
      {!hideMobileNav && <MobileBottomNav />}
      <CookieConsentBanner />
    </div>
  );
}