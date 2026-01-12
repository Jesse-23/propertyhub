import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Users, CreditCard, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground">
      <header className="container py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Building2 className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-xl">PropertyHub</span>
        </div>
        <Link to={user ? "/dashboard" : "/auth"}>
          <Button variant="hero" size="lg" className="h-10 px-4 md:h-12 md:px-8">
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <main className="container py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Property Management <span className="text-gradient">Made Simple</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto">
            Streamline your property operations with our all-in-one platform. 
            Manage tenants, track payments, and handle maintenance requests effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/auth">
              <Button variant="hero" size="xl">Start Free Trial</Button>
            </Link>
            <Button variant="hero-outline" size="xl">Learn More</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            { icon: Shield, title: "Role-Based Access", desc: "Admin, Manager & Tenant dashboards" },
            { icon: Users, title: "Tenant Management", desc: "Track occupancy and lease details" },
            { icon: CreditCard, title: "Payment Tracking", desc: "Integrated payment processing" },
          ].map((feature, i) => (
            <div key={feature.title} className="p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur animate-slide-up" style={{ animationDelay: `${i * 150}ms` }}>
              <feature.icon className="h-10 w-10 text-accent mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">{feature.title}</h3>
              <p className="text-primary-foreground/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
