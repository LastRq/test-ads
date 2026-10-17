import React, { useState } from 'react';
import { UserPlus, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatPhoneNumber } from '../lib/meta-capi';
import { isMirandaAccount } from '../lib/presets';

interface LeadFormProps {
  tenantId?: string;
  tenantName?: string;
  onAddLead: (data: {
    name: string;
    phone: string;
    service: string;
    amount?: number;
    isClosedImmediately?: boolean;
    note?: string;
  }) => Promise<void>;
}

export const LeadForm: React.FC<LeadFormProps> = ({ tenantId, tenantName, onAddLead }) => {
  const isMiranda = isMirandaAccount(tenantId, tenantName);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(
    isMiranda ? '⭐ Promoción Campaña Dental ($50 USD)' : 'Web Corporativa Base ($120)'
  );
  const [customPrice, setCustomPrice] = useState(isMiranda ? '50.00' : '120.00');
  const [isClosedImmediately, setIsClosedImmediately] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleServiceChange = (newService: string) => {
    setService(newService);
    // Extracción automática de precio desde la etiqueta del servicio ($XX)
    const match = newService.match(/\$([\d,]+)/);
    if (match) {
      const parsedVal = match[1].replace(/,/g, '');
      const num = parseFloat(parsedVal);
      if (!isNaN(num) && num > 0) {
        setCustomPrice(num.toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = formatPhoneNumber(phone);
    if (!clean) return;

    const parsedPrice = parseFloat(customPrice);
    const validAmount = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0;

    setLoading(true);
    try {
      await onAddLead({
        name: name.trim() || 'Cliente WhatsApp',
        phone: clean,
        service,
        amount: validAmount,
        isClosedImmediately
      });
      setName('');
      setPhone('');
      setIsClosedImmediately(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white/85 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Registrar Cliente de WhatsApp</h2>
            <p className="text-xs text-slate-500">Anota prospectos de WhatsApp o registra ventas con precio personalizado.</p>
          </div>
        </div>

        {/* Checkbox para marcar como cerrado de una vez */}
        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 transition-all select-none self-start sm:self-auto touch-manipulation">
          <input
            type="checkbox"
            checked={isClosedImmediately}
            onChange={(e) => setIsClosedImmediately(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
          <span className={isClosedImmediately ? 'text-emerald-700 font-extrabold' : ''}>
            {isClosedImmediately ? '✓ Ya me compró (Cerrar ahora)' : 'Marcar como venta ya cerrada'}
          </span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Nombre */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cliente</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            required
            maxLength={100}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-sm font-medium transition-all"
          />
        </div>

        {/* Teléfono */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono (WhatsApp)</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0991234567 o +593..."
            required
            maxLength={20}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-sm font-mono transition-all"
          />
        </div>

        {/* Servicio */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isMiranda ? 'Tratamiento / Servicio Dental' : 'Servicio'}
          </label>
          <select
            value={service}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-sm font-medium transition-all cursor-pointer"
          >
            {isMiranda ? (
              <>
                <optgroup label="⭐ Promociones Activas">
                  <option value="⭐ Promoción Campaña Dental ($50 USD)">⭐ Promoción Campaña Dental ($50 USD)</option>
                </optgroup>
                <optgroup label="Diagnóstico & Profilaxis">
                  <option value="Diagnóstico y apertura de HC ($15 USD)">Diagnóstico y apertura de HC ($15 USD)</option>
                  <option value="Profilaxis Básica ($20 USD)">Profilaxis Básica ($20 USD)</option>
                  <option value="Profilaxis Profunda ($25 USD)">Profilaxis Profunda ($25 USD)</option>
                  <option value="Detartraje ($30 USD)">Detartraje ($30 USD)</option>
                </optgroup>
                <optgroup label="Estética & Blanqueamiento">
                  <option value="Blanqueamiento 1 sesión ($50 USD)">Blanqueamiento 1 sesión ($50 USD)</option>
                  <option value="Blanqueamiento 2 sesiones ($90 USD)">Blanqueamiento 2 sesiones ($90 USD)</option>
                  <option value="Blanqueamiento 3 sesiones ($120 USD)">Blanqueamiento 3 sesiones ($120 USD)</option>
                  <option value="Carilla Resina estratificada ($50 USD)">Carilla Resina estratificada ($50 USD)</option>
                  <option value="Carilla Disilicato de Litio ($180 USD)">Carilla Disilicato de Litio ($180 USD)</option>
                  <option value="Carilla Zirconio ($200 USD)">Carilla Zirconio ($200 USD)</option>
                </optgroup>
                <optgroup label="Restauraciones & Prótesis">
                  <option value="Resina Clase 1 ($25 USD)">Resina Clase 1 ($25 USD)</option>
                  <option value="Resina Clase 2, 3, 4 y 5 ($35 USD)">Resina Clase 2, 3, 4 y 5 ($35 USD)</option>
                  <option value="Resina MOD ($45 USD)">Resina MOD ($45 USD)</option>
                  <option value="Biobase o perno de fibra ($30 USD)">Biobase o perno de fibra ($30 USD)</option>
                  <option value="Fibra + everex + biobase ($40 USD)">Fibra + everex + biobase ($40 USD)</option>
                  <option value="Corona de resina impresa ($100 USD)">Corona de resina impresa ($100 USD)</option>
                  <option value="Corona metal porcelana ($150 USD)">Corona metal porcelana ($150 USD)</option>
                  <option value="Corona disilicato de litio ($180 USD)">Corona disilicato ($180 USD)</option>
                  <option value="Corona Zirconio ($200 USD)">Corona Zirconio ($200 USD)</option>
                  <option value="Incrustación Disilicato ($180 USD)">Incrustación Disilicato ($180 USD)</option>
                  <option value="Prótesis flexible ($100 USD)">Prótesis flexible ($100 USD)</option>
                  <option value="Prótesis total ($200 USD)">Prótesis total ($200 USD)</option>
                  <option value="Prótesis Cr Co ($350 USD)">Prótesis Cr Co ($350 USD)</option>
                </optgroup>
                <optgroup label="Cirugías & Endodoncias">
                  <option value="Exodoncia simple ($25 USD)">Exodoncia simple ($25 USD)</option>
                  <option value="Exodoncia compleja ($35 USD)">Exodoncia compleja ($35 USD)</option>
                  <option value="3er molar erupcionado ($40 USD)">3er molar erupcionado ($40 USD)</option>
                  <option value="3er molar impactado o retenido ($120 USD)">3er molar retenido ($120 USD)</option>
                  <option value="Apicectomía ($190 USD)">Apicectomía ($190 USD)</option>
                  <option value="Bichectomía ($300 USD)">Bichectomía ($300 USD)</option>
                  <option value="Endodoncia Uniradicular ($120 USD)">Endodoncia Uniradicular ($120 USD)</option>
                  <option value="Endodoncia 2 o + raíces ($185 USD)">Endodoncia 2 o + raíces ($185 USD)</option>
                  <option value="Endodoncia Retratamiento ($220 USD)">Endodoncia Retratamiento ($220 USD)</option>
                </optgroup>
                <optgroup label="Ortodoncia & Especialidades">
                  <option value="Ortodoncia Convencional ($100 USD)">Ortodoncia Convencional ($100 USD)</option>
                  <option value="Ortodoncia Auto ligado ($200 USD)">Ortodoncia Auto ligado ($200 USD)</option>
                  <option value="Armonía Facial ($150 USD)">Armonía Facial ($150 USD)</option>
                  <option value="Lipopapada ($400 USD)">Lipopapada ($400 USD)</option>
                  <option value="Implante Dental por unidad ($1200 USD)">Implante Dental por unidad ($1,200 USD)</option>
                  <option value="Servicio Dental Personalizado">Otro / Personalizado</option>
                </optgroup>
              </>
            ) : (
              <>
                <option value="Landing Page Express ($60)">Landing Page Express ($60 USD)</option>
                <option value="Web Corporativa Base ($120)">Web Corporativa Base ($120 USD)</option>
                <option value="Web Corporativa Pro ($260)">Web Corporativa Pro ($260 USD)</option>
                <option value="Plataforma Web SaaS ($400+)">Plataforma Web SaaS ($400+ USD)</option>
                <option value="E-commerce ($600+)">E-commerce ($600+ USD)</option>
                <option value="App Móvil ($800+)">App Móvil ($800+ USD)</option>
                <option value="Servicio Personalizado">Otro / Personalizado</option>
              </>
            )}
          </select>
        </div>

        {/* Precio Personalizado */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Precio Personalizado ($ USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="120.00"
              step="0.01"
              min="1"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="lg:col-span-12 flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto h-11 px-6 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] touch-manipulation ${
              isClosedImmediately
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
            }`}
          >
            {isClosedImmediately ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Procesando...' : `Registrar Venta de $${parseFloat(customPrice || '0').toFixed(2)} USD`}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : 'Guardar Lead'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
