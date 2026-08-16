const sharp = require('sharp');

async function processIcon() {
  try {
    const r = 230; // standard macOS squircle corner radius approx 22.5%
    const maskSvg = Buffer.from(
      `<svg><rect x="0" y="0" width="1024" height="1024" rx="${r}" ry="${r}" fill="white" /></svg>`
    );

    await sharp('/Users/danielc/.gemini/antigravity-ide/brain/79e2ad4a-50fb-4231-8a7d-1c7e700f9e0e/armoryvault_dock_icon_1786703640121.jpg')
      .resize(1024, 1024)
      .composite([{
        input: maskSvg,
        blend: 'dest-in'
      }])
      .png()
      .toFile('/Users/danielc/Documents/Firearm_Inventory_software/build/icon.png');

    console.log("Icon perfectly masked with transparent corners and saved!");
  } catch (err) {
    console.error("Error processing icon:", err);
  }
}

processIcon();
