import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  revenue: number;
}

export function useOrders(search?: string, status?: string, limit = 50) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery<OrdersResponse>({
    queryKey: ["/api/orders", search, status, currentPage, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      
      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
  });

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery<OrderStats>({
    queryKey: ["/api/orders/stats"],
    queryFn: async () => {
      const response = await fetch('/api/orders/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
  });

  const refetch = () => {
    refetchOrders();
    refetchStats();
  };

  return {
    orders: ordersData?.orders || [],
    stats,
    isLoading: isOrdersLoading || isStatsLoading,
    totalPages: ordersData?.totalPages || 1,
    currentPage,
    setCurrentPage,
    refetch,
  };
}
