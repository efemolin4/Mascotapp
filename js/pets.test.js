import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import { savePet } from './pets.js';

// savePet() lee/escribe sobre `state`, `sb`, etc. como globales (ver
// js/utils.js para el porqué de esa convención) — acá se los proveemos a
// mano en window, sin cargar toda la app, para poder probar la lógica de
// guardado (límite de plan, inserción, rollback si falla pet_access) de
// forma aislada.
describe('savePet', () => {
  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.navigate = vi.fn();
    window.isDemoUser = vi.fn(() => false);
    window.createPetInvite = vi.fn(async () => {});
    window.PLAN_PET_LIMITS = { free: 1, basic: 3, pro: Infinity, clinic: Infinity };
    window.PLAN_LABELS = { free: 'Free', basic: 'Basic', pro: 'Pro', clinic: 'Clínica' };
    window.state = {
      user: { id: 'user-1', plan: 'pro' },
      pets: [],
      newPetData: { name: 'Rex', species: 'Perro' },
      addPetStep: 4,
    };
  });

  it('no guarda si falta el nombre, y no llama a Supabase', async () => {
    window.state.newPetData = {};
    window.sb = makeMockSb();
    await savePet();
    expect(window.showToast).toHaveBeenCalledWith('El nombre es requerido', 'error');
    expect(window.state.addPetStep).toBe(1);
    expect(window.sb.from).not.toHaveBeenCalled();
  });

  it('respeta el límite de mascotas del plan y no llama a Supabase', async () => {
    window.state.user.plan = 'free';
    window.state.pets = [{ id: 'existing' }]; // ya en el límite de "free" (1)
    window.sb = makeMockSb();
    await savePet();
    expect(window.showToast).toHaveBeenCalledWith(expect.stringContaining('Free'), 'error');
    expect(window.sb.from).not.toHaveBeenCalled();
    expect(window.state.pets).toHaveLength(1);
  });

  it('inserta la mascota y su fila de pet_access, y navega a la ficha', async () => {
    window.sb = makeMockSb({
      pets: { data: { id: 'pet-99' }, error: null },
      pet_access: { data: null, error: null },
    });
    await savePet();
    expect(window.state.pets).toHaveLength(1);
    expect(window.state.pets[0]).toMatchObject({ id: 'pet-99', name: 'Rex', myRole: 'owner' });
    expect(window.navigate).toHaveBeenCalledWith('petProfile', { currentPetId: 'pet-99', currentTab: 'general' });
    expect(window.sb.from.mock.calls.map(c => c[0])).toEqual(['pets', 'pet_access']);
  });

  it('si falla el insert de la mascota, muestra error y no agrega nada al estado', async () => {
    window.sb = makeMockSb({ pets: { data: null, error: { message: 'boom' } } });
    await savePet();
    expect(window.showToast).toHaveBeenCalledWith('Error al guardar mascota', 'error');
    expect(window.state.pets).toHaveLength(0);
    expect(window.navigate).not.toHaveBeenCalled();
  });

  it('si falla el insert de pet_access, deshace (rollback) el insert de la mascota', async () => {
    window.sb = makeMockSb({
      pets: { data: { id: 'pet-99' }, error: null },
      pet_access: { data: null, error: { message: 'boom' } },
    });
    await savePet();
    expect(window.showToast).toHaveBeenCalledWith('Error al guardar mascota', 'error');
    expect(window.state.pets).toHaveLength(0);
    // 'pets' se llama dos veces: el insert original y el delete de rollback.
    expect(window.sb.from.mock.calls.map(c => c[0])).toEqual(['pets', 'pet_access', 'pets']);
  });
});
