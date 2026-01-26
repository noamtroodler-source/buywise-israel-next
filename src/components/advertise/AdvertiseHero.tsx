import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Users, Bell } from "lucide-react";

export function AdvertiseHero() {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-24 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Badge variant="secondary" className="gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now accepting new professionals
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Grow Your Business with{" "}
              <span className="text-foreground">BuyWise</span>{" "}
              <span className="text-primary">Israel</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Join the platform built specifically for English-speaking buyers. 
              Whether you're an agent, agency, or developer—reach motivated Anglo 
              buyers actively searching for Israeli real estate.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="#choose-path">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            {/* Trust indicator */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((letter, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Join <span className="font-semibold text-foreground">50+ professionals</span> already on the platform
              </p>
            </div>
          </motion.div>

          {/* Right Visual - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main Dashboard Card */}
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  JD
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Your Professional Profile</h3>
                  <p className="text-sm text-muted-foreground">Agent • Agency • Developer</p>
                </div>
                <Badge className="ml-auto">Verified</Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">Active Listings</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">2.4K</p>
                  <p className="text-xs text-muted-foreground">Monthly Views</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">18</p>
                  <p className="text-xs text-muted-foreground">New Leads</p>
                </div>
              </div>

              {/* Performance Preview */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground mb-3">Performance Analytics</p>
                <div className="flex items-end gap-1 h-16">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Notification Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -bottom-4 -left-8 bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">New inquiry received!</p>
                <p className="text-xs text-muted-foreground">From a buyer in Jerusalem</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
