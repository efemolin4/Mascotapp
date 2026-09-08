import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import { saveExpense, deleteExpense } from './finance.js';

describe('saveExpense', () => {
  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.closeModal = vi.fn();
    window.state = { user: { id: 'user-1' }, pets: [{ id: 'pet-1', name: 'Greta' }], expenses: [] };
    document.body.innerHTML = `
      <select id="ex-pet"><option value="pet-1" selected>Greta</option></select>
      <input id="ex-date" value="2026-05-01" />
      <input id="ex-cat" value="Veterinaria" />
      <input id="ex-amount" value="15000" />
      <input id="ex-desc" value="Consulta" />
    `;
  });

  it('agrega el gasto devuelto por Supabase, resolviendo el nombre de la mascota', async () => {
    window.sb = makeMockSb({
      expenses: { data: { id: 'exp-1', pet_id: 'pet-1', date: '2026-05-01', category: 'Veterinaria', amount: '15000', description: 'Consulta' }, error: null },
    });
    await saveExpense({ preventDefault: () => {} });
    expect(window.state.expenses).toHaveLength(1);
    expect(window.state.expenses[0]).toMatchObject({ id: 'exp-1', pet: 'Greta', amount: '15000' });
    expect(window.showToast).toHaveBeenCalledWith('Gasto guardado', 'success');
  });

  it('si Supabase falla, muestra el toast y no agrega nada', async () => {
    window.sb = makeMockSb({ expenses: { data: null, error: { message: 'boom' } } });
    await saveExpense({ preventDefault: () => {} });
    expect(window.state.expenses).toHaveLength(0);
    expect(window.showToast).toHaveBeenCalledWith('Error al guardar gasto', 'error');
  });
});

describe('deleteExpense', () => {
  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.state = { expenses: [{ id: 'exp-1', description: 'Consulta' }] };
  });

  it('elimina el gasto del estado local cuando Supabase confirma', async () => {
    window.sb = makeMockSb({ expenses: { data: null, error: null } });
    await deleteExpense('exp-1');
    expect(window.state.expenses).toHaveLength(0);
    expect(window.render).toHaveBeenCalled();
  });

  it('si Supabase falla, no toca el estado local', async () => {
    window.sb = makeMockSb({ expenses: { data: null, error: { message: 'boom' } } });
    await deleteExpense('exp-1');
    expect(window.state.expenses).toHaveLength(1);
    expect(window.showToast).toHaveBeenCalledWith('Error al eliminar', 'error');
    expect(window.render).not.toHaveBeenCalled();
  });
});
