// File: /api/verify.js
// Vercel এর সাথে সামঞ্জস্যপূর্ণ করার জন্য কোডটি আপডেট করা হয়েছে

module.exports = async (req, res) => {
  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করা হবে
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // আপনার গোপন তথ্যগুলো Vercel-এর Environment Variables থেকে আসবে
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

  // এক্সটেনশন থেকে পাঠানো userId
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`;
    
    // টেলিগ্রাম API-তে রিকোয়েস্ট পাঠানো হচ্ছে
    const telegramResponse = await fetch(url);
    const data = await telegramResponse.json();

    // ইউজার যদি চ্যানেলের সদস্য হয়, তার স্ট্যাটাস হবে 'member', 'administrator', or 'creator'
    if (data.ok && ['member', 'administrator', 'creator'].includes(data.result.status)) {
      // সদস্য হলে সফল উত্তর পাঠানো হবে
      return res.status(200).json({ success: true, message: 'User is a valid member.' });
    } else {
      // সদস্য না হলে ব্যর্থ উত্তর পাঠানো হবে
      return res.status(200).json({ success: false, message: 'User not authorized.' });
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
