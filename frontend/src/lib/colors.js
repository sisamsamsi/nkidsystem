// Utility for mapping color names to hex and parsing color input strings
const COLOR_MAP = {
    // Basics & Neutrals
    'white': '#FFFFFF',
    'putih': '#FFFFFF',
    'offwhite': '#FAF9F6',
    'off white': '#FAF9F6',
    'black': '#111111',
    'hitam': '#111111',
    'cream': '#FFFDD0',
    'krem': '#FFFDD0',
    'beige': '#D5BA98',
    'ivory': '#FFFFF0',
    'broken white': '#F3F0E0',
    'bw': '#F3F0E0',

    // Earth Tones (Important for NUSA/Garments)
    'coklat': '#634433',
    'brown': '#634433',
    'coklat susu': '#C68642',
    'milk chocolate': '#C68642',
    'toffee': '#8B4513',
    'tofee': '#8B4513',
    'latte': '#C5A080',
    'tan': '#D2B48C',
    'khaki': '#C3B091',
    'coffee': '#6F4E37',
    'coffe': '#6F4E37',
    'kopi': '#6F4E37',
    'terracotta': '#E2725B',
    'choco': '#5C4033',
    'chocolate': '#5C4033',
    'mocca': '#967259',
    'mocha': '#967259',
    'caramel': '#C68E17',
    'maple': '#C19A6B',
    'wood': '#8B5A2B',
    'kayu': '#8B5A2B',

    // Blues
    'navy': '#000080',
    'biru dongker': '#000080',
    'dongker': '#000080',
    'biru': '#0066CC',
    'blue': '#0066CC',
    'royal blue': '#4169E1',
    'light blue': '#ADD8E6',
    'biru muda': '#ADD8E6',
    'dusty blue': '#8DA7BE',
    'dusty-blue': '#8DA7BE',
    'sky blue': '#87CEEB',
    'sky': '#87CEEB',
    'denim': '#1560BD',
    'tosca': '#40E0D0',
    'toska': '#40E0D0',
    'turquoise': '#40E0D0',
    'cyan': '#00FFFF',

    // Greens (Garment focus)
    'green': '#228B22',
    'hijau': '#228B22',
    'olive': '#808000',
    'zaitun': '#808000',
    'sage': '#9DC183',
    'sage green': '#9DC183',
    'mint': '#98FF98',
    'forest green': '#228B22',
    'army': '#4A5D23',
    'tni': '#4A5D23',
    'moss': '#8A9A5B',
    'lumut': '#8A9A5B',
    'emerald': '#50C878',
    'hijau tua': '#006400',
    'dark green': '#006400',
    'lime': '#32CD32',
    'duck': '#2E8B57',
    'bebek': '#2E8B57',

    // Pinks & Purples (Kids preference)
    'pink': '#FFC0CB',
    'merah muda': '#FFC0CB',
    'rose': '#FF007F',
    'dusty pink': '#DCAE96',
    'fuchsia': '#FF00FF',
    'purple': '#800080',
    'ungu': '#800080',
    'lavender': '#E6E6FA',
    'lilac': '#C8A2C8',
    'anggur': '#722F37',
    'grape': '#722F37',
    'wine': '#722F37',
    'maroon': '#800000',
    'marun': '#800000',
    'magenta': '#FF00FF',
    'plum': '#8E4585',
    'violet': '#8B00FF',
    'coral': '#FF7F50',
    'salmon': '#FA8072',
    'peach': '#FFCBA4',

    // Primary & Vibrants
    'red': '#DC143C',
    'merah': '#DC143C',
    'yellow': '#FFD700',
    'kuning': '#FFD700',
    'mustard': '#E1AD01',
    'orange': '#FF8C00',
    'jingga': '#FF8C00',
    'oranye': '#FF8C00',
    'gold': '#FFD700',
    'emas': '#FFD700',
    
    // Animal-inspired colors
    'elephant': '#808080',
    'elepant': '#808080',
    'gajah': '#808080',

    // Grays
    'gray': '#808080',
    'grey': '#808080',
    'abu': '#808080',
    'abu-abu': '#808080',
    'light gray': '#C0C0C0',
    'light-gray': '#C0C0C0',
    'silver': '#C0C0C0',
    'dark gray': '#4B5563',
    'charcoal': '#36454F',
    'stone': '#888C8D',
    'slate': '#708090',

    // Special
    'multicolor': '#A52A2A',
    'rainbow': '#FF0000'
};

// If no exact name, produce a deterministic color from the name
function hashStringToHsl(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const h = Math.abs(hash) % 360;
    const s = 50 + (Math.abs(hash) % 30); // 50-79
    const l = 40 + (Math.abs(hash) % 20); // 40-59
    return `hsl(${h} ${s}% ${l}%)`;
}

function normalizeName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ').replace(/[^a-z0-9\- ]/g, '');
}

function nameToHex(name) {
    const n = normalizeName(name);
    if (COLOR_MAP[n]) return COLOR_MAP[n];
    // try singular/plural or minor transformations
    if (COLOR_MAP[n.replace(/s$/, '')]) return COLOR_MAP[n.replace(/s$/, '')];
    // fallback to hsl hash
    return hashStringToHsl(n);
}

function isHexColor(s) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(s);
}

function parseColorInput(input) {
    if (!input) return [];
    // accept comma-separated list
    const parts = input.split(',').map(p => p.trim()).filter(Boolean);
    return parts.map(part => {
        if (isHexColor(part)) {
            return { name: part, hex: part };
        }
        const hex = nameToHex(part);
        return { name: part, hex };
    });
}

export { parseColorInput, nameToHex, COLOR_MAP };
