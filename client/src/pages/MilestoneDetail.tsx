import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import { X, Check } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Milestone, Child } from '@shared/schema';

interface AIRecommendation {
  title: string;
  description: string;
}

export default function MilestoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/milestone/:id');
  const [activeTab, setActiveTab] = useState<'about' | 'help'>('about');
  const [activeHelpTab, setActiveHelpTab] = useState<'guide' | 'tools'>('guide');
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  const { data: allMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
  });

  const milestone = allMilestones.find(m => m.id === params?.id);
  const selectedChild = children[0];

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
    if (selectedChild && milestone && activeTab === 'help' && activeHelpTab === 'guide') {
      fetchRecommendations();
    }
  }, [selectedChild, milestone, activeTab, activeHelpTab, fetchRecommendations]);

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

        {activeTab === 'about' && milestone && (
          <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About the milestone</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Age Range</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {milestone.minAgeMonths} - {milestone.maxAgeMonths} months
              </p>
            </div>

            <Button 
              className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white"
              data-testid="button-achievement-status"
            >
              Mark as Achieved
            </Button>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveHelpTab('guide')}
                className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                  activeHelpTab === 'guide'
                    ? 'bg-[#2C3E50] text-white'
                    : 'bg-muted text-foreground'
                }`}
                data-testid="tab-guide"
              >
                Guide
              </button>
              <button
                onClick={() => setActiveHelpTab('tools')}
                className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                  activeHelpTab === 'tools'
                    ? 'bg-[#2C3E50] text-white'
                    : 'bg-muted text-foreground'
                }`}
                data-testid="tab-tools"
              >
                Toys & Tools
              </button>
            </div>

            {activeHelpTab === 'guide' && (
              <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
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
              </div>
            )}

            {activeHelpTab === 'tools' && (
              <div className="space-y-3">
                {products.map((product, idx) => (
                  <ProductCard key={idx} {...product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
