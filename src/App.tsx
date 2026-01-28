import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DailySalesReport from "./pages/DailySalesReport";
import SalesHistory from "./pages/SalesHistory";
import CollectionHistory from "./pages/CollectionHistory";
import CollectionItems from "./pages/CollectionItems";
import ExtraAreaReport from "./pages/ExtraAreaReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DailySalesReport />} />
          <Route path="/history" element={<SalesHistory />} />
          <Route path="/collection-history" element={<CollectionHistory />} />
          <Route path="/collection-items" element={<CollectionItems />} />
          <Route path="/extra-area" element={<ExtraAreaReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
