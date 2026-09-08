/* ============================================================
   MYPETS 3.0 — Finanzas
   ============================================================
   Fase 2 de la modularización (ver js/utils.js para el porqué de la
   convención export + window.assign). Vista de finanzas y registro
   manual de gastos. */

export function viewFinance() {
  if (state.pets.length === 0) {
    return noPetsOnboarding('money', 'Aún no hay gastos que mostrar', 'Registra una mascota primero para empezar a llevar el control de sus gastos veterinarios, alimentación y más.');
  }
  const allExpenses = getFinanceExpenses();
  const pets = state.pets;
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  // Filtros activos
  const petFilter  = state.finPet    || '';
  const period     = state.finPeriod || 'mensual';
  const viewMode   = state.finView   || 'listado';

  // Gastos filtrados por mascota
  const expenses = petFilter ? allExpenses.filter(e => e.pet === petFilter) : allExpenses;

  const total      = expenses.reduce((s,e) => s + Number(e.amount||0), 0);
  const monthTotal = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s,e) => s + Number(e.amount||0), 0);
  const catColors  = { Veterinaria:'#8b5cf6', Medicamentos:'#06b6d4', Alimentación:'#f59e0b', Peluquería:'#ec4899', Hotel:'#10b981', Otro:'#6b7280' };

  // Construir períodos para el gráfico
  function buildPeriods() {
    if (period === 'mensual') {
      return Array.from({length:6}, (_,i) => {
        const d = new Date(today.getFullYear(), today.getMonth()-5+i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        return { label: d.toLocaleDateString('es-CL',{month:'short', year:'2-digit'}), key, match: e => e.date?.startsWith(key) };
      });
    }
    if (period === 'trimestral') {
      return Array.from({length:4}, (_,i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (3-i)*3, 1);
        const q = Math.floor(d.getMonth()/3)+1;
        const months = [0,1,2].map(m => `${d.getFullYear()}-${String(d.getMonth()+m+1).padStart(2,'0')}`);
        return { label: `Q${q} ${d.getFullYear()}`, match: e => months.some(m => e.date?.startsWith(m)) };
      });
    }
    if (period === 'semestral') {
      return Array.from({length:4}, (_,i) => {
        const offset = (3-i)*6;
        const d = new Date(today.getFullYear(), today.getMonth()-offset, 1);
        const sem = d.getMonth() < 6 ? 1 : 2;
        const baseMonth = sem === 1 ? 0 : 6;
        const months = Array.from({length:6}, (_,m) => `${d.getFullYear()}-${String(baseMonth+m+1).padStart(2,'0')}`);
        return { label: `S${sem} ${d.getFullYear()}`, match: e => months.some(m => e.date?.startsWith(m)) };
      });
    }
    if (period === 'anual') {
      return Array.from({length:4}, (_,i) => {
        const y = today.getFullYear() - (3-i);
        return { label: `${y}`, match: e => e.date?.startsWith(`${y}`) };
      });
    }
    return [];
  }

  const periods = buildPeriods();

  setTimeout(() => {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;
    if (window.chartInstance) window.chartInstance.destroy();

    if (petFilter) {
      // Gráfico de una mascota: una sola serie
      window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: periods.map(p => p.label),
          datasets: [{ label: petFilter, data: periods.map(p => expenses.filter(p.match).reduce((s,e)=>s+Number(e.amount||0),0)),
            backgroundColor: '#8b5cf6', borderRadius: 8 }]
        },
        options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ ticks:{ callback: v=>'$'+v.toLocaleString('es-CL') } } } }
      });
    } else {
      // Gráfico con todas las mascotas: una serie por mascota + colores
      const petColors = ['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#10b981','#ef4444','#6366f1','#84cc16'];
      const petsWithExp = pets.filter(p => allExpenses.some(e => e.pet === p.name));
      const datasets = petsWithExp.length > 0
        ? petsWithExp.map((p, i) => ({
            label: p.name,
            data: periods.map(pr => allExpenses.filter(e => e.pet===p.name && pr.match(e)).reduce((s,e)=>s+Number(e.amount||0),0)),
            backgroundColor: petColors[i % petColors.length], borderRadius: 6,
          }))
        : [{ label: 'Todos', data: periods.map(p => expenses.filter(p.match).reduce((s,e)=>s+Number(e.amount||0),0)),
            backgroundColor: '#8b5cf6', borderRadius: 8 }];
      window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: periods.map(p => p.label), datasets },
        options: { responsive:true, plugins:{ legend:{ display: petsWithExp.length > 1 } },
          scales:{ x:{ stacked: false }, y:{ ticks:{ callback: v=>'$'+v.toLocaleString('es-CL') } } } }
      });
    }
  }, 100);

  return appShell(`
    ${pageHeader('Finanzas', 'Control de gastos por mascota',
      `<button onclick="openExpenseModal()" class="btn-primary flex items-center gap-1.5">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
         <span>Registrar gasto</span>
       </button>`)}

    <!-- Filtros -->
    <div class="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Selector mascota -->
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Mascota</span>
          <select onchange="state.finPet=this.value;render()" class="input-field text-sm py-1.5" style="width:auto;min-width:130px">
            <option value="">Todas</option>
            ${pets.map(p=>`<option ${petFilter===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}
          </select>
        </div>
        <!-- Vista toggle -->
        <div class="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-medium ml-auto">
          ${['listado','grafico'].map(m=>`
            <button onclick="state.finView='${m}';render()"
              class="px-3 py-1.5 transition-colors ${viewMode===m?'bg-brand-600 text-white':'text-gray-500 hover:bg-gray-50'}">
              ${m==='listado'?icon('menu','w-3.5 h-3.5 inline align-text-bottom')+' Lista':icon('chartBar','w-3.5 h-3.5 inline align-text-bottom')+' Gráfico'}
            </button>`).join('')}
        </div>
      </div>
      <!-- Período (segunda fila en móvil, inline en desktop) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Período</span>
        <div class="flex rounded-xl overflow-hidden border border-gray-200 text-xs md:text-sm font-medium">
          ${['mensual','trimestral','semestral','anual'].map(p=>`
            <button onclick="state.finPeriod='${p}';render()"
              class="px-2.5 md:px-3 py-1.5 transition-colors ${period===p?'bg-brand-600 text-white':'text-gray-500 hover:bg-gray-50'}">
              <span class="md:hidden">${{mensual:'Mensual',trimestral:'Trimest.',semestral:'Semest.',anual:'Anual'}[p]}</span>
              <span class="hidden md:inline">${{mensual:'Mensual',trimestral:'Trimestral',semestral:'Semestral',anual:'Anual'}[p]}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>

    <!-- Widgets -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
      ${statCard(icon('money','w-5 h-5 md:w-6 md:h-6'),'Total '+(petFilter||'todas'), fmtCLP(total), 'brand')}
      ${statCard(icon('calendar','w-5 h-5 md:w-6 md:h-6'),'Este mes', fmtCLP(monthTotal), 'teal')}
      ${statCard(icon('receipt','w-5 h-5 md:w-6 md:h-6'),'Registros', expenses.length, 'amber')}
      ${statCard(icon('paw','w-5 h-5 md:w-6 md:h-6'),'Mascotas', pets.length, 'brand')}
    </div>

    ${viewMode === 'grafico' ? `
    <!-- GRÁFICO -->
    <div class="grid md:grid-cols-3 gap-6 mb-6">
      <div class="md:col-span-2 bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-700 mb-1">Gastos ${period} ${petFilter ? '· '+petFilter : '· Todas las mascotas'}</h3>
        <p class="text-xs text-gray-400 mb-4">${{mensual:'Últimos 6 meses',trimestral:'Últimos 4 trimestres',semestral:'Últimos 4 semestres',anual:'Últimos 4 años'}[period]}</p>
        <canvas id="expenses-chart" height="220"></canvas>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Por categoría</h3>
        ${Object.keys(catColors).map(cat => {
          const catTotal = expenses.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);
          const pct = total > 0 ? Math.round(catTotal/total*100) : 0;
          if (!catTotal) return '';
          return `<div class="mb-3">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-600">${cat}</span>
              <span class="font-semibold text-gray-800">${fmtCLP(catTotal)}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="h-2 rounded-full" style="width:${pct}%;background:${catColors[cat]}"></div>
            </div>
          </div>`;
        }).join('')}
        ${total===0?'<p class="text-xs text-gray-400 text-center py-4">Sin datos</p>':''}
        ${pets.length > 1 && !petFilter ? `
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="text-xs font-semibold text-gray-400 mb-2">Por mascota</div>
          ${pets.map(p => {
            const pt = allExpenses.filter(e=>e.pet===p.name).reduce((s,e)=>s+Number(e.amount||0),0);
            if (!pt) return '';
            const pct = total>0?Math.round(pt/total*100):0;
            return `<div class="mb-2">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-600">${speciesEmoji(p.species)} ${esc(p.name)}</span>
                <span class="font-semibold">${fmtCLP(pt)}</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-1.5">
                <div class="h-1.5 rounded-full bg-brand-400" style="width:${pct}%"></div>
              </div>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>
    </div>` : `
    <!-- LISTADO -->
    ${(() => {
      const sorted = [...expenses].sort((a,b)=>b.date>a.date?1:-1);
      const { items: expPage, total: expTotal, pages: expPages, page: expPage_ } = paginate(sorted, 'finance');
      return `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold text-gray-800">Historial de gastos${petFilter?' · '+petFilter:''}</h3>
            <p class="text-xs text-gray-400 mt-0.5">${expTotal} registro${expTotal!==1?'s':''} · Total ${fmtCLP(total)}</p>
          </div>
        </div>
        ${expTotal === 0
          ? emptyState('money','Sin gastos registrados','Comienza a registrar los gastos de tus mascotas')
          : `<div class="overflow-x-auto -mx-5 px-5">
               <table class="w-full text-sm min-w-[540px]">
                 <thead>
                   <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                     <th class="pb-3 font-semibold">Fecha</th>
                     <th class="pb-3 font-semibold">Descripción</th>
                     <th class="pb-3 font-semibold">Mascota</th>
                     <th class="pb-3 font-semibold">Categoría</th>
                     <th class="pb-3 font-semibold text-right">Monto</th>
                     <th class="pb-3 w-8"></th>
                   </tr>
                 </thead>
                 <tbody>
                   ${expPage.map(e => `
                     <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                       <td class="py-3 text-gray-400 whitespace-nowrap text-xs">${formatDate(e.date)}</td>
                       <td class="py-3 font-medium text-gray-800 max-w-[200px]">
                         <span class="truncate block">${esc(e.description)}</span>
                         ${e.source && e.source !== 'manual' ? `<span class="text-[10px] text-gray-400">Automático · ficha de la mascota</span>` : ''}
                       </td>
                       <td class="py-3 text-gray-500 text-xs">${e.pet ? `${speciesEmoji(pets.find(p=>p.name===e.pet)?.species||'')} ${esc(e.pet)}` : '—'}</td>
                       <td class="py-3"><span class="badge text-xs" style="background:${catColors[e.category]+'22'};color:${catColors[e.category]}">${esc(e.category||'—')}</span></td>
                       <td class="py-3 text-right font-bold text-gray-900 whitespace-nowrap">${fmtCLP(e.amount)}</td>
                       <td class="py-3 text-right">
                         ${(!e.source || e.source === 'manual') ? `
                         <button onclick="deleteExpense('${e.id}')"
                           class="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors ml-auto md:opacity-0 md:group-hover:opacity-100">
                           <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                         </button>` : ''}
                       </td>
                     </tr>`).join('')}
                 </tbody>
               </table>
             </div>
             ${pagerHTML('finance', expPages, expPage_)}`}
      </div>`;
    })()}`}

    ${(() => {
      // Predicción de gastos próximo mes
      const last90Days = daysFromNowStr(-90);
      const last90Expenses = allExpenses.filter(e => e.date >= last90Days);
      const last90Amounts = last90Expenses.map(e => Number(e.amount || 0)).filter(a => a > 0);
      if (!last90Amounts.length) return '';
      // Un gasto puntual grande (cirugía, emergencia) no debería inflar la proyección
      // "normal" de gasto mensual: se topa cada gasto a 4x la mediana antes de promediar.
      const sortedAmounts = [...last90Amounts].sort((a, b) => a - b);
      const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
      const cap = medianAmount * 4;
      const hadOutliers = last90Amounts.some(a => a > cap);
      const cappedTotal = last90Amounts.reduce((s, a) => s + Math.min(a, cap), 0);
      const avgMonthly = Math.round(cappedTotal / 3);
      if (avgMonthly === 0) return '';

      // Compare last month vs prev month (maneja el cruce de año con Date en vez de aritmética de string)
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth()+1).padStart(2,'0')}`;
      const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth()+1).padStart(2,'0')}`;
      const lastMonthTotal = allExpenses.filter(e=>e.date?.startsWith(lastMonthStr)).reduce((s,e)=>s+Number(e.amount||0),0);
      const prevMonthTotal = allExpenses.filter(e=>e.date?.startsWith(prevMonthStr)).reduce((s,e)=>s+Number(e.amount||0),0);
      const trend = lastMonthTotal > prevMonthTotal ? '↑' : lastMonthTotal < prevMonthTotal ? '↓' : '→';
      const trendColor = trend==='↑' ? 'text-red-500' : trend==='↓' ? 'text-green-500' : 'text-gray-400';

      return `
      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5 mt-4">
        <h3 class="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">${icon('chartBar','w-4 h-4')} Predicción de gastos</h3>
        <p class="text-xs text-gray-400 mb-3">Basado en los últimos 3 meses${hadOutliers ? ' · excluye el efecto de gastos puntuales grandes' : ''}</p>
        <div class="flex items-center gap-4 flex-wrap">
          <div>
            <div class="text-2xl font-bold text-gray-900">~${fmtCLP(avgMonthly)}</div>
            <div class="text-xs text-gray-500">Proyección próximo mes</div>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-2xl font-bold ${trendColor}">${trend}</span>
            <span class="text-xs text-gray-400">vs mes anterior</span>
          </div>
        </div>
      </div>`;
    })()}
  `);
}

