-- Improve global search lookups by name-like fields.
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Product_model_idx" ON "Product"("model");
