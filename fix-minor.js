const fs = require('fs');
let content = fs.readFileSync('app/donate/page.tsx', 'utf8');

content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.08\)", color: "#9ca3af" \}\}/g, 'className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"');

// FAQ section
content = content.replace(/style=\{\{ borderColor: "rgba\(157,78,221,0\.15\)", background: "rgba\(255,255,255,0\.03\)" \}\}/g, 'className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-[#9d4edd]/15"');

// Top badges
content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.04\)", borderColor: "rgba\(255,255,255,0\.08\)", color: "#a0a0b0" \}\}/g, 'className="bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#a0a0b0]"');

// Patreon tiers
content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.04\)", borderColor: "rgba\(249,115,22,0\.15\)" \}\}/g, 'className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-[#f97316]/15"');

// Payment method selector buttons
content = content.replace(/background: selected \? "rgba\(157,78,221,0\.1\)" : "rgba\(255,255,255,0\.03\)",\n\s*borderColor: selected \? "rgba\(157,78,221,0\.7\)" : "rgba\(255,255,255,0\.08\)"/g, 'background: selected ? "rgba(157,78,221,0.1)" : "",\n                              borderColor: selected ? "rgba(157,78,221,0.7)" : ""');

// We also need to add dynamic className based on selected status for payment methods, 
// actually it's easier to just do it via regex
content = content.replace(/className="relative p-4 rounded-xl border text-left transition-all"/g, 'className={`relative p-4 rounded-xl border text-left transition-all ${selected ? "bg-[#9d4edd]/10 border-[#9d4edd]/70" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"}`}');

fs.writeFileSync('app/donate/page.tsx', content);
console.log('Fixed minor styles');
