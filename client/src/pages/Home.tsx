import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChildSelector from '@/components/ChildSelector';
import HighlightCard from '@/components/HighlightCard';
import MilestoneCard from '@/components/MilestoneCard';
import GrowthMetricCard from '@/components/GrowthMetricCard';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { Child } from '@shared/schema';

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('home');
  const { user, isLoading: userLoading } = useUser();

  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  const [activeChild, setActiveChild] = useState('');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [user, userLoading, setLocation]);

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <ChildSelector
            children={children}
            activeId={activeChild}
            onSelect={setActiveChild}
          />
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Overview</h1>
          <p className="text-muted-foreground">Arya is 21 months & 15 days!</p>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Highlights</h2>
          <div className="space-y-3">
            <HighlightCard
              type="achievement"
              title="Woohoo! Arya is a trooper."
              description="She started walking last week. Her walk may seem wobbly now but she will be walking more stably and even running!"
            />
            <HighlightCard
              type="alert"
              title="Arya is not talking yet."
              description="Try some of our guides and if you're still worried contact a GP or Public Health Nurse. Ask for a development review."
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">20 - 26 month Milestones</h2>
            <Button variant="ghost" size="sm" data-testid="button-view-all-milestones">
              View all →
            </Button>
          </div>
          <h3 className="text-sm font-medium mb-2">Developmental</h3>
          <div className="grid grid-cols-3 gap-3">
            <MilestoneCard
              title="Jump in place"
              category="Gross motor"
              categoryColor="bg-purple-100 dark:bg-purple-900/20"
              onClick={() => setLocation('/milestone/jump-in-place')}
            />
            <MilestoneCard
              title="2 to 3 word sentences"
              category="Communication"
              categoryColor="bg-green-100 dark:bg-green-900/20"
              achieved
              onClick={() => setLocation('/milestone/2-3-word-sentences')}
            />
            <MilestoneCard
              title="Match pictures & objects"
              category="Social & Emotional"
              categoryColor="bg-amber-100 dark:bg-amber-900/20"
              onClick={() => setLocation('/milestone/match-pictures-objects')}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Growth</h2>
            <Button variant="ghost" size="sm" data-testid="button-view-growth-details">
              View details →
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <GrowthMetricCard
              type="weight"
              value="8.8"
              unit="kgs"
              percentile={3}
              color="bg-blue-50 dark:bg-blue-950/20"
              onClick={() => setLocation('/growth/weight')}
            />
            <GrowthMetricCard
              type="height"
              value="76"
              unit="cm"
              percentile={1}
              color="bg-amber-50 dark:bg-amber-950/20"
              onClick={() => setLocation('/growth/height')}
            />
            <GrowthMetricCard
              type="head"
              value="45"
              unit="cm"
              percentile={4}
              color="bg-teal-50 dark:bg-teal-950/20"
              onClick={() => setLocation('/growth/head')}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Teeth</h2>
            <Button variant="ghost" size="sm" data-testid="button-view-teeth">
              View all →
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MilestoneCard
              title="Lateral Incisors"
              category=""
              categoryColor="bg-pink-50 dark:bg-pink-900/20"
            />
            <MilestoneCard
              title="First Molars"
              category=""
              categoryColor="bg-pink-50 dark:bg-pink-900/20"
            />
            <MilestoneCard
              title="Canines"
              category=""
              categoryColor="bg-pink-50 dark:bg-pink-900/20"
            />
          </div>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
