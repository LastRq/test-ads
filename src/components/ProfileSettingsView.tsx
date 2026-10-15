import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FlaskConical, 
  Zap, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Save, 
  Lock, 
  Server, 
  MessageSquare, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Send,
  Building2,
  RefreshCw,
  Radio,
  Plus,
  Trash2,
  Edit3,
  Terminal,
  QrCode,
  Users,
  CheckCircle
} from 'lucide-react';
import { MetaConfig, WhatsAppBotStatus, UserRole, SystemApisStatus, ClientAccount } from '../types';
import { META_DATASET_ID, getStoredMetaToken, dispatchMetaCAPI, DispatchResult } from '../lib/meta-capi';
import { CopyPhoneButton } from './CopyPhoneButton';

export interface ProfileSettingsViewProps {
  config: MetaConfig;
  onSaveConfig: (newConfig: MetaConfig, newToken?: string) => Promise<void>;
  wsStatus: WhatsAppBotStatus;
  apisStatus?: SystemApisStatus | null;
  onLock: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  activeTenantName?: string;
  totalLeadsCount?: number;
  firestoreConnected?: boolean;
  // Multi-cliente SaaS
  clients?: ClientAccount[];
  activeTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onSaveClient?: (client: ClientAccount) => Promise<void>;
  onDeleteClient?: (clientId: string) => Promise<void>;
  // WhatsApp Actions
  onRefreshWhatsApp?: () => Promise<void>;
  initialTab?: 'production' | 'whatsapp' | 'clients' | 'webhooks' | 'security';
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  config,
  onSaveConfig,
  wsStatus,
  apisStatus,
  onLock,
  onShowToast,
  userRole = 'superadmin',
  activeTenantName = 'Kindev S.A.S.',
  totalLeadsCount = 148,
  firestoreConnected = true,
  clients = [],
  activeTenantId = 'kindev',
  onSelectTenant,
  onSaveClient,
  onDeleteClient,
  onRefreshWhatsApp,
  initialTab = 'production'
}) => {
  const [activeTab, setActiveTab] = useState<'production' | 'whatsapp' | 'clients' | 'webhooks' | 'security'>(initialTab);

  // Sincronizar si cambia initialTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Formulario Meta CAPI
  const [testMode, setTestMode] = useState<boolean>(config.testMode);
  const [testEventCode, setTestEventCode] = useState<string>(config.testEventCode || '');
  const [metaToken, setMetaToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CAPI live test
  const [isTestingCapi, setIsTestingCapi] = useState<boolean>(false);
  const [capiTestResult, setCapiTestResult] = useState<DispatchResult | null>(null);
  const [capiTestError, setCapiTestError] = useState<string | null>(null);

  // WhatsApp in-page actions
  const [isCheckingWs, setIsCheckingWs] = useState<boolean>(false);
  const [isSyncingWs, setIsSyncingWs] = useState<boolean>(false);

  // Gestor Clientes SaaS in-page
  const [clientMode, setClientMode] = useState<'list' | 'form'>('list');
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPin, setClientPin] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDatasetId, setClientDatasetId] = useState('');
  const [clientAccessToken, setClientAccessToken] = useState('');
  const [clientTestMode, setClientTestMode] = useState(true);
  const [clientTestEventCode, setClientTestEventCode] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Inicializar credenciales
  useEffect(() => {
    setTestMode(config.testMode);
    setTestEventCode(config.testEventCode || '');
    setMetaToken(config.accessToken || getStoredMetaToken());
  }, [config]);

  const isWsConnected = wsStatus.isListening && wsStatus.status === 'connected';

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    if (onShowToast) onShowToast('Copiado al portapapeles', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(
        {
          testMode,
          testEventCode: testEventCode.trim(),
          datasetId: META_DATASET_ID
        },
        metaToken.trim()
      );
      if (onShowToast) {
        onShowToast('Configuración y credenciales de Meta actualizadas con éxito', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      if (onShowToast) onShowToast(`Error: ${msg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunLiveCapiTest = async () => {
    setIsTestingCapi(true);
    setCapiTestResult(null);
    setCapiTestError(null);

    try {
      const testPhone = '593991952889';
      const testName = 'Test CAPI Verificación';
      const testEventId = `live_test_${Date.now()}`;

      const res = await dispatchMetaCAPI({
        eventName: 'Lead',
        phone: testPhone,
        name: testName,
        eventId: testEventId,
        actionSource: 'website',
        testEventCode: testMode ? testEventCode.trim() : undefined,
        service: 'Verificación de Diagnóstico en Vivo',
        currency: 'USD',
        value: 0
      });

      if (res && res.eventsReceived !== undefined) {
        setCapiTestResult(res);
        if (onShowToast) {
          onShowToast(`¡Evento CAPI enviado con éxito! Trace ID: ${res.fbtraceId || 'OK'}`, 'success');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo en la conexión CAPI';
      setCapiTestError(msg);
      if (onShowToast) onShowToast(`Error CAPI: ${msg}`, 'error');
    } finally {
      setIsTestingCapi(false);
    }
  };

  const handleCheckWhatsAppStatus = async () => {
    setIsCheckingWs(true);
    try {
      if (onRefreshWhatsApp) {
        await onRefreshWhatsApp();
      } else {
        await fetch('http://localhost:3000/api/whatsapp/status');
      }
      onShowToast?.('Estado de conexión verificado.', 'info');
    } catch {
      onShowToast?.('No se pudo verificar el estado local en el puerto 3000.', 'error');
    } finally {
      setIsCheckingWs(false);
    }
  };

  const handleSyncRetroactive = async () => {
    setIsSyncingWs(true);
    try {
      const res = await fetch('http://localhost:3000/api/whatsapp/sync-retroactive');
      const data = await res.json();
      if (data.success) {
        onShowToast?.(`Sincronización completa: ${data.message || 'Mensajes procesados'}`, 'success');
        if (onRefreshWhatsApp) await onRefreshWhatsApp();
      } else {
        onShowToast?.(data.error || 'No se pudo sincronizar el historial.', 'error');
      }
    } catch {
      onShowToast?.('Servidor local (puerto 3000) no disponible para sincronización.', 'error');
    } finally {
      setIsSyncingWs(false);
    }
  };

  const openNewClientForm = () => {
    setEditingClient(null);
    setClientName('');
    const randomSlug = `cliente_${Date.now().toString(36).substring(3, 8)}`;
    setClientId(randomSlug);
    setClientUsername('');
    setClientPin(`pass${Math.floor(1000 + Math.random() * 9000)}`);
    setClientPhone('');
    setClientDatasetId('');
    setClientAccessToken('');
    setClientTestMode(true);
    setClientTestEventCode('');
    setClientNotes('');
    setClientMode('form');
  };

  const openEditClientForm = (client: ClientAccount) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientId(client.id);
    setClientUsername(client.username || client.id || '');
    setClientPin(client.clientPin || '');
    setClientPhone(client.phone || '');
    setClientDatasetId(client.metaConfig?.datasetId || '');
    setClientAccessToken(client.metaConfig?.accessToken || '');
    setClientTestMode(client.metaConfig?.testMode ?? true);
    setClientTestEventCode(client.metaConfig?.testEventCode || '');
    setClientNotes(client.notes || '');
    setClientMode('form');
  };

  const handleSaveClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      onShowToast?.('El nombre del cliente es obligatorio', 'error');
      return;
    }
    if (!clientId.trim()) {
      onShowToast?.('El identificador es obligatorio', 'error');
      return;
    }
    if (!onSaveClient) return;

    setIsSavingClient(true);
    try {
      const cleanSlug = clientId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const updatedClient: ClientAccount = {
        id: cleanSlug,
        name: clientName.trim(),
        username: (clientUsername.trim() || cleanSlug).toLowerCase(),
        isMaster: editingClient?.isMaster || false,
        clientPin: clientPin.trim(),
        phone: clientPhone.trim(),
        notes: clientNotes.trim(),
        metaConfig: {
          datasetId: clientDatasetId.trim(),
          accessToken: clientAccessToken.trim(),
          testMode: clientTestMode,
          testEventCode: clientTestEventCode.trim()
        },
        createdAt: editingClient?.createdAt || new Date().toISOString()
      };

      await onSaveClient(updatedClient);
      onShowToast?.(
        editingClient ? 'Cliente actualizado correctamente' : 'Nuevo cliente creado con éxito',
        'success'
      );
      setClientMode('list');
    } catch {
      onShowToast?.('Error al guardar cliente', 'error');
    } finally {
      setIsSavingClient(false);
    }
  };

  const copyAccessInfo = (client: ClientAccount) => {
    const loginUser = client.username || client.id;
    const text = `🔐 Accesos al Panel de Meta Ads (${client.name})\n🌐 Enlace: ${typeof window !== 'undefined' ? window.location.origin : ''}\n👤 Usuario: ${loginUser}\n🔑 Contraseña / PIN: ${client.clientPin}\n📊 Dataset ID: ${client.metaConfig.datasetId || 'Pendiente'}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(client.id);
    setTimeout(() => setCopiedKey(null), 2500);
    onShowToast?.('Datos de acceso copiados al portapapeles', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-fadeIn">
      
      {/* 1. Header Ejecutivo del Perfil (Cero Popups, Todo Integrado) */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-40px] top-[-40px] w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-[-40px] bottom-[-40px] w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-violet-500/20 text-violet-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-violet-300 tracking-wider uppercase">
                Panel Central del Sistema
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{activeTenantName}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30 uppercase">
                {userRole}
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Configuración en vivo de Meta Conversions API, servicio de WhatsApp Baileys, clientes SaaS y seguridad sin ventanas emergentes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>

            <button
              type="button"
              onClick={onLock}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Bloquear sesión"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen Rápido de Estado en el Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <Radio className={`w-4 h-4 shrink-0 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-medium">WhatsApp Bot</span>
              <span className="font-bold text-white truncate block">
                {isWsConnected ? `+${wsStatus.user || '593991952889'}` : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <Database className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-medium">Firestore CRM</span>
              <span className="font-bold text-white truncate block">
                {firestoreConnected ? `${totalLeadsCount} Leads` : 'Modo Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-medium">Meta Dataset</span>
              <span className="font-mono font-bold text-white truncate block">
                {META_DATASET_ID.slice(0, 8)}...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <Server className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-medium">Servidor Local</span>
              <span className="font-bold text-white truncate block">
                Puerto 3000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Navegación por Pestañas Integradas (Cero Modales) */}
      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 overflow-x-auto scrollbar-none text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('production')}
          className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeTab === 'production'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <span>Meta CAPI & Producción</span>
          <span className={`w-2 h-2 rounded-full ${testMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Servicio WhatsApp & QR</span>
          {isWsConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </button>

        {userRole === 'superadmin' && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('clients');
              setClientMode('list');
            }}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Gestor de Clientes (SaaS)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700">
              {clients.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeTab === 'webhooks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Webhooks & Endpoints</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span>Seguridad & Sesión</span>
        </button>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: PRODUCCIÓN & META CAPI                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'production' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tarjeta de Modo de Producción vs Pruebas */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-violet-600" />
                    <span>Entorno de Ejecución Meta CAPI</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controla si los eventos de Lead y Compra se envían a producción o al entorno de pruebas.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-13 h-7 bg-emerald-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                </label>
              </div>

              {/* Indicador de Estado Actual */}
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                testMode 
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testMode ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Modo Pruebas (Test Mode) Activo</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Modo Producción Oficial (En Vivo)</span>
                    </>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {testMode
                    ? 'Los eventos solo se visualizan en la pestaña "Probar eventos" de Meta Events Manager con tu TEST_EVENT_CODE. NO afectan reportes ni subastas reales.'
                    : 'Los eventos se reportan en vivo directamente a Meta Ads para entrenar el algoritmo y atribuir conversiones al Pixel oficial.'}
                </p>
              </div>

              {/* Input Código de Prueba */}
              {testMode && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Código de Prueba (TEST_EVENT_CODE de Meta):
                  </label>
                  <input
                    type="text"
                    value={testEventCode}
                    onChange={(e) => setTestEventCode(e.target.value)}
                    placeholder="Ej: TEST92244"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:border-violet-500 focus:outline-hidden transition-all"
                  />
                  <p className="text-[11px] text-slate-500">
                    Copia este código desde: Events Manager &gt; Probar eventos &gt; Servidor.
                  </p>
                </div>
              )}
            </div>

            {/* Tarjeta de Token de Acceso de Meta Graph & Marketing API */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600" />
                    <span>Token de Acceso de Meta (Graph API v19.0)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Token de usuario o sistema con permisos para Conversions API y Marketing Insights.
                  </p>
                </div>

                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-bold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl border border-violet-200 transition-all shrink-0"
                >
                  <span>Graph Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAAB..."
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:border-violet-500 focus:outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('ads_read, read_insights, ads_management, business_management', 'perms')}
                    className="inline-flex items-center gap-1 text-violet-700 hover:text-violet-900 font-semibold"
                  >
                    {copiedKey === 'perms' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Permisos Requeridos</span>
                  </button>

                  <span className="font-mono text-[11px] text-slate-400">
                    Dataset ID: {META_DATASET_ID}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Disparador CAPI & Métricas EMQ */}
          <div className="space-y-6">
            
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Disparador de Prueba CAPI</h4>
                  <p className="text-[11px] text-violet-300">Despacho en tiempo real</p>
                </div>
              </div>

              <p className="text-xs text-violet-200/90 leading-relaxed">
                Envía un evento <code>Lead</code> real con identificadores SHA-256 a Meta Graph API para validar la salud de la sesión y el código de traza (fbtrace_id).
              </p>

              <button
                type="button"
                onClick={handleRunLiveCapiTest}
                disabled={isTestingCapi || !metaToken}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingCapi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando con Meta...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Disparar Evento CAPI Ahora</span>
                  </>
                )}
              </button>

              {capiTestResult && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Conexión Exitosa con Meta CAPI!</span>
                  </div>
                  <div className="font-mono text-[10px] space-y-0.5 text-emerald-100">
                    <div>Eventos recibidos: <strong>{capiTestResult.eventsReceived}</strong></div>
                    <div className="truncate">Trace ID: <strong>{capiTestResult.fbtraceId}</strong></div>
                    <div className="truncate">Event ID: <strong>{capiTestResult.eventId}</strong></div>
                  </div>
                </div>
              )}

              {capiTestError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Error en la verificación:</span>
                  </div>
                  <p className="text-[11px] text-rose-100 leading-tight">
                    {capiTestError}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                Puntuación de Coincidencia (EMQ)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Teléfono normalizado (ph):</span>
                  <span className="font-bold text-emerald-600">100% (SHA-256)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Nombres y Apellidos (fn, ln):</span>
                  <span className="font-bold text-emerald-600">100% Extracción</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Geolocalización (ct, ec):</span>
                  <span className="font-bold text-emerald-600">Quito / Guayaquil</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Deduplicación Pixel / CAPI:</span>
                  <span className="font-bold text-violet-600">Event ID unificado</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: SERVICIO WHATSAPP & QR (100% IN-PAGE, CERO POPUPS)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Estado de Conexión de WhatsApp */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Línea Activa de WhatsApp</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instancia de WhatsApp Baileys vinculada a la recepción de leads.
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isWsConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isWsConnected ? 'En Línea' : 'Desconectado'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Número Conectado:</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    +{wsStatus.user || '593991952889'}
                    <CopyPhoneButton phone={wsStatus.user || '593991952889'} className="p-1 text-slate-400 hover:text-slate-700" />
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estado de Escucha:</span>
                  <span className="font-semibold text-slate-800">
                    {wsStatus.isListening ? 'Escuchando mensajes entrantes en tiempo real' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Anti-Duplicados:</span>
                  <span className="font-semibold text-emerald-600">Activo (Memoria 24h & Firestore)</span>
                </div>
              </div>

              {/* Botones de Acción de WhatsApp en la misma página */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <a
                  href="http://localhost:3000/qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs active:scale-95 text-center"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Vincular QR</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>

                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  disabled={isCheckingWs}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWs ? 'animate-spin' : ''}`} />
                  <span>Comprobar</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncRetroactive}
                  disabled={isSyncingWs || !isWsConnected}
                  title="Recupera mensajes atrasados recibidos durante desconexión"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWs ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>

            {/* Diagnóstico Backend server.js */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-600" />
                <span>Servicio de Backend (server.js)</span>
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                El servicio local procesa los webhooks de Baileys, guarda los contactos directamente en Firestore y despacha los eventos a Meta Conversions API en segundo plano.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1.5">
                <div>&gt; Puerto activo: <strong>3000</strong></div>
                <div>&gt; Sesión Baileys: <code>auth_baileys/</code></div>
                <div>&gt; Modo tokens: <strong>Carga Dinámica sin reinicio</strong></div>
                <div>&gt; Base de datos: <strong>Google Cloud Firestore</strong></div>
                {apisStatus && (
                  <div>&gt; Mensajes procesados: <strong>{apisStatus.whatsapp?.processedMessages || 0}</strong></div>
                )}
              </div>

              {!isWsConnected && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Terminal className="w-4 h-4 text-amber-700" />
                    ¿Cómo iniciar el servicio si está apagado?
                  </p>
                  <p className="text-amber-900/90 text-[11px] leading-relaxed">
                    Ejecuta el archivo <strong>"Estado-WhatsApp.bat"</strong> o el acceso directo <strong>"Kindev Meta Ads"</strong> en tu escritorio para iniciar la escucha de mensajes.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: GESTOR DE CLIENTES MULTI-TENANT (SAAS) 100% IN-PAGE     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'clients' && userRole === 'superadmin' && (
        <div className="space-y-6">
          
          {/* Header de Clientes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Cuentas Multi-Cliente &amp; Tenants SaaS</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {clients.length} cuentas registradas con aislamiento de datos, PIN y credenciales independientes.
              </p>
            </div>

            {clientMode === 'list' ? (
              <button
                type="button"
                onClick={openNewClientForm}
                className="py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar Nuevo Cliente</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setClientMode('list')}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>Volver al Listado</span>
              </button>
            )}
          </div>

          {/* Modo Formulario de Cliente */}
          {clientMode === 'form' && (
            <form onSubmit={handleSaveClientSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5 animate-scaleIn">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {editingClient ? `Editar Cuenta: ${editingClient.name}` : 'Crear Nueva Cuenta de Cliente'}
                </h4>
                <p className="text-xs text-slate-500">Configura accesos, PIN y credenciales de Meta</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Clínica Dental Méndez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Identificador / Slug único *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingClient}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Ej: clinica_mendez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usuario de Acceso</label>
                  <input
                    type="text"
                    value={clientUsername}
                    onChange={(e) => setClientUsername(e.target.value)}
                    placeholder="Ej: usuario@clinicamendez.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN / Contraseña de Ingreso *</label>
                  <input
                    type="text"
                    required
                    value={clientPin}
                    onChange={(e) => setClientPin(e.target.value)}
                    placeholder="Ej: pass2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej: 593991234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dataset ID de Meta (Opcional)</label>
                  <input
                    type="text"
                    value={clientDatasetId}
                    onChange={(e) => setClientDatasetId(e.target.value)}
                    placeholder="Ej: 1368429478371391"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Token de Acceso de Meta (Graph API)</label>
                  <input
                    type="text"
                    value={clientAccessToken}
                    onChange={(e) => setClientAccessToken(e.target.value)}
                    placeholder="EAAB..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500 font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Modo de Pruebas (Test Mode)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clientTestMode}
                      onChange={(e) => setClientTestMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-emerald-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Notas Internas</label>
                  <textarea
                    rows={2}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Observaciones de la cuenta o contacto del cliente..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClientMode('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingClient ? 'Guardando...' : 'Guardar Cuenta'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Modo Lista de Clientes */}
          {clientMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => {
                const isCurrentActive = activeTenantId === client.id;
                return (
                  <div
                    key={client.id}
                    className={`bg-white rounded-2xl p-5 border transition-all space-y-4 ${
                      isCurrentActive
                        ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{client.name}</h4>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                              Activo Ahora
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {client.id}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditClientForm(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                          title="Editar cuenta"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!client.isMaster && onDeleteClient && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseas eliminar la cuenta ${client.name}?`)) {
                                onDeleteClient(client.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">PIN de acceso:</span>
                        <span className="font-mono font-bold text-slate-800">{client.clientPin || 'Sin PIN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dataset Meta:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[160px]">
                          {client.metaConfig?.datasetId || 'Dataset Global'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Entorno:</span>
                        <span className={`font-bold ${client.metaConfig?.testMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {client.metaConfig?.testMode ? 'Test Mode' : 'Producción'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyAccessInfo(client)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === client.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar Accesos</span>
                      </button>

                      {onSelectTenant && !isCurrentActive && (
                        <button
                          type="button"
                          onClick={() => onSelectTenant(client.id)}
                          className="py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Activar en CRM
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: WEBHOOKS & ENDPOINTS                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              <span>Endpoints de Recepción &amp; Webhooks</span>
            </h3>
            <p className="text-xs text-slate-500">
              Rutas configuradas para recibir leads de formularios de Meta Ads y notificaciones de WhatsApp.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Webhook URL (Producción):</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://api.kindev.lat/api/meta/webhook"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard('https://api.kindev.lat/api/meta/webhook', 'webhookUrl')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all shrink-0 cursor-pointer"
                >
                  {copiedKey === 'webhookUrl' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Verify Token:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="kindev_meta_webhook_2026"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard('kindev_meta_webhook_2026', 'verifyToken')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all shrink-0 cursor-pointer"
                >
                  {copiedKey === 'verifyToken' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 5: SEGURIDAD & SESIÓN                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                <span>Seguridad de Sesión</span>
              </h3>
              <p className="text-xs text-slate-500">
                Gestión del PIN maestro de acceso y aislamiento de cuentas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Rol actual:</span>
                <span className="font-bold text-violet-700 font-mono capitalize">{userRole}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Aislamiento por Tenant:</span>
                <span className="font-bold text-emerald-600">Habilitado</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Sesión activa:</span>
                <span className="font-mono text-slate-500">sessionStorage (Cifrado)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLock}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquear Sesión Ahora</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Integridad del Sistema</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tu aplicación opera con arquitectura reactiva basada en Google Cloud Firestore y deduplicación bimodal de eventos CAPI/Pixel para evitar doble contabilización.
            </p>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cero Ventanas Emergentes</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Toda la administración del sistema está consolidada en esta vista para máxima ergonomía móvil y de escritorio.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
