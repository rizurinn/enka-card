import { generateCard, createClient } from '../dist/index.js';

// Example usage
async function main() {
    try {
        console.log('🎮 Fetching Genshin Impact player data...\n');
        
        // Create Enka client
        const enka = createClient({ 
            defaultLanguage: "en",
            showFetchCacheLog: false 
        });
        
        // Fetch user data (replace with your UID)
        const UID = 886567006;
        const user = await enka.fetchUser(UID);
        
        console.log(`Player: ${user.nickname}`);
        console.log(`Total Characters: ${user.characters.length}\n`);
        
        // Generate card for first character
        for (let i = 0; i < user.characters.length; i++) {
            const char = user.characters[i];
            const charName = char.characterData.name.get();
        
            console.log(`[${i + 1}/${user.characters.length}] Generating ${charName}...`);
        
            await generateCard(user, char, {
                saveToFile: true,
                outputDir: 'output'
            });
        }
        
        console.log(`✨ Card generated successfully!`);
        console.log(`📦 Buffer size: ${(buffer.length / 1024).toFixed(2)} KB\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.stack);
        process.exit(1);
    }
}

main();
