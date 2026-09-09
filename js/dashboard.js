/* ============================================================
   MASCOTAPP — Dashboard
   ============================================================
   Fase 2 de la modularización (ver js/utils.js para el porqué de la
   convención export + window.assign). Vista principal tras iniciar sesión:
   alertas, próximos eventos, medicamentos activos, recomendaciones. */

// ---- VISTA: DASHBOARD ----
export function viewDashboard() {
  const pets = state.pets;
  const today = todayStr();
  const dateStr0 = new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  if (pets.length === 0) {
    return appShell(`
      <div class="mb-5">
        <h1 class="text-xl md:text-2xl font-bold text-gray-900">Hola, ${esc(state.user?.name?.split(' ')[0] || 'Tutor')} 👋</h1>
        <p class="text-sm text-gray-400 mt-0.5 capitalize">${dateStr0}</p>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-6 md:p-10 text-center max-w-2xl mx-auto mt-4 md:mt-8">
        <div class="mb-4 flex justify-center text-brand-400">${icon('paw','w-14 h-14')}</div>
        <h2 class="text-lg md:text-xl font-bold text-gray-900 mb-2">Empecemos con tu primera mascota</h2>
        <p class="text-sm text-gray-500 mb-8 max-w-md mx-auto">Regístrala para llevar su ficha de salud, agenda y gastos en un solo lugar. Solo toma un par de minutos.</p>
        <div class="grid sm:grid-cols-3 gap-3 mb-8 text-left">
          <div class="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <div class="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs mb-2">1</div>
            <div class="text-sm font-semibold text-gray-800">Registra tu mascota</div>
            <div class="text-xs text-gray-500 mt-1">Nombre, especie y datos básicos</div>
          </div>
          <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div class="w-7 h-7 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-xs mb-2">2</div>
            <div class="text-sm font-semibold text-gray-800">Añade su primer evento</div>
            <div class="text-xs text-gray-500 mt-1">Una vacuna, control o consulta</div>
          </div>
          <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div class="w-7 h-7 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
            <div class="text-sm font-semibold text-gray-800">Configura recordatorios</div>
            <div class="text-xs text-gray-500 mt-1">Nunca más te olvides de una dosis</div>
          </div>
        </div>
        <button onclick="navigate('addPet')" class="btn-primary px-6 py-3 text-base">+ Registrar mi primera mascota</button>
      </div>
    `);
  }

  const alerts = pets.flatMap(p => [
    ...(p.vaccines || []).filter(v => v.nextDate && careAlertStatus(v.nextDate, v.alertType, v.alertDays).status !== 'al_dia')
      .map(v => ({ ...v, icon: 'flask', status: careAlertStatus(v.nextDate, v.alertType, v.alertDays) })),
    ...(p.deworming || []).filter(d => d.nextDate && careAlertStatus(d.nextDate, d.alertType, d.alertDays).status !== 'al_dia')
      .map(d => ({ ...d, name: d.product, icon: 'bug', status: careAlertStatus(d.nextDate, d.alertType, d.alertDays) })),
    ...(p.medications || []).filter(m => m.endDate && m.endDate <= today)
      .map(m => ({ ...m, icon: 'pill', status: { status: 'vencido', label: 'Tratamiento finalizado', badge: 'bg-red-100 text-red-600' } })),
  ]);
  const overdueCount = alerts.filter(a => a.status.status === 'vencido').length;
  const upcoming = (state.events || []).filter(e => e.date >= today).slice(0, 3);
  const todayMeds = pets.flatMap(p => (p.medications || []).filter(m => m.active));
  const dateStr = new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return appShell(`
    <div class="mb-5">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900">Hola, ${esc(state.user?.name?.split(' ')[0] || 'Tutor')} 👋</h1>
      <p class="text-sm text-gray-400 mt-0.5 capitalize">${dateStr}</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 stagger">
      ${statCard(icon('paw','w-5 h-5 md:w-6 md:h-6'), 'Mascotas', pets.length, 'brand')}
      ${statCard(icon('bell','w-5 h-5 md:w-6 md:h-6'), 'Alertas activas', alerts.length, 'red')}
      ${statCard(icon('calendar','w-5 h-5 md:w-6 md:h-6'), 'Eventos próximos', upcoming.length, 'amber')}
      ${statCard(icon('pill','w-5 h-5 md:w-6 md:h-6'), 'Medicamentos hoy', todayMeds.length, 'teal')}
    </div>

    <div class="grid md:grid-cols-2 gap-4 md:gap-6">
      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Mis Mascotas</h2>
          <button onclick="navigate('pets')" class="text-sm text-brand-600 hover:underline font-medium">Ver todas →</button>
        </div>
        ${pets.length === 0
          ? `<div class="text-center py-8">
               <div class="mb-2 flex justify-center text-gray-300">${icon('paw','w-10 h-10')}</div>
               <p class="text-sm text-gray-400 mb-3">Aún no tienes mascotas registradas</p>
               <button onclick="navigate('addPet')" class="btn-primary text-sm">+ Agregar mascota</button>
             </div>`
          : `<div class="space-y-3">
               ${pets.slice(0, 4).map(p => `
                 <div onclick="openPet('${p.id}')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                   ${petAvatar(p)}
                   <div class="flex-1 min-w-0">
                     <div class="font-medium text-gray-900 text-sm">${esc(p.name)}</div>
                     <div class="text-xs text-gray-400">${p.species} · ${getAge(p.dateOfBirth)}</div>
                   </div>
                   <span class="text-gray-300 text-lg">›</span>
                 </div>`).join('')}
               <button onclick="navigate('addPet')" class="w-full mt-1 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-xl transition-colors font-medium">+ Agregar mascota</button>
             </div>`}
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Próximos eventos</h2>
          <button onclick="navigate('calendar')" class="text-sm text-brand-600 hover:underline font-medium">Ver agenda →</button>
        </div>
        ${upcoming.length === 0
          ? `<div class="text-center py-8">
               <div class="mb-2 flex justify-center text-gray-300">${icon('calendar','w-10 h-10')}</div>
               <p class="text-sm text-gray-400 mb-3">Sin eventos próximos</p>
               <button onclick="navigate('calendar')" class="btn-primary text-sm">Agendar evento</button>
             </div>`
          : upcoming.map(e => `
              <div class="flex items-start gap-3 p-3 rounded-xl border border-gray-100 mb-2">
                <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">${icon(eventIcon(e.type),'w-5 h-5')}</div>
                <div>
                  <div class="text-sm font-medium text-gray-900">${esc(e.title)}</div>
                  <div class="text-xs text-gray-400">${formatDate(e.date)} · ${esc(e.pet || 'Sin mascota')}</div>
                </div>
              </div>`).join('')}
      </div>

      ${alerts.length > 0 ? `
      <div class="md:col-span-2 ${overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'} border rounded-2xl p-5">
        <h2 class="font-semibold ${overdueCount > 0 ? 'text-red-700' : 'text-amber-700'} mb-3 flex items-center gap-1.5">${icon('warning','w-4 h-4')} Alertas${overdueCount > 0 ? ` (${overdueCount} vencida${overdueCount!==1?'s':''})` : ''}</h2>
        <div class="space-y-2">
          ${alerts.slice(0,4).map(a => `
            <div class="flex items-center gap-3 bg-white rounded-xl p-3">
              <span class="text-gray-500">${icon(a.icon,'w-5 h-5')}</span>
              <div class="flex-1"><div class="text-sm font-medium text-gray-800">${esc(a.name)}</div>
              <div class="text-xs text-gray-400">Vence: ${formatDate(a.nextDate || a.endDate)}</div></div>
              <span class="badge ${a.status.badge} text-xs flex-shrink-0">${a.status.label}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
    </div>

    ${(() => {
      // Streaks de medicamentos
      const streakCards = pets.map(p => {
        const activeMeds = (p.medications||[]).filter(m => m.active);
        if (!activeMeds.length) return null;
        const doseLog = p.doseLog || [];
        // Count consecutive days backwards from today
        let streak = 0;
        let checkDate = new Date(today + 'T12:00:00');
        for (let i = 0; i < 365; i++) {
          const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (doseLog.some(dl => dl.date === dateStr && dl.given)) {
            streak++;
            checkDate.setDate(checkDate.getDate()-1);
          } else {
            break;
          }
        }
        return { name: p.name, streak };
      }).filter(Boolean);

      // Próximos cumpleaños (30 días)
      const now = new Date();
      const birthdayPets = pets.map(p => {
        if (!p.dateOfBirth) return null;
        const dob = new Date(p.dateOfBirth + 'T12:00:00');
        const thisYear = now.getFullYear();
        let next = new Date(thisYear, dob.getMonth(), dob.getDate());
        if (next < now) next = new Date(thisYear+1, dob.getMonth(), dob.getDate());
        const diffDays = Math.round((next - now) / 86400000);
        if (diffDays > 30) return null;
        const age = next.getFullYear() - dob.getFullYear();
        return { name: p.name, days: diffDays, age };
      }).filter(Boolean);

      // Recomendaciones inteligentes
      const recs = [];
      pets.forEach(p => {
        const ageYears = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25*86400000)) : 0;
        const lastVaccDate = (p.vaccines||[]).reduce((max,v) => v.date>max?v.date:max, '');
        const vaccineAge = lastVaccDate ? Math.floor((Date.now()-new Date(lastVaccDate).getTime())/(30.44*86400000)) : 999;
        if (p.species === 'Perro' && ageYears >= 7) recs.push({ icon:'flask', text:`${esc(p.name)} tiene ${ageYears} años. Considera análisis de sangre anual para detección temprana.` });
        if (p.species === 'Perro' && (p.breed||'').match(/Golden Retriever|Labrador/i)) recs.push({ icon:'warning', text:`Los ${esc(p.breed)}s son propensos a displasia de cadera. Consulta con tu vet sobre control radiológico.` });
        if (p.species === 'Gato' && ageYears >= 10) recs.push({ icon:'heart', text:`${esc(p.name)} es un gato senior (${ageYears} años). Necesita revisiones veterinarias cada 6 meses.` });
        if (!p.vet?.name) recs.push({ icon:'clipboard', text:`${esc(p.name)} no tiene datos de veterinario. Regístralos para tener acceso rápido en emergencias.` });
        if (vaccineAge >= 12) recs.push({ icon:'flask', text:`${esc(p.name)} lleva más de un año sin registrar vacunas. Revisa el calendario de vacunación.` });
      });

      const shownRecs = recs.slice(0,2);
      const hasExtras = streakCards.length || birthdayPets.length || shownRecs.length;
      if (!hasExtras) return '';

      return `
      <div class="grid md:grid-cols-3 gap-4 mt-4">
        ${streakCards.length ? `
        <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5">
          <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-1.5">${icon('fire','w-4 h-4 text-orange-500')} Rachas de medicamentos</h2>
          <div class="space-y-2">
            ${streakCards.map(s => s.streak > 0
              ? `<div class="flex items-center gap-2 p-2.5 bg-orange-50 rounded-xl">
                   <span class="text-orange-500">${icon('fire','w-5 h-5')}</span>
                   <div><div class="text-sm font-semibold text-gray-800">${esc(s.name)}</div>
                   <div class="text-xs text-orange-600">${s.streak} día${s.streak!==1?'s':''} seguido${s.streak!==1?'s':''} sin saltarse una dosis</div></div>
                 </div>`
              : `<div class="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                   <span class="text-gray-400">${icon('fire','w-5 h-5')}</span>
                   <div class="text-sm text-gray-600">¡Empieza hoy tu racha con ${esc(s.name)}!</div>
                 </div>`
            ).join('')}
          </div>
        </div>` : ''}

        ${birthdayPets.length ? `
        <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5">
          <h2 class="font-semibold text-gray-900 mb-3">🎂 Próximos cumpleaños</h2>
          <div class="space-y-2">
            ${birthdayPets.map(b => `
              <div class="flex items-center gap-2 p-2.5 bg-pink-50 rounded-xl">
                <span class="text-xl">🎂</span>
                <div>
                  <div class="text-sm font-semibold text-gray-800">${esc(b.name)} cumple ${b.age} año${b.age!==1?'s':''}</div>
                  <div class="text-xs text-pink-600">${b.days === 0 ? '¡Hoy es su cumpleaños! 🎉' : `En ${b.days} día${b.days!==1?'s':''}`}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        ${shownRecs.length ? `
        <div class="bg-white rounded-2xl shadow-sm p-4 md:p-5">
          <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-1.5">${icon('idea','w-4 h-4 text-amber-500')} Recomendaciones</h2>
          <div class="space-y-2">
            ${shownRecs.map(r => `
              <div class="flex items-start gap-2 p-2.5 bg-yellow-50 rounded-xl">
                <span class="text-gray-400 flex-shrink-0">${icon(r.icon,'w-5 h-5')}</span>
                <p class="text-xs text-gray-700 leading-snug">${r.text}</p>
              </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
    })()}
  `);
}

if (typeof window !== 'undefined') {
  Object.assign(window, { viewDashboard });
}
