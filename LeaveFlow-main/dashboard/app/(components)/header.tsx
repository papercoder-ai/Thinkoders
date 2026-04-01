"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, FileText, BarChart3, Calendar, Users, Clock, Gift, User, ClipboardList } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch pending requests count for managers/HR/admin
  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.id, user?.role], // separate cache per user/role to avoid stale empties
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(isAuthenticated && mounted && user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')),
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const pendingCount = pendingRequests?.length || 0;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4 shadow-md mb-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            <span>LeaveFlow</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4 shadow-md mb-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            <span>LeaveFlow</span>
          </Link>
          {isAuthenticated && (
            <nav className="hidden md:flex gap-1">
              <Link href="/requests" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden xl:inline">Pending</span>
              </Link>
              <Link href="/requests/history" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xl:inline">History</span>
              </Link>
              <Link href="/requests/calendar" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden xl:inline">Calendar</span>
              </Link>
              {(user?.role === 'hr' || user?.role === 'admin') && (
                <Link href="/users" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden xl:inline">Users</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/pending-accounts" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden xl:inline">Approvals</span>
                </Link>
              )}
              {(user?.role === 'hr' || user?.role === 'admin') && (
                <Link href="/holidays" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span className="hidden xl:inline">Holidays</span>
                </Link>
              )}
              <Link href="/profile" className="px-3 lg:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden xl:inline">Profile</span>
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <ThemeToggle />
          
          {/* Pending Requests Notification Dropdown - Only for managers/HR/admin */}
          {isAuthenticated && (user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <Badge 
                      variant="rejected" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Pending Requests</span>
                  <Badge variant="outline">{pendingCount}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {pendingCount === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="text-2xl mb-2">✅</div>
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  <>
                    {pendingRequests?.slice(0, 5).map((req) => (
                      <DropdownMenuItem 
                        key={req.id} 
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => router.push(`/requests/${req.id}`)}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-medium text-sm">#{req.id} - {req.user?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {req.leave_type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {req.start_date} → {req.end_date} ({req.days} days)
                        </div>
                        {req.reason && (
                          <div className="text-xs text-muted-foreground truncate w-full mt-1">
                            {req.reason}
                          </div>
                        )}
                      </DropdownMenuItem>
                    ))}
                    
                    {pendingCount > 5 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-center cursor-pointer"
                          onClick={() => router.push('/requests')}
                        >
                          View all {pendingCount} requests →
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {user && (
            <>
              <Link 
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold hidden lg:inline">{user.name}</span>
              </Link>
              <Badge variant="outline" className="capitalize shadow-sm hidden sm:inline-flex">
                {user.role}
              </Badge>
            </>
          )}
          {isAuthenticated ? (
            <>
              <Button 
                onClick={handleLogout} 
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Logout
              </Button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          ) : (
            <Button asChild size="sm">
                <Link href="/signin">
                  Login
                </Link>
              </Button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isAuthenticated && mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-[73px] right-0 bottom-0 w-64 bg-background border-l border-border z-50 md:hidden shadow-xl">
            <nav className="flex flex-col p-4 gap-2">
              {/* User Info */}
              <Link 
                href="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{user?.name}</span>
                  <Badge variant="outline" className="capitalize w-fit text-xs">
                    {user?.role}
                  </Badge>
                </div>
              </Link>

              {/* Navigation Links */}
              <Link 
                href="/requests" 
                onClick={closeMobileMenu}
                className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Pending Requests
              </Link>
              <Link 
                href="/requests/history" 
                onClick={closeMobileMenu}
                className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                History
              </Link>
              <Link 
                href="/requests/calendar" 
                onClick={closeMobileMenu}
                className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
              {(user?.role === 'hr' || user?.role === 'admin') && (
                <>
                  <Link 
                    href="/users" 
                    onClick={closeMobileMenu}
                    className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      href="/pending-accounts" 
                      onClick={closeMobileMenu}
                      className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Approvals
                    </Link>
                  )}
                  <Link 
                    href="/holidays" 
                    onClick={closeMobileMenu}
                    className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Holidays
                  </Link>
                </>
              )}
              <Link 
                href="/profile" 
                onClick={closeMobileMenu}
                className="px-4 py-3 rounded-lg hover:bg-accent transition-all font-medium text-sm flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>

              {/* Logout Button */}
              <div className="mt-auto pt-4 border-t border-border">
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

