-- Ensure the app user has CREATEDB privilege for tenant provisioning (M14-F03).
-- The Postgres Docker image creates POSTGRES_USER as a superuser, so this ALTER
-- is a no-op in practice — it makes the intent explicit and survives if the image
-- behaviour ever changes.
ALTER ROLE fuelflow CREATEDB;
