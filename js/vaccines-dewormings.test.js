import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockSb } from '../test/mockSupabase.js';
import '../js/utils.js';   // deja esc/genId/addMonths reales en window
import '../js/app.js';     // deja canEditPet/blockIfReadOnly reales en window
import { saveVaccine, deleteVaccine } from './vaccines-dewormings.js';

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
