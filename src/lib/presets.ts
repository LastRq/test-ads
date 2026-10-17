import { PricingPreset } from '../types';

export const KINDEV_PRESETS: PricingPreset[] = [
  {
    label: 'Landing Express',
    amount: 60,
    subtitle: '1 Página • Alta Conversión',
    badge: 'Express'
  },
  {
    label: 'Web Corp. Base',
    amount: 120,
    subtitle: 'Corporativa • Portafolio',
    badge: 'Popular'
  },
  {
    label: 'Web Corp. Pro',
    amount: 260,
    subtitle: 'Full Stack • CMS Integrado',
    badge: 'Pro'
  },
  {
    label: 'Plataforma SaaS',
    amount: 400,
    subtitle: 'Panel Usuarios • Base de Datos',
    badge: 'SaaS'
  },
  {
    label: 'E-commerce',
    amount: 600,
    subtitle: 'Tienda Online • Pagos',
    badge: 'Tienda'
  },
  {
    label: 'App Móvil',
    amount: 800,
    subtitle: 'iOS / Android Híbrida',
    badge: 'Mobile'
  }
];

// Presets oficiales para Dr. Gabriel Miranda (Miranda Dental Studio)
export const MIRANDA_PRESETS: PricingPreset[] = [
  {
    label: '⭐ Promoción Campaña',
    amount: 50,
    subtitle: 'Promoción Activa • Mayoría Leads',
    badge: 'Promo $50'
  },
  {
    label: 'Diagnóstico & HC',
    amount: 15,
    subtitle: 'Diagnóstico + Apertura de HC',
    badge: 'Diagnóstico'
  },
  {
    label: 'Profilaxis Básica',
    amount: 20,
    subtitle: 'Higiene & Limpieza Dental',
    badge: 'Profilaxis'
  },
  {
    label: 'Resina Restauración',
    amount: 35,
    subtitle: 'Clase 2, 3, 4 y 5',
    badge: 'Resina'
  },
  {
    label: 'Blanqueamiento 1S',
    amount: 50,
    subtitle: '1 Sesión en Consultorio',
    badge: 'Estética'
  },
  {
    label: 'Ortodoncia Entrada',
    amount: 100,
    subtitle: 'Tratamiento con Especialista',
    badge: 'Ortodoncia'
  },
  {
    label: 'Coronas Disilicato',
    amount: 180,
    subtitle: 'Rehabilitación Oral c/u',
    badge: 'Coronas'
  },
  {
    label: 'Implante Dental',
    amount: 1200,
    subtitle: 'Implante Unitario Completo',
    badge: 'Implantes'
  }
];

export interface DentalCatalogItem {
  id: string;
  name: string;
  price: number;
  detail?: string;
  badge?: string;
}

export interface DentalCategory {
  category: string;
  items: DentalCatalogItem[];
}

