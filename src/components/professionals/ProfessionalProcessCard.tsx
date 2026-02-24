import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MessageSquare, Wallet } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

interface Props {
  professional: TrustedProfessional;
  accentColor: string;
}

export function ProfessionalProcessCard({ professional, accentColor }: Props) {
  const { consultation_type, response_time, engagement_model, process_steps } = professional;
  const steps = Array.isArray(process_steps) ? process_steps : [];

  const hasQuickInfo = consultation_type || response_time || engagement_model;
  const hasSteps = steps.length > 0;

  if (!hasQuickInfo && !hasSteps) return null;

  const badges = [
    { value: consultation_type, icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { value: response_time, icon: <Clock className="h-3.5 w-3.5" /> },
    { value: engagement_model, icon: <Wallet className="h-3.5 w-3.5" /> },
  ].filter(b => b.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card>
        <CardContent className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">How It Works</h2>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {badges.map((b) => (
                <div
                  key={b.value}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${accentColor}08`,
                    borderColor: `${accentColor}20`,
                    color: `${accentColor}CC`,
                  }}
                >
                  {b.icon}
                  {b.value}
                </div>
              ))}
            </div>
          )}

          {hasSteps && (
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium text-foreground">{s.step}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
