import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, '..', 'scripts', 'check-exports.mjs');

describe('onclick exports', () => {
  it('toda función referenciada desde onclick="..." está exportada (expuesta en window)', () => {
    // Si el script sale con código != 0, execFileSync tira — el mensaje de
    // error del script (con la lista de nombres faltantes) queda en el
    // output del test, así que no hace falta duplicar la lógica acá.
    expect(() => execFileSync('node', [scriptPath], { stdio: 'pipe' })).not.toThrow();
  });
});
