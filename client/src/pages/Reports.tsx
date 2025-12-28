import { useState, useMemo, useEffect } from 'react';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { calculateAdjustedAge, getAgeRange, getAdjustedMonthsForRange, formatAge } from '@/lib/age-calculation';
import type { Milestone, ChildMilestone, GrowthMetric, Child } from '@shared/schema';
import { Download, FileText, AlertTriangle, Baby, CheckCircle, Circle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ChildReportData {
  child: Child;
  adjustedAge: { years: number; months: number; days: number } | null;
  ageRange: { min: number; max: number; label: string } | null;
  milestones: Milestone[];
  childMilestones: ChildMilestone[];
  growthMetrics: GrowthMetric[];
  categoryProgress: {
    category: string;
    total: number;
    achieved: number;
    percentage: number;
  }[];
  achievedMilestones: Milestone[];
  pendingMilestones: Milestone[];
}

function ChildReportSection({ data, showDivider }: { data: ChildReportData; showDivider?: boolean }) {
  const latestMetrics = useMemo(() => {
    const weight = data.growthMetrics
      .filter(m => m.type === 'weight')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const height = data.growthMetrics
      .filter(m => m.type === 'height')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const head = data.growthMetrics
      .filter(m => m.type === 'head_circumference')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return { weight, height, head };
  }, [data.growthMetrics]);

  return (
    <div className="space-y-6 print:break-inside-avoid">
      {showDivider && <Separator className="my-8" />}
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Baby className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{data.child.name}</h2>
          {data.adjustedAge && (
            <p className="text-muted-foreground">Adjusted age: {formatAge(data.adjustedAge)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Due Date:</span>
          <span className="ml-2 font-medium">{format(new Date(data.child.dueDate), 'dd MMM yyyy')}</span>
        </div>
        {data.child.gender && (
          <div>
            <span className="text-muted-foreground">Gender:</span>
            <span className="ml-2 font-medium capitalize">{data.child.gender}</span>
          </div>
        )}
        {data.ageRange && (
          <div>
            <span className="text-muted-foreground">Current Milestone Range:</span>
            <span className="ml-2 font-medium">{data.ageRange.label}</span>
          </div>
        )}
      </div>

      {(latestMetrics.weight || latestMetrics.height || latestMetrics.head) && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Latest Growth Measurements
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {latestMetrics.weight && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{latestMetrics.weight.value}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                  {latestMetrics.weight.percentile && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {Math.round(latestMetrics.weight.percentile)}th %ile
                    </Badge>
                  )}
                </div>
              )}
              {latestMetrics.height && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{latestMetrics.height.value}</p>
                  <p className="text-xs text-muted-foreground">cm height</p>
                  {latestMetrics.height.percentile && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {Math.round(latestMetrics.height.percentile)}th %ile
                    </Badge>
                  )}
                </div>
              )}
              {latestMetrics.head && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{latestMetrics.head.value}</p>
                  <p className="text-xs text-muted-foreground">cm head</p>
                  {latestMetrics.head.percentile && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {Math.round(latestMetrics.head.percentile)}th %ile
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Progress Summary</h3>
        <div className="space-y-2">
          {data.categoryProgress.map(({ category, total, achieved, percentage }) => (
            <div key={category} className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="font-medium">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">{achieved}/{total} ({percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Achieved Milestones ({data.achievedMilestones.length})
        </h3>
        {data.achievedMilestones.length > 0 ? (
          <div className="space-y-1">
            {data.achievedMilestones.map(m => {
              const childMilestone = data.childMilestones.find(cm => cm.milestoneId === m.id && cm.achieved);
              return (
                <div key={m.id} className="flex items-start gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{m.title}</span>
                    <span className="text-muted-foreground ml-2">({m.category})</span>
                    {childMilestone?.achievedAt && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {format(new Date(childMilestone.achievedAt), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No milestones achieved yet in this age range.</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Circle className="w-4 h-4 text-amber-500" />
          Pending Milestones ({data.pendingMilestones.length})
        </h3>
        {data.pendingMilestones.length > 0 ? (
          <div className="space-y-1">
            {data.pendingMilestones.map(m => (
              <div key={m.id} className="flex items-start gap-2 text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                <Circle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-muted-foreground ml-2">({m.category})</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All milestones achieved for this age range!</p>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<NavPage>('reports');
  const [reportScope, setReportScope] = useState<'current' | 'all'>('current');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const { user, isLoading: userLoading } = useUser();
  const { children, activeChildId, activeChild: selectedChild, isLoading: childrenLoading } = useActiveChild();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [userLoading, user, setLocation]);

  const childrenToReport = useMemo(() => {
    if (reportScope === 'current' && selectedChild) {
      return [selectedChild];
    }
    return children;
  }, [reportScope, selectedChild, children]);

  const childIds = useMemo(() => childrenToReport.map(c => c.id), [childrenToReport]);

  const childAgeRanges = useMemo(() => {
    return childrenToReport.map(child => {
      const adjustedMonths = getAdjustedMonthsForRange(child.dueDate);
      return adjustedMonths >= 0 ? getAgeRange(adjustedMonths) : null;
    });
  }, [childrenToReport]);

  const milestonesQueries = useQueries({
    queries: childAgeRanges.map((ageRange, index) => ({
      queryKey: ['/api/milestones/age-range', ageRange?.min, ageRange?.max],
      enabled: ageRange !== null,
    })),
  });

  const childMilestonesQueries = useQueries({
    queries: childrenToReport.map(child => ({
      queryKey: ['/api/children', child.id, 'milestones'],
      enabled: true,
    })),
  });

  const growthMetricsQueries = useQueries({
    queries: childrenToReport.map(child => ({
      queryKey: ['/api/children', child.id, 'growth-metrics'],
      enabled: true,
    })),
  });

  const isLoadingData = milestonesQueries.some(q => q.isLoading) || 
                        childMilestonesQueries.some(q => q.isLoading) ||
                        growthMetricsQueries.some(q => q.isLoading);

  const reportsData: ChildReportData[] = useMemo(() => {
    return childrenToReport.map((child, index) => {
      const adjustedAge = calculateAdjustedAge(child.dueDate);
      const ageRange = childAgeRanges[index];
      const milestones = (milestonesQueries[index]?.data as Milestone[]) || [];
      const childMilestones = (childMilestonesQueries[index]?.data as ChildMilestone[]) || [];
      const growthMetrics = (growthMetricsQueries[index]?.data as GrowthMetric[]) || [];

      const achievedMilestoneIds = new Set(
        childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
      );

      const categories = ['Developmental', 'Teeth', 'Vision', 'Hearing', 'Growth'] as const;
      const categoryProgress = categories.map(category => {
        const categoryMilestones = milestones.filter(m => m.category === category);
        const achievedCount = categoryMilestones.filter(m => achievedMilestoneIds.has(m.id)).length;
        return {
          category,
          total: categoryMilestones.length,
          achieved: achievedCount,
          percentage: categoryMilestones.length > 0 ? Math.round((achievedCount / categoryMilestones.length) * 100) : 0,
        };
      }).filter(c => c.total > 0);

      const achievedMilestones = milestones.filter(m => achievedMilestoneIds.has(m.id));
      const pendingMilestones = milestones.filter(m => !achievedMilestoneIds.has(m.id));

      return {
        child,
        adjustedAge,
        ageRange,
        milestones,
        childMilestones,
        growthMetrics,
        categoryProgress,
        achievedMilestones,
        pendingMilestones,
      };
    });
  }, [childrenToReport, childAgeRanges, milestonesQueries, childMilestonesQueries, growthMetricsQueries]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ childIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toddl-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNavigation = (page: NavPage) => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  if (childrenLoading || userLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-muted animate-pulse rounded-full w-32" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
        <BottomNav active="reports" onNavigate={handleNavigation} />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold">Reports</h1>
          <Card>
            <CardContent className="p-6 text-center">
              <Baby className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Add a child to generate reports.</p>
              <Button className="mt-4" onClick={() => setLocation('/onboarding')}>
                Add Child
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav active="reports" onNavigate={handleNavigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" data-testid="heading-reports">Reports</h1>
          <Button 
            onClick={handleDownloadPdf} 
            disabled={isGeneratingPdf || isLoadingData}
            data-testid="button-download-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Important Disclaimer</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  This report is a summary of what you have entered and tracked in Toddl. It is intended 
                  solely for sharing with your GP or paediatrician as a reference. Please do not use this 
                  report for self-diagnosis or to make medical decisions. Always consult a qualified 
                  healthcare professional for medical advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {children.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Report Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={reportScope} 
                onValueChange={(v) => setReportScope(v as 'current' | 'all')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="current" data-testid="radio-current-child" />
                  <Label htmlFor="current">Current child ({selectedChild?.name.split(' ')[0]})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" data-testid="radio-all-children" />
                  <Label htmlFor="all">All children ({children.length})</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Developmental Progress Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated on {format(new Date(), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">Toddl</p>
                <p className="text-xs text-muted-foreground">Child Development Tracker</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingData ? (
              <div className="space-y-4">
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-40 bg-muted animate-pulse rounded" />
              </div>
            ) : reportsData.length > 0 ? (
              reportsData.map((data, index) => (
                <ChildReportSection 
                  key={data.child.id} 
                  data={data} 
                  showDivider={index > 0}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available for report.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav active="reports" onNavigate={handleNavigation} />
    </div>
  );
}
