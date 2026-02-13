import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import {
  Home,
  Search,
  Heart,
  Calculator,
  BookOpen,
  Map,
  Building2,
  Landmark,
  User,
  FileText,
  Scale,
  Languages,
  Briefcase,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface CommandItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const BROWSE: CommandItem[] = [
  { label: 'Properties for Sale', href: '/listings?status=for_sale', icon: Home, keywords: ['buy', 'search', 'apartments'] },
  { label: 'Rentals', href: '/listings?status=for_rent', icon: Home, keywords: ['rent', 'lease'] },
  { label: 'New Projects', href: '/projects', icon: Building2, keywords: ['development', 'new build'] },
  { label: 'Explore Cities', href: '/areas', icon: Map, keywords: ['markets', 'neighborhoods', 'prices'] },
  { label: 'Browse Developers', href: '/developers', icon: Landmark, keywords: ['builders'] },
  { label: 'My Favorites', href: '/favorites', icon: Heart, keywords: ['saved', 'liked'] },
];

const TOOLS: CommandItem[] = [
  { label: 'Mortgage Calculator', href: '/tools?tool=mortgage', icon: Calculator, keywords: ['payments', 'rates', 'loan'] },
  { label: 'Affordability Calculator', href: '/tools?tool=affordability', icon: Calculator, keywords: ['budget', 'how much'] },
  { label: 'True Cost Calculator', href: '/tools?tool=totalcost', icon: Calculator, keywords: ['taxes', 'fees', 'closing'] },
  { label: 'Investment Returns', href: '/tools?tool=investment', icon: BarChart3, keywords: ['roi', 'yield', 'cash flow'] },
  { label: 'Rent vs Buy', href: '/tools?tool=rentvsbuy', icon: Scale, keywords: ['compare', 'decision'] },
  { label: 'Document Checklist', href: '/tools?tool=documents', icon: FileText, keywords: ['papers', 'prepare'] },
];

const LEARN: CommandItem[] = [
  { label: 'Complete Buying Guide', href: '/guides/buying-in-israel', icon: BookOpen, keywords: ['how to buy', 'process'] },
  { label: 'Purchase Tax Guide', href: '/guides/purchase-tax', icon: BookOpen, keywords: ['mas rechisha'] },
  { label: 'Mortgages in Israel', href: '/guides/mortgages', icon: BookOpen, keywords: ['financing', 'loans'] },
  { label: 'Blog', href: '/blog', icon: FileText, keywords: ['articles', 'news'] },
  { label: 'Hebrew Glossary', href: '/glossary', icon: Languages, keywords: ['terms', 'dictionary', 'hebrew'] },
  { label: 'All Guides', href: '/guides', icon: BookOpen },
  { label: 'All Tools', href: '/tools', icon: Calculator },
];

const ACCOUNT: CommandItem[] = [
  { label: 'My Profile', href: '/profile', icon: User, keywords: ['account', 'settings'] },
  { label: 'Trusted Professionals', href: '/professionals', icon: Briefcase, keywords: ['lawyers', 'advisors'] },
  { label: 'Contact Us', href: '/contact', icon: MessageCircle, keywords: ['help', 'support'] },
];

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPalette();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAgent, isAdmin } = useUserRole();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  const runCommand = useCallback(
    (href: string) => {
      setOpen(false);
      navigate(href);
    },
    [navigate]
  );

  const professionalItems: CommandItem[] = [];
  if (isAgent) {
    professionalItems.push(
      { label: 'Agent Dashboard', href: '/agent', icon: Building2, keywords: ['dashboard'] },
      { label: 'My Listings', href: '/agent/properties', icon: Home, keywords: ['manage'] },
      { label: 'Agent Analytics', href: '/agent/analytics', icon: BarChart3 },
    );
  }
  if (isAdmin) {
    professionalItems.push(
      { label: 'Admin Panel', href: '/admin', icon: User, keywords: ['admin'] },
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Where do you want to go?" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Browse">
          {BROWSE.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => runCommand(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Calculators & Tools">
          {TOOLS.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => runCommand(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Learn">
          {LEARN.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => runCommand(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          {ACCOUNT.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => runCommand(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {professionalItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Professional">
              {professionalItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                  onSelect={() => runCommand(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
