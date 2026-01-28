import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, MessageCircle, CheckCircle, ExternalLink, Building2, Globe, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackProjectInquiry } from '@/hooks/useProjectInquiryTracking';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

interface RepresentingAgent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  is_verified: boolean | null;
  bio: string | null;
  languages: string[] | null;
  years_experience: number | null;
}

interface ProjectAgentCardProps {
  agent: RepresentingAgent;
  projectName?: string;
  projectId?: string;
  developerId?: string;
}

export function ProjectAgentCard({ agent, projectName, projectId, developerId }: ProjectAgentCardProps) {
  const { user } = useAuth();

  const whatsappMessage = projectName 
    ? `Hi ${agent.name}, I'm interested in ${projectName} and would like more information.`
    : `Hi ${agent.name}, I'm interested in learning more about a project you represent.`;

  const whatsappUrl = agent.phone 
    ? buildWhatsAppUrl(agent.phone, whatsappMessage)
    : '';

  const handleWhatsAppClick = () => {
    if (projectId && developerId) {
      trackProjectInquiry({
        projectId,
        developerId,
        inquiryType: 'whatsapp',
        projectName,
        userId: user?.id,
      });
    }
    openWhatsApp(whatsappUrl);
  };

  const handleEmail = () => {
    // Track inquiry
    if (projectId && developerId) {
      trackProjectInquiry({
        projectId,
        developerId,
        inquiryType: 'email',
        projectName,
        userId: user?.id,
      });
    }
    const subject = projectName 
      ? `Inquiry about ${projectName}`
      : 'Project Inquiry';
    window.location.href = `mailto:${agent.email}?subject=${encodeURIComponent(subject)}`;
  };

  const initials = agent.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Your Sales Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Info */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-border">
            <AvatarImage 
              src={agent.avatar_url || undefined} 
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              {agent.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            {agent.agency_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {agent.agency_name}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {agent.years_experience && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {agent.years_experience} years exp.
                </span>
              )}
              {agent.languages && agent.languages.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {agent.languages.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {agent.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.bio}
          </p>
        )}

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {agent.phone && whatsappUrl && (
            <Button onClick={handleWhatsAppClick} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleEmail} 
            className={agent.phone ? "" : "col-span-2"}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* Link to Agent Profile */}
        <Link 
          to={`/agents/${agent.id}`}
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
        >
          View Agent Profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
