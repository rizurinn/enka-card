import { EnkaClient } from 'enka-network-api';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CONFIGURATION ---
const FONT_FAMILY = 'Genshin';

// Register font on module load
try {
    const fontPath = join(__dirname, '..', 'attributes', 'Fonts', 'JA-JP.TTF');
    GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
} catch (error) {
    console.warn('⚠️  Warning: Genshin font not found. Please ensure attributes/Fonts/JA-JP.TTF exists.');
}

const ELEMENT_COLORS = {
    Fire: { r: 186, g: 140, b: 131 },
    Water: { r: 132, g: 161, b: 198 },
    Grass: { r: 45, g: 142, b: 52 },
    Electric: { r: 152, g: 118, b: 173 },
    Wind: { r: 82, g: 176, b: 177 },
    Ice: { r: 70, g: 168, b: 186 },
    Rock: { r: 187, g: 159, b: 75 },
    Physical: { r: 255, g: 255, b: 255 }
};

const RARITY_COLORS = {
    1: "200, 200, 200", // Putih/Abu
    2: "110, 190, 100", // Hijau
    3: "80, 150, 220",  // Biru
    4: "165, 110, 210", // Ungu
    5: "245, 185, 65"   // Emas/Kuning
};

const ELEMENT_PROP_MAP = {
    "Fire": "FIGHT_PROP_FIRE_ADD_HURT",
    "Water": "FIGHT_PROP_WATER_ADD_HURT",
    "Grass": "FIGHT_PROP_GRASS_ADD_HURT",
    "Electric": "FIGHT_PROP_ELEC_ADD_HURT",
    "Wind": "FIGHT_PROP_WIND_ADD_HURT",
    "Ice": "FIGHT_PROP_ICE_ADD_HURT",
    "Rock": "FIGHT_PROP_ROCK_ADD_HURT",
    "Physical": "FIGHT_PROP_PHYSICAL_ADD_HURT"
};

const SUBST_ORDER = [
    "FIGHT_PROP_CRITICAL",
    "FIGHT_PROP_CRITICAL_HURT",
    "FIGHT_PROP_ATTACK_PERCENT",
    "FIGHT_PROP_ATTACK",
    "FIGHT_PROP_DEFENSE_PERCENT",
    "FIGHT_PROP_DEFENSE",
    "FIGHT_PROP_HP_PERCENT",
    "FIGHT_PROP_HP",
    "FIGHT_PROP_ELEMENT_MASTERY",
    "FIGHT_PROP_CHARGE_EFFICIENCY",
];

const STAT_FILE_MAP = {
    "FIGHT_PROP_MAX_HP": "HP",
    "FIGHT_PROP_CUR_ATTACK": "ATTACK",
    "FIGHT_PROP_CUR_DEFENSE": "DEFENSE",
    "FIGHT_PROP_BASE_ATTACK": "ATTACK",
    "FIGHT_PROP_HP": "HP",
    "FIGHT_PROP_ATTACK": "ATTACK",
    "FIGHT_PROP_DEFENSE": "DEFENSE",
    "FIGHT_PROP_HP_PERCENT": "HP_PERCENT",
    "FIGHT_PROP_ATTACK_PERCENT": "ATTACK_PERCENT",
    "FIGHT_PROP_DEFENSE_PERCENT": "DEFENSE_PERCENT",
    "FIGHT_PROP_CRITICAL": "CRITICAL",
    "FIGHT_PROP_CRITICAL_HURT": "CRITICAL_HURT",
    "FIGHT_PROP_CHARGE_EFFICIENCY": "CHARGE_EFFICIENCY",
    "FIGHT_PROP_ELEMENT_MASTERY": "ELEMENT_MASTERY",
    "FIGHT_PROP_HEAL_ADD": "HEAL_ADD",
    "FIGHT_PROP_FIRE_ADD_HURT": "PYRO",
    "FIGHT_PROP_WATER_ADD_HURT": "HYDRO",
    "FIGHT_PROP_GRASS_ADD_HURT": "DENDRO",
    "FIGHT_PROP_ELEC_ADD_HURT": "ELECTRO",
    "FIGHT_PROP_WIND_ADD_HURT": "ANEMO",
    "FIGHT_PROP_ICE_ADD_HURT": "CRYO",
    "FIGHT_PROP_ROCK_ADD_HURT": "GEO",
    "FIGHT_PROP_PHYSICAL_ADD_HURT": "PHYSICAL_ADD_HURT"
};

