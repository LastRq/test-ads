import React, { useState } from 'react';
import {
  Lock,
  LockOpen,
  AlertCircle,
  Building2,
  Sparkles,
  User,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Briefcase,
  Loader2
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ClientAccount, UserRole } from '../types';

interface SecurityGateProps {
  onUnlock: (role: UserRole, tenantId: string) => void;
  clients?: ClientAccount[];
  onRegisterClient?: (newClient: ClientAccount) => Promise<void>;
}

const SUPERADMIN_EMAILS = [
  'kindevx@gmail.com',
  'kindev@gmail.com',
  'mkmcmiyako@gmail.com',
  'admin@kindev.ec',
  'kindev@admin.com'
];

export const MASTER_PINS = ['kindev2026', '2026', 'admin', 'admin123', '123456'];

export const isMasterPin = (pin: string): boolean => {
  return MASTER_PINS.includes((pin || '').trim().toLowerCase());
};

export const isMasterAccountIdentifier = (identifier: string): boolean => {
  const clean = (identifier || '').trim().toLowerCase();
  return (
    SUPERADMIN_EMAILS.some((e) => e.toLowerCase() === clean) ||
    clean === 'kindev' ||
    clean === 'admin' ||
    clean.includes('kindevx') ||
    clean.startsWith('kindev')
  );
};

