/*
  # Dashboard Owner - Database Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `role` (text) - 'owner' atau 'renter'
      - `created_at` (timestamptz)
    
    - `properties`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles)
      - `name` (text) - Nama kos
      - `address` (text)
      - `city` (text)
      - `description` (text)
      - `is_active` (boolean) - Status kos aktif/tidak
      - `created_at` (timestamptz)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `room_number` (text) - Nomor kamar
      - `room_type` (text) - Type 1, Type 2, dll
      - `price` (integer) - Harga per bulan
      - `facilities` (text) - Deskripsi fasilitas
      - `is_available` (boolean) - Status ketersediaan
      - `created_at` (timestamptz)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `renter_id` (uuid, references profiles)
      - `check_in` (date) - Tanggal mulai sewa
      - `check_out` (date) - Tanggal selesai sewa
      - `total_price` (integer)
      - `duration_months` (integer)
      - `payment_status` (text) - 'pending', 'paid', 'expired'
      - `status` (text) - 'active', 'completed', 'cancelled'
      - `created_at` (timestamptz)
    
    - `orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `room_type` (text)
      - `total_payment` (integer)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `payment_method` (text)
      - `duration` (integer)
      - `check_in` (timestamptz)
      - `check_out` (timestamptz)
      - `status` (text) - 'pending', 'confirmed', 'cancelled'
      - `created_at` (timestamptz)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `rating` (integer)
      - `review` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and owners
    
  3. Indexes
    - Add indexes on foreign keys for better query performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text DEFAULT '',
  email text,
  phone text DEFAULT '',
  role text DEFAULT 'renter' CHECK (role IN ('owner', 'renter')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public can view active properties"
  ON properties FOR SELECT
  TO public
  USING (is_active = true);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  room_number text NOT NULL DEFAULT '',
  room_type text DEFAULT '',
  price integer DEFAULT 0,
  facilities text DEFAULT '',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rooms.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rooms.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view available rooms"
  ON rooms FOR SELECT
  TO public
  USING (is_available = true);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  renter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_price integer DEFAULT 0,
  duration_months integer DEFAULT 1,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view property bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      JOIN properties ON properties.id = rooms.property_id
      WHERE rooms.id = bookings.room_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Renters can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid());

CREATE POLICY "Renters can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Owners can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      JOIN properties ON properties.id = rooms.property_id
      WHERE rooms.id = bookings.room_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  room_type text DEFAULT '',
  total_payment integer DEFAULT 0,
  name text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  payment_method text DEFAULT '',
  duration integer DEFAULT 1,
  check_in timestamptz DEFAULT now(),
  check_out timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);