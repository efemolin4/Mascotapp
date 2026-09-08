import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import '../js/utils.js';   // deja esc/genId/addMonths reales en window
import '../js/app.js';     // deja canEditPet/blockIfReadOnly reales en window
import { saveVaccine, deleteVaccine, tabVaccines, tabDeworming } from './vaccines-dewormings.js';

describe('deleteVaccine', () => {
  let pet;

  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    pet = { id: 'pet-1', myRole: 'owner', vaccines: [{ id: 'vac-1', name: 'Antirrábica' }] };
    window.state = { pets: [pet] };
  });

  it('elimina la vacuna del estado local cuando Supabase confirma el borrado', async () => {
    window.sb = makeMockSb({ vaccines: { data: null, error: null } });
    await deleteVaccine('pet-1', 'vac-1');
    expect(pet.vaccines).toHaveLength(0);
    expect(window.render).toHaveBeenCalled();
    expect(window.showToast).not.toHaveBeenCalled();
  });

  it('si Supabase devuelve error, muestra el toast y NO toca el estado local', async () => {
    window.sb = makeMockSb({ vaccines: { data: null, error: { message: 'boom' } } });
    await deleteVaccine('pet-1', 'vac-1');
    expect(pet.vaccines).toHaveLength(1); // sigue ahí — antes de este fix se borraba igual
    expect(window.showToast).toHaveBeenCalledWith('Error al eliminar', 'error');
    expect(window.render).not.toHaveBeenCalled();
  });

  it('no llama a Supabase si el tutor tiene acceso de solo lectura', async () => {
    pet.myRole = 'viewer';
    window.sb = makeMockSb({ vaccines: { data: null, error: null } });
    await deleteVaccine('pet-1', 'vac-1');
    expect(window.sb.from).not.toHaveBeenCalled();
    expect(pet.vaccines).toHaveLength(1);
  });
});

describe('saveVaccine', () => {
  let pet, form;

  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.closeModal = vi.fn();
    window.isDemoUser = vi.fn(() => false);
    pet = { id: 'pet-1', myRole: 'owner', vaccines: [] };
    window.state = { pets: [pet] };

    form = document.createElement('form');
    form.innerHTML = `
      <input id="v-date" value="2026-01-15" />
      <input id="v-period" value="12" />
      <input id="v-alert" value="week" />
    `;
    document.body.appendChild(form);
  });

  it('si Supabase falla, muestra el toast y no agrega la vacuna', async () => {
    window.sb = makeMockSb({ vaccines: { data: null, error: { message: 'boom' } } });
    await saveVaccine({ preventDefault: () => {} }, 'pet-1');
    expect(pet.vaccines).toHaveLength(0);
    expect(window.showToast).toHaveBeenCalledWith('Error al guardar vacuna', 'error');
    expect(window.closeModal).not.toHaveBeenCalled();
  });

  it('agrega la vacuna devuelta por Supabase al estado local', async () => {
    window.sb = makeMockSb({
      vaccines: { data: { id: 'vac-9', name: null, code: null, date: '2026-01-15', periodicity: '12', next_date: '2027-01-15', alert_type: 'week', alert_days: null, cost: null }, error: null },
    });
    await saveVaccine({ preventDefault: () => {} }, 'pet-1');
    expect(pet.vaccines).toHaveLength(1);
    expect(pet.vaccines[0].id).toBe('vac-9');
    expect(window.closeModal).toHaveBeenCalled();
    expect(window.showToast).toHaveBeenCalledWith('Vacuna guardada', 'success');
  });
});

describe('orden cronológico (regresión: antes ordenaba por creación, no por fecha)', () => {
  beforeEach(() => {
    window.state = { currentView: 'petProfile', pages: {} };
  });

  it('tabVaccines muestra la más reciente primero, sin importar el orden en que se cargaron', () => {
    // Cargadas fuera de orden a propósito: la del medio (2024) es la más
    // vieja, pero fue la ÚLTIMA en agregarse al arreglo.
    const pet = { id: 'pet-1', vaccines: [
      { id: 'v1', name: 'Antirrábica 2025', date: '2025-06-10' },
      { id: 'v2', name: 'Antirrábica 2026', date: '2026-06-10' },
      { id: 'v3', name: 'Antirrábica 2024', date: '2024-06-10' },
    ] };
    const html = tabVaccines(pet);
    const i2026 = html.indexOf('Antirrábica 2026');
    const i2025 = html.indexOf('Antirrábica 2025');
    const i2024 = html.indexOf('Antirrábica 2024');
    expect(i2026).toBeGreaterThan(-1);
    expect(i2026).toBeLessThan(i2025);
    expect(i2025).toBeLessThan(i2024);
  });

  it('tabDeworming muestra la más reciente primero', () => {
    const pet = { id: 'pet-1', deworming: [
      { id: 'd1', product: 'Producto viejo', date: '2024-01-01' },
      { id: 'd2', product: 'Producto nuevo', date: '2026-01-01' },
    ] };
    const html = tabDeworming(pet);
    expect(html.indexOf('Producto nuevo')).toBeLessThan(html.indexOf('Producto viejo'));
  });
});
