-- Migration: Rename Client to Studio
-- This migration renames the clients table to studios and updates all foreign key references

-- Rename the main table
ALTER TABLE clients RENAME TO studios;

-- Rename column in photographers table
ALTER TABLE photographers RENAME COLUMN client_id TO studio_id;

-- Rename column in photos table
ALTER TABLE photos RENAME COLUMN client_id TO studio_id;

-- Rename column in photo_sessions table
ALTER TABLE photo_sessions RENAME COLUMN client_id TO studio_id;

-- Rename column in orders table
ALTER TABLE orders RENAME COLUMN client_id TO studio_id;

-- Update constraint names (if needed, PostgreSQL handles this automatically for most cases)
-- The foreign key constraints will continue to work with the new column names
