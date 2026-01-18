import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectWizard, ProjectStatus } from '../ProjectWizardContext';

const cities = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Ra\'anana', 'Herzliya', 'Netanya', 
  'Be\'er Sheva', 'Ashdod', 'Modiin', 'Petah Tikva', 'Rishon LeZion',
  'Bat Yam', 'Holon', 'Givatayim', 'Ramat Gan', 'Kfar Saba', 'Hod HaSharon'
];

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning Phase' },
  { value: 'pre_sale', label: 'Pre-Sale' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'completed', label: 'Completed' },
];

export function StepBasics() {
  const { data, updateData } = useProjectWizard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Basics</h2>
        <p className="text-muted-foreground mb-6">
          Enter the basic information about your development project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="e.g., Park View Residences"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Select
              value={data.city}
              onValueChange={(value) => updateData({ city: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              value={data.neighborhood}
              onChange={(e) => updateData({ neighborhood: e.target.value })}
              placeholder="e.g., Old North"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Full Address</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Street address"
          />
        </div>

        <div className="space-y-2">
          <Label>Project Status *</Label>
          <Select
            value={data.status}
            onValueChange={(value) => updateData({ status: value as ProjectStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current phase of the development
          </p>
        </div>
      </div>
    </div>
  );
}
