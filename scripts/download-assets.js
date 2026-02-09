import { EnkaClient } from "enka-network-api";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔄 Downloading Enka Network assets...\n');
console.log('This is a one-time process and may take a few moments.\n');

try {
    const enka = new EnkaClient({ 
        showFetchCacheLog: true,
        defaultLanguage: "en"
    });
    
    // Download all cached assets
    await enka.cachedAssetsManager.fetchAllContents();
    
    // Create attributes directory if it doesn't exist
    const attributesDir = join(__dirname, '..', 'attributes');
    
    try {
        await fs.access(attributesDir);
    } catch {
        console.log('\n📁 Creating attributes directory...');
        await fs.mkdir(attributesDir, { recursive: true });
    }
    
    console.log('\n✅ Assets downloaded successfully!');
    console.log('📦 enka-card is ready to use.\n');
    
} catch (error) {
    console.error('\n❌ Error downloading assets:', error.message);
    console.error('\nPlease make sure you have a stable internet connection.');
    console.error('You can manually run: node scripts/download-assets.js\n');
    process.exit(1);
}