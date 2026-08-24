-- DropIndex
-- The historical drop in 20260820232354_allow_multiple_sessions_per_user sorts
-- before 20260821000000_init, which is what creates "Session_userId_key", so on
-- a fresh replay it executed too early to have any effect. This migration
-- performs the actual removal so replayed history matches the live database.
DROP INDEX IF EXISTS "Session_userId_key";
