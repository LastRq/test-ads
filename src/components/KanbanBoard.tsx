import React, { useState, useMemo, useEffect } from 'react';
import { 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  PlusCircle,
  Plus,
  Search,
  Maximize2,
  Minimize2,
  DollarSign,
  Pencil,
  Check,
  X,
  Zap,
  Columns3,
  ListFilter
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { CopyPhoneButton } from './CopyPhoneButton';
import { DailyLeadsTracker, DateFilterType, toLocalDateKey } from './DailyLeadsTracker';

interface KanbanBoardProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  onSyncAllCotizados?: () => Promise<void>;
  onOpenSaleModal: (lead: Lead, targetStatus?: 'anticipo' | 'cerrado') => void;
  onOpenLeadProfile: (lead: Lead) => void;
  onAddNewLead: () => void;
  onUpdateName?: (leadId: string, newName: string) => Promise<void>;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

interface ColumnConfig {
  status: LeadStatus;
  title: string;
  badgeBg: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'prospecto',
    title: 'Nuevo Lead',
    badgeBg: 'bg-slate-100 text-slate-800',
    borderColor: 'border-slate-300/80',
    dotColor: 'bg-slate-400',
    description: 'Recién contactado vía WhatsApp'
  },
  {
    status: 'cotizado',
    title: 'Cotizado',
    badgeBg: 'bg-blue-50 text-blue-800',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Propuesta enviada • Purchase a Meta CAPI'
  },
  {
    status: 'anticipo',
    title: 'Pagó Anticipo',
    badgeBg: 'bg-violet-50 text-violet-900',
    borderColor: 'border-violet-200',
    dotColor: 'bg-violet-500',
    description: 'Cliente asegurado • En desarrollo'
  },
  {
    status: 'cerrado',
    title: 'Entregado / Cerrado',
    badgeBg: 'bg-emerald-50 text-emerald-900',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: '100% Pagado & Entregado'
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onUpdateStatus,
  onSyncAllCotizados,
  onOpenSaleModal,
  onOpenLeadProfile,
  onAddNewLead,
  onUpdateName,
  isSidebarCollapsed,
  onToggleSidebarCollapse
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<LeadStatus | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [mobilePage, setMobilePage] = useState<number>(1);
  const [columnPages, setColumnPages] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const KANBAN_PAGE_SIZE = 5;
  const columnsContainerRef = React.useRef<HTMLDivElement>(null);

  // Reiniciar página móvil al cambiar de etapa o filtrar
  useEffect(() => {
    setMobilePage(1);
  }, [activeStageIndex, searchFilter, dateFilter]);

  // Filtrar leads por fecha y búsqueda interna del Kanban
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (dateFilter !== 'all') {
      const todayKey = toLocalDateKey(new Date());
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayKey = toLocalDateKey(yesterdayDate);

      if (dateFilter === 'today') {
        result = result.filter((l) => toLocalDateKey(l.createdAt) === todayKey);
      } else if (dateFilter === 'yesterday') {
        result = result.filter((l) => toLocalDateKey(l.createdAt) === yesterdayKey);
      } else if (dateFilter.startsWith('week:')) {
        const parts = dateFilter.split(':');
        const startKey = parts[1];
        const endKey = parts[2];
        result = result.filter((l) => {
          const k = toLocalDateKey(l.createdAt);
          return k !== null && k >= startKey && k <= endKey;
        });
      } else {
        result = result.filter((l) => toLocalDateKey(l.createdAt) === dateFilter);
      }
    }

    if (!searchFilter.trim()) return result;
    const q = searchFilter.toLowerCase();
    return result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.service.toLowerCase().includes(q) ||
        (l.notes && l.notes.toLowerCase().includes(q))
    );
  }, [leads, searchFilter, dateFilter]);

  // Totales de métricas rápidas del tablero
  const pipelineMetrics = useMemo(() => {
    const closed = leads.filter((l) => l.status === 'cerrado');
    const closedTotal = closed.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const activePipeline = leads.filter((l) => l.status !== 'cerrado' && l.status !== 'descartado');
    const pipelineTotal = activePipeline.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      totalLeads: leads.length,
      closedTotal,
      pipelineTotal,
      activeCount: activePipeline.length
    };
  }, [leads]);

  const getNextStatus = (current: LeadStatus): LeadStatus | null => {
    switch (current) {
      case 'prospecto': return 'cotizado';
      case 'cotizado': return 'anticipo';
      case 'anticipo': return 'cerrado';
      default: return null;
    }
  };

  const getPrevStatus = (current: LeadStatus): LeadStatus | null => {
    switch (current) {
      case 'cerrado': return 'anticipo';
      case 'anticipo': return 'cotizado';
      case 'cotizado': return 'prospecto';
      default: return null;
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (activeDropCol !== status) {
      setActiveDropCol(status);
    }
  };

  const handleDragLeave = () => {
    setActiveDropCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setActiveDropCol(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) return;

    const hasExistingPurchase = lead.metaEvents?.some((ev) => ev.eventName === 'Purchase');

    if (targetStatus === 'anticipo') {
      if (!hasExistingPurchase) {
        onOpenSaleModal(lead, 'anticipo');
      } else {
        await onUpdateStatus(leadId, 'anticipo');
      }
    } else if (targetStatus === 'cerrado') {
      if (!hasExistingPurchase) {
        onOpenSaleModal(lead, 'cerrado');
      } else {
        await onUpdateStatus(leadId, 'cerrado');
      }
    } else {
      await onUpdateStatus(leadId, targetStatus);
    }
    setDraggedLeadId(null);
  };

  const handleStepMove = async (lead: Lead, direction: 'forward' | 'back') => {
    const target = direction === 'forward' ? getNextStatus(lead.status) : getPrevStatus(lead.status);
    if (!target) return;

    const hasExistingPurchase = lead.metaEvents?.some((ev) => ev.eventName === 'Purchase');

    if (target === 'anticipo') {
      if (!hasExistingPurchase) {
        onOpenSaleModal(lead, 'anticipo');
      } else {
        await onUpdateStatus(lead.id, 'anticipo');
      }
    } else if (target === 'cerrado') {
      if (!hasExistingPurchase) {
        onOpenSaleModal(lead, 'cerrado');
      } else {
        await onUpdateStatus(lead.id, 'cerrado');
      }
    } else {
      await onUpdateStatus(lead.id, target);
    }
  };

  const handleStartEditName = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditNameValue(lead.name);
  };

  const handleSaveName = async (leadId: string) => {
    if (!onUpdateName || !editNameValue.trim()) {
      setEditingLeadId(null);
      return;
    }
    try {
      setIsSavingName(true);
      await onUpdateName(leadId, editNameValue.trim());
      setEditingLeadId(null);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingLeadId(null);
    setEditNameValue('');
  };

  // Renderizado limpio de tarjeta individual sin Box-in-Box
  const renderKanbanCard = (lead: Lead, isMobileList = false) => {
    const hasPrev = getPrevStatus(lead.status) !== null;
    const hasNext = getNextStatus(lead.status) !== null;

    return (
      <div
        key={lead.id}
        draggable={!isMobileList && editingLeadId !== lead.id}
        onDragStart={(e) => !isMobileList && handleDragStart(e, lead.id)}
        className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/60 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all space-y-2 sm:space-y-2.5 group cursor-pointer"
        onClick={() => onOpenLeadProfile(lead)}
      >
        {/* Encabezado: Nombre, Edición y Monto */}
        <div className="flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="min-w-0 flex-1">
            {editingLeadId === lead.id ? (
              <div className="flex items-center gap-1.5 my-0.5">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveName(lead.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelEditName();
                    }
                  }}
                  autoFocus
                  disabled={isSavingName}
                  placeholder="Nombre o negocio..."
                  className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleSaveName(lead.id)}
                  disabled={isSavingName || !editNameValue.trim()}
                  className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shrink-0 active:scale-95"
                  title="Guardar nombre"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditName}
                  disabled={isSavingName}
                  className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all shrink-0 active:scale-95"
                  title="Cancelar edición"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-violet-600 transition-colors truncate">
                  {lead.name}
                </span>
                {onUpdateName && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditName(lead);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="Modificar nombre rápido"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Enlace directo a WhatsApp y botón de copiar */}
            <div className="mt-0.5 flex items-center gap-1">
              <a
                href={`https://wa.me/${lead.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-mono font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors py-0.5"
                title="Abrir chat en WhatsApp"
              >
                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>+{lead.phone}</span>
              </a>
              <CopyPhoneButton phone={lead.phone} />
            </div>
          </div>

          {/* Monto del Proyecto (Limpio, tipográfico, sin caja) */}
          <div className="text-right shrink-0">
            <span className="font-mono text-sm font-extrabold text-slate-900 tracking-tight">
              ${Number(lead.amount || 0).toFixed(0)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans ml-1">USD</span>
          </div>
        </div>

        {/* Servicio Cotizado y Notas con Jerarquía Tipográfica */}
        <div className="space-y-1">
          <p className="text-xs text-slate-600 leading-snug line-clamp-1 font-medium">
            {lead.service}
          </p>
          {lead.notes && (
            <p className="text-[11px] text-slate-500 italic line-clamp-2 border-l-2 border-violet-400 pl-2 mt-0.5">
              "{lead.notes.split('\n').filter(Boolean).pop() || lead.notes}"
            </p>
          )}

          {/* Indicadores Meta Ads CAPI (Purchase, FBC, FBP, IP) */}
          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            {lead.metaEvents?.some((ev) => ev.eventName === 'Purchase') ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Purchase CAPI ✓
              </span>
            ) : lead.status === 'cotizado' ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                <Zap className="w-2.5 h-2.5 text-amber-600" />
                Purchase Pendiente
              </span>
            ) : null}

            {(lead.fbc || lead.fbp) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-violet-50 text-violet-700 border border-violet-200/60" title="Atribución Click ID y Browser ID presente">
                {lead.fbc ? 'fbc' : ''}{lead.fbc && lead.fbp ? ' • ' : ''}{lead.fbp ? 'fbp' : ''}
              </span>
            )}
            {lead.clientIp && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-600" title={`IP: ${lead.clientIp}`}>
                IP ✓
              </span>
            )}
          </div>
        </div>

        {/* Controles de Avance Ergonómicos (Sin Box-in-Box) */}
        <div
          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleStepMove(lead, 'back')}
            disabled={!hasPrev}
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-15 disabled:hover:bg-transparent transition-all active:scale-90 shrink-0"
            title="Retroceder etapa"
            aria-label="Retroceder etapa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {lead.status === 'cotizado' ? (
            <button
              type="button"
              onClick={() => {
                const hasExistingPurchase = lead.metaEvents?.some((ev) => ev.eventName === 'Purchase');
                if (!hasExistingPurchase) {
                  onOpenSaleModal(lead, 'anticipo');
                } else {
                  onUpdateStatus(lead.id, 'anticipo');
                }
              }}
              className="flex-1 h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Registrar cobro de anticipo"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pagó Anticipo ➔</span>
            </button>
          ) : lead.status === 'anticipo' ? (
            <button
              type="button"
              onClick={() => {
                const hasExistingPurchase = lead.metaEvents?.some((ev) => ev.eventName === 'Purchase');
                if (!hasExistingPurchase) {
                  onOpenSaleModal(lead, 'cerrado');
                } else {
                  onUpdateStatus(lead.id, 'cerrado');
                }
              }}
              className="flex-1 h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Marcar proyecto como entregado y cerrado"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Entregar Proyecto ➔</span>
            </button>
          ) : lead.status === 'prospecto' ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(lead.id, 'cotizado')}
              className="flex-1 h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Marcar como Cotizado y despachar evento Purchase con todos los metadatos a Meta CAPI para entrenar el algoritmo"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Cotizar & Purchase ➔</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenLeadProfile(lead)}
              className="flex-1 h-7.5 sm:h-8 px-2 rounded-lg text-[11px] sm:text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold transition-all text-center flex items-center justify-center"
            >
              Ver Ficha
            </button>
          )}

          <button
            type="button"
            onClick={() => handleStepMove(lead, 'forward')}
            disabled={!hasNext}
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-15 disabled:hover:bg-transparent transition-all active:scale-90 shrink-0"
            title="Avanzar etapa"
            aria-label="Avanzar etapa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const activeMobileColumn = COLUMNS[activeStageIndex] || COLUMNS[0];
  const activeMobileLeads = filteredLeads.filter((l) => l.status === activeMobileColumn.status);
  const activeMobileTotal = activeMobileLeads.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-4 w-full">
      {/* Barra Superior del Kanban (Diseño Abierto, Sin Box-in-Box) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2">
        
        {/* Título & Métricas Rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Pipeline Kanban
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {leads.length} clientes
            </span>
          </div>

          {/* Facturación Inline (Tipográfica y Limpia) */}
          <div className="hidden md:flex items-center gap-4 pl-3 border-l border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cerrado: <strong className="font-mono text-emerald-700 font-bold">${pipelineMetrics.closedTotal.toFixed(0)} USD</strong></span>
            </div>

            {pipelineMetrics.pipelineTotal > 0 && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>En Proceso: <strong className="font-mono text-amber-700 font-bold">${pipelineMetrics.pipelineTotal.toFixed(0)} USD</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Buscador y Controles de Vista */}
        <div className="flex items-center gap-2">
          {/* Buscador dentro del Kanban */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar cliente o teléfono..."
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-2xs"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Modo de Vista (Columnas vs Lista) */}
          <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en columnas Kanban"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Columnas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en lista compacta"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {/* Toggle de pantalla ancha en escritorio */}
          {onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all border border-slate-200/80 shadow-2xs shrink-0"
              title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral para pantalla completa"}
            >
              {isSidebarCollapsed ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-violet-600" />
                  <span>Pantalla Ancha</span>
                </>
              )}
            </button>
          )}

          {/* Botón "+ Nuevo Contacto" */}
          <button
            type="button"
            onClick={onAddNewLead}
            className="h-9 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm shadow-violet-600/25 hover:shadow-md hover:shadow-violet-600/35 border border-white/20 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-3 h-3 stroke-[2.5] text-white" />
            </div>
            <span className="hidden sm:inline font-bold tracking-tight">Nuevo Lead</span>
            <span className="sm:hidden font-bold tracking-tight">Lead</span>
          </button>
        </div>

      </div>

      {/* ─── CONTADOR DIARIO Y SEMANAL DE LEADS (Hoy vs Ayer + Ritmo Semanal) ─── */}
      <DailyLeadsTracker
        leads={leads}
        selectedFilter={dateFilter}
        onSelectFilter={setDateFilter}
      />

      {/* ─── VISTA MÓVIL: SELECTOR ERGONÓMICO DE ETAPAS & LISTA FLUIDA (sm:hidden) ─── */}
      <div className="sm:hidden space-y-3">
        {/* Segmented Control de Etapas en Móvil */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {COLUMNS.map((col, idx) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.status);
            const isSelected = activeStageIndex === idx;

            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : col.dotColor}`} />
                <span>{col.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold leading-none ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {colLeads.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Banner Informativo de la Etapa Activa en Móvil */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-slate-200/70 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeMobileColumn.dotColor}`} />
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 truncate">
                {activeMobileColumn.title}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {activeMobileColumn.description}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              ${activeMobileTotal.toFixed(0)} USD
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {activeMobileLeads.length} {activeMobileLeads.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>
        </div>

        {activeMobileColumn.status === 'cotizado' && onSyncAllCotizados && (
          (() => {
            const pendingCount = activeMobileLeads.filter(l => !l.metaEvents?.some(e => e.eventName === 'Purchase')).length;
            return pendingCount > 0 ? (
              <button
                type="button"
                onClick={() => onSyncAllCotizados()}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Enviar Purchase CAPI a Cotizados ({pendingCount} pendientes)</span>
              </button>
            ) : null;
          })()
        )}

        {/* Lista Vertical Fluida de Tarjetas para Móvil con Carga Bajo Demanda (5 en 5) */}
        <div className="space-y-2.5 pb-6">
          {activeMobileLeads.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-white/60 space-y-2">
              <p className="text-xs font-semibold text-slate-600">No hay clientes en {activeMobileColumn.title}</p>
              <p className="text-[11px] text-slate-400">
                Selecciona otra etapa arriba o registra un nuevo prospecto.
              </p>
              <button
                type="button"
                onClick={onAddNewLead}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 font-bold text-xs active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Crear Nuevo Lead</span>
              </button>
            </div>
          ) : (
            <>
              {(() => {
                const totalMobilePages = Math.max(1, Math.ceil(activeMobileLeads.length / KANBAN_PAGE_SIZE));
                const currentMobilePage = Math.min(mobilePage, totalMobilePages);
                const paginatedMobileLeads = activeMobileLeads.slice(
                  (currentMobilePage - 1) * KANBAN_PAGE_SIZE,
                  currentMobilePage * KANBAN_PAGE_SIZE
                );

                return (
                  <>
                    <div className="space-y-2.5">
                      {paginatedMobileLeads.map((lead) => renderKanbanCard(lead, true))}
                    </div>

                    {/* Barra de Paginación / Carga Bajo Demanda en Móvil */}
                    {activeMobileLeads.length > KANBAN_PAGE_SIZE && (
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs font-bold text-slate-700 mt-3">
                        <button
                          type="button"
                          disabled={currentMobilePage <= 1}
                          onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 active:scale-95"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Anterior</span>
                        </button>

                        <div className="text-center font-mono">
                          <span className="text-slate-900 font-black">{currentMobilePage}</span>
                          <span className="text-slate-400"> / {totalMobilePages}</span>
                          <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                            {((currentMobilePage - 1) * KANBAN_PAGE_SIZE) + 1}-{Math.min(currentMobilePage * KANBAN_PAGE_SIZE, activeMobileLeads.length)} de {activeMobileLeads.length} leads
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={currentMobilePage >= totalMobilePages}
                          onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 active:scale-95"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ─── VISTA ESCRITORIO: TABLERO KANBAN O LISTA COMPACTA (hidden sm:block) ─── */}
      {viewMode === 'list' ? (
        <div className="hidden sm:block space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Directorio de Contactos</h3>
              <p className="text-xs text-slate-500">Mostrando {filteredLeads.length} contactos bajo el filtro activo</p>
            </div>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200/60 px-3 py-1 rounded-xl font-mono">
              Total: ${filteredLeads.reduce((acc, curr) => acc + (curr.amount || 0), 0).toFixed(0)} USD
            </span>
          </div>
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay contactos con los criterios seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
              {filteredLeads.map((lead) => renderKanbanCard(lead, true))}
            </div>
          )}
        </div>
      ) : (
        <div 
          ref={columnsContainerRef}
          className="hidden sm:flex gap-3 sm:gap-4 items-stretch w-full overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-slate-300"
        >
        {COLUMNS.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.status === col.status);
          const colTotal = colLeads.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          const isDropTarget = activeDropCol === col.status;

          return (
            <div
              key={col.status}
              id={`kanban-col-${col.status}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-2xl border p-3 flex flex-col sm:flex-1 sm:min-w-[280px] xl:min-w-[270px] 2xl:min-w-0 transition-all h-[calc(100vh-190px)] min-h-[560px] ${
                isDropTarget
                  ? 'border-violet-400 bg-violet-50/50 ring-2 ring-violet-500/20'
                  : 'border-slate-200/50 bg-slate-100/40'
              }`}
            >
              {/* Encabezado Fijo de Columna */}
              <div className="pb-2.5 mb-2 border-b border-slate-200/40 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                    <h3 className="font-extrabold text-xs text-slate-900 tracking-tight truncate">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate pr-1">{col.description}</span>
                  {colTotal > 0 && (
                    <span className="font-mono font-bold text-slate-700 shrink-0">
                      ${colTotal.toFixed(0)} USD
                    </span>
                  )}
                </div>

                {col.status === 'cotizado' && onSyncAllCotizados && (
                  (() => {
                    const pendingCount = colLeads.filter(l => !l.metaEvents?.some(e => e.eventName === 'Purchase')).length;
                    return pendingCount > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSyncAllCotizados();
                        }}
                        className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Despachar evento Purchase a Meta Conversions API para todos los cotizados pendientes"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Despachar Purchase ({pendingCount})</span>
                      </button>
                    ) : null;
                  })()
                )}
              </div>

              {/* Área de Tarjetas con Paginación de 5 en 5 y Cero Scroll Infinito */}
              {(() => {
                const colPage = columnPages[col.status] || 1;
                const colTotalPages = Math.max(1, Math.ceil(colLeads.length / KANBAN_PAGE_SIZE));
                const safeColPage = Math.min(colPage, colTotalPages);
                const paginatedColLeads = colLeads.slice(
                  (safeColPage - 1) * KANBAN_PAGE_SIZE,
                  safeColPage * KANBAN_PAGE_SIZE
                );

                return (
                  <>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 mt-1 -mr-1">
                      {colLeads.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200/60 rounded-xl text-slate-400 bg-white/30">
                          <p className="text-xs font-medium text-slate-500">Sin clientes en esta fase</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Arrastra una tarjeta aquí</p>
                        </div>
                      ) : (
                        paginatedColLeads.map((lead) => renderKanbanCard(lead, false))
                      )}
                    </div>

                    {/* Controles de Carga Bajo Demanda (5 en 5) en Columna */}
                    {colLeads.length > KANBAN_PAGE_SIZE && (
                      <div className="pt-2 mt-1 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                        <span className="font-mono text-[10px] text-slate-400">
                          {((safeColPage - 1) * KANBAN_PAGE_SIZE) + 1}-{Math.min(safeColPage * KANBAN_PAGE_SIZE, colLeads.length)} de {colLeads.length}
                        </span>
                        <div className="flex items-center gap-1 font-mono font-bold">
                          <button
                            type="button"
                            disabled={safeColPage <= 1}
                            onClick={() => setColumnPages((prev) => ({ ...prev, [col.status]: safeColPage - 1 }))}
                            className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-20 transition-all cursor-pointer"
                            title="Página anterior"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="px-1 text-slate-800 text-[10px]">{safeColPage}/{colTotalPages}</span>
                          <button
                            type="button"
                            disabled={safeColPage >= colTotalPages}
                            onClick={() => setColumnPages((prev) => ({ ...prev, [col.status]: safeColPage + 1 }))}
                            className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-20 transition-all cursor-pointer"
                            title="Página siguiente"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
