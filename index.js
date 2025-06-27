// Подключаем библиотеку dotenv, чтобы загрузить переменные из .env
require('dotenv').config();

// Получаем данные из .env
const botToken = process.env.BOT_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Печатаем токен для проверки, что всё загружено правильно
console.log(botToken); // Если всё верно, должен вывести твой токен

const TelegramBot = require('node-telegram-bot-api');

// Создаём экземпляр бота с использованием токена
const bot = new TelegramBot(botToken, { polling: true });

// Ответ на команду /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Это твой GoldDiggerPlayBot! Готов копать золото?');
});

console.log('Бот работает!');
