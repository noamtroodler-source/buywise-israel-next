import { motion } from 'framer-motion';
import { UserCheck, Briefcase } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const agentSpecializations = [
  'Residential Sales', 'Luxury Properties', 'Rentals', 'New Construction',
  'Commercial', 'Anglo Market', 'Investment', 'Land',
];

const languageOptions = [
  'Hebrew', 'English', 'Russian', 'French', 'Spanish', 'Arabic', 'Amharic', 'German',
];

export interface AgentProfileData {
  licenseNumber: string;
  yearsExperience: string;
  languages: string[];
  agentSpecializations: string[];
  bio: string;
}

interface AgentProfileStepProps {
  data: AgentProfileData;
  onChange: (data: AgentProfileData) => void;
}

export function AgentProfileStep({ data, onChange }: AgentProfileStepProps) {
  const update = <K extends keyof AgentProfileData>(field: K, value: AgentProfileData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const toggleItem = (field: 'languages' | 'agentSpecializations', item: string) => {
    const current = data[field];
    const maxItems = field === 'agentSpecializations' ? 3 : undefined;
    if (current.includes(item)) {
      update(field, current.filter(i => i !== item));
    } else if (!maxItems || current.length < maxItems) {
      update(field, [...current, item]);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Your Agent Profile</h3>
          <p className="text-sm text-muted-foreground">Professional details for your personal agent listing</p>
        </div>
      </motion.div>

      {/* License Number */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="licenseNumber" className="text-sm font-medium">Real Estate License Number *</Label>
        <Input
          id="licenseNumber"
          value={data.licenseNumber}
          onChange={(e) => update('licenseNumber', e.target.value)}
          placeholder="e.g. 12345678"
          className="h-11 rounded-xl"
          required
        />
      </motion.div>

      {/* Years of Experience */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label className="text-sm font-medium">Years of Experience</Label>
        <Select value={data.yearsExperience} onValueChange={(v) => update('yearsExperience', v)}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Less than 1 year</SelectItem>
            <SelectItem value="1">1-2 years</SelectItem>
            <SelectItem value="3">3-5 years</SelectItem>
            <SelectItem value="6">6-10 years</SelectItem>
            <SelectItem value="11">10+ years</SelectItem>
            <SelectItem value="20">20+ years</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Languages */}
      <motion.div variants={itemVariants} className="space-y-3">
        <Label className="text-sm font-medium">Languages Spoken</Label>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((lang) => (
            <button
              type="button"
              key={lang}
              onClick={() => toggleItem('languages', lang)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                data.languages.includes(lang)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Agent Specializations */}
      <motion.div variants={itemVariants} className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          Specializations (max 3)
        </Label>
        <div className="flex flex-wrap gap-2">
          {agentSpecializations.map((spec) => (
            <button
              type="button"
              key={spec}
              onClick={() => toggleItem('agentSpecializations', spec)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                data.agentSpecializations.includes(spec)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30",
                !data.agentSpecializations.includes(spec) && data.agentSpecializations.length >= 3
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              )}
              disabled={!data.agentSpecializations.includes(spec) && data.agentSpecializations.length >= 3}
            >
              {spec}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bio */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="agentBio" className="text-sm font-medium">Short Bio (optional)</Label>
        <Textarea
          id="agentBio"
          value={data.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="A brief intro about yourself as an agent..."
          rows={3}
          maxLength={400}
          className="rounded-xl resize-none"
        />
        <p className="text-xs text-muted-foreground">{data.bio.length}/400 characters</p>
      </motion.div>
    </motion.div>
  );
}
