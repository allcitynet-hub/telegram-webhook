export default async function handler(req, res) {
    // Логирование запроса
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Обработка OPTIONS запроса
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    
    // Обработка GET запроса
    if (req.method === 'GET') {
        const { test } = req.query;
        
        if (test) {
            try {
                const token = process.env.TELEGRAM_BOT_TOKEN || '5007226500:AAG4uJqSHGxCNl_eU7DGNqc7bXwrXm-Qcj4';
                const chatId = process.env.TELEGRAM_CHAT_ID || '-1001254716887';
                
                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: 'Тестовое сообщение: Vercel GET-ok',
                        parse_mode: 'HTML'
                    })
                });
                
                const result = await response.json();
                res.status(200).json(result);
            } catch (error) {
                console.error('GET error:', error);
                res.status(500).json({ error: error.message });
            }
            return;
        }
        
        res.status(200).json({ message: 'OK' });
        return;
    }
    
    // Обработка POST запроса
    if (req.method === 'POST') {
        try {
            let text = '';
            let recipient = null;
            let isUserNotification = false;
            
            // Получаем данные из запроса
            if (req.headers['content-type']?.includes('application/json')) {
                text = req.body?.text || req.body?.message || '';
                recipient = req.body?.recipient || null;
                isUserNotification = req.body?.type === 'user_notification';
            } else {
                text = req.body || '';
            }
            
            if (!text) {
                res.status(400).json({ error: 'No text provided' });
                return;
            }
            
            const token = process.env.TELEGRAM_BOT_TOKEN || '5007226500:AAG4uJqSHGxCNl_eU7DGNqc7bXwrXm-Qcj4';
            
            // Если это уведомление для конкретного пользователя
            if (isUserNotification && recipient) {
                console.log(`📤 Отправляем личное уведомление для: ${recipient}`);
                
                // Пытаемся отправить личное сообщение
                try {
                    // Для username (начинается с @)
                    if (recipient.startsWith('@')) {
                        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: recipient, // Telegram API принимает username как chat_id
                                text: text,
                                parse_mode: 'HTML'
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.ok) {
                            console.log(`✅ Личное сообщение отправлено для ${recipient}`);
                            return res.status(200).json(result);
                        } else {
                            console.log(`⚠️ Не удалось отправить личное сообщение для ${recipient}: ${result.description}`);
                            // Fallback: отправляем в общий чат
                        }
                    }
                    
                    // Для номера телефона или если username не сработал
                    if (recipient.startsWith('+') || !recipient.startsWith('@')) {
                        console.log(`📱 Отправляем в общий чат (телефон или fallback): ${recipient}`);
                    }
                } catch (error) {
                    console.error(`❌ Ошибка отправки личного сообщения для ${recipient}:`, error);
                    // Fallback: отправляем в общий чат
                }
            }
            
            // Отправляем в общий чат (fallback или обычное сообщение)
            const chatId = process.env.TELEGRAM_CHAT_ID || '-1001254716887';
            console.log(`📤 Отправляем в общий чат: ${chatId}`);
            
            const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                    })
            });
            
            const result = await response.json();
            res.status(200).json(result);
            
        } catch (error) {
            console.error('POST error:', error);
            res.status(500).json({ 
                error: 'Internal error', 
                details: error.message 
            });
        }
        return;
    }
    
    // Неподдерживаемый метод
    res.status(405).json({ error: 'Method not allowed' });
}
