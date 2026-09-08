import { describe, it, expect, beforeEach } from 'vitest';
import '../js/utils.js'; // deja todayStr real en window
import { getFinanceExpenses } from './data.js';

// Regresión: food_items (pestaña Nutrición, agregada 2026-09-07) nunca se
// sumó a esta función — un costo de alimento cargado ahí simplemente no
// aparecía en Finanzas, sin ningún error. Este test cubre TODAS las fuentes
// a la vez para que si se agrega una nueva (o se borra una por accidente) y
// se olvida acá, quede detectado en vez de descubrirse en producción.
describe('getFinanceExpenses', () => {
  beforeEach(() => {
    window.state = {
      expenses: [{ id: 'exp-1', date: '2026-01-01', category: 'Otro', amount: 5000, description: 'Manual' }],
      pets: [{
        id: 'pet-1', name: 'Greta',
        vaccines: [{ id: 'v1', date: '2026-01-01', name: 'Antirrábica', cost: 10000 }],
        deworming: [{ id: 'd1', date: '2026-01-01', product: 'Drontal', cost: 8000 }],
        medications: [{ id: 'm1', startDate: '2026-01-01', name: 'Meloxicam', cost: 7000 }],
        clinicalHistory: [{ id: 'h1', date: '2026-01-01', title: 'Control', cost: 20000 }],
        foodItems: [{ id: 'f1', purchaseDate: '2026-01-01', product: 'Barfood', price: 70000 }],
      }],
      botiquin: [{ id: 'b1', petId: 'pet-1', purchaseDate: '2026-01-01', name: 'Pregalex', cost: 14500 }],
    };
  });

  it('incluye el gasto manual y las 6 fuentes automáticas (vacunas, desparasitaciones, tratamientos, historial, botiquín, alimento)', () => {
    const expenses = getFinanceExpenses();
    const sources = expenses.map(e => e.source).sort();
    expect(sources).toEqual(['botiquin', 'deworming', 'food', 'history', 'manual', 'medication', 'vaccine']);
  });

  it('el gasto de alimento usa el precio, la fecha de compra y la categoría Alimentación', () => {
    const expenses = getFinanceExpenses();
    expect(expenses.find(e => e.source === 'food')).toMatchObject({
      amount: 70000, description: 'Alimento: Barfood', category: 'Alimentación',
      date: '2026-01-01', pet: 'Greta',
    });
  });

  it('ignora items de alimento sin precio cargado', () => {
    window.state.pets[0].foodItems.push({ id: 'f2', purchaseDate: '2026-01-01', product: 'Sin precio', price: null });
    const expenses = getFinanceExpenses();
    expect(expenses.some(e => e.description === 'Alimento: Sin precio')).toBe(false);
  });
});
