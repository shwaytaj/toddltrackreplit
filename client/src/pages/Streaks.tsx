import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flame, Check, Calendar, Trophy, Target, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { useUser } from '@/hooks/use-user';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { DailyStreak } from '@shared/schema';

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

export default function Streaks() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<NavPage>('streaks');
  const { user, isLoading: userLoading } = useUser();
  const { activeChildId, activeChild, isLoading: childrenLoading } = useActiveChild();
  const { toast } = useToast();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  const { data: streakData, isLoading: streakLoading } = useQuery<StreakData>({
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

  const handleNavigation = (page: NavPage) => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
    if (page === 'reports') setLocation('/reports');
  };

  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = streakData?.streaks.some(s => s.date === dateStr) || false;
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: i === 0,
        isCompleted,
      });
    }
    return days;
  };

  if (userLoading || childrenLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-muted animate-pulse rounded-full w-32" />
          <div className="h-40 bg-muted animate-pulse rounded-xl" />
        </div>
        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  const weekDays = getWeekDays();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Toddl Streaks</h1>
            <p className="text-sm text-muted-foreground">
              {activeChild?.name ? `Track activities with ${activeChild.name}` : 'Build daily habits together'}
            </p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
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

            <div className="flex justify-between gap-1">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col items-center py-2 px-2 rounded-lg flex-1",
                    day.isToday && "bg-primary/10"
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
          </CardContent>
        </Card>

        {todayCompleted && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Today is complete!</p>
                  <p className="text-sm text-muted-foreground">Great work! See you tomorrow.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Activity Recommendations
          </h2>
          
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : streakActivities.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Loading activity recommendations...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment as we personalize activities for your child.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {streakActivities.map((item, idx) => (
                <Card 
                  key={`${item.milestoneId}-${idx}`}
                  className={cn(
                    "transition-all",
                    todayCompleted && "opacity-60"
                  )}
                  data-testid={`activity-card-${item.milestoneId}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`activity-${idx}`}
                        className="mt-1"
                        checked={todayCompleted}
                        disabled={todayCompleted || markDoneMutation.isPending}
                        onCheckedChange={(checked) => {
                          if (checked && !todayCompleted) {
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
                      <div className="flex-1">
                        <label 
                          htmlFor={`activity-${idx}`} 
                          className={cn(
                            "font-semibold cursor-pointer block text-foreground",
                            todayCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {item.activity.title}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {item.activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-primary/70">
                          <span>For: {item.milestoneTitle}</span>
                          {item.milestoneSubcategory && (
                            <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                              {item.milestoneSubcategory}
                            </span>
                          )}
                        </div>
                        {item.activity.citations && item.activity.citations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.activity.citations.map((citation, citIdx) => (
                              <span 
                                key={citIdx} 
                                className="inline-flex items-center text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border"
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
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
