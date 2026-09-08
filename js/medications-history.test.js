import { describe, it, expect, beforeEach } from 'vitest';
import '../js/utils.js';
import '../js/app.js';   // deja state/icon/esc/appShell/paginate/pagerHTML reales en window
import { tabHistory, tabMedications } from './medications-history.js';

// Regresión: tabHistory y tabMedications ordenaban por .reverse() (orden de
// creación invertido), no por fecha real — un evento clínico cargado más
// tarde pero con fecha más vieja aparecía primero. Ver también el mismo fix
// en js/vaccines-dewormings.test.js para tabVaccines/tabDeworming.
describe('orden cronológico', () => {
  beforeEach(() => {
    window.state = { currentView: 'petProfile', pages: {}, user: null };
  });

  it('tabHistory muestra el evento más reciente primero, sin importar el orden en que se cargó', () => {
    const pet = { id: 'pet-1', clinicalHistory: [
      { id: 'h1', title: 'Control 2025', type: 'Diagnóstico', date: '2025-06-10' },
      { id: 'h2', title: 'Cirugía 2026', type: 'Cirugía', date: '2026-06-10' },
      { id: 'h3', title: 'Vacuna 2024', type: 'Otro', date: '2024-06-10' },
    ] };
    const html = tabHistory(pet);
    const i2026 = html.indexOf('Cirugía 2026');
    const i2025 = html.indexOf('Control 2025');
    const i2024 = html.indexOf('Vacuna 2024');
    expect(i2026).toBeGreaterThan(-1);
    expect(i2026).toBeLessThan(i2025);
    expect(i2025).toBeLessThan(i2024);
  });

  it('tabMedications muestra el tratamiento con inicio más reciente primero', () => {
    const pet = { id: 'pet-1', medications: [
      { id: 'm1', name: 'Tratamiento viejo', startDate: '2024-01-01' },
      { id: 'm2', name: 'Tratamiento nuevo', startDate: '2026-01-01' },
    ], doseLog: [] };
    const html = tabMedications(pet);
    expect(html.indexOf('Tratamiento nuevo')).toBeLessThan(html.indexOf('Tratamiento viejo'));
  });
});
