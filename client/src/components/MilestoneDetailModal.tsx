import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductCard from './ProductCard';
import { X } from 'lucide-react';

interface MilestoneDetailModalProps {
  open: boolean;
  onClose: () => void;
  milestone: {
    title: string;
    category: string;
    ageRange: string;
    about: string;
    typicalRange: string;
    achieved: boolean;
  };
  guides: Array<{
    title: string;
    description: string;
    checked?: boolean;
  }>;
  products: Array<{
    image: string;
    title: string;
    description: string;
  }>;
}

export default function MilestoneDetailModal({
  open,
  onClose,
  milestone,
  guides,
  products
}: MilestoneDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          data-testid="button-close-modal"
        >
          <X className="h-4 w-4" />
        </button>
        
        <DialogHeader className="bg-accent/20 -mx-6 -mt-6 px-6 py-4 mb-4">
          <p className="text-xs text-muted-foreground">{milestone.category}</p>
          <DialogTitle className="text-lg">{milestone.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{milestone.ageRange}</p>
        </DialogHeader>

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
              className={milestone.achieved ? "bg-accent text-accent-foreground" : ""}
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
      </DialogContent>
    </Dialog>
  );
}
