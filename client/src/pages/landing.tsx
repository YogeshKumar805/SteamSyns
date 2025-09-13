import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Clock, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-beta">
            <TrendingUp className="w-4 h-4 mr-2" />
            Real-time Order Management
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6" data-testid="heading-main">
            Order Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8" data-testid="text-description">
            Experience real-time order tracking with instant updates, powerful analytics, 
            and seamless collaboration. Built for modern businesses that need speed and reliability.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            <Shield className="w-5 h-5 mr-2" />
            Login to Continue
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <Card data-testid="card-realtime">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Watch orders update instantly across all connected devices with WebSocket technology
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-analytics">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Live Analytics</CardTitle>
              <CardDescription>
                Monitor order statistics, revenue tracking, and performance metrics in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card data-testid="card-collaboration">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Multiple team members can work simultaneously with automatic conflict resolution
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Section */}
        <Card className="max-w-4xl mx-auto" data-testid="card-demo">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Live Demo Features</CardTitle>
            <CardDescription>
              See what you'll have access to once you log in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 text-lg" data-testid="text-features-title">Dashboard Features:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center" data-testid="text-feature-orders">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Real-time order tracking and status updates
                  </li>
                  <li className="flex items-center" data-testid="text-feature-search">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Advanced search and filtering capabilities
                  </li>
                  <li className="flex items-center" data-testid="text-feature-stats">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Live statistics and revenue analytics
                  </li>
                  <li className="flex items-center" data-testid="text-feature-history">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Complete order history with audit trails
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-lg" data-testid="text-technical-title">Technical Highlights:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center" data-testid="text-tech-websocket">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    WebSocket-powered real-time communication
                  </li>
                  <li className="flex items-center" data-testid="text-tech-database">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    PostgreSQL with automatic change detection
                  </li>
                  <li className="flex items-center" data-testid="text-tech-auth">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    Secure authentication and session management
                  </li>
                  <li className="flex items-center" data-testid="text-tech-responsive">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    Responsive design for all device types
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-footer">
            Ready to streamline your order management? Click the login button above to get started.
          </p>
        </div>
      </div>
    </div>
  );
}