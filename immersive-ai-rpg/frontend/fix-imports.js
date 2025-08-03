import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Find all JS/JSX files
const files = globSync('src/**/*.{js,jsx}');

// Fix imports in each file
files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  let modified = false;
  
  // Replace slice imports with store imports
  const replacements = [
    [/from ['"]@store\/slices\/authSlice['"]/g, "from '@store'"],
    [/from ['"]@store\/slices\/gameSlice['"]/g, "from '@store'"],
    [/from ['"]@store\/slices\/playerSlice['"]/g, "from '@store'"],
    [/from ['"]@store\/slices\/worldSlice['"]/g, "from '@store'"],
    [/from ['"]@store\/slices\/settingsSlice['"]/g, "from '@store'"],
    [/from ['"]@store\/slices\/uiSlice['"]/g, "from '@store'"],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(file, content);
    console.log(`Fixed imports in: ${file}`);
  }
});

console.log('Import fixes complete!');