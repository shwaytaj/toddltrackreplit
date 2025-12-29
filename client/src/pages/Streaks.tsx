import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flame, Check, Calendar, Trophy, Target, Sparkles, BookOpen, Palette, TreeDeciduous, Gamepad2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { useUser } from '@/hooks/use-user';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { StreakActivity, DailyStreak } from '@shared/schema';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streaks: DailyStreak[];
}

const categoryIcons: Record<string, typeof Flame> = {
  reading: BookOpen,
  creative: Palette,
  outdoor: TreeDeciduous,
  play: Gamepad2,
  learning: GraduationCap,
};

const defaultActivities = [
  { title: 'Read a Story', description: 'Read a picture book together', category: 'reading', icon: 'BookOpen' },
  { title: 'Outdoor Play', description: 'Spend 15+ minutes playing outside', category: 'outdoor', icon: 'TreeDeciduous' },
  { title: 'Creative Time', description: 'Draw, paint, or craft together', category: 'creative', icon: 'Palette' },
  { title: 'Learning Activity', description: 'Practice counting, colors, or shapes', category: 'learning', icon: 'GraduationCap' },
  { title: 'Imaginative Play', description: 'Role play or build with blocks', category: 'play', icon: 'Gamepad2' },
];

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

  const { data: activities = [] } = useQuery<StreakActivity[]>({
    queryKey: ['/api/streaks/activities'],
    enabled: !!user,
  });

  const todayCompleted = useMemo(() => {
    if (!streakData?.streaks) return false;
    return streakData.streaks.some(s => s.date === today);
  }, [streakData, today]);

  const markDoneMutation = useMutation({
    mutationFn: async (activity?: { id: string; title: string }) => {
      if (!activeChildId) throw new Error('No child selected');
      
      return apiRequest('POST', `/api/children/${activeChildId}/streaks`, {
        date: today,
        activityId: activity?.id || null,
        activityTitle: activity?.title || 'General Activity',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChildId, 'streaks'] });
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
  const displayActivities = activities.length > 0 ? activities : defaultActivities.map((a, i) => ({
    ...a,
    id: `default-${i}`,
    ageRangeMonthsMin: 0,
    ageRangeMonthsMax: 72,
    isActive: true,
  })) as unknown as StreakActivity[];

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

        {!todayCompleted && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">Ready to mark today?</p>
                    <p className="text-sm text-muted-foreground">Pick an activity or just mark it done!</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => markDoneMutation.mutate(undefined)}
                  disabled={markDoneMutation.isPending}
                  data-testid="button-mark-done-quick"
                >
                  {markDoneMutation.isPending ? 'Saving...' : 'Done!'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            Activity Ideas
          </h2>
          
          <div className="space-y-3">
            {displayActivities.map((activity) => {
              const IconComponent = categoryIcons[activity.category] || Sparkles;
              
              return (
                <Card 
                  key={activity.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => {
                    if (!todayCompleted) {
                      markDoneMutation.mutate({ id: activity.id, title: activity.title });
                    }
                  }}
                  data-testid={`activity-card-${activity.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                      </div>
                      {!todayCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={markDoneMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            markDoneMutation.mutate({ id: activity.id, title: activity.title });
                          }}
                          data-testid={`button-activity-${activity.id}`}
                        >
                          Do This
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
