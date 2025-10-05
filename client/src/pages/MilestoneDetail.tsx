import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { X, Check, Lightbulb, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Milestone, Child, ChildMilestone } from '@shared/schema';

interface AIRecommendation {
  title: string;
  description: string;
}

export default function MilestoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/milestone/:id');
  const [activeTab, setActiveTab] = useState<'about' | 'action'>('action');
  const [activeActionTab, setActiveActionTab] = useState<'todo' | 'tools'>('todo');
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  const { data: allMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
  });

  const milestone = allMilestones.find(m => m.id === params?.id);
  const selectedChild = children[0];

  const { data: achievementStatus } = useQuery<ChildMilestone | null>({
    queryKey: ['/api/children', selectedChild?.id, 'milestones', milestone?.id],
    enabled: !!selectedChild && !!milestone,
    queryFn: async () => {
      if (!selectedChild || !milestone) return null;
      try {
        const response = await fetch(`/api/children/${selectedChild.id}/milestones`);
        if (!response.ok) return null;
        const allChildMilestones: ChildMilestone[] = await response.json();
        return allChildMilestones.find(cm => cm.milestoneId === milestone.id) || null;
      } catch {
        return null;
      }
    },
  });

  const toggleAchievement = useMutation({
    mutationFn: async (newValue: 'achieved' | 'not-achieved') => {
      if (!selectedChild || !milestone) return;
      const currentlyAchieved = achievementStatus?.achieved || false;
      const shouldBeAchieved = newValue === 'achieved';
      
      if (currentlyAchieved === shouldBeAchieved) return;
      
      const response = await apiRequest(
        'POST',
        `/api/children/${selectedChild.id}/milestones/${milestone.id}/toggle`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/children', selectedChild?.id, 'milestones', milestone?.id] 
      });
    },
  });

  const { data: recommendations, mutate: fetchRecommendations, isPending: loadingRecommendations } = useMutation<AIRecommendation[]>({
    mutationFn: async () => {
      if (!selectedChild || !milestone) return [];
      const response = await apiRequest(
        'POST',
        `/api/children/${selectedChild.id}/milestones/${milestone.id}/recommendations`
      );
      const data = await response.json();
      return data;
    },
  });

  useEffect(() => {
    if (selectedChild && milestone && activeTab === 'action' && activeActionTab === 'todo') {
      fetchRecommendations();
    }
  }, [selectedChild, milestone, activeTab, activeActionTab, fetchRecommendations]);

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  if (!milestone) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading milestone...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-green-100 dark:bg-green-900/20 px-4 py-6 relative">
        <button
          onClick={() => setLocation('/home')}
          className="absolute top-4 right-4 p-2 hover-elevate active-elevate-2 rounded-lg"
          data-testid="button-close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">{milestone.category}</p>
          <h1 className="text-2xl font-bold mt-1 pr-12">{milestone.title}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('action')}
            className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
              activeTab === 'action'
                ? 'bg-[#2C3E50] text-white'
                : 'bg-muted text-foreground'
            }`}
            data-testid="tab-action"
          >
            Action
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
              activeTab === 'about'
                ? 'bg-[#2C3E50] text-white'
                : 'bg-muted text-foreground'
            }`}
            data-testid="tab-about"
          >
            About
          </button>
        </div>

        {activeTab === 'about' && milestone && (
          <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About the milestone</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
            </div>

            {milestone.typicalRange && (
              <div>
                <h3 className="font-semibold mb-2">Typical range</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {milestone.typicalRange}
                </p>
              </div>
            )}

            <ToggleGroup 
              type="single" 
              value={achievementStatus?.achieved ? 'achieved' : 'not-achieved'}
              onValueChange={(value) => {
                if (value) toggleAchievement.mutate(value as 'achieved' | 'not-achieved');
              }}
              className="w-full"
              disabled={toggleAchievement.isPending}
              data-testid="toggle-achievement-status"
            >
              <ToggleGroupItem 
                value="not-achieved" 
                className="flex-1 rounded-l-full data-[state=on]:bg-red-100 data-[state=on]:text-red-800 dark:data-[state=on]:bg-red-950 dark:data-[state=on]:text-red-200"
                data-testid="toggle-not-achieved"
              >
                Not Achieved
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="achieved" 
                className="flex-1 rounded-r-full"
                data-testid="toggle-achieved"
              >
                <Check className="w-4 h-4 mr-1" />
                Achieved
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {activeTab === 'action' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveActionTab('todo')}
                className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                  activeActionTab === 'todo'
                    ? 'bg-[#2C3E50] text-white'
                    : 'bg-muted text-foreground'
                }`}
                data-testid="tab-todo"
              >
                To-do
              </button>
              <button
                onClick={() => setActiveActionTab('tools')}
                className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                  activeActionTab === 'tools'
                    ? 'bg-[#2C3E50] text-white'
                    : 'bg-muted text-foreground'
                }`}
                data-testid="tab-tools"
              >
                Toys & Tools
              </button>
            </div>

            {activeActionTab === 'todo' && (
              <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
                {achievementStatus?.achieved ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Milestone Achieved!</h3>
                    <p className="text-sm text-muted-foreground">
                      Great job! Your child has achieved this milestone.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2">How parents can help</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {loadingRecommendations ? 'Loading personalized recommendations...' : 'AI-powered guidance personalized for your child'}
                    </p>
                    
                    {loadingRecommendations ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Generating recommendations...
                      </div>
                    ) : recommendations && recommendations.length > 0 ? (
                      <div className="space-y-4">
                        {recommendations.map((guide, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Checkbox 
                              id={`guide-${idx}`} 
                              className="mt-0.5" 
                              data-testid={`checkbox-guide-${idx}`} 
                            />
                            <div className="flex-1">
                              <label htmlFor={`guide-${idx}`} className="text-sm font-semibold cursor-pointer block">
                                {guide.title}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{guide.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No recommendations available
                      </div>
                    )}
                    
                    {recommendations && recommendations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-4">
                        More guides will be suggested after you have tried all the above
                      </p>
                    )}
                  </div>
                )}

                {!achievementStatus?.achieved && recommendations && recommendations.length > 0 && (
                  <>
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium">Want more personalized recommendations?</span> These to-dos are based on the medical history you've provided.
                          </p>
                        </div>
                        {selectedChild && (
                          <button
                            onClick={() => setLocation(`/medical-history/${selectedChild.id}`)}
                            className="text-xs text-primary underline hover:no-underline font-medium ml-6"
                            data-testid="link-update-medical-history"
                          >
                            Update Medical History →
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            These to-dos are AI-generated suggestions. Please consult your GP or pediatrician if you have any concerns about your child's development.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-4 mt-4">
                  <ToggleGroup 
                    type="single" 
                    value={achievementStatus?.achieved ? 'achieved' : 'not-achieved'}
                    onValueChange={(value) => {
                      if (value) toggleAchievement.mutate(value as 'achieved' | 'not-achieved');
                    }}
                    className="w-full"
                    disabled={toggleAchievement.isPending}
                    data-testid="toggle-achievement-action"
                  >
                    <ToggleGroupItem 
                      value="not-achieved" 
                      className="flex-1 rounded-l-full data-[state=on]:bg-red-100 data-[state=on]:text-red-800 dark:data-[state=on]:bg-red-950 dark:data-[state=on]:text-red-200"
                      data-testid="toggle-not-achieved-action"
                    >
                      Not Achieved
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="achieved" 
                      className="flex-1 rounded-r-full"
                      data-testid="toggle-achieved-action"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Achieved
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}

            {activeActionTab === 'tools' && (
              <div className="bg-muted/30 rounded-lg px-4 py-5">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Product recommendations coming soon
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
