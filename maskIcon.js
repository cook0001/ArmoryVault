const Jimp = require('jimp');

async function processIcon() {
  try {
    const image = await Jimp.read('/Users/danielc/.gemini/antigravity-ide/brain/79e2ad4a-50fb-4231-8a7d-1c7e700f9e0e/armoryvault_dock_icon_1786703640121.jpg');
    image.resize(1024, 1024);
    
    // Create a fully black mask (which maps to transparent alpha)
    const mask = new Jimp(1024, 1024, 0x000000FF); 
    const r = 230; // standard macOS squircle corner radius approx 22.5%
    
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        let dx = 0;
        let dy = 0;
        
        // Calculate distance from corner centers
        if (x < r) dx = r - x;
        else if (x >= 1024 - r) dx = x - (1024 - r) + 1;
        
        if (y < r) dy = r - y;
        else if (y >= 1024 - r) dy = y - (1024 - r) + 1;
        
        // If inside the radius, or inside the main rect, paint white (opaque)
        if (dx * dx + dy * dy <= r * r) {
          mask.setPixelColor(0xFFFFFFFF, x, y);
        }
      }
    }
    
    // Apply the mask to the image
    image.mask(mask, 0, 0);
    
    // Write out the transparent PNG
    await image.writeAsync('/Users/danielc/Documents/Firearm_Inventory_software/build/icon.png');
    console.log("Icon perfectly masked with transparent corners and saved!");
  } catch (err) {
    console.error("Error processing icon:", err);
  }
}

processIcon();
