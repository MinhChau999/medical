const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import the upload service
const { s3LiteService } = require('./dist/services/s3lite.service');

async function testUploadService() {
  try {
    console.log('🔧 Testing S3LiteService upload...');

    // Read the test image
    const imageBuffer = fs.readFileSync('/tmp/test-medical-image.jpg');
    console.log(`📁 Image size: ${imageBuffer.length} bytes`);

    // Test product image upload
    console.log('🚀 Uploading product image...');
    const url = await s3LiteService.uploadImage(imageBuffer, 'test-medical-product.jpg', 'product');

    console.log('✅ Upload successful via S3LiteService!');
    console.log(`📍 Public URL: ${url}`);
    console.log(`🔗 Direct link: ${url}`);

    // Test URL accessibility
    console.log('\n🔍 Testing URL with curl...');
    const { exec } = require('child_process');
    exec(`curl -I "${url}"`, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ URL test failed: ${error.message}`);
      } else {
        console.log('✅ URL accessible!');
        console.log(stdout);
      }
    });

  } catch (error) {
    console.error('❌ Upload service test failed:', error);
  }
}

testUploadService();