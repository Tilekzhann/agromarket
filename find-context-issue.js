// find-context-issue.js
const fs = require('fs');
const path = require('path');

// Директории для проверки
const dirs = ['components', 'app', 'context'];

// Ключевые слова контекста
const contextKeywords = [
  'useContext',
  'useSession',
  'useAuth',
  'useCart',
  'createContext',
  'AuthContext',
  'CartContext'
];

// Файлы для исключения
const excludePatterns = [
  /node_modules/,
  /\.next/,
  /layout\.js$/,
  /page\.js$/
];

let problems = [];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    const hasContextKeywords = contextKeywords.some(keyword => content.includes(keyword));
    
    if (hasContextKeywords && !hasUseClient) {
      problems.push(filePath);
    }
  } catch (err) {
    // ignore
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      const isExcluded = excludePatterns.some(pattern => pattern.test(relPath));
      
      if (!isExcluded) {
        checkFile(filePath);
      }
    }
  });
}

console.log('🔍 Поиск файлов, использующих контекст без "use client"...\n');

dirs.forEach(dir => walkDir(dir));

if (problems.length === 0) {
  console.log('✅ Проблемных файлов не найдено!');
} else {
  console.log('❌ Найдены проблемные файлы:\n');
  problems.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  console.log(`\n📝 Добавьте 'use client' в начало каждого из этих ${problems.length} файлов.`);
}