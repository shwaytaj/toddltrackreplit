import { useLocation, useRoute } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft } from 'lucide-react';

export default function MilestoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/milestone/:id');

  //todo: remove mock functionality - fetch actual milestone data based on params.id
  const milestone = {
    title: "Jump in place",
    category: "Gross Motor",
    ageRange: "20-26 month",
    about: "Jumping in place shows developing leg strength and coordination. Children practice this skill naturally as they explore movement.",
    typicalRange: "Most children learn to jump between 20-26 months",
    achieved: false
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

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-accent/20 px-4 py-6">
        <button
          onClick={() => setLocation('/home')}
          className="mb-4 flex items-center gap-2 text-sm hover-elevate active-elevate-2 rounded-lg px-2 py-1"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-xs text-muted-foreground">{milestone.category}</p>
        <h1 className="text-2xl font-bold mt-1">{milestone.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{milestone.ageRange}</p>
      </div>

      <div className="px-4 mt-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="about" className="flex-1" data-testid="tab-about">About</TabsTrigger>
            <TabsTrigger value="help" className="flex-1" data-testid="tab-help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">About the milestone</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.about}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Typical range</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone.typicalRange}</p>
            </div>

            <Button 
              className={milestone.achieved ? "bg-accent text-accent-foreground w-full rounded-full" : "w-full rounded-full"}
              data-testid="button-achievement-status"
            >
              {milestone.achieved ? '✓ Achieved' : 'Mark as Achieved'}
            </Button>
          </TabsContent>

          <TabsContent value="help" className="mt-4">
            <Tabs defaultValue="guide" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="guide" className="flex-1" data-testid="tab-guide">Guide</TabsTrigger>
                <TabsTrigger value="tools" className="flex-1" data-testid="tab-tools">Toys & Tools</TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">How parents can help</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your best tools are models, routines, and pauses.</p>
                  
                  <div className="space-y-3">
                    {guides.map((guide, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Checkbox id={`guide-${idx}`} data-testid={`checkbox-guide-${idx}`} />
                        <div className="flex-1">
                          <label htmlFor={`guide-${idx}`} className="text-sm font-medium cursor-pointer">
                            {guide.title}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">{guide.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    More guides will be suggested after you have tried all the above
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="space-y-3">
                {products.map((product, idx) => (
                  <ProductCard key={idx} {...product} />
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
