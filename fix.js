const fs = require('fs');
const path = require('path');

const dir = "C:\\Users\\ADMIN\\Desktop\\Perlyn\\perlyn";

const replacements = {
  "₹": "₹",
  "'": "'",
  """: '"',
  "•": "•",
  """: '"',
  "💄": "💄",
  "🚀": "🚀",
  "📦": "📦",
  "📧": "📧",
  "🚚": "🚚",
  "💖": "💖",
  "✨": "✨",
  "❌": "❌",
  "⚠️": "⚠️",
  "💡": "💡",
  "🇮🇳": "🇮🇳",
  "🏠": "🏠",
  "💰": "💰",
  "🆕": "🆕",
  "🔥": "🔥",
  "✏️": "✏️",
  "⭐": "⭐",
  "": ""
};

let totalModified = 0;
let report = "# 🧹 Mojibake Restoration Report\n\n| File | Replacements | Details |\n|---|---|---|\n";

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (file === "node_modules" || file === ".git") continue;
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith(".html") || file.endsWith(".js") || file.endsWith(".ts") || file.endsWith(".json")) {
      processFile(fullPath);
    }
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;
  let changes = 0;
  let details = [];

  for (const [key, value] of Object.entries(replacements)) {
    const keyRegex = new RegExp(escapeRegExp(key), 'g');
    const matches = content.match(keyRegex);
    if (matches) {
      content = content.replace(keyRegex, value);
      changes += matches.length;
      details.push(`${matches.length} x '${key}'`);
    }
  }

  // Fix bullet points in title and meta tags globally
  content = content.replace(/(<title>)(.*?)(<\/title>)/ig, (match, p1, p2, p3) => {
    return p1 + p2.replace(/•/g, '|') + p3;
  });

  content = content.replace(/(<meta\s+name=["']description["']\s+content=["'])(.*?)(["'])/ig, (match, p1, p2, p3) => {
    return p1 + p2.replace(/•/g, '|') + p3;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relPath = path.relative(dir, filePath);
    report += `| ${relPath} | ${changes} | ${details.join(", ")} |\n`;
    totalModified++;
  }
}

processDirectory(dir);

report += `\n**Total files fixed:** ${totalModified}\n`;
fs.writeFileSync(path.join(dir, "mojibake_restoration_report.md"), report, 'utf8');
console.log(`Done. Fixed ${totalModified} files.`);