const RARITY_REFERENCE = { 
    1: "ONE_STAR", 
    2: "TWO_STAR", 
    3: "THREE_STAR", 
    4: "FOUR_STAR", 
    5: "FIVE_STAR" 
};

// --- UTILITIES ---

function getAssetPath(relativePath) {
    return join(__dirname, '..', relativePath);
}

async function resolveImage(imgAssets) {
    try {
        if (!imgAssets) return null;
        const url = typeof imgAssets.getUrl === 'function' ? imgAssets.getUrl() : imgAssets;
        if (!url) return null;
        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        return await loadImage(buf);
    } catch {
        return null;
    }
}

function applyLumaMask(ctx, maskImage, x, y, width, height, invert = false) {
    const maskCanvas = createCanvas(width, height);
    const mCtx = maskCanvas.getContext('2d');
    mCtx.drawImage(maskImage, 0, 0, width, height);
    
    const imageData = mCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        
        let alpha;
        if (invert) {
            alpha = luma;
        } else {
            alpha = 255 - luma;
        }
        
        data[i + 3] = Math.max(0, Math.min(255, alpha));
    }
    
    mCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, x, y, width, height);
    ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius, fill = null, stroke = null) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawBrightenedImage(ctx, img, x, y, width, height, brightness = 1) {
    if (!img || img.width < 2) return;
    ctx.save();
    if (brightness !== 1) ctx.filter = `brightness(${brightness * 100}%)`;
    ctx.drawImage(img, x, y, width, height);
    ctx.restore();
}

