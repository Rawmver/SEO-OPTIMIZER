import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, History, Zap, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Optimizer", href: "/", icon: Zap },
    { name: "History", href: "/history", icon: History },
    { name: "Stats", href: "/stats", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 text-primary font-bold text-lg tracking-tight">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Search className="w-5 h-5" />
            </div>
            <span>RankCraft</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground/90" : "text-muted-foreground/70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          <p className="text-center font-mono">v1.0.0-beta</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Search className="w-5 h-5" />
            <span>RankCraft</span>
          </div>
          <nav className="flex items-center gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </header>
        
        <div className="flex-1 p-6 md:p-10 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
