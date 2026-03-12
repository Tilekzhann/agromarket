// add-use-client.js
const fs = require('fs');
const path = require('path');

const directories = ['components', 'context', 'app'];
const excludePatterns = [
  /app[\\/]layout\.js$/,
  /app[\\/]page\.js$/,
  /app[\\/]api[\\/]/
];

const clientKeywords = [
  'useState', 'useEffect', 'useContext', 
  'useSession', 'useAuth', 'useCart',
  'useRouter', 'useParams', 'usePathname',
  'onClick', 'onSubmit', 'useRef',
  'createContext'
];

function shouldHaveUseClient(content) {
  return clientKeywords.some(keyword => content.includes(keyword));
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (shouldHaveUseClient(content) && !content.startsWith("'use client'")) {
      const newContent = `'use client'\n\n${content}`;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Добавлено 'use client' в: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Ошибка: ${filePath}`);
  }
  return false;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(file))) {
      const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      const isExcluded = excludePatterns.some(pattern => pattern.test(relPath));
      
      if (!isExcluded) {
        processFile(filePath);
      }
    }
  });
}

console.log('🔍 Поиск файлов для добавления \'use client\'...');
let count = 0;

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log(`\n✨ Готово! 'use client' добавлен в ${count} файлов.`);