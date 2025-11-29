import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculateCorrectedAge, formatAdjustment, formatAge } from '@/lib/age-calculation';
import { Plus, Trash2, Edit, Check, ChevronRight } from 'lucide-react';
import type { Child, User } from '@shared/schema';

export default function Profile() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('profile');
  const { user, isLoading: userLoading } = useUser();
  const { children, activeChildId, activeChild, setActiveChildId, isLoading: childrenLoading } = useActiveChild();
  const { toast } = useToast();

  // Dialog states
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states for editing/adding child
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [childNotes, setChildNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');

  const { data: parentUser } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!user,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [user, userLoading, setLocation]);

  useEffect(() => {
    if (parentUser) {
      setParentNotes(parentUser.medicalHistory?.notes || '');
    }
  }, [parentUser]);

  // Calculate age for display
  const getChildAge = (child: Child) => {
    const ageInfo = calculateCorrectedAge(child.birthDate, child.dueDate);
    const age = ageInfo.shouldUseCorrectedAge ? ageInfo.corrected : ageInfo.chronological;
    return formatAge(age);
  };

  // Get child initials for avatar
  const getChildInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setChildName(child.name);
    setBirthDate(child.birthDate);
    setDueDate(child.dueDate || '');
    setChildNotes(child.medicalHistory?.notes || '');
    setIsAddingChild(false);
  };

  const openAddDialog = () => {
    setIsAddingChild(true);
    setEditingChild(null);
    setChildName('');
    setBirthDate('');
    setDueDate('');
    setChildNotes('');
  };

  const closeDialog = () => {
    setEditingChild(null);
    setIsAddingChild(false);
    setChildName('');
    setBirthDate('');
    setDueDate('');
    setChildNotes('');
  };

  const createChildMutation = useMutation({
    mutationFn: async (data: { name: string; birthDate: string; dueDate: string; notes: string }) => {
      const response = await apiRequest('POST', '/api/children', {
        name: data.name,
        birthDate: data.birthDate,
        dueDate: data.dueDate || null,
        gender: 'other',
      });
      const newChild = await response.json();
      
      // Update medical history if notes provided
      if (data.notes) {
        await apiRequest('PATCH', `/api/children/${newChild.id}/medical-history`, {
          medicalHistory: {
            notes: data.notes,
          },
        });
      }
      
      return newChild;
    },
    onSuccess: (newChild) => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setActiveChildId(newChild.id);
      closeDialog();
      toast({
        title: 'Child added',
        description: `${newChild.name}'s profile has been created.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add child. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async (data: { childId: string; name: string; birthDate: string; dueDate: string; notes: string }) => {
      // Update basic info
      await apiRequest('PATCH', `/api/children/${data.childId}`, {
        name: data.name,
        birthDate: data.birthDate,
        dueDate: data.dueDate || null,
      });
      
      // Update medical history
      const existingChild = children.find(c => c.id === data.childId);
      const currentHistory = existingChild?.medicalHistory || {};
      
      await apiRequest('PATCH', `/api/children/${data.childId}/medical-history`, {
        medicalHistory: {
          conditions: currentHistory.conditions || [],
          allergies: currentHistory.allergies || [],
          medications: currentHistory.medications || [],
          birthComplications: currentHistory.birthComplications || [],
          currentConcerns: currentHistory.currentConcerns || [],
          notes: data.notes,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      closeDialog();
      toast({
        title: 'Profile updated',
        description: 'Child information has been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const response = await apiRequest('DELETE', `/api/children/${childId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to delete');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setChildToDelete(null);
      setDeleteError(null);
      
      toast({
        title: 'Child removed',
        description: 'The child profile has been deleted.',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('last child') || error.message.includes('at least one')) {
        setDeleteError("You can't delete your only child profile. Add another child first if you want to remove this one.");
      } else {
        setDeleteError(error.message || 'Failed to delete child profile.');
      }
    },
  });

  const updateParentMutation = useMutation({
    mutationFn: async (notes: string) => {
      const currentHistory = parentUser?.medicalHistory || {};
      const response = await apiRequest('PATCH', '/api/user/medical-history', {
        medicalHistory: {
          conditions: currentHistory.conditions || [],
          allergies: currentHistory.allergies || [],
          medications: currentHistory.medications || [],
          familyHistory: currentHistory.familyHistory || [],
          notes,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Saved',
        description: 'Parent information has been updated.',
      });
    },
  });

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
  };

  // Calculate adjustment for display in edit dialog
  const adjustmentInfo = useMemo(() => 
    birthDate && dueDate ? calculateCorrectedAge(birthDate, dueDate) : null,
    [birthDate, dueDate]
  );

  if (childrenLoading || userLoading) {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-settings">
              Settings
            </Button>
          </Link>
        </div>

        {/* Children List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Children</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openAddDialog}
              data-testid="button-add-child"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Child
            </Button>
          </div>

          <div className="space-y-2">
            {children.map((child) => (
              <Card 
                key={child.id} 
                className={`cursor-pointer transition-colors hover-elevate ${
                  child.id === activeChildId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveChildId(child.id)}
                data-testid={`card-child-${child.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                        {getChildInitials(child.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{child.name}</p>
                        {child.id === activeChildId && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{getChildAge(child)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(child);
                        }}
                        data-testid={`button-edit-child-${child.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChildToDelete(child);
                          setDeleteError(null);
                        }}
                        data-testid={`button-delete-child-${child.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Parent Information Section */}
        <div className="space-y-4 p-4 bg-card rounded-lg border">
          <h3 className="font-semibold">Parent Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parent's Name</Label>
              <Input 
                value={user?.firstName || user?.email || ''} 
                disabled 
                data-testid="input-parent-name" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-history">Family Medical History</Label>
              <Textarea
                id="parent-history"
                placeholder="Enter any relevant family medical history, genetic conditions, or health information that might be relevant for your children's development..."
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                rows={4}
                data-testid="textarea-parent-history"
              />
              <p className="text-sm text-muted-foreground">
                This information is shared across all children's profiles.
              </p>
            </div>

            <Button 
              onClick={() => updateParentMutation.mutate(parentNotes)}
              disabled={updateParentMutation.isPending}
              data-testid="button-save-parent"
            >
              {updateParentMutation.isPending ? 'Saving...' : 'Save Parent Info'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Child Dialog */}
      <Dialog open={isAddingChild || !!editingChild} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingChild ? 'Add New Child' : `Edit ${editingChild?.name}`}
            </DialogTitle>
            <DialogDescription>
              {isAddingChild 
                ? 'Add a new child to track their developmental milestones.'
                : 'Update your child\'s information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="child-name">Child's Name</Label>
              <Input
                id="child-name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter name or nickname"
                data-testid="input-dialog-child-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-birth-date">Birth Date</Label>
              <Input
                id="dialog-birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                data-testid="input-dialog-birth-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-due-date">Original Due Date (Optional)</Label>
              <Input
                id="dialog-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-dialog-due-date"
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate adjusted age for premature babies
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
                    Milestones will be adjusted accordingly until age 3
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dialog-child-notes">Medical Notes (Optional)</Label>
              <Textarea
                id="dialog-child-notes"
                value={childNotes}
                onChange={(e) => setChildNotes(e.target.value)}
                placeholder="Any medical conditions, allergies, or notes..."
                rows={3}
                data-testid="textarea-dialog-child-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!childName || !birthDate) {
                  toast({
                    title: 'Missing information',
                    description: 'Please enter a name and birth date.',
                    variant: 'destructive',
                  });
                  return;
                }
                
                if (isAddingChild) {
                  createChildMutation.mutate({
                    name: childName,
                    birthDate,
                    dueDate,
                    notes: childNotes,
                  });
                } else if (editingChild) {
                  updateChildMutation.mutate({
                    childId: editingChild.id,
                    name: childName,
                    birthDate,
                    dueDate,
                    notes: childNotes,
                  });
                }
              }}
              disabled={createChildMutation.isPending || updateChildMutation.isPending}
              data-testid="button-dialog-save"
            >
              {createChildMutation.isPending || updateChildMutation.isPending 
                ? 'Saving...' 
                : isAddingChild ? 'Add Child' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!childToDelete} onOpenChange={(open) => !open && setChildToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {childToDelete?.name}'s profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive">{deleteError}</span>
              ) : (
                <>
                  This will permanently delete all of {childToDelete?.name}'s data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Milestone tracking progress</li>
                    <li>Growth measurements</li>
                    <li>Activity and toy recommendations</li>
                    <li>Medical notes</li>
                  </ul>
                  <p className="mt-2 font-medium">This action cannot be undone.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setChildToDelete(null);
              setDeleteError(null);
            }}>
              Cancel
            </AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => childToDelete && deleteChildMutation.mutate(childToDelete.id)}
                disabled={deleteChildMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteChildMutation.isPending ? 'Deleting...' : 'Delete Profile'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
