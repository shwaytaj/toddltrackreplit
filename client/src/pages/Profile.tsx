import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import BottomNav from '@/components/BottomNav';
import ChildSelector from '@/components/ChildSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { Child } from '@shared/schema';

export default function Profile() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('profile');
  const { user, isLoading: userLoading } = useUser();

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

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
  };

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

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop" />
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <button 
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover-elevate active-elevate-2"
              data-testid="button-upload-photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Child's name or nickname</Label>
            <Input defaultValue="Arya" data-testid="input-child-name" />
          </div>

          <div className="space-y-2">
            <Label>Baby's Date of birth</Label>
            <Input type="date" defaultValue="2023-06-28" data-testid="input-birth-date" />
          </div>

          <div className="space-y-2">
            <Label>Parent's Name</Label>
            <Input defaultValue="Radhika" data-testid="input-parent-name" />
          </div>

          <div className="space-y-2">
            <Label>Relationship with child</Label>
            <Input defaultValue="Mother" data-testid="input-relationship" />
          </div>

          <div className="space-y-2">
            <Label>Parent's Name (Partner)</Label>
            <Input placeholder="Add partner" data-testid="input-partner-name" />
          </div>
        </div>

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
          >
            Medical History
          </Button>
        </div>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
