import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import BottomNav from '@/components/BottomNav';
import ChildSelector from '@/components/ChildSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Child } from '@shared/schema';

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

  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (selectedChild) {
      setChildName(selectedChild.name);
      setBirthDate(selectedChild.birthDate);
    }
  }, [selectedChild]);

  const updateChildMutation = useMutation({
    mutationFn: async (data: { name?: string; birthDate?: string }) => {
      if (!activeChild) throw new Error('No child selected');
      return await apiRequest('PATCH', `/api/children/${activeChild}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({
        title: 'Profile updated',
        description: 'Child information has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update child information.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveChanges = () => {
    if (!selectedChild) return;

    const updates: { name?: string; birthDate?: string } = {};
    
    if (childName !== selectedChild.name) {
      updates.name = childName;
    }
    
    if (birthDate !== selectedChild.birthDate) {
      updates.birthDate = birthDate;
    }

    if (Object.keys(updates).length > 0) {
      updateChildMutation.mutate(updates);
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
        <div>
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <ChildSelector
            children={children}
            activeId={activeChild}
            onSelect={setActiveChild}
          />
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
            <Label>Baby's Date of birth</Label>
            <Input 
              type="date" 
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              data-testid="input-birth-date" 
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

        <Button 
          className="w-full" 
          onClick={handleSaveChanges}
          disabled={updateChildMutation.isPending || (childName === selectedChild.name && birthDate === selectedChild.birthDate)}
          data-testid="button-save-changes"
        >
          {updateChildMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>

        <div className="pt-4 space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            data-testid="button-add-child"
          >
            + Add Another Child
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            data-testid="button-medical-history"
            onClick={() => activeChild && setLocation(`/medical-history/${activeChild}`)}
          >
            Medical History
          </Button>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
