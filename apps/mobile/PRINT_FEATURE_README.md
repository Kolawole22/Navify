# Address Card Print Feature

This feature allows users to print or share address cards in a format similar to the physical address cards shown in the reference image.

## Features

### 1. Print Preview

- **AddressPrintPreview Component**: Displays a preview of how the address card will look when printed
- **Real-time Preview**: Shows the card exactly as it will appear in the final output
- **Responsive Design**: Adapts to different screen sizes

### 2. Print Functionality

- **Direct Printing**: Print address cards directly to connected printers
- **PDF Generation**: Create PDF files for sharing or later printing
- **Cross-platform Support**: Works on iOS, Android, and Web

### 3. Customization Options

- **Branding**: Customize company/brand names and logos
- **Content Control**: Toggle QR codes, coordinates, and other elements
- **Layout Options**: Choose card size and orientation
- **Print Settings Modal**: Easy access to all customization options

## Components

### AddressPrintPreview

Located at: `components/AddressPrintPreview.tsx`

**Props:**

```typescript
interface AddressPrintPreviewProps {
  address: Address; // Full address object from the database
  showPreview?: boolean; // Whether to show preview styling
}
```

**Features:**

- Yellow background with black text (matching reference design)
- Left black strip with address codes
- QR code generation
- Responsive layout
- Shadow effects for depth

### PrintSettingsModal

Located at: `components/PrintSettingsModal.tsx`

**Settings Available:**

- **Branding**: Show/hide and customize branding
- **Content**: Toggle QR codes and coordinates
- **Layout**: Card size (small/medium/large) and orientation (portrait/landscape)

### PrintService

Located at: `services/printService.ts`

**Methods:**

- `printAddressCard(address)`: Print directly to printer
- `shareAddressCardAsPDF(address)`: Generate and share PDF

## Usage

### Basic Implementation

```typescript
import { PrintService } from "@/services/printService";
import AddressPrintPreview from "@/components/AddressPrintPreview";

// Display preview
<AddressPrintPreview address={addressData} />;

// Print address card
await PrintService.printAddressCard(addressData);

// Share as PDF
await PrintService.shareAddressCardAsPDF(addressData);
```

### Integration with Address Detail Screen

The address detail screen now includes:

1. **Print Preview Section**: Shows how the card will look
2. **Print Actions**: Print and Share PDF buttons
3. **Settings Button**: Opens customization modal
4. **Real-time Updates**: Preview updates based on settings

## Data Structure

The print feature expects an `Address` object with the following structure:

```typescript
interface Address {
  id: number;
  userId: string;
  hhgCode: string;
  areaCode: string;
  areaType: string;
  locationNumber: string;
  houseNumber: string;
  city: string;
  street: string;
  stateCode: string;
  lgaCode: string;
  estate: string;
  floor: number;
  landmark: string;
  specialDescription: string;
  category: string;
  photoUrls: string[];
  isSaved: boolean;
  label: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}
```

## Dependencies

### Mobile App

The following packages are required:

```json
{
  "expo-print": "~14.1.4",
  "expo-sharing": "~13.1.5"
}
```

### Backend Server

The following packages are required:

```json
{
  "qrcode": "^1.5.4",
  "@types/qrcode": "^1.5.5"
}
```

## Customization

### Branding

- Replace "Google Play", "zippr", "ng@zippr.co" with your own branding
- Customize colors and fonts
- Add company logos

### Layout

- Adjust card dimensions
- Change color scheme
- Modify spacing and typography

### Content

- Add/remove fields
- Customize field labels
- Include additional information

## Future Enhancements

1. **Template System**: Multiple card designs and layouts
2. **Batch Printing**: Print multiple addresses at once
3. **Advanced Branding**: Logo uploads and custom fonts
4. **Print History**: Track printed addresses
5. **Export Options**: Additional formats (PNG, SVG, etc.)

## Troubleshooting

### Common Issues

1. **Print Not Working**: Check printer connectivity and permissions
2. **PDF Generation Fails**: Ensure sufficient storage space
3. **QR Code Not Displaying**: Verify react-native-qrcode-svg installation
4. **Styling Issues**: Check Tailwind CSS configuration

### Platform-Specific Notes

- **iOS**: Uses AirPrint for printing
- **Android**: Opens system print dialog
- **Web**: Opens print dialog in new tab

## Contributing

When adding new features:

1. Follow the existing component structure
2. Maintain TypeScript interfaces
3. Add proper error handling
4. Include accessibility features
5. Test on multiple platforms
