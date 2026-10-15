import React from 'react';
import { 
  Columns3, 
  BarChart3, 
  Target, 
  Gem, 
  Clock, 
  Lock, 
  Settings, 
  MessageSquare, 
  X, 
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  UserCheck,
  ListFilter
} from 'lucide-react';
import { TabView, MetaConfig, WhatsAppBotStatus, UserRole } from '../types';
import { META_DATASET_ID } from '../lib/meta-capi';
import { CopyPhoneButton } from './CopyPhoneButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabView;
  onSelectTab: (tab: TabView) => void;
  config: MetaConfig;
  wsStatus: WhatsAppBotStatus;
  kanbanCount: number;
  closedCount: number;
  followUpCount: number;
  firestoreConnected: boolean;
  onOpenConfig: () => void;
  onOpenWsStatus: () => void;
  onLock: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Multi-cliente
  onOpenClientManager?: () => void;
  activeTenantName?: string;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  config,
  wsStatus,
  kanbanCount,
  closedCount,
  followUpCount,
  firestoreConnected,
  onOpenConfig: _onOpenConfig,
  onOpenWsStatus,
  onLock,
  isCollapsed = false,
  onToggleCollapse,
  onOpenClientManager,
  activeTenantName = 'Kindev S.A.S.',
  userRole = 'superadmin'
}) => {
  const isWsConnected = wsStatus.isListening && wsStatus.status === 'connected';

  // Grupos de Navegación con jerarquía clara y sin cajas redundantes
  const navSections = [
    {
      title: 'Operación Comercial',
      items: [
        {
          id: 'kanban' as TabView,
          label: 'Pipeline Kanban',
          description: 'Gestión operativa (95% uso)',
          icon: Columns3,
          badge: kanbanCount > 0 ? String(kanbanCount) : undefined,
          badgeClass: 'bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold'
        },
        {
          id: 'follow_up' as TabView,
          label: 'Centro de Seguimiento',
          description: 'Alertas y plantillas WhatsApp',
          icon: Clock,
          badge: followUpCount > 0 ? String(followUpCount) : undefined,
          badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        },
        {
          id: 'ltv_clients' as TabView,
          label: 'Clientes & Recompra (LTV)',
          description: 'Hostings y segundas fases',
          icon: Gem,
          badge: closedCount > 0 ? String(closedCount) : undefined,
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'quick_list' as TabView,
          label: 'Registro & Directorio',
          description: 'Captura y vista paginada',
          icon: ListFilter,
          badge: undefined
        }
      ]
    },
    {
      title: 'Inteligencia & Analítica',
      items: [
        {
          id: 'ads_intelligence' as TabView,
          label: 'Inteligencia Meta Ads',
          description: 'Ventas, ROAS y Semáforo',
          icon: Target,
          badge: 'ROAS',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold'
        },
        {
          id: 'analytics' as TabView,
          label: 'Métricas Comerciales',
          description: 'Embudo y telemetría de hábitos',
          icon: BarChart3,
          badge: undefined
        }
      ]
    },
    {
      title: 'Sistema & Configuración',
      items: [
        {
          id: 'profile' as TabView,
          label: 'Perfil & Configuración',
          description: 'Producción, CAPI y seguridad',
          icon: UserCheck,
          badge: config.testMode ? 'TEST' : 'PROD',
          badgeClass: config.testMode
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold'
        }
      ]
    }
  ];

  const handleTabClick = (tab: TabView) => {
    onSelectTab(tab);
    onClose(); // Cerrar en móvil al pulsar
  };

  return (
    <>
      {/* Backdrop para móviles con blur ergonómico */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Barra Lateral Principal (Sidebar) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isCollapsed ? 'w-72 lg:w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Cabecera de Identidad & Marca */}
        <div className={`border-b border-slate-800/70 flex items-center justify-between transition-all ${
          isCollapsed ? 'p-3 lg:p-3 lg:justify-center' : 'p-4 sm:p-5'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner flex items-center justify-center shrink-0 p-1.5">
              <img 
                src="/logo.png" 
                alt="Kindev S.A.S." 
                className="w-full h-full object-contain" 
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-white text-base tracking-tight truncate">Kindev Meta Ads</h1>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] text-violet-400 font-semibold tracking-wide truncate">
                    {activeTenantName}
                  </p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            )}
          </div>

          {/* Botón Cerrar en Móvil */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            title="Cerrar panel lateral"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botón Colapsar en Escritorio */}
          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Colapsar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón Descolapsar en Escritorio (Modo Riel) */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center pt-2.5 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tarjeta Ergonómica del Escuchador WhatsApp */}
        <div className={`border-b border-slate-800/60 ${isCollapsed ? 'p-2 lg:p-2' : 'p-3 sm:p-4'}`}>
          <div
            className={`w-full text-left rounded-2xl border transition-all ${
              isCollapsed ? 'p-2.5 flex items-center justify-center' : 'p-3'
            } ${
              isWsConnected
                ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300'
                : wsStatus.status === 'qr_ready'
                ? 'bg-amber-950/25 border-amber-500/30 text-amber-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            {isCollapsed ? (
              <button
                type="button"
                onClick={onOpenWsStatus}
                className="relative flex items-center justify-center cursor-pointer"
                title={isWsConnected ? `WhatsApp Activo (+${wsStatus.user || '593991952889'})` : 'Ver estado WhatsApp'}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className={`w-2 h-2 rounded-full absolute -top-1 -right-1.5 ${
                  isWsConnected ? 'bg-emerald-500' : wsStatus.status === 'qr_ready' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </button>
            ) : (
              <>
                <div 
                  onClick={onOpenWsStatus}
                  className="flex items-center justify-between mb-1.5 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isWsConnected ? 'bg-emerald-500' : wsStatus.status === 'qr_ready' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {isWsConnected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                      )}
                    </div>
                    <span className="font-extrabold text-xs tracking-tight text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isWsConnected ? 'WhatsApp Activo' : wsStatus.status === 'qr_ready' ? 'Escanear QR' : 'WhatsApp Offline'}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="text-[11px] text-slate-400 truncate pl-4 flex items-center justify-between">
                  {isWsConnected ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>Línea: <strong className="text-emerald-400 font-mono">+{wsStatus.user || '593991952889'}</strong></span>
                      <CopyPhoneButton 
                        phone={wsStatus.user || '593991952889'} 
                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-0.5" 
                        iconClassName="w-3 h-3" 
                      />
                    </span>
                  ) : wsStatus.status === 'qr_ready' ? (
                    <button 
                      type="button" 
                      onClick={onOpenWsStatus} 
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Toca para abrir código QR
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={onOpenWsStatus} 
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Servidor apagado o desconectado
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Listado Modular de Navegación */}
        <div className={`flex-1 space-y-4 overflow-y-auto scrollbar-none ${
          isCollapsed ? 'p-2' : 'px-3 py-3 sm:py-4'
        }`}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full rounded-xl transition-all text-xs font-bold active:scale-98 relative group cursor-pointer ${
                      isCollapsed
                        ? 'p-3 flex items-center justify-center'
                        : 'text-left flex items-center justify-between gap-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                    title={item.label}
                  >
                    {isCollapsed ? (
                      <div className="relative flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        {item.badge && (
                          <span className="absolute -top-1.5 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-violet-500 text-white shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          <div className="min-w-0">
                            <span className="block truncate">{item.label}</span>
                            <span className={`block text-[10px] font-normal truncate ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>
                              {item.description}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : item.badgeClass || 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Acceso a Gestión de Clientes SaaS (Solo Superadmin) */}
          {userRole === 'superadmin' && onOpenClientManager && !isCollapsed && (
            <div className="pt-2 border-t border-slate-800/50">
              <button
                type="button"
                onClick={onOpenClientManager}
                className="w-full py-2 px-3 rounded-xl bg-violet-950/20 hover:bg-violet-900/30 border border-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Cuentas de Clientes</span>
                </span>
                <span className="text-[10px] bg-violet-600/50 text-white px-1.5 py-0.5 rounded font-mono">
                  SaaS
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Estado de Infraestructura */}
        {!isCollapsed ? (
          <div className="px-4 py-2.5 text-[11px] space-y-1 border-t border-slate-800/50 bg-slate-950/20">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${firestoreConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>Firestore CRM:</span>
              </span>
              <span className="font-semibold text-slate-300">
                {firestoreConnected ? 'En línea' : 'Local'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>Meta CAPI Dataset:</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                {META_DATASET_ID.slice(0, 8)}...
              </span>
            </div>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center gap-2 border-t border-slate-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Firestore En línea" />
            <span className="w-2 h-2 rounded-full bg-violet-500" title="Meta CAPI Conectado" />
          </div>
        )}

        {/* Footer Ergonómico: Perfil Ejecutivo & Ajustes */}
        <div className={`border-t border-slate-800/70 bg-slate-950/40 transition-all ${
          isCollapsed ? 'p-2 flex flex-col gap-2 items-center' : 'p-3 flex items-center justify-between gap-2'
        }`}>
          {!isCollapsed ? (
            <>
              {/* Tarjeta de Usuario / Perfil interactiva */}
              <button
                type="button"
                onClick={() => handleTabClick('profile')}
                className={`flex-1 flex items-center gap-2.5 p-1.5 rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
                title="Abrir Perfil y Configuración de Producción"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                  KD
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate block">
                      {activeTenantName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full leading-tight ${
                      config.testMode ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {config.testMode ? 'Modo Pruebas' : 'Producción'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Botón Acceso a Configuración y Perfil (Sin Popups) */}
              <button
                type="button"
                onClick={() => handleTabClick('profile')}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                title="Configuración y Producción"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Botón Bloquear Sesión */}
              <button
                type="button"
                onClick={onLock}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all shrink-0 cursor-pointer"
                title="Bloquear sesión"
              >
                <Lock className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleTabClick('profile')}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Perfil y Configuración de Producción"
              >
                <UserCheck className="w-4 h-4 text-violet-400" />
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('profile')}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Configuración y Producción"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLock}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all cursor-pointer"
                title="Bloquear sesión"
              >
                <Lock className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
