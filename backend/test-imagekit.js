const ImageKit = require('imagekit');
require('dotenv').config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function testUpload() {
    console.log('Testing ImageKit upload...');
    console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
    console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);
    
    try {
        // استخدام صورة تجريبية صغيرة جداً (Base64 من نقطة حمراء)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const result = await imagekit.upload({
            file: testImage,
            fileName: 'test.png',
            useUniqueFileName: true
        });
        
        console.log('✅ Upload successful!');
        console.log('URL:', result.url);
    } catch (error) {
        console.error('❌ Upload failed:', error);
        console.error('Error details:', error.message);
    }
}

testUpload();