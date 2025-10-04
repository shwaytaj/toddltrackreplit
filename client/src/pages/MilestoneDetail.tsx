import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import { X, Check } from 'lucide-react';

export default function MilestoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/milestone/:id');
  const [activeTab, setActiveTab] = useState<'about' | 'help'>('about');
  const [activeHelpTab, setActiveHelpTab] = useState<'guide' | 'tools'>('guide');
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');

  //todo: remove mock functionality - fetch actual milestone data based on params.id
  const milestone = {
    title: "Says 2 to 3 word sentences",
    category: "Communication",
    ageRange: "20-26 month",
    about: "This is the jump from single words to combining them: 'more milk,' 'Daddy go work,' 'my shoe on.' It's telegraphic speech, short, content-heavy, missing little glue words, and that's perfect. You'll hear real verbs, early word order, and a wider range of reasons to talk.",
    typicalRange: "Two-word combinations start between 18-24 months",
    achieved: true
  };

  const guides = [
    {
      title: "Add one word.",
      description: "Child: 'ball.' You: 'big ball,' then 'big red ball.' Keep it natural, not drill-like. Model verbs all day."
    },
    {
      title: "Narrate simply",
      description: "'Daddy is cooking,' 'Open door,' 'Birds are flying.' Verbs drive sentences."
    },
    {
      title: "Use choices that require combinations.",
      description: "'Do you want more crackers or more banana?' Wait 5-7 seconds. If they say 'banana,' expand: 'More banana.'"
    }
  ];

  const products = [
    {
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop",
      title: "Carson Dellosa First Words Flash Cards for Toddlers 2-4 Years",
      description: "Educational toy"
    },
    {
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&h=200&fit=crop",
      title: "Talking Flash Cards for Toddlers 1 2 3 4 5 6 Years Old Educational Toys",
      description: "Interactive learning"
    }
  ];

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-green-100 dark:bg-green-900/20 px-4 py-6 relative">
        <button
          onClick={() => setLocation('/home')}
          className="absolute top-4 right-4 p-2 hover-elevate active-elevate-2 rounded-lg"
          data-testid="button-close"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm text-muted-foreground">{milestone.category}</p>
        <h1 className="text-2xl font-bold mt-1 pr-12">{milestone.title}</h1>
      </div>

      <div className="flex-1 px-4 py-4 pb-24">
        <div className="flex gap-2 mb-4">
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

        {activeTab === 'about' && (
          <div className="bg-muted/30 rounded-lg px-4 py-5 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About the milestone</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.about}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Typical range</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.typicalRange}</p>
            </div>

            <Button 
              className={`w-full rounded-full ${
                milestone.achieved 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              data-testid="button-achievement-status"
            >
              {milestone.achieved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Achieved
                </>
              ) : (
                'Mark as Achieved'
              )}
            </Button>
          </div>
        )}

        {activeTab === 'help' && (
          <div>
            <div className="flex gap-2 mb-4">
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
                  <p className="text-sm text-muted-foreground mb-4">Your best tools are models, routines, and pauses.</p>
                  
                  <div className="space-y-4">
                    {guides.map((guide, idx) => (
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
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    More guides will be suggested after you have tried all the above
                  </p>
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
