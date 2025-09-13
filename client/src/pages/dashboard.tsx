import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import StatsCards from "@/components/StatsCards";
import OrdersTable from "@/components/OrdersTable";
import CreateOrderModal from "@/components/CreateOrderModal";
import NotificationToast from "@/components/NotificationToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Users, Bell, Download, LogOut, User } from "lucide-react";

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

  const { user } = useAuth();
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email;
    return "User";
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName()} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                        {getUserDisplayName()}
                      </p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-item-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-item-notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-item-export">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export Data</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
