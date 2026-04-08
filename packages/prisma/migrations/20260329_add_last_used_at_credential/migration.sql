-- Member 1: Database
-- Adds lastUsedAt to the Credential table so we can track
-- when each connected app was last active.
--
-- TODO:
--   1. Add the column below (already written for you)
--   2. Update packages/prisma/schema.prisma to add the field
--      to the Credential model:
--
--        model Credential {
--          ...existing fields...
--          lastUsedAt  DateTime?   // <-- add this
--        }
--
--   3. Run: npx prisma generate
--   4. Verify the Zod types update automatically

ALTER TABLE "Credential"
ADD COLUMN "lastUsedAt" TIMESTAMP(3);
