import { useState, useEffect, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, Check, Lightbulb, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import { SiAmazon, SiTarget, SiWalmart } from 'react-icons/si';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getToyIcon } from '@/components/ToyIcons';
import type { Milestone, Child, ChildMilestone, CompletedRecommendation } from '@shared/schema';

interface AIRecommendation {
  title: string;
  description: string;
  citations?: Array<{
    source: string;
    url?: string;
  }>;
}

interface ToyRecommendation {
  name: string;
  description: string;
  howToUse: string;
  searchQuery: string;
  imageUrl?: string | null;
  citations?: Array<{
    source: string;
    url?: string;
  }>;
}

interface MilestoneWithRecommendations extends Milestone {
  recommendations: AIRecommendation[];
}

// Helper function to build enhanced Amazon URL with filters
function buildAmazonUrl(searchQuery: string, ageRangeMonthsMin: number, ageRangeMonthsMax: number): string {
  const baseUrl = 'https://www.amazon.com/s';
  const params = new URLSearchParams();
  
  // Add search query
  params.append('k', searchQuery);
  
  // Add Toys & Games category
  params.append('rh', 'n:165793011');
  
  // Map age range to Amazon age filter IDs
  const avgAgeMonths = (ageRangeMonthsMin + ageRangeMonthsMax) / 2;
  let ageRangeFilter = '';
  
  if (avgAgeMonths <= 6) {
    ageRangeFilter = 'p_n_age_range:2590655011'; // 0-6 months
  } else if (avgAgeMonths <= 12) {
    ageRangeFilter = 'p_n_age_range:2590656011'; // 6-12 months
  } else if (avgAgeMonths <= 24) {
    ageRangeFilter = 'p_n_age_range:2590657011'; // 12-24 months
  } else if (avgAgeMonths <= 48) {
    ageRangeFilter = 'p_n_age_range:2590658011'; // 2-4 years
  } else if (avgAgeMonths <= 84) {
    ageRangeFilter = 'p_n_age_range:2590659011'; // 5-7 years
  } else {
    ageRangeFilter = 'p_n_age_range:2590660011'; // 8-13 years
  }
  
  // Add age range filter
  if (ageRangeFilter) {
    const currentRh = params.get('rh') || '';
    params.set('rh', currentRh + ',' + ageRangeFilter);
  }
  
  // Sort by customer reviews
  params.append('s', 'review-rank');
  
  return `${baseUrl}?${params.toString()}`;
}

// Map milestone categories to their Figma design colors
function getCategoryHeaderColor(category?: string, subcategory?: string): string {
  const cat = category?.toLowerCase() || '';
  const subcat = subcategory?.toLowerCase() || '';
  const compositeKey = cat && subcat ? `${cat} ${subcat}` : '';
  
  const categoryColors: Record<string, string> = {
    'gross motor milestones': '[background:hsl(var(--category-gross-motor))]',
    'gross motor skills': '[background:hsl(var(--category-gross-motor))]',
    'communication': '[background:hsl(var(--category-communication))]',
    'social & emotional': '[background:hsl(var(--category-social-emotional))]',
    'cognitive': '[background:hsl(var(--category-cognitive))]',
    'developmental gross motor milestones': '[background:hsl(var(--category-gross-motor))]',
    'developmental gross motor skills': '[background:hsl(var(--category-gross-motor))]',
    'developmental communication': '[background:hsl(var(--category-communication))]',
    'developmental social & emotional': '[background:hsl(var(--category-social-emotional))]',
    'developmental cognitive': '[background:hsl(var(--category-cognitive))]',
    'hearing development': '[background:hsl(var(--category-hearing))]',
    'hearing timing': '[background:hsl(var(--category-hearing))]',
    'vision development': '[background:hsl(var(--category-vision))]',
    'teeth eruption': '[background:hsl(var(--category-teeth))]',
    'growth physical': '[background:hsl(var(--category-growth))]',
    'developmental': '[background:hsl(var(--category-gross-motor))]',
    'hearing': '[background:hsl(var(--category-hearing))]',
    'vision': '[background:hsl(var(--category-vision))]',
    'teeth': '[background:hsl(var(--category-teeth))]',
    'growth': '[background:hsl(var(--category-growth))]',
  };
  
  return categoryColors[compositeKey] || categoryColors[subcat] || categoryColors[cat] || 'bg-accent/30';
}