export function openExpenseModal() {
  const pets = state.pets;
  openModal(`
    <div class="modal-box p-4 sm:p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Registrar gasto</h3>
      <form onsubmit="saveExpense(event)" class="space-y-3">
        <div><label class="form-label">Descripción *</label><input id="ex-desc" required placeholder="Ej: Consulta veterinaria" class="input-field" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Monto (CLP) *</label><input id="ex-amount" type="number" required min="0" placeholder="0" class="input-field" /></div>
          <div><label class="form-label">Fecha *</label><input id="ex-date" type="date" required value="${todayStr()}" class="input-field" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Categoría</label>
            <select id="ex-cat" class="input-field">
              <option>Veterinaria</option><option>Medicamentos</option><option>Alimentación</option>
              <option>Peluquería</option><option>Hotel</option><option>Otro</option>
            </select>
          </div>
          <div><label class="form-label">Mascota</label>
            <select id="ex-pet" class="input-field">
              <option value="">General</option>
              ${pets.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="btn-secondary flex-1">Cancelar</button>
          <button type="submit" class="btn-primary flex-1">Guardar</button>
        </div>
      </form>
    </div>`);
}

export async function saveExpense(e) {
  e.preventDefault();
  const g = id => document.getElementById(id)?.value;
  const { data, error } = await sb.from('expenses').insert({
    user_id: state.user.id,
    pet_id: g('ex-pet') || null,
    date: g('ex-date'), category: g('ex-cat'),
    amount: g('ex-amount'), description: g('ex-desc')
  }).select().single();
  if (error) { showToast('Error al guardar gasto', 'error'); return; }
  state.expenses.push({ id: data.id, petId: data.pet_id, pet: state.pets.find(p => p.id === data.pet_id)?.name || null,
    date: data.date, category: data.category, amount: data.amount, description: data.description });
  closeModal(); render();
  showToast('Gasto guardado', 'success');
}

export async function deleteExpense(id) {
  const { error } = await sb.from('expenses').delete().eq('id', id);
  if (error) { showToast('Error al eliminar', 'error'); console.error(error); return; }
  state.expenses = state.expenses.filter(e => e.id !== id); render();
}

if (typeof window !== 'undefined') {
  Object.assign(window, { viewFinance, openExpenseModal, saveExpense, deleteExpense });
}
