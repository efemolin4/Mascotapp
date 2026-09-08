#!/usr/bin/env node
// Verifica que toda función referenciada desde un onclick="fn(...)" en el
// HTML que genera la app esté realmente exportada (y por lo tanto expuesta
// en window, por la convención del proyecto — ver js/utils.js) en alguno
// de los módulos js/*.js. Si falta una, el botón correspondiente se rompe
// en silencio — este script convierte eso en un fallo explícito.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.test.js'));

let source = '';
for (const f of files) source += fs.readFileSync(path.join(jsDir, f), 'utf8') + '\n';

// Soporta tanto onclick="fn(...)" literal como el patrón de concatenación de
// strings que usa viewAdmin() (onclick=\"fn(...)" dentro de un string JS).
const onclickPattern = /onclick=\\?"([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g;
const onclickNames = new Set();
let m;
while ((m = onclickPattern.exec(source))) onclickNames.add(m[1]);

const exportPattern = /export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
const exportedNames = new Set();
while ((m = exportPattern.exec(source))) exportedNames.add(m[1] || m[2]);

const missing = [...onclickNames].filter(n => !exportedNames.has(n)).sort();

if (missing.length) {
  console.error(`Faltan ${missing.length} función(es) referenciadas desde onclick="..." sin exportar:`);
  missing.forEach(n => console.error(`  - ${n}`));
  process.exit(1);
}

console.log(`OK: las ${onclickNames.size} funciones referenciadas desde onclick="..." están todas exportadas.`);