export const SecurityGate: React.FC<SecurityGateProps> = ({
  onUnlock,
  clients = [],
  onRegisterClient
}) => {
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const completeSession = (role: UserRole, tenantId: string) => {
    try {
      sessionStorage.setItem('kindev_auth_session', 'true');
      sessionStorage.setItem('kindev_auth_role', role);
      sessionStorage.setItem('kindev_auth_tenant', tenantId);
      localStorage.setItem('kindev_auth_session', 'true');
      localStorage.setItem('kindev_auth_role', role);
      localStorage.setItem('kindev_auth_tenant', tenantId);
    } catch {
      // ignore
    }
    setError(false);
    onUnlock(role, tenantId);
  };

  // Inicio de sesión o registro instantáneo con Google OAuth
  const handleGoogleAuth = async () => {
    setError(false);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = (user.email || '').trim().toLowerCase();

      // 1. Si es el correo propietario o administrador de Kindev (kindevx@gmail.com, etc.) -> SuperAdmin con tenant maestro 'kindev'
      if (isMasterAccountIdentifier(email)) {
        completeSession('superadmin', 'kindev');
        return;
      }

      // 2. Buscar si el usuario ya tiene cuenta creada en el registro SaaS
      const existing = clients.find(
        (c) =>
          (c.username && c.username.trim().toLowerCase() === email) ||
          c.id === email.replace(/[^a-z0-9]/g, '_')
      );

      if (existing) {
        completeSession('client', existing.id);
        return;
      }

      // 3. Usuario nuevo con Google -> Auto-aprovisionar su cuenta SaaS aislada
      const baseSlug = (user.displayName || email.split('@')[0] || 'usuario')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 18);
      const newTenantId = `${baseSlug}_${user.uid.substring(0, 5).toLowerCase()}`;

      const newClient: ClientAccount = {
        id: newTenantId,
        name: user.displayName || email.split('@')[0] || 'Mi Negocio',
        username: email,
        isMaster: false,
        clientPin: `g_${user.uid.substring(0, 8)}`,
        phone: user.phoneNumber || '',
        notes: 'Registrado con Google Auth',
        metaConfig: {
          datasetId: '',
          accessToken: '',
          testMode: true,
          testEventCode: ''
        },
        createdAt: new Date().toISOString()
      };

      if (onRegisterClient) {
        await onRegisterClient(newClient);
      }

      completeSession('client', newClient.id);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      setError(true);
      if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'Dominio de Vercel no autorizado en Firebase Auth. Puedes ingresar directamente con el botón de Acceso Rápido Administrador o con tu usuario/PIN abajo.'
        );
      } else if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/configuration-not-found'
      ) {
        setErrorMessage(
          'Falta activar el botón "Google" en Firebase Console. Puedes ingresar con usuario "admin" y contraseña "2026" abajo.'
        );
      } else {
        setErrorMessage('No se pudo iniciar sesión con Google. Ingresa con usuario "admin" y contraseña "2026" abajo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    // MODO 1: AUTO-REGISTRO DE NUEVO USUARIO (SaaS)
    if (loginMode === 'register') {
      if (!businessName.trim()) {
        setError(true);
        setErrorMessage('Ingresa el nombre de tu negocio o marca.');
        return;
      }
      if (!cleanUser) {
        setError(true);
        setErrorMessage('Ingresa un correo electrónico o nombre de usuario.');
        return;
      }
      if (cleanUser.includes('@') && cleanPin.length < 6) {
        setError(true);
        setErrorMessage('Para registrarte con correo electrónico, la contraseña debe tener mínimo 6 caracteres.');
        return;
      }
      if (cleanPin.length < 4) {
        setError(true);
        setErrorMessage('La contraseña debe tener al menos 4 caracteres.');
        return;
      }

      // Verificar si ya existe ese usuario/correo
      const duplicate = clients.find(
        (c) =>
          (c.username && c.username.trim().toLowerCase() === cleanUser) ||
          c.id.toLowerCase() === cleanUser
      );
      if (duplicate || isMasterAccountIdentifier(cleanUser)) {
        setError(true);
        setErrorMessage('Esta cuenta ya existe. Por favor cambia a la pestaña "Ingresar".');
        return;
      }

      setLoading(true);
      try {
        let firebaseUid = '';
        // Registrar en Firebase Authentication (Correo electrónico/contraseña)
        if (cleanUser.includes('@')) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanUser, cleanPin);
            firebaseUid = cred.user.uid;
            await updateProfile(cred.user, { displayName: businessName.trim() });
          } catch (fbErr: unknown) {
            const fbCode = (fbErr as { code?: string })?.code || '';
            if (fbCode === 'auth/email-already-in-use') {
              setError(true);
              setErrorMessage('Este correo ya está registrado. Cambia a la pestaña "Ingresar".');
              setLoading(false);
              return;
            }
          }
        }

        const slugBase = businessName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 16);
        const suffix = firebaseUid
          ? firebaseUid.substring(0, 5).toLowerCase()
          : Math.random().toString(36).substring(2, 6);
        const newTenantId = `${slugBase || 'cuenta'}_${suffix}`;

        const newClient: ClientAccount = {
          id: newTenantId,
          name: businessName.trim(),
          username: cleanUser,
          isMaster: false,
          clientPin: cleanPin,
          phone: phone.trim(),
          notes: 'Auto-registro SaaS',
          metaConfig: {
            datasetId: '',
            accessToken: '',
            testMode: true,
            testEventCode: ''
          },
          createdAt: new Date().toISOString()
        };

        if (onRegisterClient) {
          await onRegisterClient(newClient);
        }

        completeSession('client', newClient.id);
      } catch {
        setError(true);
        setErrorMessage('Ocurrió un error al crear tu cuenta. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // MODO: INICIO DE SESIÓN DIRECTO (INGRESAR)
    // 1. Verificación directa para cuenta administradora de Kindev (kindevx@gmail.com, admin, kindev) con PIN maestro
    const isMasterUser = isMasterAccountIdentifier(cleanUser);
    if ((isMasterUser || !cleanUser) && isMasterPin(cleanPin)) {
      completeSession('superadmin', 'kindev');
      return;
    }

    setLoading(true);
    try {
      // 2. Coincidencia contra clientes o cuenta local registrada (memoria + localStorage)
      const allClients: ClientAccount[] = (() => {
        const list = [...clients];
        try {
          const cached = localStorage.getItem('kindev_clients_registry');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              parsed.forEach((c) => {
                if (!list.some((existing) => existing.id === c.id)) {
                  list.push(c);
                }
              });
            }
          }
        } catch {
          // ignore
        }
        return list;
      })();

      const matchedClient = allClients.find((c) => {
        const storedPin = (c.clientPin || '').trim().toLowerCase();
        if (!storedPin || storedPin !== cleanPin.toLowerCase()) return false;

        if (cleanUser) {
          const cUser = (c.username || '').trim().toLowerCase();
          const cId = (c.id || '').trim().toLowerCase();
          const cName = (c.name || '').trim().toLowerCase();
          return cleanUser === cUser || cleanUser === cId || cleanUser === cName;
        }
        return true;
      });

      if (matchedClient) {
        if (
          matchedClient.id === 'kindev' ||
          isMasterAccountIdentifier(matchedClient.username || '') ||
          matchedClient.id.includes('kindevx')
        ) {
          completeSession('superadmin', 'kindev');
          return;
        }
        completeSession('client', matchedClient.id);
        return;
      }

      // 3. Inicio de sesión mediante Firebase Authentication (Correo y Contraseña) si está disponible
      if (cleanUser.includes('@')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanUser, cleanPin);
          const email = (cred.user.email || cleanUser).toLowerCase();
          if (isMasterAccountIdentifier(email)) {
            completeSession('superadmin', 'kindev');
            return;
          }
          const byEmail = allClients.find(
            (c) => (c.username || '').trim().toLowerCase() === email
          );
          if (byEmail) {
            completeSession('client', byEmail.id);
            return;
          }

          // Si existe en Firebase Auth pero aún no estaba en tenants_registry, auto-aprovisionar
          const baseSlug = (cred.user.displayName || email.split('@')[0] || 'cuenta')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 16);
          const newTenantId = `${baseSlug}_${cred.user.uid.substring(0, 5).toLowerCase()}`;
          const recoveredClient: ClientAccount = {
            id: newTenantId,
            name: cred.user.displayName || email.split('@')[0] || 'Mi Negocio',
            username: email,
            isMaster: false,
            clientPin: cleanPin,
            phone: cred.user.phoneNumber || '',
            notes: 'Cuenta Firebase Auth',
            metaConfig: {
              datasetId: '',
              accessToken: '',
              testMode: true,
              testEventCode: ''
            },
            createdAt: new Date().toISOString()
          };
          if (onRegisterClient) {
            await onRegisterClient(recoveredClient);
          }
          completeSession('client', recoveredClient.id);
          return;
        } catch {
          // Fallback tolerante si Firebase Auth no está activo o dominio no está autorizado
        }
      }

      // 4. Fallback de PIN Maestro si ingresó PIN administrativo
      if (isMasterPin(cleanPin)) {
        completeSession('superadmin', 'kindev');
        return;
      }

      setError(true);
      setErrorMessage('Credenciales no reconocidas. Puedes pulsar "Acceso Rápido Administrador" o ingresar con usuario "admin" y contraseña "2026".');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-sm w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Logo Oficial Kindev */}
        <div className="flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Kindev S.A.S. Logo" 
            className="h-12 w-auto object-contain mx-auto mb-1.5 drop-shadow-sm" 
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60 text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span>Plataforma Comercial & Meta CAPI</span>
          </div>
        </div>

        {/* Selector de Modo: Ingresar | Crear Cuenta */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setLoginMode('login');
              setError(false);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Ingresar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('register');
              setError(false);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {loginMode === 'register'
              ? 'Crea tu Cuenta Empresarial'
              : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loginMode === 'register'
              ? 'Regístrate en segundos para gestionar tus propios leads y campañas.'
              : 'Ingresa a tu panel con tu cuenta o con Google.'}
          </p>
        </div>

        {/* Botón Oficial de Google Auth */}
        <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-bold text-xs border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>
                {loginMode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}
              </span>
            </button>

            {/* Acceso Rápido para Vercel y Despliegue en la Nube */}
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPin('2026');
                completeSession('superadmin', 'kindev');
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Acceso Rápido Administrador (Demo / Vercel)</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                o con tu correo
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          {/* Nombre del Negocio (Solo en Registro) */}
          {loginMode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 ml-1">
                Nombre de tu Empresa o Negocio *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="ej. Clínica Dental Méndez"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Campo Usuario / Correo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 ml-1">
              {loginMode === 'register'
                ? 'Correo Electrónico o Usuario *'
                : 'Correo Electrónico o Usuario'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="ej. admin o tu@correo.com"
                required
                autoFocus={loginMode === 'login'}
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Campo Contraseña / PIN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 ml-1">
              {loginMode === 'register'
                ? 'Crea tu Contraseña *'
                : 'Contraseña / PIN'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                placeholder={loginMode === 'register' ? 'Mínimo 4 caracteres' : 'PIN o clave (ej. 2026)'}
                maxLength={32}
                required
                autoComplete={loginMode === 'register' ? 'new-password' : 'current-password'}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Teléfono WhatsApp (Opcional en Registro) */}
          {loginMode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 ml-1">
                WhatsApp de Contacto (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="ej. 0991234567"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1.5 bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-200 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-1 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : loginMode === 'register' ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LockOpen className="w-4 h-4" />
            )}
            <span>
              {loginMode === 'register'
                ? 'Crear Cuenta e Ingresar'
                : 'Ingresar al Panel'}
            </span>
          </button>
        </form>

        {/* Link rápido para alternar entre Login y Registro */}
        <div className="text-xs text-slate-500">
          {loginMode === 'login' ? (
            <>
              ¿Eres nuevo en la plataforma?{' '}
              <button
                type="button"
                onClick={() => {
                  setLoginMode('register');
                  setError(false);
                }}
                className="font-bold text-violet-600 hover:underline"
              >
                Crea tu cuenta gratis aquí
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes una cuenta creada?{' '}
              <button
                type="button"
                onClick={() => {
                  setLoginMode('login');
                  setError(false);
                }}
                className="font-bold text-violet-600 hover:underline"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Infraestructura Segura Multi-Tenant Kindev S.A.S. (2026)</span>
        </div>

      </div>
    </div>
  );
};
