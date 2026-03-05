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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
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
    content = content.replace(/BlackBullz/g, 'BullzGamez');
    content = content.replace(/blackbullz/g, 'bullzgamez');
    content = content.replace(/BLACKBULLZ/g, 'BULLZGAMEZ');
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file.replace(__dirname, ''));
        total++;
    }
});
console.log(`Replaced in ${total} files.`);
