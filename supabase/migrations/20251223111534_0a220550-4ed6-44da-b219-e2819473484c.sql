-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'property_manager', 'tenant');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('available', 'occupied', 'maintenance');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'overdue');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  property_type TEXT NOT NULL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_sqft NUMERIC,
  rent_amount NUMERIC NOT NULL,
  status property_status DEFAULT 'available',
  manager_id UUID REFERENCES auth.users(id),
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenants table (links tenant user to property)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC,
  security_deposit NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date DATE NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_reference TEXT,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance requests table
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Create default role based on metadata or default to tenant
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'tenant')
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update triggers for all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can view tenant profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'property_manager'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for properties
CREATE POLICY "Anyone authenticated can view available properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all properties"
  ON public.properties FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can manage their properties"
  ON public.properties FOR ALL
  USING (manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'property_manager') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tenants
CREATE POLICY "Tenants can view their own record"
  ON public.tenants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all tenants"
  ON public.tenants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can view tenants in their properties"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = tenants.property_id
      AND properties.manager_id = auth.uid()
    )
  );

CREATE POLICY "Property managers can manage tenants"
  ON public.tenants FOR ALL
  USING (public.has_role(auth.uid(), 'property_manager') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
CREATE POLICY "Tenants can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = payments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can view payments for their properties"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = payments.property_id
      AND properties.manager_id = auth.uid()
    )
  );

CREATE POLICY "Property managers can manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'property_manager') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for maintenance_requests
CREATE POLICY "Tenants can view and create their maintenance requests"
  ON public.maintenance_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = maintenance_requests.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can create maintenance requests"
  ON public.maintenance_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all maintenance requests"
  ON public.maintenance_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can manage maintenance for their properties"
  ON public.maintenance_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = maintenance_requests.property_id
      AND properties.manager_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies for property images
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' 
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'property_manager'))
  );

CREATE POLICY "Property managers and admins can delete property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'property_manager'))
  );