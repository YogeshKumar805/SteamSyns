import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Clock, CheckCircle, DollarSign } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    revenue: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders.toLocaleString() || "0",
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12.5%",
      changeText: "from last month",
      testId: "card-total-orders"
    },
    {
      title: "Active Orders",
      value: stats?.activeOrders.toLocaleString() || "0",
      icon: Clock,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      change: "+5.2%",
      changeText: "from yesterday",
      testId: "card-active-orders"
    },
    {
      title: "Completed",
      value: stats?.completedOrders.toLocaleString() || "0",
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+8.1%",
      changeText: "completion rate",
      testId: "card-completed-orders"
    },
    {
      title: "Revenue",
      value: `$${stats?.revenue.toLocaleString() || "0"}`,
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+15.3%",
      changeText: "from last week",
      testId: "card-revenue"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title} data-testid={card.testId}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-semibold text-foreground" data-testid={`text-${card.testId}-value`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600 font-medium">{card.change}</span>
              <span className="text-muted-foreground ml-1">{card.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
