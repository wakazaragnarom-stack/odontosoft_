import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Package,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Filter,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { Proveedor } from '../../types';
import {
  getStoreState,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from '../../lib/store';

interface ProveedorDashboardProps {
  tenantId?: string;
}

export const ProveedorDashboard: React.FC<ProveedorDashboardProps> = ({ tenantId }) => {
  const store = getStoreState();
  const proveedores = tenantId
    ? store.proveedores.filter((p) => !p.tenantId || p.tenantId === tenantId)
    : store.proveedores;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Vigente' | 'Vencido' | 'Suspendido'>('Todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formSuministro, setFormSuministro] = useState('');
  const [formEstado, setFormEstado] = useState<'Vigente' | 'Vencido' | 'Suspendido'>('Vigente');
  const [formCorreo, setFormCorreo] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalCount = proveedores.length;
  const vigentesCount = proveedores.filter((p) => p.estado_convenio === 'Vigente').length;
  const vencidosCount = proveedores.filter((p) => p.estado_convenio === 'Vencido').length;
  const suspendidosCount = proveedores.filter((p) => p.estado_convenio === 'Suspendido').length;

  // Filtered list
  const filteredProveedores = proveedores.filter((p) => {
    const matchesSearch =
      p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.suministro.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contacto_asesor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' || p.estado_convenio === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingProveedor(null);
    setFormEmpresa('');
    setFormContacto('');
    setFormTelefono('');
    setFormSuministro('');
    setFormEstado('Vigente');
    setFormCorreo('');
    setFormDireccion('');
    setFormNotas('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Proveedor) => {
    setEditingProveedor(p);
    setFormEmpresa(p.empresa);
    setFormContacto(p.contacto_asesor || '');
    setFormTelefono(p.telefono);
    setFormSuministro(p.suministro);
    setFormEstado(p.estado_convenio);
    setFormCorreo(p.correo || '');
    setFormDireccion(p.direccion || '');
    setFormNotas(p.notas || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmpresa.trim()) {
      setFormError('Por favor ingresa el nombre de la empresa proveedora.');
      return;
    }
    if (!formTelefono.trim()) {
      setFormError('Por favor ingresa el teléfono de contacto comercial.');
      return;
    }
    if (!formSuministro.trim()) {
      setFormError('Por favor especifica los insumos o productos odontológicos suministrados.');
      return;
    }

    if (editingProveedor) {
      updateProveedor(editingProveedor.id, {
        empresa: formEmpresa.trim(),
        contacto_asesor: formContacto.trim(),
        telefono: formTelefono.trim(),
        suministro: formSuministro.trim(),
        estado_convenio: formEstado,
        correo: formCorreo.trim() || undefined,
        direccion: formDireccion.trim() || undefined,
        notas: formNotas.trim() || undefined,
      });
      showToast('✓ Proveedor actualizado con éxito.');
    } else {
      createProveedor({
        tenantId: tenantId || 'tenant-1',
        empresa: formEmpresa.trim(),
        contacto_asesor: formContacto.trim(),
        telefono: formTelefono.trim(),
        suministro: formSuministro.trim(),
        estado_convenio: formEstado,
        fecha_registro: new Date().toISOString().split('T')[0],
        correo: formCorreo.trim() || undefined,
        direccion: formDireccion.trim() || undefined,
        notas: formNotas.trim() || undefined,
      });
      showToast('✓ Nuevo proveedor registrado con éxito.');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProveedor(id);
    setDeleteConfirmId(null);
    showToast('✓ Proveedor eliminado del sistema.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-sky-500/30 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Truck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Gestión de Proveedores e Insumos
              </h1>
              <p className="text-xs text-slate-500">
                Convenios comerciales, insumos clínicos, instrumental y pedidos odontológicos
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Proveedores
            </span>
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Convenios Vigentes
            </span>
            <span className="text-2xl font-black text-emerald-600">{vigentesCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Convenios Suspendidos
            </span>
            <span className="text-2xl font-black text-amber-600">{suspendidosCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Convenios Vencidos
            </span>
            <span className="text-2xl font-black text-rose-600">{vencidosCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por empresa, insumo o asesor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {(['Todos', 'Vigente', 'Suspendido', 'Vencido'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Proveedores Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <th className="p-3.5 pl-5">Empresa / Razón Social</th>
                <th className="p-3.5">Contacto Asesor</th>
                <th className="p-3.5">Teléfono Directo</th>
                <th className="p-3.5">Suministro Principal</th>
                <th className="p-3.5">Estado Convenio</th>
                <th className="p-3.5 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProveedores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No se encontraron proveedores con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProveedores.map((p) => {
                  const whatsappClean = p.telefono.replace(/\D/g, '');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-slate-900 text-sm">{p.empresa}</div>
                        {p.correo && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{p.correo}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {p.contacto_asesor || '—'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800">{p.telefono}</span>
                          {whatsappClean && (
                            <a
                              href={`https://wa.me/${whatsappClean}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="text-slate-700 truncate font-medium" title={p.suministro}>
                          {p.suministro}
                        </div>
                        {p.notas && (
                          <div className="text-[10px] text-slate-400 truncate" title={p.notas}>
                            Nota: {p.notas}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            p.estado_convenio === 'Vigente'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : p.estado_convenio === 'Suspendido'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.estado_convenio === 'Vigente'
                                ? 'bg-emerald-600'
                                : p.estado_convenio === 'Suspendido'
                                ? 'bg-amber-600'
                                : 'bg-rose-600'
                            }`}
                          />
                          {p.estado_convenio}
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-5 space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Editar Proveedor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar Proveedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de convenio comercial e insumos dentales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Empresa / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dental S.A.S o 3M Oral Care"
                  value={formEmpresa}
                  onChange={(e) => setFormEmpresa(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contacto Asesor Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del asesor"
                    value={formContacto}
                    onChange={(e) => setFormContacto(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono Directo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+57 300 123 4567"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Suministro / Insumo Odontológico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Resinas compuestas, brackets, turbinas LED, etc."
                  value={formSuministro}
                  onChange={(e) => setFormSuministro(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estado del Convenio
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) =>
                      setFormEstado(e.target.value as 'Vigente' | 'Vencido' | 'Suspendido')
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-800"
                  >
                    <option value="Vigente">🟢 Vigente</option>
                    <option value="Suspendido">🟡 Suspendido</option>
                    <option value="Vencido">🔴 Vencido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dirección Sede / Despachos
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle 100 # 15-30, Bogotá"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas de Convenio o Descuentos
                </label>
                <textarea
                  rows={2}
                  placeholder="Condiciones de pago, porcentajes de descuento, plazos..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {editingProveedor ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto mb-3 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">¿Eliminar este proveedor?</h4>
            <p className="text-xs text-slate-500 mb-5">
              Esta acción dará de baja el convenio comercial de la base de datos de OdontoSoft.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
