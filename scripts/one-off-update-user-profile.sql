-- One-off: set profile for mohammadtuseefarif8@gmail.com
UPDATE "User"
SET
  "firstName" = 'Tuseef',
  "lastName" = 'Arif',
  "phone" = '03248823990',
  "updatedAt" = NOW()
WHERE LOWER("email") = LOWER('mohammadtuseefarif8@gmail.com');