// Catálogo Completo Oficial de Miranda Dental Studio (Extraído del Tarifario de Consultorio)
export const MIRANDA_FULL_CATALOG: DentalCategory[] = [
  {
    category: '⭐ Promoción Especial Activa',
    items: [
      {
        id: 'promo_50',
        name: 'Promoción Campaña Dental',
        price: 50,
        detail: 'Campaña publicitaria activa Meta Ads ($50 USD)',
        badge: 'Campaña'
      }
    ]
  },
  {
    category: 'Diagnóstico y Apertura de HC',
    items: [
      {
        id: 'diag_hc',
        name: 'Diagnóstico y apertura de HC',
        price: 15,
        detail: 'Evaluación y ficha odontológica'
      }
    ]
  },
  {
    category: 'Profilaxis',
    items: [
      {
        id: 'prof_basica',
        name: 'Profilaxis Básica',
        price: 20,
        detail: 'Higiene bucal y profilaxis dental'
      },
      {
        id: 'prof_profunda',
        name: 'Profilaxis Profunda',
        price: 25,
        detail: 'Limpieza profunda periodontal'
      },
      {
        id: 'prof_detartraje',
        name: 'Detartraje',
        price: 30,
        detail: 'Eliminación ultrasónica de sarro'
      }
    ]
  },
  {
    category: 'Blanqueamiento',
    items: [
      {
        id: 'blanq_1',
        name: 'Blanqueamiento (1 sesión)',
        price: 50,
        detail: '1 sesión clínica en consultorio'
      },
      {
        id: 'blanq_2',
        name: 'Blanqueamiento (2 sesiones)',
        price: 90,
        detail: '2 sesiones para tono óptimo'
      },
      {
        id: 'blanq_3',
        name: 'Blanqueamiento (3 sesiones)',
        price: 120,
        detail: 'Tratamiento completo intensivo'
      }
    ]
  },
  {
    category: 'Resinas Restauraciones',
    items: [
      {
        id: 'res_clase1',
        name: 'Resina Clase 1',
        price: 25,
        detail: 'Superficie oclusal simple'
      },
      {
        id: 'res_clase2345',
        name: 'Resina Clase 2, 3, 4 y 5',
        price: 35,
        detail: 'Superficies interproximales o estéticas'
      },
      {
        id: 'res_mod',
        name: 'Resina MOD',
        price: 45,
        detail: 'Mesio-ocluso-distal 3 superficies'
      },
      {
        id: 'res_biobase',
        name: 'Biobase o perno de fibra',
        price: 30,
        detail: 'Reconstrucción de muñón'
      },
      {
        id: 'res_everex',
        name: 'Fibra + everex + biobase',
        price: 40,
        detail: 'Refuerzo estructural de alta carga'
      }
    ]
  },
  {
    category: 'Coronas',
    items: [
      {
        id: 'cor_resina',
        name: 'Corona de resina impresa',
        price: 100,
        detail: 'Por cada unidad (Impresión 3D)'
      },
      {
        id: 'cor_metalporcelana',
        name: 'Corona metal porcelana',
        price: 150,
        detail: 'Por cada unidad tradicional'
      },
      {
        id: 'cor_disilicato',
        name: 'Corona de disilicato de litio',
        price: 180,
        detail: 'Por cada unidad (Alta estética)'
      },
      {
        id: 'cor_zr',
        name: 'Corona de Zirconio (Zr)',
        price: 200,
        detail: 'Por cada unidad (Máxima resistencia)'
      }
    ]
  },
  {
    category: 'Incrustaciones',
    items: [
      {
        id: 'incrust_resina',
        name: 'Incrustación Resina impresa o estratificada',
        price: 100,
        detail: 'Restauración indirecta conservadora'
      },
      {
        id: 'incrust_disilicato',
        name: 'Incrustación Disilicato',
        price: 180,
        detail: 'Estética y adhesión superior'
      },
      {
        id: 'incrust_zr',
        name: 'Incrustación Zirconio (Zr)',
        price: 200,
        detail: 'Zirconio cerámico de alta dureza'
      }
    ]
  },
  {
    category: 'Carillas',
    items: [
      {
        id: 'carilla_resina',
        name: 'Carilla Resina estratificada',
        price: 50,
        detail: '$50 c/u (si son 2 o más: $40 c/u)'
      },
      {
        id: 'carilla_disilicato',
        name: 'Carilla Disilicato de Litio',
        price: 180,
        detail: '$180 c/u (si son 2 o más: $150 c/u)'
      },
      {
        id: 'carilla_zr',
        name: 'Carilla Zirconio (Zr)',
        price: 200,
        detail: '$200 c/u (si son 2 o más: $170 c/u)'
      }
    ]
  },
  {
    category: 'Cirugías',
    items: [
      {
        id: 'cir_simple',
        name: 'Exodoncia simple',
        price: 25,
        detail: 'Incluye radiografía periapical'
      },
      {
        id: 'cir_compleja',
        name: 'Exodoncia compleja',
        price: 35,
        detail: 'Extracción quirúrgica'
      },
      {
        id: 'cir_3ermolar_erup',
        name: '3er molar erupcionado (Cordal)',
        price: 40,
        detail: '$40 c/u (2 x $70 / 3 o 4 x $30 c/u)'
      },
      {
        id: 'cir_3ermolar_imp',
        name: '3er molar impactado o retenido',
        price: 120,
        detail: '$120 c/u (2 x $200 / 3 o 4 x $85 c/u)'
      },
      {
        id: 'cir_apicectomia',
        name: 'Apicectomía',
        price: 190,
        detail: 'Cirugía periapical conservadora'
      },
      {
        id: 'cir_bichectomia',
        name: 'Bichectomía',
        price: 300,
        detail: 'Perfilado facial de mejillas'
      }
    ]
  },
  {
    category: 'Endodoncias',
    items: [
      {
        id: 'endo_uniradicular',
        name: 'Endodoncia Uniradicular',
        price: 120,
        detail: 'Diente de un solo conducto'
      },
      {
        id: 'endo_multiradicular',
        name: 'Endodoncia 2 o + raíces',
        price: 185,
        detail: 'Premolares y molares multiradiculares'
      },
      {
        id: 'endo_retratamiento',
        name: 'Endodoncia Retratamientos',
        price: 220,
        detail: 'Re-tratamiento de conductos'
      }
    ]
  },
  {
    category: 'Prótesis Dental',
    items: [
      {
        id: 'prot_wipla',
        name: 'Wipla o Removible de Acrílico',
        price: 100,
        detail: 'Acrílico tradicional o provisional'
      },
      {
        id: 'prot_flexible',
        name: 'Prótesis flexible',
        price: 100,
        detail: 'Termoplástica biocompatible'
      },
      {
        id: 'prot_total',
        name: 'Prótesis total',
        price: 200,
        detail: 'Dentadura total por arcada'
      },
      {
        id: 'prot_crco',
        name: 'Prótesis de Cromo Cobalto (Cr Co)',
        price: 350,
        detail: 'Esquelética metálica de alta precisión'
      }
    ]
  },
  {
    category: 'Ortodoncia (con especialista)',
    items: [
      {
        id: 'orto_convencional',
        name: 'Ortodoncia Convencional (Entrada)',
        price: 100,
        detail: '$100 entrada y $30 mensual'
      },
      {
        id: 'orto_autoligado',
        name: 'Ortodoncia Auto ligado (Entrada)',
        price: 200,
        detail: '$200 entrada y $60 cada control'
      },
      {
        id: 'orto_invisalign',
        name: 'Alineadores Invisibles / Invisalign',
        price: 450,
        detail: 'Consultar precio personalizado en Ecuador'
      },
      {
        id: 'orto_armonia_facial',
        name: 'Armonía Facial',
        price: 150,
        detail: '$150 cada sector o tercio facial'
      },
      {
        id: 'orto_lipopapada',
        name: 'Lipopapada',
        price: 400,
        detail: 'Tratamiento reductor de papada'
      }
    ]
  },
  {
    category: 'Implante Dental',
    items: [
      {
        id: 'imp_unidad',
        name: 'Implante Dental por unidad',
        price: 1200,
        detail: 'Implante osteointegrado unitario'
      },
      {
        id: 'imp_sobredentadura',
        name: 'Sobredentadura sobre implantes',
        price: 800,
        detail: 'Consultar según número de anclajes'
      },
      {
        id: 'imp_allon4',
        name: 'All On 4 (Arcada Completa)',
        price: 2500,
        detail: 'Rehabilitación fija 4 implantes'
      },
      {
        id: 'imp_allon6',
        name: 'All On 6 (Arcada Completa)',
        price: 3500,
        detail: 'Rehabilitación fija 6 implantes'
      }
    ]
  }
];

