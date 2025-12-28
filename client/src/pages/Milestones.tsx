import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import BottomNav, { type NavPage } from '@/components/BottomNav';
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
import { useActiveChild } from '@/contexts/ActiveChildContext';
import type { ChildMilestone, Milestone } from '@shared/schema';
import { getAdjustedMonthsForRange } from '@/lib/age-calculation';
import { getMonkeyIcon } from '@/components/MonkeyIcons';

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

// Map milestone categories to their Figma design colors
const getMilestoneColor = (milestone: Milestone): string => {
  const subcategory = milestone.subcategory?.toLowerCase() || '';
  const category = milestone.category?.toLowerCase() || '';
  const compositeKey = category && subcategory ? `${category} ${subcategory}` : '';
  
  const categoryColors: Record<string, string> = {
    'gross motor milestones': '[background:hsl(var(--category-gross-motor))] [color:hsl(var(--category-gross-motor-foreground))]',
    'gross motor skills': '[background:hsl(var(--category-gross-motor))] [color:hsl(var(--category-gross-motor-foreground))]',
    'communication': '[background:hsl(var(--category-communication))] [color:hsl(var(--category-communication-foreground))]',
    'social & emotional': '[background:hsl(var(--category-social-emotional))] [color:hsl(var(--category-social-emotional-foreground))]',
    'cognitive': '[background:hsl(var(--category-cognitive))] [color:hsl(var(--category-cognitive-foreground))]',
    'developmental gross motor milestones': '[background:hsl(var(--category-gross-motor))] [color:hsl(var(--category-gross-motor-foreground))]',
    'developmental gross motor skills': '[background:hsl(var(--category-gross-motor))] [color:hsl(var(--category-gross-motor-foreground))]',
    'developmental communication': '[background:hsl(var(--category-communication))] [color:hsl(var(--category-communication-foreground))]',
    'developmental social & emotional': '[background:hsl(var(--category-social-emotional))] [color:hsl(var(--category-social-emotional-foreground))]',
    'developmental cognitive': '[background:hsl(var(--category-cognitive))] [color:hsl(var(--category-cognitive-foreground))]',
    'hearing development': '[background:hsl(var(--category-hearing))] [color:hsl(var(--category-hearing-foreground))]',
    'hearing timing': '[background:hsl(var(--category-hearing))] [color:hsl(var(--category-hearing-foreground))]',
    'vision development': '[background:hsl(var(--category-vision))] [color:hsl(var(--category-vision-foreground))]',
    'teeth eruption': '[background:hsl(var(--category-teeth))] [color:hsl(var(--category-teeth-foreground))]',
    'growth physical': '[background:hsl(var(--category-growth))] [color:hsl(var(--category-growth-foreground))]',
    'developmental': '[background:hsl(var(--category-gross-motor))] [color:hsl(var(--category-gross-motor-foreground))]',
    'hearing': '[background:hsl(var(--category-hearing))] [color:hsl(var(--category-hearing-foreground))]',
    'vision': '[background:hsl(var(--category-vision))] [color:hsl(var(--category-vision-foreground))]',
    'teeth': '[background:hsl(var(--category-teeth))] [color:hsl(var(--category-teeth-foreground))]',
    'growth': '[background:hsl(var(--category-growth))] [color:hsl(var(--category-growth-foreground))]',
  };
  
  return categoryColors[compositeKey] || categoryColors[subcategory] || categoryColors[category] || 'bg-card';
};

export default function Milestones() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [activeNav, setActiveNav] = useState<NavPage>('milestones');
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [childCorrectedAgeRangeIndex, setChildCorrectedAgeRangeIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Available categories
  const CATEGORIES = ['Developmental', 'Teeth', 'Vision', 'Hearing', 'Growth'] as const;
  
  // Read category filter from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const category = params.get('category');
    if (category && CATEGORIES.includes(category as any)) {
      setCategoryFilter(category);
    } else {
      setCategoryFilter('all');
    }
  }, [searchString]);
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    if (value === 'all') {
      setLocation('/milestones');
    } else {
      setLocation(`/milestones?category=${encodeURIComponent(value)}`);
    }
  };
  
  // Trim whitespace from search query
  const trimmedSearchQuery = searchQuery.trim();

  const { activeChild: selectedChild, activeChildId } = useActiveChild();

  // Calculate child's adjusted age in months and set initial range
  useEffect(() => {
    if (selectedChild) {
      const ageInMonths = getAdjustedMonthsForRange(selectedChild.dueDate);
      
      // Find the age range that contains the child's current age
      const rangeIndex = AGE_RANGES.findIndex(range => 
        ageInMonths >= range.min && ageInMonths <= range.max
      );
      
      if (rangeIndex !== -1) {
        setSelectedRangeIndex(rangeIndex);
        setChildCorrectedAgeRangeIndex(rangeIndex);
      }
    }
  }, [selectedChild]);

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
    let filtered: Milestone[];
    
    if (trimmedSearchQuery.length > 0) {
      const query = trimmedSearchQuery.toLowerCase();
      filtered = allMilestones.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    } else {
      filtered = ageRangeMilestones;
    }
    
    // Apply category filter if not 'all'
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }
    
    return filtered;
  }, [trimmedSearchQuery, allMilestones, ageRangeMilestones, categoryFilter]);

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', activeChildId, 'milestones'],
    enabled: !!activeChildId,
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

  const handleNavigation = (page: NavPage) => {
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
            <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium">
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

        {/* Category filter dropdown */}
        <div className="flex items-center gap-2" data-testid="category-filter-container">
          <span className="text-sm text-muted-foreground">Category:</span>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all">All</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} data-testid={`option-${cat.toLowerCase()}`}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      category={milestone.subcategory || ''}
                      categoryColor={getMilestoneColor(milestone)}
                      achieved={isMilestoneAchieved(milestone.id)}
                      onClick={() => setLocation(`/milestone/${milestone.id}`)}
                      icon={getMonkeyIcon(milestone.subcategory || milestone.category)}
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
