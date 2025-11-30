import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Trash2, Edit, Check, ChevronRight, Download, AlertTriangle, UserPlus, Users, Mail, Clock, X, LogOut, Copy } from 'lucide-react';
import type { Child, User } from '@shared/schema';

interface ParentRelationship {
  id: string;
  userId: string;
  childId: string;
  role: 'primary' | 'secondary';
  joinedAt: Date | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: Date | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
}

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

  // Parent management states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [parentToRemove, setParentToRemove] = useState<ParentRelationship | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Form states for editing/adding child
  const [childName, setChildName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [childNotes, setChildNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');

  const { data: parentUser } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!user,
  });

  // Query user role (primary or secondary parent)
  const { data: userRole } = useQuery<{ role: 'primary' | 'secondary' }>({
    queryKey: ['/api/user/role'],
    enabled: !!user,
  });

  // Query all parents for the family
  const { data: parents = [] } = useQuery<ParentRelationship[]>({
    queryKey: ['/api/parents'],
    enabled: !!user,
  });

  // Query invitations (only for primary parents)
  const { data: invitations = [] } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    enabled: !!user && userRole?.role === 'primary',
  });

  const isPrimaryParent = userRole?.role === 'primary';

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

  // Invite a new parent
  const inviteParentMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/invitations', { email });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      setInviteEmail('');
      // Show the generated invite link
      if (data.inviteUrl) {
        setGeneratedInviteLink(data.inviteUrl);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke an invitation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest('DELETE', `/api/invitations/${invitationId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to revoke invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove a secondary parent (primary parent only)
  const removeParentMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/parents/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove parent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      setParentToRemove(null);
      toast({
        title: 'Parent removed',
        description: 'The parent has been removed from your family.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove parent',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Leave family (secondary parent only)
  const leaveFamilyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/parents/leave');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave family');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      setShowLeaveDialog(false);
      toast({
        title: 'Left family',
        description: 'You have been removed from this family. You can still access your account.',
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to leave family',
        description: error.message,
        variant: 'destructive',
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

  // ============================================
  // SIMPLIFIED VIEW FOR SECONDARY PARENTS
  // ============================================
  if (!isPrimaryParent && userRole !== undefined) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Profile</h1>
            {/* Settings button hidden - functionality preserved for future use
            <Link href="/settings">
              <Button variant="outline" size="sm" data-testid="button-settings">
                Settings
              </Button>
            </Link>
            */}
          </div>

          {/* Your Account */}
          <section className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {user?.firstName 
                          ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
                          : user?.email}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Co-parent
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Children You Have Access To */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Shared Access</h2>
            <p className="text-sm text-muted-foreground">
              You have been invited to track milestones for the following children.
            </p>
            <div className="space-y-3">
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
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{getChildAge(child)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Leave Family / Opt Out */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Remove Access</h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <LogOut className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Leave This Family</p>
                    <p className="text-sm text-muted-foreground">
                      Remove your access to these children's profiles. The primary parent will be notified, 
                      and you will no longer be able to view or track milestones.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={() => setShowLeaveDialog(true)}
                      data-testid="button-leave-family"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Family
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Log Out */}
          <section className="pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                try {
                  await apiRequest('POST', '/api/auth/logout');
                  queryClient.clear();
                  setLocation('/login');
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to log out. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </section>
        </div>

        {/* Leave Family Confirmation Dialog */}
        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave this family?</AlertDialogTitle>
              <AlertDialogDescription>
                You will lose access to all children's profiles in this family. You won't be able to view 
                their milestones, growth data, or recommendations anymore.
                <p className="mt-2 font-medium">You can be re-invited by the primary parent later if needed.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => leaveFamilyMutation.mutate()}
                disabled={leaveFamilyMutation.isPending}
              >
                {leaveFamilyMutation.isPending ? 'Leaving...' : 'Yes, Leave Family'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  // ============================================
  // FULL VIEW FOR PRIMARY PARENTS
  // ============================================
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          {/* Settings button hidden - functionality preserved for future use
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-settings">
              Settings
            </Button>
          </Link>
          */}
        </div>

        {/* ============================================ */}
        {/* SECTION 1: YOUR CHILDREN */}
        {/* ============================================ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Children</h2>
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

          <div className="space-y-3">
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
                          <Badge variant="default" className="text-xs">Active</Badge>
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
        </section>

        {/* ============================================ */}
        {/* SECTION 2: FAMILY */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Family</h2>
          
          {/* Your Account Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {user?.firstName 
                        ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
                        : user?.email}
                    </p>
                    <Badge variant="default" className="text-xs">
                      Primary
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="parent-history">Family Medical History</Label>
                <Textarea
                  id="parent-history"
                  placeholder="Enter any relevant family medical history, genetic conditions, or health information..."
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-parent-history"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Shared across all children's profiles
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => updateParentMutation.mutate(parentNotes)}
                    disabled={updateParentMutation.isPending}
                    data-testid="button-save-parent"
                  >
                    {updateParentMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Family Members Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-medium">Family Members</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteDialog(true)}
                  data-testid="button-invite-parent"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Manage who has access to your children's profiles.
              </p>

              {/* Other Parents List (excluding current user) */}
              <div className="space-y-2">
                {parents.filter(p => p.userId !== user?.id).length > 0 ? (
                  parents.filter(p => p.userId !== user?.id).map((parent) => (
                    <div
                      key={parent.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`parent-card-${parent.userId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {parent.user.firstName?.[0]?.toUpperCase() || parent.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {parent.user.firstName 
                                ? `${parent.user.firstName}${parent.user.lastName ? ' ' + parent.user.lastName : ''}`
                                : parent.user.email}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              Co-parent
                            </Badge>
                          </div>
                          {parent.user.firstName && (
                            <p className="text-sm text-muted-foreground">{parent.user.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setParentToRemove(parent)}
                        data-testid={`button-remove-parent-${parent.userId}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-lg">
                    <p className="text-sm">No other family members yet</p>
                    <p className="text-xs mt-1">Invite a co-parent to share access</p>
                  </div>
                )}
              </div>

              {/* Pending Invitations */}
              {invitations.filter(inv => inv.status === 'pending').length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending Invitations
                  </p>
                  {invitations
                    .filter(inv => inv.status === 'pending')
                    .map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                        data-testid={`invitation-card-${invitation.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires {invitation.expiresAt 
                                ? new Date(invitation.expiresAt).toLocaleDateString()
                                : 'soon'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                          disabled={revokeInvitationMutation.isPending}
                          data-testid={`button-revoke-invitation-${invitation.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============================================ */}
        {/* SECTION 3: ACCOUNT & PRIVACY */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Account & Privacy</h2>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Download your data or manage your account settings.
              </p>

              {/* Download Data Button */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Download className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Download Your Data</p>
                  <p className="text-sm text-muted-foreground">
                    Export milestone progress, growth measurements, and account data as CSV files.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleExportData}
                    disabled={isExporting}
                    data-testid="button-export-data"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Preparing...' : 'Download My Data'}
                  </Button>
                </div>
              </div>

              {/* Delete Account Button */}
              <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data. This cannot be undone.
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
            </CardContent>
          </Card>
        </section>

        {/* ============================================ */}
        {/* SECTION 4: LOG OUT */}
        {/* ============================================ */}
        <section className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={async () => {
              try {
                await apiRequest('POST', '/api/auth/logout');
                queryClient.clear();
                setLocation('/login');
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to log out. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </section>
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
                {isPrimaryParent ? (
                  <>
                    <p>
                      This will <span className="font-semibold">permanently delete</span> your account and ALL associated data:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All children's profiles and milestone progress</li>
                      <li>All growth measurements and health data</li>
                      <li>All activity and toy recommendations</li>
                      <li>All medical notes and history</li>
                      <li>All co-parent access will be removed</li>
                    </ul>
                    <p className="font-medium text-destructive">
                      This action cannot be undone. Please download your data first if you need a backup.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This will <span className="font-semibold">permanently delete</span> your account:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your access to all children's profiles will be removed</li>
                      <li>Your medical history notes will be deleted</li>
                      <li>Your login credentials will be removed</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      The children's data and other family members' access will not be affected.
                    </p>
                  </>
                )}
                
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

      {/* Invite Parent Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowInviteDialog(false);
          setInviteEmail('');
          setGeneratedInviteLink(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {generatedInviteLink ? 'Share Invite Link' : 'Invite a Co-parent'}
            </DialogTitle>
            <DialogDescription>
              {generatedInviteLink 
                ? 'Share this link with your co-parent. The link expires in 7 days.'
                : 'Create an invite link to share with another parent or caregiver.'
              }
            </DialogDescription>
          </DialogHeader>

          {generatedInviteLink ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedInviteLink}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-invite-link"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      toast({
                        title: 'Link copied',
                        description: 'Invite link copied to clipboard.',
                      });
                    }}
                    data-testid="button-copy-invite-link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>They will have access to:</strong>
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  {children.map(child => (
                    <li key={child.id}>{child.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Their Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="parent@example.com"
                  data-testid="input-invite-email"
                />
                <p className="text-xs text-muted-foreground">
                  This helps us identify them when they accept the invitation.
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The invited person will have access to all {children.length} child profile(s):
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  {children.map(child => (
                    <li key={child.id}>{child.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedInviteLink ? (
              <Button 
                onClick={() => {
                  setShowInviteDialog(false);
                  setGeneratedInviteLink(null);
                  setInviteEmail('');
                }}
                data-testid="button-done-invite"
              >
                Done
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!inviteEmail || !inviteEmail.includes('@')) {
                      toast({
                        title: 'Invalid email',
                        description: 'Please enter a valid email address.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    inviteParentMutation.mutate(inviteEmail);
                  }}
                  disabled={inviteParentMutation.isPending}
                  data-testid="button-create-invite-link"
                >
                  {inviteParentMutation.isPending ? 'Creating...' : 'Create Invite Link'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Parent Confirmation Dialog */}
      <AlertDialog open={!!parentToRemove} onOpenChange={(open) => !open && setParentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove parent access?</AlertDialogTitle>
            <AlertDialogDescription>
              {parentToRemove && (
                <>
                  This will remove <strong>{parentToRemove.user.firstName || parentToRemove.user.email}'s</strong> access to all children's profiles. 
                  They will no longer be able to view or track milestones.
                  <p className="mt-2">This action can be undone by sending a new invitation.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setParentToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => parentToRemove && removeParentMutation.mutate(parentToRemove.userId)}
              disabled={removeParentMutation.isPending}
              data-testid="button-confirm-remove-parent"
            >
              {removeParentMutation.isPending ? 'Removing...' : 'Remove Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Family Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={(open) => !open && setShowLeaveDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Leave this family?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all children's profiles and their milestone tracking data.
              Your account will remain active, but you'll need a new invitation to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => leaveFamilyMutation.mutate()}
              disabled={leaveFamilyMutation.isPending}
              data-testid="button-confirm-leave-family"
            >
              {leaveFamilyMutation.isPending ? 'Leaving...' : 'Leave Family'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
