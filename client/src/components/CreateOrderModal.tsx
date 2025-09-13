import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type InsertOrder } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const products = [
  { name: "Premium Headphones", sku: "HP-001", price: 299.99 },
  { name: "Wireless Mouse", sku: "WM-002", price: 49.99 },
  { name: "Gaming Keyboard", sku: "GK-003", price: 129.99 },
  { name: "USB-C Hub", sku: "UH-004", price: 79.99 },
  { name: "4K Monitor", sku: "MN-005", price: 599.99 },
  { name: "Wireless Earbuds", sku: "WE-006", price: 159.99 },
];

const formSchema = insertOrderSchema.extend({
  productSelection: z.string().min(1, "Please select a product"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      productName: "",
      productSku: "",
      amount: "",
      productSelection: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order created",
        description: "The order has been successfully created.",
      });
      reset();
      setSelectedProduct(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    const orderData: InsertOrder = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      amount: selectedProduct.price.toString(),
    };

    createOrderMutation.mutate(orderData);
  };

  const handleProductSelect = (productSku: string) => {
    const product = products.find(p => p.sku === productSku);
    if (product) {
      setSelectedProduct(product);
      setValue("productSelection", productSku);
      setValue("productName", product.name);
      setValue("productSku", product.sku);
      setValue("amount", product.price.toString());
    }
  };

  const handleClose = () => {
    reset();
    setSelectedProduct(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-order">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              {...register("customerName")}
              placeholder="Enter customer name"
              data-testid="input-customer-name"
            />
            {errors.customerName && (
              <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              {...register("customerEmail")}
              placeholder="customer@example.com"
              data-testid="input-customer-email"
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive mt-1">{errors.customerEmail.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="product">Product</Label>
            <Select onValueChange={handleProductSelect} data-testid="select-product">
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.sku} value={product.sku}>
                    {product.name} - ${product.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productSelection && (
              <p className="text-sm text-destructive mt-1">{errors.productSelection.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-8"
                value={selectedProduct?.price || ""}
                readOnly
                placeholder="0.00"
                data-testid="input-amount"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createOrderMutation.isPending}
              data-testid="button-create"
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
