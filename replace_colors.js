const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('.qodo')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(__dirname);
let total = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Primary Cyan -> Neon Purple
    content = content.replace(/#(00bcd4|00BCD4)/g, '#9d4edd');

    // Hover Cyan -> Hover Purple
    content = content.replace(/#(0097a7|0097A7)/g, '#7b2cbf');

    // Light Cyan -> Light Purple
    content = content.replace(/#(26c6da|26C6DA)/g, '#c77dff');

    // BG Navy -> Deep Violet-Black
    content = content.replace(/#(0a1628|0A1628)/g, '#090514');

    // Card Navy -> Dark Violet-Blue
    content = content.replace(/#(0f1d32|0F1D32)/g, '#120b22');

    // Secondary Navy -> Violet-Navy
    content = content.replace(/#(1a2a44|1A2A44)/g, '#1a103c');

    // Border Navy -> Violet Border
    content = content.replace(/#(1e3050|1E3050)/g, '#2d1b54');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated colors in: ' + file.replace(__dirname, ''));
        total++;
    }
});
console.log(`Color replacement complete across ${total} files.`);
