import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, Wrench, TrendingUp, Home } from "lucide-react";

export default function Dashboard() {
  const { role } = useAuth();

  const stats = role === "tenant" ? [
    { title: "My Rent", value: "₦150,000", icon: CreditCard, change: "Due in 5 days" },
    { title: "Maintenance", value: "1 Open", icon: Wrench, change: "Last updated today" },
  ] : [
    { title: "Total Properties", value: "24", icon: Building2, change: "+2 this month" },
    { title: "Active Tenants", value: "89", icon: Users, change: "+5 this month" },
    { title: "Revenue", value: "₦12.5M", icon: TrendingUp, change: "+12% vs last month" },
    { title: "Maintenance", value: "8 Open", icon: Wrench, change: "3 urgent" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {role === "tenant" ? "Welcome to your tenant portal" : "Overview of your property portfolio"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {role === "admin" && "Manage properties, tenants, and view analytics from this dashboard."}
              {role === "property_manager" && "Manage your assigned properties and tenants."}
              {role === "tenant" && "View your property details, make payments, and submit maintenance requests."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
