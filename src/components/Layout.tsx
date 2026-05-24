// Layout component - v9 - with bottom tab bar
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Handshake,
  PlusCircle,
  Menu,
  X,
  Search,
  Wallet,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Target,
  CheckSquare,
  BarChart3,
  Settings,
  Flame,
  User,
  BookOpen,
  RefreshCw,
  Brain,
  Hash,
  Zap,
  Gamepad2,
  Play,
  Shield
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExpenses } from '@/contexts/ExpenseContext';
import { NotificationBell } from '@/components/NotificationBell';
import { BottomTabBar } from '@/components/BottomTabBar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ThemeQuickSwitch } from '@/components/ThemeQuickSwitch';
import { QuickActionsButton } from '@/components/QuickActionsButton';
import { CommandPalette } from '@/components/CommandPalette';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useSwipe } from '@/hooks/useSwipe';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Search Icon Button with popover search
const SearchIconButton: React.FC = () => {
  const { searchTerm, setSearchTerm } = useExpenses();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative hover:bg-primary/10",
            searchTerm && "text-primary"
          )}
        >
          <Search className="w-5 h-5" />
          {searchTerm && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { to: string; icon: React.ElementType; label: string }[];
}

// Top-level dashboard item (not in a group)
const topLevelItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
];

