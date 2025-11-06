import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface GrowthDetailModalProps {
  open: boolean;
  onClose: () => void;
  metric: {
    type: 'weight' | 'height' | 'head';
    value: string;
    unit: string;
    percentile: number;
    lastUpdate: string;
    trend?: string;
  };
}

export default function GrowthDetailModal({
  open,
  onClose,
  metric
}: GrowthDetailModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  const labels = {
    weight: 'Weight',
    height: 'Height',
    head: 'Head Circumference'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          data-testid="button-close-modal"
        >
          <X className="h-4 w-4" />
        </button>
        
        <DialogHeader className="bg-muted/30 -mx-6 -mt-6 px-6 py-4 mb-4">
          <p className="text-xs text-muted-foreground">Growth</p>
          <DialogTitle className="text-lg">{labels[metric.type]}</DialogTitle>
          <p className="text-sm text-muted-foreground">20-26 month</p>
        </DialogHeader>

        <Tabs defaultValue="tracking" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="tracking" className="flex-1" data-testid="tab-tracking">Tracking</TabsTrigger>
            <TabsTrigger value="help" className="flex-1" data-testid="tab-help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Current (last updated on {metric.lastUpdate})</p>
              <p className="text-3xl font-semibold">
                {metric.value} <span className="text-lg text-muted-foreground">{metric.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Baby is trending in the {metric.percentile}{metric.percentile === 1 ? 'st' : metric.percentile === 2 ? 'nd' : metric.percentile === 3 ? 'rd' : 'th'} percentile
              </p>
              {metric.trend && (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" /> {metric.trend}
                </p>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Growth trend chart visualization</p>
            </div>

            {!showAddForm ? (
              <Button 
                className="w-full rounded-full"
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-measurement"
              >
                + Add {metric.type}
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                <h3 className="font-semibold">Add {labels[metric.type]}</h3>
                <div className="space-y-2">
                  <Label>{labels[metric.type]}</Label>
                  <Input placeholder={`e.g 13 ${metric.unit}`} data-testid="input-measurement" />
                </div>
                <div className="space-y-2">
                  <Label>Date of measure</Label>
                  <Input type="date" data-testid="input-date" />
                </div>
                <Button 
                  className="w-full rounded-full"
                  onClick={() => {
                    console.log('Measurement submitted');
                    setShowAddForm(false);
                  }}
                  data-testid="button-submit-measurement"
                >
                  + Submit
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">About growth tracking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Regular growth monitoring helps track your child's development. Measurements are compared against WHO growth standards to understand how your child is growing relative to other children of the same age and gender.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">When to measure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Measure your child regularly during doctor visits or at home. Consistency is key - try to measure at the same time of day for the most accurate tracking.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