function drawIconShade(ctx, x, y, width, height, colorRgb = "0, 0, 0") {
    const gradient = ctx.createLinearGradient(0, y + height, 0, y);
    gradient.addColorStop(0, `rgba(${colorRgb}, 0.9)`);
    gradient.addColorStop(0.6, `rgba(${colorRgb}, 0.3)`);
    gradient.addColorStop(1, `rgba(${colorRgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
}

function formatStatValue(value, propId) {
    const isPercent = propId.includes("PERCENT") || 
                      propId.includes("HURT") ||
                      propId.includes("EFFICIENCY") || 
                      propId === "FIGHT_PROP_CRITICAL";
    
    if (!isPercent && Number.isInteger(value)) return String(value);
    
    const valStr = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return isPercent ? `${valStr}%` : valStr;
}

// --- MAIN FUNCTION ---

/**
 * Generate character card from Enka Network data
 * @param {Object} user - User data from EnkaClient
 * @param {Object} character - Character data from user.characters
 * @param {Object} options - Optional configuration
 * @param {string} options.outputDir - Directory to save the card (default: 'output')
 * @param {boolean} options.saveToFile - Whether to save to file (default: false)
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function generateCard(user, character, options = {}) {
    const { outputDir = 'output', saveToFile = false } = options;
    
        // 1. Setup Canvas
    const baseBg = await loadImage(getAssetPath("attributes/Assets/default_enka_card.png"));
    const canvas = createCanvas(baseBg.width, baseBg.height);
    const ctx = canvas.getContext('2d');

    const elemName = character.characterData.element.id;
    const rgb = ELEMENT_COLORS[elemName] || ELEMENT_COLORS.Default;
    
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(baseBg, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // 2. Character Splash Art (With Luma MASK)
    const charImgUrl = character.costume.splashImage?.url || character.characterData?.splashImage?.url;
    const charArt = await resolveImage(charImgUrl);
    
    // Load Character Mask
    const charMask = await loadImage(getAssetPath("attributes/Assets/enka_character_mask.png"));

    if (charArt.width > 2) {
        // Setup skala & offset (tetap gunakan settingan Anda)
        const scale = 0.74; // Sesuaikan jika perlu (bawaan Enka biasanya sekitar 0.9 - 1.0 tergantung gacha art)
        const scaledW = charArt.width * scale;
        const scaledH = charArt.height * scale;
        
        // Offset standar Enka biasanya menggeser karakter ke kanan/tengah
        // Jika karakter "hilang setengah", coba mainkan offsetX ini.
        const offsetX = -470;
        const offsetY = -35;

        // Buat Temporary Canvas Seukuran KARTU UTAMA (penting!)
        const tempCanvas = createCanvas(canvas.width, canvas.height);
        const tCtx = tempCanvas.getContext('2d');
        
        // A. Gambar Karakter Dulu (Full Color)
        tCtx.drawImage(charArt, offsetX, offsetY, scaledW, scaledH);
        
        // B. Terapkan Masking
        if (charMask.width > 2) {
            // Kita panggil fungsi helper untuk mengubah Hitam->Transparan
            // Mask ditarik full satu layar (canvas.width, canvas.height)
            applyLumaMask(tCtx, charMask, -60, 0, canvas.width, canvas.height, false);
        }
        
        // C. Gambar Hasil (Karakter yang sudah di-mask) ke Canvas Utama
        ctx.drawImage(tempCanvas, 0, 0);
    }

    // Shadow Overlay
    const shadowImg = await loadImage(getAssetPath("attributes/Assets/enka_character_shade.png"));
    ctx.drawImage(shadowImg, 0, 0);

    // 3. User & Character Info
    const charName = character.characterData.name.get();
    
    ctx.font = `30px ${FONT_FAMILY}`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(charName, 38, 65); 
    const nameWidth = ctx.measureText(charName).width;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.moveTo(38 + nameWidth + 15, 53);
    ctx.lineTo(38 + nameWidth + 21, 53);
    ctx.lineTo(38 + nameWidth + 18, 48);
    ctx.fill();

    const nickname = user.nickname || "Traveler"; 
    ctx.font = `16px ${FONT_FAMILY}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillText(nickname, 38 + nameWidth + 35, 58);

    ctx.font = `23px ${FONT_FAMILY}`;
    ctx.fillStyle = 'white';
    ctx.fillText(`Lv. ${character.level}/`, 38, 100); 
    const lvWidth = ctx.measureText(`Lv. ${character.level}/`).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`${character.maxLevel}`, 38 + lvWidth, 100);

    let friendIcon = await loadImage(getAssetPath("attributes/UI/COMPANIONSHIP.png"));
    if (friendIcon.width < 2) friendIcon = await loadImage("https://enka.network/ui/UI_Icon_Companion.png");
    if (friendIcon.width > 2) ctx.drawImage(friendIcon, 34, 108, 45, 45); 
    
    ctx.font = `23px ${FONT_FAMILY}`;
    ctx.fillStyle = 'white';
    ctx.fillText(String(character.friendship || 1), 80, 138);

    const infoGap = 220; 
    const startY = infoGap + 345; 

    ctx.font = `18px ${FONT_FAMILY}`;
    ctx.fillStyle = 'white';
    ctx.fillText(`UID: ${user.uid}`, 38, startY);

    const wlText = `WL${user.worldLevel}`;
    const wlWidth = ctx.measureText(wlText).width;
    ctx.fillText(wlText, 38, startY + 25);
    
    const arText = `AR${user.level}`;
    const arWidth = ctx.measureText(arText).width;
    
    roundedRect(ctx, 38 + wlWidth + 8, startY + 25 - 18, arWidth + 10, 24, 3, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = 'rgb(245, 222, 179)'; 
    ctx.fillText(arText, 38 + wlWidth + 13, startY + 25);

    // 5. Constellations
    const cOverlay = await loadImage(getAssetPath("attributes/Assets/enka_constellation_overlay.png"));
    const lockIcon = await loadImage(getAssetPath("attributes/UI/LOCKED.png"));
    const constStartY = 160;
    
    if (character.characterData.constellations && character.characterData.constellations.length > 0) {
        for (let i = 0; i < character.characterData.constellations.length; i++) {
            const cons = character.characterData.constellations[i];
            const yPos = constStartY + (60 * i);

            ctx.drawImage(cOverlay, 25, yPos, 75, 75); 

            const icon = await resolveImage(cons.icon?.url);
            const isLocked = character.unlockedConstellations[i] ? false : true;

            const iconSize = 45;

            if (icon) {
               ctx.save();
               if (isLocked) ctx.globalAlpha = 0.4;
               ctx.drawImage(icon, 63 - iconSize/2, yPos + 15, iconSize, iconSize);
               ctx.restore();
               if (isLocked) ctx.drawImage(lockIcon, 63 - 10, yPos + 24, 20, 25);
            }
        }
    }

    // 6. Talents
    const talentOverlay = await loadImage(getAssetPath("attributes/Assets/enka_talent_overlay.png"));
    const skills = character.characterData.skills;

    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        const yBase = 305 + (90 * i);

        ctx.globalAlpha = 0.8;
        ctx.drawImage(talentOverlay, 430, yBase, 80, 80);
        ctx.globalAlpha = 1.0;

        const skIcon = await resolveImage(skill.icon?.url);
        ctx.drawImage(skIcon, 445, 320 + (90 * i), 50, 50);

        const level = character.skillLevels[i].level
        const lvl = level.base || 1;
        const isBoosted = (level.extra !== 0) ? true : false;
        const lvlStr = String(lvl);

        ctx.font = `20px ${FONT_FAMILY}`;
        const lvlW = ctx.measureText(lvlStr).width;
        
        const badgeColor = isBoosted ? 'rgb(79, 188, 212)' : 'rgba(50, 50, 50, 0.7)';
        roundedRect(ctx, 470 - lvlW/2 - 6, 382 + 90 * i - 15, lvlW + 12, 30, 15, badgeColor);
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lvlStr, 470, 382 + (90 * i));
    }

    // 7. Weapon (Stats Fixed)
    const weapon = character.weapon;
    if (weapon) {
        const wpIcon = await resolveImage(weapon.weaponData.icon.url);
        
        const wpRatio = wpIcon.height > 0 ? (128 / wpIcon.height) : 1;
        const wpW = wpIcon.width * wpRatio;
        ctx.drawImage(wpIcon, 555, 25, wpW, 128); 
        
        const rarityVal = weapon.weaponData.stars;
        const shadeColor = RARITY_COLORS[rarityVal] || "255, 255, 255";
        
        const shadeHeight = 25; 
        
        drawIconShade(ctx, 555, 25 + 128 - shadeHeight, wpW, shadeHeight, shadeColor);

        const starName = RARITY_REFERENCE[weapon.weaponData.stars];
        const rarityImg = await loadImage(getAssetPath(`attributes/UI/${starName}.png`));
        if (rarityImg.width > 1) {
            const rW = rarityImg.width * (25/rarityImg.height);
            ctx.drawImage(rarityImg, 620 - rW/2, 135, rW, 25);
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.font = `22px ${FONT_FAMILY}`;

        const wpName = weapon.weaponData.name.get();
        const maxNameWidth = 290; // Batas lebar sebelum menabrak Artifact
        let nameLines = [];

        // Algoritma Word Wrap Sederhana
        if (ctx.measureText(wpName).width <= maxNameWidth) {
            nameLines.push(wpName);
        } else {
            const words = wpName.split(' ');
            let currentLine = words[0];
            
            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + " " + words[i];
                if (ctx.measureText(testLine).width < maxNameWidth) {
                    currentLine = testLine;
                } else {
                    nameLines.push(currentLine);
                    currentLine = words[i];
                }
            }
            nameLines.push(currentLine);
        }

        // Gambar Nama Senjata (Support Multi-line)
        let nameY = 35;
        const lineHeight = 26; // Tinggi per baris
        
        nameLines.forEach((line) => {
            ctx.fillText(line, 690, nameY);
            nameY += lineHeight;
        });

        // --- DYNAMIC OFFSET FOR STATS ---
        // Jika 1 baris, offset = 0. Jika 2 baris, offset = lineHeight.
        // Base Y untuk stats adalah 60 (sesuai kode asli).
        const extraY = (nameLines.length - 1) * lineHeight;
        const statBaseY = 60 + extraY + 5; // +5 adalah buffer asli

        // 1. Base ATK Box
        const baseAtkStat = weapon.weaponStats[0]; 
        
        roundedRect(ctx, 690, statBaseY, 108, 35, 5, 'rgba(225,225,225,0.2)'); 

        const atkIcon = await loadImage(getAssetPath(`attributes/UI/ATTACK.png`));
        drawBrightenedImage(ctx, atkIcon, 695, statBaseY + 3, 30, 30, 2);

        ctx.fillStyle = 'white';
        ctx.font = `22px ${FONT_FAMILY}`;
        
        const baseAtkVal = baseAtkStat ? Math.round(baseAtkStat.value).toLocaleString() : "0";
        ctx.fillText(baseAtkVal, 735, statBaseY + 12); // +12 untuk centering text vertical

        if (weapon.weaponStats.length > 1) {
            const subStat = weapon.weaponStats[1];
            
            roundedRect(ctx, 690 + 120, statBaseY, 125, 35, 5, 'rgba(225,225,225,0.2)'); 

            const subIconName = STAT_FILE_MAP[subStat.fightProp];
            const finalSubIconName = subIconName || subStat.fightProp;
            const subIcon = await loadImage(getAssetPath(`attributes/UI/${finalSubIconName}.png`));
            
            drawBrightenedImage(ctx, subIcon, 690 + 130, statBaseY + 3, 30, 30, 2);

            const subStatVal = formatStatValue(subStat.getMultipliedValue(), subStat.fightProp);
            
            ctx.fillStyle = 'white';
            ctx.fillText(subStatVal, 690 + 165, statBaseY + 12);
        }

        // 3. Refinement & Level
        const refine = `R${weapon.refinementRank}`; 
        
        // Posisi Y untuk Refine/Level = statBaseY + 45 (jarak antar baris stat dan info bawah)
        const infoBaseY = statBaseY + 45;

        roundedRect(ctx, 690, infoBaseY, 50, 30, 5, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = 'rgb(245, 222, 179)';
        ctx.fillText(refine, 700, infoBaseY + 10);

        roundedRect(ctx, 750, infoBaseY, 125, 30, 5, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = 'white';
        ctx.fillText(`Lv. ${weapon.level}/`, 760, infoBaseY + 10);
        const lvWidth = ctx.measureText(`Lv. ${weapon.level}/`).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`${weapon.maxLevel}`, 760 + lvWidth, infoBaseY + 10);
    }

    // 8. Stats List
    const baseStats = [
        "FIGHT_PROP_MAX_HP", "FIGHT_PROP_CUR_ATTACK", "FIGHT_PROP_CUR_DEFENSE", 
        "FIGHT_PROP_ELEMENT_MASTERY", "FIGHT_PROP_CRITICAL", "FIGHT_PROP_CRITICAL_HURT", 
        "FIGHT_PROP_CHARGE_EFFICIENCY"
    ];
    
    const charElemId = character.element ? character.element.id : ""; 
    const elemPropId = ELEMENT_PROP_MAP[charElemId] || ELEMENT_PROP_MAP["Physical"];
    
    const allStats = character.stats.statProperties;
    const displayStats = [];
    
    baseStats.forEach(prop => {
        const s = allStats.find(x => x.fightProp === prop);
        if (s) displayStats.push(s);
    });

    const dmgBonuses = allStats.filter(x => (x.fightProp.includes("ADD_HURT")) && x.value > 0);
    let bestBonus = dmgBonuses.find(x => x.fightProp === elemPropId);
    if (!bestBonus && dmgBonuses.length > 0) bestBonus = dmgBonuses.sort((a,b) => b.value - a.value)[0];
    if (bestBonus) displayStats.push(bestBonus);

    const finalStats = displayStats.slice(0, 8); 
    const statBuffer = 365 / Math.max(finalStats.length, 1);

    for (let i = 0; i < finalStats.length; i++) {
        const stat = finalStats[i];
        const yBase = 180 + (i * statBuffer);
        
        const iconKey = STAT_FILE_MAP[stat.fightProp] || "FIGHT_PROP_ATTACK";
        const sIcon = await loadImage(getAssetPath(`attributes/UI/${iconKey}.png`));
        drawBrightenedImage(ctx, sIcon, 555, yBase, 32, 32, 2);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.font = `20px ${FONT_FAMILY}`;
        ctx.fillText(stat.fightPropName.get(), 603, yBase + 12);

        ctx.textAlign = 'right';
        
        if (["FIGHT_PROP_MAX_HP", "FIGHT_PROP_CUR_ATTACK", "FIGHT_PROP_CUR_DEFENSE"].includes(stat.fightProp)) {
            let basePropId;
            if (stat.fightProp === "FIGHT_PROP_MAX_HP") basePropId = "FIGHT_PROP_BASE_HP";
            else if (stat.fightProp === "FIGHT_PROP_CUR_ATTACK") basePropId = "FIGHT_PROP_BASE_ATTACK";
            else if (stat.fightProp === "FIGHT_PROP_CUR_DEFENSE") basePropId = "FIGHT_PROP_BASE_DEFENSE";

            const baseStat = allStats.find(s => s.fightProp === basePropId);
            const base = baseStat ? baseStat.value : 0;
            const max = stat.value;
            const bonus = max - base;
            
            const maxStr = Math.round(max).toLocaleString();
            const baseStr = Math.round(base).toLocaleString();
            const bonusStr = Math.round(bonus).toLocaleString();

            ctx.font = `20px ${FONT_FAMILY}`;
            ctx.fillStyle = 'white';
            ctx.fillText(maxStr, 967, yBase + 4);

            ctx.font = `12px ${FONT_FAMILY}`;
            const bonusText = `+${bonusStr}`;
            ctx.fillStyle = 'rgb(150, 255, 169)';
            ctx.fillText(bonusText, 967, yBase + 22);
            
            const bonusW = ctx.measureText(bonusText).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(baseStr, 967 - bonusW - 5, yBase + 22);

        } else {
            ctx.font = `20px ${FONT_FAMILY}`;
            ctx.fillStyle = 'white';
            ctx.fillText(stat.valueText, 967, yBase + 12);
        }
    }

    // 9. Artifacts (With Mask)
    const artifacts = character.artifacts; 
    const slotOrder = ["EQUIP_BRACER", "EQUIP_NECKLACE", "EQUIP_SHOES", "EQUIP_RING", "EQUIP_DRESS"];
    const artSpacer = 119;
    const setCounts = {};

    // Load Artifact Mask from file
    const artMask = await loadImage(getAssetPath("attributes/Assets/artifact_mask.png"));

    for (let i = 0; i < slotOrder.length; i++) {
        const slotKey = slotOrder[i];
        const artifact = artifacts.find(a => a.artifactData.equipType === slotKey);
        const yBase = 14 + (artSpacer * i);

        // Background Kotak
        roundedRect(ctx, 1009, yBase, 440, 105, 5, artifact ? 'rgba(0,0,0,0.24)' : 'rgba(0,0,0,0.1)');

        if (!artifact) continue;

        const setName = artifact.artifactData.set.name.get();
        setCounts[setName] = (setCounts[setName] || 0) + 1;

        const artIcon = await resolveImage(artifact.artifactData.icon.url);
        
        // --- PERBAIKAN 1 & 2: Icon Zoom Asli & Mask Landscape ---
        if (artIcon.width > 2) {
            // Kita gunakan logika Zoom/Crop asli Anda agar gambar artifact terlihat "pas"
            // (Mengambil bagian tengah gambar artifact)
            const wSize = artIcon.width * 0.6;
            const hSize = artIcon.height * 0.6;
            const sOffset = (artIcon.width - hSize) / 2;
            const iconSize = 106;
            
            const tempArtCanvas = createCanvas(iconSize, 105);
            const taCtx = tempArtCanvas.getContext('2d');
            
            taCtx.drawImage(artIcon, sOffset, sOffset, wSize, hSize, 0, 0, iconSize, 105);
            
            // 2. Apply Mask
            // Gambar mask memenuhi canvas landscape (tanpa rotasi, tanpa crop)
            if (artMask.width > 2) {
                applyLumaMask(taCtx, artMask, -2, 0, iconSize, 105, true);
            }
            
            // 3. Gambar ke Canvas Utama
            // Tempelkan di sisi kanan kotak artifact
            ctx.drawImage(tempArtCanvas, 1009, yBase);
        }

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.moveTo(1175, yBase + 10);
        ctx.lineTo(1175, yBase + 95);
        ctx.stroke();

        const main = artifact.mainstat; 
        const msIconKey = STAT_FILE_MAP[main.fightProp];
        const msIcon = await loadImage(getAssetPath(`attributes/UI/${msIconKey}.png`));
        drawBrightenedImage(ctx, msIcon, 1125, 25 + (artSpacer * i), 32, 32, 2);

        ctx.fillStyle = 'white';
        ctx.font = `27px ${FONT_FAMILY}`;
        ctx.textAlign = 'right';
        const msVal = main.getMultipliedValue();
        const msValStr = formatStatValue(msVal, main.fightProp);
        
        ctx.fillText(msValStr, 1150, 66 + (artSpacer * i));

        // --- PERBAIKAN 3: Posisi Level Text Naik ---
        // Sebelumnya yBase + 90 dan 103 (terlalu bawah).
        // Kita naikkan menjadi yBase + 70 dan 83 agar sejajar dengan baris substat.
        const lvlTxt = `+${artifact.level - 1}`;
        ctx.font = `14px ${FONT_FAMILY}`;
        const lvlW = ctx.measureText(lvlTxt).width;
        
        // 1. Gambar Rarity Stars (Sebelah Kiri Level)
        const starName = RARITY_REFERENCE[artifact.artifactData.stars]; // Ambil nama file rarity (misal "FIVE_STAR")
        try {
            const rarityImg = await loadImage(getAssetPath(`attributes/UI/${starName}.png`));
            
            if (rarityImg.width > 1) {
                // Atur tinggi bintang agar proporsional dengan badge level (sekitar 18px)
                const starHeight = 18; 
                const starWidth = rarityImg.width * (starHeight / rarityImg.height);
                
                // Hitung posisi X: Di sebelah kiri badge level dengan jarak 5px
                // Posisi Badge Level X = (1150 - lvlW - 6)
                const starX = (1150 - lvlW - 6) - starWidth - 5;
                const starY = 91 + (artSpacer * i); // Disamakan center dengan badge level
                
                ctx.drawImage(rarityImg, starX, starY, starWidth, starHeight);
            }
        } catch (e) {
            console.error("Failed to load artifact rarity image:", e);
        }

        // 2. Gambar Level Badge (Posisi tetap)
        roundedRect(ctx, 1150 - lvlW - 6, 92 + (artSpacer * i), lvlW + 8, 16, 5, 'rgba(0,0,0,0.7)');
        
        ctx.fillStyle = 'white';
        ctx.fillText(lvlTxt, 1150 - 2, 96 + (artSpacer * i));

        const substats = artifact.substats.total; 
        substats.sort((a, b) => SUBST_ORDER.indexOf(a.fightProp) - SUBST_ORDER.indexOf(b.fightProp));

        ctx.font = `20px ${FONT_FAMILY}`;
        ctx.textAlign = 'left';
        
        // Loop Substat (dengan perbaikan textBaseline dari step sebelumnya)
        for (let idx = 0; idx < substats.length; idx++) {
            const sub = substats[idx];
            const col = idx % 2; 
            const row = Math.floor(idx / 2); 
            
            const sx = 1190 + (125 * col);
            const sy = 26 + (artSpacer * i) + (45 * row);
            
            const sVal = sub.getMultipliedValue();
            const sValStr = formatStatValue(sVal, sub.fightProp);

            const sIconKey = STAT_FILE_MAP[sub.fightProp];
            const subIcon = await loadImage(getAssetPath(`attributes/UI/${sIconKey}.png`));
            drawBrightenedImage(ctx, subIcon, sx, sy + 5, 28, 28, 2);

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.textBaseline = 'middle';
            // Posisi text sejajar tengah icon (sy + 4 + 10 = sy + 14)
            ctx.fillText(`+${sValStr}`, sx + 30, sy + 17);
            ctx.restore();
        }
    }

    // 10. Artifact Set Bonuses
    roundedRect(ctx, 555, 547, 48, 48, 5, 'rgba(0, 0, 0, 0.2)');
    const flowerIcon = await loadImage(getAssetPath("attributes/Assets/flower_of_life_icon.png"));
    if (flowerIcon.width > 2) ctx.drawImage(flowerIcon, 562, 555, 35, 35);

    const activeSets = Object.entries(setCounts).filter(([name, count]) => count >= 2);
    let setY = (activeSets.length > 1) ? 554 : 565;
    
    // Pastikan baseline reset ke default agar perhitungan Y konsisten
    ctx.textBaseline = 'alphabetic'; 

    if (activeSets.length > 0) {
        activeSets.forEach(([name, count], index) => {
            const yOffset = index * 25;
            
            ctx.textAlign = 'center';
            ctx.font = `17px ${FONT_FAMILY}`;
            ctx.fillStyle = 'rgb(150, 255, 169)';
            
            // 1. Nama Set Artifact
            ctx.fillText(name, 770, setY + yOffset + 10);

            // 2. Kotak Hijau (Background Jumlah)
            // Logika asli: 561. Karena setY asli 565, maka offsetnya adalah (setY - 4)
            roundedRect(ctx, 935, (setY - 4) + yOffset - 2, 30, 21, 3, 'rgba(0, 0, 0, 0.2)');
            
            // 3. Angka Jumlah (2 atau 4)
            ctx.fillStyle = 'white';
            // Logika asli: 563 + 5 = 568. Offsetnya adalah (setY + 3)
            ctx.fillText(String(count >= 4 ? 4 : 2), 951, (setY + 3) + yOffset + 8);
        });
    } else {
        ctx.textAlign = 'center';
        ctx.font = `17px ${FONT_FAMILY}`;
        ctx.fillStyle = 'rgb(150, 255, 169)';
        ctx.fillText("No Activated Bonuses", 770, 572);
        
        roundedRect(ctx, 935, 548 + 12, 30, 21, 3, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = 'white';
        ctx.fillText("0", 951, 571 + 5);
    }

    // 10. Save to file if requested
    const buffer = canvas.toBuffer('image/png');
    
    if (saveToFile) {
        const outName = `${charName}_${Date.now()}.png`;
        try { 
            await fs.access(outputDir); 
        } catch { 
            await fs.mkdir(outputDir, { recursive: true }); 
        }
        await fs.writeFile(join(outputDir, outName), buffer);
        console.log(`✅ Card saved: ${outputDir}/${outName}`);
    }
    
    return buffer;
}

/**
 * Create an EnkaClient instance
 * @param {Object} options - EnkaClient options
 * @returns {EnkaClient}
 */
export function createClient(options = {}) {
    return new EnkaClient(options);
}

// Export constants for advanced users
export {
    ELEMENT_COLORS,
    RARITY_COLORS,
    ELEMENT_PROP_MAP,
    SUBST_ORDER,
    STAT_FILE_MAP,
    RARITY_REFERENCE
};
