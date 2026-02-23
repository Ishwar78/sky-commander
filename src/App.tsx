import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import CoinShop from "./pages/CoinShop";
import Leaderboard from "./pages/Leaderboard";
import Skins from "./pages/Skins";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Upgrades from "./pages/Upgrades";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import CosmeticShop from "./pages/CosmeticShop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/play" element={<GamePage />} />
          <Route path="/shop" element={<CoinShop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/skins" element={<Skins />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/sky/login" element={<AdminLogin />} />
          <Route path="/admin/sky/dashboard" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upgrades" element={<Upgrades />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/cosmetics" element={<CosmeticShop />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