const navGroups: NavGroup[] = [
  {
    label: 'Expenses',
    icon: Receipt,
    items: [
      { to: '/expenses', icon: Wallet, label: 'Expense Dashboard' },
      { to: '/months', icon: Calendar, label: 'Monthly View' },
      { to: '/add', icon: PlusCircle, label: 'Add Expense' },
      { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
    ],
  },
  {
    label: 'Habit Tracking',
    icon: Target,
    items: [
      { to: '/habits', icon: BarChart3, label: 'Dashboard' },
      { to: '/habits/add', icon: CheckSquare, label: 'Add Habit' },
      { to: '/habits/challenge', icon: Flame, label: '21 Days Challenge' },
    ],
  },
  {
    label: 'Personal',
    icon: User,
    items: [
      { to: '/notebook', icon: BookOpen, label: 'Notebook' },
    ],
  },
  {
    label: 'Shared Investments',
    icon: Handshake,
    items: [
      { to: '/investments', icon: TrendingUp, label: 'Groups' },
    ],
  },
  {
    label: 'Games',
    icon: Gamepad2,
    items: [
      { to: '/games', icon: Gamepad2, label: 'All Games' },
      { to: '/games/mind-puzzle', icon: Brain, label: 'Mind Puzzle' },
      { to: '/games/number-memory', icon: Hash, label: 'Number Memory' },
      { to: '/games/reaction-time', icon: Zap, label: 'Reaction Time' },
    ],
  },
];

const VISIBILITY_STORAGE_KEY = 'sidebar-visibility-settings';
const COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return saved === 'true';
  });
  const [openGroups, setOpenGroups] = useState<string[]>(['Expenses', 'Habit Tracking']);
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    const saved = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  // Swipe navigation between bottom tab routes
  const tabRoutes = ['/', '/expenses', '/habits', '/notebook', '/settings'];
  const currentTabIndex = tabRoutes.findIndex(r => 
    r === '/' ? location.pathname === '/' : location.pathname.startsWith(r)
  );

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (currentTabIndex >= 0 && currentTabIndex < tabRoutes.length - 1) {
        navigate(tabRoutes[currentTabIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        navigate(tabRoutes[currentTabIndex - 1]);
      }
    },
    minSwipeDistance: 80,
  });

  // Listen for storage changes from Settings page
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCollapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      setCollapsed(savedCollapsed === 'true');
      
      const savedHidden = localStorage.getItem(VISIBILITY_STORAGE_KEY);
      setHiddenItems(savedHidden ? JSON.parse(savedHidden) : []);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const closeSidebar = () => setSidebarOpen(false);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const isItemVisible = (key: string) => !hiddenItems.includes(key);

  // Filter visible items for each group
  const getVisibleItems = (group: NavGroup) => 
    group.items.filter(item => isItemVisible(item.to));

  // Find current page label for header
  const getCurrentPageLabel = () => {
    if (location.pathname === '/settings') return 'Settings';
    for (const group of navGroups) {
      const item = group.items.find((i) => i.to === location.pathname);
      if (item) return `${group.label} - ${item.label}`;
    }
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen flex-shrink-0 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground relative">
          {/* Collapse toggle button - desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>

          {/* Logo */}
          <div
            className={cn("p-4 flex items-center gap-3 cursor-pointer", collapsed && "justify-center")}
            onClick={() => navigate('/')}
          >
            <motion.img
              src="/habex-logo.png"
              alt="Habex"
              className="w-10 h-10 rounded-xl flex-shrink-0 cursor-pointer"
              whileHover={{
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.4 }
              }}
              whileTap={{ scale: 0.95 }}
            />
            {!collapsed && (
              <div className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <h1 className="font-display font-bold text-lg text-sidebar-foreground truncate">Habex</h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">Habits & Expenses</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={closeSidebar}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {/* Top-level Dashboard link */}
            {collapsed ? (
              topLevelItems.map((item) => (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))
            ) : (
              topLevelItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-2",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))
            )}

            {navGroups.map((group) => {
              const visibleItems = getVisibleItems(group);
              if (visibleItems.length === 0) return null;
              
              if (collapsed) {
                // Collapsed: show icons only with tooltips
                return (
                  <div key={group.label} className="space-y-1">
                    {visibleItems.map((item) => (
                      <Tooltip key={item.to}>
                        <TooltipTrigger asChild>
                          <NavLink
                            to={item.to}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )
                            }
                          >
                            <item.icon className="w-5 h-5" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                );
              }

              return (
                <Collapsible
                  key={group.label}
                  open={openGroups.includes(group.label)}
                  onOpenChange={() => toggleGroup(group.label)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <group.icon className="w-5 h-5" />
                      {group.label}
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        openGroups.includes(group.label) && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>

          {/* Quick-launch: Mind Puzzle */}
          {!collapsed && (
            <div className="px-3 pb-2">
              <NavLink
                to="/games/mind-puzzle"
                onClick={closeSidebar}
                className="group block rounded-lg border border-sidebar-border bg-gradient-to-br from-primary/15 via-sidebar-accent/40 to-transparent p-3 transition-all hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Quick play
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-sidebar-foreground">Mind Puzzle</div>
                    <div className="text-[11px] text-sidebar-foreground/60">1-click memory drill</div>
                  </div>
                  <div className="rounded-full bg-primary p-1.5 text-primary-foreground shadow transition-transform group-hover:scale-110">
                    <Play className="h-3.5 w-3.5" />
                  </div>
                </div>
              </NavLink>
            </div>
          )}
          {collapsed && (
            <div className="px-2 pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/games/mind-puzzle"
                    onClick={closeSidebar}
                    className="flex items-center justify-center w-full p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">Quick play: Mind Puzzle</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Admin & Settings Links */}
          <div className="px-2 py-2 space-y-1">
            {/* Admin Link - only visible to admins */}
            {isAdmin && (
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/admin"
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )
                      }
                    >
                      <Shield className="w-5 h-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">Admin</TooltipContent>
                </Tooltip>
              ) : (
                <NavLink
                  to="/admin"
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </NavLink>
              )
            )}

            {/* Settings Link */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/settings"
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )
                    }
                  >
                    <Settings className="w-5 h-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                to="/settings"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <Settings className="w-5 h-5" />
                Settings
              </NavLink>
            )}
          </div>

          {/* Footer Stats - hide when collapsed */}
          {/* /* {!collapsed && (
            <div className="p-4 m-2 rounded-xl bg-sidebar-accent">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-sidebar-primary" />
                <span className="text-xs font-medium text-sidebar-foreground/80">Quick Stats</span>
              </div>
              <p className="text-xs text-sidebar-foreground/60">
                Track and manage your expenses & habits.
              </p>
            </div>
          {/* */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 h-16">
            {/* Left: Menu + Logo + Title */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-primary/10 h-9 w-9"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <motion.img
                  src="/habex-logo.png"
                  alt="Habex"
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg lg:hidden cursor-pointer flex-shrink-0"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                />
                <h1 className="font-display font-bold text-base sm:text-xl text-primary lg:hidden whitespace-nowrap hover:opacity-80 transition-opacity">Habex</h1>
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="font-display font-semibold text-lg tracking-tight">
                    {getCurrentPageLabel()}
                  </h2>
                </div>
              </div>
            </div>

            {/* Right: Search Icon + Actions */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* Global Search */}
              <GlobalSearch />
              <ThemeQuickSwitch />
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          {/* Breadcrumbs */}
          {location.pathname !== '/' && (
            <Breadcrumbs />
          )}

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom Tab Bar for Mobile */}
        <BottomTabBar />
        <NotificationPrompt />
      </main>

      {/* Command Palette */}
      <CommandPalette />

      {/* Quick Actions Floating Button */}
      <QuickActionsButton />
    </div>
  );
};