import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Send, Loader2, Sparkles, Plus, Minus, BookOpen, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Lead } from '../types';
import { 
  getPresetsForTenant, 
  isMirandaAccount, 
  MIRANDA_FULL_CATALOG, 
  DentalCatalogItem 
} from '../lib/presets';
import { CopyPhoneButton } from './CopyPhoneButton';

interface SaleModalProps {
  lead: Lead | null;
  targetStatus?: 'anticipo' | 'cerrado';
  tenantId?: string;
  tenantName?: string;
  onClose: () => void;
  onConfirmSale: (
    leadId: string,
    amount: number,
    note?: string,
    targetStatus?: 'anticipo' | 'cerrado',
    skipCapi?: boolean
  ) => Promise<void>;
}

export const SaleModal: React.FC<SaleModalProps> = ({ 
  lead, 
  targetStatus = 'cerrado', 
  tenantId,
  tenantName,
  onClose, 
  onConfirmSale 
}) => {
  const isMiranda = isMirandaAccount(lead?.tenantId || tenantId, tenantName);
  const presets = getPresetsForTenant(lead?.tenantId || tenantId, tenantName);
  const defaultPrice = isMiranda ? 50 : 120;

  const [amount, setAmount] = useState<number>(defaultPrice);
  const [customInput, setCustomInput] = useState<string>(defaultPrice.toFixed(2));
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchToCapi, setDispatchToCapi] = useState<boolean>(true);
  const [showFullCatalog, setShowFullCatalog] = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      const def = isMiranda ? 50 : 120;
      const initial = lead.amount && lead.amount > 0 ? lead.amount : def;
      setAmount(initial);
      setCustomInput(initial.toFixed(2));
      const initialNote = lead.notes || (isMiranda && (!lead.amount || lead.amount === 50) ? 'Promoción Campaña ($50)' : '');
      setNote(initialNote);
    }
  }, [lead, isMiranda]);

  if (!lead) return null;

  const handleSelectPreset = (presetAmount: number, presetLabel?: string) => {
    setAmount(presetAmount);
    setCustomInput(presetAmount.toFixed(2));
    if (presetLabel && !note) {
      setNote(presetLabel);
    }
  };

  const handleSelectCatalogItem = (item: DentalCatalogItem) => {
    setAmount(item.price);
    setCustomInput(item.price.toFixed(2));
    setNote(`${item.name} ($${item.price})`);
    setShowFullCatalog(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    }
  };

  const adjustAmount = (delta: number) => {
    const current = parseFloat(customInput) || 0;
    const next = Math.max(1, current + delta);
    setAmount(next);
    setCustomInput(next.toFixed(2));
  };

  const handleSubmit = async (skipCapiManual?: boolean) => {
    const finalAmount = parseFloat(customInput);
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    const shouldSkip = skipCapiManual !== undefined ? skipCapiManual : !dispatchToCapi;

    setLoading(true);
    try {
      await onConfirmSale(lead.id, finalAmount, note.trim() || '', targetStatus, shouldSkip);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
      <div className="bg-white border-t sm:border border-slate-200/90 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[92dvh] sm:max-h-[95vh] overflow-y-auto pb-safe sm:pb-7">
        
        {/* Indicador de arrastre táctil para móvil */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100 active:scale-95"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div>
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xl mb-2.5 sm:mb-3 shadow-xs border ${
            targetStatus === 'anticipo'
              ? 'bg-violet-50 text-violet-600 border-violet-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {targetStatus === 'anticipo' ? 'Registrar Anticipo & Enviar Purchase a Meta' : 'Cerrar Venta & Enviar a Meta'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            {targetStatus === 'anticipo' 
              ? 'Cliente asegurado. El evento Purchase se despachará de inmediato para acelerar el entrenamiento del algoritmo.' 
              : 'El proyecto se marcará como cerrado y el evento Purchase se despachará a Meta CAPI.'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 font-semibold">
            <span>Cliente: <span className="font-bold text-slate-900">{lead.name}</span> (+<span className="font-mono text-slate-700">{lead.phone}</span>)</span>
            <CopyPhoneButton phone={lead.phone} />
          </div>
        </div>

        {/* Campo de Precio Personalizado Principal */}
        <div className="bg-emerald-50/50 border border-emerald-500/25 rounded-2xl p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Monto de Venta Personalizable</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black text-slate-400">$</span>
            <input
              type="number"
              value={customInput}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="1"
              autoFocus
              className="text-3xl md:text-4xl font-black text-emerald-600 bg-transparent text-center focus:outline-none w-44 font-mono border-b-2 border-emerald-400 focus:border-emerald-600 py-0.5 transition-all"
            />
            <span className="text-sm font-bold text-slate-500">USD</span>
          </div>

          {/* Botones de micro-ajuste rápido ergonómicos */}
          <div className="flex items-center justify-center gap-1.5 pt-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => adjustAmount(-50)}
              className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 active:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 shadow-xs transition-all flex items-center gap-0.5"
            >
              <Minus className="w-2.5 h-2.5" />50
            </button>
            <button
              type="button"
              onClick={() => adjustAmount(-10)}
              className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 active:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 shadow-xs transition-all flex items-center gap-0.5"
            >
              <Minus className="w-2.5 h-2.5" />10
            </button>
            <button
              type="button"
              onClick={() => adjustAmount(+10)}
              className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 active:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 shadow-xs transition-all flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5" />10
            </button>
            <button
              type="button"
              onClick={() => adjustAmount(+50)}
              className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 active:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 shadow-xs transition-all flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5" />50
            </button>
            <button
              type="button"
              onClick={() => adjustAmount(+100)}
              className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 active:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 shadow-xs transition-all flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5" />100
            </button>
          </div>
        </div>

        {/* Tarifas Oficiales (Kindev o Miranda según la cuenta activa) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>{isMiranda ? 'Tarifas Clave Miranda Dental Studio' : 'Tarifas Base Kindev 2026'}</span>
            </label>
            {isMiranda && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                ⭐ Promo $50 Activa
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isSelected = Math.abs(amount - preset.amount) < 0.01;
              const isPromo50 = isMiranda && preset.amount === 50 && preset.badge?.includes('50');
              return (
                <button
                  key={`${preset.label}-${preset.amount}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset.amount, `${preset.label} ($${preset.amount})`)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                      : isPromo50
                      ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-slate-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{preset.label}</span>
                    {preset.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isPromo50 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">
                    ${preset.amount} USD
                  </div>
                </button>
              );
            })}
          </div>

          {/* Catálogo Completo Dental Expandible para Miranda */}
          {isMiranda && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFullCatalog(!showFullCatalog)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Ver Catálogo Completo Odontológico (12 Especialidades)</span>
                </div>
                {showFullCatalog ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showFullCatalog && (
                <div className="mt-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto space-y-3">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Toca cualquier tratamiento del Dr. Miranda para cargar automáticamente su precio y concepto:
                  </p>
                  {MIRANDA_FULL_CATALOG.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                        {cat.category}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cat.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectCatalogItem(item)}
                            className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-950 truncate">
                                {item.name}
                              </span>
                              <span className="text-xs font-mono font-black text-emerald-600 shrink-0">
                                ${item.price}
                              </span>
                            </div>
                            {item.detail && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.detail}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalle / Concepto Opcional */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Detalle o Concepto (Opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isMiranda ? "Ej. Promoción Campaña $50, Profilaxis, Resina, etc." : "Ej. Anticipo 50%, Web Corporativa + Hosting, etc."}
            maxLength={120}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>

        {/* Selector de Modo: Automático Meta CAPI o Manual */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex flex-col pr-2">
            <span className="font-extrabold text-slate-800">
              Despachar a Meta CAPI
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {dispatchToCapi
                ? 'Se transmitirá el evento Purchase a Meta Ads'
                : 'Modo 100% manual (sin conexión externa con Meta)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDispatchToCapi(!dispatchToCapi)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
              dispatchToCapi
                ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {dispatchToCapi ? 'CAPI Activo' : 'Solo Manual'}
          </button>
        </div>

        {/* Botón de Confirmación Principal */}
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading || isNaN(parseFloat(customInput)) || parseFloat(customInput) <= 0}
          className={`w-full py-3.5 px-4 rounded-2xl active:scale-[0.98] text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
            targetStatus === 'anticipo'
              ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{dispatchToCapi ? 'Procesando y Despachando...' : 'Guardando Anticipo...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {targetStatus === 'anticipo'
                  ? dispatchToCapi
                    ? `Confirmar Anticipo ($${parseFloat(customInput || '0').toFixed(2)} USD) & Despachar CAPI`
                    : `Confirmar Anticipo ($${parseFloat(customInput || '0').toFixed(2)} USD) Manualmente`
                  : dispatchToCapi
                    ? `Enviar $${parseFloat(customInput || '0').toFixed(2)} USD a Meta CAPI`
                    : `Cerrar Venta ($${parseFloat(customInput || '0').toFixed(2)} USD) Manualmente`}
              </span>
            </>
          )}
        </button>

        {/* Opción rápida: Registrar 100% manual si CAPI está activo */}
        {dispatchToCapi && !loading && (
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold py-1 transition-colors"
          >
            O registrar {targetStatus === 'anticipo' ? 'anticipo' : 'venta'} directamente de forma manual (sin Meta)
          </button>
        )}

      </div>
    </div>
  );
};
