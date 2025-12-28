import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import { X, TrendingUp } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { GrowthMetric, Child } from '@shared/schema';

export default function GrowthDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/growth/:type');
  const [activeTab, setActiveTab] = useState<'tracking' | 'help'>('tracking');
  const [activeNav, setActiveNav] = useState<NavPage>('home');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  const selectedChild = children[0];
  const type = params?.type as 'weight' | 'height' | 'head';

  const { data: metrics = [] } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/children', selectedChild?.id, 'growth-metrics', type],
    queryFn: async () => {
      if (!selectedChild) return [];
      const res = await fetch(`/api/children/${selectedChild.id}/growth-metrics?type=${type}`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedChild,
  });

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const labels: Record<string, string> = {
    weight: 'Weight',
    height: 'Height',
    head: 'Head Circumference',
  };

  const units: Record<string, string> = {
    weight: 'kg',
    height: 'cm',
    head: 'cm',
  };

  const handleNavigation = (page: NavPage) => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  const getOrdinal = (num: number) => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-muted/30 px-4 py-6 relative">
        <button
          onClick={() => setLocation('/home')}
          className="absolute top-4 right-4 p-2 hover-elevate active-elevate-2 rounded-lg"
          data-testid="button-close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">Growth</p>
          <h1 className="text-2xl font-bold mt-1 pr-12">{labels[type]}</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedChild?.name || 'Child'}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
              activeTab === 'tracking'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
            data-testid="tab-tracking"
          >
            Tracking
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
              activeTab === 'help'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
            data-testid="tab-help"
          >
            Help
          </button>
        </div>

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            {latestMetric ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Current (last updated on {new Date(latestMetric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </p>
                <p className="text-3xl font-semibold">
                  {latestMetric.value} <span className="text-lg text-muted-foreground">{units[type]}</span>
                </p>
                {latestMetric.percentile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Baby is trending in the {Math.round(latestMetric.percentile)}{getOrdinal(Math.round(latestMetric.percentile))} percentile
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No measurements recorded yet</p>
            )}

            <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Growth trend chart visualization</p>
            </div>

            {!showAddForm ? (
              <Button 
                className="w-full rounded-full"
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-measurement"
              >
                + Add {type}
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold">Add {labels[type]}</h3>
                <div className="space-y-2">
                  <Label>{labels[type]}</Label>
                  <Input placeholder={`e.g 13 ${units[type]}`} data-testid="input-measurement" />
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
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
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
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
