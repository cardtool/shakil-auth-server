import clientPromise from '../lib/mongodb';
import { randomBytes } from 'crypto';

function generateLicenseKey() {
  return `SHAKIL-${randomBytes(8).toString('hex').toUpperCase()}`;
}

async function sendMessage(botToken, chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : {}, parse_mode: 'Markdown' }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
  const body = req.body;

  try {
    if (body.message && body.message.text === '/start') {
      const userInfo = body.message.from;
      const text = `🔔 *New Access Request!*\n\n*Name:* ${userInfo.first_name || ''} ${userInfo.last_name || ''}\n*User ID:* \`${userInfo.id}\``;
      const keyboard = { inline_keyboard: [[{ text: '✅ Approve', callback_data: `approve_${userInfo.id}` }, { text: '❌ Deny', callback_data: `deny_${userInfo.id}` }]] };
      await sendMessage(BOT_TOKEN, ADMIN_CHAT_ID, text, keyboard);
      await sendMessage(BOT_TOKEN, userInfo.id, 'Your request has been sent to the admin. Please wait for approval.');
    }
    else if (body.callback_query) {
      const { data, from } = body.callback_query;
      const [action, userId] = data.split('_');
      if (String(from.id) !== ADMIN_CHAT_ID) return res.status(403).send('Unauthorized');
      
      const client = await clientPromise;
      const db = client.db("mainDb");
      const licenses = db.collection("licenses");

      if (action === 'approve') {
        const newKey = generateLicenseKey();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await licenses.insertOne({ licenseKey: newKey, status: 'active', telegramId: userId, createdAt: new Date(), expiresAt: expiryDate, deviceId: null });
        await sendMessage(BOT_TOKEN, userId, `✅ *Congratulations!* Your access has been approved.\n\nHere is your License Key:\n\`${newKey}\`\n\nPlease copy this key and paste it into the extension.`);
        await sendMessage(BOT_TOKEN, ADMIN_CHAT_ID, `User ${userId} approved. Key: \`${newKey}\``);
      } else {
        await sendMessage(BOT_TOKEN, userId, '❌ Your access request has been denied.');
        await sendMessage(BOT_TOKEN, ADMIN_CHAT_ID, `User ${userId}'s request denied.`);
      }
    }
  } catch (e) { console.error(e); }
  return res.status(200).send('OK');
};
