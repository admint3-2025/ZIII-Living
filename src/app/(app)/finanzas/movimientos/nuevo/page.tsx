import Link from 'next/link'
import { createFinancialMovement } from '../../actions'
import { getFinanceCatalogs, getFinanceSession } from '../../lib'

export const dynamic = 'force-dynamic'

export default async function NuevoMovimientoFinancieroPage() {
  const { propertyId } = await getFinanceSession(true)
  const catalogs = await getFinanceCatalogs(propertyId)

  const incomeCategories = catalogs.categories.filter((category) => category.type === 'income')
  const expenseCategories = catalogs.categories.filter((category) => category.type === 'expense')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link>
          <span>/</span>
          <Link href="/finanzas/movimientos" className="font-medium transition-colors hover:text-emerald-700">Movimientos</Link>
          <span>/</span>
          <span className="font-semibold text-emerald-700">Nuevo</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Registrar movimiento financiero</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Alta manual de ingresos y egresos con cuenta, referencia, unidad y estatus contable.</p>
      </div>

      <form action={createFinancialMovement} className="grid gap-6 xl:grid-cols-[1.3fr,0.8fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
              <input name="description" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" placeholder="Ej. Pago de cuota Torre A-302" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Monto</label>
              <input name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" placeholder="0.00" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha del movimiento</label>
              <input name="movement_date" type="date" defaultValue={today} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Categoría</label>
              <select name="category_id" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300">
                <option value="">Selecciona una categoría</option>
                <optgroup label="Ingresos">
                  {incomeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </optgroup>
                <optgroup label="Egresos">
                  {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
              <select name="status" defaultValue="confirmed" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300">
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="reconciled">Conciliado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Referencia</label>
              <input name="reference" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" placeholder="Transferencia, folio o cheque" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha límite</label>
              <input name="due_date" type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Cuenta bancaria</label>
              <select name="bank_account_id" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300">
                <option value="">Sin cuenta asociada</option>
                {catalogs.bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_alias}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Unidad</label>
              <select name="unit_id" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300">
                <option value="">Sin unidad asociada</option>
                {catalogs.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_number}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Residente</label>
              <select name="resident_id" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300">
                <option value="">Sin residente asociado</option>
                {catalogs.residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Notas</label>
              <textarea name="notes" rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300" placeholder="Observaciones internas, contexto o aclaraciones" />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#f6fffb_0%,#ffffff_100%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Validación</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>La categoría determina si el movimiento es ingreso o egreso.</li>
              <li>Si se registra con estado confirmado o conciliado y cuenta bancaria, el saldo se actualiza.</li>
              <li>La unidad y el residente son opcionales, pero recomendables para trazabilidad.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold">Acciones</p>
            <div className="mt-4 flex flex-col gap-3">
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Guardar movimiento</button>
              <Link href="/finanzas/movimientos" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-white/5">Cancelar</Link>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
