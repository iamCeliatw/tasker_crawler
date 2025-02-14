const axios = require('axios')
const nodemailer = require('nodemailer')
require('dotenv').config()

// Telegram Bot 通知
async function sendTelegramMessage(message) {
  const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
  try {
    await axios.post(TELEGRAM_API, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    })
    console.log('📩 Telegram 通知已發送')
  } catch (error) {
    console.error('❌ 無法發送 Telegram 訊息', error)
  }
}

module.exports = { sendTelegramMessage }