export default function MilestoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/milestone/:id');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'todo' | 'tools'>('todo');
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');
  const [loadedMilestoneIds, setLoadedMilestoneIds] = useState<string[]>([]);

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
      queryClient.invalidateQueries({ 
        queryKey: ['/api/children', selectedChild?.id, 'milestones'] 
      });
    },
  });

  // Fetch all child milestones to find unachieved ones
  const { data: allChildMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', selectedChild?.id, 'milestones'],
    enabled: !!selectedChild,
  });

  // Get unachieved milestones
  const unachievedMilestones = useMemo(() => {
    return allChildMilestones
      .filter(cm => !cm.achieved)
      .map(cm => allMilestones.find(m => m.id === cm.milestoneId))
      .filter((m): m is Milestone => m !== undefined);
  }, [allChildMilestones, allMilestones]);

  // Fetch completed recommendations for this child
  const { data: completedRecommendations = [] } = useQuery<CompletedRecommendation[]>({
    queryKey: ['/api/children', selectedChild?.id, 'completed-recommendations'],
    enabled: !!selectedChild,
  });

  const { data: recommendations, mutate: fetchRecommendations, isPending: loadingRecommendations } = useMutation<AIRecommendation[], Error, string[] | undefined>({
    mutationFn: async (excludeCompleted?: string[]) => {
      if (!selectedChild || !milestone) return [];
      const response = await apiRequest(
        'POST',
        `/api/children/${selectedChild.id}/milestones/${milestone.id}/recommendations`,
        excludeCompleted && excludeCompleted.length > 0 ? { excludeCompleted } : undefined
      );
      const data = await response.json();
      return data;
    },
  });

  const { data: toyRecommendations, isLoading: loadingToyRecommendations, error: toyRecommendationsError, refetch: refetchToyRecommendations } = useQuery<ToyRecommendation[]>({
    queryKey: ['/api/children', selectedChild?.id, 'milestones', milestone?.id, 'toy-recommendations'],
    queryFn: async () => {
      if (!selectedChild || !milestone) return [];
      const response = await apiRequest(
        'POST',
        `/api/children/${selectedChild.id}/milestones/${milestone.id}/toy-recommendations`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch toy recommendations');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!selectedChild && !!milestone && activeContentTab === 'tools',
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Dismiss toy recommendation
  const dismissToy = useMutation({
    mutationFn: async (toyName: string) => {
      if (!selectedChild || !milestone) return;
      await apiRequest('POST', `/api/children/${selectedChild.id}/milestones/${milestone.id}/dismiss-toy`, {
        toyName,
      });
    },
    onSuccess: () => {
      // Refetch toy recommendations to get new ones
      queryClient.invalidateQueries({ 
        queryKey: ['/api/children', selectedChild?.id, 'milestones', milestone?.id, 'toy-recommendations'] 
      });
    },
  });

  // Toggle recommendation completion
  const toggleRecommendation = useMutation({
    mutationFn: async ({ milestoneId, title, description, citations, isCompleted }: { milestoneId: string; title: string; description: string; citations?: Array<{ source: string; url?: string }>; isCompleted: boolean }) => {
      if (!selectedChild) return;
      
      if (isCompleted) {
        await apiRequest('DELETE', `/api/children/${selectedChild.id}/completed-recommendations`, {
          milestoneId,
          recommendationTitle: title,
        });
      } else {
        await apiRequest('POST', `/api/children/${selectedChild.id}/completed-recommendations`, {
          milestoneId,
          recommendationTitle: title,
          recommendationDescription: description,
          citations,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/children', selectedChild?.id, 'completed-recommendations'] 
      });
    },
  });

  useEffect(() => {
    if (selectedChild && milestone && activeContentTab === 'todo') {
      fetchRecommendations(undefined);
    }
  }, [selectedChild, milestone, activeContentTab, fetchRecommendations]);


  // Check if all current recommendations are completed and fetch new ones
  useEffect(() => {
    if (!milestone || !recommendations || recommendations.length === 0) return;
    
    const allCompleted = recommendations.every(rec => 
      isRecommendationCompleted(milestone.id, rec.title)
    );
    
    if (allCompleted) {
      // Get all completed recommendation titles for this milestone
      const completedTitlesForMilestone = completedRecommendations
        .filter(cr => cr.milestoneId === milestone.id)
        .map(cr => cr.recommendationTitle);
      
      // Fetch new recommendations excluding the completed ones
      if (completedTitlesForMilestone.length > 0) {
        fetchRecommendations(completedTitlesForMilestone);
      }
    }
  }, [recommendations, completedRecommendations, milestone, fetchRecommendations]);

  // Check if a recommendation is completed
  const isRecommendationCompleted = (milestoneId: string, title: string) => {
    return completedRecommendations.some(
      cr => cr.milestoneId === milestoneId && cr.recommendationTitle === title
    );
  };

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
      <div className={`${getCategoryHeaderColor(milestone.category, milestone.subcategory || undefined)} px-4 py-6 relative`}>
        <button
          onClick={() => setLocation('/home')}
          className="absolute top-4 right-4 p-2 hover-elevate active-elevate-2 rounded-lg"
          data-testid="button-close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            {milestone.category}{milestone.subcategory && ` • ${milestone.subcategory}`}
          </p>
          <h1 className="text-2xl font-bold mt-1 pr-12">{milestone.title}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <Collapsible open={isAboutOpen} onOpenChange={setIsAboutOpen}>
          <CollapsibleTrigger asChild>
            <button 
              className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-about-toggle"
            >
              <span className="font-semibold text-sm">About this milestone</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isAboutOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4 mt-2">
              {(() => {
                // Parse the description into sections
                const description = milestone.description || '';
                const sections: { [key: string]: string } = {};
                
                // Check if description has structured format
                if (description.includes('**About**')) {
                  // Split by section headers
                  const aboutMatch = description.match(/\*\*About\*\*([\s\S]*?)(?=\*\*What to look for\*\*|\*\*Why it matters\*\*|$)/);
                  const whatToLookMatch = description.match(/\*\*What to look for\*\*([\s\S]*?)(?=\*\*Why it matters\*\*|$)/);
                  const whyItMattersMatch = description.match(/\*\*Why it matters\*\*([\s\S]*?)$/);
                  
                  if (aboutMatch) sections.about = aboutMatch[1].trim();
                  if (whatToLookMatch) sections.whatToLook = whatToLookMatch[1].trim();
                  if (whyItMattersMatch) sections.whyItMatters = whyItMattersMatch[1].trim();
                }
                
                // Helper function to render bullet points
                const renderBullets = (text: string) => {
                  const lines = text.split('\n').filter(line => line.trim());
                  const bullets: string[] = [];
                  let currentBullet = '';
                  
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                      if (currentBullet) bullets.push(currentBullet);
                      currentBullet = trimmed.replace(/^[•\-*]\s*/, '');
                    } else if (currentBullet) {
                      currentBullet += ' ' + trimmed;
                    }
                  }
                  if (currentBullet) bullets.push(currentBullet);
                  
                  return bullets.length > 0 ? (
                    <ul className="space-y-2 ml-4">
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground leading-relaxed list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  );
                };
                
                if (Object.keys(sections).length > 0) {
                  // Render structured description
                  return (
                    <>
                      {sections.about && (
                        <div>
                          <h3 className="font-semibold mb-2">About</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{sections.about}</p>
                        </div>
                      )}
                      
                      {sections.whatToLook && (
                        <div>
                          <h3 className="font-semibold mb-2">What to look for</h3>
                          {renderBullets(sections.whatToLook)}
                        </div>
                      )}
                      
                      {sections.whyItMatters && (
                        <div>
                          <h3 className="font-semibold mb-2">Why it matters</h3>
                          {renderBullets(sections.whyItMatters)}
                        </div>
                      )}
                      
                      {milestone.typicalRange && (
                        <div>
                          <h3 className="font-semibold mb-2">Typical range</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {milestone.typicalRange}
                          </p>
                        </div>
                      )}
                    </>
                  );
                } else {
                  // Render simple description
                  return (
                    <>
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                      </div>
                      
                      {milestone.typicalRange && (
                        <div>
                          <h3 className="font-semibold mb-2">Typical range</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {milestone.typicalRange}
                          </p>
                        </div>
                      )}
                    </>
                  );
                }
              })()}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveContentTab('todo')}
              className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                activeContentTab === 'todo'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
              data-testid="tab-todo"
            >
              Activities
            </button>
            <button
              onClick={() => setActiveContentTab('tools')}
              className={`flex-1 px-6 py-2.5 rounded-full font-medium text-sm transition-colors ${
                activeContentTab === 'tools'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
              data-testid="tab-tools"
            >
              Toys & Tools
            </button>
          </div>

          {activeContentTab === 'todo' && (
              <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
                {achievementStatus?.achieved ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/30 mb-4">
                      <Check className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Milestone Achieved!</h3>
                    <p className="text-sm text-muted-foreground">
                      Great job! Your child has achieved this milestone.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-4">How parents can help</h3>
                    
{loadingRecommendations ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Personalising recommendations based on the provided medical history</span>
                      </div>
                    ) : recommendations && recommendations.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                        {recommendations
                          .filter(rec => !isRecommendationCompleted(milestone.id, rec.title))
                          .map((guide, idx) => {
                          const isCompleted = false;
                          return (
                            <div key={`active-${idx}`} className="flex items-start gap-3">
                              <Checkbox 
                                id={`guide-${idx}`} 
                                className="mt-0.5" 
                                checked={isCompleted}
                                onCheckedChange={(checked) => {
                                  if (milestone) {
                                    toggleRecommendation.mutate({
                                      milestoneId: milestone.id,
                                      title: guide.title,
                                      description: guide.description,
                                      citations: guide.citations,
                                      isCompleted,
                                    });
                                  }
                                }}
                                data-testid={`checkbox-guide-${idx}`} 
                              />
                              <div className="flex-1">
                                <label htmlFor={`guide-${idx}`} className="text-sm font-semibold cursor-pointer block">
                                  {guide.title}
                                </label>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{guide.description}</p>
                                {guide.citations && guide.citations.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1" data-testid={`citations-guide-${idx}`}>
                                    {guide.citations.map((citation, citIdx) => (
                                      <span key={citIdx} className="inline-flex items-center text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                                        {citation.url ? (
                                          <a 
                                            href={citation.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                            data-testid={`link-citation-${idx}-${citIdx}`}
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
                          );
                        })}
                        
                        {completedRecommendations
                          .filter(cr => cr.milestoneId === milestone.id && cr.recommendationDescription)
                          .map((completed, idx) => {
                            return (
                              <div key={`completed-${idx}`} className="flex items-start gap-3">
                                <Checkbox 
                                  id={`completed-guide-${idx}`} 
                                  className="mt-0.5" 
                                  checked={true}
                                  onCheckedChange={(checked) => {
                                    if (milestone) {
                                      toggleRecommendation.mutate({
                                        milestoneId: milestone.id,
                                        title: completed.recommendationTitle,
                                        description: completed.recommendationDescription || '',
                                        citations: completed.citations || undefined,
                                        isCompleted: true,
                                      });
                                    }
                                  }}
                                  data-testid={`checkbox-completed-guide-${idx}`} 
                                />
                                <div className="flex-1">
                                  <label htmlFor={`completed-guide-${idx}`} className="text-sm font-semibold cursor-pointer block line-through text-muted-foreground">
                                    {completed.recommendationTitle}
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-through">{completed.recommendationDescription}</p>
                                  {completed.citations && completed.citations.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1" data-testid={`citations-completed-guide-${idx}`}>
                                      {completed.citations.map((citation, citIdx) => (
                                        <span key={citIdx} className="inline-flex items-center text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border line-through">
                                          {citation.url ? (
                                            <a 
                                              href={citation.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="hover:underline"
                                              data-testid={`link-citation-completed-${idx}-${citIdx}`}
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
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No recommendations available
                      </div>
                    )}
                    
                    {recommendations && recommendations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Check off activities as you try them. More recommendations will appear as you progress.
                      </p>
                    )}
                  </div>
                )}

                {!achievementStatus?.achieved && recommendations && recommendations.length > 0 && (
                  <>
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="bg-muted/30 rounded-md p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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
                      <div className="bg-muted/30 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            These to-dos are AI-generated suggestions. Please consult your GP or pediatrician if you have any concerns about your child's development.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-4 mt-4 flex gap-2">
                  <Button
                    onClick={() => toggleAchievement.mutate('not-achieved')}
                    disabled={toggleAchievement.isPending}
                    className={cn(
                      "flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary active:bg-primary",
                      !achievementStatus?.achieved && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    data-testid="toggle-not-achieved-action"
                  >
                    Mark as Not Achieved
                  </Button>
                  <Button
                    onClick={() => toggleAchievement.mutate('achieved')}
                    disabled={toggleAchievement.isPending}
                    className={cn(
                      "flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary active:bg-primary",
                      achievementStatus?.achieved && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    data-testid="toggle-achieved-action"
                  >
                    Mark as achieved
                  </Button>
                </div>
              </div>
            )}

            {activeContentTab === 'tools' && (
              <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
                {achievementStatus?.achieved ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/30 mb-4">
                      <Check className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Milestone Achieved!</h3>
                    <p className="text-sm text-muted-foreground">
                      Great job! Your child has achieved this milestone.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-4">Recommended toys & tools</h3>
                    
                    {loadingToyRecommendations ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Personalising toy recommendations based on the provided medical history</span>
                      </div>
                    ) : toyRecommendationsError ? (
                      <div className="text-center py-8 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Failed to load toy recommendations
                        </p>
                        <button
                          onClick={() => refetchToyRecommendations()}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2"
                          data-testid="button-retry-toys"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : toyRecommendations && toyRecommendations.length > 0 ? (
                      <div className="space-y-4">
                        {toyRecommendations.map((toy, idx) => {
                          const ToyIcon = getToyIcon(toy.name, toy.searchQuery);
                          return (
                            <div key={idx} className="border border-border rounded-lg overflow-hidden" data-testid={`toy-card-${idx}`}>
                              <div className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <ToyIcon className="w-12 h-12" />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-semibold text-base flex-1">{toy.name}</h4>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => dismissToy.mutate(toy.name)}
                                              className="w-6 h-6 rounded-full flex items-center justify-center hover-elevate active-elevate-2 flex-shrink-0"
                                              data-testid={`button-dismiss-toy-${idx}`}
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Don't show this</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{toy.description}</p>
                                    <div className="bg-muted/30 rounded-md p-2">
                                      <p className="text-xs text-muted-foreground">
                                        <span className="font-medium">How to use:</span> {toy.howToUse}
                                      </p>
                                    </div>
                                    {toy.citations && toy.citations.length > 0 && (
                                      <div className="flex flex-wrap gap-1" data-testid={`citations-toy-${idx}`}>
                                        {toy.citations.map((citation, citIdx) => (
                                          <span key={citIdx} className="inline-flex items-center text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                                            {citation.url ? (
                                              <a 
                                                href={citation.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                                data-testid={`link-citation-toy-${idx}-${citIdx}`}
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
                                    <div className="flex flex-wrap gap-2 pt-2">
                              <a
                                href={milestone ? buildAmazonUrl(toy.searchQuery, milestone.ageRangeMonthsMin, milestone.ageRangeMonthsMax) : `https://www.amazon.com/s?k=${encodeURIComponent(toy.searchQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#FF9900] text-primary-foreground hover-elevate active-elevate-2"
                                data-testid={`link-amazon-${idx}`}
                                title="Search on Amazon"
                              >
                                <SiAmazon className="w-5 h-5" />
                              </a>
                              <a
                                href={`https://www.target.com/s?searchTerm=${encodeURIComponent(toy.searchQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#CC0000] text-primary-foreground hover-elevate active-elevate-2"
                                data-testid={`link-target-${idx}`}
                                title="Search on Target"
                              >
                                <SiTarget className="w-5 h-5" />
                              </a>
                              <a
                                href={`https://www.walmart.com/search?q=${encodeURIComponent(toy.searchQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#0071CE] text-primary-foreground hover-elevate active-elevate-2"
                                data-testid={`link-walmart-${idx}`}
                                title="Search on Walmart"
                              >
                                        <SiWalmart className="w-5 h-5" />
                                    </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : !loadingToyRecommendations && (!toyRecommendations || toyRecommendations.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No more recommendations
                      </div>
                    ) : null}
                    
                    {toyRecommendations && toyRecommendations.length > 0 && (
                      <div className="border-t border-border pt-4 mt-4">
                        <div className="bg-muted/30 rounded-md p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              These are AI-generated suggestions. Please verify toy safety and age-appropriateness before purchasing.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }
