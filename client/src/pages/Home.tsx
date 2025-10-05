import { useState, useEffect, useMemo } from 'react';
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
import type { Child, Milestone, ChildMilestone, GrowthMetric } from '@shared/schema';

function calculateAge(birthDate: Date) {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();
  
  const dayDiff = today.getDate() - birth.getDate();
  let days = dayDiff;
  
  if (dayDiff < 0) {
    months--;
    const daysInPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days = daysInPrevMonth + dayDiff;
  }
  
  return { months, days: Math.max(0, days) };
}

function getAgeRange(months: number): { min: number; max: number; label: string } {
  if (months < 6) return { min: 0, max: 6, label: '0 - 6 month' };
  if (months < 12) return { min: 6, max: 12, label: '6 - 12 month' };
  if (months < 18) return { min: 12, max: 18, label: '12 - 18 month' };
  if (months < 24) return { min: 18, max: 24, label: '18 - 24 month' };
  if (months < 30) return { min: 24, max: 30, label: '24 - 30 month' };
  if (months < 36) return { min: 30, max: 36, label: '30 - 36 month' };
  return { min: 36, max: 48, label: '36 - 48 month' };
}

const categoryColors: Record<string, string> = {
  'Gross motor': 'bg-purple-100 dark:bg-purple-900/20',
  'Fine motor': 'bg-indigo-100 dark:bg-indigo-900/20',
  'Communication': 'bg-green-100 dark:bg-green-900/20',
  'Social & Emotional': 'bg-amber-100 dark:bg-amber-900/20',
  'Cognitive': 'bg-blue-100 dark:bg-blue-900/20',
};

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

  const selectedChild = useMemo(() => 
    children.find(c => c.id === activeChild),
    [children, activeChild]
  );

  const childAge = useMemo(() => 
    selectedChild ? calculateAge(new Date(selectedChild.birthDate)) : null,
    [selectedChild]
  );

  const ageRange = useMemo(() => 
    childAge ? getAgeRange(childAge.months) : null,
    [childAge]
  );

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones/age-range', ageRange?.min, ageRange?.max],
    enabled: ageRange !== null && ageRange?.min !== undefined && ageRange?.max !== undefined,
  });

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', activeChild, 'milestones'],
    enabled: !!activeChild && activeChild !== '',
  });

  const { data: growthMetrics = [] } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/children', activeChild, 'growth-metrics'],
    enabled: !!activeChild && activeChild !== '',
  });

  const achievedMilestoneIds = new Set(
    childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
  );

  const { data: allMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
  });

  const milestonesByCategory = useMemo(() => {
    const developmental = allMilestones.filter(m => 
      ['Gross Motor', 'Fine motor', 'Communication', 'Social & Emotional', 'Cognitive'].includes(m.category)
    );
    const vision = allMilestones.filter(m => m.category === 'Vision');
    const hearing = allMilestones.filter(m => m.category === 'Hearing');
    
    return { developmental, vision, hearing };
  }, [allMilestones]);

  const latestMetrics = useMemo(() => {
    const weight = growthMetrics
      .filter(m => m.type === 'weight')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const height = growthMetrics
      .filter(m => m.type === 'height')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const head = growthMetrics
      .filter(m => m.type === 'head_circumference')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return { weight, height, head };
  }, [growthMetrics]);

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  if (childrenLoading || !selectedChild || !childAge) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-muted animate-pulse rounded-full w-32" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  const firstName = selectedChild.name.split(' ')[0];
  const pronoun = selectedChild.gender === 'female' ? 'She' : selectedChild.gender === 'male' ? 'He' : 'They';

  const achievedCount = childMilestones.filter(cm => cm.achieved).length;
  const totalInRange = milestones.length;
  const notAchievedMilestones = milestones.filter(m => !achievedMilestoneIds.has(m.id));

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
            <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">Overview</h1>
          <p className="text-muted-foreground" data-testid="text-child-age">
            {firstName} is {childAge.months} {childAge.months === 1 ? 'month' : 'months'}
            {childAge.days > 0 && ` & ${childAge.days} ${childAge.days === 1 ? 'day' : 'days'}`}!
          </p>
        </div>

        {achievedCount > 0 || notAchievedMilestones.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">Highlights</h2>
            <div className="space-y-3">
              {achievedCount > 0 && (
                <HighlightCard
                  type="achievement"
                  title={`Great progress! ${firstName} has achieved ${achievedCount} ${achievedCount === 1 ? 'milestone' : 'milestones'}.`}
                  description={`${pronoun} ${achievedCount === 1 ? 'is' : 'are'} developing well. Keep up the great work!`}
                />
              )}
              
              {notAchievedMilestones.length > 0 && notAchievedMilestones.slice(0, 1).map(milestone => (
                <HighlightCard
                  key={milestone.id}
                  type="alert"
                  title={`${firstName} hasn't achieved "${milestone.title}" yet.`}
                  description={`This milestone is typically achieved between ${milestone.ageRangeMonthsMin}-${milestone.ageRangeMonthsMax} months. Check our guides for activities to help.`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{ageRange?.label} Milestones</h2>
          </div>

          {milestonesByCategory.developmental.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Developmental</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="button-view-all-developmental"
                  onClick={() => setLocation('/milestones')}
                >
                  View all →
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {milestonesByCategory.developmental.slice(0, 3).map(milestone => (
                  <MilestoneCard
                    key={milestone.id}
                    title={milestone.title}
                    category={milestone.category}
                    categoryColor={categoryColors[milestone.category] || 'bg-gray-100 dark:bg-gray-900/20'}
                    achieved={achievedMilestoneIds.has(milestone.id)}
                    onClick={() => setLocation(`/milestone/${milestone.id}`)}
                    data-testid={`card-milestone-${milestone.id}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {(latestMetrics.weight || latestMetrics.height || latestMetrics.head) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Growth</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-growth-details"
                onClick={() => setLocation('/growth/weight')}
              >
                View details →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {latestMetrics.weight && (
                <GrowthMetricCard
                  type="weight"
                  value={latestMetrics.weight.value.toString()}
                  unit="kg"
                  percentile={latestMetrics.weight.percentile || 0}
                  color="bg-blue-50 dark:bg-blue-950/20"
                  onClick={() => setLocation('/growth/weight')}
                  data-testid="card-growth-weight"
                />
              )}
              {latestMetrics.height && (
                <GrowthMetricCard
                  type="height"
                  value={latestMetrics.height.value.toString()}
                  unit="cm"
                  percentile={latestMetrics.height.percentile || 0}
                  color="bg-amber-50 dark:bg-amber-950/20"
                  onClick={() => setLocation('/growth/height')}
                  data-testid="card-growth-height"
                />
              )}
              {latestMetrics.head && (
                <GrowthMetricCard
                  type="head"
                  value={latestMetrics.head.value.toString()}
                  unit="cm"
                  percentile={latestMetrics.head.percentile || 0}
                  color="bg-teal-50 dark:bg-teal-950/20"
                  onClick={() => setLocation('/growth/head')}
                  data-testid="card-growth-head"
                />
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Teeth</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              data-testid="button-view-all-teeth"
            >
              View all →
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              <p className="text-sm font-medium text-center">Lateral Incisors</p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              <p className="text-sm font-medium text-center">First Molars</p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              <p className="text-sm font-medium text-center">Canine</p>
            </div>
          </div>
        </div>

        {milestonesByCategory.vision.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Vision</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-vision"
              >
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {milestonesByCategory.vision.slice(0, 3).map(milestone => (
                <div 
                  key={milestone.id}
                  className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 min-h-[120px] flex items-center justify-center cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setLocation(`/milestone/${milestone.id}`)}
                  data-testid={`card-vision-${milestone.id}`}
                >
                  <p className="text-sm font-medium text-center">{milestone.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {milestonesByCategory.hearing.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Hearing</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-hearing"
              >
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {milestonesByCategory.hearing.slice(0, 3).map(milestone => (
                <div 
                  key={milestone.id}
                  className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-4 min-h-[120px] flex items-center justify-center cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setLocation(`/milestone/${milestone.id}`)}
                  data-testid={`card-hearing-${milestone.id}`}
                >
                  <p className="text-sm font-medium text-center">{milestone.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
