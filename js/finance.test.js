import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import '../js/utils.js';   // deja parseCLP real en window
import { state } from '../js/app.js'; // isPremium() (llamada dentro de viewFinance) lee `state` del scope de app.js — hay que mutar el mismo objeto, no reemplazar window.state
import { saveExpense, deleteExpense, viewFinance } from './finance.js';

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

  it('convierte "190.000" tipeado en el campo a 190000 antes de mandarlo a Supabase (regresión del bug real)', async () => {
    // Bug real: el campo era type="number", que interpreta "190.000" como
    // el número 190 (punto = decimal), y ese string se mandaba tal cual a
    // una columna integer — Supabase rechazaba el insert completo con
    // "invalid input syntax for type integer". Ahora el campo es texto y
    // se parsea con parseCLP() antes de armar el payload.
    document.getElementById('ex-amount').value = '190.000';
    window.sb = makeMockSb({
      expenses: { data: { id: 'exp-2', pet_id: 'pet-1', date: '2026-05-01', category: 'Veterinaria', amount: 190000, description: 'Consulta' }, error: null },
    });
    await saveExpense({ preventDefault: () => {} });
    const insertedPayload = window.sb.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertedPayload.amount).toBe(190000);
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

// Regresión/cobertura del nuevo gating por plan: el gráfico y la
// predicción de gastos quedan detrás de Premium; la lista y las stat
// cards siguen libres para Free.
describe('viewFinance — gating Premium de la vista Gráfico', () => {
  beforeEach(() => {
    // Los describe de arriba (saveExpense/deleteExpense) reasignan
    // window.state a un objeto nuevo, desconectándolo del `state` real de
    // js/app.js — isPremium() (llamada dentro de viewFinance) sigue
    // leyendo ese `state` real, así que hay que resincronizar la
    // referencia antes de mutarla.
    window.state = state;
    window.getFinanceExpenses = () => [];
    state.pets = [{ id: 'pet-1', name: 'Greta', species: 'Perro' }];
    state.finView = 'grafico';
    state.finPet = '';
    state.finPeriod = 'mensual';
  });

  it('un usuario Free ve el upsell de Premium en vez del gráfico', () => {
    state.user = { id: 'user-1', plan: 'free' };
    const html = viewFinance();
    expect(html).toContain('Premium');
    expect(html).toContain('Gráficos y predicción de gastos');
    expect(html).not.toContain('expenses-chart');
    expect(html).not.toContain('Predicción de gastos');
  });

  it('un usuario Premium ve el canvas del gráfico', () => {
    state.user = { id: 'user-1', plan: 'premium' };
    const html = viewFinance();
    expect(html).toContain('expenses-chart');
    expect(html).not.toContain('Gráficos y predicción de gastos');
  });

  it('la vista Lista (listado) sigue disponible en Free, sin upsell', () => {
    state.user = { id: 'user-1', plan: 'free' };
    state.finView = 'listado';
    const html = viewFinance();
    expect(html).toContain('Historial de gastos');
    expect(html).not.toContain('Botiquín del hogar');
  });
});
