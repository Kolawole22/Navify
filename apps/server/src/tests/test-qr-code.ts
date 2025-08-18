// import QRCode from "qrcode";
// import fs from "fs";
// import path from "path";

// async function testQRCodeGeneration() {
//   try {
//     console.log("🧪 Testing QR Code Generation...");

//     const testData = "KWLR-TNK-214-180";
//     const outputPath = path.join(__dirname, "test-qr-code.png");

//     // Generate QR code as PNG buffer
//     const qrCodeBuffer = await QRCode.toBuffer(testData, {
//       type: "image/png",
//       width: 200,
//       margin: 2,
//       color: {
//         dark: "#000000",
//         light: "#FFFFFF",
//       },
//       errorCorrectionLevel: "M",
//     });

//     // Save to file for verification
//     fs.writeFileSync(outputPath, qrCodeBuffer);

//     console.log("✅ QR Code generated successfully!");
//     console.log(`📁 Saved to: ${outputPath}`);
//     console.log(`📊 Buffer size: ${qrCodeBuffer.length} bytes`);
//     console.log(`🔢 Data encoded: ${testData}`);

//     // Verify the file was created
//     if (fs.existsSync(outputPath)) {
//       const stats = fs.statSync(outputPath);
//       console.log(`📏 File size: ${stats.size} bytes`);
//     }
//   } catch (error) {
//     console.error("❌ Error generating QR code:", error);
//   }
// }

// // Run the test
// testQRCodeGeneration();
