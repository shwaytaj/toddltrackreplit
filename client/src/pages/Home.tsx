import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Flame, Check, Calendar, Trophy, Target, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ChildSelector from '@/components/ChildSelector';
import CategoryProgressCard from '@/components/CategoryProgressCard';
import GrowthMetricCard from '@/components/GrowthMetricCard';
import HighlightCard from '@/components/HighlightCard';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@/hooks/use-user';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { useToast } from '@/hooks/use-toast';
import { calculateAdjustedAge, getAgeRange, getAdjustedMonthsForRange, formatAge } from '@/lib/age-calculation';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import type { Milestone, ChildMilestone, GrowthMetric, DailyStreak } from '@shared/schema';
import type { Highlight } from '@shared/highlights';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streaks: DailyStreak[];
}

interface StreakActivity {
  milestoneId: string;
  milestoneTitle: string;
  milestoneCategory: string;
  milestoneSubcategory: string | null;
  activity: {
    title: string;
    description: string;
    citations?: Array<{ source: string; url?: string }>;
  };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<NavPage>('home');
  const [weekOffset, setWeekOffset] = useState(0);
  const { user, isLoading: userLoading } = useUser();
  const { children, activeChildId, activeChild: selectedChild, setActiveChildId, isLoading: childrenLoading } = useActiveChild();
  const { toast } = useToast();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [userLoading, user, setLocation]);

  useEffect(() => {
    if (!userLoading && user && !childrenLoading && children.length === 0) {
      setLocation('/onboarding');
    }
  }, [userLoading, user, childrenLoading, children, setLocation]);

  const adjustedAge = useMemo(() => {
    if (!selectedChild) return null;
    return calculateAdjustedAge(selectedChild.dueDate);
  }, [selectedChild]);

  const adjustedMonths = useMemo(() => {
    if (!selectedChild) return 0;
    return getAdjustedMonthsForRange(selectedChild.dueDate);
  }, [selectedChild]);

  const ageRange = useMemo(() => 
    adjustedMonths >= 0 ? getAgeRange(adjustedMonths) : null,
    [adjustedMonths]
  );

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones/age-range', ageRange?.min, ageRange?.max],
    enabled: ageRange !== null && ageRange?.min !== undefined && ageRange?.max !== undefined,
  });

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', activeChildId, 'milestones'],
    enabled: !!activeChildId,
  });

  const { data: growthMetrics = [] } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/children', activeChildId, 'growth-metrics'],
    enabled: !!activeChildId,
  });

  const { data: highlightsData } = useQuery<{
    highlights: Highlight[];
    ageRange: { min: number; max: number; label: string };
    daysUntilRangeEnds: number;
  }>({
    queryKey: ['/api/children', activeChildId, 'highlights'],
    enabled: !!activeChildId,
  });

  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['/api/children', activeChildId, 'streaks'],
    enabled: !!activeChildId,
  });

  const { data: streakActivities = [], isLoading: activitiesLoading } = useQuery<StreakActivity[]>({
    queryKey: ['/api/children', activeChildId, 'streak-activities'],
    enabled: !!activeChildId,
  });

  const todayCompleted = useMemo(() => {
    if (!streakData?.streaks) return false;
    return streakData.streaks.some(s => s.date === today);
  }, [streakData, today]);

  const markDoneMutation = useMutation({
    mutationFn: async (activity: { 
      milestoneId: string; 
      title: string; 
      description: string;
      citations?: Array<{ source: string; url?: string }>;
    }) => {
      if (!activeChildId) throw new Error('No child selected');
      
      return apiRequest('POST', `/api/children/${activeChildId}/streaks`, {
        date: today,
        activityId: activity.milestoneId,
        activityTitle: activity.title,
        activityDescription: activity.description,
        activityCitations: activity.citations,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChildId, 'streaks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChildId, 'completed-recommendations'] });
      toast({
        title: 'Day Complete!',
        description: 'Great job! Keep up the streak!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark day as done',
        variant: 'destructive',
      });
    },
  });

  const achievedMilestoneIds = new Set(
    childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
  );

  const categoryProgress = useMemo(() => {
    const categories = ['Developmental', 'Teeth', 'Vision', 'Hearing'] as const;
    
    return categories.map(category => {
      const categoryMilestones = milestones.filter(m => m.category === category);
      const achievedCount = categoryMilestones.filter(m => achievedMilestoneIds.has(m.id)).length;
      return {
        category,
        total: categoryMilestones.length,
        achieved: achievedCount,
      };
    }).filter(c => c.total > 0);
  }, [milestones, achievedMilestoneIds]);

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

  const getWeekDays = (offset: number) => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];
    
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() + (offset * 7));
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = streakData?.streaks.some(s => s.date === dateStr) || false;
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        isCompleted,
      });
    }
    return days;
  };

  const getWeekLabel = (offset: number) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() + (offset * 7));
    
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    return `${formatDate(startOfWeek)} - ${formatDate(baseDate)}`;
  };

  const handleNavigation = (page: NavPage) => {
    setActiveNav(page);
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
    if (page === 'reports') setLocation('/reports');
  };

  const handleViewCategory = (category: string) => {
    setLocation(`/milestones?category=${encodeURIComponent(category)}`);
  };

  if (childrenLoading || !selectedChild || !adjustedAge) {
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
  const weekDays = getWeekDays(weekOffset);
  const weekLabel = getWeekLabel(weekOffset);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div>
          <ChildSelector
            children={children}
            activeId={activeChildId || ''}
            onSelect={setActiveChildId}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">Overview</h1>
          <div className="space-y-1">
            <p className="font-medium" data-testid="text-child-age">
              {firstName}'s adjusted age is {formatAge(adjustedAge)}!
            </p>
            <p className="text-sm text-muted-foreground">
              We calculate the developmental milestone range based on due date and not the birth date of the child.
            </p>
          </div>
        </div>

        {highlightsData?.highlights && highlightsData.highlights.length > 0 && (
          <div className="space-y-3" data-testid="section-highlights">
            {highlightsData.highlights.map((highlight, index) => (
              <HighlightCard key={`${highlight.type}-${index}`} highlight={highlight} />
            ))}
          </div>
        )}

        <Card className="overflow-hidden" data-testid="section-streaks">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 border-b border-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Daily Streaks</h2>
                <p className="text-sm text-muted-foreground">
                  Build daily habits with {firstName}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className={cn(
                  "w-8 h-8",
                  (streakData?.currentStreak || 0) > 0 ? "text-orange-500" : "text-muted-foreground"
                )} />
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {streakData?.currentStreak || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Trophy className="w-4 h-4" />
                    <span className="font-semibold">{streakData?.longestStreak || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Best</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">{streakData?.totalDays || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev - 1)}
                data-testid="button-prev-week"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">{weekLabel}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev + 1)}
                disabled={weekOffset >= 0}
                data-testid="button-next-week"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-between gap-1">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col items-center py-2 px-2 rounded-lg flex-1",
                    day.isToday && "bg-primary/15"
                  )}
                  data-testid={`streak-day-${day.date}`}
                >
                  <span className="text-xs text-muted-foreground">{day.dayName}</span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                    day.isCompleted 
                      ? "bg-green-500 text-white" 
                      : day.isToday 
                        ? "bg-primary/20 text-primary border-2 border-primary/40"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {day.isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{day.dayNum}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-4">
            {todayCompleted && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Today is complete!</p>
                  <p className="text-sm text-muted-foreground">Great work! See you tomorrow.</p>
                </div>
              </div>
            )}

            {!todayCompleted && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Today's Activities</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete an activity to maintain your streak
                </p>
              </>
            )}
            
            {!todayCompleted && (
              activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : streakActivities.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-lg bg-muted/50">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No activity recommendations available yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Visit the Milestones page to explore activities!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {streakActivities.map((item, idx) => (
                    <div 
                      key={`${item.milestoneId}-${idx}`}
                      className="p-3 rounded-lg border bg-card transition-all"
                      data-testid={`activity-card-${item.milestoneId}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`activity-${idx}`}
                          className="mt-0.5"
                          checked={false}
                          disabled={markDoneMutation.isPending}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              markDoneMutation.mutate({
                                milestoneId: item.milestoneId,
                                title: item.activity.title,
                                description: item.activity.description,
                                citations: item.activity.citations,
                              });
                            }
                          }}
                          data-testid={`checkbox-activity-${idx}`}
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={`activity-${idx}`} 
                            className="font-medium cursor-pointer block text-foreground text-sm"
                          >
                            {item.activity.title}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              {item.milestoneTitle}
                            </span>
                            {item.milestoneSubcategory && (
                              <span className="px-1.5 py-0.5 bg-primary/10 rounded text-[10px] text-primary">
                                {item.milestoneSubcategory}
                              </span>
                            )}
                          </div>
                          {item.activity.citations && item.activity.citations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.activity.citations.slice(0, 2).map((citation, citIdx) => (
                                <span 
                                  key={citIdx} 
                                  className="inline-flex items-center text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                                >
                                  {citation.url ? (
                                    <a 
                                      href={citation.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {citation.source}
                                    </a>
                                  ) : (
                                    citation.source
                                  )}
                                </span>
                              ))}
                              {item.activity.citations.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">
                                  +{item.activity.citations.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4" data-testid="heading-milestone-range">
            {ageRange?.label} Milestones
          </h2>

          <div className="space-y-4">
            {categoryProgress.map(({ category, total, achieved }) => (
              <CategoryProgressCard
                key={category}
                category={category}
                childName={selectedChild.name}
                achievedCount={achieved}
                totalCount={total}
                onViewAll={() => handleViewCategory(category)}
              />
            ))}
          </div>
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
                  onClick={() => setLocation('/growth/head')}
                  data-testid="card-growth-head"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
