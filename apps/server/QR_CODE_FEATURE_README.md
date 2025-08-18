# QR Code Feature Implementation

This document describes the implementation of automatic QR code generation for addresses in the Navify backend.

## Overview

Every address now automatically gets a QR code generated and stored when it's created. The QR code contains the address's HHG code and is stored as a PNG image file.

## Architecture

### Database Changes

- **New Field**: `qr_code_image_url` in the `addresses` table
- **Migration**: `0007_add_qr_code_to_addresses.sql`

### Components

1. **QRCodeService** (`src/services/qrCodeService.ts`)

   - Generates QR codes using the `qrcode` library
   - Saves PNG files to `public/qr-codes/` directory
   - Manages file cleanup when addresses are deleted

2. **Address Controller Updates**

   - `createAddress`: Generates QR code during address creation
   - `deleteAddress`: Cleans up QR code files when addresses are deleted

3. **Static File Serving**
   - QR code images are served from `/qr-codes/` endpoint
   - Files are stored in `public/qr-codes/` directory

## File Structure

```
apps/server/
├── public/
│   └── qr-codes/          # Generated QR code images
├── src/
│   ├── services/
│   │   └── qrCodeService.ts
│   ├── controllers/
│   │   └── address.controller.ts
│   └── scripts/
│       └── generate-qr-codes-for-existing-addresses.ts
└── drizzle/
    └── 0007_add_qr_code_to_addresses.sql
```

## Usage

### Automatic Generation

QR codes are automatically generated when:

- A new address is created via `POST /api/addresses`
- The QR code URL is stored in the `qrCodeImageUrl` field

### Manual Generation for Existing Addresses

To generate QR codes for existing addresses:

```bash
cd apps/server
yarn generate:qr-codes
```

### File Cleanup

QR code files are automatically cleaned up when:

- An address is deleted via `DELETE /api/addresses/:id`
- The `QRCodeService.deleteQRCode()` method is called

## Configuration

### Environment Variables

- `BASE_URL`: Base URL for generating QR code URLs (defaults to `http://localhost:3000`)

### QR Code Settings

- **Format**: PNG
- **Size**: 200x200 pixels
- **Margin**: 2 pixels
- **Colors**: Black on white
- **Error Correction**: Medium level

## API Endpoints

### QR Code Images

- **URL**: `/qr-codes/{filename}`
- **Method**: GET
- **Response**: PNG image file

### Address Creation (Updated)

- **URL**: `POST /api/addresses`
- **Response**: Address object now includes `qrCodeImageUrl` field

## Error Handling

- QR code generation failures don't prevent address creation
- File cleanup failures don't prevent address deletion
- All errors are logged for debugging

## Performance Considerations

- QR codes are generated asynchronously during address creation
- Files are stored on disk for fast access
- Static file serving is optimized for image delivery

## Security

- QR codes are stored in a public directory
- No sensitive information is encoded in QR codes
- File access is controlled by the web server

## Future Enhancements

1. **QR Code Customization**

   - Branding options
   - Color schemes
   - Size variations

2. **Batch Operations**

   - Bulk QR code generation
   - QR code regeneration for existing addresses

3. **Storage Options**
   - Cloud storage integration
   - CDN support
   - Database storage for small QR codes

## Troubleshooting

### Common Issues

1. **QR Code Not Generated**

   - Check if `qrcode` package is installed
   - Verify `public/qr-codes/` directory exists
   - Check server logs for errors

2. **QR Code Not Accessible**

   - Verify static file serving is configured
   - Check file permissions on `public/qr-codes/` directory
   - Ensure `BASE_URL` environment variable is set correctly

3. **File Cleanup Fails**
   - Check file permissions
   - Verify file paths are correct
   - Check server logs for cleanup errors

### Debugging

Enable detailed logging by checking:

- Server console output
- Database queries
- File system operations
- Static file serving configuration
