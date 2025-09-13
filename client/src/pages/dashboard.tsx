import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import StatsCards from "@/components/StatsCards";
import OrdersTable from "@/components/OrdersTable";
import CreateOrderModal from "@/components/CreateOrderModal";
import NotificationToast from "@/components/NotificationToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Users, Bell, Download } from "lucide-react";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>>([]);

  const { 
    orders, 
    stats, 
    isLoading, 
    refetch: refetchOrders,
    totalPages,
    currentPage,
    setCurrentPage
  } = useOrders(search, statusFilter);
  
  const { connectionStatus, connectedClients } = useWebSocket({
    onOrderChange: (data) => {
      // Refresh orders when changes are detected
      refetchOrders();
      
      // Add notification
      const notification = {
        id: Date.now().toString(),
        type: data.operation.toLowerCase(),
        message: getNotificationMessage(data),
        timestamp: new Date(),
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Auto remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  });

  const getNotificationMessage = (data: any) => {
    switch (data.operation) {
      case 'INSERT':
        return `New order created: #${data.data.id}`;
      case 'UPDATE':
        return `Order #${data.data.id} updated to ${data.data.status}`;
      case 'DELETE':
        return `Order #${data.data.id} was deleted`;
      default:
        return 'Order updated';
    }
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'Connected', color: 'text-green-600', icon: 'bg-green-500' };
      case 'connecting':
        return { text: 'Connecting', color: 'text-yellow-600', icon: 'bg-yellow-500' };
      case 'disconnected':
        return { text: 'Disconnected', color: 'text-red-600', icon: 'bg-red-500' };
      default:
        return { text: 'Unknown', color: 'text-gray-600', icon: 'bg-gray-500' };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
                </div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="text-dashboard-title">
                  Order Management Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${connectionDisplay.icon} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
                <span className={`font-medium ${connectionDisplay.color}`} data-testid="text-connection-status">
                  {connectionDisplay.text}
                </span>
                <span className="text-muted-foreground">• Real-time updates active</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span data-testid="text-connected-clients">{connectedClients}</span>
                <span>clients</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" data-testid="button-notifications">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-semibold text-foreground">Live Orders</h2>
            <p className="text-sm text-muted-foreground">Real-time order tracking and management</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-orders"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="button-create-order"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatsCards stats={stats} isLoading={isLoading} />

        {/* Orders Table */}
        <OrdersTable 
          orders={orders} 
          isLoading={isLoading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onRefresh={refetchOrders}
        />
      </main>

      {/* Modals and Notifications */}
      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetchOrders();
        }}
      />
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          />
        ))}
      </div>
    </div>
  );
}
