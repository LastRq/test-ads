export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const rawPhone = body.phone || body.from || (body.sender && body.sender.phone) || '';
    const name = body.name || (body.sender && body.sender.name) || 'Cliente WhatsApp';
    const message = (typeof body.message === 'object' ? body.message?.text : body.message) || body.text || '';
    const tenantId = req.query?.tenant || body.tenantId || 'kindev';

    const cleanPh = String(rawPhone).replace(/\D/g, '');
    if (!cleanPh) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/test-addss/databases/(default)/documents/leads';
    const firestorePayload = {
      fields: {
        name: { stringValue: String(name).substring(0, 100) },
        phone: { stringValue: cleanPh.substring(0, 20) },
        displayPhone: { stringValue: String(rawPhone).startsWith('+') ? String(rawPhone) : `+${cleanPh}` },
        service: { stringValue: String(body.service || 'Contacto Inicial WhatsApp').substring(0, 100) },
        notes: { stringValue: message ? `Mensaje: "${message}"` : 'Auto-registrado desde WhatsApp' },
        status: { stringValue: 'prospecto' },
        amount: { doubleValue: 0 },
        createdAt: { stringValue: new Date().toISOString() },
        source: { stringValue: 'whatsapp_auto' },
        tenantId: { stringValue: String(tenantId) },
        eventId: { stringValue: `wa_${cleanPh}_${Date.now()}` }
      }
    };

    const firestoreRes = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestorePayload)
    });

    if (!firestoreRes.ok) {
      const errText = await firestoreRes.text();
      return res.status(500).json({ error: 'Error guardando en Firestore', details: errText });
    }

    const result = await firestoreRes.json();
    return res.status(200).json({ success: true, leadId: result.name });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
