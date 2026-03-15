import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext.jsx";
import Index from "./pages/Index.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CropScan from "./pages/CropScan.jsx";
import YieldPrediction from "./pages/YieldPrediction.jsx";
import MarketPrices from "./pages/MarketPrices.jsx";
import NearbyMarkets from "./pages/NearbyMarkets.jsx";
import Policies from "./pages/Policies.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
// Dealer pages
import DealerDashboard from "./pages/dealer/DealerDashboard.jsx";
import BuyOffers from "./pages/dealer/BuyOffers.jsx";
import FarmerDirectory from "./pages/dealer/FarmerDirectory.jsx";
import Inventory from "./pages/dealer/Inventory.jsx";
import Orders from "./pages/dealer/Orders.jsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const DealerRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== "dealer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crop-scan"
              element={
                <ProtectedRoute>
                  <CropScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/yield-prediction"
              element={
                <ProtectedRoute>
                  <YieldPrediction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market-prices"
              element={
                <ProtectedRoute>
                  <MarketPrices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nearby-markets"
              element={
                <ProtectedRoute>
                  <NearbyMarkets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/policies"
              element={
                <ProtectedRoute>
                  <Policies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Dealer Routes */}
            <Route
              path="/dealer"
              element={
                <DealerRoute>
                  <DealerDashboard />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/buy-offers"
              element={
                <DealerRoute>
                  <BuyOffers />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/buy-offers/new"
              element={
                <DealerRoute>
                  <BuyOffers />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/farmers"
              element={
                <DealerRoute>
                  <FarmerDirectory />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/inventory"
              element={
                <DealerRoute>
                  <Inventory />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/inventory/add"
              element={
                <DealerRoute>
                  <Inventory />
                </DealerRoute>
              }
            />
            <Route
              path="/dealer/orders"
              element={
                <DealerRoute>
                  <Orders />
                </DealerRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

