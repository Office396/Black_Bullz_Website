-- =============================================================================
-- ADMIN PASSWORD SETUP SCRIPT
-- Run this AFTER supabase-schema.sql to create admin credentials with a
-- properly bcrypt-hashed password.
-- =============================================================================

-- Step 1: Generate a bcrypt hash of your desired admin password
-- You can generate this hash by running in your project directory:
--   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD_HERE', 12).then(h => console.log(h))"
-- Then paste the output below.

-- Step 2: Replace the placeholder values and run this SQL

-- Default admin user with a placeholder hash (REPLACE THE HASH!)
-- The hash below is for the password "admin123" - CHANGE THIS!
INSERT INTO admin_credentials (username, password)
VALUES ('admin', '$2a$12$LJ3m4ys3Lg.Ky8YXQXZQXOQXQXQXQXQXQXQXQXQXQXQXQXQXQX')
ON CONFLICT (username) DO UPDATE
  SET password = EXCLUDED.password,
      updated_at = NOW();

-- =============================================================================
-- IMPORTANT SECURITY NOTES:
-- 1. NEVER use plaintext passwords in this file or the database
-- 2. The hash MUST be generated with bcrypt (12+ rounds recommended)
-- 3. To generate a hash, run: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h))"
-- 4. After first login, use the admin portal to update credentials
-- 5. Delete this file or rotate credentials after initial setup
-- =============================================================================
