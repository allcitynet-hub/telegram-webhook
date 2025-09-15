const axios = require('axios');

// Конфигурация бота
const BOT_TOKEN = process.env.BOT_TOKEN || '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';
const BOT_USERNAME = '@Allcitynet_bot';

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

module.exports = async (req, res) => {
    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Обработка OPTIONS запросов для CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { text, recipient, type } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        let chatId = recipient;

        // Если recipient начинается с @, убираем его
        if (chatId && chatId.startsWith('@')) {
            chatId = chatId.substring(1);
        }

        if (!chatId) {
            // Если recipient не указан, это может быть тестовый запрос или общее сообщение
            if (type === 'test') {
                console.log('Получен тестовый запрос без указания получателя.');
                return res.status(200).json({ success: true, message: 'Test received, no recipient specified.' });
            }
            return res.status(400).json({ success: false, message: 'Recipient is required for notifications' });
        }

        console.log(`Получено сообщение для отправки через webhook. Получатель: ${chatId}, Тип: ${type}`);

        // Проверяем доступность пользователя перед отправкой
        const chatInfo = await getChatInfo(chatId);

        if (!chatInfo || !chatInfo.ok) {
            console.warn(`Пользователь ${chatId} недоступен или не найден через getChat.`);
            // Если getChat не сработал, все равно пытаемся отправить сообщение,
            // так как getChat может не работать для пользователей, не писавших боту.
            // Ошибка "chat not found" будет обработана при sendMessage.
        }

        const messageResponse = await sendMessage(chatId, text);

        if (messageResponse.ok) {
            return res.status(200).json({ success: true, message: 'Message sent successfully', telegramResponse: messageResponse });
        } else {
            console.error('Ошибка Telegram API при отправке сообщения:', messageResponse);
            return res.status(400).json({ success: false, message: 'Failed to send message via Telegram API', telegramResponse: messageResponse });
        }
    } catch (error) {
        console.error('Ошибка в Vercel webhook:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};
