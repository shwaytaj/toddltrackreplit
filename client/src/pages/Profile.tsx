import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculateCorrectedAge, formatAdjustment } from '@/lib/age-calculation';
import type { Child, User } from '@shared/schema';

export default function Profile() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('profile');
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();

  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  const [activeChild, setActiveChild] = useState('');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [user, userLoading, setLocation]);

  const selectedChild = useMemo(() => 
    children.find(c => c.id === activeChild),
    [children, activeChild]
  );

  const { data: parentUser } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!user,
  });

  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [childNotes, setChildNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');

  useEffect(() => {
    if (selectedChild) {
      setChildName(selectedChild.name);
      setBirthDate(selectedChild.birthDate);
      setDueDate(selectedChild.dueDate || '');
      setChildNotes(selectedChild.medicalHistory?.notes || '');
    }
  }, [selectedChild]);

  useEffect(() => {
    if (parentUser) {
      setParentNotes(parentUser.medicalHistory?.notes || '');
    }
  }, [parentUser]);

  // Calculate adjustment display
  const adjustmentInfo = useMemo(() => 
    birthDate && dueDate ? calculateCorrectedAge(birthDate, dueDate) : null,
    [birthDate, dueDate]
  );

  const updateChildMutation = useMutation({
    mutationFn: async (data: { name: string; birthDate: string; dueDate: string; notes: string }) => {
      if (!activeChild) throw new Error('No child selected');
      
      const currentHistory = selectedChild?.medicalHistory || {};
      
      // Update basic info and dates
      await apiRequest('PATCH', `/api/children/${activeChild}`, {
        name: data.name,
        birthDate: data.birthDate,
        dueDate: data.dueDate || null,
      });
      
      // Update medical history
      await apiRequest(
        'PATCH',
        `/api/children/${activeChild}/medical-history`,
        {
          medicalHistory: {
            conditions: currentHistory.conditions || [],
            allergies: currentHistory.allergies || [],
            medications: currentHistory.medications || [],
            birthComplications: currentHistory.birthComplications || [],
            currentConcerns: currentHistory.currentConcerns || [],
            notes: data.notes,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChild] });
      // Invalidate milestone queries since corrected age may have changed
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && 
                 key[0] === '/api/children' && 
                 key.length >= 3 &&
                 key[2] === 'milestones';
        }
      });
    },
  });

  const updateParentMutation = useMutation({
    mutationFn: async (notes: string) => {
      const currentHistory = parentUser?.medicalHistory || {};
      const response = await apiRequest(
        'PATCH',
        '/api/user/medical-history',
        {
          medicalHistory: {
            conditions: currentHistory.conditions || [],
            allergies: currentHistory.allergies || [],
            medications: currentHistory.medications || [],
            familyHistory: currentHistory.familyHistory || [],
            notes,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      // Invalidate milestone-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && 
                 key[0] === '/api/children' && 
                 key.length >= 3 &&
                 key[2] === 'milestones';
        }
      });
    },
  });

  const handleSaveChanges = async () => {
    if (!selectedChild) return;

    try {
      await Promise.all([
        updateChildMutation.mutateAsync({ 
          name: childName,
          birthDate,
          dueDate,
          notes: childNotes,
        }),
        updateParentMutation.mutateAsync(parentNotes),
      ]);

      toast({
        title: 'Profile saved',
        description: 'All information has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
  };

  if (childrenLoading || !selectedChild) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-settings">
              Settings
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Child's name or nickname</Label>
            <Input 
              value={childName} 
              onChange={(e) => setChildName(e.target.value)}
              data-testid="input-child-name" 
            />
          </div>

          <div className="space-y-2">
            <Label>Parent's Name</Label>
            <Input defaultValue={user?.firstName || user?.email || ''} disabled data-testid="input-parent-name" />
          </div>

          <div className="space-y-2">
            <Label>Relationship with child</Label>
            <Input defaultValue="Parent" disabled data-testid="input-relationship" />
          </div>

          <div className="space-y-2">
            <Label>Parent's Name (Partner)</Label>
            <Input placeholder="Add partner" data-testid="input-partner-name" />
          </div>
        </div>

        <div className="space-y-4 p-4 bg-card rounded-lg border">
          <h3 className="font-semibold">Birth Information</h3>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Original Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-due-date"
              />
              {dueDate && (
                <p className="text-xs font-medium text-primary">
                  {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The expected delivery date from your doctor
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth-date">Actual Birth Date</Label>
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                data-testid="input-birth-date"
              />
              {birthDate && (
                <p className="text-xs font-medium text-primary">
                  {new Date(birthDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                When your baby was actually born
              </p>
            </div>
            {adjustmentInfo && adjustmentInfo.adjustmentWeeks > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Birth Adjustment: {formatAdjustment(
                    adjustmentInfo.adjustmentWeeks,
                    adjustmentInfo.isPremature,
                    adjustmentInfo.isPostMature
                  )}
                </p>
                {adjustmentInfo.shouldUseCorrectedAge && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Developmental milestones will be adjusted accordingly until age 3
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="child-history">Child's Medical History</Label>
          <Textarea
            id="child-history"
            placeholder="Enter any medical conditions, allergies, medications, birth complications, or current concerns for your child..."
            value={childNotes}
            onChange={(e) => setChildNotes(e.target.value)}
            rows={6}
            data-testid="textarea-child-history"
          />
          <p className="text-sm text-muted-foreground">
            This information will help provide personalized recommendations in the Guide section.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent-history">Parent's Medical History</Label>
          <Textarea
            id="parent-history"
            placeholder="Enter any relevant family medical history, genetic conditions, or health information that might be relevant for your child's development..."
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
            rows={6}
            data-testid="textarea-parent-history"
          />
          <p className="text-sm text-muted-foreground">
            Family medical history can help tailor developmental guidance.
          </p>
        </div>

        <Button 
          className="w-full" 
          onClick={handleSaveChanges}
          disabled={updateChildMutation.isPending || updateParentMutation.isPending}
          data-testid="button-save-changes"
        >
          {updateChildMutation.isPending || updateParentMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>

        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            data-testid="button-add-child"
          >
            + Add Another Child
          </Button>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
