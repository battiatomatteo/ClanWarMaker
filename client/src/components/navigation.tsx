import { Link, useLocation } from "wouter";
import { Shield, Home, UserPlus, Settings } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/player", label: "Registrazione Player", icon: UserPlus },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-medium">CWL Manager</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded hover:bg-blue-700 transition-colors ${
                  location === path ? "bg-blue-700" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <button className="md:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
