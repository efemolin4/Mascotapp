import { describe, it, expect, beforeEach } from 'vitest';
import '../js/utils.js';
import '../js/app.js';   // deja state/icon/esc/appShell/statCard/petAvatar reales en window
import { viewDashboard } from './dashboard.js';

describe('viewDashboard', () => {
  beforeEach(() => {
    window.state.user = { name: 'Felipe Molina' };
    window.state.pets = [];
    window.state.events = [];
  });

  it('muestra el onboarding cuando el usuario no tiene mascotas', () => {
    const html = viewDashboard();
    expect(html).toContain('Empecemos con tu primera mascota');
    expect(html).toContain('Hola, Felipe');
  });

  it('cuenta las alertas vencidas y muestra las mascotas registradas', () => {
    window.state.pets = [{
      id: 'pet-1', name: 'Greta', species: 'Perro', dateOfBirth: '2021-01-01',
      vaccines: [{ id: 'v1', name: 'Antirrábica', nextDate: '2020-01-01', alertType: 'same' }], // vencida
      deworming: [], medications: [],
    }];
    const html = viewDashboard();
    expect(html).not.toContain('Empecemos con tu primera mascota');
    expect(html).toContain('Greta');
    // statCard de "Alertas activas" debe reflejar la 1 vacuna vencida
    expect(html).toMatch(/>\s*1\s*<\/div>\s*<div class="text-xs md:text-sm text-gray-500 mt-1">Alertas activas/);
  });

  it('escapa el nombre del usuario para evitar HTML/JS inyectado', () => {
    window.state.user = { name: '<img src=x onerror=alert(1)>' };
    const html = viewDashboard();
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img');
  });
});
