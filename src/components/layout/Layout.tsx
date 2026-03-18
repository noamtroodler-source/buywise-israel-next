import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AskBuyWiseButton } from '../shared/AskBuyWise';
import { MobileBottomNav } from './MobileBottomNav';
import { CookieConsentBanner } from '../shared/CookieConsentBanner';
import { CommandPaletteProvider } from '@/hooks/useCommandPalette';
import { useRouteVisitTracker } from '@/hooks/useRouteVisitTracker';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideMobileNav?: boolean;
}

export function Layout({ children, hideFooter, hideMobileNav }: LayoutProps) {
  useRouteVisitTracker();
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
        <AskBuyWiseButton />
        {!hideMobileNav && <MobileBottomNav />}
        <CookieConsentBanner />
      </div>
    </CommandPaletteProvider>
  );
}