/**
 * Detecta si la cuenta/tenant corresponde al Dr. Gabriel Miranda (Miranda Dental Studio)
 */
export function isMirandaAccount(tenantId?: string, tenantName?: string): boolean {
  const tid = (tenantId || '').toLowerCase();
  const tname = (tenantName || '').toLowerCase();
  return (
    tid.includes('miranda') ||
    tid.includes('gabriel') ||
    tname.includes('miranda') ||
    tname.includes('gabriel')
  );
}

/**
 * Devuelve los presets de 1 toque adecuados según el cliente activo
 */
export function getPresetsForTenant(tenantId?: string, tenantName?: string): PricingPreset[] {
  return isMirandaAccount(tenantId, tenantName) ? MIRANDA_PRESETS : KINDEV_PRESETS;
}

/**
 * Devuelve el precio base sugerido al abrir modales o formularios
 */
export function getDefaultPriceForTenant(tenantId?: string, tenantName?: string): number {
  return isMirandaAccount(tenantId, tenantName) ? 50 : 120;
}

/**
 * Devuelve el nombre de servicio base sugerido
 */
export function getDefaultServiceForTenant(tenantId?: string, tenantName?: string): string {
  return isMirandaAccount(tenantId, tenantName)
    ? 'Promoción Campaña ($50 USD)'
    : 'Web Corporativa Base ($120)';
}
