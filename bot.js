// bot.js
require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL;

// Команда /play отдаёт inline-кнопку с Web App
bot.command('play', ctx => {
  return ctx.reply(
    '🎮 Нажмите кнопку, чтобы начать игру:',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Начать Gold Digger', web_app: { url: WEB_APP_URL } }
        ]]
      }
    }
  );
});

bot.launch()
  .then(() => console.log('Bot started'))
  .catch(console.error);

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
