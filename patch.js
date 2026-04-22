const fs = require('fs');
let content = fs.readFileSync('app/donate/page.tsx', 'utf8');

content = content.replace(/className="min-h-screen bg-\[\#090514\]"/g, 'className="min-h-screen bg-gray-50 dark:bg-[#090514]"');
content = content.replace(/className="pt-16 bg-\[\#090514\]"/g, 'className="pt-16 bg-gray-50 dark:bg-[#090514]"');

content = content.replace(/text-white/g, 'text-gray-900 dark:text-white');
content = content.replace(/className="([^"]*)text-gray-900 dark:text-white([^"]*) bg-clip-text/g, 'className="$1text-white$2 bg-clip-text');

content = content.replace(
  /className="rounded-2xl p-6 border relative overflow-hidden" style=\{\{ background: "linear-gradient\(135deg, rgba\(157,78,221,0\.12\), rgba\(18,11,34,0\.9\)\)", borderColor: "rgba\(157,78,221,0\.3\)" \}\}/g,
  'className="rounded-2xl p-6 border relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#9d4edd]/10 dark:to-[#120b22]/90 border-gray-200 dark:border-[#9d4edd]/30"'
);

content = content.replace(
  /className="rounded-2xl border p-6" style=\{\{ background: "linear-gradient\(180deg, rgba\(18,11,34,0\.9\), rgba\(9,5,20,0\.9\)\)", borderColor: "rgba\(157,78,221,0\.2\)" \}\}/g,
  'className="rounded-2xl border p-6 bg-white dark:bg-gradient-to-b dark:from-[#120b22]/90 dark:to-[#090514]/90 border-gray-200 dark:border-[#9d4edd]/20"'
);

content = content.replace(
  /className="rounded-2xl border p-6 flex flex-col" style=\{\{ background: "linear-gradient\(135deg, rgba\(249,115,22,0\.08\), rgba\(18,11,34,0\.9\)\)", borderColor: "rgba\(249,115,22,0\.25\)" \}\}/g,
  'className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-gradient-to-br dark:from-[#f97316]/10 dark:to-[#120b22]/90 border-gray-200 dark:border-[#f97316]/25"'
);

content = content.replace(
  /className="rounded-2xl border p-6 flex flex-col" style=\{\{ background: "linear-gradient\(135deg, rgba\(99,102,241,0\.08\), rgba\(18,11,34,0\.9\)\)", borderColor: "rgba\(99,102,241,0\.25\)" \}\}/g,
  'className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-gradient-to-br dark:from-[#6366f1]/10 dark:to-[#120b22]/90 border-gray-200 dark:border-[#6366f1]/25"'
);

content = content.replace(
  /className="rounded-2xl border p-6 flex flex-col" style=\{\{ background: "linear-gradient\(135deg, rgba\(6,182,212,0\.08\), rgba\(18,11,34,0\.9\)\)", borderColor: "rgba\(6,182,212,0\.25\)" \}\}/g,
  'className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-gradient-to-br dark:from-[#06b6d4]/10 dark:to-[#120b22]/90 border-gray-200 dark:border-[#06b6d4]/25"'
);

content = content.replace(
  /className="rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center" style=\{\{ background: "linear-gradient\(135deg, rgba\(157,78,221,0\.1\), rgba\(18,11,34,0\.9\)\)", borderColor: "rgba\(157,78,221,0\.25\)" \}\}/g,
  'className="rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-white dark:bg-gradient-to-br dark:from-[#9d4edd]/10 dark:to-[#120b22]/90 border-gray-200 dark:border-[#9d4edd]/25"'
);

content = content.replace(
  /className="rounded-2xl border p-10 relative overflow-hidden" style=\{\{ background: "linear-gradient\(135deg, rgba\(157,78,221,0\.15\), rgba\(9,5,20,0\.95\)\)", borderColor: "rgba\(157,78,221,0\.35\)" \}\}/g,
  'className="rounded-2xl border p-10 relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#9d4edd]/15 dark:to-[#090514]/95 border-gray-200 dark:border-[#9d4edd]/35"'
);

content = content.replace(/text-gray-400/g, 'text-gray-600 dark:text-gray-400');
content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-500');

content = content.replace(/text-gray-900 dark:text-white transition-all hover:scale-105/g, 'text-white transition-all hover:scale-105');
content = content.replace(/text-gray-900 dark:text-white transition-all hover:scale-\[1.01\]/g, 'text-white transition-all hover:scale-[1.01]');
content = content.replace(/text-gray-900 dark:text-white transition-all hover:scale-\[1.02\]/g, 'text-white transition-all hover:scale-[1.02]');
content = content.replace(/className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all text-gray-900 dark:text-white"/g, 'className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all text-white"');

content = content.replace(/text-gray-900 dark:text-white placeholder-gray-500/g, 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500');

content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.04\)" \}\}/g, 'className="bg-gray-100 dark:bg-white/5"');
content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.03\)" \}\}/g, 'className="bg-gray-50 dark:bg-white/5"');
content = content.replace(/style=\{\{ background: "rgba\(255,255,255,0\.03\)", borderColor: "rgba\(255,255,255,0\.07\)" \}\}/g, 'className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"');

fs.writeFileSync('app/donate/page.tsx', content);
console.log('Patched page.tsx via node patch.js');
