import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Receipt, Home, Truck, Sofa } from 'lucide-react';

export function TotalCostCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [buyerType, setBuyerType] = useState<'first' | 'upgrader' | 'investor'>('first');
  const [isNewConstruction, setIsNewConstruction] = useState(false);
  const [includeMoving, setIncludeMoving] = useState(true);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [furnitureLevel, setFurnitureLevel] = useState<'basic' | 'standard' | 'premium'>('standard');

  const calculations = useMemo(() => {
    // Purchase Tax (Mas Rechisha) rates for Israel
    let purchaseTax = 0;
    if (buyerType === 'first') {
      // First apartment - lower rates
      if (propertyPrice <= 1919155) {
        purchaseTax = 0;
      } else if (propertyPrice <= 2275440) {
        purchaseTax = (propertyPrice - 1919155) * 0.035;
      } else {
        purchaseTax = (2275440 - 1919155) * 0.035 + (propertyPrice - 2275440) * 0.05;
      }
    } else if (buyerType === 'upgrader') {
      // Upgrader - standard rates
      if (propertyPrice <= 5872725) {
        purchaseTax = propertyPrice * 0.08;
      } else {
        purchaseTax = 5872725 * 0.08 + (propertyPrice - 5872725) * 0.10;
      }
    } else {
      // Investor - highest rates
      purchaseTax = propertyPrice * 0.08;
      if (propertyPrice > 5872725) {
        purchaseTax = 5872725 * 0.08 + (propertyPrice - 5872725) * 0.10;
      }
    }

    // Lawyer fees (typically 0.5% - 1% + VAT)
    const lawyerFees = propertyPrice * 0.005 * 1.17;

    // Real estate agent fees (for resale only, typically 2% + VAT)
    const agentFees = isNewConstruction ? 0 : propertyPrice * 0.02 * 1.17;

    // Mortgage related fees
    const mortgageAppraisal = 2500;
    const mortgageArrangementFee = 3500;

    // Land Registry (Tabu) fees
    const registrationFees = Math.min(propertyPrice * 0.002, 15000);

    // Moving costs estimate
    const movingCosts = includeMoving ? 5000 : 0;

    // Furniture costs
    let furnitureCosts = 0;
    if (includeFurniture) {
      switch (furnitureLevel) {
        case 'basic':
          furnitureCosts = 30000;
          break;
        case 'standard':
          furnitureCosts = 80000;
          break;
        case 'premium':
          furnitureCosts = 200000;
          break;
      }
    }

    const totalAdditionalCosts = 
      purchaseTax + 
      lawyerFees + 
      agentFees + 
      mortgageAppraisal + 
      mortgageArrangementFee + 
      registrationFees + 
      movingCosts + 
      furnitureCosts;

    const grandTotal = propertyPrice + totalAdditionalCosts;
    const percentageOfPrice = (totalAdditionalCosts / propertyPrice) * 100;

    return {
      purchaseTax,
      lawyerFees,
      agentFees,
      mortgageAppraisal,
      mortgageArrangementFee,
      registrationFees,
      movingCosts,
      furnitureCosts,
      totalAdditionalCosts,
      grandTotal,
      percentageOfPrice,
    };
  }, [propertyPrice, buyerType, isNewConstruction, includeMoving, includeFurniture, furnitureLevel]);

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
          <Receipt className="h-5 w-5 text-primary" />
          Total Cost Calculator
        </CardTitle>
        <CardDescription>
          Calculate all costs involved in purchasing a property in Israel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Property Price: {formatCurrency(propertyPrice)}</Label>
              <Slider
                value={[propertyPrice]}
                onValueChange={([value]) => setPropertyPrice(value)}
                min={500000}
                max={15000000}
                step={50000}
              />
            </div>

            <div className="space-y-2">
              <Label>Buyer Type</Label>
              <Select value={buyerType} onValueChange={(v) => setBuyerType(v as typeof buyerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First-Time Buyer</SelectItem>
                  <SelectItem value="upgrader">Upgrader (Selling Current Home)</SelectItem>
                  <SelectItem value="investor">Investor / Second Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="new-construction">New Construction</Label>
              <Switch
                id="new-construction"
                checked={isNewConstruction}
                onCheckedChange={setIsNewConstruction}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="moving">Include Moving Costs</Label>
              <Switch
                id="moving"
                checked={includeMoving}
                onCheckedChange={setIncludeMoving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="furniture">Include Furniture</Label>
              <Switch
                id="furniture"
                checked={includeFurniture}
                onCheckedChange={setIncludeFurniture}
              />
            </div>

            {includeFurniture && (
              <div className="space-y-2">
                <Label>Furniture Level</Label>
                <Select value={furnitureLevel} onValueChange={(v) => setFurnitureLevel(v as typeof furnitureLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (~₪30,000)</SelectItem>
                    <SelectItem value="standard">Standard (~₪80,000)</SelectItem>
                    <SelectItem value="premium">Premium (~₪200,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary text-primary-foreground text-center">
              <p className="text-sm opacity-90">Total Cost</p>
              <p className="text-3xl font-bold">{formatCurrency(calculations.grandTotal)}</p>
              <p className="text-sm opacity-90">
                +{calculations.percentageOfPrice.toFixed(1)}% above property price
              </p>
            </div>

            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Home className="h-4 w-4" />
                Cost Breakdown
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Price:</span>
                  <span className="font-medium">{formatCurrency(propertyPrice)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Tax (Mas Rechisha):</span>
                  <span className="font-medium">{formatCurrency(calculations.purchaseTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lawyer Fees:</span>
                  <span className="font-medium">{formatCurrency(calculations.lawyerFees)}</span>
                </div>
                {calculations.agentFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent Commission:</span>
                    <span className="font-medium">{formatCurrency(calculations.agentFees)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortgage Fees:</span>
                  <span className="font-medium">
                    {formatCurrency(calculations.mortgageAppraisal + calculations.mortgageArrangementFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration (Tabu):</span>
                  <span className="font-medium">{formatCurrency(calculations.registrationFees)}</span>
                </div>
                {calculations.movingCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Moving:
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.movingCosts)}</span>
                  </div>
                )}
                {calculations.furnitureCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sofa className="h-3 w-3" /> Furniture:
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.furnitureCosts)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Additional Costs:</span>
                  <span className="text-primary">{formatCurrency(calculations.totalAdditionalCosts)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
