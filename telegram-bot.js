# 🤖 Telegram бот для Allcitynet Portal

## 🚀 Быстрый запуск

### 1. Установите Node.js
Скачайте с [nodejs.org](https://nodejs.org/)

### 2. Установите зависимости
```bash
npm install express axios
```

### 3. Запустите бота
```bash
node telegram-bot.js
```

### 4. Протестируйте
1. Откройте Telegram
2. Найдите бота `@Allcitynet_bot`
3. Напишите "привет"
4. Бот должен ответить автоматически

## 📱 Команды бота

- **Привет** - приветствие
- **Статус** - информация о статусе заявок
- **Помощь** - справка по командам
- **Заявка** - информация о заявках

## 🔧 Настройка webhook

### Для локального тестирования с ngrok:

1. **Установите ngrok:**
   ```bash
   # Windows
   choco install ngrok
   
   # macOS
   brew install ngrok
   ```

2. **Запустите бота:**
   ```bash
   node telegram-bot.js
   ```

3. **В новом терминале запустите ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Скопируйте HTTPS URL** (например: `https://abc123.ngrok.io`)

5. **Настройте webhook:**
   ```bash
   node setup-webhook.js https://abc123.ngrok.io/webhook
   ```

### Для продакшена:

1. **Загрузите код на Heroku/Vercel**
2. **Настройте webhook:**
   ```bash
   node setup-webhook.js https://your-app.herokuapp.com/webhook
   ```

## 🧪 Тестирование

### Тест бота:
```bash
node test-telegram-bot.js
```

### Тест конкретного пользователя:
```bash
node test-telegram-bot.js etelecom_spb
```

## 📋 Файлы

- `telegram-bot.js` - основной файл бота
- `setup-webhook.js` - настройка webhook
- `test-telegram-bot.js` - тестирование бота
- `start-telegram-bot.bat` - быстрый запуск (Windows)
- `package-telegram.json` - зависимости

## 🔍 Отладка

### Проверка webhook:
```bash
curl "https://api.telegram.org/bot1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4/getWebhookInfo"
```

### Проверка бота:
```bash
curl "https://api.telegram.org/bot1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4/getMe"
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли
2. Убедитесь, что webhook настроен правильно
3. Проверьте, что бот отвечает на команды
4. Обратитесь к администратору портала

## 🎯 Что делает бот

1. **Автоматически отвечает** на сообщения пользователей
2. **Отправляет уведомления** о заявках и напоминаниях
3. **Предоставляет справку** по командам
4. **Интегрируется** с системой Allcitynet Portal

## 🔒 Безопасность

- Токен бота защищен
- Webhook настроен безопасно
- Логирование всех действий
- Обработка ошибок
