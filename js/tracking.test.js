import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import '../js/utils.js';
import '../js/app.js'; // deja canEditPet/blockIfReadOnly reales en window
import { setBCS, saveWeight } from './tracking.js';

// Regresión: setBCS() solo mutaba el estado en memoria y llamaba a
// saveState() (que solo persiste user/isLoggedIn, no las mascotas) — el
// puntaje de condición corporal nunca llegaba a Supabase, así que se veía
// guardado en la sesión actual pero desaparecía en la próxima carga.
describe('setBCS', () => {
  let pet;

  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.isDemoUser = vi.fn(() => false);
    pet = { id: 'pet-1', myRole: 'owner', bcs: null };
    window.state = { pets: [pet] };
  });

  it('persiste el puntaje en la tabla pets, no solo en memoria', async () => {
    window.sb = makeMockSb({ pets: { data: null, error: null } });
    await setBCS('pet-1', 6);
    expect(pet.bcs).toBe(6);
    const updatePayload = window.sb.from.mock.results[0].value.update.mock.calls[0][0];
    expect(updatePayload).toEqual({ bcs: 6 });
  });

  it('si Supabase falla, muestra el toast y no cambia el estado local', async () => {
    window.sb = makeMockSb({ pets: { data: null, error: { message: 'boom' } } });
    await setBCS('pet-1', 6);
    expect(pet.bcs).toBeNull();
    expect(window.showToast).toHaveBeenCalledWith('Error al guardar', 'error');
  });

  it('no llama a Supabase si el tutor tiene acceso de solo lectura', async () => {
    pet.myRole = 'viewer';
    window.sb = makeMockSb();
    await setBCS('pet-1', 6);
    expect(window.sb.from).not.toHaveBeenCalled();
    expect(pet.bcs).toBeNull();
  });
});

// Regresión: a diferencia de saveMood/saveSymptoms, saveWeight() nunca
// chequeaba isDemoUser() — en modo demo intentaba escribir en Supabase real
// con un pet_id que no existe ahí (ej. "pet-greta"), fallando siempre con
// "Error al guardar peso" en vez de guardar localmente como el resto de
// los registros en modo demo.
describe('saveWeight', () => {
  let pet;

  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.closeModal = vi.fn();
    pet = { id: 'pet-greta', myRole: 'owner', weightHistory: [] };
    window.state = { pets: [pet] };
    document.body.innerHTML = `
      <input id="wt-kg" value="12" />
      <input id="wt-gr" value="500" />
      <input id="wt-date" value="2026-06-15" />
    `;
  });

  it('en modo demo, guarda localmente sin llamar a Supabase', async () => {
    window.isDemoUser = vi.fn(() => true);
    window.sb = makeMockSb();
    await saveWeight({ preventDefault: () => {} }, 'pet-greta');
    expect(window.sb.from).not.toHaveBeenCalled();
    expect(pet.weightHistory).toHaveLength(1);
    expect(pet.weightHistory[0]).toMatchObject({ kg: 12, gr: 500 });
    expect(window.showToast).toHaveBeenCalledWith('Peso registrado ✓', 'success');
  });

  it('con usuario real, guarda vía Supabase', async () => {
    window.isDemoUser = vi.fn(() => false);
    window.sb = makeMockSb({
      weight_history: { data: { id: 'w1', date: '2026-06-15', kg: 12, gr: 500, notes: null }, error: null },
    });
    await saveWeight({ preventDefault: () => {} }, 'pet-greta');
    expect(pet.weightHistory).toHaveLength(1);
    expect(pet.weightHistory[0].id).toBe('w1');
  });

  it('no llama a Supabase si el tutor tiene acceso de solo lectura', async () => {
    window.isDemoUser = vi.fn(() => false);
    pet.myRole = 'viewer';
    window.sb = makeMockSb();
    await saveWeight({ preventDefault: () => {} }, 'pet-greta');
    expect(window.sb.from).not.toHaveBeenCalled();
    expect(pet.weightHistory).toHaveLength(0);
  });
});
