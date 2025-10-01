const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// S3 Cloud Vietnam Configuration from .env
const S3_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_S3_BUCKET,
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION
};

console.log('🔧 S3 Configuration:');
console.log(`📦 Bucket: ${S3_CONFIG.bucket}`);
console.log(`🌐 Endpoint: ${S3_CONFIG.endpoint}`);
console.log(`🗺️ Region: ${S3_CONFIG.region}`);
console.log(`🔑 Access Key: ${S3_CONFIG.accessKeyId?.substring(0, 8)}...`);

// Create S3 client
const s3Client = new S3Client({
  region: S3_CONFIG.region,
  endpoint: S3_CONFIG.endpoint,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey
  },
  forcePathStyle: true
});

async function testUpload() {
  try {
    console.log('\n🔧 Testing S3 Cloud Vietnam upload...');

    // Read the test image
    const imageBuffer = fs.readFileSync('/tmp/test-medical-image.jpg');
    console.log(`📁 Image size: ${imageBuffer.length} bytes`);

    // Generate filename
    const timestamp = Date.now();
    const fileName = `test-uploads/${timestamp}-medical-test.jpg`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileName,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    });

    console.log('🚀 Uploading to S3 Cloud Vietnam...');
    const response = await s3Client.send(command);

    if (response.$metadata.httpStatusCode === 200) {
      const publicUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${fileName}`;
      console.log('✅ Upload successful!');
      console.log(`📍 Public URL: ${publicUrl}`);
      console.log(`🔗 Direct link: ${publicUrl}`);

      // Test if URL is accessible
      console.log('\n🔍 Testing URL accessibility...');
      const fetch = require('node-fetch');
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log(`✅ URL accessible! Status: ${testResponse.status}`);
        console.log(`📊 Content Length: ${testResponse.headers.get('content-length')} bytes`);
        console.log(`📂 Content Type: ${testResponse.headers.get('content-type')}`);
      } catch (error) {
        console.log(`❌ URL not accessible: ${error.message}`);
      }
    } else {
      console.log(`❌ Upload failed with status: ${response.$metadata.httpStatusCode}`);
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);

    if (error.name === 'NoSuchBucket') {
      console.log('💡 Bucket "medical" does not exist');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 Access denied - check credentials');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Cannot connect to S3 Cloud Vietnam endpoint');
    }
  }
}

testUpload();