// এই ফাইলটি শুধুমাত্র অ্যাডমিনকে মেসেজ পাঠিয়ে পরীক্ষা করার জন্য

export default async function handler(req, res) {
  // শুধুমাত্র GET রিকোয়েস্ট গ্রহণ করা হবে
  if (req.method !== 'GET') {
    return res.status(405).send({ message: 'Only GET requests allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    return res.status(500).send({ message: 'Bot Token or Admin Chat ID is not set in Vercel.' });
  }

  const text = '👋 Hello Admin! This is a test message from your Vercel server. If you receive this, your ADMIN_CHAT_ID is correct.';
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${ADMIN_CHAT_ID}&text=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      // সফল হলে ব্রাউজারে এই বার্তা দেখানো হবে
      res.status(200).send('Test message sent successfully! Please check your Telegram.');
    } else {
      // ব্যর্থ হলে ব্রাউজারে টেলিগ্রামের দেওয়া এররটি দেখানো হবে
      res.status(500).send(`Failed to send message. Telegram API response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    res.status(500).send(`An error occurred: ${error.message}`);
  }
}