import { Link } from 'react-router-dom';
import { MessageCircle, Mail, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BlogAuthorContact } from '@/hooks/useBlogPostAuthor';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

interface BlogAuthorContactCardProps {
  author: BlogAuthorContact;
  postTitle: string;
}

function getAuthorLabel(type: 'agent' | 'agency' | 'developer'): string {
  switch (type) {
    case 'agent':
      return 'Agent';
    case 'agency':
      return 'Agency';
    case 'developer':
      return 'Developer';
    default:
      return 'Author';
  }
}

function getProfileUrl(author: BlogAuthorContact): string {
  switch (author.type) {
    case 'agent':
      return `/agents/${author.id}`;
    case 'agency':
      return `/agencies/${author.slug || author.id}`;
    case 'developer':
      return `/developers/${author.slug || author.id}`;
    default:
      return '#';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function BlogAuthorContactCard({ author, postTitle }: BlogAuthorContactCardProps) {
  const profileUrl = getProfileUrl(author);
  const whatsappMessage = `Hi ${author.name}, I read your article "${postTitle}" on BuyWise and would like to learn more about your services.`;
  const whatsappUrl = author.phone ? buildWhatsAppUrl(author.phone, whatsappMessage) : '';

  const handleWhatsAppClick = () => {
    if (whatsappUrl) {
      openWhatsApp(whatsappUrl, author.phone || '', whatsappMessage);
    }
  };

  const handleEmailClick = () => {
    if (author.email) {
      const subject = encodeURIComponent(`Inquiry about: ${postTitle}`);
      const body = encodeURIComponent(
        `Hi ${author.name},\n\nI read your article "${postTitle}" on BuyWise and would like to learn more about your services.\n\nBest regards`
      );
      window.location.href = `mailto:${author.email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <Card className="p-5">
      {/* Author Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link to={profileUrl}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              to={profileUrl} 
              className="font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {author.name}
            </Link>
            <Badge variant="secondary" className="text-xs shrink-0">
              {getAuthorLabel(author.type)}
            </Badge>
          </div>
          {author.organization_name && (
            <p className="text-sm text-muted-foreground truncate">
              {author.organization_name}
            </p>
          )}
        </div>
      </div>

      {/* Contact Buttons */}
      <div className="flex gap-2 mb-3">
        {author.phone && (
          <Button
            size="sm"
            className="flex-1"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            WhatsApp
          </Button>
        )}
        {author.email && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleEmailClick}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Email
          </Button>
        )}
      </div>

      {/* Profile Link */}
      <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-primary">
        <Link to={profileUrl}>
          View {getAuthorLabel(author.type)} Profile
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </Card>
  );
}
