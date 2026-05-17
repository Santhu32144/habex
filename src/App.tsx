// Main App component - v9 - with authentication
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { HabitProvider } from "@/contexts/HabitContext";
import { RecurringExpenseProvider } from "@/contexts/RecurringExpenseContext";
import { UnallocatedExpenseProvider } from "@/contexts/UnallocatedExpenseContext";
import { Layout } from "@/components/Layout";
import { AppWrapper } from "@/components/AppWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import MonthlyView from "./pages/MonthlyView";
import AddEditExpense from "./pages/AddEditExpense";
import RecurringExpenses from "./pages/RecurringExpenses";
import HabitsDashboard from "./pages/HabitsDashboard";
import AddHabit from "./pages/AddHabit";
import Challenge21Days from "./pages/Challenge21Days";
import Notebook from "./pages/Notebook";
import SharedInvestments from "./pages/SharedInvestments";
import InvestmentGroupDashboard from "./pages/InvestmentGroupDashboard";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CombinedDashboard from "./pages/CombinedDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MindPuzzleGame from "./pages/MindPuzzleGame";
import GamesHub from "./pages/GamesHub";
import NumberMemoryGame from "./pages/games/NumberMemoryGame";
import ReactionTimeGame from "./pages/games/ReactionTimeGame";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="habex-theme">
        <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <UnallocatedExpenseProvider>
              <AppWrapper>
                <ExpenseProvider>
                  <RecurringExpenseProvider>
                    <HabitProvider>
                      <Toaster />
                      <Sonner />
                      <Routes>
                    {/* Auth route */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout><CombinedDashboard /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/expenses" element={
                      <ProtectedRoute>
                        <Layout><Index /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/months" element={
                      <ProtectedRoute>
                        <Layout><MonthlyView /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/add" element={
                      <ProtectedRoute>
                        <Layout><AddEditExpense /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/edit/:year/:month" element={
                      <ProtectedRoute>
                        <Layout><AddEditExpense /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recurring" element={
                      <ProtectedRoute>
                        <Layout><RecurringExpenses /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Habit routes */}
                    <Route path="/habits" element={
                      <ProtectedRoute>
                        <Layout><HabitsDashboard /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/habits/add" element={
                      <ProtectedRoute>
                        <Layout><AddHabit /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/habits/challenge" element={
                      <ProtectedRoute>
                        <Layout><Challenge21Days /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Personal */}
                    <Route path="/notebook" element={
                      <ProtectedRoute>
                        <Layout><Notebook /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Shared Investments */}
                    <Route path="/investments" element={
                      <ProtectedRoute>
                        <Layout><SharedInvestments /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/investments/:groupId" element={
                      <ProtectedRoute>
                        <Layout><InvestmentGroupDashboard /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/games" element={
                      <ProtectedRoute>
                        <Layout><GamesHub /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/games/mind-puzzle" element={
                      <ProtectedRoute>
                        <Layout><MindPuzzleGame /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/games/number-memory" element={
                      <ProtectedRoute>
                        <Layout><NumberMemoryGame /></Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/games/reaction-time" element={
                      <ProtectedRoute>
                        <Layout><ReactionTimeGame /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Settings */}
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Layout><Settings /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <Layout><AdminDashboard /></Layout>
                      </AdminRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                      </Routes>
                    </HabitProvider>
                  </RecurringExpenseProvider>
                </ExpenseProvider>
              </AppWrapper>
            </UnallocatedExpenseProvider>
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
