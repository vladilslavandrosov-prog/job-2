import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import AuthPage from "./pages/AuthPage";
import TendersPage from "./pages/TendersPage";
import BillingPage from "./pages/BillingPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/billing" component={BillingPage} />
          <Route path="/" component={TendersPage} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
