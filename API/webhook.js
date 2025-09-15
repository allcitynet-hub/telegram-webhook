export default async function handler(req, res) {
    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Обрабатываем preflight запросы
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Логирование запроса
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
        const BOT_TOKEN = process.env.BOT_TOKEN || '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';
        
        // Проверяем метод запроса
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { text, recipient, type } = req.body;

        // Если это уведомление для конкретного пользователя
        if (type === 'user_notification' && recipient) {
            console.log(`📤 Отправляем личное уведомление для: ${recipient}`);
            
            try {
                // Обрабатываем разные форматы Telegram ID
                let chatId = recipient;
                if (recipient.startsWith('@')) {
                    chatId = recipient.substring(1);
                }

                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    })
                });

                const result = await response.json();
                
                if (result.ok) {
                    console.log(`✅ Личное сообщение отправлено для ${recipient}`);
                    return res.status(200).json({
                        success: true,
                        message: 'Сообщение отправлено',
                        data: result
                    });
                } else {
                    console.log(`⚠️ Ошибка отправки для ${recipient}:`, result);
                    return res.status(400).json({
                        success: false,
                        error: result.description || 'Ошибка отправки сообщения',
                        details: result
                    });
                }
            } catch (error) {
                console.error(`❌ Ошибка отправки для ${recipient}:`, error);
                return res.status(500).json({
                    success: false,
                    error: 'Внутренняя ошибка сервера',
                    details: error.message
                });
            }
        }

        // Если это обычное webhook сообщение
        if (text) {
            console.log(`📤 Отправляем общее сообщение: ${text}`);
            
            try {
                // Здесь можно добавить логику для отправки в общий чат
                // Пока просто возвращаем успех
                return res.status(200).json({
                    success: true,
                    message: 'Сообщение получено',
                    text: text
                });
            } catch (error) {
                console.error('❌ Ошибка обработки сообщения:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка обработки сообщения',
                    details: error.message
                });
            }
        }

        // Если это webhook от Telegram
        if (req.body.message) {
            const message = req.body.message;
            const chatId = message.chat.id;
            const text = message.text || '';
            const username = message.from.username || message.from.first_name;

            console.log(`Сообщение от ${username} (${chatId}): ${text}`);

            // Автоматические ответы
            let responseText = '';
            
            if (text.toLowerCase().includes('привет') || text.toLowerCase().includes('hello')) {
                responseText = `👋 Привет, ${username}! Я бот Allcitynet Portal. Готов помочь с уведомлениями о заявках!`;
            } else if (text.toLowerCase().includes('статус') || text.toLowerCase().includes('статус заявки')) {
                responseText = `📊 Для проверки статуса заявки обратитесь к администратору портала или проверьте систему напрямую.`;
            } else if (text.toLowerCase().includes('помощь') || text.toLowerCase().includes('help')) {
                responseText = `🆘 Помощь по боту Allcitynet Portal

📋 Доступные команды:
• Привет - приветствие
• Статус - информация о статусе заявок
• Помощь - это сообщение

🔔 Уведомления:
Бот автоматически отправляет уведомления о новых заявках и напоминаниях.

📞 Поддержка:
По вопросам работы портала обращайтесь к администратору.`;
            } else if (text.toLowerCase().includes('заявка') || text.toLowerCase().includes('новая заявка')) {
                responseText = `📝 Информация о заявках

Для создания новой заявки или просмотра существующих заявок используйте веб-портал Allcitynet Portal.

🔔 Уведомления:
Вы будете получать уведомления о:
• Новых заявках
• Напоминаниях
• Изменениях статуса

📱 Настройки:
Убедитесь, что ваш username настроен в системе для получения уведомлений.`;
            } else {
                responseText = `🤖 Спасибо за сообщение!

Я получил ваше сообщение: "${text}"

🔔 Уведомления:
Теперь вы будете получать уведомления о заявках и напоминаниях.

📋 Для получения помощи напишите "помощь" или "help".`;
            }

            // Отправляем ответ
            try {
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: responseText,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    })
                });

                const result = await response.json();
                
                if (result.ok) {
                    console.log(`✅ Ответ отправлен пользователю ${username}`);
                } else {
                    console.log(`⚠️ Ошибка отправки ответа:`, result);
                }
            } catch (error) {
                console.error('❌ Ошибка отправки ответа:', error);
            }

            return res.status(200).json({ success: true });
        }

        // Если ничего не подошло
        return res.status(200).json({
            success: true,
            message: 'Webhook получен',
            body: req.body
        });

    } catch (error) {
        console.error('❌ Общая ошибка webhook:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
}
