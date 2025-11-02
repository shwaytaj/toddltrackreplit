import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import type { User } from "@shared/schema";

const MILESTONE_SOURCES = [
  { id: "CDC/AAP", name: "CDC/AAP (USA)", description: "Centers for Disease Control / American Academy of Pediatrics" },
  { id: "HSE", name: "HSE (Ireland)", description: "Health Service Executive" },
  { id: "WHO", name: "WHO (International)", description: "World Health Organization" },
  { id: "NHS", name: "NHS (UK)", description: "National Health Service" },
  { id: "CPS", name: "CPS (Canada)", description: "Canadian Paediatric Society" },
  { id: "NHMRC", name: "NHMRC (Australia)", description: "National Health and Medical Research Council" },
  { id: "UNICEF", name: "UNICEF (International)", description: "United Nations Children's Fund" },
];

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('profile');
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Initialize with user's current preferences or empty array (which means "All")
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize selection when user data loads
  if (user && !hasInitialized) {
    setSelectedSources(user.preferredMilestoneSources || []);
    setHasInitialized(true);
  }

  const updatePreferencesMutation = useMutation({
    mutationFn: async (sources: string[]) => {
      return await apiRequest("PATCH", "/api/user/preferences", {
        preferredMilestoneSources: sources.length === 0 ? null : sources,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Settings saved",
        description: "Your milestone source preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSource = (sourceId: string) => {
    setSelectedSources((prev) => {
      if (prev.includes(sourceId)) {
        return prev.filter((id) => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });
  };

  const handleToggleAll = (checked: boolean | string) => {
    if (checked === true) {
      // User is selecting "All Sources" - clear individual selections
      setSelectedSources([]);
    } else {
      // User is unchecking "All Sources" - select all sources by default
      // so they can then deselect the ones they don't want
      setSelectedSources(MILESTONE_SOURCES.map(s => s.id));
    }
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(selectedSources);
  };

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'home') setLocation('/home');
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  const isAllSelected = selectedSources.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-fredoka text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your Toddl experience
          </p>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>Milestone Sources</CardTitle>
          <CardDescription>
            Choose which developmental guidelines to follow. You can select multiple sources or use all available sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* All Sources Option */}
            <div className="flex items-start space-x-3 p-3 rounded-md border hover-elevate active-elevate-2">
              <Checkbox
                id="source-all"
                checked={isAllSelected}
                onCheckedChange={handleToggleAll}
                data-testid="checkbox-source-all"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="source-all" 
                  className="text-base font-medium cursor-pointer"
                >
                  All Sources
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Show milestones from all available organizations (recommended)
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or select specific sources
                </span>
              </div>
            </div>

            {/* Individual Sources */}
            {MILESTONE_SOURCES.map((source) => (
              <div 
                key={source.id}
                className="flex items-start space-x-3 p-3 rounded-md border hover-elevate active-elevate-2"
              >
                <Checkbox
                  id={`source-${source.id}`}
                  checked={isAllSelected || selectedSources.includes(source.id)}
                  disabled={isAllSelected}
                  onCheckedChange={() => handleToggleSource(source.id)}
                  data-testid={`checkbox-source-${source.id.toLowerCase().replace(/\//g, '-')}`}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={`source-${source.id}`}
                    className={`text-base font-medium cursor-pointer ${isAllSelected ? 'opacity-50' : ''}`}
                  >
                    {source.name}
                  </Label>
                  <p className={`text-sm text-muted-foreground mt-1 ${isAllSelected ? 'opacity-50' : ''}`}>
                    {source.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {isAllSelected 
                ? "Showing milestones from all sources" 
                : `${selectedSources.length} source${selectedSources.length === 1 ? '' : 's'} selected`
              }
            </p>
            <Button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              data-testid="button-save-settings"
            >
              {updatePreferencesMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
