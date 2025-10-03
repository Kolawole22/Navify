# Simplified HHG Format Migration Guide

This guide explains the migration from the old HHG format to the new simplified format.

## Format Changes

### Old Format

```
NG-XX-YY-ZZZ-GG-HHHH-NNNN
```

- **XX**: State code
- **YY**: LGA code
- **ZZZ**: Area identifier
- **GG**: Grid code (2 characters, base-36 encoded)
- **HHHH**: House number (4 digits, padded with zeros)
- **NNNN**: Location number

### New Simplified Format

```
NG-XX-YY-ZZZ-HHHH-NNNN
```

- **XX**: State code
- **YY**: LGA code
- **ZZZ**: Area identifier
- **HHHH**: Street number (1-5 digits, no padding, 0 if not provided)
- **NNNN**: Location number

## Key Improvements

1. **Shorter codes**: Removed redundant grid code component
2. **Flexible street numbers**: 1-5 digits instead of fixed 4 digits
3. **Cleaner format**: No unnecessary padding
4. **More intuitive**: Street number is directly visible and meaningful

## Migration Scripts

### 1. Update Addresses Script

```bash
# Run the main migration script
npx tsx src/scripts/update-addresses-to-simplified-format.ts
```

**What it does:**

- Fetches all existing addresses
- Generates new HHG codes using the simplified format
- Updates addresses in the database
- Removes grid_code values (sets to NULL)
- Provides detailed progress and error reporting

### 2. Analysis Script

```bash
# Analyze current address formats
npx tsx src/scripts/rollback-simplified-format.ts
```

**What it does:**

- Shows format distribution (old vs new)
- Displays examples of each format
- Shows recently updated addresses
- Analyzes grid_code usage
- Provides rollback recommendations

### 3. Database Migration

```bash
# Apply database schema changes
npx drizzle-kit push
```

**What it does:**

- Removes the grid_code column from addresses table
- Drops the grid_code index
- Updates table comments

## Migration Process

### Step 1: Backup Database

```bash
# Create a backup before migration
pg_dump your_database > backup_before_simplified_format.sql
```

### Step 2: Analyze Current State

```bash
# Check current address formats
npx tsx src/scripts/rollback-simplified-format.ts
```

### Step 3: Run Migration

```bash
# Update all addresses to new format
npx tsx src/scripts/update-addresses-to-simplified-format.ts
```

### Step 4: Apply Database Changes

```bash
# Remove grid_code column
npx drizzle-kit push
```

### Step 5: Verify Migration

```bash
# Verify all addresses are in new format
npx tsx src/scripts/rollback-simplified-format.ts
```

## Example Transformations

| Old Format                   | New Format                | Change                                   |
| ---------------------------- | ------------------------- | ---------------------------------------- |
| `NG-LA-01-WAY-A1-0042-4242`  | `NG-LA-01-WAY-42-4242`    | Removed grid code, flexible house number |
| `NG-LA-01-WAY-B2-0007-4242`  | `NG-LA-01-WAY-7-4242`     | Removed grid code, no padding            |
| `NG-LA-01-WAY-C3-0000-4242`  | `NG-LA-01-WAY-0-4242`     | Removed grid code, 0 for no house number |
| `NG-LA-01-WAY-D4-12345-4242` | `NG-LA-01-WAY-12345-4242` | Removed grid code, 5-digit house number  |

## Rollback Plan

If you need to rollback:

1. **Restore from backup** (recommended):

   ```bash
   psql your_database < backup_before_simplified_format.sql
   ```

2. **Manual rollback** (if no backup):
   - Restore old addressing logic
   - Regenerate addresses with old format
   - Update database schema

## Monitoring

After migration, monitor:

1. **Address generation**: Ensure new addresses use simplified format
2. **API responses**: Verify HHG codes are in new format
3. **Database queries**: Check for any references to grid_code
4. **Client applications**: Update any hardcoded format expectations

## Troubleshooting

### Common Issues

1. **Address generation fails**:

   - Check coordinates are valid
   - Verify state/LGA codes exist
   - Check database connectivity

2. **Format validation errors**:

   - Ensure regex patterns are updated
   - Check for mixed formats in database

3. **Performance issues**:
   - Monitor database during bulk updates
   - Consider running migration in batches

### Support

If you encounter issues:

1. Check the migration logs
2. Run the analysis script to understand current state
3. Verify database schema changes
4. Test with a small subset of addresses first

## Files Modified

- `src/utils/addressing.ts` - Updated HHG generation logic
- `src/utils/addressing-enhanced.ts` - Updated enhanced addressing logic
- `src/scripts/update-addresses-to-simplified-format.ts` - Migration script
- `src/scripts/rollback-simplified-format.ts` - Analysis script
- `drizzle/0011_remove_grid_code_column.sql` - Database migration
- `SIMPLIFIED_FORMAT_MIGRATION.md` - This guide
