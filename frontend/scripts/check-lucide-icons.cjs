const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const ICONS_DIR = path.join(__dirname, '..', 'node_modules', 'lucide-react', 'dist', 'esm', 'icons');

function kebabFromName(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .replace(/([A-Za-z])([0-9])/g, '$1-$2')
        .replace(/([0-9])([A-Za-z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase();
}

function getFiles(dir) {
    const walk = (d) => {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        let files = [];
        for (const e of entries) {
            const full = path.join(d, e.name);
            if (e.isDirectory()) files = files.concat(walk(full));
            else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) files.push(full);
        }
        return files;
    };
    return walk(dir);
}

const files = getFiles(SRC);
const problems = [];

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /from\s+['"]lucide-react['"]/g;
    if (!re.test(src)) continue;
    const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    let m;
    while ((m = importRe.exec(src)) !== null) {
        const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
        for (const name of names) {
            const kebab = kebabFromName(name);
            const iconPath = path.join(ICONS_DIR, `${kebab}.js`);
            if (!fs.existsSync(iconPath)) {
                problems.push({ file, name, expected: `${kebab}.js` });
            }
        }
    }
}

if (problems.length === 0) {
    console.log('✅ All lucide-react imports map to existing icons.');
    process.exit(0);
}

console.log('❌ Found missing lucide icon exports:');
for (const p of problems) {
    console.log(`- ${p.name} imported in ${p.file} (expected icons/${p.expected})`);
}
process.exit(2);
