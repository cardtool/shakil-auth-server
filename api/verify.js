import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ s: false, m: 'Method Not Allowed' });
  const { licenseKey, deviceId } = req.body;
  if (!licenseKey || !deviceId) return res.status(400).json({ s: false, m: 'License & Device ID required' });
  
  try {
    const client = await clientPromise;
    const db = client.db("mainDb");
    const licenses = db.collection("licenses");
    const license = await licenses.findOne({ licenseKey });

    if (!license) return res.status(200).json({ s: false, m: 'License key not found.' });
    if (license.deviceId !== deviceId) return res.status(200).json({ s: false, m: 'Device mismatch.' });
    if (new Date(license.expiresAt) < new Date()) return res.status(200).json({ s: false, m: 'License has expired.' });
    if (license.status !== 'active') return res.status(200).json({ s: false, m: 'License is not active.' });

    return res.status(200).json({ s: true, m: 'Verification successful.' });
  } catch (e) {
    return res.status(500).json({ s: false, m: 'Server error during verification.' });
  }
}
