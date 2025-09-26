# Address Migration Guide: Upgrading to Enhanced HHG Format

This guide explains how to migrate existing addresses from the old format to the new enhanced HHG code format.

## Overview

**Old Format:** `NG-XX-YY-ZZZ-NNNN` (5 parts)
**New Format:** `NG-XX-YY-ZZZ-GG-NNNN` (6 parts)

The new format adds a grid code (GG) for more precise location identification and uses meaningful area codes instead of sequential numbers.

## Database Changes Required

### 1. Add Grid Code Column

```sql
-- Add grid_code column to addresses table
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS grid_code TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS addresses_grid_code_idx ON addresses(grid_code);

-- Add comment to document the new column
COMMENT ON COLUMN addresses.grid_code IS 'Grid code for enhanced HHG format (2 characters, base-36 encoded)';
```

### 2. Update Schema (if using Drizzle migrations)

Run the migration file: `drizzle/0010_add_grid_code_to_addresses.sql`

## Migration Process

### Option 1: Automated Migration Script

Run the migration script when database is available:

```bash
# From the server directory
npx ts-node src/scripts/migrate-addresses-to-enhanced-format.ts
```

### Option 2: Manual Migration

If you prefer to migrate manually or need to handle specific cases:

1. **Backup your database first!**
2. Add the grid_code column (see SQL above)
3. Update addresses one by one using the enhanced generateHhgCode function

### Option 3: Gradual Migration

For large datasets, consider migrating in batches:

```typescript
// Example batch migration
const batchSize = 100;
const addresses = await getAddressesBatch(offset, batchSize);

for (const address of addresses) {
  const newCode = await generateHhgCode(
    address.latitude,
    address.longitude,
    address.street,
    address.landmark,
    address.houseNumber,
    address.stateCode,
    address.lgaCode
  );

  // Update address with new code
  await updateAddress(address.id, newCode);
}
```

## What Gets Updated

### HHG Code Format

- **Before:** `NG-LA-001-STR001-4757`
- **After:** `NG-LA-15-VIC-CA-4284`

### Database Fields Updated

- `hhg_code` - Updated to new format
- `area_type` - Updated to meaningful type (STREET, LANDMARK, ZONE)
- `area_code` - Updated to meaningful code (VIC, HOS, Z01, etc.)
- `grid_code` - New field with grid identifier
- `location_number` - Updated to incorporate house number

## Example Transformations

| Old Code                | New Code               | Area | Type     | Grid | Location |
| ----------------------- | ---------------------- | ---- | -------- | ---- | -------- |
| `NG-LA-001-STR001-4757` | `NG-LA-15-VIC-CA-4284` | VIC  | STREET   | CA   | 4284     |
| `NG-FC-001-LMK001-1234` | `NG-FC-01-HOS-1B-1234` | HOS  | LANDMARK | 1B   | 1234     |
| `NG-KN-001-Z001-5678`   | `NG-KN-08-Z01-2C-5678` | Z01  | ZONE     | 2C   | 5678     |

## Rollback (if needed)

If you need to rollback the migration:

```bash
npx ts-node src/scripts/rollback-address-migration.ts
```

**Warning:** This will remove the enhanced grid information and revert to the old format.

## Validation

After migration, validate the results:

```typescript
// Check that all addresses are in new format
const newFormatCount = await db.execute(sql`
  SELECT COUNT(*) 
  FROM addresses 
  WHERE hhg_code LIKE 'NG-%-%-%-%-%-%'
`);

// Check that grid codes are populated
const gridCodeCount = await db.execute(sql`
  SELECT COUNT(*) 
  FROM addresses 
  WHERE grid_code IS NOT NULL
`);
```

## Testing

Before running on production:

1. **Test on a copy of your database**
2. **Verify the migration script works correctly**
3. **Check that all addresses are properly converted**
4. **Ensure no data is lost during migration**

## Monitoring

After migration, monitor:

- Address creation using new format
- API responses include new fields
- QR codes work with new format
- Search functionality works correctly

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Ensure database is accessible
   - Check connection credentials
   - Verify network connectivity

2. **Invalid Coordinates**

   - Some addresses may have invalid lat/lng
   - These will be skipped during migration
   - Check logs for details

3. **Duplicate HHG Codes**

   - New format should prevent duplicates
   - If duplicates occur, check the generation logic

4. **Missing Street Names**
   - Addresses without street names will use landmark or coordinate-based zones
   - This is expected behavior

### Recovery

If migration fails:

1. **Stop the migration process**
2. **Check database state**
3. **Fix any issues**
4. **Restart migration from where it left off**
5. **Or rollback and start fresh**

## Support

If you encounter issues:

1. Check the migration logs
2. Verify database connectivity
3. Test with a small subset first
4. Contact the development team if needed

## Migration Checklist

- [ ] Backup database
- [ ] Add grid_code column
- [ ] Test migration script on copy
- [ ] Run migration on production
- [ ] Validate results
- [ ] Update application code
- [ ] Test all functionality
- [ ] Monitor for issues
- [ ] Document completion
