import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveChildProvider } from "@/contexts/ActiveChildContext";
import { useUser } from "@/hooks/use-user";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Milestones from "@/pages/Milestones";
import MilestoneDetail from "@/pages/MilestoneDetail";
import GrowthDetail from "@/pages/GrowthDetail";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import InviteAccept from "@/pages/InviteAccept";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/invite/:token" component={InviteAccept} />
      <Route path="/home" component={Home} />
      <Route path="/milestones" component={Milestones} />
      <Route path="/milestone/:id" component={MilestoneDetail} />
      <Route path="/growth/:type" component={GrowthDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useUser();
  
  return (
    <ActiveChildProvider userId={user?.id || null}>
      <Router />
    </ActiveChildProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
