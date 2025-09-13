import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, AlertCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  };
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'insert':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'update':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'delete':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'insert':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card 
      className={`animate-in slide-in-from-right-full duration-300 ${getBackgroundColor()} max-w-sm shadow-lg`}
      data-testid={`notification-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">
              {notification.type === 'insert' && 'New Order Created'}
              {notification.type === 'update' && 'Order Updated'}
              {notification.type === 'delete' && 'Order Deleted'}
            </div>
            <div className="text-sm text-muted-foreground" data-testid={`text-notification-message-${notification.id}`}>
              {notification.message}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            data-testid={`button-close-notification-${notification.id}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
