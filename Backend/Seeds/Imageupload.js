const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dnkd2ksye",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
// Utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const uploadWithRetry = async (filePath, options, retries = 3, baseDelay = 1000) => {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < retries) {
    try {
      // Verify file exists before attempting upload
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const result = await cloudinary.uploader.upload(filePath, options);
      console.log(`Successfully uploaded ${filePath}`);
      return result;
    } catch (error) {
      attempt++;
      lastError = error;
      const waitTime = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.error(`Error uploading ${path.basename(filePath)} (Attempt ${attempt}/${retries}): ${error.message}`);
      
      if (attempt < retries) {
        console.log(`Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError || new Error(`Failed to upload ${filePath} after ${retries} attempts`);
};

async function uploadImagesFromFolder(folderPath, cloudinaryFolder = "") {
  try {
    // Resolve the full path to avoid relative path issues
    const fullFolderPath = path.resolve(folderPath);
    console.log(`Reading images from: ${fullFolderPath}`);
    
    if (!fs.existsSync(fullFolderPath)) {
      throw new Error(`Folder not found: ${fullFolderPath}`);
    }

    const files = fs.readdirSync(fullFolderPath);
    const imageFiles = files.filter(file => 
      ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())
    );

    if (imageFiles.length === 0) {
      console.warn("No image files found in the specified folder");
      return [];
    }

    console.log(`Found ${imageFiles.length} images to upload`);

    const results = [];
    for (const [index, file] of imageFiles.entries()) {
      try {
        if (index > 0) await delay(1000); // Increased delay between uploads
        
        const filePath = path.join(fullFolderPath, file);
        console.log(`Processing ${index + 1}/${imageFiles.length}: ${file}`);
        
        const result = await uploadWithRetry(filePath, {
          folder: cloudinaryFolder,
          public_id: path.parse(file).name,
          resource_type: "auto",
          timeout: 60000 // 60 second timeout
        });
        
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error.message);
        // Continue with next file even if one fails
      }
    }

    return results.sort((a, b) => a.public_id.localeCompare(b.public_id));
  } catch (error) {
    console.error("Error in uploadImagesFromFolder:", error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Use absolute path to avoid relative path issues
    const localFolderPath = path.join(__dirname, "../images");
    const cloudinaryFolderName = "ecommerce";

    console.log("Starting image upload process...");
    const uploadedImages = await uploadImagesFromFolder(localFolderPath, cloudinaryFolderName);

    console.log("\nUpload summary:");
    console.log(`Successfully uploaded ${uploadedImages.length} images`);
    uploadedImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.public_id} - ${img.secure_url}`);
    });
  } catch (error) {
    console.error("Fatal error in main process:", error);
    process.exit(1);
  }
})();