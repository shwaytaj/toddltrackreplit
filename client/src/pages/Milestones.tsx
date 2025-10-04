import { useState } from 'react';
import { useLocation } from 'wouter';
import BottomNav from '@/components/BottomNav';
import MilestoneCard from '@/components/MilestoneCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Milestones() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');
  const [category, setCategory] = useState('developmental');

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'profile') setLocation('/profile');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" data-testid="button-previous-range">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="bg-[#2C3E50] text-white px-6 py-2 rounded-full text-sm font-medium">
            Current: 20 - 26 months
          </div>
          <Button variant="ghost" size="sm" data-testid="button-next-range">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-fit border-none text-2xl font-bold p-0 h-auto" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developmental">Developmental</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="social">Social & Emotional</SelectItem>
              </SelectContent>
            </Select>
          </h1>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Gross Motor</h2>
          <div className="grid grid-cols-3 gap-3">
            <MilestoneCard
              title="Jump in place"
              category=""
              categoryColor="bg-purple-100 dark:bg-purple-900/20"
            />
            <MilestoneCard
              title="Kicks a ball"
              category=""
              categoryColor="bg-purple-100 dark:bg-purple-900/20"
            />
            <MilestoneCard
              title="Throws a ball"
              category=""
              categoryColor="bg-purple-100 dark:bg-purple-900/20"
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Communication</h2>
          <div className="grid grid-cols-3 gap-3">
            <MilestoneCard
              title="Say their name"
              category=""
              categoryColor="bg-green-100 dark:bg-green-900/20"
            />
            <MilestoneCard
              title="2 to 3 word sentences"
              category=""
              categoryColor="bg-green-100 dark:bg-green-900/20"
              achieved
            />
            <MilestoneCard
              title="Knows 50 or more words"
              category=""
              categoryColor="bg-green-100 dark:bg-green-900/20"
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Social & Emotional</h2>
          <div className="grid grid-cols-3 gap-3">
            <MilestoneCard
              title="Points to objects to pictures"
              category=""
              categoryColor="bg-amber-100 dark:bg-amber-900/20"
            />
            <MilestoneCard
              title="Plays with others to please them"
              category=""
              categoryColor="bg-amber-100 dark:bg-amber-900/20"
            />
            <MilestoneCard
              title="Can look OK separately"
              category=""
              categoryColor="bg-amber-100 dark:bg-amber-900/20"
            />
          </div>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
