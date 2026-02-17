# Enka Network Card Generation (Javascript-Based)

<img src="https://i.ibb.co.com/SX1S0SC3/nefer.png" width="100%"><br>

Generate beautiful character cards from Genshin Impact player data using Enka Network API.



## ✨ Features

- 🎮 **Automatic Data Fetching** - Fetches character data from Enka Network API
- 🖼️ **Beautiful Card Design** - Generates professional-looking character cards
- 📊 **Complete Stats** - Shows all character stats, weapons, talents, and artifacts
- 🎯 **Easy to Use** - Simple API with minimal configuration
- 🚀 **Fast** - Optimized canvas rendering
- 📦 **Zero Config** - Assets download automatically on install

## 📦 Installation

```bash
npm install enka-card@github:rizurinn/enka-card
```

During installation, required assets will be downloaded automatically. This is a one-time process.

## 🚀 Quick Start

```javascript
import { generateCard, createClient } from 'enka-card';

// Create Enka client
const enka = createClient({ defaultLanguage: "en" });

// Fetch user data
const user = await enka.fetchUser(YOUR_UID);

// Generate card for first character
const character = user.characters[0];
const buffer = await generateCard(user, character, {
    saveToFile: true,
    outputDir: 'output'
});

console.log('Card generated!');
```

## 📖 API Documentation

### `generateCard(user, character, options?)`

Generate a character card image.

**Parameters:**
- `user` - User data from `EnkaClient.fetchUser()`
- `character` - Character data from `user.characters` array
- `options` (optional)
  - `saveToFile` - Whether to save to file (default: `false`)
  - `outputDir` - Output directory (default: `'output'`)

**Returns:** `Promise<Buffer>` - PNG image buffer

**Example:**
```javascript
const buffer = await generateCard(user, character);
// Returns Buffer that can be used with Discord.js, Telegram Bot, etc.
```

### `createClient(options?)`

Create an EnkaClient instance.

**Parameters:**
- `options` (optional) - EnkaClient configuration
  - `defaultLanguage` - Language code (default: `"en"`)
  - `showFetchCacheLog` - Show cache logs (default: `false`)

**Returns:** `EnkaClient` instance

**Example:**
```javascript
const enka = createClient({ 
    defaultLanguage: "jp",
    showFetchCacheLog: true 
});
```

## 🎯 Usage Examples

### Generate Cards for All Characters

```javascript
import { generateCard, createClient } from 'enka-card';

const enka = createClient();
const user = await enka.fetchUser(YOUR_UID);

for (const character of user.characters) {
    await generateCard(user, character, {
        saveToFile: true,
        outputDir: 'cards'
    });
}
```

### Custom Output Directory

```javascript
const buffer = await generateCard(user, character, {
    saveToFile: true,
    outputDir: './my-cards'
});
```

## 🔧 Advanced Configuration

### Export Constants

```javascript
import { 
    ELEMENT_COLORS,
    RARITY_COLORS,
    STAT_FILE_MAP 
} from 'enka-card';

console.log(ELEMENT_COLORS.Fire); // { r: 186, g: 140, b: 131 }
```

### Supported Languages

The package supports all languages available in Enka Network API:
- `en` - English
- `jp` - Japanese
- `zh-CN` - Chinese (Simplified)
- `zh-TW` - Chinese (Traditional)
- `de` - German
- `es` - Spanish
- `fr` - French
- `id` - Indonesian
- `ko` - Korean
- `pt` - Portuguese
- `ru` - Russian
- `th` - Thai
- `vi` - Vietnamese

## ⚙️ Requirements

- Node.js >= 18.0.0
- Internet connection (for first-time asset download)

## 🐛 Troubleshooting

### Assets Not Found

If you get "asset not found" errors, manually run:

```bash
node node_modules/enka-card/scripts/download-assets.js
```

### Canvas Errors

Make sure you have the required system dependencies for `@napi-rs/canvas`:

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**macOS:**
```bash
brew install cairo pango
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

- [Enka Network](https://enka.network/) - For providing the API
- [enka-network-api](https://github.com/yuko1101/enka-network-api) - Node.js wrapper for Enka API
- [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) - Canvas implementation