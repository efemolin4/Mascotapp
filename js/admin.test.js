import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import { applyPlanChange } from './admin.js';

describe('applyPlanChange', () => {
  beforeEach(() => {
    window.showToast = vi.fn();
    window.render = vi.fn();
    window.closeModal = vi.fn();
    document.body.innerHTML = `
      <input type="radio" name="new-plan" value="pro" checked />
    `;
    window.state = { adminData: { profiles: [{ id: 'user-1', plan: 'free' }] } };
  });

  it('actualiza el plan localmente cuando Supabase confirma el cambio', async () => {
    window.sb = makeMockSb({ profiles: { data: null, error: null } });
    await applyPlanChange('user-1');
    expect(window.state.adminData.profiles[0].plan).toBe('pro');
    expect(window.closeModal).toHaveBeenCalled();
    expect(window.showToast).toHaveBeenCalledWith('Plan actualizado', 'success');
  });

  it('si Supabase falla, muestra el toast y no muta el estado local', async () => {
    window.sb = makeMockSb({ profiles: { data: null, error: { message: 'boom' } } });
    await applyPlanChange('user-1');
    expect(window.state.adminData.profiles[0].plan).toBe('free');
    expect(window.showToast).toHaveBeenCalledWith('Error al cambiar plan', 'error');
    expect(window.closeModal).not.toHaveBeenCalled();
  });

  it('no hace nada si no hay un plan seleccionado en el formulario', async () => {
    document.body.innerHTML = '';
    window.sb = makeMockSb();
    await applyPlanChange('user-1');
    expect(window.sb.from).not.toHaveBeenCalled();
  });
});
