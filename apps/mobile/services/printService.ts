import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { Address } from "./addressService";

export class PrintService {
  static async printAddressCard(address: Address): Promise<void> {
    try {
      const htmlContent = this.generateHTML(address);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (Platform.OS === "web") {
        // For web, open in new tab
        window.open(uri, "_blank");
      } else {
        // For mobile, share the PDF
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Print Address Card",
        });
      }
    } catch (error) {
      console.error("Error printing address card:", error);
      throw new Error("Failed to print address card");
    }
  }

  static async shareAddressCardAsPDF(address: Address): Promise<void> {
    try {
      const htmlContent = this.generateHTML(address);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Address Card",
      });
    } catch (error) {
      console.error("Error sharing address card:", error);
      throw new Error("Failed to share address card");
    }
  }

  private static getQRCodeURL(address: Address): string {
    // Use stored QR code URL or fallback to backend generation
    if (address.qrCodeImageUrl) {
      return address.qrCodeImageUrl;
    }
    // Fallback to backend generation if no stored URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    return `${baseUrl}/api/qr-code/${encodeURIComponent(address.hhgCode)}`;
  }

  private static generateHTML(address: Address): string {
    // Use the actual address data from the database
    const areaCode = address.areaCode || "KWLR";
    const areaType = address.areaType || "TNK";
    const locationNumber = address.locationNumber || "214";
    const houseNumber = address.houseNumber || "180";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Address Card - ${address.hhgCode}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .card-container {
              display: flex;
              max-width: 400px;
              margin: 0 auto;
              background-color: #FFD700;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .black-strip {
              width: 60px;
              background-color: #000;
              padding: 20px 0;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
            }
            .black-strip-text {
              color: #FFD700;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              writing-mode: vertical-rl;
              text-orientation: mixed;
            }
            .yellow-content {
              flex: 1;
              padding: 20px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .branding-section {
              flex: 1;
            }
            .branding-text {
              color: #000;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .qr-code {
              width: 80px;
              height: 80px;
              background-color: #fff;
              border: 2px solid #000;
              border-radius: 4px;
              object-fit: contain;
            }
            .address-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin: 20px 0;
            }
            .address-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .label {
              color: #000;
              font-size: 14px;
              font-weight: bold;
              flex: 1;
            }
            .value {
              color: #000;
              font-size: 14px;
              font-weight: 500;
              flex: 1;
              text-align: right;
            }
            .large-number-container {
              text-align: center;
              margin-top: 20px;
            }
            .large-number {
              color: #000;
              font-size: 72px;
              font-weight: bold;
            }
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              .card-container {
                box-shadow: none;
                border: 1px solid #ccc;
              }
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div class="black-strip">
              <div class="black-strip-text">${areaCode}</div>
              <div class="black-strip-text">${areaType}</div>
              <div class="black-strip-text">${locationNumber}</div>
              <div class="black-strip-text">${houseNumber}</div>
            </div>
            
            <div class="yellow-content">
              <div class="header-section">
                <div class="branding-section">
                  <div class="branding-text">Google Play</div>
                  <div class="branding-text">zippr</div>
                  <div class="branding-text">ng@zippr.co</div>
                  <div class="branding-text">Tanke Ajanaku North</div>
                </div>
                
                <img src="${this.getQRCodeURL(address)}" alt="QR Code for ${
      address.hhgCode
    }" class="qr-code" />
              </div>

              <div class="address-section">
                <div class="address-row">
                  <div class="label">CITY</div>
                  <div class="value">${address.city || "Ilu"}</div>
                </div>
                <div class="address-row">
                  <div class="label">AREA</div>
                  <div class="value">${
                    address.estate || address.landmark || "Agbègbè"
                  }</div>
                </div>
                <div class="address-row">
                  <div class="label">STREET No.</div>
                  <div class="value">${address.street || "Nómbà ita"}</div>
                </div>
                <div class="address-row">
                  <div="label">HOUSE No.</div>
                  <div class="value">${
                    address.houseNumber || "Nómbà iléègbé"
                  }</div>
                </div>
              </div>

              <div class="large-number-container">
                <div class="large-number">${houseNumber}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
