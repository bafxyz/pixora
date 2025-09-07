-- Seed data for Supabase database
-- This file is referenced in config.toml

-- Insert sample photographers
INSERT INTO photographers (id, email, name, branding) VALUES
('photographer-1', 'john@studio.com', 'John Smith Photography', '{"brandColor": "#3B82F6", "logoUrl": "", "welcomeMessage": "Welcome to John Smith Photography!"}'),
('photographer-2', 'sarah@portraits.com', 'Sarah Wilson Portraits', '{"brandColor": "#10B981", "logoUrl": "", "welcomeMessage": "Welcome to Sarah Wilson Portraits!"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample guests
INSERT INTO guests (id, name, email, photographer_id) VALUES
('guest-1', 'Alice Johnson', 'alice@email.com', 'photographer-1'),
('guest-2', 'Bob Brown', 'bob@email.com', 'photographer-1'),
('guest-3', 'Carol Davis', 'carol@email.com', 'photographer-2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample photos
INSERT INTO photos (id, photographer_id, guest_id, file_path, file_name, is_selected) VALUES
('photo-1', 'photographer-1', 'guest-1', '/photos/wedding-1.jpg', 'wedding-1.jpg', true),
('photo-2', 'photographer-1', 'guest-1', '/photos/wedding-2.jpg', 'wedding-2.jpg', true),
('photo-3', 'photographer-1', 'guest-2', '/photos/portrait-1.jpg', 'portrait-1.jpg', true),
('photo-4', 'photographer-2', 'guest-3', '/photos/family-1.jpg', 'family-1.jpg', true),
('photo-5', 'photographer-2', 'guest-3', '/photos/family-2.jpg', 'family-2.jpg', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (id, guest_id, photographer_id, photo_ids, total_amount, status) VALUES
('order-1', 'guest-1', 'photographer-1', ARRAY['photo-1', 'photo-2'], 150.00, 'new'),
('order-2', 'guest-3', 'photographer-2', ARRAY['photo-4'], 75.00, 'ready')
ON CONFLICT (id) DO NOTHING;