import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Milestones from "@/pages/Milestones";
import MilestoneDetail from "@/pages/MilestoneDetail";
import GrowthDetail from "@/pages/GrowthDetail";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
