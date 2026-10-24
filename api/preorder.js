export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      reference_id = `UNELM-${Date.now().toString(36).toUpperCase()}`,
      lang = 'en',
      mode = 'pod',
      duration_mode = 'night',
      package_id = 'M',
      package_title = 'Single Pod M — 147 m² Home Sanctuary',
      purchase_type = 'founding',
      purchase_type_label = 'Founding Member Preorder & Save (incl. €237 Free Bundle)',
      base_price = 149,
      anchor_price = 386,
      addons = [],
      addons_total = 0,
      total_price = 149,
      customer_name = '',
      customer_email = '',
      customer_phone = '',
      customer_country = '',
      preferred_dates = '',
      guests = '2',
      notes = '',
      source_url = 'https://unelm-retreat.vercel.app'
    } = body;

    const timestamp = new Date().toLocaleString('et-EE', { timeZone: 'Europe/Tallinn' });
    const addonsText = Array.isArray(addons) && addons.length > 0
      ? addons.map(a => `${a.title || a.id} (+€${a.price})`).join(', ')
      : 'Ühtegi lisateenust ei valitud / None selected';

    const subject = `[UNELM EELTELLIMUS ${reference_id}] ${package_title} — €${total_price} (${customer_name || customer_email || 'Uus klient'})`;

    const payload = {
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      Tellimuse_kood: reference_id,
      Kuupäev_ja_kellaaeg: timestamp,
      Valitud_pakett: `${package_title} (${mode === 'pod' ? 'Aiakodu hütiga / Garden Pod' : 'Talumajutus & Saun / Farmhouse Escape'})`,
      Kestus_või_režiim: duration_mode === 'season'
        ? 'Kogu hooaeg (mai–sept 2027) — 249 € tagastatav broneeringutasu'
        : duration_mode === 'week'
        ? '7 ööd nädalane puhkus'
        : 'Lühiajaline peatus / öö hind',
      Ostutüüp: purchase_type_label,
      Boonuspakett_237_EUR: purchase_type === 'founding'
        ? 'JAH — Tasuta eel-istutatud peenar (89 €) + 3h tiigisaun (89 €) + talu hommikusöögikorv (30 €) + EV/aiakäru (29 €)'
        : 'Tavabroneering ilma asutajaboonuseta',
      Valitud_lisad_Order_Bumps: addonsText,
      Baashind_EUR: `€${base_price}`,
      Lisad_kokku_EUR: `€${addons_total}`,
      KOGUSUMMA_EUR: `€${total_price} (võrdlushind/väärtus €${anchor_price})`,
      Kliendi_nimi: customer_name || '(Määramata)',
      Kliendi_epost: customer_email || '(Määramata)',
      Kliendi_telefon_WhatsApp: customer_phone || '(Määramata)',
      Riik_või_linn: customer_country || '(Määramata)',
      Soovitud_saabumine_kuupäevad: preferred_dates || 'Kokkuleppel / 2027 hooaeg',
      Külaliste_arv: String(guests),
      Märkused_ja_erisoovid: notes || '—',
      Garantii: '100% Raha Tagasi Garantii (kuni 1. maini 2027 / 30 päeva rahulolugarantii)',
      Keelevalik: lang.toUpperCase(),
      Lehe_link: source_url
    };

    if (customer_email && customer_email.includes('@')) {
      payload._replyto = customer_email.trim();
    }

    // Send to verified FormSubmit hash for reneealuste@gmail.com and direct email endpoint
    const endpoints = [
      'https://formsubmit.co/ajax/78c3a12c74aa756d1d5e36e3c5f0168b',
      'https://formsubmit.co/ajax/reneealuste@gmail.com'
    ];

    let delivered = false;
    let remoteResult = {};

    for (const ep of endpoints) {
      try {
        const response = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://puidujaak.vercel.app',
            'Referer': 'https://puidujaak.vercel.app/',
            'User-Agent': 'Mozilla/5.0 (compatible; UnelmRetreatPreorder/1.0)'
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        remoteResult = data;
        if (response.ok && (data.success === 'true' || data.success === true)) {
          delivered = true;
          break;
        }
      } catch (_) {
        // try next endpoint
      }
    }

    return res.status(200).json({
      ok: true,
      delivered,
      reference_id,
      delivered_to: 'reneealuste@gmail.com',
      subject,
      timestamp,
      total_price,
      details: remoteResult
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}
