import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><DailySalesReport /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
            <Route path="/collection-history" element={<ProtectedRoute><CollectionHistory /></ProtectedRoute>} />
            <Route path="/collection-items" element={<ProtectedRoute><CollectionItems /></ProtectedRoute>} />
            <Route path="/extra-area" element={<ProtectedRoute><ExtraAreaReport /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
