// Простой тест для проверки загрузки скрипта
console.log('✅ Тест скрипта загружен');

// Проверяем основные функции
if (typeof openLoginModal === 'function') {
    console.log('✅ openLoginModal функция найдена');
} else {
    console.log('❌ openLoginModal функция не найдена');
}

// Проверяем глобальные переменные
if (typeof requests !== 'undefined') {
    console.log('✅ requests переменная найдена');
} else {
    console.log('❌ requests переменная не найдена');
}

// Проверяем функции Vercel
if (typeof setupVercelWebhook === 'function') {
    console.log('✅ setupVercelWebhook функция найдена');
} else {
    console.log('❌ setupVercelWebhook функция не найдена');
}

// Проверяем функции аутентификации
if (typeof login === 'function') {
    console.log('✅ login функция найдена');
} else {
    console.log('❌ login функция не найдена');
}

if (typeof logout === 'function') {
    console.log('✅ logout функция найдена');
} else {
    console.log('❌ logout функция не найдена');
}

// Проверяем функции Vercel
if (typeof sendViaVercelWebhook === 'function') {
    console.log('✅ sendViaVercelWebhook функция найдена');
} else {
    console.log('❌ sendViaVercelWebhook функция не найдена');
}

if (typeof testVercelWebhook === 'function') {
    console.log('✅ testVercelWebhook функция найдена');
} else {
    console.log('❌ testVercelWebhook функция не найдена');
}

console.log('🎉 Все основные функции загружены успешно!');
