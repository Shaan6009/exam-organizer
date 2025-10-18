import { Link, useLocation } from "react-router-dom";
import { Calendar, GraduationCap, Users, BookOpen, DoorOpen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/exams", label: "Exam Schedules", icon: Calendar },
    { path: "/courses", label: "Courses", icon: GraduationCap },
    { path: "/subjects", label: "Subjects", icon: BookOpen },
    { path: "/rooms", label: "Rooms", icon: DoorOpen },
    { path: "/invigilators", label: "Invigilators", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Exam Timetable Manager</h1>
                <p className="text-sm text-muted-foreground">College Administration System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-card-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
