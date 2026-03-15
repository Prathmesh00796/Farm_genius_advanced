-- Create buy_offers table for dealers to post buying offers
CREATE TABLE public.buy_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT,
  quantity_quintals NUMERIC NOT NULL,
  price_per_quintal NUMERIC NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dealer_inventory table
CREATE TABLE public.dealer_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT,
  quantity_quintals NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  farmer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for order management
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  farmer_id UUID,
  crop TEXT NOT NULL,
  variety TEXT,
  quantity_quintals NUMERIC NOT NULL,
  price_per_quintal NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  farmer_name TEXT,
  farmer_phone TEXT,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.buy_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buy_offers
CREATE POLICY "Dealers can view their own offers"
ON public.buy_offers FOR SELECT
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can create offers"
ON public.buy_offers FOR INSERT
WITH CHECK (auth.uid() = dealer_id AND public.has_role(auth.uid(), 'dealer'));

CREATE POLICY "Dealers can update their own offers"
ON public.buy_offers FOR UPDATE
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can delete their own offers"
ON public.buy_offers FOR DELETE
USING (auth.uid() = dealer_id);

-- Farmers can view active buy offers
CREATE POLICY "Farmers can view active buy offers"
ON public.buy_offers FOR SELECT
USING (status = 'active');

-- RLS Policies for dealer_inventory
CREATE POLICY "Dealers can view their own inventory"
ON public.dealer_inventory FOR SELECT
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can create inventory items"
ON public.dealer_inventory FOR INSERT
WITH CHECK (auth.uid() = dealer_id AND public.has_role(auth.uid(), 'dealer'));

CREATE POLICY "Dealers can update their own inventory"
ON public.dealer_inventory FOR UPDATE
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can delete their own inventory"
ON public.dealer_inventory FOR DELETE
USING (auth.uid() = dealer_id);

-- RLS Policies for orders
CREATE POLICY "Dealers can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = dealer_id AND public.has_role(auth.uid(), 'dealer'));

CREATE POLICY "Dealers can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = dealer_id);

-- Farmers can view orders where they are involved
CREATE POLICY "Farmers can view their orders"
ON public.orders FOR SELECT
USING (auth.uid() = farmer_id);

-- Create triggers for updated_at
CREATE TRIGGER update_buy_offers_updated_at
BEFORE UPDATE ON public.buy_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dealer_inventory_updated_at
BEFORE UPDATE ON public.dealer_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();