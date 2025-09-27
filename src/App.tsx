import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssetFlowProvider } from "@/context/AssetFlowContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import Index from "./pages/Landing";
import CapitalForm from "./pages/CapitalForm";
import RevenueForm from "./pages/RevenueForm";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AssetFlowProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/capital" element={<CapitalForm />} />
                  <Route path="/revenue" element={<RevenueForm />} />
                  <Route path="/reports" element={<Reports />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AssetFlowProvider>
  </QueryClientProvider>
);

export default App;
