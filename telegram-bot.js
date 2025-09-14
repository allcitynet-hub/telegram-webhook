const express = require('express');
const axios = require('axios');
const app = express();

// Конфигурация бота
const BOT_TOKEN = process.env.BOT_TOKEN || '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';
const BOT_USERNAME = '@Allcitynet_bot';

// Middleware для парсинга JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Функция отправки сообщения в Telegram
async function sendMessage(chatId, text, parseMode = 'HTML') {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: parseMode,
            disable_web_page_preview: true
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error.response?.data || error.message);
        throw error;
    }
}

// Функция получения информации о чате
async function getChatInfo(chatId) {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChat`, {
            params: { chat_id: chatId }
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка получения информации о чате:', error.response?.data || error.message);
        return null;
    }
}

// Обработка входящих сообщений
app.post('/webhook', async (req, res) => {
    try {
        // Сначала отвечаем OK, чтобы Telegram не повторял запрос
        res.status(200).send('OK');

        const update = req.body;
        console.log('Получено обновление:', JSON.stringify(update, null, 2));

        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text || '';
            const username = message.from.username || message.from.first_name;

            console.log(`Сообщение от ${username} (${chatId}): ${text}`);

            // Автоматические ответы
            try {
                if (text.toLowerCase().includes('привет') || text.toLowerCase().includes('hello')) {
                    await sendMessage(chatId, `👋 Привет, ${username}! Я бот Allcitynet Portal. Готов помочь с уведомлениями о заявках!`);
                } else if (text.toLowerCase().includes('статус') || text.toLowerCase().includes('статус заявки')) {
                    await sendMessage(chatId, `📊 Для проверки статуса заявки обратитесь к администратору портала или проверьте систему напрямую.`);
                } else if (text.toLowerCase().includes('помощь') || text.toLowerCase().includes('help')) {
                    await sendMessage(chatId, `🆘 Помощь по боту Allcitynet Portal

📋 Доступные команды:
• Привет - приветствие
• Статус - информация о статусе заявок
• Помощь - это сообщение

🔔 Уведомления:
Бот автоматически отправляет уведомления о новых заявках и напоминаниях.

📞 Поддержка:
По вопросам работы портала обращайтесь к администратору.`);
                } else if (text.toLowerCase().includes('заявка') || text.toLowerCase().includes('новая заявка')) {
                    await sendMessage(chatId, `📝 Информация о заявках

Для создания новой заявки или просмотра существующих заявок используйте веб-портал Allcitynet Portal.

🔔 Уведомления:
Вы будете получать уведомления о:
• Новых заявках
• Напоминаниях
• Изменениях статуса

📱 Настройки:
Убедитесь, что ваш username настроен в системе для получения уведомлений.`);
                } else {
                    // Стандартный ответ на неизвестные сообщения
                    await sendMessage(chatId, `🤖 Спасибо за сообщение!

Я получил ваше сообщение: "${text}"

🔔 Уведомления:
Теперь вы будете получать уведомления о заявках и напоминаниях.

📋 Для получения помощи напишите "помощь" или "help".`);
                }
            } catch (sendError) {
                console.error('Ошибка отправки сообщения:', sendError);
            }
        }
    } catch (error) {
        console.error('Ошибка обработки webhook:', error);
    }
});

// Маршрут для настройки webhook
app.get('/setup-webhook', async (req, res) => {
    try {
        const webhookUrl = req.query.url;
        if (!webhookUrl) {
            return res.status(400).json({
                error: 'URL webhook не указан',
                usage: 'GET /setup-webhook?url=YOUR_WEBHOOK_URL'
            });
        }

        const result = await setupWebhook(webhookUrl);
        res.json({
            success: true,
            message: 'Webhook настроен успешно',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Настройка webhook
async function setupWebhook(webhookUrl) {
    try {
        console.log('Настраиваем webhook...');
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            url: webhookUrl
        });
        console.log('Webhook настроен:', response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка настройки webhook:', error.response?.data || error.message);
        throw error;
    }
}

// Получение информации о боте
async function getBotInfo() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        console.log('Информация о боте:', response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка получения информации о боте:', error.response?.data || error.message);
        return null;
    }
}

// Маршрут для проверки статуса
app.get('/status', async (req, res) => {
    try {
        // Проверяем бота
        const botInfo = await getBotInfo();

        // Проверяем webhook
        const webhookInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);

        res.json({
            success: true,
            bot: botInfo,
            webhook: webhookInfo.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 Allcitynet Portal Telegram Bot</h1>
        <p><b>Статус:</b> Работает на Vercel</p>
        <p><b>Бот:</b> ${BOT_USERNAME}</p>
        <p><b>Webhook URL:</b> ${req.protocol}://${req.get('host')}/webhook</p>
        <hr>
        <h2>📋 Доступные команды:</h2>
        <ul>
            <li><b>Привет</b> - приветствие</li>
            <li><b>Статус</b> - информация о статусе заявок</li>
            <li><b>Помощь</b> - справка по командам</li>
            <li><b>Заявка</b> - информация о заявках</li>
        </ul>
        <hr>
        <h2>🔧 Настройка webhook:</h2>
        <p>Для настройки webhook используйте:</p>
        <code>GET /setup-webhook?url=YOUR_WEBHOOK_URL</code>
        <hr>
        <p><i>Бот готов к работе! Отправьте ему сообщение в Telegram.</i></p>
    `);
});

// Экспорт для Vercel
module.exports = app;

// Запуск сервера (только для локальной разработки)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, async () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`🌐 Webhook URL: http://localhost:${PORT}/webhook`);

        // Получаем информацию о боте
        await getBotInfo();

        console.log('✅ Бот готов к работе!');
        console.log('📱 Отправьте боту сообщение в Telegram для тестирования');
    });
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
