import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ChildSelector from '@/components/ChildSelector';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Child, User } from '@shared/schema';

export default function MedicalHistory() {
  const [, setLocation] = useLocation();
  const params = useParams<{ childId: string }>();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  const [activeChild, setActiveChild] = useState(params.childId || '');
  const [childNotes, setChildNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');

  useEffect(() => {
    if (params.childId && params.childId !== activeChild) {
      setActiveChild(params.childId);
    }
  }, [params.childId, activeChild]);

  useEffect(() => {
    if (activeChild && children.length > 0) {
      setLocation(`/medical-history/${activeChild}`);
    }
  }, [activeChild, children.length, setLocation]);

  const { data: selectedChild, isLoading: childLoading } = useQuery<Child>({
    queryKey: ['/api/children', activeChild],
    enabled: !!activeChild,
  });

  const { data: parentUser, isLoading: parentLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!user,
  });

  useEffect(() => {
    if (selectedChild) {
      setChildNotes(selectedChild.medicalHistory?.notes || '');
    }
  }, [selectedChild]);

  useEffect(() => {
    if (parentUser) {
      setParentNotes(parentUser.medicalHistory?.notes || '');
    }
  }, [parentUser]);

  const updateChildMutation = useMutation({
    mutationFn: async (notes: string) => {
      const currentHistory = selectedChild?.medicalHistory || {};
      const response = await apiRequest(
        'PATCH',
        `/api/children/${activeChild}/medical-history`,
        {
          medicalHistory: {
            conditions: currentHistory.conditions || [],
            allergies: currentHistory.allergies || [],
            medications: currentHistory.medications || [],
            birthComplications: currentHistory.birthComplications || [],
            currentConcerns: currentHistory.currentConcerns || [],
            notes,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChild] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      // Invalidate toy recommendations since they depend on medical history
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChild, 'milestones'] });
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
      // Invalidate all children data
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      // Invalidate all milestone-related queries (including toy recommendations and to-do recommendations)
      // Use predicate to catch all children, even if local children array is stale
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

  const handleSave = async () => {
    try {
      await Promise.all([
        updateChildMutation.mutateAsync(childNotes),
        updateParentMutation.mutateAsync(parentNotes),
      ]);

      toast({
        title: 'Medical history saved',
        description: 'Your medical history has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save medical history. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = childLoading || parentLoading;
  const isSaving = updateChildMutation.isPending || updateParentMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Medical History</h1>
        </div>

        <div>
          <ChildSelector
            children={children}
            activeId={activeChild}
            onSelect={setActiveChild}
          />
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="child-history">Child's Medical History</Label>
              <Textarea
                id="child-history"
                placeholder="Enter any medical conditions, allergies, medications, birth complications, or current concerns for your child..."
                value={childNotes}
                onChange={(e) => setChildNotes(e.target.value)}
                rows={8}
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
                rows={8}
                data-testid="textarea-parent-history"
              />
              <p className="text-sm text-muted-foreground">
                Family medical history can help tailor developmental guidance.
              </p>
            </div>

            <Button
              onClick={handleSave}
              className="w-full"
              disabled={isSaving}
              data-testid="button-save-history"
            >
              {isSaving ? 'Saving...' : 'Save History'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
