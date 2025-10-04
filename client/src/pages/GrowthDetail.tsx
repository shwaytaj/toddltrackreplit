import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { X, TrendingUp } from 'lucide-react';

export default function GrowthDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/growth/:type');
  const [activeTab, setActiveTab] = useState<'tracking' | 'help'>('tracking');
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('home');
  const [showAddForm, setShowAddForm] = useState(false);

  //todo: remove mock functionality - fetch actual growth data based on params.type
  const growthData: Record<string, any> = {
    weight: {
      type: 'weight',
      value: '8.8',
      unit: 'kgs',
      percentile: 3,
      lastUpdate: '23rd Aug 2025',
      trend: 'up 1 centile from last month.',
      label: 'Weight'
    },
    height: {
      type: 'height',
      value: '76',
      unit: 'cm',
      percentile: 1,
      lastUpdate: '23rd Aug 2025',
      label: 'Height'
    },
    head: {
      type: 'head',
      value: '46',
      unit: 'cm',
      percentile: 10,
      lastUpdate: '23rd Aug 2025',
      label: 'Head Circumference'
    }
  };

  const metric = growthData[params?.type || 'weight'];

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
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
      <div className="bg-blue-50 dark:bg-blue-950/20 px-4 py-6 relative">
        <button
          onClick={() => setLocation('/home')}
          className="absolute top-4 right-4 p-2 hover-elevate active-elevate-2 rounded-lg"
          data-testid="button-close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">Growth</p>
          <h1 className="text-2xl font-bold mt-1 pr-12">{metric.label}</h1>
          <p className="text-sm text-muted-foreground mt-1">20-26 month</p>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
              activeTab === 'tracking'
                ? 'bg-[#2C3E50] text-white'
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
                ? 'bg-[#2C3E50] text-white'
                : 'bg-muted text-foreground'
            }`}
            data-testid="tab-help"
          >
            Help
          </button>
        </div>

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Current (last updated on {metric.lastUpdate})</p>
              <p className="text-3xl font-semibold">
                {metric.value} <span className="text-lg text-muted-foreground">{metric.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Baby is trending in the {metric.percentile}{getOrdinal(metric.percentile)} percentile
              </p>
              {metric.trend && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" /> {metric.trend}
                </p>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Growth trend chart visualization</p>
            </div>

            {!showAddForm ? (
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-measurement"
              >
                + Add {metric.type}
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold">Add {metric.label}</h3>
                <div className="space-y-2">
                  <Label>{metric.label}</Label>
                  <Input placeholder={`e.g 13 ${metric.unit}`} data-testid="input-measurement" />
                </div>
                <div className="space-y-2">
                  <Label>Date of measure</Label>
                  <Input type="date" data-testid="input-date" />
                </div>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
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
