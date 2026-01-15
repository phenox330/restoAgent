-- =============================================
-- Migration 00006: Add request_type to reservations
-- Story 1.2: Graceful Technical Error Handling
-- =============================================

-- Create request_type ENUM
CREATE TYPE request_type AS ENUM ('reservation', 'technical_error', 'complex_request');

-- Add request_type column to reservations table
ALTER TABLE reservations
  ADD COLUMN request_type request_type NOT NULL DEFAULT 'reservation';

-- Add new status for pending requests
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'pending_request';

-- Create index for filtering by request_type
CREATE INDEX idx_reservations_request_type ON reservations(request_type);

-- Create index for pending_request status (for admin dashboard queries)
CREATE INDEX idx_reservations_pending_requests ON reservations(status)
  WHERE status = 'pending_request';

-- Comment for documentation
COMMENT ON COLUMN reservations.request_type IS
  'Type of request: reservation (normal), technical_error (fallback when system error), complex_request (requires manual handling)';

-- Update valid_date constraint to allow NULL dates for technical_error requests
-- (customer may not have specified a date before error occurred)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS valid_date;
ALTER TABLE reservations
  ADD CONSTRAINT valid_date
  CHECK (
    (request_type = 'technical_error' AND reservation_date IS NULL) OR
    (request_type != 'technical_error' AND reservation_date >= CURRENT_DATE)
  );

-- Make reservation_date and reservation_time nullable for technical_error cases
ALTER TABLE reservations ALTER COLUMN reservation_date DROP NOT NULL;
ALTER TABLE reservations ALTER COLUMN reservation_time DROP NOT NULL;
