// Se corre una vez por archivo de test (ver vitest.config.js) ANTES de que se
// evalúen sus imports. js/app.js hace `window.supabase.createClient(...)` en
// su nivel superior — sin este stub, cualquier test que importe js/app.js
// (directa o indirectamente, ej. para reusar canEditPet/blockIfReadOnly)
// rompería al cargar el módulo. Cada test reemplaza `window.sb` por su propio
// mock (ver test/mockSupabase.js) antes de ejercitar código que llama a
// Supabase — este stub solo evita el crash al importar.
window.supabase = { createClient: () => ({}) };
