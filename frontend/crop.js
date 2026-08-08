const Jimp = require("jimp");

Jimp.read("public/logo.png")
  .then((image) => {
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    // We want to remove the bottom text. Let's crop the top 65%.
    const newH = Math.floor(h * 0.65);
    
    console.log(`Cropping logo from ${w}x${h} to ${w}x${newH}`);
    
    image.crop(0, 0, w, newH)
         .write("public/logo.png", () => {
             console.log("Successfully cropped logo.png!");
         });
  })
  .catch((err) => {
    console.error("Error cropping image:", err);
  });
