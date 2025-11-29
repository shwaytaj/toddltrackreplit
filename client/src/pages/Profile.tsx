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
import { calculateAdjustedAge, formatAge } from '@/lib/age-calculation';
import { Plus, Trash2, Edit, Check, ChevronRight, Download, AlertTriangle } from 'lucide-react';
import type { Child, User } from '@shared/schema';

const API_BASE_URL = '';

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
  
  // GDPR states
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form states for editing/adding child
  const [childName, setChildName] = useState('');
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
    const age = calculateAdjustedAge(child.dueDate);
    return formatAge(age);
  };

  // Get child initials for avatar
  const getChildInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setChildName(child.name);
    setDueDate(child.dueDate);
    setChildNotes(child.medicalHistory?.notes || '');
    setIsAddingChild(false);
  };

  const openAddDialog = () => {
    setIsAddingChild(true);
    setEditingChild(null);
    setChildName('');
    setDueDate('');
    setChildNotes('');
  };

  const closeDialog = () => {
    setEditingChild(null);
    setIsAddingChild(false);
    setChildName('');
    setDueDate('');
    setChildNotes('');
  };

  const createChildMutation = useMutation({
    mutationFn: async (data: { name: string; dueDate: string; notes: string }) => {
      const response = await apiRequest('POST', '/api/children', {
        name: data.name,
        dueDate: data.dueDate,
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
    mutationFn: async (data: { childId: string; name: string; dueDate: string; notes: string }) => {
      // Update basic info
      await apiRequest('PATCH', `/api/children/${data.childId}`, {
        name: data.name,
        dueDate: data.dueDate,
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
      
      return data.childId;
    },
    onSuccess: (childId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      // Invalidate recommendation caches for this child so they regenerate with updated medical history
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'completed-recommendations'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === '/api/children' && 
          query.queryKey[1] === childId &&
          (query.queryKey.includes('toy-recommendations') || query.queryKey.includes('recommendations'))
      });
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
      // Invalidate ALL recommendation caches since parent medical history affects all children
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === '/api/children' &&
          (query.queryKey.includes('toy-recommendations') || 
           query.queryKey.includes('recommendations') ||
           query.queryKey.includes('completed-recommendations'))
      });
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

  // GDPR: Export all user data as ZIP
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/export`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toddl-data-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded as a ZIP file.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // GDPR: Delete account and all data
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      setDeleteAccountError('Please enter your password to confirm.');
      return;
    }
    
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    
    try {
      const response = await apiRequest('DELETE', '/api/user/account', {
        password: deleteAccountPassword,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }
      
      // Account deleted - redirect to home/login
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
      
      // Clear local state and redirect
      queryClient.clear();
      setLocation('/');
    } catch (error: any) {
      setDeleteAccountError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

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

        {/* Privacy & Data Section */}
        <div className="space-y-4 p-4 bg-card rounded-lg border">
          <h3 className="font-semibold">Privacy & Data</h3>
          <p className="text-sm text-muted-foreground">
            Manage your data and account settings. You can download all your data or permanently delete your account.
          </p>
          
          <div className="space-y-3">
            {/* Download Data Button */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Download className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Download Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Export all your children's milestone progress, growth measurements, and account data as CSV files. Perfect for sharing with your GP or keeping a backup.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={handleExportData}
                  disabled={isExporting}
                  data-testid="button-export-data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Preparing download...' : 'Download My Data'}
                </Button>
              </div>
            </div>

            {/* Delete Account Button */}
            <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  className="mt-2"
                  onClick={() => {
                    setShowDeleteAccountDialog(true);
                    setDeleteAccountPassword('');
                    setDeleteAccountError(null);
                  }}
                  data-testid="button-delete-account"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            </div>
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
              <Label htmlFor="dialog-due-date">Due Date</Label>
              <Input
                id="dialog-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-dialog-due-date"
              />
              <p className="text-xs text-muted-foreground">
                The expected delivery date from your doctor. We'll use this to calculate your child's age.
              </p>
            </div>

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
                if (!childName || !dueDate) {
                  toast({
                    title: 'Missing information',
                    description: 'Please enter a name and due date.',
                    variant: 'destructive',
                  });
                  return;
                }
                
                if (isAddingChild) {
                  createChildMutation.mutate({
                    name: childName,
                    dueDate,
                    notes: childNotes,
                  });
                } else if (editingChild) {
                  updateChildMutation.mutate({
                    childId: editingChild.id,
                    name: childName,
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

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteAccountDialog(false);
          setDeleteAccountPassword('');
          setDeleteAccountError(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will <span className="font-semibold">permanently delete</span> your account and ALL associated data:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All children's profiles and milestone progress</li>
                  <li>All growth measurements and health data</li>
                  <li>All activity and toy recommendations</li>
                  <li>All medical notes and history</li>
                </ul>
                <p className="font-medium text-destructive">
                  This action cannot be undone. Please download your data first if you need a backup.
                </p>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-password">Enter your password to confirm:</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deleteAccountPassword}
                    onChange={(e) => {
                      setDeleteAccountPassword(e.target.value);
                      setDeleteAccountError(null);
                    }}
                    placeholder="Your password"
                    data-testid="input-delete-password"
                  />
                  {deleteAccountError && (
                    <p className="text-sm text-destructive">{deleteAccountError}</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteAccountPassword('');
                setDeleteAccountError(null);
              }}
              data-testid="button-cancel-delete-account"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeletingAccount || !deleteAccountPassword}
              data-testid="button-confirm-delete-account"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete My Account Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
