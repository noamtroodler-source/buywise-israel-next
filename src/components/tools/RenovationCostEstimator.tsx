import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Hammer, Paintbrush, Bath, UtensilsCrossed, Sofa, Lightbulb, Thermometer } from 'lucide-react';

interface RoomType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  basePrice: { basic: number; standard: number; premium: number };
  unit: 'per_sqm' | 'per_room';
}

const roomTypes: RoomType[] = [
  { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed, basePrice: { basic: 40000, standard: 80000, premium: 150000 }, unit: 'per_room' },
  { id: 'bathroom', label: 'Bathroom', icon: Bath, basePrice: { basic: 25000, standard: 50000, premium: 100000 }, unit: 'per_room' },
  { id: 'living', label: 'Living Room', icon: Sofa, basePrice: { basic: 800, standard: 1500, premium: 3000 }, unit: 'per_sqm' },
  { id: 'bedroom', label: 'Bedroom', icon: Sofa, basePrice: { basic: 600, standard: 1200, premium: 2500 }, unit: 'per_sqm' },
  { id: 'painting', label: 'Full Painting', icon: Paintbrush, basePrice: { basic: 150, standard: 250, premium: 400 }, unit: 'per_sqm' },
  { id: 'flooring', label: 'Flooring', icon: Hammer, basePrice: { basic: 200, standard: 400, premium: 800 }, unit: 'per_sqm' },
  { id: 'electrical', label: 'Electrical System', icon: Lightbulb, basePrice: { basic: 15000, standard: 30000, premium: 60000 }, unit: 'per_room' },
  { id: 'hvac', label: 'HVAC / Air Conditioning', icon: Thermometer, basePrice: { basic: 20000, standard: 40000, premium: 80000 }, unit: 'per_room' },
];

type QualityLevel = 'basic' | 'standard' | 'premium';

export function RenovationCostEstimator() {
  const [selectedRooms, setSelectedRooms] = useState<string[]>(['painting']);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');
  const [apartmentSize, setApartmentSize] = useState(80);
  const [bathroomCount, setBathroomCount] = useState(1);

  const calculations = useMemo(() => {
    const breakdown: { item: string; cost: number }[] = [];
    let total = 0;

    selectedRooms.forEach((roomId) => {
      const room = roomTypes.find(r => r.id === roomId);
      if (!room) return;

      let cost = room.basePrice[qualityLevel];
      
      if (room.unit === 'per_sqm') {
        cost = cost * apartmentSize;
      } else if (roomId === 'bathroom') {
        cost = cost * bathroomCount;
      }

      breakdown.push({ item: room.label, cost });
      total += cost;
    });

    // Add contingency (10%)
    const contingency = total * 0.1;
    
    // Timeline estimate (weeks)
    const timeline = Math.ceil(selectedRooms.length * 1.5) + (qualityLevel === 'premium' ? 2 : 0);

    return {
      breakdown,
      subtotal: total,
      contingency,
      total: total + contingency,
      timeline,
    };
  }, [selectedRooms, qualityLevel, apartmentSize, bathroomCount]);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(r => r !== roomId)
        : [...prev, roomId]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="h-5 w-5 text-primary" />
          Renovation Cost Estimator
        </CardTitle>
        <CardDescription>
          Get a rough estimate for your renovation project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Apartment Size: {apartmentSize} sqm</Label>
              <Slider
                value={[apartmentSize]}
                onValueChange={([value]) => setApartmentSize(value)}
                min={30}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Number of Bathrooms: {bathroomCount}</Label>
              <Slider
                value={[bathroomCount]}
                onValueChange={([value]) => setBathroomCount(value)}
                min={1}
                max={4}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <Label>Quality Level</Label>
              <RadioGroup
                value={qualityLevel}
                onValueChange={(v) => setQualityLevel(v as QualityLevel)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic">Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <Label htmlFor="premium">Premium</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>What are you renovating?</Label>
              <div className="grid grid-cols-2 gap-2">
                {roomTypes.map((room) => {
                  const Icon = room.icon;
                  return (
                    <div
                      key={room.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRooms.includes(room.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleRoom(room.id)}
                    >
                      <Checkbox 
                        checked={selectedRooms.includes(room.id)}
                        onCheckedChange={() => toggleRoom(room.id)}
                      />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{room.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary text-primary-foreground text-center">
              <p className="text-sm opacity-90">Estimated Total</p>
              <p className="text-3xl font-bold">{formatCurrency(calculations.total)}</p>
              <p className="text-sm opacity-90">
                ~{calculations.timeline} weeks
              </p>
            </div>

            {calculations.breakdown.length > 0 && (
              <div className="p-4 rounded-lg border space-y-3">
                <h4 className="font-semibold">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {calculations.breakdown.map(({ item, cost }) => (
                    <div key={item} className="flex justify-between">
                      <span className="text-muted-foreground">{item}:</span>
                      <span className="font-medium">{formatCurrency(cost)}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contingency (10%):</span>
                    <span className="font-medium">{formatCurrency(calculations.contingency)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(calculations.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-2">Quality Level: {qualityLevel.charAt(0).toUpperCase() + qualityLevel.slice(1)}</h4>
              <p className="text-sm text-muted-foreground">
                {qualityLevel === 'basic' && 'Budget-friendly materials, standard finishes. Good for rentals or quick refreshes.'}
                {qualityLevel === 'standard' && 'Mid-range materials with good durability. Popular choice for most homeowners.'}
                {qualityLevel === 'premium' && 'High-end materials, designer finishes, custom work. For luxury renovations.'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          * Estimates are approximate and may vary based on specific requirements, contractor rates, and material choices.
        </p>
      </CardContent>
    </Card>
  );
}
