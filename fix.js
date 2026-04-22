const fs = require('fs');
let content = fs.readFileSync('app/donate/page.tsx', 'utf8');

content = content.replace(/className="([^"]+)" className="([^"]+)"/g, 'className="$1 $2"');

fs.writeFileSync('app/donate/page.tsx', content);
console.log('Fixed duplicate classNames');
