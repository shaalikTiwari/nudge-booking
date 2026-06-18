const twilio = require('twilio');

let client = null;
function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

async function sendWhatsAppMessage(to, body) {
  try {
    const message = await getClient().messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body,
    });
    console.log('✓ WhatsApp message sent:', message.sid);
    return message;
  } catch (err) {
    console.error('✗ Failed to send WhatsApp message:', err.message);
    return null;
  }
}

module.exports = { sendWhatsAppMessage };