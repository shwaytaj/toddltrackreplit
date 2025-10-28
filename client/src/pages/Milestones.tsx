import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import BottomNav from '@/components/BottomNav';
import MilestoneCard from '@/components/MilestoneCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import type { Child, ChildMilestone, Milestone } from '@shared/schema';
import { calculateCorrectedAge } from '@/lib/age-calculation';

const AGE_RANGES = [
  { min: 0, max: 3, label: '0-3 months' },
  { min: 4, max: 6, label: '4-6 months' },
  { min: 7, max: 9, label: '7-9 months' },
  { min: 10, max: 12, label: '10-12 months' },
  { min: 13, max: 18, label: '13-18 months' },
  { min: 19, max: 24, label: '19-24 months' },
  { min: 25, max: 30, label: '25-30 months' },
  { min: 31, max: 36, label: '31-36 months' },
  { min: 37, max: 49, label: '37-49 months' },
  { min: 49, max: 60, label: '49-60 months' },
];

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'developmental':
      return 'bg-purple-100 dark:bg-purple-900/20';
    case 'growth':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'hearing':
      return 'bg-green-100 dark:bg-green-900/20';
    case 'vision':
      return 'bg-amber-100 dark:bg-amber-900/20';
    case 'teeth':
      return 'bg-pink-100 dark:bg-pink-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-900/20';
  }
};

export default function Milestones() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('milestones');
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [childCorrectedAgeRangeIndex, setChildCorrectedAgeRangeIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trim whitespace from search query
  const trimmedSearchQuery = searchQuery.trim();

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  const selectedChild = children[0];

  // Calculate child's corrected age and store age info
  const ageInfo = useMemo(() => {
    if (!selectedChild) return null;
    return calculateCorrectedAge(selectedChild.birthDate, selectedChild.dueDate);
  }, [selectedChild]);

  // Calculate child's current age in months (using corrected age) and set initial range
  useEffect(() => {
    if (selectedChild && ageInfo) {
      // Use corrected age if applicable, otherwise use chronological
      const age = ageInfo.shouldUseCorrectedAge ? ageInfo.corrected : ageInfo.chronological;
      const ageInMonths = age.years * 12 + age.months;
      
      // Find the age range that contains the child's current age
      const rangeIndex = AGE_RANGES.findIndex(range => 
        ageInMonths >= range.min && ageInMonths <= range.max
      );
      
      if (rangeIndex !== -1) {
        setSelectedRangeIndex(rangeIndex);
        setChildCorrectedAgeRangeIndex(rangeIndex); // Track the child's corrected age range
      }
    }
  }, [selectedChild, ageInfo]);

  const selectedRange = AGE_RANGES[selectedRangeIndex];

  // Fetch all milestones when searching, or age-range specific when not searching
  const { data: allMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
    enabled: trimmedSearchQuery.length > 0,
  });

  const { data: ageRangeMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones/age-range', selectedRange.min, selectedRange.max],
    enabled: !!selectedRange && trimmedSearchQuery.length === 0,
  });

  // Use filtered all milestones when searching, otherwise use age range milestones
  const milestones = useMemo(() => {
    if (trimmedSearchQuery.length > 0) {
      const query = trimmedSearchQuery.toLowerCase();
      return allMilestones.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    }
    return ageRangeMilestones;
  }, [trimmedSearchQuery, allMilestones, ageRangeMilestones]);

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', selectedChild?.id, 'milestones'],
    enabled: !!selectedChild,
  });

  const achievedMilestoneIds = useMemo(() => {
    return new Set(
      childMilestones
        .filter(cm => cm.achieved)
        .map(cm => cm.milestoneId)
    );
  }, [childMilestones]);

  const isMilestoneAchieved = (milestoneId: string) => {
    return achievedMilestoneIds.has(milestoneId);
  };

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'profile') setLocation('/profile');
  };

  const handlePrevious = () => {
    if (selectedRangeIndex > 0) {
      setSelectedRangeIndex(selectedRangeIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedRangeIndex < AGE_RANGES.length - 1) {
      setSelectedRangeIndex(selectedRangeIndex + 1);
    }
  };

  // Group milestones by category
  const milestonesByCategory = useMemo(() => {
    const grouped: Record<string, Milestone[]> = {};
    milestones.forEach(milestone => {
      const category = milestone.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(milestone);
    });
    return grouped;
  }, [milestones]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              data-testid="button-previous-range"
              onClick={handlePrevious}
              disabled={selectedRangeIndex === 0 || trimmedSearchQuery.length > 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="bg-[#2C3E50] text-white px-6 py-2 rounded-full text-sm font-medium">
              {selectedRangeIndex === childCorrectedAgeRangeIndex ? 'Current: ' : ''}{selectedRange.label}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              data-testid="button-next-range"
              onClick={handleNext}
              disabled={selectedRangeIndex === AGE_RANGES.length - 1 || trimmedSearchQuery.length > 0}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {ageInfo?.shouldUseCorrectedAge && selectedRangeIndex === childCorrectedAgeRangeIndex && (
            <p className="text-xs text-muted-foreground text-center" data-testid="text-adjusted-range-note">
              Age range based on adjusted age
            </p>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <label htmlFor="milestone-search" className="sr-only">
            Search milestones
          </label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="milestone-search"
            type="text"
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            data-testid="input-search-milestones"
            aria-label="Search milestones by title, description, or category"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Search results indicator */}
        {trimmedSearchQuery.length > 0 && (
          <div className="text-sm text-muted-foreground" data-testid="text-search-results">
            {milestones.length === 0 ? (
              <span>No milestones found for "{trimmedSearchQuery}"</span>
            ) : (
              <span>Showing {milestones.length} result{milestones.length !== 1 ? 's' : ''} for "{trimmedSearchQuery}"</span>
            )}
          </div>
        )}

        {milestones.length === 0 && trimmedSearchQuery.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No milestones available for this age range
          </div>
        ) : milestones.length > 0 ? (
          <>
            {Object.entries(milestonesByCategory).map(([category, categoryMilestones]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{category}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {categoryMilestones.map(milestone => (
                    <MilestoneCard
                      key={milestone.id}
                      title={milestone.title}
                      category=""
                      categoryColor={getCategoryColor(milestone.category)}
                      achieved={isMilestoneAchieved(milestone.id)}
                      onClick={() => setLocation(`/milestone/${milestone.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
