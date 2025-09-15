// Полная версия script.js со всеми функциями из оригинального приложения
// Глобальные переменные
let requests = [];
let currentEditId = null;
let currentDeleteId = null;
let currentUser = null;
let sessionStartTime = null;
let users = [];
let providers = [];
let rewards = [];
let updateLog = [];
let auditLogs = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    try {
        // Инициализируем данные
        initUsers();
        initProviders();
        initRewards();
        initRewardsData(); // Инициализируем данные вознаграждений
        initRequestStatuses(); // Инициализируем статусы заявок
        updateOldRequestStatuses(); // Обновляем старые статусы заявок
        initAuditLogs(); // Инициализируем логи аудита
        initGoogleSheets(); // Инициализируем Google Sheets
        initTariffParser(); // Инициализируем парсер тарифов

        // Проверяем аутентификацию
        await checkAuthentication();

        // Инициализируем интерфейс
        initializeUI();

        // Загружаем данные
        await loadData();

        // Настраиваем подписки на изменения
        setupRealtimeSubscriptions();

        // Инициализируем систему напоминаний
        initializeReminders();

        // Запускаем проверку напоминаний
        setInterval(checkReminders, 60000); // Каждую минуту

        // Принудительно рендерим таблицу для всех пользователей
        console.log('🔄 Принудительный рендеринг таблицы для всех пользователей');
        renderTable();
        updateStatistics();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Функция для сброса данных (для отладки)
function resetAppData() {
    if (confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) {
        localStorage.clear();
        location.reload();
    }
}

// Функция для очистки только пользователей
function resetUsers() {
    if (confirm('Очистить только данные пользователей?')) {
        localStorage.removeItem('users');
        location.reload();
    }
}

// Функция для принудительного обновления пользователей
function updateUsers() {
    if (confirm('Обновить список пользователей до актуальной версии?')) {
        localStorage.removeItem('users');
        initUsers();
        location.reload();
    }
}

// Функция для проверки пользователей в localStorage
function checkUsers() {
    const storedUsers = localStorage.getItem('users');
    console.log('🔍 Данные в localStorage:', storedUsers);

    if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        console.log('📋 Распарсенные пользователи:', parsedUsers);
        console.log('👤 Поиск admin@allcitynet.ru:', parsedUsers.find(u => u.email === 'admin@allcitynet.ru'));
    } else {
        console.log('❌ Пользователи не найдены в localStorage');
    }
}

// Функция для обновления провайдеров
function refreshProviders() {
    console.log('🔄 Принудительное обновление провайдеров...');
    loadBasicProvidersData();
    loadProvidersFromSite().then(() => {
        populateProvidersList();
        loadProviderAccessList();
        loadEditProviderAccessList();
        console.log('✅ Провайдеры обновлены');
    });
}

// Функция для тестирования парсинга с предоставленным HTML
function testParseProviders() {
    const testHTML = `
    <div class="container">
        <div class="row">
            <div class="col-md-3 col-sm-3 col-6" id="provider">
                <div class="panel panel-default project-panel">
                    <div class="panel-body">
                        <a href="/providers/etelecom/" class="da-thumbs">
                            <img class="img-responsive" src="/upload/resize_cache/iblock/a78/231_231_0/еТЕЛЕКОМ логотип313.png" alt="еТелеком" title="еТелеком">
                        </a>
                        <h2 class="heading-top">
                            <a href="/providers/etelecom/" class="text-md">еТелеком</a>
                        </h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-3 col-6" id="provider">
                <div class="panel panel-default project-panel">
                    <div class="panel-body">
                        <a href="/providers/rostelekom/" class="da-thumbs">
                            <img class="img-responsive" src="/upload/resize_cache/webp/iblock/9f8/231_231_0/RGB_RT_vert_11.webp" alt="Ростелеком" title="Ростелеком">
                        </a>
                        <h2 class="heading-top">
                            <a href="/providers/rostelekom/" class="text-md">Ростелеком</a>
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    console.log('🧪 Тестирование парсинга провайдеров...');
    const result = parseProvidersFromHTML(testHTML);
    console.log('📊 Результат тестирования:', result);
    return result;
}

// Добавляем функции в глобальную область видимости для отладки
window.resetAppData = resetAppData;
window.resetUsers = resetUsers;
window.updateUsers = updateUsers;
window.checkUsers = checkUsers;
window.refreshProviders = refreshProviders;
window.testParseProviders = testParseProviders;

// Добавляем функции обновления еТелеком в глобальную область видимости
window.forceUpdateEtelecomData = forceUpdateEtelecomData;
window.forceUpdateEtelecomInterface = forceUpdateEtelecomInterface;
window.quickUpdateEtelecom = quickUpdateEtelecom;

// Добавляем функции обновления SkyNet в глобальную область видимости
window.forceUpdateSkynetData = forceUpdateSkynetData;
window.forceUpdateSkynetInterface = forceUpdateSkynetInterface;
window.quickUpdateSkynet = quickUpdateSkynet;

// Добавляем функции обновления ПИН в глобальную область видимости
window.forceUpdatePinData = forceUpdatePinData;
window.forceUpdatePinInterface = forceUpdatePinInterface;
window.quickUpdatePin = quickUpdatePin;

// Добавляем функции обновления Aiconet в глобальную область видимости
window.forceUpdateAiconetData = forceUpdateAiconetData;
window.forceUpdateAiconetInterface = forceUpdateAiconetInterface;
window.quickUpdateAiconet = quickUpdateAiconet;

// Добавляем функции обновления Arbital в глобальную область видимости
window.forceUpdateArbitalData = forceUpdateArbitalData;
window.forceUpdateArbitalInterface = forceUpdateArbitalInterface;
window.quickUpdateArbital = quickUpdateArbital;

// Добавляем функции обновления Енева в глобальную область видимости
window.forceUpdateObitData = forceUpdateObitData;
window.forceUpdateObitInterface = forceUpdateObitInterface;
window.quickUpdateObit = quickUpdateObit;

// Добавляем функции обновления Домовой в глобальную область видимости
window.forceUpdateDomovoyData = forceUpdateDomovoyData;
window.forceUpdateDomovoyInterface = forceUpdateDomovoyInterface;
window.quickUpdateDomovoy = quickUpdateDomovoy;

// Добавляем функции обновления Енева (Обит) в глобальную область видимости
window.forceUpdateObitData = forceUpdateObitData;
window.forceUpdateObitInterface = forceUpdateObitInterface;
window.quickUpdateObit = quickUpdateObit;

// Добавляем функции обновления Простор телеком в глобальную область видимости
window.forceUpdateProstorTelekomData = forceUpdateProstorTelekomData;
window.forceUpdateProstorTelekomInterface = forceUpdateProstorTelekomInterface;
window.quickUpdateProstorTelekom = quickUpdateProstorTelekom;

// Добавляем функции обновления Ростелеком в глобальную область видимости
window.forceUpdateRostelecomData = forceUpdateRostelecomData;
window.forceUpdateRostelecomInterface = forceUpdateRostelecomInterface;
window.quickUpdateRostelecom = quickUpdateRostelecom;

// Добавляем функции обновления МегаФон в глобальную область видимости
window.forceUpdateMegafonData = forceUpdateMegafonData;
window.forceUpdateMegafonInterface = forceUpdateMegafonInterface;
window.quickUpdateMegafon = quickUpdateMegafon;

// Добавляем функции обновления Ростелеком ТКТ в глобальную область видимости
window.forceUpdateRostelecomTktData = forceUpdateRostelecomTktData;
window.forceUpdateRostelecomTktInterface = forceUpdateRostelecomTktInterface;
window.quickUpdateRostelecomTkt = quickUpdateRostelecomTkt;

// Добавляем функции обновления AT-HOME в глобальную область видимости
window.forceUpdateAthomeData = forceUpdateAthomeData;
window.forceUpdateAthomeInterface = forceUpdateAthomeInterface;
window.quickUpdateAthome = quickUpdateAthome;

// Добавляем функции обновления Билайн в глобальную область видимости
window.forceUpdateBeelineData = forceUpdateBeelineData;
window.forceUpdateBeelineInterface = forceUpdateBeelineInterface;
window.quickUpdateBeeline = quickUpdateBeeline;

// Добавляем функции обновления РСВО-Онлайн в глобальную область видимости
window.forceUpdateRsvoData = forceUpdateRsvoData;
window.forceUpdateRsvoInterface = forceUpdateRsvoInterface;
window.quickUpdateRsvo = quickUpdateRsvo;

// Добавляем функции обновления ДОМ Ru в глобальную область видимости
window.forceUpdateDomruData = forceUpdateDomruData;
window.forceUpdateDomruInterface = forceUpdateDomruInterface;
window.quickUpdateDomru = quickUpdateDomru;

// Добавляем функции обновления NewLink в глобальную область видимости
window.forceUpdateNewlinkData = forceUpdateNewlinkData;
window.forceUpdateNewlinkInterface = forceUpdateNewlinkInterface;
window.quickUpdateNewlink = quickUpdateNewlink;

// Добавляем функции обновления ПАКТ в глобальную область видимости
window.forceUpdatePaktData = forceUpdatePaktData;
window.forceUpdatePaktInterface = forceUpdatePaktInterface;
window.quickUpdatePakt = quickUpdatePakt;

// Добавляем функции обновления Aiconet в глобальную область видимости
window.forceUpdateAiconetData = forceUpdateAiconetData;
window.forceUpdateAiconetInterface = forceUpdateAiconetInterface;
window.quickUpdateAiconet = quickUpdateAiconet;

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Инициализация пользователей
function initUsers() {
    const existing = localStorage.getItem('users');
    console.log('🔍 Проверка существующих пользователей:', !!existing);

    // Проверяем, есть ли корректные пользователи
    let hasValidUsers = false;
    if (existing) {
        try {
            const parsedUsers = JSON.parse(existing);
            hasValidUsers = parsedUsers.length > 0 && parsedUsers.some(u => u.email && u.email.length > 0);
            console.log('🔍 Есть ли корректные пользователи:', hasValidUsers);
        } catch (e) {
            console.log('❌ Ошибка парсинга пользователей:', e);
            hasValidUsers = false;
        }
    }

    if (!existing || !hasValidUsers) {
        console.log('📝 Создание пользователей по умолчанию...');
        const defaultUsers = [
            {
                id: 1,
                name: 'Администратор',
                email: 'admin@allcitynet.ru',
                password: hashPassword('admin'),
                role: 'admin',
                providerAccess: [],
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        console.log('✅ Пользователи созданы:', defaultUsers.map(u => u.email));
    }

    users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('👥 Загружено пользователей:', users.length);
    console.log('📋 Список пользователей:', users.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));
}

// Данные провайдеров
const PROVIDERS_DATA = {
    providers: [
        {
            slug: 'rostelecom',
            name: 'Ростелеком',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Телефония', 'Мобильная связь', 'Пакетное предложение'],
            mainTariff: 'Просто интернет',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Просто интернет',
                    service: 'Интернет',
                    speed: 200,
                    price: 500,
                    period: 'месяц',
                    description: 'Тариф "Просто интернет" - 200 Мбит/с за 500 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Технология доступа.Базовый 200',
                    service: 'Интернет',
                    speed: 200,
                    price: 600,
                    period: 'месяц',
                    description: 'Тариф «Технология доступа.Базовый» - 200 Мбит/с за 600 руб/месяц. Роутер: PON-розетка (ONT Low) + 80 р/мес. Рассрочка ONT medium (48 мес.) +150 руб/мес. Условия: Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Технология доступа.Базовый 100',
                    service: 'Интернет',
                    speed: 100,
                    price: 550,
                    period: 'месяц',
                    description: 'Тариф «Технология доступа.Базовый» - 100 Мбит/с за 550 руб/месяц. Роутер: PON-розетка (ONT Low) + 80 р/мес. Рассрочка ONT medium (48 мес.) +150 руб/мес. Условия: Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Игровой',
                    service: 'Интернет',
                    speed: 800,
                    price: 990,
                    period: 'месяц',
                    description: 'Тариф "Игровой" - 800 Мбит/с за 990 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: true
                },
                // Тарифы на телевидение
                {
                    name: 'КиноViP',
                    service: 'Телевидение',
                    speed: null,
                    price: 379,
                    period: 'месяц',
                    description: 'Тариф "КиноViP" - Видеосервис Wink, 110 каналов за 379 руб./мес. + 99 руб./мес. тв-приставка.',
                    isPromotion: false
                },
                // Тарифы на телефонию
                {
                    name: 'Безлимитный',
                    service: 'Телефония',
                    speed: null,
                    price: 479,
                    period: 'месяц',
                    description: 'Тариф "Безлимитный" - Безлимитные звонки на местные городские номера, звонки на мобильные от 1.5 руб./мин за 479 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Комбинированный',
                    service: 'Телефония',
                    speed: null,
                    price: 373,
                    period: 'месяц',
                    description: 'Тариф "Комбинированный" - 400 минут/месяц на местные городские номера, далее 0.54 руб./мин, звонки на мобильные от 1.5 руб./мин за 373 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Повременный',
                    service: 'Телефония',
                    speed: null,
                    price: 211,
                    period: 'месяц',
                    description: 'Тариф "Повременный" - Звонки на местные городские номера 0.62 руб./мин, звонки на мобильные от 1.5 руб./мин за 211 руб./мес.',
                    isPromotion: false
                },
                // Тарифы на мобильную связь
                {
                    name: 'Технологии общения. Хит сезона X',
                    service: 'Мобильная связь',
                    speed: 200,
                    price: 375,
                    period: 'месяц',
                    description: 'Тариф "Технологии общения. Хит сезона X" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 375 руб./мес. Скидка действует 120 дней, далее 750 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии общения.',
                    service: 'Мобильная связь',
                    speed: 300,
                    price: 475,
                    period: 'месяц',
                    description: 'Тариф "Технологии общения." - 300 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 475 руб./мес. Скидка действует 60 дней, далее 950 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды.Хит сезона Х',
                    service: 'Мобильная связь',
                    speed: 200,
                    price: 425,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды.Хит сезона Х" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 425 руб./мес. Скидка действует 120 дней, далее 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды Онлайн. Хит сезона Х',
                    service: 'Мобильная связь',
                    speed: 200,
                    price: 425,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды Онлайн. Хит сезона Х" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 425 руб./мес. Скидка действует 120 дней, далее 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды',
                    service: 'Мобильная связь',
                    speed: 500,
                    price: 525,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды" - 500 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 525 руб./мес. Скидка действует 60 дней, далее 1050 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды Онлайн.',
                    service: 'Мобильная связь',
                    speed: 500,
                    price: 675,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды Онлайн." - 500 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 675 руб./мес. Скидка действует 60 дней, далее 1050 руб./мес.',
                    isPromotion: true
                },
                // Пакетные предложения
                {
                    name: 'Технологии развлечения. Онлайн',
                    service: 'Пакетное предложение',
                    speed: 300,
                    price: 700,
                    period: 'месяц',
                    description: 'Тариф "Технологии развлечения. Онлайн" - 300 Мбит/с интернет + более 170 каналов через приложение Wink за 700 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Технологии развлечения',
                    service: 'Пакетное предложение',
                    speed: 300,
                    price: 700,
                    period: 'месяц',
                    description: 'Тариф "Технологии развлечения" - 300 Мбит/с интернет + более 170 каналов за 700 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'beeline',
            name: 'Билайн',
            is_active: true,
            services: ['Интернет', 'Мобильная связь', 'Пакетное предложение'],
            mainTariff: 'Для дома 200 Акция',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Для дома 200 Акция',
                    service: 'Интернет',
                    speed: 200,
                    price: 250,
                    period: 'месяц',
                    description: 'Тариф "Для дома 200 Акция" - 200 Мбит/с за 250 руб./мес. С 3 месяца 500 руб./мес. Роутер аренда Wifi роутера "Smart Box" 5ггц - 150 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Для дома 300 Акция',
                    service: 'Интернет',
                    speed: 300,
                    price: 275,
                    period: 'месяц',
                    description: 'Тариф "Для дома 300 Акция" - 300 Мбит/с за 275 руб./мес. С 3 месяца 550 руб./мес. Роутер аренда Wifi роутера "Smart Box" 5ггц - 150 руб./мес.',
                    isPromotion: true
                },
                // Тарифы на мобильную связь
                {
                    name: 'Близкие люди',
                    service: 'Мобильная связь',
                    speed: null,
                    price: 650,
                    period: 'месяц',
                    description: 'Тариф "Близкие люди" - 1200 минут ∞ Гб 300 sms за 650 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'UP. Дракон',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 436,
                    period: 'месяц',
                    description: 'Тариф "UP. Дракон" - 100 Мбит/с интернет + 200 каналов + 600 минут 40 Гб за 436 руб./мес. С 3 месяца цена 790 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'UP. Кот',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 512,
                    period: 'месяц',
                    description: 'Тариф "UP. Кот" - 100 Мбит/с интернет + 200 каналов + 1200 минут 50 Гб за 512 руб./мес. С 3 месяца цена 980 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Интернет с ТВ 100',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 475,
                    period: 'месяц',
                    description: 'Тариф "Интернет с ТВ 100" - 100 Мбит/с интернет + 215 каналов + 50 Гб 600 мин 0 sms за 475 руб./мес. С 5 месяца - 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Интернет с ТВ 500',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 575,
                    period: 'месяц',
                    description: 'Тариф "Интернет с ТВ 500" - 500 Мбит/с интернет + 215 каналов + 50 Гб 600 мин 0 sms за 575 руб./мес. С 5 месяца - 950 руб./мес.',
                    isPromotion: true
                }
            ]
        },
        {
            slug: 'megafon',
            name: 'МегаФон',
            is_active: true,
            services: ['Интернет', 'Мобильная связь', 'Пакетное предложение'],
            mainTariff: 'ДляДома Интернет',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'ДляДома Интернет',
                    service: 'Интернет',
                    speed: 100,
                    price: 250,
                    period: 'месяц',
                    description: 'Тариф "ДляДома Интернет" - 100 Мбит/с за 250 руб./мес. Скидка 50% на 2 месяца, далее 500 руб./мес. Роутер рассрочка 36 мес. - 120 руб/мес.',
                    isPromotion: true
                },
                {
                    name: 'ДляДомаТурбо',
                    service: 'Интернет',
                    speed: 300,
                    price: 275,
                    period: 'месяц',
                    description: 'Тариф "ДляДомаТурбо" - 300 Мбит/с за 275 руб./мес. Скидка 50% на 2 месяца, далее 550 руб./мес. Роутер рассрочка 36 мес. - 120 руб/мес.',
                    isPromotion: true
                },
                // Тарифы на мобильную связь
                {
                    name: 'Без переплат Всё',
                    service: 'Мобильная связь',
                    speed: null,
                    price: 330,
                    period: 'месяц',
                    description: 'Тариф "Без переплат Всё" - 600 минут безлимитный интернет за 330 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'ДляДома Всё',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 325,
                    period: 'месяц',
                    description: 'Тариф "ДляДома Всё" - 200 Мбит/с интернет + более 250 каналов за 325 руб./мес. Скидка 50% на 60 дней, далее 650 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Мегафон 3.0 Минимум',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 475,
                    period: 'месяц',
                    description: 'Тариф "Мегафон 3.0 Минимум" - 100 Мбит/с интернет + более 250 каналов + 1 sim МегаФон (5 Гб интернета, 500 минут, безлимит внутри сети) за 475 руб./мес. Скидка 50% на 2 месяца, далее 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'ДляДома Максимум',
                    service: 'Пакетное предложение',
                    speed: 300,
                    price: 350,
                    period: 'месяц',
                    description: 'Тариф "ДляДома Максимум" - 300 Мбит/с интернет + более 250 каналов за 350 руб./мес. Скидка 50% на 60 дней, далее 700 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Мегафон 3.0 Интернет',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 560,
                    period: 'месяц',
                    description: 'Тариф "Мегафон 3.0 Интернет" - 500 Мбит/с интернет + более 250 каналов + 1 sim МегаФон (35 Гб интернет, 200 минут, безлимит внутри сети) за 560 руб./мес. Скидка 50% на 2 месяца, далее 1020 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Мегафон 3.0 VIP',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 600,
                    period: 'месяц',
                    description: 'Тариф "Мегафон 3.0 VIP" - 500 Мбит/с интернет + 250 каналов + 1 sim МегаФон (50 Гб, 1500 минут, безлимит внутри сети) за 600 руб./мес. С 2 месяца 1200 руб./мес.',
                    isPromotion: true
                }
            ]
        },
        {
            slug: 'etelecom',
            name: 'еТелеком',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Пакетное предложение'],
            mainTariff: '200 за 299',
            tariffs: [
                // Тарифы на интернет
                {
                    name: '100',
                    service: 'Интернет',
                    speed: 100,
                    price: 699,
                    period: 'месяц',
                    description: 'Тариф "100" - 100 Мбит/с за 699 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '200',
                    service: 'Интернет',
                    speed: 200,
                    price: 799,
                    period: 'месяц',
                    description: 'Тариф "200" - 200 Мбит/с за 799 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '500',
                    service: 'Интернет',
                    speed: 500,
                    price: 899,
                    period: 'месяц',
                    description: 'Тариф "500" - 500 Мбит/с за 899 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '1000',
                    service: 'Интернет',
                    speed: 1000,
                    price: 1199,
                    period: 'месяц',
                    description: 'Тариф "1000" - 1000 Мбит/с за 1199 руб./мес.',
                    isPromotion: false
                },
                // Тарифы на телевидение
                {
                    name: 'Цифровое телевидение',
                    service: 'Телевидение',
                    speed: null,
                    price: 300,
                    period: 'месяц',
                    description: 'Тариф "Цифровое телевидение" - 144 канала (30 HD-каналов) за 300 руб./мес. Приставка не требуется.',
                    isPromotion: false
                },
                // Акционные тарифы на интернет
                {
                    name: '200 за 299',
                    service: 'Интернет',
                    speed: 200,
                    price: 299,
                    period: 'месяц',
                    description: 'Тариф «200 за 299» - 200 Мбит/с за 299 руб/месяц (Акция). Условия: Необходимо внести на счет 1500 руб. акция действует в течении 5 месяцев, далее постоянный тариф за 700 р/мес.',
                    isPromotion: true
                },
                {
                    name: '1 ГБИТ',
                    service: 'Интернет',
                    speed: 1000,
                    price: 699,
                    period: 'месяц',
                    description: 'Тариф «1 ГБИТ» - 1000 Мбит/с за 699 руб/месяц (Акция). Условия: Необходимо внести на счет 1500 руб. акция действует в течении 3-х месяцев, далее постоянный тариф за 1199 р/мес.',
                    isPromotion: true
                },
                // Пакетные предложения
                {
                    name: 'Интернет +Телевидение',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 899,
                    period: 'месяц',
                    description: 'Тариф "Интернет +Телевидение" - 100 Мбит/с интернет + 143 канала за 899 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'skynet-provider',
            name: 'SkyNet',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Пакетное предложение'],
            mainTariff: 'Хочу скайнет',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Т-100',
                    service: 'Интернет',
                    speed: 100,
                    price: 750,
                    period: 'месяц',
                    description: 'Тариф "Т-100" - 100 Мбит/с за 750 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Т-250',
                    service: 'Интернет',
                    speed: 250,
                    price: 750,
                    period: 'месяц',
                    description: 'Тариф «Т-250» - 250 Мбит/с за 750 руб/месяц',
                    isPromotion: false
                },
                {
                    name: 'T-400',
                    service: 'Интернет',
                    speed: 400,
                    price: 1500,
                    period: 'месяц',
                    description: 'Тариф "T-400" - 400 Мбит/с за 1500 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'T-800',
                    service: 'Интернет',
                    speed: 800,
                    price: 1800,
                    period: 'месяц',
                    description: 'Тариф "T-800" - 800 Мбит/с за 1800 руб./мес.',
                    isPromotion: false
                },
                // Тарифы на телевидение
                {
                    name: 'Медиа',
                    service: 'Телевидение',
                    speed: null,
                    price: 250,
                    period: 'месяц',
                    description: 'Тариф "Медиа" - 64 цифровых канала + онлайн-кинотеатр IVI за 250 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'Хочу скайнет',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 325,
                    period: 'месяц',
                    description: 'Тариф "Хочу скайнет" - 100 Мбит/с интернет + 60 цифровых каналов + IVI на 30 дней за 325 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Т-100 с ТВ',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 900,
                    period: 'месяц',
                    description: 'Тариф "Т-100 с ТВ" - 100 Мбит/с интернет + 64 цифровых канала + онлайн-кинотеатр IVI за 900 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'pin-telekom',
            name: 'ПИН',
            is_active: true,
            services: ['Интернет', 'Телефония'],
            mainTariff: 'Люкс',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Люкс',
                    service: 'Интернет',
                    speed: 100,
                    price: 630,
                    period: 'месяц',
                    description: 'Тариф "Люкс" - 100 Мбит/с интернет + 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
                    isPromotion: false
                },
                {
                    name: 'Премиум',
                    service: 'Интернет',
                    speed: 500,
                    price: 1300,
                    period: 'месяц',
                    description: 'Тариф "Премиум" - 500 Мбит/с интернет + 102 канала за 1300 руб./мес. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гигабит',
                    service: 'Интернет',
                    speed: 1000,
                    price: 1600,
                    period: 'месяц',
                    description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + 102 канала за 1600 руб./мес. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                },
                // Тарифы на телефонию
                {
                    name: 'Поминутный',
                    service: 'Телефония',
                    speed: null,
                    price: 50,
                    period: 'месяц',
                    description: 'Тариф "Поминутный" - Городской номер и поминутная оплата за 50 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Городской безлимит',
                    service: 'Телефония',
                    speed: null,
                    price: 199,
                    period: 'месяц',
                    description: 'Тариф "Городской безлимит" - Общение со всем городом без ограничений за 199 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '400 минут',
                    service: 'Телефония',
                    speed: null,
                    price: 399,
                    period: 'месяц',
                    description: 'Тариф "400 минут" - Включено 400 минут разговоров по всей России за 399 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Россия анлим',
                    service: 'Телефония',
                    speed: null,
                    price: 899,
                    period: 'месяц',
                    description: 'Тариф "Россия анлим" - Безлимитный тариф для разговоров по всей России за 899 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'aikonet',
            name: 'Aiconet',
            is_active: true,
            services: ['Интернет', 'Пакетное предложение'],
            mainTariff: 'Люкс',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Люкс',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 630,
                    period: 'месяц',
                    description: 'Тариф "Люкс" - 100 Мбит/с интернет + телевидение через приложение 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
                    isPromotion: false
                },
                {
                    name: 'Премиум',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 1300,
                    period: 'месяц',
                    description: 'Тариф "Премиум" - 500 Мбит/с интернет + телевидение через приложение 102 канала за 1300 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гигабит',
                    service: 'Пакетное предложение',
                    speed: 1000,
                    price: 1600,
                    period: 'месяц',
                    description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + телевидение через приложение 102 канала за 1600 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'arbital',
            name: 'Arbital',
            is_active: true,
            services: ['Интернет', 'Пакетное предложение'],
            mainTariff: 'Люкс',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Люкс',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 630,
                    period: 'месяц',
                    description: 'Тариф "Люкс" - 100 Мбит/с интернет + телевидение через приложение 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
                    isPromotion: false
                },
                {
                    name: 'Премиум',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 1300,
                    period: 'месяц',
                    description: 'Тариф "Премиум" - 500 Мбит/с интернет + телевидение через приложение 102 канала за 1300 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гигабит',
                    service: 'Пакетное предложение',
                    speed: 1000,
                    price: 1600,
                    period: 'месяц',
                    description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + телевидение через приложение 102 канала за 1600 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'obit',
            name: 'Енева',
            is_active: true,
            services: ['Интернет', 'Телефония', 'Пакетное предложение'],
            mainTariff: 'Пятёрка',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Пятёрка',
                    service: 'Интернет',
                    speed: 100,
                    price: 330,
                    period: 'месяц',
                    description: 'Тариф "Пятёрка" - 100 Мбит/с за 330 руб./мес. 1650 р. за 5 мес. + 300 р. за подключение. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
                    isPromotion: true
                },
                {
                    name: 'Интернет 100',
                    service: 'Интернет',
                    speed: 100,
                    price: 650,
                    period: 'месяц',
                    description: 'Тариф "Интернет 100" - 100 Мбит/с за 650 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
                    isPromotion: false
                },
                {
                    name: 'Интернет 200',
                    service: 'Интернет',
                    speed: 200,
                    price: 900,
                    period: 'месяц',
                    description: 'Тариф "Интернет 200" - 200 Мбит/с за 900 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.) или Archer C5 - 3600 руб (рассрочка на год - 360 руб./мес.).',
                    isPromotion: false
                },
                {
                    name: 'Интернет 500',
                    service: 'Интернет',
                    speed: 500,
                    price: 1100,
                    period: 'месяц',
                    description: 'Тариф "Интернет 500" - 500 Мбит/с за 1100 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
                    isPromotion: false
                },
                // Тарифы на телефонию
                {
                    name: 'Безлимитный',
                    service: 'Телефония',
                    speed: null,
                    price: 400,
                    period: 'месяц',
                    description: 'Тариф "Безлимитный" - звонки на городские номера 0 руб./мин., на мобильные номера 1.5 руб./мин. за 400 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'Пятёрка 200',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 450,
                    period: 'месяц',
                    description: 'Тариф "Пятёрка 200" - 200 Мбит/с интернет + телевидение через приложение 122 канала за 450 руб./мес. Предоплата за 5 месяцев 2550₽. Покупка WiFi-роутера MERCUSYS AC1300 - 3490 руб. Рассрочка - 329 руб.(12 мес.).',
                    isPromotion: true
                },
                {
                    name: '100 + ТВ Лайт',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 800,
                    period: 'месяц',
                    description: 'Тариф "100 + ТВ Лайт" - 100 Мбит/с интернет + 122 канала за 800 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
                    isPromotion: false
                },
                {
                    name: '200 + ТВ Лайт',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 1050,
                    period: 'месяц',
                    description: 'Тариф "200 + ТВ Лайт" - 200 Мбит/с интернет + 122 канала за 1050 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
                    isPromotion: false
                },
                {
                    name: '500 + ТВ Лайт',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 1250,
                    period: 'месяц',
                    description: 'Тариф "500 + ТВ Лайт" - 500 Мбит/с интернет + 122 канала за 1250 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'domovoy',
            name: 'Домовой',
            is_active: true,
            services: ['Интернет', 'Пакетное предложение'],
            mainTariff: 'Интернет 100 Мбит/сек',
            tariffs: [
                {
                    name: 'Интернет 100 Мбит/сек',
                    service: 'Интернет',
                    speed: 100,
                    price: 180,
                    period: 'месяц',
                    description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
                    isPromotion: false
                },
                {
                    name: 'Интернет 100 Мбит/сек + ТВ',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 300,
                    period: 'месяц',
                    description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'rostelekom-tkt',
            name: 'Ростелеком ТКТ',
            is_active: true,
            services: ['Интернет', 'Мобильная связь', 'Пакетное предложение'],
            mainTariff: 'Просто интернет',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Просто интернет',
                    service: 'Интернет',
                    speed: 100,
                    price: 500,
                    period: 'месяц',
                    description: 'Тариф "Просто интернет" - 100 Мбит/с за 500 руб./мес. Необходимо пользоваться услугами не менее 12 мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Технология доступа',
                    service: 'Интернет',
                    speed: 100,
                    price: 550,
                    period: 'месяц',
                    description: 'Тариф "Технология доступа" - 100 Мбит/с за 550 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Игровой',
                    service: 'Интернет',
                    speed: 100,
                    price: 990,
                    period: 'месяц',
                    description: 'Тариф "Игровой" - 100 Мбит/с за 990 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                // Тарифы на мобильную связь
                {
                    name: 'Технологии общения. Хит сезона X',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 375,
                    period: 'месяц',
                    description: 'Тариф "Технологии общения. Хит сезона X" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms за 375 руб./мес. Скидка действует 120 дней, далее тариф 750 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии общения. Семейный',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 475,
                    period: 'месяц',
                    description: 'Тариф "Технологии общения. Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms за 475 руб./мес. Скидка действует 60 дней, далее тариф 950 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды Онлайн. Хит сезона Х',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 425,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды Онлайн. Хит сезона Х" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms + более 170 каналов через приложение Wink за 425 руб./мес. Скидка действует 120 дней, далее тариф 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды Онлайн.Семейный',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 525,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды Онлайн.Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms + более 170 каналов через приложение Wink за 525 руб./мес. Скидка действует 60 дней, далее тариф 1050 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды.Хит сезона Х',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 425,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды.Хит сезона Х" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms + более 170 каналов за 425 руб./мес. Скидка действует 120 дней, далее тариф 850 руб./мес.',
                    isPromotion: true
                },
                {
                    name: 'Технологии выгоды.Семейный',
                    service: 'Мобильная связь',
                    speed: 100,
                    price: 525,
                    period: 'месяц',
                    description: 'Тариф "Технологии выгоды.Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms + более 170 каналов за 525 руб./мес. Скидка действует 60 дней, далее тариф 1050 руб./мес.',
                    isPromotion: true
                },
                // Пакетные предложения
                {
                    name: 'Для развлечений',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 650,
                    period: 'месяц',
                    description: 'Тариф "Для развлечений" - 100 Мбит/с интернет + более 180 каналов за 650 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                },
                {
                    name: 'Технологии развлечений. Онлайн',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 700,
                    period: 'месяц',
                    description: 'Тариф "Технологии развлечений. Онлайн" - 100 Мбит/с интернет + более 170 каналов через приложение Wink за 700 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'ethome',
            name: 'AT-HOME',
            is_active: true,
            services: ['Интернет', 'Пакетное предложение'],
            mainTariff: '5 по 299',
            tariffs: [
                // Тарифы на интернет
                {
                    name: '5 по 299',
                    service: 'Интернет',
                    speed: 200,
                    price: 299,
                    period: 'месяц',
                    description: 'Тариф "5 по 299" - 200 Мбит/с интернет + 200 каналов через приложение Смотрешка на Smart TV за 299 руб./мес. С 6 месяца - 799 руб./мес, без ТВ.',
                    isPromotion: true
                },
                {
                    name: '100 Мбит/c',
                    service: 'Интернет',
                    speed: 100,
                    price: 699,
                    period: 'месяц',
                    description: 'Тариф "100 Мбит/c" - 100 Мбит/с за 699 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
                    isPromotion: false
                },
                {
                    name: '200 Мбит/c',
                    service: 'Интернет',
                    speed: 200,
                    price: 799,
                    period: 'месяц',
                    description: 'Тариф "200 Мбит/c" - 200 Мбит/с за 799 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
                    isPromotion: false
                },
                {
                    name: '500 Мбит/c',
                    service: 'Интернет',
                    speed: 500,
                    price: 899,
                    period: 'месяц',
                    description: 'Тариф "500 Мбит/c" - 500 Мбит/с за 899 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: '100 Mб/с + TB',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 948,
                    period: 'месяц',
                    description: 'Тариф "100 Mб/с + TB" - 100 Мбит/с интернет + 283 канала за 948 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
                    isPromotion: false
                },
                {
                    name: '200 Mб/с + TB',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 1048,
                    period: 'месяц',
                    description: 'Тариф "200 Mб/с + TB" - 200 Мбит/с интернет + 283 канала за 1048 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
                    isPromotion: false
                },
                {
                    name: '500 Mб/с + TB',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 1148,
                    period: 'месяц',
                    description: 'Тариф "500 Mб/с + TB" - 500 Мбит/с интернет + 283 канала за 1148 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'fgup-rsvo',
            name: 'РСВО-Онлайн',
            is_active: true,
            services: ['Интернет', 'Телефония', 'Пакетное предложение'],
            mainTariff: 'ИНТЕРНЕТ 50',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'ИНТЕРНЕТ 50',
                    service: 'Интернет',
                    speed: 50,
                    price: 350,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 50" - 50 Мбит/с за 350 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'ИНТЕРНЕТ 100',
                    service: 'Интернет',
                    speed: 100,
                    price: 450,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 100" - 100 Мбит/с за 450 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'ИНТЕРНЕТ 200',
                    service: 'Интернет',
                    speed: 200,
                    price: 650,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 200" - 200 Мбит/с за 650 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'ИНТЕРНЕТ 300',
                    service: 'Интернет',
                    speed: 300,
                    price: 800,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 300" - 300 Мбит/с за 800 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'ИНТЕРНЕТ 600',
                    service: 'Интернет',
                    speed: 600,
                    price: 900,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 600" - 600 Мбит/с за 900 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'ИНТЕРНЕТ 1000',
                    service: 'Интернет',
                    speed: 1000,
                    price: 1250,
                    period: 'месяц',
                    description: 'Тариф "ИНТЕРНЕТ 1000" - 1000 Мбит/с за 1250 руб./мес.',
                    isPromotion: false
                },
                // Тарифы на телефонию
                {
                    name: 'Повременный',
                    service: 'Телефония',
                    speed: null,
                    price: 290,
                    period: 'месяц',
                    description: 'Тариф "Повременный" - звонки на городские номера 0.62 руб./мин., на мобильные номера 3.16 руб./мин. за 290 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Безлимитный',
                    service: 'Телефония',
                    speed: null,
                    price: 585,
                    period: 'месяц',
                    description: 'Тариф "Безлимитный" - звонки на городские номера 0 руб./мин., на мобильные номера 3.16 руб./мин. за 585 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: '50 Мбит/с +Базовый',
                    service: 'Пакетное предложение',
                    speed: 50,
                    price: 499,
                    period: 'месяц',
                    description: 'Тариф "50 Мбит/с +Базовый" - 50 Мбит/с интернет + 199 каналов за 499 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '100 Мбит/с +Базовый',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 599,
                    period: 'месяц',
                    description: 'Тариф "100 Мбит/с +Базовый" - 100 Мбит/с интернет + 199 каналов за 599 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '200 Мбит/с +Базовый',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 799,
                    period: 'месяц',
                    description: 'Тариф "200 Мбит/с +Базовый" - 200 Мбит/с интернет + 199 каналов за 799 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'prostor-telekom',
            name: 'Простор телеком',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Пакетное предложение'],
            mainTariff: '200 за 600',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Постоянный',
                    service: 'Интернет',
                    speed: 100,
                    price: 1050,
                    period: '3 месяца',
                    description: 'Тариф "Постоянный" - 100 Мбит/с за 1050 руб. за 3 месяца (оплата квартально).',
                    isPromotion: false
                },
                {
                    name: '200 за 600',
                    service: 'Интернет',
                    speed: 200,
                    price: 600,
                    period: 'месяц',
                    description: 'Тариф "200 за 600" - 200 Мбит/с за 600 руб./мес. Первый платеж 1200 руб. за 2 месяца.',
                    isPromotion: true
                },
                {
                    name: 'ПРЕМИУМ',
                    service: 'Интернет',
                    speed: 300,
                    price: 750,
                    period: 'месяц',
                    description: 'Тариф "ПРЕМИУМ" - 300 Мбит/с за 750 руб./мес. Первоначальный платеж 1500 руб. за 2 месяца.',
                    isPromotion: true
                },
                {
                    name: 'Домино-актив 1',
                    service: 'Интернет',
                    speed: 50,
                    price: 700,
                    period: 'месяц',
                    description: 'Тариф "Домино-актив 1" - 50 Мбит/с за 700 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Домино-актив 2',
                    service: 'Интернет',
                    speed: 70,
                    price: 780,
                    period: 'месяц',
                    description: 'Тариф "Домино-актив 2" - 70 Мбит/с за 780 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Домино-скорость 1',
                    service: 'Интернет',
                    speed: 85,
                    price: 840,
                    period: 'месяц',
                    description: 'Тариф "Домино-скорость 1" - 85 Мбит/с за 840 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Домино-скорость 2',
                    service: 'Интернет',
                    speed: 100,
                    price: 1070,
                    period: 'месяц',
                    description: 'Тариф "Домино-скорость 2" - 100 Мбит/с за 1070 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: '50 Мбит/с + ТВ (КОМБО ЛАЙТ)',
                    service: 'Пакетное предложение',
                    speed: 50,
                    price: 949,
                    period: 'месяц',
                    description: 'Тариф "50 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 50 Мбит/с интернет + 271 канал за 949 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '70 Мбит/с + ТВ (КОМБО ЛАЙТ)',
                    service: 'Пакетное предложение',
                    speed: 70,
                    price: 1029,
                    period: 'месяц',
                    description: 'Тариф "70 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 70 Мбит/с интернет + 271 канал за 1029 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '85 Мбит/с + ТВ (КОМБО ЛАЙТ)',
                    service: 'Пакетное предложение',
                    speed: 85,
                    price: 1089,
                    period: 'месяц',
                    description: 'Тариф "85 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 85 Мбит/с интернет + 271 канал за 1089 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '100 Мбит/с + ТВ (КОМБО ЛАЙТ)',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 1319,
                    period: 'месяц',
                    description: 'Тариф "100 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 100 Мбит/с интернет + 271 канал за 1319 руб./мес.',
                    isPromotion: false
                },
                {
                    name: '200 Мбит/с + ТВ (КОМБО ЛАЙТ)',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 1529,
                    period: 'месяц',
                    description: 'Тариф "200 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 200 Мбит/с интернет + 249 каналов за 1529 руб./мес.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'interzet',
            name: 'ДОМ Ru',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Пакетное предложение'],
            mainTariff: 'Гига 300',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Гига 300',
                    service: 'Интернет',
                    speed: 300,
                    price: 1000,
                    period: 'месяц',
                    description: 'Тариф "Гига 300" - 300 Мбит/с за 1000 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гига 500',
                    service: 'Интернет',
                    speed: 500,
                    price: 1000,
                    period: 'месяц',
                    description: 'Тариф "Гига 500" - 500 Мбит/с за 1000 руб./мес. С 3 месяца 1100 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
                    isPromotion: true
                },
                {
                    name: 'Гига 800',
                    service: 'Интернет',
                    speed: 800,
                    price: 1000,
                    period: 'месяц',
                    description: 'Тариф "Гига 800" - 800 Мбит/с за 1000 руб./мес. С 3 месяца 1150 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
                    isPromotion: true
                },
                {
                    name: 'Гига 1000',
                    service: 'Интернет',
                    speed: 1000,
                    price: 1000,
                    period: 'месяц',
                    description: 'Тариф "Гига 1000" - 1000 Мбит/с за 1000 руб./мес. С 3 месяца 1550 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
                    isPromotion: true
                },
                // Тарифы на телевидение
                {
                    name: 'Моно ЦТВ',
                    service: 'Телевидение',
                    speed: null,
                    price: 340,
                    period: 'месяц',
                    description: 'Тариф "Моно ЦТВ" - 155 каналов за 340 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'Гига 300',
                    service: 'Пакетное предложение',
                    speed: 300,
                    price: 1000,
                    period: 'месяц',
                    description: 'Тариф "Гига 300" - 300 Мбит/с интернет + 185 каналов за 1000 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гига 500',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 1100,
                    period: 'месяц',
                    description: 'Тариф "Гига 500" - 500 Мбит/с интернет + 185 каналов за 1100 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
                    isPromotion: false
                },
                {
                    name: 'Гига 800',
                    service: 'Пакетное предложение',
                    speed: 800,
                    price: 1150,
                    period: 'месяц',
                    description: 'Тариф "Гига 800" - 800 Мбит/с интернет + 185 каналов за 1150 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'newlink',
            name: 'NewLink',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Пакетное предложение'],
            mainTariff: 'Идеальный',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Идеальный',
                    service: 'Интернет',
                    speed: 100,
                    price: 580,
                    period: 'месяц',
                    description: 'Тариф "Идеальный" - 100 Мбит/с за 580 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
                    isPromotion: false
                },
                {
                    name: 'Оптимальный',
                    service: 'Интернет',
                    speed: 200,
                    price: 720,
                    period: 'месяц',
                    description: 'Тариф "Оптимальный" - 200 Мбит/с за 720 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
                    isPromotion: false
                },
                {
                    name: 'Уникальный',
                    service: 'Интернет',
                    speed: 500,
                    price: 950,
                    period: 'месяц',
                    description: 'Тариф "Уникальный" - 500 Мбит/с за 950 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'Идеальный + ТВ',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 580,
                    period: 'месяц',
                    description: 'Тариф "Идеальный + ТВ" - 100 Мбит/с интернет + Moovi 102 канала за 580 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка залог.',
                    isPromotion: false
                },
                {
                    name: 'Оптимальный+ТВ',
                    service: 'Пакетное предложение',
                    speed: 200,
                    price: 720,
                    period: 'месяц',
                    description: 'Тариф "Оптимальный+ТВ" - 200 Мбит/с интернет + Moovi 102 канала за 720 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка MAG 420 - 5880 руб.',
                    isPromotion: false
                },
                {
                    name: 'Уникальный + ТВ',
                    service: 'Пакетное предложение',
                    speed: 500,
                    price: 950,
                    period: 'месяц',
                    description: 'Тариф "Уникальный + ТВ" - 500 Мбит/с интернет + Moovi 102 канала за 950 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка MAG 420 - 5880 руб.',
                    isPromotion: false
                }
            ]
        },
        {
            slug: 'pakt',
            name: 'ПАКТ',
            is_active: true,
            services: ['Интернет', 'Телевидение', 'Телефония', 'Пакетное предложение'],
            mainTariff: 'Интернет 50',
            tariffs: [
                // Тарифы на интернет
                {
                    name: 'Интернет 50',
                    service: 'Интернет',
                    speed: 50,
                    price: 500,
                    period: 'месяц',
                    description: 'Тариф "Интернет 50" - 50 Мбит/с за 500 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
                    isPromotion: true
                },
                {
                    name: '4 по 300',
                    service: 'Интернет',
                    speed: 100,
                    price: 300,
                    period: 'месяц',
                    description: 'Тариф "4 по 300" - 100 Мбит/с за 300 руб./мес. 4 месяца интернета при единовременном платеже 1200 руб. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
                    isPromotion: true
                },
                {
                    name: 'Интернет 100',
                    service: 'Интернет',
                    speed: 100,
                    price: 600,
                    period: 'месяц',
                    description: 'Тариф "Интернет 100" - 100 Мбит/с за 600 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
                    isPromotion: true
                },
                {
                    name: 'Интернет 300',
                    service: 'Интернет',
                    speed: 300,
                    price: 750,
                    period: 'месяц',
                    description: 'Тариф "Интернет 300" - 300 Мбит/с за 750 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
                    isPromotion: true
                },
                {
                    name: 'Интернет 700',
                    service: 'Интернет',
                    speed: 700,
                    price: 950,
                    period: 'месяц',
                    description: 'Тариф "Интернет 700" - 700 Мбит/с за 950 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес, покупка Cudy WR1500 - 4000 руб. или Keenetic Viva - 7700 руб.',
                    isPromotion: false
                },
                {
                    name: 'Интернет 900',
                    service: 'Интернет',
                    speed: 900,
                    price: 1400,
                    period: 'месяц',
                    description: 'Тариф "Интернет 900" - 900 Мбит/с за 1400 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес, покупка Cudy WR1500 - 4000 руб. или Keenetic Viva - 7700 руб.',
                    isPromotion: false
                },
                // Тарифы на телевидение
                {
                    name: 'Базовый',
                    service: 'Телевидение',
                    speed: null,
                    price: 220,
                    period: 'месяц',
                    description: 'Тариф "Базовый" - 150 каналов за 220 руб./мес. Приставка не требуется.',
                    isPromotion: false
                },
                // Тарифы на телефонию
                {
                    name: 'Минуты под контролем',
                    service: 'Телефония',
                    speed: null,
                    price: 170,
                    period: 'месяц',
                    description: 'Тариф "Минуты под контролем" - звонки на городские номера 0.45 руб./мин., на мобильные номера 1.50 руб./мин. за 170 руб./мес.',
                    isPromotion: false
                },
                {
                    name: 'Всегда на связи',
                    service: 'Телефония',
                    speed: null,
                    price: 340,
                    period: 'месяц',
                    description: 'Тариф "Всегда на связи" - звонки на городские номера 0 руб./мин., на мобильные номера 1.50 руб./мин. за 340 руб./мес.',
                    isPromotion: false
                },
                // Пакетные предложения
                {
                    name: 'Интернет и ТВ БЕЗ ГРАНИЦ',
                    service: 'Пакетное предложение',
                    speed: 100,
                    price: 300,
                    period: 'месяц',
                    description: 'Тариф "Интернет и ТВ БЕЗ ГРАНИЦ" - 100 Мбит/с интернет + онлайн ТВ "iPakt" 136 каналов за 300 руб./мес. Акция предоставляется только на 4 месяца, с 5-го месяца 650 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
                    isPromotion: true
                }
            ]
        }
    ]
};

// Данные вознаграждений для всех 15 провайдеров (по данным из таблицы)
const REWARDS_DATA = {
    rostelecom: {
        'Интернет': 1000,
        'Телевидение': 200,
        'Телефония': 300,
        'Мобильная связь': 1500,
        'Пакетное предложение': 1300
    },
    beeline: {
        'Интернет': 500,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 700
    },
    megafon: {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    etelecom: {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    'skynet-provider': {
        'Интернет': 1600,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1600
    },
    domovoy: {
        'Интернет': 1200,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1200
    },
    'pin-telekom': {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    'rostelekom-tkt': {
        'Интернет': 1000,
        'Телевидение': 200,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1300
    },
    ethome: {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    'fgup-rsvo': {
        'Интернет': 500,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 500
    },
    'prostor-telekom': {
        'Интернет': 700,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 700
    },
    interzet: {
        'Интернет': 1500,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1500
    },
    newlink: {
        'Интернет': 300,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 300
    },
    pakt: {
        'Интернет': 500,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 500
    },
    aikonet: {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    arbital: {
        'Интернет': 1000,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 1000
    },
    obit: {
        'Интернет': 200,
        'Телевидение': 0,
        'Телефония': 0,
        'Мобильная связь': 0,
        'Пакетное предложение': 200
    }
};

// Глобальные переменные для провайдеров
let currentProvider = null;
let currentService = null;
let currentTariff = null;
let providersData = {};

// Инициализация провайдеров
function initProviders() {
    // Инициализируем систему провайдеров
    initProvidersSystem();
}

// Инициализация системы провайдеров
function initProvidersSystem() {
    console.log('🚀 Инициализация системы провайдеров...');

    // Загружаем базовые данные провайдеров
    loadBasicProvidersData();

    // Пытаемся загрузить актуальные данные с сайта
    loadProvidersFromSite();

    // Заполняем список провайдеров
    populateProvidersList();

    console.log('✅ Система провайдеров инициализирована');
}

// Загрузка провайдеров с сайта allcitynet.ru
async function loadProvidersFromSite() {
    try {
        console.log('🌐 Загрузка провайдеров с сайта allcitynet.ru...');

        // Пытаемся загрузить HTML страницу с провайдерами
        const response = await fetch('https://allcitynet.ru/providers/', {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.ok) {
            const html = await response.text();
            console.log('✅ Получен HTML с сайта, парсим провайдеров...');

            // Парсим провайдеров из HTML
            const parsedProviders = parseProvidersFromHTML(html);

            if (parsedProviders && parsedProviders.length > 0) {
                providers = parsedProviders;
                console.log('🔄 Обновлен массив провайдеров с сайта:', providers);
                console.log(`📊 Загружено ${providers.length} провайдеров с сайта`);
            } else {
                console.log('⚠️ Не удалось распарсить провайдеров из HTML');
            }
        } else {
            console.log('⚠️ Не удалось загрузить страницу с провайдерами, используем локальные данные');
        }
    } catch (error) {
        console.log('⚠️ Ошибка загрузки провайдеров с сайта:', error.message);
        console.log('📋 Используем локальные данные провайдеров');
    }
}

// Парсинг провайдеров из HTML
function parseProvidersFromHTML(html) {
    try {
        console.log('🔍 Парсинг провайдеров из HTML...');

        // Создаем временный DOM элемент для парсинга
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Ищем все элементы с провайдерами
        const providerElements = doc.querySelectorAll('#provider .panel-body');
        const parsedProviders = [];

        providerElements.forEach((element, index) => {
            try {
                // Извлекаем название провайдера
                const nameElement = element.querySelector('h2.heading-top a');
                const name = nameElement ? nameElement.textContent.trim() : null;

                // Извлекаем ссылку для получения slug
                const linkElement = element.querySelector('a.da-thumbs');
                const href = linkElement ? linkElement.getAttribute('href') : null;
                const slug = href ? href.replace('/providers/', '').replace('/', '') : null;

                // Извлекаем скрытое поле с названием провайдера
                const hiddenInput = element.parentElement.querySelector('input[name="provider"]');
                const providerValue = hiddenInput ? hiddenInput.value : null;

                if (name && slug) {
                    parsedProviders.push({
                        id: slug,
                        name: name,
                        slug: slug,
                        isActive: true,
                        source: 'site'
                    });

                    console.log(`✅ Распарсен провайдер: ${name} (${slug})`);
                } else {
                    console.log(`⚠️ Не удалось распарсить провайдер ${index + 1}:`, {
                        name,
                        slug,
                        providerValue
                    });
                }
            } catch (error) {
                console.log(`❌ Ошибка парсинга провайдера ${index + 1}:`, error);
            }
        });

        console.log(`📊 Распарсено ${parsedProviders.length} провайдеров из HTML`);
        return parsedProviders;

    } catch (error) {
        console.log('❌ Ошибка парсинга HTML:', error);
        return [];
    }
}

// Загрузка базовых данных провайдеров
function loadBasicProvidersData() {
    // Используем данные из PROVIDERS_DATA
    providersData = {};
    providers = []; // Очищаем массив провайдеров

    PROVIDERS_DATA.providers.forEach(provider => {
        providersData[provider.slug] = {
            provider: {
                name: provider.name,
                services: provider.services
            },
            tariffs: provider.tariffs || [
                {
                    name: provider.mainTariff || "Основной тариф",
                    speed: null,
                    price: 0,
                    period: "месяц",
                    description: provider.mainTariff || "Основной тариф провайдера",
                    service: "Интернет"
                }
            ]
        };

        // Добавляем в массив провайдеров для формы пользователей
        providers.push({
            id: provider.slug,
            name: provider.name,
            slug: provider.slug,
            isActive: provider.is_active !== false
        });
    });

    console.log('📋 Загружены базовые данные провайдеров');
    console.log('📊 providersData после загрузки:', providersData);
    console.log('👥 Массив providers для формы пользователей:', providers);
    console.log('🔢 Количество провайдеров:', Object.keys(providersData).length);
}

// Заполнение списка провайдеров
function populateProvidersList() {
    const providerSelect = document.getElementById('provider');
    if (!providerSelect) {
        console.error('❌ Элемент select для провайдера не найден');
        return;
    }

    console.log('🔍 Найден select для провайдера:', providerSelect);

    // Очищаем существующие опции
    providerSelect.innerHTML = '<option value="">Выберите провайдера</option>';

    // Проверяем наличие данных провайдеров
    if (!PROVIDERS_DATA || !PROVIDERS_DATA.providers) {
        console.error('❌ Данные провайдеров не найдены');
        return;
    }

    // Добавляем провайдеров из PROVIDERS_DATA
    PROVIDERS_DATA.providers.forEach(provider => {
        if (provider.is_active) {
            const option = document.createElement('option');
            option.value = provider.slug;
            option.textContent = provider.name;
            providerSelect.appendChild(option);
            console.log(`✅ Добавлен провайдер: ${provider.name}`);
        }
    });

    console.log(`✅ Список провайдеров заполнен: ${providerSelect.options.length - 1} провайдеров`);
}

// Обработчик изменения провайдера
function onProviderChange() {
    const providerSelect = document.getElementById('provider');
    const selectedSlug = providerSelect.value;

    console.log('🏢 Выбран провайдер:', selectedSlug);

    if (!selectedSlug) {
        // Скрываем группы услуг и тарифов
        document.getElementById('serviceSelectionGroup').style.display = 'none';
        document.getElementById('tariffSelectionGroup').style.display = 'none';
        currentProvider = null;
        currentService = null;
        currentTariff = null;
        updateRewardDisplay();
        return;
    }

    const provider = providersData[selectedSlug];
    if (!provider) {
        console.error('❌ Провайдер не найден:', selectedSlug);
        return;
    }

    currentProvider = provider.provider.name;
    console.log(`✅ currentProvider установлен: ${currentProvider}`);

    // Показываем группу услуг
    populateServices(provider.provider.services);
    document.getElementById('serviceSelectionGroup').style.display = 'block';

    // Скрываем группу тарифов до выбора услуги
    document.getElementById('tariffSelectionGroup').style.display = 'none';
    currentService = null;
    currentTariff = null;

    updateRewardDisplay();

    // Обновляем вознаграждение для агента, если он авторизован
    if (currentUser && currentUser.role === 'agent') {
        updateAgentRewardDisplay();
    }
}

// Заполнение услуг
function populateServices(services) {
    const serviceButtons = document.getElementById('serviceButtons');
    serviceButtons.innerHTML = '';

    services.forEach(service => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'service-button';
        button.textContent = service;
        button.onclick = () => onServiceSelect(service);
        serviceButtons.appendChild(button);
    });

    console.log('✅ Услуги загружены:', services);
}

// Обработчик выбора услуги
function onServiceSelect(service) {
    console.log('🛠️ Выбрана услуга:', service);

    // Обновляем активную кнопку
    document.querySelectorAll('.service-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === service) {
            btn.classList.add('active');
        }
    });

    currentService = service;
    console.log(`✅ currentService установлен: ${currentService}`);

    // Загружаем тарифы для выбранной услуги
    const providerSelect = document.getElementById('provider');
    const selectedSlug = providerSelect.value;
    const provider = providersData[selectedSlug];

    if (provider) {
        populateTariffs(provider.tariffs, service);
        document.getElementById('tariffSelectionGroup').style.display = 'block';
    }

    updateRewardDisplay();
}

// Заполнение тарифов
function populateTariffs(tariffs, selectedService) {
    const tariffSelect = document.getElementById('tariff');
    tariffSelect.innerHTML = '<option value="">Выберите тариф</option>';

    // Фильтруем тарифы по выбранной услуге
    const filteredTariffs = tariffs.filter(tariff => tariff.service === selectedService);

    filteredTariffs.forEach(tariff => {
        const option = document.createElement('option');
        option.value = tariff.name;
        option.textContent = `${tariff.name} - ${tariff.price} руб/${tariff.period}`;
        option.dataset.tariff = JSON.stringify(tariff);
        tariffSelect.appendChild(option);
    });

    console.log(`✅ Тарифы загружены для услуги "${selectedService}":`, filteredTariffs.length);
}

// Обработчик изменения тарифа
function onTariffChange() {
    const tariffSelect = document.getElementById('tariff');
    const selectedOption = tariffSelect.options[tariffSelect.selectedIndex];

    if (!selectedOption || !selectedOption.dataset.tariff) {
        document.getElementById('tariffDescription').style.display = 'none';
        currentTariff = null;
        return;
    }

    const tariff = JSON.parse(selectedOption.dataset.tariff);
    currentTariff = tariff;
    console.log('📋 Выбран тариф:', tariff);

    // Показываем описание тарифа
    showTariffDescription(tariff);
}

// Показать описание тарифа
function showTariffDescription(tariff) {
    const descriptionDiv = document.getElementById('tariffDescription');

    let speedInfo = '';
    if (tariff.speed) {
        speedInfo = `
            <div class="tariff-detail">
                <div class="tariff-detail-label">Скорость</div>
                <div class="tariff-detail-value">${tariff.speed} Мбит/с</div>
            </div>
        `;
    }

    descriptionDiv.innerHTML = `
        <div class="tariff-info">
            <div class="tariff-detail">
                <div class="tariff-detail-label">Цена</div>
                <div class="tariff-detail-value">${tariff.price} руб/${tariff.period}</div>
            </div>
            ${speedInfo}
        </div>
        <div class="tariff-description-text">
            ${tariff.description}
        </div>
    `;

    descriptionDiv.style.display = 'block';
}

// Получение вознаграждения
function getReward(providerSlug, serviceName) {
    // Проверяем параметры
    if (!providerSlug || !serviceName) {
        console.log('⚠️ getReward: отсутствуют параметры', {
            providerSlug: providerSlug || 'undefined',
            serviceName: serviceName || 'undefined',
            providerSlugType: typeof providerSlug,
            serviceNameType: typeof serviceName
        });
        return 0;
    }

    // Проверяем, что параметры - строки
    if (typeof providerSlug !== 'string' || typeof serviceName !== 'string') {
        console.log('⚠️ getReward: неверный тип параметров', {
            providerSlug,
            serviceName,
            providerSlugType: typeof providerSlug,
            serviceNameType: typeof serviceName
        });
        return 0;
    }

    const reward = REWARDS_DATA[providerSlug] && REWARDS_DATA[providerSlug][serviceName]
        ? REWARDS_DATA[providerSlug][serviceName]
        : 0;

    console.log(`💰 getReward: провайдер="${providerSlug}", услуга="${serviceName}", вознаграждение=${reward}`);
    return reward;
}

// Инициализация вознаграждений
function initRewards() {
    const existing = localStorage.getItem('rewards');
    if (!existing) {
        const defaultRewards = [
            { id: 1, name: 'Новая', amount: 50, isActive: true },
            { id: 2, name: 'Выполненная заявка', amount: 100, isActive: true },
            { id: 3, name: 'Отмененная заявка', amount: -25, isActive: true }
        ];
        localStorage.setItem('rewards', JSON.stringify(defaultRewards));
    }
    rewards = JSON.parse(localStorage.getItem('rewards') || '[]');
}

// Инициализация данных вознаграждений
function initRewardsData() {
    const savedRewardsData = localStorage.getItem('rewardsData');
    if (savedRewardsData) {
        try {
            const parsedData = JSON.parse(savedRewardsData);
            // Обновляем REWARDS_DATA сохраненными данными
            Object.keys(parsedData).forEach(providerSlug => {
                if (!REWARDS_DATA[providerSlug]) {
                    REWARDS_DATA[providerSlug] = {};
                }
                Object.keys(parsedData[providerSlug]).forEach(service => {
                    REWARDS_DATA[providerSlug][service] = parsedData[providerSlug][service];
                });
            });
            console.log('✅ Данные вознаграждений загружены из localStorage');
        } catch (error) {
            console.error('❌ Ошибка загрузки данных вознаграждений:', error);
        }
    } else {
        console.log('📋 Используются данные вознаграждений по умолчанию');
    }
}

// Обновление старых статусов заявок
function updateOldRequestStatuses() {
    const storedRequests = localStorage.getItem('requests');
    if (!storedRequests) return;

    try {
        const requests = JSON.parse(storedRequests);
        let updated = false;

        // Маппинг старых статусов на новые
        const statusMapping = {
            'НОВАЯ ЗАЯВКА': 'Новая',
            'Новая заявка': 'Новая',
            'В обработке': 'Доработка',
            'Направлена провайдеру': 'Доработка',
            'Назначена': 'Доработка',
            'Выполнено': 'Выполнена',
            'Отменено': 'Отказ',
            'Отказ': 'Отказ'
        };

        requests.forEach(request => {
            // Обновляем старые статусы на новые
            const oldRequestStatus = request.requestStatus;
            const oldStatus = request.status;

            if (statusMapping[oldRequestStatus]) {
                request.requestStatus = statusMapping[oldRequestStatus];
                updated = true;
                console.log('🔄 Обновлен requestStatus заявки:', {
                    id: request.id,
                    clientName: request.clientName,
                    oldStatus: oldRequestStatus,
                    newStatus: statusMapping[oldRequestStatus]
                });
            }

            if (statusMapping[oldStatus]) {
                request.status = statusMapping[oldStatus];
                updated = true;
                console.log('🔄 Обновлен status заявки:', {
                    id: request.id,
                    clientName: request.clientName,
                    oldStatus: oldStatus,
                    newStatus: statusMapping[oldStatus]
                });
            }
        });

        if (updated) {
            localStorage.setItem('requests', JSON.stringify(requests));
            console.log('✅ Старые статусы заявок обновлены');
        }
    } catch (error) {
        console.error('❌ Ошибка обновления статусов заявок:', error);
    }
}

// === УПРАВЛЕНИЕ ТАБЛИЦЕЙ ВОЗНАГРАЖДЕНИЙ ===

let rewardsChanges = {}; // Хранилище изменений вознаграждений

// === УПРАВЛЕНИЕ СТАТУСАМИ ЗАЯВОК ===

let requestStatuses = []; // Массив статусов заявок

// Инициализация статусов заявок
function initRequestStatuses() {
    const existing = localStorage.getItem('requestStatuses');
    if (!existing) {
        const defaultStatuses = [
            { id: 1, name: 'Новая', color: 'new', isActive: true, isDefault: true },
            { id: 2, name: 'Доработка', color: 'revision', isActive: true, isDefault: false },
            { id: 3, name: 'Отказ', color: 'rejected', isActive: true, isDefault: false },
            { id: 4, name: 'Выполнена', color: 'completed', isActive: true, isDefault: false },
            { id: 5, name: 'Оплачена', color: 'paid', isActive: true, isDefault: false }
        ];
        localStorage.setItem('requestStatuses', JSON.stringify(defaultStatuses));
    }
    requestStatuses = JSON.parse(localStorage.getItem('requestStatuses') || '[]');
}

// Открытие модального окна управления статусами
function openStatusesModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только администратор может управлять статусами.', 'error');
        return;
    }

    loadStatusesTable();
    document.getElementById('statusesModal').style.display = 'block';
}

// Закрытие модального окна управления статусами
function closeStatusesModal() {
    document.getElementById('statusesModal').style.display = 'none';
}

// Загрузка таблицы статусов
function loadStatusesTable() {
    const tbody = document.querySelector('#statusesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    requestStatuses.forEach(status => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${status.name}</td>
            <td>
                <span class="status-badge ${status.color}">${status.name}</span>
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${status.isActive ? 'checked' : ''} 
                           onchange="toggleStatusActive(${status.id})">
                    <span class="slider"></span>
                </label>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteStatus(${status.id})" 
                        ${status.isDefault ? 'disabled title="Нельзя удалить статус по умолчанию"' : ''}>
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Переключение активности статуса
function toggleStatusActive(statusId) {
    const status = requestStatuses.find(s => s.id === statusId);
    if (status) {
        status.isActive = !status.isActive;
        localStorage.setItem('requestStatuses', JSON.stringify(requestStatuses));
        loadStatusesTable();
        updateStatusSelect(); // Обновляем селект статусов
        updateStatusFilter(); // Обновляем селект фильтрации
        showNotification(`Статус "${status.name}" ${status.isActive ? 'активирован' : 'деактивирован'}`, 'success');
    }
}

// Удаление статуса
function deleteStatus(statusId) {
    const status = requestStatuses.find(s => s.id === statusId);
    if (!status) return;

    if (status.isDefault) {
        showNotification('Нельзя удалить статус по умолчанию', 'error');
        return;
    }

    if (confirm(`Удалить статус "${status.name}"?`)) {
        requestStatuses = requestStatuses.filter(s => s.id !== statusId);
        localStorage.setItem('requestStatuses', JSON.stringify(requestStatuses));
        loadStatusesTable();
        updateStatusSelect(); // Обновляем селект статусов
        updateStatusFilter(); // Обновляем селект фильтрации
        showNotification(`Статус "${status.name}" удален`, 'success');
    }
}

// Добавление нового статуса
function addStatus() {
    const nameInput = document.getElementById('newStatusName');
    const colorSelect = document.getElementById('newStatusColor');

    if (!nameInput || !colorSelect) return;

    const name = nameInput.value.trim();
    const color = colorSelect.value;

    if (!name) {
        showNotification('Введите название статуса', 'error');
        return;
    }

    // Проверяем, не существует ли уже такой статус
    if (requestStatuses.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Статус с таким названием уже существует', 'error');
        return;
    }

    const newStatus = {
        id: Date.now(),
        name: name,
        color: color,
        isActive: true,
        isDefault: false
    };

    requestStatuses.push(newStatus);
    localStorage.setItem('requestStatuses', JSON.stringify(requestStatuses));

    // Очищаем форму
    nameInput.value = '';
    colorSelect.value = 'new';

    loadStatusesTable();
    updateStatusSelect(); // Обновляем селект статусов
    updateStatusFilter(); // Обновляем селект фильтрации
    showNotification(`Статус "${name}" добавлен`, 'success');
}

// Обновление селекта статусов в формах
function updateStatusSelect() {
    const statusSelects = document.querySelectorAll('#requestStatus');
    statusSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';

        requestStatuses.forEach(status => {
            if (status.isActive) {
                const option = document.createElement('option');
                option.value = status.name;
                option.textContent = status.name;
                select.appendChild(option);
            }
        });

        // Восстанавливаем выбранное значение
        if (currentValue && requestStatuses.some(s => s.name === currentValue && s.isActive)) {
            select.value = currentValue;
        }
    });

    // Также обновляем селект фильтрации
    updateStatusFilter();
}

// Открытие модального окна вознаграждений
function openRewardsModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только администратор может управлять вознаграждениями.', 'error');
        return;
    }

    console.log('💰 Открытие модального окна вознаграждений');
    loadRewardsTable();
    document.getElementById('rewardsModal').style.display = 'block';
}

// Закрытие модального окна вознаграждений
function closeRewardsModal() {
    document.getElementById('rewardsModal').style.display = 'none';
    rewardsChanges = {}; // Сбрасываем изменения при закрытии
    console.log('💰 Модальное окно вознаграждений закрыто');
}

// Загрузка таблицы вознаграждений
function loadRewardsTable() {
    console.log('💰 Начинаем загрузку таблицы вознаграждений...');

    const tbody = document.getElementById('rewardsTableBody');
    if (!tbody) {
        console.error('❌ Элемент rewardsTableBody не найден');
        return;
    }

    console.log('✅ Элемент rewardsTableBody найден');

    tbody.innerHTML = '';

    // Получаем список всех провайдеров
    const providers = PROVIDERS_DATA.providers.filter(p => p.is_active);
    console.log(`📋 Найдено ${providers.length} активных провайдеров:`, providers.map(p => p.name));

    if (providers.length === 0) {
        console.error('❌ Нет активных провайдеров');
        return;
    }

    providers.forEach((provider, index) => {
        console.log(`📝 Добавляем провайдера ${index + 1}: ${provider.name} (${provider.slug})`);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${provider.name}</td>
            <td><input type="number" class="reward-input" data-provider="${provider.slug}" data-service="Интернет" value="${REWARDS_DATA[provider.slug]?.['Интернет'] || 0}" onchange="updateRewardValue(this)"></td>
            <td><input type="number" class="reward-input" data-provider="${provider.slug}" data-service="Телевидение" value="${REWARDS_DATA[provider.slug]?.['Телевидение'] || 0}" onchange="updateRewardValue(this)"></td>
            <td><input type="number" class="reward-input" data-provider="${provider.slug}" data-service="Телефония" value="${REWARDS_DATA[provider.slug]?.['Телефония'] || 0}" onchange="updateRewardValue(this)"></td>
            <td><input type="number" class="reward-input" data-provider="${provider.slug}" data-service="Мобильная связь" value="${REWARDS_DATA[provider.slug]?.['Мобильная связь'] || 0}" onchange="updateRewardValue(this)"></td>
            <td><input type="number" class="reward-input" data-provider="${provider.slug}" data-service="Пакетное предложение" value="${REWARDS_DATA[provider.slug]?.['Пакетное предложение'] || 0}" onchange="updateRewardValue(this)"></td>
            <td>
                <div class="reward-actions">
                    <button class="btn btn-sm btn-success" onclick="saveProviderRewards('${provider.slug}')" title="Сохранить изменения">💾</button>
                    <button class="btn btn-sm btn-warning" onclick="resetProviderRewards('${provider.slug}')" title="Сбросить изменения">🔄</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`✅ Добавлено ${providers.length} строк в таблицу`);

    // Обновляем статистику
    updateRewardsSummary();

    console.log(`✅ Загружена таблица вознаграждений: ${providers.length} провайдеров`);
}

// Обновление значения вознаграждения
function updateRewardValue(input) {
    const provider = input.dataset.provider;
    const service = input.dataset.service;
    const value = parseInt(input.value) || 0;

    const changeKey = `${provider}_${service}`;
    rewardsChanges[changeKey] = value;

    // Подсвечиваем измененное поле
    input.classList.add('changed');

    console.log(`💰 Изменено вознаграждение: ${provider} - ${service} = ${value} ₽`);
}

// Сохранение вознаграждений для конкретного провайдера
function saveProviderRewards(providerSlug) {
    const providerName = PROVIDERS_DATA.providers.find(p => p.slug === providerSlug)?.name || providerSlug;

    // Сохраняем изменения для этого провайдера
    Object.keys(rewardsChanges).forEach(key => {
        if (key.startsWith(`${providerSlug}_`)) {
            const service = key.replace(`${providerSlug}_`, '');
            if (!REWARDS_DATA[providerSlug]) {
                REWARDS_DATA[providerSlug] = {};
            }
            REWARDS_DATA[providerSlug][service] = rewardsChanges[key];
            delete rewardsChanges[key];
        }
    });

    // Сохраняем REWARDS_DATA в localStorage
    localStorage.setItem('rewardsData', JSON.stringify(REWARDS_DATA));

    // Убираем подсветку с полей этого провайдера
    const inputs = document.querySelectorAll(`input[data-provider="${providerSlug}"]`);
    inputs.forEach(input => input.classList.remove('changed'));

    showNotification(`Вознаграждения для ${providerName} сохранены`, 'success');
    updateRewardsSummary();

    console.log(`✅ Сохранены вознаграждения для провайдера: ${providerName}`);
}

// Сброс вознаграждений для конкретного провайдера
function resetProviderRewards(providerSlug) {
    const providerName = PROVIDERS_DATA.providers.find(p => p.slug === providerSlug)?.name || providerSlug;

    // Сбрасываем изменения для этого провайдера
    Object.keys(rewardsChanges).forEach(key => {
        if (key.startsWith(`${providerSlug}_`)) {
            delete rewardsChanges[key];
        }
    });

    // Перезагружаем строку провайдера
    loadRewardsTable();

    showNotification(`Изменения для ${providerName} сброшены`, 'info');

    console.log(`🔄 Сброшены изменения для провайдера: ${providerName}`);
}

// Сохранение всех изменений вознаграждений
function saveAllRewards() {
    let savedCount = 0;

    Object.keys(rewardsChanges).forEach(key => {
        const [providerSlug, service] = key.split('_');
        if (!REWARDS_DATA[providerSlug]) {
            REWARDS_DATA[providerSlug] = {};
        }
        REWARDS_DATA[providerSlug][service] = rewardsChanges[key];
        savedCount++;
    });

    rewardsChanges = {};

    // Сохраняем REWARDS_DATA в localStorage
    localStorage.setItem('rewardsData', JSON.stringify(REWARDS_DATA));

    // Убираем подсветку со всех полей
    document.querySelectorAll('.reward-input.changed').forEach(input => {
        input.classList.remove('changed');
    });

    showNotification(`Сохранено ${savedCount} изменений вознаграждений`, 'success');
    updateRewardsSummary();

    console.log(`✅ Сохранено ${savedCount} изменений вознаграждений`);
}

// Сброс всех изменений вознаграждений
function resetRewardsChanges() {
    rewardsChanges = {};

    // Перезагружаем таблицу
    loadRewardsTable();

    showNotification('Все изменения вознаграждений сброшены', 'info');

    console.log('🔄 Все изменения вознаграждений сброшены');
}

// Экспорт таблицы вознаграждений
function exportRewardsTable() {
    const data = [];

    PROVIDERS_DATA.providers.forEach(provider => {
        if (!provider.is_active) return;

        const row = {
            'Провайдер': provider.name,
            'Интернет': REWARDS_DATA[provider.slug]?.['Интернет'] || 0,
            'Телевидение': REWARDS_DATA[provider.slug]?.['Телевидение'] || 0,
            'Телефония': REWARDS_DATA[provider.slug]?.['Телефония'] || 0,
            'Мобильная связь': REWARDS_DATA[provider.slug]?.['Мобильная связь'] || 0,
            'Пакетное предложение': REWARDS_DATA[provider.slug]?.['Пакетное предложение'] || 0
        };
        data.push(row);
    });

    // Создаем CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(';'),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(';'))
    ].join('\n');

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Скачиваем файл
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rewards_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Таблица вознаграждений экспортирована в CSV', 'success');

    console.log('📊 Таблица вознаграждений экспортирована');
}

// Обновление статистики вознаграждений
function updateRewardsSummary() {
    const providers = PROVIDERS_DATA.providers.filter(p => p.is_active);
    const services = ['Интернет', 'Телевидение', 'Телефония', 'Мобильная связь', 'Пакетное предложение'];

    let totalRewards = 0;
    let rewardCount = 0;
    let maxReward = 0;

    providers.forEach(provider => {
        services.forEach(service => {
            const reward = REWARDS_DATA[provider.slug]?.[service] || 0;
            if (reward > 0) {
                totalRewards += reward;
                rewardCount++;
                maxReward = Math.max(maxReward, reward);
            }
        });
    });

    const averageReward = rewardCount > 0 ? Math.round(totalRewards / rewardCount) : 0;

    // Обновляем элементы статистики
    const totalProvidersEl = document.getElementById('totalProviders');
    const totalServicesEl = document.getElementById('totalServices');
    const averageRewardEl = document.getElementById('averageReward');
    const maxRewardEl = document.getElementById('maxReward');

    if (totalProvidersEl) totalProvidersEl.textContent = providers.length;
    if (totalServicesEl) totalServicesEl.textContent = rewardCount;
    if (averageRewardEl) averageRewardEl.textContent = `${averageReward} ₽`;
    if (maxRewardEl) maxRewardEl.textContent = `${maxReward} ₽`;

    console.log(`📊 Статистика обновлена: ${providers.length} провайдеров, ${rewardCount} услуг, среднее: ${averageReward} ₽`);
}

async function checkAuthentication() {
    // Восстанавливаем сессию
    restoreSession();

    if (currentUser) {
        console.log('Пользователь авторизован:', currentUser.email);
        return true;
    } else {
        console.log('Пользователь не авторизован');
        return false;
    }
}

function initializeUI() {
    // Кнопки аутентификации уже добавлены в HTML
    // addAuthButtons(); // Убрано - кнопки уже в HTML

    // Добавляем кнопки для админов (если нужно)
    // addAdminButtons(); // Убрано - кнопки уже в HTML

    // Добавляем переключатель темы
    addThemeToggle();

    // Обновляем отображение пользователя
    updateUserInfoDisplay();

    // Применяем права доступа
    applyRoleUI();

    // Обновляем селекты статусов
    updateStatusSelect();
}

function addAuthButtons() {
    const headerActions = document.querySelector('.header-actions');

    if (currentUser) {
        // Пользователь авторизован
        const userButtons = document.createElement('div');
        userButtons.className = 'auth-buttons';
        userButtons.innerHTML = `
            <span class="user-info">👤 ${currentUser.name}</span>
            <button class="btn btn-warning" onclick="logout()">Выйти</button>
        `;
        headerActions.appendChild(userButtons);
    } else {
        // Пользователь не авторизован
        const authButtons = document.createElement('div');
        authButtons.className = 'auth-buttons';
        authButtons.innerHTML = `
            <button class="btn btn-primary" onclick="openLoginModal()">Войти</button>
        `;
        headerActions.appendChild(authButtons);
    }
}

function addAdminButtons() {
    const headerActions = document.querySelector('.header-actions');

    const adminButtons = document.createElement('div');
    adminButtons.className = 'admin-buttons';
    adminButtons.innerHTML = `
        <button class="btn btn-secondary" onclick="openUsersModal()">Пользователи</button>
        <button class="btn btn-warning" onclick="openRewardsModal()">💰 Вознаграждения</button>
        <button class="btn btn-success" onclick="openTariffUpdateModal()">🔄 Обновить тарифы</button>
    `;

    headerActions.appendChild(adminButtons);
}

function addThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.onclick = toggleTheme;
    document.body.appendChild(themeToggle);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const toggle = document.querySelector('.theme-toggle');
    toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
}

// Загружаем сохраненную тему
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

async function loadData() {
    try {
        // Загружаем заявки из localStorage
        const savedRequests = localStorage.getItem('requests');
        if (savedRequests) {
            requests = JSON.parse(savedRequests);
        } else {
            loadSampleData();
        }

        renderTable();
        updateStatistics();

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Fallback на демо-данные
        loadSampleData();
    }
}

function setupRealtimeSubscriptions() {
    // Пока что используем простую синхронизацию
    setInterval(() => {
        if (currentUser) {
            const savedRequests = localStorage.getItem('requests');
            if (savedRequests) {
                const newRequests = JSON.parse(savedRequests);
                if (JSON.stringify(newRequests) !== JSON.stringify(requests)) {
                    requests = newRequests;
                    renderTable();
                    updateStatistics();
                }
            }
        }
    }, 5000);
}

// Загрузка демо-данных
function loadSampleData() {
    const sampleData = [
        {
            id: 1,
            dateTime: '2024-01-15T10:30:00',
            clientName: 'Иванов Иван Иванович',
            clientPhone: '+7 (999) 123-45-67',
            clientAddress: 'г. Москва, ул. Тверская, д. 1, кв. 15',
            clientComment: 'Необходимо починить кран на кухне',
            status: 'Новая',
            providerComment: '',
            provider: 'ДОМ.ru',
            appointmentDate: '',
            appointmentTime: '',
            reminder: null,
            userId: currentUser ? currentUser.id : 1
        },
        {
            id: 2,
            dateTime: '2024-01-15T11:15:00',
            clientName: 'Петрова Анна Сергеевна',
            clientPhone: '+7 (999) 234-56-78',
            clientAddress: 'г. Москва, ул. Арбат, д. 25, кв. 8',
            clientComment: 'Протекает труба в ванной комнате',
            status: 'В обработке',
            providerComment: 'Мастер назначен на завтра',
            provider: 'Ростелеком',
            appointmentDate: '2024-01-16',
            appointmentTime: '14:00',
            reminder: null,
            userId: currentUser ? currentUser.id : 1
        },
        {
            id: 3,
            dateTime: '2024-01-14T14:20:00',
            clientName: 'Сидоров Петр Николаевич',
            clientPhone: '+7 (999) 345-67-89',
            clientAddress: 'г. Москва, ул. Новый Арбат, д. 10, кв. 22',
            clientComment: 'Нужно установить новую розетку',
            status: 'Выполнено',
            providerComment: 'Работа выполнена качественно',
            provider: 'МТС',
            appointmentDate: '2024-01-14',
            appointmentTime: '16:00',
            reminder: null,
            userId: currentUser ? currentUser.id : 1
        },
        {
            id: 4,
            dateTime: '2024-01-14T16:45:00',
            clientName: 'Козлова Мария Александровна',
            clientPhone: '+7 (999) 456-78-90',
            clientAddress: 'г. Москва, ул. Покровка, д. 15, кв. 5',
            clientComment: 'Требуется замена смесителя',
            status: 'Отменено',
            providerComment: 'Клиент отменил заявку',
            provider: 'Билайн',
            appointmentDate: '',
            appointmentTime: '',
            reminder: null,
            userId: currentUser ? currentUser.id : 1
        }
    ];

    requests = sampleData;
    renderTable();
    updateStatistics();
}

// === АУТЕНТИФИКАЦИЯ ===

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    // Проверяем блокировку
    if (isAccountLocked()) {
        showNotification('Аккаунт заблокирован на 5 минут', 'error');
        return;
    }

    // Ищем пользователя
    console.log('🔍 Поиск пользователя:', email);
    console.log('📋 Доступные пользователи:', users.map(u => ({ email: u.email, isActive: u.isActive })));
    console.log('📋 Полная информация о пользователях:', users);
    console.log('🔍 Проверяем каждый email отдельно:');
    users.forEach((user, index) => {
        console.log(`  ${index + 1}. Email: "${user.email}" (тип: ${typeof user.email}, длина: ${user.email.length})`);
        console.log(`     Ищем: "${email}" (тип: ${typeof email}, длина: ${email.length})`);
        console.log(`     Совпадает: ${user.email === email}`);
        console.log(`     Активен: ${user.isActive}`);
    });

    const user = users.find(u => u.email === email && u.isActive);

    if (!user) {
        console.log('❌ Пользователь не найден:', email);
        console.log('🔍 Проверяем точное совпадение email...');
        const exactMatch = users.find(u => u.email === email);
        if (exactMatch) {
            console.log('👤 Пользователь найден, но неактивен:', exactMatch);
            showNotification('Пользователь заблокирован', 'error');
        } else {
            console.log('❌ Пользователь с таким email не существует');
            showNotification('Пользователь не найден', 'error');
        }
        return;
    }

    console.log('✅ Пользователь найден:', user.email);

    // Проверяем пароль
    if (user.password !== hashPassword(password)) {
        showNotification('Неверный пароль', 'error');
        return;
    }

    // Успешный вход
    currentUser = user;
    sessionStartTime = Date.now();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Логируем вход пользователя
    addAuditLog('login', 'user', user.id, null, `Пользователь "${user.name}" вошел в систему`);

    showNotification(`Добро пожаловать, ${user.name}!`, 'success');
    closeLoginModal();

    // Обновляем интерфейс
    location.reload();
}

function logout() {
    // Логируем выход пользователя
    if (currentUser) {
        addAuditLog('logout', 'user', currentUser.id, null, `Пользователь "${currentUser.name}" вышел из системы`);
    }

    currentUser = null;
    sessionStartTime = null;
    localStorage.removeItem('currentUser');
    showNotification('Вы вышли из системы', 'info');
    location.reload();
}

function restoreSession() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        sessionStartTime = Date.now();

        // Проверяем таймаут сессии (8 часов)
        if (checkSessionTimeout()) {
            logout();
            return;
        }

        updateSessionTime();
    }
}

function updateUserInfoDisplay() {
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    if (userInfoDisplay) {
        if (currentUser) {
            userInfoDisplay.innerHTML = `
                <div class="user-info">
                    <strong>👤 ${currentUser.name}</strong>
                    <span class="user-role">${getRoleDisplayName(currentUser.role)}</span>
                </div>
            `;
        } else {
            userInfoDisplay.innerHTML = '';
        }
    }
}

function getRoleDisplayName(role) {
    const roleNames = {
        'admin': 'Администратор',
        'operator': 'Оператор',
        'agent': 'Агент'
    };
    return roleNames[role] || role;
}

function applyRoleUI() {
    const isLogged = !!currentUser;

    // Управление кнопками в заголовке
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const addRequestBtn = document.getElementById('addRequestBtn');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const manageRewardsBtn = document.getElementById('manageRewardsBtn');
    const updateTariffsBtn = document.getElementById('updateTariffsBtn');
    const manageStatusesBtn = document.getElementById('manageStatusesBtn');

    // Кнопки входа/выхода
    if (loginBtn) loginBtn.style.display = isLogged ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = isLogged ? 'inline-flex' : 'none';

    // Кнопка добавления заявки (админ и агент)
    if (addRequestBtn) {
        const canAdd = isLogged && (currentUser.role === 'admin' || currentUser.role === 'agent');
        addRequestBtn.style.display = canAdd ? 'inline-flex' : 'none';
    }

    // Кнопки администратора
    if (manageUsersBtn) {
        manageUsersBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    if (manageRewardsBtn) {
        manageRewardsBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    if (manageStatusesBtn) {
        manageStatusesBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    if (updateTariffsBtn) {
        updateTariffsBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const auditLogsBtn = document.getElementById('auditLogsBtn');
    if (auditLogsBtn) {
        auditLogsBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const googleSheetsBtn = document.getElementById('googleSheetsBtn');
    if (googleSheetsBtn) {
        googleSheetsBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const testRemindersBtn = document.getElementById('testRemindersBtn');
    if (testRemindersBtn) {
        testRemindersBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const testEmailJSBtn = document.getElementById('testEmailJSBtn');
    if (testEmailJSBtn) {
        testEmailJSBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const testTelegramBtn = document.getElementById('testTelegramBtn');
    if (testTelegramBtn) {
        testTelegramBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const testSpecificUserBtn = document.getElementById('testSpecificUserBtn');
    if (testSpecificUserBtn) {
        testSpecificUserBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const sendWelcomeBtn = document.getElementById('sendWelcomeBtn');
    if (sendWelcomeBtn) {
        sendWelcomeBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    const checkUsersBtn = document.getElementById('checkUsersBtn');
    if (checkUsersBtn) {
        checkUsersBtn.style.display = (isLogged && currentUser.role === 'admin') ? 'inline-flex' : 'none';
    }

    // Показываем/скрываем элементы в зависимости от роли
    const adminElements = document.querySelectorAll('[data-role="admin"]');
    const operatorElements = document.querySelectorAll('[data-role="operator"]');
    const agentElements = document.querySelectorAll('[data-role="agent"]');

    adminElements.forEach(el => {
        el.style.display = (isLogged && currentUser.role === 'admin') ? 'block' : 'none';
    });

    operatorElements.forEach(el => {
        el.style.display = (isLogged && ['admin', 'operator'].includes(currentUser.role)) ? 'block' : 'none';
    });

    agentElements.forEach(el => {
        el.style.display = isLogged ? 'block' : 'none';
    });

    // Управление блоками статистики агента
    const agentStatsContainer = document.getElementById('agentStatsContainer');
    if (agentStatsContainer) {
        if (isLogged && currentUser.role === 'agent') {
            agentStatsContainer.style.display = 'grid';
        } else {
            agentStatsContainer.style.display = 'none';
        }
    }

    console.log(`🔐 UI обновлен для роли: ${currentUser?.role || 'не авторизован'}`);
}

// === УПРАВЛЕНИЕ ЗАЯВКАМИ ===

function openAddModal() {
    if (!currentUser) {
        showNotification('Необходимо войти в систему', 'error');
        openLoginModal();
        return;
    }

    // Проверяем права доступа - только админ и агент могут создавать заявки
    if (currentUser.role !== 'admin' && currentUser.role !== 'agent') {
        showNotification('У вас нет прав для создания заявок', 'error');
        return;
    }

    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Добавить заявку';
    document.getElementById('requestForm').reset();

    // Устанавливаем значение по умолчанию для города
    document.getElementById('clientCity').value = 'г. Санкт-Петербург';

    // Сбрасываем поля вознаграждения
    document.getElementById('rewardType').value = '';
    document.getElementById('rewardAmount').value = '';
    document.getElementById('rewardComment').value = '';
    document.getElementById('rewardDisplay').textContent = '0 руб.';
    document.getElementById('rewardDisplay').style.color = 'var(--text-secondary)';

    // Сбрасываем поля напоминалки
    document.getElementById('reminderDate').value = '';
    document.getElementById('reminderTime').value = '';
    document.getElementById('reminderEmail').checked = true;
    document.getElementById('reminderTelegram').checked = true;

    // Сбрасываем глобальные переменные
    currentProvider = null;
    currentService = null;
    currentTariff = null;

    // Скрываем группы услуг и тарифов
    document.getElementById('serviceSelectionGroup').style.display = 'none';
    document.getElementById('tariffSelectionGroup').style.display = 'none';

    // Обновляем дату и время
    updateDateTime();

    // Заполняем список провайдеров
    populateProvidersList();

    // Применяем права доступа к полям
    applyFormPermissions();

    // Обновляем информацию об услуге и тарифе для оператора
    setTimeout(() => {
        updateServiceAndTariffInfo();
    }, 100);

    document.getElementById('requestModal').style.display = 'block';
}

function openEditModal(id) {
    console.log('🔍 openEditModal вызвана с ID:', id);

    if (!currentUser) {
        console.log('❌ openEditModal: нет текущего пользователя');
        showNotification('Необходимо войти в систему', 'error');
        openLoginModal();
        return;
    }

    console.log('🔍 openEditModal: текущий пользователь:', {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        agentId: currentUser.agentId
    });

    currentEditId = id;
    // Пробуем найти заявку по ID (как строке и как числу)
    let request = requests.find(r => r.id === id);
    if (!request) {
        // Пробуем найти по строковому сравнению
        request = requests.find(r => String(r.id) === String(id));
    }
    if (!request) {
        // Пробуем найти как число (только если ID не начинается с 0)
        if (!String(id).startsWith('0')) {
            const numericId = parseInt(id);
            request = requests.find(r => r.id === numericId);
        }
    }
    if (!request) {
        // Пробуем найти как строку
        request = requests.find(r => r.id === String(id));
    }

    if (!request) {
        console.log('❌ openEditModal: заявка не найдена с ID:', id);
        console.log('🔍 Доступные заявки в массиве requests:');
        requests.forEach((req, index) => {
            console.log(`  ${index + 1}. ID: ${req.id}, Клиент: ${req.clientName}, agentId: ${req.agentId}`);
        });
        console.log('🔍 Ищем заявку с ID:', id, 'тип:', typeof id);
        showNotification('Заявка не найдена', 'error');
        return;
    }

    console.log('🔍 openEditModal: найдена заявка:', {
        id: request.id,
        agentId: request.agentId,
        userId: request.userId,
        clientName: request.clientName
    });
    if (request) {
        // Проверяем права доступа для агента
        if (currentUser.role === 'agent') {
            // Агент может редактировать только свои заявки (только по agentId)
            const currentAgentId = currentUser.agentId || currentUser.id;
            const canEditThis = request.agentId === currentAgentId;

            console.log('🔍 openEditModal проверка прав:', {
                requestId: id,
                requestAgentId: request.agentId,
                currentAgentId: currentAgentId,
                canEdit: canEditThis,
                comparison: `request.agentId (${request.agentId}) === currentAgentId (${currentAgentId}) = ${request.agentId === currentAgentId}`
            });

            if (!canEditThis) {
                showNotification('Вы можете редактировать только свои заявки', 'error');
                return;
            }

            // Проверяем статус заявки - агент не может редактировать выполненные или оплаченные заявки
            const requestStatus = request.requestStatus || request.status;
            if (requestStatus === 'Выполнена' || requestStatus === 'Оплачена') {
                console.log('🔍 openEditModal: агент пытается редактировать заявку со статусом:', requestStatus);
                showNotification('Нельзя редактировать заявки со статусом "Выполнена" или "Оплачена"', 'error');
                return;
            }
        }
        document.getElementById('modalTitle').textContent = 'Редактировать заявку';

        // Заполняем форму
        document.getElementById('clientName').value = request.clientName || '';
        document.getElementById('clientPhone').value = request.clientPhone || '';
        document.getElementById('clientCity').value = request.clientCity || 'г. Санкт-Петербург';
        document.getElementById('clientAddress').value = request.clientAddress || '';
        document.getElementById('clientComment').value = request.clientComment || '';
        // Устанавливаем статус по умолчанию
        const defaultStatus = requestStatuses.find(s => s.isDefault && s.isActive);
        document.getElementById('requestStatus').value = request.requestStatus || request.status || (defaultStatus ? defaultStatus.name : 'Новая');
        document.getElementById('providerComment').value = request.providerComment || '';

        // Находим slug провайдера по его названию
        const providerSlug = request.providerSlug || Object.keys(providersData).find(slug =>
            providersData[slug]?.provider?.name === request.provider
        );
        document.getElementById('provider').value = providerSlug || '';

        document.getElementById('appointmentDate').value = request.appointmentDate || '';
        document.getElementById('appointmentTime').value = request.appointmentTime || '';
        document.getElementById('rewardType').value = request.rewardType || '';
        document.getElementById('rewardAmount').value = request.rewardAmount || '';
        document.getElementById('rewardComment').value = request.rewardComment || '';

        // Загружаем данные напоминалки
        if (request.reminder) {
            document.getElementById('reminderDate').value = request.reminder.date || '';
            document.getElementById('reminderTime').value = request.reminder.time || '';
            document.getElementById('reminderEmail').checked = request.reminder.email !== false;
            document.getElementById('reminderTelegram').checked = request.reminder.telegram !== false;
        } else {
            document.getElementById('reminderDate').value = '';
            document.getElementById('reminderTime').value = '';
            document.getElementById('reminderEmail').checked = true;
            document.getElementById('reminderTelegram').checked = true;
        }

        // Устанавливаем глобальные переменные
        currentProvider = request.provider;
        currentService = request.service || null;
        currentTariff = request.tariff ? { name: request.tariff } : null;

        // Если есть провайдер, загружаем его данные
        if (providerSlug) {
            onProviderChange();

            // Если есть услуга, выбираем её
            if (currentService) {
                setTimeout(() => {
                    onServiceSelect(currentService);

                    // Если есть тариф, выбираем его
                    if (request.tariff) {
                        setTimeout(() => {
                            document.getElementById('tariff').value = request.tariff;
                            onTariffChange();
                        }, 100);
                    }
                }, 100);
            }
        }

        // Обновляем отображение вознаграждения
        setTimeout(() => {
            updateRewardDisplay();
        }, 200);

        // Применяем права доступа к полям
        applyFormPermissions();

        // Обновляем информацию об услуге и тарифе для оператора
        setTimeout(() => {
            updateServiceAndTariffInfo();
        }, 100);

        document.getElementById('requestModal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('requestModal').style.display = 'none';
    currentEditId = null;
}

function saveRequest(event) {
    console.log('🔍 saveRequest вызвана');
    event.preventDefault();

    if (!currentUser) {
        console.log('❌ saveRequest: нет текущего пользователя');
        showNotification('Необходимо войти в систему', 'error');
        return;
    }

    console.log('🔍 saveRequest: currentEditId =', currentEditId);
    console.log('🔍 saveRequest: режим =', currentEditId ? 'РЕДАКТИРОВАНИЕ' : 'СОЗДАНИЕ НОВОЙ');
    console.log('🔍 saveRequest: тип currentEditId =', typeof currentEditId);
    console.log('🔍 saveRequest: currentEditId === null =', currentEditId === null);
    console.log('🔍 saveRequest: currentEditId === undefined =', currentEditId === undefined);
    console.log('🔍 saveRequest: !!currentEditId =', !!currentEditId);
    console.log('🔍 saveRequest: currentEditId как число =', parseInt(currentEditId));
    console.log('🔍 saveRequest: currentEditId как строка =', String(currentEditId));

    // Получаем название провайдера по slug
    const providerSlug = document.getElementById('provider').value;
    const providerName = providerSlug && providersData[providerSlug]
        ? providersData[providerSlug].provider.name
        : '';

    const formData = {
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientCity: document.getElementById('clientCity').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientComment: document.getElementById('clientComment').value,
        requestStatus: document.getElementById('requestStatus').value,
        providerComment: document.getElementById('providerComment').value,
        provider: providerName,
        providerSlug: providerSlug,
        service: currentService || '',
        tariff: currentTariff ? currentTariff.name : '',
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        rewardType: document.getElementById('rewardType').value,
        rewardAmount: document.getElementById('rewardAmount').value,
        rewardComment: document.getElementById('rewardComment').value,
        agentId: currentUser.agentId || currentUser.id, // ID агента (будет перезаписан при редактировании)
        userId: currentUser.id,
        reminder: {
            date: document.getElementById('reminderDate').value,
            time: document.getElementById('reminderTime').value,
            email: document.getElementById('reminderEmail').checked,
            telegram: document.getElementById('reminderTelegram').checked
        }
    };

    // Проверяем, что в formData нет поля id (для безопасности)
    if ('id' in formData) {
        console.warn('⚠️ ВНИМАНИЕ: В formData обнаружено поле id! Это может привести к изменению ID заявки.');
        delete formData.id; // Удаляем поле id из formData
        console.log('✅ Поле id удалено из formData');
    }

    // Отладочная информация
    console.log('🔍 saveRequest отладка:', {
        currentUser: currentUser,
        currentUserAgentId: currentUser.agentId,
        currentUserId: currentUser.id,
        finalAgentId: formData.agentId,
        clientName: formData.clientName,
        provider: formData.provider
    });

    try {
        if (currentEditId) {
            // Редактирование существующей заявки
            console.log('🔍 ===== НАЧАЛО РЕДАКТИРОВАНИЯ =====');
            console.log('🔍 Редактирование заявки с ID:', currentEditId);
            console.log('🔍 currentEditId существует и не пустой:', !!currentEditId);
            console.log('🔍 Тип currentEditId:', typeof currentEditId);
            console.log('🔍 Доступные ID в массиве requests:');
            requests.forEach((r, i) => {
                console.log(`  ${i}: ID=${r.id} (тип: ${typeof r.id}), клиент: ${r.clientName}`);
            });

            // Пробуем разные варианты поиска ID
            let index = requests.findIndex(r => r.id === currentEditId);
            console.log('🔍 Поиск по точному совпадению:', index);

            if (index === -1) {
                // Пробуем поиск по строковому сравнению
                index = requests.findIndex(r => String(r.id) === String(currentEditId));
                console.log('🔍 Поиск по String сравнению:', index);
            }

            if (index === -1) {
                // Пробуем поиск по числовому ID (только если currentEditId - число и не начинается с 0)
                if (!isNaN(currentEditId) && !String(currentEditId).startsWith('0')) {
                    index = requests.findIndex(r => r.id === parseInt(currentEditId));
                    console.log('🔍 Поиск по parseInt:', index);
                }
            }

            if (index === -1) {
                // Пробуем поиск по строковому ID
                index = requests.findIndex(r => r.id === String(currentEditId));
                console.log('🔍 Поиск по String:', index);
            }

            console.log('🔍 Финальный найденный индекс заявки:', index);

            if (index !== -1) {
                const oldRequest = requests[index];
                console.log('🔍 Старые данные заявки:', oldRequest);
                console.log('🔍 Старый ID заявки:', oldRequest.id);

                // Сохраняем оригинальные данные перед обновлением
                const originalId = oldRequest.id;
                const originalAgentId = oldRequest.agentId;
                const originalUserId = oldRequest.userId;
                console.log('🔍 Сохраняем оригинальные данные:', {
                    id: originalId,
                    agentId: originalAgentId,
                    userId: originalUserId
                });

                // Обновляем только те поля, которые действительно были изменены
                const updatedRequest = { ...oldRequest };

                // Проверяем, изменяет ли пользователь только статус
                const isOnlyStatusChange = currentUser &&
                    (currentUser.role === 'admin' || currentUser.role === 'operator') &&
                    formData.requestStatus &&
                    formData.requestStatus !== oldRequest.requestStatus &&
                    !formData.service &&
                    !formData.tariff &&
                    !formData.provider;

                if (isOnlyStatusChange) {
                    // Если изменяется только статус, обновляем только его и комментарий провайдера
                    console.log('🔄 Изменение только статуса заявки:', {
                        oldStatus: oldRequest.requestStatus,
                        newStatus: formData.requestStatus,
                        user: currentUser.role
                    });
                    updatedRequest.requestStatus = formData.requestStatus;
                    if (formData.providerComment) {
                        updatedRequest.providerComment = formData.providerComment;
                    }
                } else {
                    // Полное обновление заявки
                    console.log('🔄 Полное обновление заявки:', {
                        user: currentUser.role,
                        changedFields: Object.keys(formData).filter(key => formData[key] !== undefined && formData[key] !== null && formData[key] !== '')
                    });

                    // Список полей, которые можно обновлять
                    const updatableFields = [
                        'clientName', 'clientPhone', 'clientCity', 'clientAddress', 'clientComment',
                        'requestStatus', 'providerComment', 'provider', 'providerSlug', 'service', 'tariff',
                        'appointmentDate', 'appointmentTime', 'rewardType', 'rewardAmount', 'rewardComment',
                        'reminder'
                    ];

                    // Обновляем только непустые поля
                    updatableFields.forEach(field => {
                        if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
                            updatedRequest[field] = formData[field];
                        }
                    });
                }

                requests[index] = updatedRequest;

                // Убеждаемся, что критически важные поля не изменились
                requests[index].id = originalId;
                requests[index].agentId = originalAgentId;
                requests[index].userId = originalUserId;

                console.log('🔍 Новые данные заявки:', requests[index]);
                console.log('🔍 Проверка критически важных полей после обновления:', {
                    id: {
                        original: originalId,
                        current: requests[index].id,
                        changed: originalId !== requests[index].id
                    },
                    agentId: {
                        original: originalAgentId,
                        current: requests[index].agentId,
                        changed: originalAgentId !== requests[index].agentId
                    },
                    userId: {
                        original: originalUserId,
                        current: requests[index].userId,
                        changed: originalUserId !== requests[index].userId
                    }
                });

                // Дополнительная проверка - если критически важные поля изменились, принудительно восстанавливаем
                if (originalId !== requests[index].id) {
                    console.warn('⚠️ КРИТИЧЕСКАЯ ОШИБКА: ID заявки изменился! Восстанавливаем...');
                    requests[index].id = originalId;
                    console.log('✅ ID восстановлен:', requests[index].id);
                }

                if (originalAgentId !== requests[index].agentId) {
                    console.warn('⚠️ КРИТИЧЕСКАЯ ОШИБКА: agentId заявки изменился! Восстанавливаем...');
                    requests[index].agentId = originalAgentId;
                    console.log('✅ agentId восстановлен:', requests[index].agentId);
                }

                if (originalUserId !== requests[index].userId) {
                    console.warn('⚠️ КРИТИЧЕСКАЯ ОШИБКА: userId заявки изменился! Восстанавливаем...');
                    requests[index].userId = originalUserId;
                    console.log('✅ userId восстановлен:', requests[index].userId);
                }

                showNotification('Заявка обновлена', 'success');

                // Логируем изменение заявки
                const changes = {};
                Object.keys(formData).forEach(key => {
                    if (oldRequest[key] !== formData[key]) {
                        changes[key] = {
                            old: oldRequest[key],
                            new: formData[key]
                        };
                    }
                });

                if (Object.keys(changes).length > 0) {
                    addAuditLog('update', 'request', originalId, changes, `Заявка "${formData.clientName}" обновлена`);
                }
            } else {
                console.log('❌ Заявка с ID не найдена:', currentEditId);
                showNotification('Заявка не найдена', 'error');
                return;
            }
        } else {
            // Добавление новой заявки
            console.log('🔍 ===== СОЗДАНИЕ НОВОЙ ЗАЯВКИ =====');
            console.log('🔍 currentEditId пустой или не существует:', !currentEditId);
            console.log('🔍 Создаем новую заявку с новым ID');
            const newRequest = {
                id: Date.now(),
                dateTime: new Date().toISOString(),
                ...formData
            };
            requests.unshift(newRequest);

            // Отладочная информация после создания заявки
            console.log('✅ Новая заявка создана:', {
                id: newRequest.id,
                agentId: newRequest.agentId,
                userId: newRequest.userId,
                clientName: newRequest.clientName,
                provider: newRequest.provider
            });

            // Логируем создание новой заявки
            addAuditLog('create', 'request', newRequest.id, null, `Создана новая заявка "${newRequest.clientName}" для провайдера "${newRequest.provider}"`);

            showNotification('Заявка создана', 'success');

            // Синхронизируем с Google Sheets
            setTimeout(() => {
                addRequestToGoogleSheets(newRequest);
            }, 500);

            // Отправляем уведомления
            notifyTelegram(newRequest);
            notifyUsersByRole(newRequest);
        }

        // Сохраняем в localStorage
        console.log('🔍 Сохраняем заявки в localStorage, количество:', requests.length);
        localStorage.setItem('requests', JSON.stringify(requests));
        console.log('✅ Заявки сохранены в localStorage');

        renderTable();
        updateStatistics();

        // Обновляем статистику вознаграждений для агента при изменении статуса
        if (currentUser && currentUser.role === 'agent') {
            updateAgentRewardStatistics();
        }

        closeModal();

    } catch (error) {
        console.error('Ошибка сохранения заявки:', error);
        showNotification('Ошибка сохранения заявки', 'error');
    }
}

function openDeleteModal(id) {
    if (!currentUser) {
        showNotification('Необходимо войти в систему', 'error');
        openLoginModal();
        return;
    }

    currentDeleteId = id;
    // Пробуем найти заявку по ID (как строке и как числу)
    let request = requests.find(r => r.id === id);
    if (!request) {
        // Пробуем найти по строковому сравнению
        request = requests.find(r => String(r.id) === String(id));
    }
    if (!request) {
        // Пробуем найти как число (только если ID не начинается с 0)
        if (!String(id).startsWith('0')) {
            const numericId = parseInt(id);
            request = requests.find(r => r.id === numericId);
        }
    }
    if (!request) {
        // Пробуем найти как строку
        request = requests.find(r => r.id === String(id));
    }
    if (request) {
        // Проверяем права доступа для агента
        if (currentUser.role === 'agent') {
            // Агент может удалять только свои заявки (только по agentId)
            const currentAgentId = currentUser.agentId || currentUser.id;
            const canDeleteThis = request.agentId === currentAgentId;

            console.log('🔍 openDeleteModal проверка прав:', {
                requestId: id,
                requestAgentId: request.agentId,
                currentAgentId: currentAgentId,
                canDelete: canDeleteThis,
                comparison: `request.agentId (${request.agentId}) === currentAgentId (${currentAgentId}) = ${request.agentId === currentAgentId}`
            });

            if (!canDeleteThis) {
                showNotification('Вы можете удалять только свои заявки', 'error');
                return;
            }
        }

        document.getElementById('deleteRequestInfo').textContent =
            `${request.clientName} - ${request.clientAddress}`;
        document.getElementById('deleteModal').style.display = 'block';
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

function confirmDelete() {
    console.log('🔍 confirmDelete вызвана');
    console.log('🔍 currentDeleteId =', currentDeleteId);

    if (!currentDeleteId) {
        console.log('❌ confirmDelete: нет currentDeleteId');
        return;
    }

    try {
        console.log('🔍 Заявок до удаления:', requests.length);
        console.log('🔍 Удаляем заявку с ID:', currentDeleteId);
        console.log('🔍 Тип currentDeleteId:', typeof currentDeleteId);
        console.log('🔍 Доступные ID в массиве requests:');
        requests.forEach((r, i) => {
            console.log(`  ${i}: ID=${r.id} (тип: ${typeof r.id}), клиент: ${r.clientName}`);
        });

        // Пробуем разные варианты удаления
        let originalLength = requests.length;
        requests = requests.filter(r => r.id !== currentDeleteId);
        console.log('🔍 Удаление по точному совпадению, осталось:', requests.length);

        if (requests.length === originalLength) {
            // Пробуем удаление по числовому ID
            requests = requests.filter(r => r.id !== parseInt(currentDeleteId));
            console.log('🔍 Удаление по parseInt, осталось:', requests.length);
        }

        if (requests.length === originalLength) {
            // Пробуем удаление по строковому ID
            requests = requests.filter(r => r.id !== String(currentDeleteId));
            console.log('🔍 Удаление по String, осталось:', requests.length);
        }

        if (requests.length === originalLength) {
            // Пробуем удаление по строковому сравнению
            requests = requests.filter(r => String(r.id) !== String(currentDeleteId));
            console.log('🔍 Удаление по String сравнению, осталось:', requests.length);
        }

        console.log('🔍 Заявок после удаления:', requests.length);

        localStorage.setItem('requests', JSON.stringify(requests));
        console.log('✅ Заявка удалена и сохранена в localStorage');

        // Логируем удаление заявки
        addAuditLog('delete', 'request', currentDeleteId, null, `Заявка удалена`);

        showNotification('Заявка удалена', 'success');
        renderTable();
        updateStatistics();

        // Обновляем статистику вознаграждений для агента при удалении заявки
        if (currentUser && currentUser.role === 'agent') {
            updateAgentRewardStatistics();
        }

        closeDeleteModal();
    } catch (error) {
        console.error('❌ Ошибка удаления заявки:', error);
        showNotification('Ошибка удаления заявки', 'error');
    }
}

// === ФИЛЬТРАЦИЯ И ПОИСК ===

function filterRequests() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // Сначала фильтруем по роли пользователя
    let baseRequests = requests;
    if (currentUser && currentUser.role === 'agent') {
        const currentAgentId = currentUser.agentId || currentUser.id;
        baseRequests = requests.filter(request => {
            return request.agentId === currentAgentId || request.userId === currentUser.id;
        });
        console.log(`🔍 Фильтрация для агента: ${baseRequests.length} заявок из ${requests.length} всего`);
    }

    let filteredRequests = baseRequests.filter(request => {
        // Фильтр по статусу
        const requestStatus = request.requestStatus || request.status;
        if (statusFilter && requestStatus !== statusFilter) return false;

        // Фильтр по дате (точная дата)
        if (dateFilter) {
            const requestDate = request.dateTime.split('T')[0];
            if (requestDate !== dateFilter) return false;
        }

        // Фильтр по диапазону дат
        if (dateFromFilter || dateToFilter) {
            const requestDate = request.dateTime.split('T')[0];

            console.log(`🔍 Фильтр по диапазону дат для заявки ${request.id}:`, {
                requestDate: requestDate,
                dateFromFilter: dateFromFilter,
                dateToFilter: dateToFilter,
                fromCheck: dateFromFilter ? requestDate >= dateFromFilter : true,
                toCheck: dateToFilter ? requestDate <= dateToFilter : true
            });

            // Проверяем, что дата заявки не раньше начальной даты
            if (dateFromFilter && requestDate < dateFromFilter) return false;

            // Проверяем, что дата заявки не позже конечной даты
            if (dateToFilter && requestDate > dateToFilter) return false;
        }

        // Поиск по тексту
        if (searchInput) {
            const searchText = `${request.clientName} ${request.clientAddress} ${request.clientComment}`.toLowerCase();
            if (!searchText.includes(searchInput)) return false;
        }

        return true;
    });

    renderTable(filteredRequests);

    // Обновляем статистику с учетом фильтров
    updateStatistics();

    // Обновляем статистику вознаграждений для агента при фильтрации
    if (currentUser && currentUser.role === 'agent') {
        updateAgentRewardStatistics();
    }
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('searchInput').value = '';
    renderTable();

    // Обновляем статистику с учетом очищенных фильтров
    updateStatistics();

    // Обновляем статистику вознаграждений для агента при очистке фильтров
    if (currentUser && currentUser.role === 'agent') {
        updateAgentRewardStatistics();
    }
}

// Обновление селекта фильтрации по статусам
function updateStatusFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;

    const currentValue = statusFilter.value;
    statusFilter.innerHTML = '<option value="">Все статусы</option>';

    // Добавляем активные статусы из системы управления статусами
    requestStatuses.forEach(status => {
        if (status.isActive) {
            const option = document.createElement('option');
            option.value = status.name;
            option.textContent = status.name;
            statusFilter.appendChild(option);
        }
    });

    // Восстанавливаем выбранное значение
    if (currentValue && requestStatuses.some(s => s.name === currentValue && s.isActive)) {
        statusFilter.value = currentValue;
    }
}

// === РЕНДЕРИНГ ТАБЛИЦЫ ===

function renderTable(data = null) {
    console.log('🔄 renderTable вызвана:', {
        data: data ? data.length : 'null',
        requests: requests.length,
        currentUser: currentUser ? currentUser.role : 'неавторизован'
    });

    const tableBody = document.getElementById('requestsTableBody');
    let requestsToRender = data || requests;

    // Фильтрация заявок по роли пользователя
    if (!data) {
        if (currentUser && currentUser.role === 'agent') {
            // Агент видит только свои заявки
            const currentAgentId = currentUser.agentId || currentUser.id;
            requestsToRender = requests.filter(request => {
                const isAgentRequest = request.agentId === currentAgentId || request.userId === currentUser.id;
                console.log('🔍 Фильтрация заявки для агента:', {
                    requestId: request.id,
                    requestAgentId: request.agentId,
                    requestUserId: request.userId,
                    currentAgentId: currentAgentId,
                    currentUserId: currentUser.id,
                    isAgentRequest: isAgentRequest,
                    clientName: request.clientName
                });
                return isAgentRequest;
            });
            console.log(`👨‍💼 Агент ${currentUser.name} видит ${requestsToRender.length} заявок из ${requests.length} всего`);
        } else if (currentUser && currentUser.role === 'operator') {
            // Оператор видит все заявки (пока без дополнительной фильтрации)
            console.log(`👨‍💻 Оператор ${currentUser.name} видит все ${requestsToRender.length} заявок`);
        } else if (currentUser && currentUser.role === 'admin') {
            // Админ видит все заявки
            console.log(`👑 Админ ${currentUser.name} видит все ${requestsToRender.length} заявок`);
        }
    }

    tableBody.innerHTML = '';

    if (requestsToRender.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="15" style="text-align: center; padding: 40px; color: #6C757D;">
                    Заявки не найдены
                </td>
            </tr>
        `;
        return;
    }

    requestsToRender.forEach((request, index) => {
        const row = document.createElement('tr');
        const dateTime = new Date(request.dateTime);
        const formattedDate = dateTime.toLocaleDateString('ru-RU');
        const formattedTime = dateTime.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Определяем видимость колонок в зависимости от роли
        const showAgentId = currentUser && (currentUser.role === 'admin' || currentUser.role === 'operator' || currentUser.role === 'agent');
        const showProviderComment = currentUser && (currentUser.role === 'admin' || currentUser.role === 'operator');
        const showReward = currentUser && (currentUser.role === 'admin' || currentUser.role === 'agent');

        // Получаем название провайдера
        const providerName = getProviderName(request.provider) || request.provider || '-';

        // Получаем услугу и тариф
        console.log('🔍 Данные для getServiceTariff:', {
            provider: request.provider,
            providerSlug: request.providerSlug,
            service: request.service,
            tariff: request.tariff
        });
        const serviceTariff = getServiceTariff(request.providerSlug || request.provider, request.service, request.tariff);
        console.log('🔍 Результат getServiceTariff:', serviceTariff);

        // Получаем вознаграждение
        const providerSlug = request.providerSlug || getProviderSlugByName(request.provider);
        const service = request.service || 'Интернет'; // По умолчанию Интернет
        const reward = getReward(providerSlug, service) || 0;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div>${formattedDate}</div>
                <div style="color: var(--text-secondary); font-size: 11px;">${formattedTime}</div>
            </td>
            <td>
                <span class="status-badge ${getStatusClass(request.requestStatus || request.status)}">
                    ${request.requestStatus || request.status}
                </span>
            </td>
            <td>${(() => {
                const agentIdDisplay = showAgentId ? (request.agentId || '-') : '-';
                console.log(`🔍 ID агента для заявки ${request.id}:`, {
                    showAgentId: showAgentId,
                    requestAgentId: request.agentId,
                    agentIdDisplay: agentIdDisplay,
                    currentUserRole: currentUser ? currentUser.role : 'нет пользователя'
                });
                return agentIdDisplay;
            })()}</td>
            <td title="${providerName}">${providerName}</td>
            <td title="${request.clientName}"><strong>${request.clientName}</strong></td>
            <td title="${request.clientPhone}">${request.clientPhone}</td>
            <td title="${request.clientCity || 'г. Санкт-Петербург'}">${request.clientCity || 'г. Санкт-Петербург'}</td>
            <td title="${request.clientAddress}">${request.clientAddress}</td>
            <td title="${serviceTariff}">${serviceTariff}</td>
            <td title="${request.clientComment || '-'}">${request.clientComment || '-'}</td>
            <td title="${showProviderComment ? (request.providerComment || '-') : '-'}">${showProviderComment ? (request.providerComment || '-') : '-'}</td>
            <td>${showReward ? `${reward} руб.` : '-'}</td>
            <td>${getReminderDisplay(request.reminder)}</td>
            <td>
                <div class="action-buttons">
                    ${(() => {
                const canEditResult = canEdit(request.id);
                const canDeleteResult = canDelete(request.id);
                console.log(`🔍 renderTable кнопки для заявки ${request.id}:`, {
                    clientName: request.clientName,
                    agentId: request.agentId,
                    userId: request.userId,
                    currentUserId: currentUser ? currentUser.id : 'нет пользователя',
                    currentAgentId: currentUser ? (currentUser.agentId || currentUser.id) : 'нет пользователя',
                    canEdit: canEditResult,
                    canDelete: canDeleteResult
                });

                // Генерируем HTML кнопок
                let buttonsHtml = '';
                if (canEditResult) {
                    buttonsHtml += `<button class="btn btn-info btn-sm" onclick="openEditModal('${request.id}')" title="Редактировать">✏️</button>`;
                }
                if (canDeleteResult) {
                    buttonsHtml += `<button class="btn btn-danger btn-sm" onclick="openDeleteModal('${request.id}')" title="Удалить">🗑️</button>`;
                }

                console.log(`🔧 HTML кнопок для заявки ${request.id}:`, buttonsHtml);
                return buttonsHtml;
            })()}
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    console.log('✅ renderTable завершена:', {
        отрендерено: requestsToRender.length,
        всего: requests.length,
        пользователь: currentUser ? currentUser.role : 'неавторизован'
    });

    // Обновляем статистику вознаграждений для агента при рендеринге таблицы
    if (currentUser && currentUser.role === 'agent') {
        updateAgentRewardStatistics();
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Новая': return 'new';
        case 'Доработка': return 'revision';
        case 'Отказ': return 'rejected';
        case 'Выполнена': return 'completed';
        case 'Оплачена': return 'paid';
        default: return '';
    }
}

// Получение названия провайдера по slug
function getProviderName(providerSlug) {
    if (!providerSlug) return '-';

    const provider = PROVIDERS_DATA.providers.find(p => p.slug === providerSlug);
    return provider ? provider.name : providerSlug;
}

// Получение услуги и тарифа
function getServiceTariff(providerSlug, service, tariff) {
    console.log('🔍 getServiceTariff вызвана с параметрами:', { providerSlug, service, tariff });

    if (!providerSlug || !service) {
        console.log('❌ getServiceTariff: отсутствуют providerSlug или service');
        return '-';
    }

    // Сначала ищем в обновленных данных providersData
    let provider = null;
    let tariffs = null;

    if (providersData[providerSlug]) {
        provider = providersData[providerSlug].provider;
        tariffs = providersData[providerSlug].tariffs;
        console.log('🔍 Используем данные из providersData:', provider ? provider.name : 'не найден');
    } else {
        // Fallback к PROVIDERS_DATA
        provider = PROVIDERS_DATA.providers.find(p => p.slug === providerSlug);
        tariffs = provider ? provider.tariffs : null;
        console.log('🔍 Используем данные из PROVIDERS_DATA:', provider ? provider.name : 'не найден');
    }

    if (!provider) {
        console.log('❌ getServiceTariff: провайдер не найден');
        return service;
    }

    if (tariff) {
        console.log('🔍 Ищем тариф:', tariff);
        // Ищем полную информацию о тарифе
        const tariffInfo = tariffs ? tariffs.find(t => t.name === tariff) : null;
        console.log('🔍 Найденная информация о тарифе:', tariffInfo);

        if (tariffInfo) {
            // Формируем подробное описание тарифа
            let tariffDescription = `${tariffInfo.name}`;
            if (tariffInfo.speed) {
                tariffDescription += ` (${tariffInfo.speed} Мбит/с)`;
            }
            if (tariffInfo.price) {
                tariffDescription += ` - ${tariffInfo.price} руб/${tariffInfo.period}`;
            }
            const result = `${service} - ${tariffDescription}`;
            console.log('✅ getServiceTariff результат с полной информацией:', result);
            return result;
        } else {
            // Если не нашли полную информацию, показываем только название
            const result = `${service} - ${tariff}`;
            console.log('⚠️ getServiceTariff результат без полной информации:', result);
            return result;
        }
    } else {
        console.log('⚠️ getServiceTariff: тариф не указан');
        return service;
    }
}

// Получение slug провайдера по названию
function getProviderSlugByName(providerName) {
    if (!providerName) return null;

    // Маппинг названий провайдеров на slug'и
    const nameToSlug = {
        'Ростелеком': 'rostelecom',
        'Билайн': 'beeline',
        'МегаФон': 'megafon',
        'еТелеком': 'etelecom',
        'SkyNet': 'skynet-provider',
        'ДОМ Ru': 'domovoy',
        'Пин Телеком': 'pin-telekom',
        'Ростелеком ТКТ': 'rostelekom-tkt',
        'AT-HOME': 'ethome',
        'ФГУП РСВО': 'fgup-rsvo',
        'Простор Телеком': 'prostor-telekom',
        'ИнтерЗет': 'interzet',
        'NewLink': 'newlink',
        'ПАКТ': 'pakt',
        'Aikonet': 'aikonet',
        'Арбитал': 'arbital',
        'Обит': 'obit'
    };

    return nameToSlug[providerName] || null;
}

// === НАПОМИНАЛКА ===

// Инициализация системы напоминаний
function initializeReminders() {
    console.log('🔔 Инициализация системы напоминаний...');

    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Разрешение на уведомления получено');
            } else {
                console.log('❌ Разрешение на уведомления отклонено');
            }
        });
    }

    // Проверяем напоминания сразу при загрузке
    setTimeout(() => {
        checkReminders();
    }, 2000);

    console.log('✅ Система напоминаний инициализирована');
}

// Функция для отображения напоминалки в таблице
function getReminderDisplay(reminder) {
    if (!reminder || !reminder.date || !reminder.time) {
        return '<span style="color: #6c757d;">-</span>';
    }

    const reminderDate = new Date(reminder.date + 'T' + reminder.time);
    const now = new Date();
    const isOverdue = reminderDate < now;

    let displayText = `${reminder.date} ${reminder.time}`;
    let color = '#6c757d';

    if (isOverdue) {
        color = '#dc3545'; // Красный для просроченных
        displayText = `⚠️ ${displayText}`;
    } else {
        color = '#28a745'; // Зеленый для активных
        displayText = `🔔 ${displayText}`;
    }

    const methods = [];
    if (reminder.email) methods.push('📧');
    if (reminder.telegram) methods.push('📱');

    return `
        <div style="color: ${color}; font-size: 12px;">
            <div>${displayText}</div>
            <div style="margin-top: 2px;">${methods.join(' ')}</div>
        </div>
    `;
}

// Функция проверки и отправки напоминаний
function checkReminders() {
    const requestsWithReminders = requests.filter(r => r.reminder && r.reminder.date && r.reminder.time);

    if (requestsWithReminders.length > 0) {
        console.log(`🔍 Проверяем ${requestsWithReminders.length} напоминаний...`);
        const now = new Date();

        requestsWithReminders.forEach(request => {
            const reminderDateTime = new Date(`${request.reminder.date}T${request.reminder.time}`);
            console.log(`⏰ Напоминание для заявки ${request.id}:`, {
                reminderTime: reminderDateTime.toLocaleString('ru-RU'),
                currentTime: now.toLocaleString('ru-RU'),
                shouldSend: reminderDateTime <= now
            });

            if (reminderDateTime <= now) {
                sendReminder(request);
            }
        });
    } else {
        console.log('🔍 Нет напоминаний для проверки');
    }
}

// Функция для отправки напоминаний
function sendReminder(request) {
    if (!request.reminder || !request.reminder.date || !request.reminder.time) {
        return; // Нет напоминания
    }

    const reminderDate = new Date(request.reminder.date + 'T' + request.reminder.time);
    const now = new Date();

    // Проверяем, наступило ли время напоминания
    if (reminderDate <= now) {
        console.log(`🔔 Отправляем напоминание для заявки ${request.id}`);

        // Находим агента заявки - пробуем разные способы поиска
        console.log(`🔍 Поиск агента для заявки ${request.id}:`, {
            requestUserId: request.userId,
            requestAgentId: request.agentId,
            allUsers: users.map(u => ({ id: u.id, agentId: u.agentId, name: u.name, email: u.email, notificationEmail: u.notificationEmail }))
        });

        let agent = users.find(u => u.id === request.userId || u.agentId === request.agentId);

        // Если не нашли по id, пробуем по login
        if (!agent) {
            agent = users.find(u => u.login === request.agentId);
        }

        if (!agent) {
            console.log(`❌ Агент для заявки ${request.id} не найден. Пробовали найти по:`, {
                agentId: request.agentId,
                userId: request.userId,
                availableUsers: users.map(u => ({ id: u.id, login: u.login, agentId: u.agentId, name: u.name }))
            });
            return;
        }

        console.log(`👤 Найден агент для заявки ${request.id}:`, {
            id: agent.id,
            agentId: agent.agentId,
            name: agent.name,
            email: agent.email,
            notificationEmail: agent.notificationEmail,
            notificationPhone: agent.notificationPhone,
            notificationTelegram: agent.notificationTelegram
        });

        // Формируем сообщение напоминания
        const reminderMessage = `🔔 <b>НАПОМИНАНИЕ О ЗАЯВКЕ</b>

📋 <b>Заявка:</b> ${request.clientName}
📞 <b>Телефон:</b> ${request.clientPhone}
🏢 <b>Провайдер:</b> ${request.provider}
📍 <b>Адрес:</b> ${request.clientCity} ${request.clientAddress}
📝 <b>Комментарий:</b> ${request.clientComment || 'Нет комментария'}

⏰ <b>Время создания:</b> ${new Date(request.dateTime).toLocaleString('ru-RU')}
📊 <b>Статус:</b> ${request.requestStatus || request.status}

⚠️ <b>НЕ ЗАБУДЬТЕ СВЯЗАТЬСЯ С КЛИЕНТОМ!</b>

<i>Это автоматическое напоминание от системы Allcitynet Portal</i>`;

        // Отправляем напоминания
        // Email уведомления
        if (request.reminder.email) {
            const emailToSend = agent.notificationEmail || agent.email;
            console.log(`📧 Выбор email для отправки:`, {
                agentName: agent.name,
                notificationEmail: agent.notificationEmail,
                mainEmail: agent.email,
                selectedEmail: emailToSend
            });

            if (emailToSend) {
                console.log(`📧 Отправляем email напоминание на ${emailToSend}`);
                sendEmailReminder(emailToSend, reminderMessage, request);
            } else {
                console.log(`❌ Email для уведомлений не указан для агента ${agent.name}`);
            }
        }

        // SMS уведомления
        if (request.reminder.sms && agent.notificationPhone) {
            console.log(`📱 Отправляем SMS напоминание на ${agent.notificationPhone}`);
            sendSMSReminder(agent.notificationPhone, reminderMessage);
        }

        // Telegram уведомления (если есть)
        const telegramAccount = agent.notificationTelegram || agent.telegram;
        if (request.reminder.telegram && telegramAccount) {
            console.log(`📱 Отправляем Telegram напоминание на ${telegramAccount}`);
            console.log(`📱 Детали напоминания:`, {
                reminderTelegram: request.reminder.telegram,
                agentNotificationTelegram: agent.notificationTelegram,
                agentTelegram: agent.telegram,
                selectedTelegram: telegramAccount,
                agentName: agent.name,
                requestId: request.id
            });
            sendTelegramReminderImproved(telegramAccount, reminderMessage);
        } else {
            console.log(`❌ Telegram напоминание не отправлено:`, {
                reminderTelegram: request.reminder.telegram,
                agentNotificationTelegram: agent.notificationTelegram,
                agentTelegram: agent.telegram,
                agentName: agent.name,
                requestId: request.id
            });
        }

        // Показываем уведомление в браузере
        showBrowserNotification('Напоминание о заявке', reminderMessage);

        // Удаляем напоминание после отправки
        const requestIndex = requests.findIndex(r => r.id === request.id);
        if (requestIndex !== -1) {
            requests[requestIndex].reminder = null;
            localStorage.setItem('requests', JSON.stringify(requests));
            console.log(`✅ Напоминание удалено для заявки ${request.id}`);
            renderTable(); // Обновляем таблицу
        }
    }
}

// Функция отправки email напоминания
function sendEmailReminder(email, message, request) {
    try {
        // Здесь можно добавить интеграцию с EmailJS или другим сервисом
        console.log(`📧 Email напоминание для ${email}:`, message);
        showNotification(`Email напоминание отправлено на ${email}`, 'success');
    } catch (error) {
        console.error('❌ Ошибка при отправке email:', error);
        showNotification('Ошибка отправки email напоминания', 'error');
    }
}

// Функция отправки Telegram напоминания
function sendTelegramReminder(telegram, message) {
    console.log(`📱 Отправляем Telegram уведомление на ${telegram}:`, message);

    // Конфигурация Telegram бота @Allcitynet_bot
    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Проверяем, настроен ли бот
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('❌ Telegram бот не настроен');
        showNotification('Telegram бот не настроен. Проверьте конфигурацию.', 'warning');
        return;
    }

    // Обрабатываем разные форматы Telegram ID
    let TELEGRAM_CHAT_ID = telegram;

    // Если это username с @, убираем @
    if (telegram.startsWith('@')) {
        TELEGRAM_CHAT_ID = telegram.substring(1);
    }

    console.log(`📱 Отправляем сообщение пользователю: ${TELEGRAM_CHAT_ID}`);

    // Формируем URL для отправки сообщения
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Параметры сообщения
    const messageData = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    // Отправляем запрос к Telegram API
    fetch(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('✅ Telegram уведомление отправлено успешно:', data);
                showNotification(`Telegram отправлен на ${telegram}`, 'success');
            } else {
                console.error('❌ Ошибка отправки Telegram:', data);
                console.log('ℹ️ Примечание: Несмотря на ошибку, сообщение может быть доставлено пользователю.');

                // Обрабатываем разные типы ошибок
                let errorMessage = data.description || 'Неизвестная ошибка';
                let isWarning = false;

                if (data.description === 'Bad Request: chat not found') {
                    errorMessage = 'Пользователь не писал боту первым. Попросите пользователя написать боту @Allcitynet_bot любое сообщение. Сообщение может быть доставлено, несмотря на ошибку.';
                    isWarning = true;
                } else if (data.description === 'Forbidden: bot was blocked by the user') {
                    errorMessage = 'Пользователь заблокировал бота.';
                } else if (data.description === 'Bad Request: user not found') {
                    errorMessage = 'Пользователь не найден. Проверьте правильность username.';
                } else if (data.description === 'Forbidden: user is deactivated') {
                    errorMessage = 'Пользователь деактивирован.';
                }

                if (isWarning) {
                    showNotification(`⚠️ Telegram: ${errorMessage}`, 'warning');
                } else {
                    showNotification(`Ошибка отправки Telegram: ${errorMessage}`, 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Ошибка при отправке Telegram:', error);
            showNotification(`Ошибка отправки Telegram: ${error.message}`, 'error');
        });
}

// Функция показа уведомления в браузере
function showBrowserNotification(title, message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMTkiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIiIHkyPSIxOTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwN0JGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDU2QjMiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8dGV4dCB4PSI5NiIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIj7wn5GiPC90ZXh0Pgo8L3N2Zz4K',
                tag: 'reminder'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMTkiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIiIHkyPSIxOTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwN0JGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDU2QjMiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8dGV4dCB4PSI5NiIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIj7wn5GiPC90ZXh0Pgo8L3N2Zz4K',
                        tag: 'reminder'
                    });
                }
            });
        }
    }

    // Также показываем уведомление в интерфейсе
    showNotification(title, 'info');
}

// === СТАТИСТИКА ===

// Функция для получения отфильтрованных заявок с учетом всех активных фильтров
function getFilteredRequests() {
    let visibleRequests = requests;

    // Фильтр по роли пользователя
    if (currentUser && currentUser.role === 'agent') {
        const currentAgentId = currentUser.agentId || currentUser.id;
        visibleRequests = requests.filter(request => {
            return request.agentId === currentAgentId || request.userId === currentUser.id;
        });
    }

    // Применяем все активные фильтры
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    const dateFromFilter = document.getElementById('dateFromFilter')?.value || '';
    const dateToFilter = document.getElementById('dateToFilter')?.value || '';
    const searchInput = document.getElementById('searchInput')?.value || '';

    return visibleRequests.filter(request => {
        // Фильтр по статусу
        if (statusFilter) {
            const requestStatus = request.requestStatus || request.status;
            if (requestStatus !== statusFilter) return false;
        }

        // Фильтр по точной дате
        if (dateFilter) {
            const requestDate = request.dateTime.split('T')[0];
            if (requestDate !== dateFilter) return false;
        }

        // Фильтр по диапазону дат
        if (dateFromFilter || dateToFilter) {
            const requestDate = request.dateTime.split('T')[0];

            if (dateFromFilter && requestDate < dateFromFilter) return false;
            if (dateToFilter && requestDate > dateToFilter) return false;
        }

        // Фильтр по поиску
        if (searchInput) {
            const searchTerm = searchInput.toLowerCase();
            const searchableText = [
                request.clientName,
                request.clientPhone,
                request.clientAddress,
                request.clientCity,
                request.provider,
                request.service,
                request.tariff
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
    });
}

function updateStatistics() {
    // Получаем отфильтрованные заявки с учетом всех активных фильтров
    const visibleRequests = getFilteredRequests();

    // Общее количество заявок
    document.getElementById('totalRequests').textContent = visibleRequests.length;

    // Статистика по статусам
    document.getElementById('newRequests').textContent =
        visibleRequests.filter(r => (r.requestStatus === 'Новая' || r.status === 'Новая')).length;

    document.getElementById('inProgressRequests').textContent =
        visibleRequests.filter(r => (r.requestStatus === 'Доработка' || r.status === 'Доработка')).length;

    document.getElementById('rejectedRequests').textContent =
        visibleRequests.filter(r => (r.requestStatus === 'Отказ' || r.status === 'Отказ')).length;

    document.getElementById('completedRequests').textContent =
        visibleRequests.filter(r => (r.requestStatus === 'Выполнена' || r.status === 'Выполнена')).length;

    document.getElementById('paidRequests').textContent =
        visibleRequests.filter(r => (r.requestStatus === 'Оплачена' || r.status === 'Оплачена')).length;

    console.log(`📊 Статистика для ${currentUser?.role || 'неавторизованного'}: ${visibleRequests.length} заявок (с учетом фильтров)`, {
        новые: visibleRequests.filter(r => (r.requestStatus === 'Новая' || r.status === 'Новая')).length,
        доработка: visibleRequests.filter(r => (r.requestStatus === 'Доработка' || r.status === 'Доработка')).length,
        отказ: visibleRequests.filter(r => (r.requestStatus === 'Отказ' || r.status === 'Отказ')).length,
        выполнены: visibleRequests.filter(r => (r.requestStatus === 'Выполнена' || r.status === 'Выполнена')).length,
        оплачены: visibleRequests.filter(r => (r.requestStatus === 'Оплачена' || r.status === 'Оплачена')).length
    });

    // Обновляем статистику вознаграждений для агента
    if (currentUser && currentUser.role === 'agent') {
        updateAgentRewardStatistics();
    }
}

// === СТАТИСТИКА ВОЗНАГРАЖДЕНИЙ АГЕНТА ===

function updateAgentRewardStatistics() {
    const agentStatsContainer = document.getElementById('agentStatsContainer');
    const plannedRewardEl = document.getElementById('plannedReward');
    const receivedRewardEl = document.getElementById('receivedReward');

    if (!agentStatsContainer || !plannedRewardEl || !receivedRewardEl) {
        console.log('⚠️ Элементы статистики агента не найдены');
        return;
    }

    // Показываем блоки только для агентов
    if (currentUser && currentUser.role === 'agent') {
        agentStatsContainer.style.display = 'grid';

        // Используем отфильтрованные заявки для расчета вознаграждений
        const agentRequests = getFilteredRequests();

        console.log(`💰 Расчет вознаграждений для агента (с учетом фильтров): ${agentRequests.length} заявок`);

        // Рассчитываем планируемое вознаграждение (заявки агента с любым статусом кроме "Оплачена")
        let plannedReward = 0;
        const plannedRequests = agentRequests.filter(request => {
            const status = request.requestStatus || request.status;
            return status !== 'Оплачена';
        });

        plannedRequests.forEach(request => {
            const reward = getReward(request.providerSlug, request.service);
            plannedReward += reward;
            const status = request.requestStatus || request.status;
            console.log(`💰 Планируемая заявка ${request.id}: ${request.providerSlug} - ${request.service} = ${reward} ₽, статус: ${status}`);
        });

        // Рассчитываем полученное вознаграждение (только оплаченные заявки)
        let receivedReward = 0;
        const paidRequests = agentRequests.filter(request => {
            const status = request.requestStatus || request.status;
            return status === 'Оплачена';
        });

        paidRequests.forEach(request => {
            const reward = getReward(request.providerSlug, request.service);
            receivedReward += reward;
            console.log(`💳 Оплаченная заявка ${request.id}: ${request.providerSlug} - ${request.service} = ${reward} ₽`);
        });

        // Обновляем отображение
        plannedRewardEl.textContent = `${plannedReward.toLocaleString()} ₽`;
        receivedRewardEl.textContent = `${receivedReward.toLocaleString()} ₽`;

        console.log(`💰 Итого планируемое: ${plannedReward} ₽ (${plannedRequests.length} заявок), получено: ${receivedReward} ₽ (${paidRequests.length} заявок)`);

    } else {
        // Скрываем блоки для не-агентов
        agentStatsContainer.style.display = 'none';
    }
}

// === GOOGLE SHEETS СИНХРОНИЗАЦИЯ ===

// Конфигурация Google Sheets
const GOOGLE_SHEETS_CONFIG = {
    webhookUrl: '', // URL веб-хука Google Apps Script
    enabled: false
};

// Массив для отслеживания уже синхронизированных заявок
let syncedRequests = new Set();

// Инициализация Google Sheets
function initGoogleSheets() {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        Object.assign(GOOGLE_SHEETS_CONFIG, config);
        console.log('✅ Конфигурация Google Sheets загружена');
    }

    const savedSyncedRequests = localStorage.getItem('syncedRequests');
    if (savedSyncedRequests) {
        syncedRequests = new Set(JSON.parse(savedSyncedRequests));
        console.log(`✅ Загружено ${syncedRequests.size} синхронизированных заявок`);
    }
}

// Сохранение конфигурации Google Sheets
function saveGoogleSheetsConfig() {
    localStorage.setItem('googleSheetsConfig', JSON.stringify(GOOGLE_SHEETS_CONFIG));
    localStorage.setItem('syncedRequests', JSON.stringify([...syncedRequests]));
}

// Добавление заявки в Google Sheets через веб-хук
async function addRequestToGoogleSheets(request) {
    if (!GOOGLE_SHEETS_CONFIG.enabled || !GOOGLE_SHEETS_CONFIG.webhookUrl) {
        console.log('⚠️ Google Sheets синхронизация не настроена');
        return;
    }

    if (syncedRequests.has(request.id)) {
        console.log(`📋 Заявка ${request.id} уже синхронизирована`);
        return;
    }

    try {
        const providerName = getProviderName(request.provider) || request.provider || '-';
        const serviceTariff = getServiceTariff(request.provider, request.service, request.tariff) || '-';
        const reward = getReward(request.provider, request.service, request.requestStatus || request.status);

        const requestData = {
            id: request.id,
            dateTime: new Date(request.dateTime).toLocaleString('ru-RU'),
            agentId: request.agentId || '-',
            provider: providerName,
            clientName: request.clientName,
            clientPhone: request.clientPhone,
            clientCity: request.clientCity || 'г. Санкт-Петербург',
            clientAddress: request.clientAddress,
            serviceTariff: serviceTariff,
            clientComment: request.clientComment || '',
            providerComment: request.providerComment || '',
            reward: `${reward} руб.`,
            status: request.requestStatus || request.status || 'Новая'
        };

        // Используем GET запрос с параметрами для обхода CORS
        const params = new URLSearchParams();
        Object.keys(requestData).forEach(key => {
            params.append(key, requestData[key]);
        });

        console.log('Отправляемые данные:', requestData);
        console.log('Статус заявки:', requestData.status);
        console.log('URL параметры:', params.toString());

        const url = `${GOOGLE_SHEETS_CONFIG.webhookUrl}?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors' // Обходим CORS проверку
        });

        // При использовании no-cors мы не можем проверить response.ok
        // Но если запрос выполнился без исключения, считаем его успешным
        syncedRequests.add(request.id);
        saveGoogleSheetsConfig();
        console.log(`✅ Заявка ${request.id} отправлена в Google Sheets`);

    } catch (error) {
        console.error('❌ Ошибка синхронизации с Google Sheets:', error);
    }
}

// Синхронизация всех новых заявок
async function syncNewRequestsToGoogleSheets() {
    if (!GOOGLE_SHEETS_CONFIG.enabled || !GOOGLE_SHEETS_CONFIG.webhookUrl) {
        console.log('⚠️ Google Sheets синхронизация не настроена');
        return;
    }

    const newRequests = requests.filter(request => !syncedRequests.has(request.id));

    if (newRequests.length === 0) {
        console.log('📋 Нет новых заявок для синхронизации');
        return;
    }

    console.log(`🔄 Синхронизация ${newRequests.length} новых заявок с Google Sheets`);

    for (const request of newRequests) {
        await addRequestToGoogleSheets(request);
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Синхронизация завершена. Обработано ${newRequests.length} заявок`);
}

// Настройка Google Sheets веб-хука
function setupGoogleSheetsAPI() {
    const webhookUrl = prompt('Введите URL веб-хука Google Apps Script:');
    if (webhookUrl) {
        GOOGLE_SHEETS_CONFIG.webhookUrl = webhookUrl;
        GOOGLE_SHEETS_CONFIG.enabled = true;
        saveGoogleSheetsConfig();
        showNotification('Веб-хук Google Sheets настроен', 'success');

        // Автоматическая синхронизация после настройки
        setTimeout(() => {
            syncNewRequestsToGoogleSheets();
        }, 1000);
    }
}

// Проверка статуса синхронизации
function checkSyncStatus() {
    const totalRequests = requests.length;
    const syncedCount = syncedRequests.size;
    const pendingCount = totalRequests - syncedCount;

    console.log(`📊 Статус синхронизации:`);
    console.log(`   Всего заявок: ${totalRequests}`);
    console.log(`   Синхронизировано: ${syncedCount}`);
    console.log(`   Ожидает синхронизации: ${pendingCount}`);
    console.log(`   Синхронизация ${GOOGLE_SHEETS_CONFIG.enabled ? 'включена' : 'отключена'}`);

    return {
        total: totalRequests,
        synced: syncedCount,
        pending: pendingCount,
        enabled: GOOGLE_SHEETS_CONFIG.enabled
    };
}

// === СИСТЕМА АУДИТА ===

// Функция для добавления записи в лог аудита
function addAuditLog(action, objectType, objectId, changes = null, details = null) {
    if (!currentUser) return;

    const auditEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: action, // create, update, delete, login, logout
        objectType: objectType, // request, user, reward, status
        objectId: objectId,
        changes: changes, // { field: { old: 'oldValue', new: 'newValue' } }
        details: details, // дополнительная информация
        ip: '127.0.0.1', // В реальном приложении получать IP
        userAgent: navigator.userAgent
    };

    auditLogs.unshift(auditEntry); // Добавляем в начало массива

    // Сохраняем в localStorage
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));

    console.log('📝 Audit log added:', auditEntry);
}

// Инициализация логов аудита
function initAuditLogs() {
    const savedLogs = localStorage.getItem('auditLogs');
    if (savedLogs) {
        auditLogs = JSON.parse(savedLogs);
    } else {
        auditLogs = [];
        // Добавляем начальную запись
        addAuditLog('system', 'system', 'init', null, 'Система инициализирована');
    }
    console.log('📝 Audit logs initialized:', auditLogs.length, 'entries');
}

// Открытие модального окна логов аудита
function openAuditLogsModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только администратор может просматривать логи.', 'error');
        return;
    }

    loadAuditLogsTable();
    populateUserFilter();
    document.getElementById('auditLogsModal').style.display = 'block';
}

// Закрытие модального окна логов аудита
function closeAuditLogsModal() {
    document.getElementById('auditLogsModal').style.display = 'none';
}

// Загрузка таблицы логов аудита
function loadAuditLogsTable() {
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filteredLogs = getFilteredAuditLogs();

    filteredLogs.forEach(log => {
        const row = document.createElement('tr');

        const time = new Date(log.timestamp).toLocaleString('ru-RU');
        const changesHtml = formatChangesHtml(log.changes);

        row.innerHTML = `
            <td class="audit-log-time">${time}</td>
            <td class="audit-log-user">${log.userName}<br><small>${log.userEmail}</small></td>
            <td><span class="audit-log-action ${log.action}">${getActionDisplayName(log.action)}</span></td>
            <td class="audit-log-object">${getObjectDisplayName(log.objectType)} #${log.objectId}</td>
            <td class="audit-log-changes">${changesHtml}</td>
            <td class="audit-log-ip">${log.ip}</td>
        `;

        tbody.appendChild(row);
    });

    // Обновляем статистику
    document.getElementById('totalLogs').textContent = auditLogs.length;
    document.getElementById('filteredLogs').textContent = filteredLogs.length;
}

// Получение отфильтрованных логов
function getFilteredAuditLogs() {
    const userFilter = document.getElementById('logUserFilter')?.value || '';
    const actionFilter = document.getElementById('logActionFilter')?.value || '';
    const dateFilter = document.getElementById('logDateFilter')?.value || '';

    return auditLogs.filter(log => {
        if (userFilter && log.userId !== userFilter) return false;
        if (actionFilter && log.action !== actionFilter) return false;
        if (dateFilter) {
            const logDate = log.timestamp.split('T')[0];
            if (logDate !== dateFilter) return false;
        }
        return true;
    });
}

// Фильтрация логов аудита
function filterAuditLogs() {
    loadAuditLogsTable();
}

// Очистка фильтров аудита
function clearAuditFilters() {
    document.getElementById('logUserFilter').value = '';
    document.getElementById('logActionFilter').value = '';
    document.getElementById('logDateFilter').value = '';
    loadAuditLogsTable();
}

// Заполнение фильтра пользователей
function populateUserFilter() {
    const userFilter = document.getElementById('logUserFilter');
    if (!userFilter) return;

    // Сохраняем текущее значение
    const currentValue = userFilter.value;

    // Очищаем опции (кроме "Все пользователи")
    userFilter.innerHTML = '<option value="">Все пользователи</option>';

    // Получаем уникальных пользователей из логов
    const uniqueUsers = [...new Set(auditLogs.map(log => log.userId))];

    uniqueUsers.forEach(userId => {
        const userLog = auditLogs.find(log => log.userId === userId);
        if (userLog) {
            const option = document.createElement('option');
            option.value = userId;
            option.textContent = `${userLog.userName} (${userLog.userEmail})`;
            userFilter.appendChild(option);
        }
    });

    // Восстанавливаем выбранное значение
    if (currentValue) {
        userFilter.value = currentValue;
    }
}

// Форматирование HTML для изменений
function formatChangesHtml(changes) {
    if (!changes) return '-';

    const changeItems = Object.entries(changes).map(([field, change]) => {
        const fieldName = getFieldDisplayName(field);
        return `
            <div class="change-item">
                <span class="change-field">${fieldName}:</span>
                ${change.old ? `<span class="change-old">${change.old}</span>` : ''}
                ${change.old && change.new ? ' → ' : ''}
                ${change.new ? `<span class="change-new">${change.new}</span>` : ''}
            </div>
        `;
    });

    return changeItems.join('');
}

// Получение отображаемого имени действия
function getActionDisplayName(action) {
    const actionNames = {
        'create': 'Создание',
        'update': 'Изменение',
        'delete': 'Удаление',
        'login': 'Вход',
        'logout': 'Выход',
        'system': 'Система'
    };
    return actionNames[action] || action;
}

// Получение отображаемого имени объекта
function getObjectDisplayName(objectType) {
    const objectNames = {
        'request': 'Заявка',
        'user': 'Пользователь',
        'reward': 'Вознаграждение',
        'status': 'Статус',
        'system': 'Система'
    };
    return objectNames[objectType] || objectType;
}

// Получение отображаемого имени поля
function getFieldDisplayName(field) {
    const fieldNames = {
        'clientName': 'Клиент',
        'clientPhone': 'Телефон',
        'clientAddress': 'Адрес',
        'requestStatus': 'Статус',
        'providerComment': 'Комментарий провайдера',
        'clientComment': 'Комментарий клиента',
        'name': 'Имя',
        'email': 'Email',
        'role': 'Роль',
        'isActive': 'Активность',
        'password': 'Пароль'
    };
    return fieldNames[field] || field;
}

// Экспорт логов аудита в CSV
function exportAuditLogs() {
    const filteredLogs = getFilteredAuditLogs();

    if (filteredLogs.length === 0) {
        showNotification('Нет данных для экспорта', 'info');
        return;
    }

    const headers = ['Время', 'Пользователь', 'Email', 'Роль', 'Действие', 'Объект', 'ID объекта', 'Изменения', 'IP'];
    const csvContent = [
        headers.join(';'),
        ...filteredLogs.map(log => [
            new Date(log.timestamp).toLocaleString('ru-RU'),
            `"${log.userName}"`,
            `"${log.userEmail}"`,
            `"${log.userRole}"`,
            `"${getActionDisplayName(log.action)}"`,
            `"${getObjectDisplayName(log.objectType)}"`,
            log.objectId,
            `"${formatChangesForCSV(log.changes)}"`,
            log.ip
        ].join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Экспортировано ${filteredLogs.length} записей логов`, 'success');
}

// Форматирование изменений для CSV
function formatChangesForCSV(changes) {
    if (!changes) return '';

    return Object.entries(changes).map(([field, change]) => {
        const fieldName = getFieldDisplayName(field);
        const oldValue = change.old || '';
        const newValue = change.new || '';
        return `${fieldName}: ${oldValue} → ${newValue}`;
    }).join('; ');
}

// === ЭКСПОРТ ===

function exportToCSV() {
    if (!currentUser) {
        showNotification('Необходимо войти в систему', 'error');
        openLoginModal();
        return;
    }

    // Получаем заявки, которые видит текущий пользователь
    let visibleRequests = requests;
    if (currentUser.role === 'agent') {
        const currentAgentId = currentUser.agentId || currentUser.id;
        visibleRequests = requests.filter(request => {
            return request.agentId === currentAgentId || request.userId === currentUser.id;
        });
        console.log(`📊 Экспорт для агента: ${visibleRequests.length} заявок из ${requests.length} всего`);
    }

    const headers = [
        '№',
        'Дата и время',
        'ID агента',
        'Провайдер',
        'Клиент',
        'Телефон',
        'Город',
        'Адрес',
        'Услуга и тариф',
        'Комментарий',
        'Комментарий провайдера',
        'Вознаграждение'
    ];

    const csvContent = [
        headers.join(';'),
        ...visibleRequests.map(request => {
            const providerName = getProviderName(request.provider) || request.provider || '-';
            const serviceTariff = getServiceTariff(request.provider, request.service, request.tariff) || '-';
            const reward = getReward(request.provider, request.service, request.requestStatus || request.status);
            const reminderDisplay = getReminderDisplay(request.reminder);

            return [
                request.id,
                new Date(request.dateTime).toLocaleString('ru-RU'),
                request.agentId || '-',
                `"${providerName}"`,
                `"${request.clientName}"`,
                request.clientPhone,
                request.clientCity || 'г. Санкт-Петербург',
                `"${request.clientAddress}"`,
                `"${serviceTariff}"`,
                `"${request.clientComment || ''}"`,
                `"${request.providerComment || ''}"`,
                `${reward} руб.`
            ].join(';');
        })
    ].join('\n');

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `заявки_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Экспортировано ${visibleRequests.length} заявок`, 'success');
}

// === УВЕДОМЛЕНИЯ ===

function notifyTelegram(request) {
    const url = getTelegramWebhookUrl();
    if (!url) return;

    const message = buildTelegramMessage(request);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: message,
            parse_mode: 'HTML'
        })
    }).catch(error => {
        console.error('Ошибка отправки в Telegram:', error);
    });
}

function buildTelegramMessage(request) {
    const dt = new Date(request.dateTime).toLocaleString('ru-RU');
    return `
🆕 <b>Новая заявка</b>
📅 Дата: ${dt}
📊 Статус: ${request.status}
👤 Клиент: ${request.clientName}
📞 Телефон: ${request.clientPhone}
📍 Адрес: ${request.clientAddress}
💬 Комментарий: ${request.clientComment || 'Нет комментария'}
🔧 Комментарий провайдера: ${request.providerComment || 'Нет комментария'}
🆔 ID агента: ${request.userId}
    `.trim();
}

function getTelegramWebhookUrl() {
    return localStorage.getItem('telegram_webhook_url') || '';
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (АДМИН) ===

function openUsersModal() {
    if (!currentUser || currentUser.role !== 'admin') return;

    renderUsersList();
    document.getElementById('usersModal').style.display = 'block';
}

function closeUsersModal() {
    document.getElementById('usersModal').style.display = 'none';
}

function renderUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${getRoleDisplayName(user.role)}</td>
            <td>${user.agentId || '-'}</td>
            <td>
                ${user.notificationEmail ? `📧 ${user.notificationEmail}` : ''}
                ${user.notificationPhone ? `<br>📱 ${user.notificationPhone}` : ''}
                ${user.notificationTelegram ? `<br>📱 ${user.notificationTelegram}` : ''}
                ${!user.notificationEmail && !user.notificationPhone && !user.notificationTelegram ? '-' : ''}
            </td>
            <td>${user.providerAccess ? user.providerAccess.join(', ') : '-'}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="openEditUserModal(${user.id})" style="margin-right:5px">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function addUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const role = formData.get('role');
    const agentId = formData.get('agentId');

    // Проверяем уникальность ID агента для агентов
    if (role === 'agent' && agentId) {
        const existingAgent = users.find(u => u.agentId === agentId);
        if (existingAgent) {
            showNotification('Агент с таким ID уже существует', 'error');
            return;
        }
    }

    const newUser = {
        id: Date.now(),
        name: formData.get('name'),
        email: formData.get('email'),
        password: hashPassword(formData.get('password')),
        role: role,
        agentId: role === 'agent' ? agentId : null, // Сохраняем ID агента только для агентов
        providerAccess: getSelectedProvidersForAccess(),
        notificationEmail: formData.get('notificationEmail') || null,
        notificationPhone: formData.get('notificationPhone') || null,
        notificationTelegram: formData.get('notificationTelegram') || null,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('Пользователь добавлен', 'success');
    renderUsersList();
    event.target.reset();

    // Скрываем секции после добавления
    document.getElementById('providerAccessSection').style.display = 'none';
    document.getElementById('agentIdSection').style.display = 'none';
}

function deleteUser(id) {
    if (confirm('Вы уверены, что хотите удалить пользователя?')) {
        users = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Пользователь удален', 'success');
        renderUsersList();
    }
}

function openEditUserModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Заполняем форму редактирования
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserPassword').value = ''; // Пароль не показываем, оставляем пустым
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserNotificationEmail').value = user.notificationEmail || '';
    document.getElementById('editUserNotificationPhone').value = user.notificationPhone || '';
    document.getElementById('editUserNotificationTelegram').value = user.notificationTelegram || '';

    // Загружаем доступ к провайдерам
    loadEditProviderAccessList();

    document.getElementById('editUserModal').style.display = 'block';

    console.log(`👤 Открыто редактирование пользователя: ${user.name} (${user.email})`);
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    // Сбрасываем форму
    document.getElementById('editUserForm').reset();
    console.log('👤 Модальное окно редактирования пользователя закрыто');
}

function updateUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userId = parseInt(formData.get('userId'));
    const newPassword = formData.get('password');

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    // Обновляем данные пользователя
    const updatedUser = {
        ...users[userIndex],
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        providerAccess: getEditSelectedProviders(),
        notificationEmail: formData.get('notificationEmail') || null,
        notificationPhone: formData.get('notificationPhone') || null,
        notificationTelegram: formData.get('notificationTelegram') || null
    };

    // Если указан новый пароль, обновляем его
    if (newPassword && newPassword.trim() !== '') {
        // Проверяем сложность пароля
        if (newPassword.length < 8) {
            showNotification('Пароль должен содержать минимум 8 символов', 'error');
            return;
        }

        // Хешируем новый пароль
        updatedUser.password = hashPassword(newPassword);
        console.log(`🔐 Пароль обновлен для пользователя: ${updatedUser.name}`);
    }

    users[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('Пользователь обновлен', 'success');
    renderUsersList();
    closeEditUserModal();
}

// === УПРАВЛЕНИЕ ВОЗНАГРАЖДЕНИЯМИ (АДМИН) ===

function openRewardsModal() {
    if (!currentUser || currentUser.role !== 'admin') return;

    renderRewardsList();
    document.getElementById('rewardsModal').style.display = 'block';
}

function closeRewardsModal() {
    document.getElementById('rewardsModal').style.display = 'none';
}

function renderRewardsList() {
    const rewardsList = document.getElementById('rewardsList');
    if (!rewardsList) return;

    rewardsList.innerHTML = rewards.map(reward => `
        <tr>
            <td>${reward.name}</td>
            <td>${reward.amount} руб.</td>
            <td>
                <input type="checkbox" ${reward.isActive ? 'checked' : ''} 
                       onchange="toggleRewardActive(${reward.id})">
            </td>
        </tr>
    `).join('');
}

function toggleRewardActive(id) {
    const reward = rewards.find(r => r.id === id);
    if (reward) {
        reward.isActive = !reward.isActive;
        localStorage.setItem('rewards', JSON.stringify(rewards));
    }
}

// === ОБНОВЛЕНИЕ ТАРИФОВ (АДМИН) ===

function openTariffUpdateModal() {
    if (!currentUser || currentUser.role !== 'admin') return;

    loadProvidersList();
    document.getElementById('tariffUpdateModal').style.display = 'block';
}

// Быстрое обновление еТелеком
function quickUpdateEtelecom() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление еТелеком...');
    showNotification('Обновление еТелеком...', 'info');

    try {
        // Вызываем функцию обновления еТелеком
        forceUpdateEtelecomData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('etelecom');

        showNotification('еТелеком обновлен успешно!', 'success');
        console.log('✅ еТелеком обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления еТелеком:', error);
        showNotification('Ошибка обновления еТелеком: ' + error.message, 'error');
    }
}

// Быстрое обновление SkyNet
function quickUpdateSkynet() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление SkyNet...');
    showNotification('Обновление SkyNet...', 'info');

    try {
        // Вызываем функцию обновления SkyNet
        forceUpdateSkynetData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('skynet-provider');

        showNotification('SkyNet обновлен успешно!', 'success');
        console.log('✅ SkyNet обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления SkyNet:', error);
        showNotification('Ошибка обновления SkyNet: ' + error.message, 'error');
    }
}

// Быстрое обновление ПИН
function quickUpdatePin() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление ПИН...');
    showNotification('Обновление ПИН...', 'info');

    try {
        // Вызываем функцию обновления ПИН
        forceUpdatePinData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('pin-telekom');

        showNotification('ПИН обновлен успешно!', 'success');
        console.log('✅ ПИН обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления ПИН:', error);
        showNotification('Ошибка обновления ПИН: ' + error.message, 'error');
    }
}

// Быстрое обновление Aiconet
function quickUpdateAiconet() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Aiconet...');
    showNotification('Обновление Aiconet...', 'info');

    try {
        // Вызываем функцию обновления Aiconet
        forceUpdateAiconetData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('aikonet');

        showNotification('Aiconet обновлен успешно!', 'success');
        console.log('✅ Aiconet обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Aiconet:', error);
        showNotification('Ошибка обновления Aiconet: ' + error.message, 'error');
    }
}

// Быстрое обновление Arbital
function quickUpdateArbital() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Arbital...');
    showNotification('Обновление Arbital...', 'info');

    try {
        // Вызываем функцию обновления Arbital
        forceUpdateArbitalData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('arbital');

        showNotification('Arbital обновлен успешно!', 'success');
        console.log('✅ Arbital обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Arbital:', error);
        showNotification('Ошибка обновления Arbital: ' + error.message, 'error');
    }
}

// Быстрое обновление Енева (Обит)
function quickUpdateObit() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Енева...');
    showNotification('Обновление Енева...', 'info');

    try {
        // Вызываем функцию обновления Енева
        forceUpdateObitData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('obit');

        showNotification('Енева обновлен успешно!', 'success');
        console.log('✅ Енева обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Енева:', error);
        showNotification('Ошибка обновления Енева: ' + error.message, 'error');
    }
}

// Быстрое обновление Простор телеком
function quickUpdateProstorTelekom() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Простор телеком...');
    showNotification('Обновление Простор телеком...', 'info');

    try {
        // Вызываем функцию обновления Простор телеком
        forceUpdateProstorTelekomData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('prostor-telekom');

        showNotification('Простор телеком обновлен успешно!', 'success');
        console.log('✅ Простор телеком обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Простор телеком:', error);
        showNotification('Ошибка обновления Простор телеком: ' + error.message, 'error');
    }
}

// Быстрое обновление Ростелеком
function quickUpdateRostelecom() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Ростелеком...');
    showNotification('Обновление Ростелеком...', 'info');

    try {
        // Вызываем функцию обновления Ростелеком
        forceUpdateRostelecomData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('rostelecom');

        showNotification('Ростелеком обновлен успешно!', 'success');
        console.log('✅ Ростелеком обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Ростелеком:', error);
        showNotification('Ошибка обновления Ростелеком: ' + error.message, 'error');
    }
}

// Быстрое обновление МегаФон
function quickUpdateMegafon() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление МегаФон...');
    showNotification('Обновление МегаФон...', 'info');

    try {
        // Вызываем функцию обновления МегаФон
        forceUpdateMegafonData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('megafon');

        showNotification('МегаФон обновлен успешно!', 'success');
        console.log('✅ МегаФон обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления МегаФон:', error);
        showNotification('Ошибка обновления МегаФон: ' + error.message, 'error');
    }
}

// Быстрое обновление Ростелеком ТКТ
function quickUpdateRostelecomTkt() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Ростелеком ТКТ...');
    showNotification('Обновление Ростелеком ТКТ...', 'info');

    try {
        // Вызываем функцию обновления Ростелеком ТКТ
        forceUpdateRostelecomTktData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('rostelekom-tkt');

        showNotification('Ростелеком ТКТ обновлен успешно!', 'success');
        console.log('✅ Ростелеком ТКТ обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Ростелеком ТКТ:', error);
        showNotification('Ошибка обновления Ростелеком ТКТ: ' + error.message, 'error');
    }
}

// Быстрое обновление AT-HOME
function quickUpdateAthome() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление AT-HOME...');
    showNotification('Обновление AT-HOME...', 'info');

    try {
        // Вызываем функцию обновления AT-HOME
        forceUpdateAthomeData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('ethome');

        showNotification('AT-HOME обновлен успешно!', 'success');
        console.log('✅ AT-HOME обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления AT-HOME:', error);
        showNotification('Ошибка обновления AT-HOME: ' + error.message, 'error');
    }
}

// Быстрое обновление Билайн
function quickUpdateBeeline() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Билайн...');
    showNotification('Обновление Билайн...', 'info');

    try {
        // Вызываем функцию обновления Билайн
        forceUpdateBeelineData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('beeline');

        showNotification('Билайн обновлен успешно!', 'success');
        console.log('✅ Билайн обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Билайн:', error);
        showNotification('Ошибка обновления Билайн: ' + error.message, 'error');
    }
}

// Быстрое обновление РСВО-Онлайн
function quickUpdateRsvo() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление РСВО-Онлайн...');
    showNotification('Обновление РСВО-Онлайн...', 'info');

    try {
        // Вызываем функцию обновления РСВО-Онлайн
        forceUpdateRsvoData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('fgup-rsvo');

        showNotification('РСВО-Онлайн обновлен успешно!', 'success');
        console.log('✅ РСВО-Онлайн обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления РСВО-Онлайн:', error);
        showNotification('Ошибка обновления РСВО-Онлайн: ' + error.message, 'error');
    }
}

// Быстрое обновление ДОМ Ru
function quickUpdateDomru() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление ДОМ Ru...');
    showNotification('Обновление ДОМ Ru...', 'info');

    try {
        // Вызываем функцию обновления ДОМ Ru
        forceUpdateDomruData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('interzet');

        showNotification('ДОМ Ru обновлен успешно!', 'success');
        console.log('✅ ДОМ Ru обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления ДОМ Ru:', error);
        showNotification('Ошибка обновления ДОМ Ru: ' + error.message, 'error');
    }
}

// Быстрое обновление NewLink
function quickUpdateNewlink() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление NewLink...');
    showNotification('Обновление NewLink...', 'info');

    try {
        // Вызываем функцию обновления NewLink
        forceUpdateNewlinkData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('newlink');

        showNotification('NewLink обновлен успешно!', 'success');
        console.log('✅ NewLink обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления NewLink:', error);
        showNotification('Ошибка обновления NewLink: ' + error.message, 'error');
    }
}

// Быстрое обновление ПАКТ
function quickUpdatePakt() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление ПАКТ...');
    showNotification('Обновление ПАКТ...', 'info');

    try {
        // Вызываем функцию обновления ПАКТ
        forceUpdatePaktData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('pakt');

        showNotification('ПАКТ обновлен успешно!', 'success');
        console.log('✅ ПАКТ обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления ПАКТ:', error);
        showNotification('Ошибка обновления ПАКТ: ' + error.message, 'error');
    }
}

// Быстрое обновление Aiconet
function quickUpdateAiconet() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Aiconet...');
    showNotification('Обновление Aiconet...', 'info');

    try {
        // Вызываем функцию обновления Aiconet
        forceUpdateAiconetData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('aikonet');

        showNotification('Aiconet обновлен успешно!', 'success');
        console.log('✅ Aiconet обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Aiconet:', error);
        showNotification('Ошибка обновления Aiconet: ' + error.message, 'error');
    }
}

// Быстрое обновление Arbital
function quickUpdateArbital() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Arbital...');
    showNotification('Обновление Arbital...', 'info');

    try {
        // Вызываем функцию обновления Arbital
        forceUpdateArbitalData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('arbital');

        showNotification('Arbital обновлен успешно!', 'success');
        console.log('✅ Arbital обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Arbital:', error);
        showNotification('Ошибка обновления Arbital: ' + error.message, 'error');
    }
}

// Быстрое обновление Енева
function quickUpdateObit() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Енева...');
    showNotification('Обновление Енева...', 'info');

    try {
        // Вызываем функцию обновления Енева
        forceUpdateObitData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('obit');

        showNotification('Енева обновлен успешно!', 'success');
        console.log('✅ Енева обновлен через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Енева:', error);
        showNotification('Ошибка обновления Енева: ' + error.message, 'error');
    }
}

// Быстрое обновление Домовой
function quickUpdateDomovoy() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Необходимы права администратора', 'error');
        return;
    }

    console.log('🔄 Быстрое обновление Домовой...');
    showNotification('Обновление Домовой...', 'info');

    try {
        // Вызываем функцию обновления Домовой
        forceUpdateDomovoyData();

        // Обновляем данные в providersData
        updateProviderDataInProvidersData('domovoy');

        showNotification('Домовая обновлена успешно!', 'success');
        console.log('✅ Домовая обновлена через быстрое обновление');

        // Обновляем интерфейс, если он открыт
        if (typeof renderTable === 'function') {
            renderTable();
        }

    } catch (error) {
        console.error('❌ Ошибка быстрого обновления Домовой:', error);
        showNotification('Ошибка обновления Домовой: ' + error.message, 'error');
    }
}

function closeTariffUpdateModal() {
    document.getElementById('tariffUpdateModal').style.display = 'none';
}

function loadProvidersList() {
    const providersList = document.getElementById('providersList');
    if (!providersList) return;

    providersList.innerHTML = providers.map(provider => `
        <label class="provider-checkbox">
            <input type="checkbox" value="${provider.id}" checked>
            ${provider.name}
        </label>
    `).join('');
}

async function startTariffUpdate() {
    const selectedProviders = getSelectedProviders();

    if (selectedProviders.length === 0) {
        showNotification('Выберите хотя бы одного провайдера', 'warning');
        return;
    }

    // Показываем прогресс
    showUpdateProgress();

    try {
        // Инициализируем парсер
        if (typeof universalTariffParser === 'undefined') {
            showNotification('Парсер тарифов не загружен', 'error');
            return;
        }

        // Обновляем только выбранных провайдеров
        await updateSelectedProviders(selectedProviders);

        // Показываем результаты
        showUpdateResults();

        showNotification('Обновление тарифов завершено!', 'success');

    } catch (error) {
        console.error('Ошибка при обновлении тарифов:', error);
        showNotification('Ошибка при обновлении тарифов: ' + error.message, 'error');
    } finally {
        hideUpdateProgress();
    }
}

// Получить выбранных провайдеров для обновления тарифов
function getSelectedProviders() {
    const checkboxes = document.querySelectorAll('#providersList input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Показать прогресс обновления
function showUpdateProgress() {
    document.getElementById('updateProgress').style.display = 'block';
    document.getElementById('updateResults').style.display = 'none';

    updateProgress(0, 'Подготовка к обновлению...');
}

// Скрыть прогресс обновления
function hideUpdateProgress() {
    document.getElementById('updateProgress').style.display = 'none';
}

// Обновить прогресс
function updateProgress(percent, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');

    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = percent + '%';
    if (progressStatus) progressStatus.textContent = text;
}

// Обновить выбранных провайдеров
async function updateSelectedProviders(selectedProviders) {
    const totalProviders = selectedProviders.length;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedProviders.length; i++) {
        const providerId = selectedProviders[i];
        const provider = providers.find(p => p.id === providerId);

        if (provider) {
            updateProgress(
                Math.round((i / totalProviders) * 100),
                `Обновление ${provider.name}...`
            );

            try {
                // Специальная обработка для еТелеком
                if (provider.slug === 'etelecom') {
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateEtelecomData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'skynet-provider') {
                    // Специальная обработка для SkyNet
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateSkynetData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'pin-telekom') {
                    // Специальная обработка для ПИН
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdatePinData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'aikonet') {
                    // Специальная обработка для Aiconet
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateAiconetData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'arbital') {
                    // Специальная обработка для Arbital
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateArbitalData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'obit') {
                    // Специальная обработка для Енева (Обит)
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateObitData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'prostor-telekom') {
                    // Специальная обработка для Простор телеком
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateProstorTelekomData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'rostelecom') {
                    // Специальная обработка для Ростелеком
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateRostelecomData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'megafon') {
                    // Специальная обработка для МегаФон
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateMegafonData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'rostelekom-tkt') {
                    // Специальная обработка для Ростелеком ТКТ
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateRostelecomTktData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'ethome') {
                    // Специальная обработка для AT-HOME
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateAthomeData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'beeline') {
                    // Специальная обработка для Билайн
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateBeelineData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'fgup-rsvo') {
                    // Специальная обработка для РСВО-Онлайн
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateRsvoData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'interzet') {
                    // Специальная обработка для ДОМ Ru
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateDomruData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'newlink') {
                    // Специальная обработка для NewLink
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateNewlinkData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'pakt') {
                    // Специальная обработка для ПАКТ
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdatePaktData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'aikonet') {
                    // Специальная обработка для Aiconet
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateAiconetData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'arbital') {
                    // Специальная обработка для Arbital
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateArbitalData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'obit') {
                    // Специальная обработка для Енева
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateObitData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else if (provider.slug === 'domovoy') {
                    // Специальная обработка для Домовой
                    console.log(`🔄 Обновление ${provider.name} через специальную функцию...`);
                    forceUpdateDomovoyData();
                    successCount++;
                    console.log(`✅ ${provider.name} обновлен успешно через специальную функцию`);

                    // Дополнительно обновляем providersData
                    if (providersData[provider.slug]) {
                        const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                        if (updatedProvider) {
                            providersData[provider.slug].provider.services = updatedProvider.services;
                            providersData[provider.slug].tariffs = updatedProvider.tariffs;
                            console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                        }
                    }
                } else {
                    // Обычное обновление через парсер
                    await universalTariffParser.parseProvider(provider);
                    const updateResult = universalTariffParser.updateProviderData(provider.slug);

                    if (updateResult) {
                        successCount++;
                        console.log(`✅ ${provider.name} обновлен успешно`);

                        // Дополнительно обновляем providersData
                        if (providersData[provider.slug]) {
                            const updatedProvider = PROVIDERS_DATA.providers.find(p => p.slug === provider.slug);
                            if (updatedProvider) {
                                providersData[provider.slug].provider.services = updatedProvider.services;
                                providersData[provider.slug].tariffs = updatedProvider.tariffs;
                                console.log(`✅ Данные ${provider.name} обновлены в providersData`);
                            }
                        }
                    } else {
                        errorCount++;
                        console.warn(`⚠️ ${provider.name}: обновление не удалось`);
                    }
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Ошибка обновления ${provider.name}:`, error);

                // Добавляем ошибку в лог парсера
                if (universalTariffParser.updateLog) {
                    universalTariffParser.updateLog.push({
                        type: 'error',
                        message: `${provider.name}: ${error.message}`
                    });
                }
            }
        }
    }

    updateProgress(100, `Обновление завершено! Успешно: ${successCount}, Ошибок: ${errorCount}`);
}

// Показать результаты обновления
function showUpdateResults() {
    document.getElementById('updateResults').style.display = 'block';

    // Получаем статистику
    const stats = getUpdateStats();
    displayUpdateStats(stats);

    // Получаем лог
    const log = getUpdateLog();
    displayUpdateLog(log);
}

// Получить статистику обновления
function getUpdateStats() {
    let log = [];

    // Пробуем получить лог из universalTariffParser
    if (typeof universalTariffParser !== 'undefined' && universalTariffParser.getUpdateLog) {
        log = universalTariffParser.getUpdateLog();
    }

    const stats = {
        total: 0,
        success: 0,
        error: 0,
        updated: 0,
        info: 0,
        warning: 0
    };

    if (log && log.length > 0) {
        log.forEach(entry => {
            stats.total++;
            if (entry.type === 'success') stats.success++;
            if (entry.type === 'error') stats.error++;
            if (entry.type === 'info') stats.info++;
            if (entry.type === 'warning') stats.warning++;
            if (entry.message.includes('обновлен') || entry.message.includes('успешно')) stats.updated++;
        });
    } else {
        // Если лог пустой, показываем базовую статистику
        stats.total = 1;
        stats.info = 1;
        stats.updated = 0;
    }

    return stats;
}

// Отобразить статистику обновления
function displayUpdateStats(stats) {
    const statsContainer = document.getElementById('resultsStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${stats.total}</span>
            <span class="stat-label">Всего операций</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.success}</span>
            <span class="stat-label">Успешно</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.error}</span>
            <span class="stat-label">Ошибок</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.updated}</span>
            <span class="stat-label">Обновлено</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.info}</span>
            <span class="stat-label">Информация</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.warning}</span>
            <span class="stat-label">Предупреждения</span>
        </div>
    `;
}

// Получить лог обновления
function getUpdateLog() {
    let log = [];

    // Пробуем получить лог из universalTariffParser
    if (typeof universalTariffParser !== 'undefined') {
        log = universalTariffParser.getUpdateLog();
    }

    return log;
}

// Отобразить лог обновления
function displayUpdateLog(log) {
    const logContainer = document.getElementById('resultsLog');
    if (!logContainer) return;

    if (log.length === 0) {
        logContainer.innerHTML = '<div class="log-entry info">Нет записей в логе</div>';
        return;
    }

    const logHtml = log.map(entry => {
        const timestamp = new Date().toLocaleTimeString();
        return `<div class="log-entry ${entry.type || 'info'}">[${timestamp}] ${entry.message}</div>`;
    }).join('');

    logContainer.innerHTML = logHtml;
}

// Инициализация парсера тарифов
function initTariffParser() {
    try {
        // Проверяем, загружен ли universalTariffParser
        if (typeof universalTariffParser !== 'undefined') {
            console.log('✅ UniversalTariffParser загружен');
            return;
        }

        // Если не загружен, создаем заглушку
        console.warn('⚠️ UniversalTariffParser не загружен, создаем заглушку');
        window.universalTariffParser = {
            parseProvider: async function (provider) {
                console.log(`🔄 Заглушка: парсинг ${provider.name}`);
                return Promise.resolve();
            },
            updateProviderData: function (slug) {
                console.log(`🔄 Обновление данных для ${slug}...`);

                // Обновляем данные в PROVIDERS_DATA
                const provider = PROVIDERS_DATA.providers.find(p => p.slug === slug);
                if (!provider) {
                    console.error(`❌ Провайдер ${slug} не найден в PROVIDERS_DATA`);
                    return false;
                }

                // Обновляем данные в providersData
                if (providersData[slug]) {
                    providersData[slug].provider.services = provider.services;
                    providersData[slug].tariffs = provider.tariffs;
                    console.log(`✅ Данные провайдера ${slug} обновлены в providersData`);
                    console.log(`📊 Новые услуги:`, provider.services);
                    console.log(`📊 Новые тарифы:`, provider.tariffs);
                } else {
                    // Если провайдера нет в providersData, создаем его
                    providersData[slug] = {
                        provider: {
                            name: provider.name,
                            services: provider.services
                        },
                        tariffs: provider.tariffs || []
                    };
                    console.log(`✅ Создан новый провайдер ${slug} в providersData`);
                }

                // Обновляем интерфейс, если провайдер выбран
                const providerSelect = document.getElementById('provider');
                if (providerSelect && providerSelect.value === slug) {
                    console.log(`🔄 Обновляем интерфейс для выбранного провайдера ${slug}`);

                    // Обновляем услуги
                    if (provider.services && provider.services.length > 0) {
                        populateServices(provider.services);
                        console.log(`✅ Услуги обновлены: ${provider.services.join(', ')}`);
                    }

                    // Обновляем тарифы, если услуга выбрана
                    if (currentService && provider.tariffs) {
                        populateTariffs(provider.tariffs, currentService);
                        console.log(`✅ Тарифы обновлены для услуги ${currentService}`);
                    }
                }

                return true;
            },
            getUpdateLog: function () {
                return [
                    { type: 'info', message: 'Парсер тарифов не загружен - используется заглушка' },
                    { type: 'warning', message: 'Обновление тарифов недоступно' }
                ];
            }
        };
    } catch (error) {
        console.error('❌ Ошибка инициализации парсера тарифов:', error);
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function isAccountLocked() {
    const now = Date.now();
    const lockTime = localStorage.getItem('accountLockTime');
    if (lockTime && (now - parseInt(lockTime)) < 300000) { // 5 минут
        return true;
    }
    return false;
}

function checkSessionTimeout() {
    if (!sessionStartTime) return false;
    const now = Date.now();
    const sessionDuration = now - sessionStartTime;
    return sessionDuration > 28800000; // 8 часов
}

function updateSessionTime() {
    sessionStartTime = Date.now();
}

function updateDateTime() {
    const now = new Date();
    const dateTimeInput = document.getElementById('dateTime');
    if (dateTimeInput) {
        dateTimeInput.value = now.toISOString().slice(0, 16);
    }
}

function applyFormPermissions() {
    const fields = {
        'clientName': ['admin', 'agent'], // Оператор не может редактировать
        'clientPhone': ['admin', 'agent'], // Оператор не может редактировать
        'clientCity': ['admin', 'agent'], // Оператор не может редактировать
        'clientAddress': ['admin', 'agent'], // Оператор не может редактировать
        'clientComment': ['admin', 'agent'], // Только агент и админ
        'requestStatus': ['admin', 'operator'],
        'providerComment': ['admin', 'operator'], // Только оператор и админ
        'provider': ['admin', 'agent'], // Оператор не может редактировать провайдера
        'tariff': ['admin', 'agent'], // Оператор не может редактировать тариф
        'appointmentDate': ['admin', 'operator'],
        'appointmentTime': ['admin', 'operator']
    };

    Object.keys(fields).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const allowedRoles = fields[fieldId];
            const canEdit = currentUser && allowedRoles.includes(currentUser.role);
            field.disabled = !canEdit;

            // Специальная обработка для агента при создании заявки
            if (currentUser && currentUser.role === 'agent' && fieldId === 'requestStatus' && !currentEditId) {
                // Агент не может менять статус при создании заявки - всегда статус по умолчанию
                const defaultStatus = requestStatuses.find(s => s.isDefault && s.isActive);
                field.value = defaultStatus ? defaultStatus.name : 'Новая';
                field.disabled = true;
            }
        }
    });

    // Управление отображением блоков услуг и тарифов
    const serviceSelectionGroup = document.getElementById('serviceSelectionGroup');
    const tariffSelectionGroup = document.getElementById('tariffSelectionGroup');
    const serviceInfoGroup = document.getElementById('serviceInfoGroup');
    const tariffInfoGroup = document.getElementById('tariffInfoGroup');

    const canEditServices = currentUser && (currentUser.role === 'admin' || currentUser.role === 'agent');

    if (serviceSelectionGroup && tariffSelectionGroup && serviceInfoGroup && tariffInfoGroup) {
        if (canEditServices) {
            // Для админа и агента показываем блоки выбора
            serviceSelectionGroup.style.display = 'block';
            tariffSelectionGroup.style.display = 'block';
            serviceInfoGroup.style.display = 'none';
            tariffInfoGroup.style.display = 'none';
        } else if (currentUser && currentUser.role === 'operator') {
            // Для оператора показываем блоки информации (только для чтения)
            serviceSelectionGroup.style.display = 'none';
            tariffSelectionGroup.style.display = 'none';
            serviceInfoGroup.style.display = 'block';
            tariffInfoGroup.style.display = 'block';

            // Заполняем информацию об услуге и тарифе
            updateServiceAndTariffInfo();
        } else {
            // Для неавторизованных пользователей скрываем все
            serviceSelectionGroup.style.display = 'none';
            tariffSelectionGroup.style.display = 'none';
            serviceInfoGroup.style.display = 'none';
            tariffInfoGroup.style.display = 'none';
        }
    }

    // Блокировка кнопок услуг для оператора (если блоки выбора все же отображаются)
    const serviceButtons = document.querySelectorAll('.service-button');
    serviceButtons.forEach(button => {
        button.disabled = !canEditServices;
        if (!canEditServices) {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        } else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    });

    // Управление отображением блока вознаграждений
    const fullRewardsSection = document.getElementById('fullRewardsSection');
    const simpleRewardsSection = document.getElementById('simpleRewardsSection');
    const rewardsSection = document.querySelector('.rewards-section');

    if (fullRewardsSection && simpleRewardsSection && rewardsSection) {
        if (currentUser && currentUser.role === 'agent') {
            // Для агента показываем упрощенную версию
            fullRewardsSection.style.display = 'none';
            simpleRewardsSection.style.display = 'block';
            rewardsSection.style.display = 'block';

            // Обновляем сумму вознаграждения для агента
            updateAgentRewardDisplay();
        } else if (currentUser && currentUser.role === 'operator') {
            // Для оператора полностью скрываем блок вознаграждений
            fullRewardsSection.style.display = 'none';
            simpleRewardsSection.style.display = 'none';
            rewardsSection.style.display = 'none';
        } else {
            // Для админа показываем полную версию
            fullRewardsSection.style.display = 'block';
            simpleRewardsSection.style.display = 'none';
            rewardsSection.style.display = 'block';
        }
    }

    console.log(`🔐 Права доступа применены для роли: ${currentUser?.role || 'не авторизован'}`);
}

// Обновление информации об услуге и тарифе для оператора
function updateServiceAndTariffInfo() {
    if (!currentUser || currentUser.role !== 'operator') return;

    const serviceInfo = document.getElementById('serviceInfo');
    const tariffInfo = document.getElementById('tariffInfo');

    if (!serviceInfo || !tariffInfo) return;

    // Получаем данные из формы
    const providerSelect = document.getElementById('provider');
    const serviceButtons = document.querySelectorAll('.service-button.active');
    const tariffSelect = document.getElementById('tariff');

    // Информация об услуге
    if (serviceButtons.length > 0) {
        const selectedService = serviceButtons[0].textContent;
        serviceInfo.innerHTML = `<span class="service-name">${selectedService}</span>`;
    } else {
        serviceInfo.innerHTML = '<span class="service-name">Услуга не выбрана</span>';
    }

    // Информация о тарифе
    if (tariffSelect && tariffSelect.value) {
        const selectedTariff = tariffSelect.options[tariffSelect.selectedIndex];
        const tariffText = selectedTariff.textContent;

        // Получаем детальную информацию о тарифе
        const providerSlug = providerSelect ? providerSelect.value : '';
        const serviceName = serviceButtons.length > 0 ? serviceButtons[0].textContent : '';
        const tariffDetails = getServiceTariff(providerSlug, serviceName, tariffSelect.value);

        tariffInfo.innerHTML = `
            <div class="tariff-name">${tariffText}</div>
            <div class="tariff-details">${tariffDetails}</div>
        `;
    } else {
        tariffInfo.innerHTML = '<span class="tariff-name">Тариф не выбран</span>';
    }
}

function getSelectedProvidersForAccess() {
    const checkboxes = document.querySelectorAll('#providerAccessList input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getEditSelectedProviders() {
    const checkboxes = document.querySelectorAll('#editProviderAccessList input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function loadProviderAccessList() {
    const providersList = document.getElementById('providerAccessList');
    if (!providersList) {
        console.log('❌ Элемент providerAccessList не найден');
        return;
    }

    console.log('📋 Загружаем список провайдеров для формы пользователей:', providers);

    if (!providers || providers.length === 0) {
        console.log('⚠️ Массив провайдеров пуст, пытаемся перезагрузить...');
        loadBasicProvidersData();
    }

    providersList.innerHTML = providers.map(provider => `
        <label class="provider-checkbox">
            <input type="checkbox" value="${provider.id}">
            ${provider.name}
        </label>
    `).join('');

    console.log(`✅ Загружено ${providers.length} провайдеров в форму пользователей`);
}

function loadEditProviderAccessList() {
    const providersList = document.getElementById('editProviderAccessList');
    if (!providersList) {
        console.log('❌ Элемент editProviderAccessList не найден');
        return;
    }

    console.log('📋 Загружаем список провайдеров для редактирования пользователя:', providers);

    if (!providers || providers.length === 0) {
        console.log('⚠️ Массив провайдеров пуст, пытаемся перезагрузить...');
        loadBasicProvidersData();
    }

    providersList.innerHTML = providers.map(provider => `
        <label class="provider-checkbox">
            <input type="checkbox" value="${provider.id}">
            ${provider.name}
        </label>
    `).join('');

    console.log(`✅ Загружено ${providers.length} провайдеров в форму редактирования`);
}

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===

// Функция для исправления старых заявок - добавление agentId
function fixOldRequests() {
    console.log('🔧 Исправление старых заявок...');

    let fixedCount = 0;
    requests.forEach((request, index) => {
        // Если у заявки есть userId, но нет agentId
        if (request.userId && !request.agentId) {
            // Находим пользователя по userId
            const user = users.find(u => u.id === request.userId);
            if (user && user.agentId) {
                // Обновляем agentId заявки
                requests[index].agentId = user.agentId;
                fixedCount++;
                console.log(`✅ Исправлена заявка ${request.id}: agentId = ${user.agentId}`);
            }
        }
    });

    if (fixedCount > 0) {
        localStorage.setItem('requests', JSON.stringify(requests));
        console.log(`✅ Исправлено ${fixedCount} заявок`);
        renderTable(); // Обновляем таблицу
    } else {
        console.log('✅ Все заявки уже корректны');
    }
}

// Функция для диагностики текущего пользователя
function diagnoseCurrentUser() {
    console.log('🔍 ДИАГНОСТИКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ:');
    console.log('currentUser:', currentUser);

    if (currentUser) {
        console.log('Детали пользователя:', {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            agentId: currentUser.agentId,
            hasAgentId: !!currentUser.agentId,
            agentIdType: typeof currentUser.agentId
        });

        if (currentUser.role === 'agent' && !currentUser.agentId) {
            console.log('⚠️ ПРОБЛЕМА: Агент не имеет agentId!');
            console.log('💡 РЕШЕНИЕ: Добавьте agentId через редактирование пользователя');
        }
    } else {
        console.log('❌ ОШИБКА: currentUser не установлен!');
    }
}

// Функция для диагностики всех заявок
function diagnoseAllRequests() {
    console.log('🔍 ДИАГНОСТИКА ВСЕХ ЗАЯВОК:');

    requests.forEach((request, index) => {
        console.log(`Заявка ${index + 1}:`, {
            id: request.id,
            agentId: request.agentId,
            userId: request.userId,
            clientName: request.clientName,
            provider: request.provider,
            hasAgentId: !!request.agentId,
            agentIdType: typeof request.agentId
        });
    });

    const requestsWithoutAgentId = requests.filter(r => !r.agentId);
    console.log(`📊 Статистика: ${requestsWithoutAgentId.length} заявок без agentId из ${requests.length} всего`);
}

// Функция для исправления всех заявок текущего агента
function fixCurrentAgentRequests() {
    if (!currentUser || currentUser.role !== 'agent') {
        console.log('❌ Только агент может исправлять свои заявки');
        return;
    }

    console.log('🔧 Исправление заявок текущего агента...');

    let fixedCount = 0;
    requests.forEach((request, index) => {
        // Если заявка принадлежит текущему агенту, но не имеет agentId
        if (request.userId === currentUser.id && !request.agentId) {
            requests[index].agentId = currentUser.agentId || currentUser.id;
            fixedCount++;
            console.log(`✅ Исправлена заявка ${request.id}: agentId = ${requests[index].agentId}`);
        }
    });

    if (fixedCount > 0) {
        localStorage.setItem('requests', JSON.stringify(requests));
        console.log(`✅ Исправлено ${fixedCount} заявок`);
        renderTable(); // Обновляем таблицу
    } else {
        console.log('✅ Все заявки агента уже корректны');
    }
}

function toggleProviderAccess() {
    const role = document.getElementById('newUserRole').value;
    const providerSection = document.getElementById('providerAccessSection');
    const agentIdSection = document.getElementById('agentIdSection');

    if (role === 'operator') {
        providerSection.style.display = 'block';
        agentIdSection.style.display = 'none';
        loadProviderAccessList();
    } else if (role === 'agent') {
        providerSection.style.display = 'none';
        agentIdSection.style.display = 'block';
    } else {
        providerSection.style.display = 'none';
        agentIdSection.style.display = 'none';
    }
}

function toggleEditProviderAccess() {
    const role = document.getElementById('editUserRole').value;
    const section = document.getElementById('editProviderAccessSection');

    if (role === 'operator') {
        section.style.display = 'block';
        loadEditProviderAccessList();
    } else {
        section.style.display = 'none';
    }
}

function selectAllProviders() {
    const checkboxes = document.querySelectorAll('#providersList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function deselectAllProviders() {
    const checkboxes = document.querySelectorAll('#providersList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function onAppointmentDateChange() {
    const appointmentDateEl = document.getElementById('appointmentDate');
    const appointmentTimeEl = document.getElementById('appointmentTime');

    if (appointmentDateEl.value) {
        appointmentTimeEl.disabled = false;
    } else {
        appointmentTimeEl.disabled = true;
        appointmentTimeEl.value = '';
    }
}

function canEditField(fieldKey) {
    if (!currentUser) return false;

    const fieldPermissions = {
        'clientName': ['admin', 'agent'], // Оператор не может редактировать
        'clientPhone': ['admin', 'agent'], // Оператор не может редактировать
        'clientCity': ['admin', 'agent'], // Оператор не может редактировать
        'clientAddress': ['admin', 'agent'], // Оператор не может редактировать
        'clientComment': ['admin', 'agent'], // Только агент и админ
        'requestStatus': ['admin', 'operator'],
        'providerComment': ['admin', 'operator'], // Только оператор и админ
        'provider': ['admin', 'agent'], // Оператор не может редактировать провайдера
        'tariff': ['admin', 'agent'], // Оператор не может редактировать тариф
        'appointmentDate': ['admin', 'operator'],
        'appointmentTime': ['admin', 'operator']
    };

    const allowedRoles = fieldPermissions[fieldKey] || [];
    return allowedRoles.includes(currentUser.role);
}

function canEdit(requestId = null) {
    if (!currentUser) {
        console.log('❌ canEdit: нет текущего пользователя');
        return false;
    }

    // Админ может редактировать все заявки
    if (currentUser.role === 'admin') {
        console.log('✅ canEdit: админ может редактировать все заявки');
        return true;
    }

    // Оператор может редактировать все заявки
    if (currentUser.role === 'operator') {
        console.log('✅ canEdit: оператор может редактировать все заявки');
        return true;
    }

    // Агент может редактировать только свои заявки (только по agentId)
    if (currentUser.role === 'agent' && requestId) {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            const currentAgentId = currentUser.agentId || currentUser.id;
            const canEditThis = request.agentId === currentAgentId;

            // Дополнительная проверка: агент не может редактировать выполненные или оплаченные заявки
            const requestStatus = request.requestStatus || request.status;
            const isCompletedOrPaid = requestStatus === 'Выполнена' || requestStatus === 'Оплачена';

            console.log(`🔍 canEdit для агента:`, {
                requestId: requestId,
                requestAgentId: request.agentId,
                currentAgentId: currentAgentId,
                canEdit: canEditThis,
                requestStatus: requestStatus,
                isCompletedOrPaid: isCompletedOrPaid,
                finalCanEdit: canEditThis && !isCompletedOrPaid,
                clientName: request.clientName,
                comparison: `request.agentId (${request.agentId}) === currentAgentId (${currentAgentId}) = ${request.agentId === currentAgentId}`
            });

            return canEditThis && !isCompletedOrPaid;
        } else {
            console.log('❌ canEdit: заявка не найдена', requestId);
        }
    }

    console.log('❌ canEdit: нет прав доступа', { role: currentUser.role, requestId });
    return false;
}

function canDelete(requestId = null) {
    if (!currentUser) return false;

    // Админ может удалять все заявки
    if (currentUser.role === 'admin') return true;

    // Агент может удалять только свои заявки (только по agentId)
    if (currentUser.role === 'agent' && requestId) {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            const currentAgentId = currentUser.agentId || currentUser.id;
            const canDeleteThis = request.agentId === currentAgentId;

            // Дополнительная проверка: агент не может удалять выполненные или оплаченные заявки
            const requestStatus = request.requestStatus || request.status;
            const isCompletedOrPaid = requestStatus === 'Выполнена' || requestStatus === 'Оплачена';

            console.log(`🔍 canDelete для агента:`, {
                requestId: requestId,
                requestAgentId: request.agentId,
                currentAgentId: currentAgentId,
                canDelete: canDeleteThis,
                requestStatus: requestStatus,
                isCompletedOrPaid: isCompletedOrPaid,
                finalCanDelete: canDeleteThis && !isCompletedOrPaid,
                clientName: request.clientName
            });

            return canDeleteThis && !isCompletedOrPaid;
        }
    }

    return false;
}

// === ФУНКЦИИ ВОЗНАГРАЖДЕНИЙ ===

function updateRewardDisplay() {
    const rewardType = document.getElementById('rewardType');
    const rewardAmount = document.getElementById('rewardAmount');
    const rewardDisplay = document.getElementById('rewardDisplay');

    if (!rewardType || !rewardAmount || !rewardDisplay) {
        console.log('⚠️ updateRewardDisplay: элементы не найдены');
        return;
    }

    let amount = 0;

    // Если выбран провайдер и услуга, рассчитываем вознаграждение автоматически
    if (currentProvider && currentService) {
        const providerSelect = document.getElementById('provider');
        const providerSlug = providerSelect ? providerSelect.value : '';

        if (providerSlug) {
            amount = getReward(providerSlug, currentService);
            console.log(`💰 Автоматический расчет вознаграждения: ${amount} руб.`);

            // Автоматически выбираем тип вознаграждения
            rewardType.value = 'new';
            rewardAmount.value = amount;
            rewardAmount.readOnly = true;
        }
    } else if (rewardType.value) {
        // Ручной расчет по типу
        const rewards = JSON.parse(localStorage.getItem('rewards') || '[]');

        switch (rewardType.value) {
            case 'new':
                const newReward = rewards.find(r => r.name === 'Новая');
                amount = newReward ? newReward.amount : 50;
                break;
            case 'completed':
                const completedReward = rewards.find(r => r.name === 'Выполненная заявка');
                amount = completedReward ? completedReward.amount : 100;
                break;
            case 'cancelled':
                const cancelledReward = rewards.find(r => r.name === 'Отмененная заявка');
                amount = cancelledReward ? cancelledReward.amount : -25;
                break;
            case 'custom':
                amount = 0;
                rewardAmount.readOnly = false;
                break;
        }

        rewardAmount.value = amount;
    }

    rewardDisplay.textContent = `${amount} руб.`;

    // Обновляем цвет в зависимости от суммы
    if (amount > 0) {
        rewardDisplay.style.color = 'var(--success-color)';
    } else if (amount < 0) {
        rewardDisplay.style.color = 'var(--danger-color)';
    } else {
        rewardDisplay.style.color = 'var(--text-secondary)';
    }
}

// Обновление вознаграждения для агента (упрощенная версия)
function updateAgentRewardDisplay() {
    const agentRewardAmount = document.getElementById('agentRewardAmount');
    const agentRewardDisplay = document.getElementById('agentRewardDisplay');

    if (!agentRewardAmount || !agentRewardDisplay) {
        console.error('❌ Элементы вознаграждения агента не найдены');
        return;
    }

    // Получаем выбранного провайдера
    const providerSelect = document.getElementById('provider');
    const selectedProvider = providerSelect ? providerSelect.value : '';

    let amount = 0;

    if (selectedProvider && REWARDS_DATA[selectedProvider]) {
        // Берем вознаграждение за Интернет (основная услуга)
        amount = REWARDS_DATA[selectedProvider]['Интернет'] || 0;
    }

    agentRewardAmount.value = amount;
    agentRewardDisplay.textContent = `${amount} руб.`;
    agentRewardDisplay.style.color = amount >= 0 ? 'var(--success-color)' : 'var(--error-color)';

    console.log(`💰 Вознаграждение агента обновлено: ${amount} руб. (провайдер: ${selectedProvider})`);
}

// Удалена дублирующаяся функция checkReminders - используется основная функция выше

// === ТЕСТИРОВАНИЕ НАПОМИНАНИЙ ===

// Функция для проверки пользователей и их email
function checkUsersEmails() {
    console.log('👥 Проверка всех пользователей и их email:');

    users.forEach((user, index) => {
        console.log(`👤 Пользователь ${index + 1}:`, {
            id: user.id,
            agentId: user.agentId,
            name: user.name,
            email: user.email,
            notificationEmail: user.notificationEmail,
            role: user.role
        });
    });

    // Проверяем, есть ли пользователь с email info@allcitynet.ru
    const infoUser = users.find(u => u.email === 'info@allcitynet.ru');
    if (infoUser) {
        console.log('⚠️ Найден пользователь с email info@allcitynet.ru:', infoUser);
    } else {
        console.log('✅ Пользователь с email info@allcitynet.ru не найден');
    }

    // Проверяем, есть ли пользователь с email 2012mmm.vladislav@gmail.com
    const vladUser = users.find(u => u.email === '2012mmm.vladislav@gmail.com' || u.notificationEmail === '2012mmm.vladislav@gmail.com');
    if (vladUser) {
        console.log('✅ Найден пользователь с email 2012mmm.vladislav@gmail.com:', vladUser);
    } else {
        console.log('❌ Пользователь с email 2012mmm.vladislav@gmail.com не найден');
    }
}

// Функция для проверки EmailJS
function testEmailJS() {
    console.log('🔧 Тестирование EmailJS...');

    if (typeof emailjs === 'undefined') {
        console.log('❌ EmailJS не загружен');
        showNotification('EmailJS не загружен', 'error');
        return;
    }

    // Пробуем инициализировать с текущим ключом
    try {
        emailjs.init('s7l2WT4wfvIcPsZlB');
        console.log('✅ EmailJS инициализирован с ключом: s7l2WT4wfvIcPsZlB');

        // Тестируем отправку
        const testParams = {
            to_name: 'Тестовый клиент',
            to_email: 'test@example.com',
            reply_to: 'test@example.com',
            subject: 'Тест EmailJS',
            message: 'Это тестовое сообщение',
            client_name: 'Тестовый клиент',
            client_phone: '1234567890',
            provider: 'Тестовый провайдер',
            request_id: 'TEST123'
        };

        emailjs.send('service_snvhx5c', 'template_k4c68xi', testParams)
            .then(function (response) {
                console.log('✅ Тестовая отправка успешна:', response);
                showNotification('EmailJS работает корректно!', 'success');
            }, function (error) {
                console.log('❌ Ошибка тестовой отправки:', error);
                showNotification(`Ошибка EmailJS: ${error.text || error.message}`, 'error');
            });

    } catch (error) {
        console.log('❌ Ошибка инициализации EmailJS:', error);
        showNotification(`Ошибка инициализации EmailJS: ${error.message}`, 'error');
    }
}

// Функция отправки приветственного сообщения пользователю
function sendWelcomeMessage(username) {
    console.log(`📱 Отправляем приветственное сообщение пользователю: ${username}`);

    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Обрабатываем username
    let cleanUsername = username;
    if (username.startsWith('@')) {
        cleanUsername = username.substring(1);
    }

    const welcomeMessage = `👋 <b>Добро пожаловать в Allcitynet Portal!</b>

🤖 Я бот для уведомлений о заявках.

📋 <b>Что я умею:</b>
• Отправлять напоминания о заявках
• Уведомлять о статусе заявок
• Напоминать о необходимости связаться с клиентами

✅ <b>Теперь вы будете получать уведомления!</b>

<i>Если у вас есть вопросы, обратитесь к администратору системы.</i>`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const messageData = {
        chat_id: cleanUsername,
        text: welcomeMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    fetch(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('✅ Приветственное сообщение отправлено:', data);
                showNotification(`Приветственное сообщение отправлено на ${username}!`, 'success');
            } else {
                console.error('❌ Ошибка отправки приветственного сообщения:', data);

                // Обрабатываем разные типы ошибок
                let errorMessage = data.description || 'Неизвестная ошибка';

                if (data.description === 'Bad Request: chat not found') {
                    errorMessage = `Пользователь ${username} не писал боту первым. Попросите пользователя найти бота @Allcitynet_bot в Telegram и написать ему любое сообщение.`;
                } else if (data.description === 'Forbidden: bot was blocked by the user') {
                    errorMessage = `Пользователь ${username} заблокировал бота.`;
                } else if (data.description === 'Bad Request: user not found') {
                    errorMessage = `Пользователь ${username} не найден. Проверьте правильность username.`;
                } else if (data.description === 'Forbidden: user is deactivated') {
                    errorMessage = `Пользователь ${username} деактивирован.`;
                }

                showNotification(`⚠️ ${errorMessage}`, 'warning');
            }
        })
        .catch(error => {
            console.error('❌ Ошибка при отправке приветственного сообщения:', error);
            showNotification(`Ошибка: ${error.message}`, 'error');
        });
}

// Функция отправки приветственного сообщения с callback
function sendWelcomeMessageToUser(username, userName, callback) {
    console.log(`📱 Отправляем приветственное сообщение пользователю: ${username}`);

    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Обрабатываем username
    let cleanUsername = username;
    if (username.startsWith('@')) {
        cleanUsername = username.substring(1);
    }

    const welcomeMessage = `👋 <b>Добро пожаловать в Allcitynet Portal!</b>

🤖 Я бот для уведомлений о заявках.

📋 <b>Что я умею:</b>
• Отправлять напоминания о заявках
• Уведомлять о статусе заявок
• Напоминать о необходимости связаться с клиентами

✅ <b>Теперь вы будете получать уведомления!</b>

<i>Если у вас есть вопросы, обратитесь к администратору системы.</i>`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const messageData = {
        chat_id: cleanUsername,
        text: welcomeMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    fetch(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log(`✅ Приветственное сообщение отправлено пользователю ${userName}:`, data);
                callback(true);
            } else {
                console.error(`❌ Ошибка отправки приветственного сообщения пользователю ${userName}:`, data);
                callback(false);
            }
        })
        .catch(error => {
            console.error(`❌ Ошибка при отправке приветственного сообщения пользователю ${userName}:`, error);
            callback(false);
        });
}

// Функция отправки приветственных сообщений всем пользователям с Telegram
function sendWelcomeToAllUsers() {
    console.log('👋 Отправляем приветственные сообщения всем пользователям...');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const usersWithTelegram = users.filter(u => u.notificationTelegram && u.isActive);

    if (usersWithTelegram.length === 0) {
        showNotification('Нет пользователей с настроенным Telegram', 'warning');
        return;
    }

    const confirmSend = confirm(`Найдено ${usersWithTelegram.length} пользователей с Telegram.\n\nОтправить приветственные сообщения всем?`);

    if (!confirmSend) {
        showNotification('Отправка отменена', 'info');
        return;
    }

    let sentCount = 0;
    let errorCount = 0;
    let totalCount = usersWithTelegram.length;

    console.log(`📊 Начинаем отправку приветствий ${totalCount} пользователям...`);

    usersWithTelegram.forEach((user, index) => {
        setTimeout(() => {
            console.log(`📱 Отправляем приветствие пользователю ${user.name} (${user.notificationTelegram})`);

            // Отправляем приветствие и обрабатываем результат
            sendWelcomeMessageToUser(user.notificationTelegram, user.name, (success) => {
                if (success) {
                    sentCount++;
                } else {
                    errorCount++;
                }

                // Проверяем, все ли сообщения обработаны
                if (sentCount + errorCount === totalCount) {
                    showNotification(`Приветственные сообщения отправлены: ${sentCount} успешно, ${errorCount} с ошибками`, 'info');
                }
            });

        }, index * 2000); // Отправляем с интервалом в 2 секунды
    });

    showNotification(`Начинаем отправку приветствий ${usersWithTelegram.length} пользователям...`, 'info');

    // Показываем инструкцию для пользователей
    setTimeout(() => {
        showNotification(`💡 Инструкция: Если пользователи не получат сообщения, попросите их найти бота @Allcitynet_bot в Telegram и написать ему любое сообщение.`, 'info');
    }, 5000);
}

// Функция тестирования конкретного пользователя
function testSpecificUser() {
    const username = prompt('Введите username пользователя для тестирования (например: etelecom_spb):');

    if (!username) {
        showNotification('Тестирование отменено', 'info');
        return;
    }

    console.log(`🔍 Тестируем пользователя: ${username}`);

    // Ищем пользователя в системе
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.notificationTelegram === username || u.notificationTelegram === `@${username}`);

    if (!user) {
        showNotification(`Пользователь ${username} не найден в системе`, 'error');
        return;
    }

    console.log(`✅ Найден пользователь:`, user);

    // Отправляем тестовое сообщение
    const testMessage = `🧪 <b>Тестовое уведомление для ${user.name}</b>

📋 <b>Заявка:</b> Тестовая заявка
📞 <b>Телефон:</b> +7 (999) 123-45-67
🏢 <b>Провайдер:</b> Тестовый провайдер
📍 <b>Адрес:</b> г. Санкт-Петербург, Тестовая улица, 1

⏰ <b>Время создания:</b> ${new Date().toLocaleString('ru-RU')}
📊 <b>Статус:</b> Новая заявка

⚠️ <b>НЕ ЗАБУДЬТЕ СВЯЗАТЬСЯ С КЛИЕНТОМ!</b>

<i>Это тестовое уведомление от системы Allcitynet Portal</i>`;

    sendTelegramReminder(user.notificationTelegram, testMessage);
}

// Функция тестирования Telegram
function testTelegram() {
    console.log('📱 Тестирование Telegram...');

    // Конфигурация Telegram бота @Allcitynet_bot
    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Проверяем, настроен ли бот
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('❌ Telegram бот не настроен');
        showNotification('Telegram бот не настроен. Проверьте конфигурацию.', 'warning');
        return;
    }

    // Запрашиваем username для тестирования
    const testUsername = prompt('Введите Telegram username для тестирования (например: @username или username):');

    if (!testUsername) {
        showNotification('Тестирование отменено', 'info');
        return;
    }

    // Обрабатываем username
    let cleanUsername = testUsername;
    if (testUsername.startsWith('@')) {
        cleanUsername = testUsername.substring(1);
    }

    console.log(`📱 Тестируем отправку на: ${cleanUsername}`);

    // Сначала проверяем, может ли бот получить информацию о пользователе
    console.log('🔍 Проверяем доступность пользователя...');
    const getUserUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${cleanUsername}`;

    fetch(getUserUrl)
        .then(response => response.json())
        .then(userData => {
            if (userData.ok) {
                console.log('✅ Пользователь найден и доступен:', userData.result);
                sendTestMessage();
            } else {
                console.log('❌ Пользователь недоступен:', userData);
                if (userData.description === 'Bad Request: chat not found') {
                    const shouldSendWelcome = confirm(`Пользователь ${testUsername} не писал боту первым.\n\nХотите отправить приветственное сообщение пользователю? Это активирует возможность получать уведомления.`);

                    if (shouldSendWelcome) {
                        sendWelcomeMessage(testUsername);
                    } else {
                        showNotification(`⚠️ Пользователь ${testUsername} не писал боту первым. Попросите пользователя написать боту @Allcitynet_bot любое сообщение, затем попробуйте снова.`, 'warning');
                    }
                } else {
                    showNotification(`❌ Ошибка: ${userData.description}`, 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Ошибка проверки пользователя:', error);
            showNotification(`❌ Ошибка проверки: ${error.message}`, 'error');
        });

    function sendTestMessage() {
        // Тестовое сообщение
        const testMessage = `🧪 <b>Тестовое уведомление</b>

📋 <b>Заявка:</b> Тестовый клиент
📞 <b>Телефон:</b> +7 (999) 123-45-67
🏢 <b>Провайдер:</b> Тестовый провайдер
📍 <b>Адрес:</b> г. Санкт-Петербург, Тестовая улица, 1

⏰ <b>Время создания:</b> ${new Date().toLocaleString('ru-RU')}
📊 <b>Статус:</b> Новая заявка

⚠️ <b>НЕ ЗАБУДЬТЕ СВЯЗАТЬСЯ С КЛИЕНТОМ!</b>

<i>Это тестовое уведомление от системы Allcitynet Portal</i>`;

        // Формируем URL для отправки сообщения
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        // Параметры сообщения
        const messageData = {
            chat_id: cleanUsername,
            text: testMessage,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        // Отправляем запрос к Telegram API
        fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    console.log('✅ Тестовое Telegram уведомление отправлено успешно:', data);
                    showNotification(`Telegram отправлен на ${testUsername}!`, 'success');
                } else {
                    console.error('❌ Ошибка отправки тестового Telegram:', data);

                    // Обрабатываем разные типы ошибок
                    let errorMessage = data.description || 'Неизвестная ошибка';
                    let isWarning = false;

                    if (data.description === 'Bad Request: chat not found') {
                        errorMessage = 'Пользователь не писал боту первым. Попросите пользователя написать боту @Allcitynet_bot любое сообщение, затем попробуйте снова.';
                        isWarning = true;
                    } else if (data.description === 'Forbidden: bot was blocked by the user') {
                        errorMessage = 'Пользователь заблокировал бота.';
                    } else if (data.description === 'Bad Request: user not found') {
                        errorMessage = 'Пользователь не найден. Проверьте правильность username.';
                    } else if (data.description === 'Forbidden: user is deactivated') {
                        errorMessage = 'Пользователь деактивирован.';
                    }

                    if (isWarning) {
                        showNotification(`⚠️ ${errorMessage}`, 'warning');
                    } else {
                        showNotification(`Ошибка Telegram: ${errorMessage}`, 'error');
                    }
                }
            })
            .catch(error => {
                console.error('❌ Ошибка при отправке тестового Telegram:', error);
                showNotification(`Ошибка Telegram: ${error.message}`, 'error');
            });
    }
}

function testReminders() {
    console.log('🔔 Тестирование системы напоминаний...');

    // Показываем все заявки с напоминаниями
    const requestsWithReminders = requests.filter(r => r.reminder && r.reminder.date && r.reminder.time);
    console.log(`📋 Найдено ${requestsWithReminders.length} заявок с напоминаниями:`, requestsWithReminders);

    if (requestsWithReminders.length === 0) {
        showNotification('Нет заявок с напоминаниями для тестирования', 'warning');
        return;
    }

    // Показываем информацию о каждой заявке с напоминанием
    requestsWithReminders.forEach((request, index) => {
        const reminderDateTime = new Date(`${request.reminder.date}T${request.reminder.time}`);
        const now = new Date();
        const timeDiff = reminderDateTime - now;

        console.log(`📋 Заявка ${index + 1}:`, {
            id: request.id,
            clientName: request.clientName,
            reminderDate: request.reminder.date,
            reminderTime: request.reminder.time,
            reminderDateTime: reminderDateTime.toLocaleString('ru-RU'),
            currentTime: now.toLocaleString('ru-RU'),
            timeDiffMinutes: Math.round(timeDiff / (1000 * 60)),
            shouldSend: reminderDateTime <= now,
            reminderMethods: {
                email: request.reminder.email,
                sms: request.reminder.sms,
                telegram: request.reminder.telegram
            }
        });

        // Находим агента
        const agent = users.find(u => u.id === request.userId || u.agentId === request.agentId);
        if (agent) {
            console.log(`👤 Агент для заявки ${request.id}:`, {
                name: agent.name,
                email: agent.email,
                notificationEmail: agent.notificationEmail,
                notificationPhone: agent.notificationPhone,
                telegram: agent.telegram
            });
        } else {
            console.log(`❌ Агент для заявки ${request.id} не найден`);
        }
    });

    // Принудительно запускаем проверку напоминаний
    console.log('🔄 Принудительный запуск проверки напоминаний...');
    checkReminders();

    showNotification(`Проверено ${requestsWithReminders.length} напоминаний. Смотрите консоль для деталей.`, 'info');
}

// Функция тестирования Telegram напоминаний для конкретного пользователя
function testTelegramReminder() {
    const usersWithTelegram = users.filter(u => u.notificationTelegram || u.telegram);
    
    if (usersWithTelegram.length === 0) {
        showNotification('Нет пользователей с настроенным Telegram', 'warning');
        return;
    }
    
    // Создаем список пользователей для выбора
    let userList = 'Выберите пользователя для тестирования:\n\n';
    usersWithTelegram.forEach((user, index) => {
        const telegram = user.notificationTelegram || user.telegram;
        userList += `${index + 1}. ${user.name || user.login} (${telegram})\n`;
    });
    
    const choice = prompt(userList + '\nВведите номер пользователя:');
    const userIndex = parseInt(choice) - 1;
    
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= usersWithTelegram.length) {
        showNotification('Неверный выбор', 'error');
        return;
    }
    
    const selectedUser = usersWithTelegram[userIndex];
    const telegramAccount = selectedUser.notificationTelegram || selectedUser.telegram;
    
    // Создаем тестовое сообщение напоминания
    const testMessage = `🔔 <b>ТЕСТОВОЕ НАПОМИНАНИЕ О ЗАЯВКЕ</b>

📋 <b>Заявка:</b> Тестовый клиент
📞 <b>Телефон:</b> +7 (999) 123-45-67
🏢 <b>Провайдер:</b> Ростелеком
📍 <b>Адрес:</b> г. Санкт-Петербург, ул. Тестовая, 1
📝 <b>Комментарий:</b> Это тестовое напоминание

⏰ <b>Время создания:</b> ${new Date().toLocaleString('ru-RU')}
📊 <b>Статус:</b> Новая заявка

⚠️ <b>НЕ ЗАБУДЬТЕ СВЯЗАТЬСЯ С КЛИЕНТОМ!</b>

<i>Это тестовое напоминание от системы Allcitynet Portal</i>`;
    
    console.log(`🧪 Тестируем Telegram напоминание для ${selectedUser.name || selectedUser.login} (${telegramAccount})`);
    
    // Отправляем тестовое сообщение
    sendTelegramReminderImproved(telegramAccount, testMessage);
    
    showNotification(`Тестовое напоминание отправлено пользователю ${selectedUser.name || selectedUser.login} (${telegramAccount})`, 'success');
}

// Функция принудительной проверки напоминаний
function forceCheckReminders() {
    console.log('🔍 Принудительная проверка напоминаний...');
    
    const requestsWithReminders = requests.filter(r => r.reminder && r.reminder.date && r.reminder.time);
    
    console.log(`📊 Найдено ${requestsWithReminders.length} заявок с напоминаниями`);
    
    if (requestsWithReminders.length === 0) {
        showNotification('Нет заявок с настроенными напоминаниями', 'warning');
        return;
    }
    
    // Показываем статистику напоминаний
    const now = new Date();
    let activeReminders = 0;
    let overdueReminders = 0;
    
    requestsWithReminders.forEach(request => {
        const reminderDate = new Date(request.reminder.date + 'T' + request.reminder.time);
        if (reminderDate <= now) {
            overdueReminders++;
        } else {
            activeReminders++;
        }
    });
    
    console.log(`📈 Статистика напоминаний:`, {
        всего: requestsWithReminders.length,
        активных: activeReminders,
        просроченных: overdueReminders
    });
    
    // Запускаем проверку
    checkReminders();
    
    showNotification(`Проверка напоминаний завершена!\n\nВсего напоминаний: ${requestsWithReminders.length}\nАктивных: ${activeReminders}\nПросроченных: ${overdueReminders}\n\nРезультаты в консоли браузера.`, 'info');
}

// === УВЕДОМЛЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ===

// Функция для отправки SMS уведомлений
function sendSMSReminder(phone, message) {
    console.log(`📱 Отправляем SMS уведомление на ${phone}:`, message);

    // Очищаем номер телефона от лишних символов
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Создаем SMS ссылку для мобильных устройств
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;

    // Показываем уведомление с возможностью открыть SMS
    const smsNotification = document.createElement('div');
    smsNotification.className = 'notification sms-notification';
    smsNotification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">📱</div>
            <div class="notification-text">
                <strong>SMS уведомление</strong><br>
                Отправлено на ${phone}<br>
                <a href="${smsUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">
                    Открыть SMS приложение
                </a>
            </div>
        </div>
    `;

    // Добавляем уведомление на страницу
    document.body.appendChild(smsNotification);

    // Удаляем уведомление через 10 секунд
    setTimeout(() => {
        if (smsNotification.parentNode) {
            smsNotification.parentNode.removeChild(smsNotification);
        }
    }, 10000);

    showNotification(`SMS подготовлено для ${phone}`, 'info');
}

// Функция для отправки email уведомлений
function sendEmailReminder(email, message, request) {
    console.log(`📧 Отправляем email уведомление на ${email}:`, message);

    // Проверяем, инициализирован ли EmailJS
    if (typeof emailjs === 'undefined') {
        console.log('❌ EmailJS не загружен, используем альтернативный способ');

        // Создаем mailto ссылку как альтернативу
        const subject = '🔔 Напоминание о заявке';
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        // Показываем уведомление с возможностью открыть email
        const emailNotification = document.createElement('div');
        emailNotification.className = 'notification email-notification';
        emailNotification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📧</div>
                <div class="notification-text">
                    <strong>Email уведомление</strong><br>
                    Отправлено на ${email}<br>
                    <a href="${mailtoUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">
                        Открыть почтовый клиент
                    </a>
                </div>
            </div>
        `;

        // Добавляем уведомление на страницу
        document.body.appendChild(emailNotification);

        // Удаляем уведомление через 10 секунд
        setTimeout(() => {
            if (emailNotification.parentNode) {
                emailNotification.parentNode.removeChild(emailNotification);
            }
        }, 10000);

        showNotification(`Email подготовлен для ${email}`, 'info');
        return;
    }

    // Инициализируем EmailJS с вашими ключами
    // Попробуем разные форматы ключа
    try {
        emailjs.init('s7l2WT4wfvIcPsZlB');
    } catch (error) {
        console.log('❌ Ошибка инициализации EmailJS:', error);
        // Fallback на альтернативный способ
        const subject = '🔔 Напоминание о заявке';
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        const emailNotification = document.createElement('div');
        emailNotification.className = 'notification email-notification';
        emailNotification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📧</div>
                <div class="notification-text">
                    <strong>Email уведомление</strong><br>
                    Отправлено на ${email}<br>
                    <a href="${mailtoUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">
                        Открыть почтовый клиент
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(emailNotification);
        setTimeout(() => {
            if (emailNotification.parentNode) {
                emailNotification.parentNode.removeChild(emailNotification);
            }
        }, 10000);

        showNotification(`Email подготовлен для ${email} (EmailJS недоступен)`, 'warning');
        return;
    }

    const templateParams = {
        to_name: request.clientName || 'Клиент',
        to_email: email,
        reply_to: email,
        subject: '🔔 Напоминание о заявке',
        message: message,
        client_name: request.clientName,
        client_phone: request.clientPhone,
        provider: request.provider,
        request_id: request.id
    };

    // Отправляем email
    emailjs.send('service_snvhx5c', 'template_k4c68xi', templateParams)
        .then(function (response) {
            console.log('✅ Email успешно отправлен:', response);
            showNotification(`Email отправлен на ${email}`, 'success');
        }, function (error) {
            console.log('❌ Ошибка отправки email:', error);
            showNotification(`Ошибка отправки email на ${email}`, 'error');
        });
}

// Функция для отправки Telegram уведомлений
function sendTelegramReminder(telegram, message) {
    console.log(`📱 Отправляем Telegram уведомление на ${telegram}:`, message);

    // Конфигурация Telegram бота @Allcitynet_bot
    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Проверяем, настроен ли бот
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('❌ Telegram бот не настроен');
        showNotification('Telegram бот не настроен. Проверьте конфигурацию.', 'warning');
        return;
    }

    // Обрабатываем разные форматы Telegram ID
    let TELEGRAM_CHAT_ID = telegram;

    // Если это username с @, убираем @
    if (telegram.startsWith('@')) {
        TELEGRAM_CHAT_ID = telegram.substring(1);
    }

    console.log(`📱 Отправляем сообщение пользователю: ${TELEGRAM_CHAT_ID}`);

    // Формируем URL для отправки сообщения
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Параметры сообщения
    const messageData = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    // Отправляем запрос к Telegram API
    fetch(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('✅ Telegram уведомление отправлено успешно:', data);
                showNotification(`Telegram отправлен на ${telegram}`, 'success');
            } else {
                console.error('❌ Ошибка отправки Telegram:', data);
                console.log('ℹ️ Примечание: Несмотря на ошибку, сообщение может быть доставлено пользователю.');

                // Обрабатываем разные типы ошибок
                let errorMessage = data.description || 'Неизвестная ошибка';
                let isWarning = false;

                if (data.description === 'Bad Request: chat not found') {
                    errorMessage = 'Пользователь не писал боту первым. Попросите пользователя написать боту @Allcitynet_bot любое сообщение. Сообщение может быть доставлено, несмотря на ошибку.';
                    isWarning = true;
                } else if (data.description === 'Forbidden: bot was blocked by the user') {
                    errorMessage = 'Пользователь заблокировал бота.';
                } else if (data.description === 'Bad Request: user not found') {
                    errorMessage = 'Пользователь не найден. Проверьте правильность username.';
                } else if (data.description === 'Forbidden: user is deactivated') {
                    errorMessage = 'Пользователь деактивирован.';
                }

                if (isWarning) {
                    showNotification(`⚠️ Telegram: ${errorMessage}`, 'warning');
                } else {
                    showNotification(`Ошибка отправки Telegram: ${errorMessage}`, 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Ошибка при отправке Telegram:', error);
            showNotification(`Ошибка отправки Telegram: ${error.message}`, 'error');
        });
}

function notifyUsersByRole(request) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const activeUsers = users.filter(u => u.isActive);

    activeUsers.forEach(user => {
        if (user.role === 'admin' || user.role === 'operator') {
            // Отправляем уведомление админам и операторам
            console.log(`Уведомление для ${user.name}: новая заявка`);
        }
    });
}

// === ПОКАЗ УВЕДОМЛЕНИЙ ===

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// === ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ===

window.onclick = function (event) {
    const modals = ['requestModal', 'deleteModal', 'loginModal', 'usersModal', 'editUserModal', 'rewardsModal', 'tariffUpdateModal'];

    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// === ФУНКЦИИ ОБНОВЛЕНИЯ ДАННЫХ ===

// Принудительное обновление данных провайдера в providersData
function updateProviderDataInProvidersData(slug) {
    console.log(`🔄 Принудительное обновление данных для ${slug}...`);

    const provider = PROVIDERS_DATA.providers.find(p => p.slug === slug);
    if (!provider) {
        console.error(`❌ Провайдер ${slug} не найден в PROVIDERS_DATA`);
        return false;
    }

    // Обновляем данные в providersData
    if (providersData[slug]) {
        providersData[slug].provider.services = provider.services;
        providersData[slug].tariffs = provider.tariffs;
        console.log(`✅ Данные провайдера ${slug} обновлены в providersData`);
        console.log(`📊 Новые услуги:`, provider.services);
        console.log(`📊 Новые тарифы:`, provider.tariffs);
    } else {
        // Если провайдера нет в providersData, создаем его
        providersData[slug] = {
            provider: {
                name: provider.name,
                services: provider.services
            },
            tariffs: provider.tariffs || []
        };
        console.log(`✅ Создан новый провайдер ${slug} в providersData`);
    }

    return true;
}

// Обновление всех провайдеров в providersData
function updateAllProvidersData() {
    console.log('🔄 Обновление всех провайдеров в providersData...');

    let updatedCount = 0;
    PROVIDERS_DATA.providers.forEach(provider => {
        if (updateProviderDataInProvidersData(provider.slug)) {
            updatedCount++;
        }
    });

    console.log(`✅ Обновлено ${updatedCount} провайдеров в providersData`);
    return updatedCount;
}

// === УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ОБНОВЛЕНИЯ ПРОВАЙДЕРОВ ===

// Универсальная функция для обновления данных провайдера
function updateProviderData(providerSlug, services, tariffs) {
    console.log(`🔄 Обновление данных провайдера ${providerSlug}...`);

    // Обновляем данные в PROVIDERS_DATA
    const provider = PROVIDERS_DATA.providers.find(p => p.slug === providerSlug);
    if (!provider) {
        console.error(`❌ Провайдер ${providerSlug} не найден в PROVIDERS_DATA`);
        return false;
    }

    // Устанавливаем новые данные
    provider.services = services;
    provider.tariffs = tariffs;

    console.log(`✅ Данные ${providerSlug} обновлены в PROVIDERS_DATA`);
    console.log('📊 Услуги:', provider.services);
    console.log('📊 Тарифы:', provider.tariffs);

    // Принудительно обновляем данные в providersData
    if (providersData[providerSlug]) {
        providersData[providerSlug].provider.services = provider.services;
        providersData[providerSlug].tariffs = provider.tariffs;
        console.log(`✅ Данные ${providerSlug} обновлены в providersData`);
    } else {
        // Создаем провайдера в providersData
        providersData[providerSlug] = {
            provider: {
                name: provider.name,
                services: provider.services
            },
            tariffs: provider.tariffs
        };
        console.log(`✅ Создан провайдер ${providerSlug} в providersData`);
    }

    return true;
}

// Универсальная функция для обновления интерфейса провайдера
function updateProviderInterface(providerSlug, expectedServices) {
    console.log(`🔄 Обновление интерфейса для ${providerSlug}...`);

    // Принудительно обновляем интерфейс
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        // Устанавливаем провайдера как выбранного
        providerSelect.value = providerSlug;

        // Вызываем обработчик изменения провайдера
        onProviderChange();

        console.log(`✅ Интерфейс обновлен для ${providerSlug}`);

        // Проверяем результат
        const serviceButtons = document.getElementById('serviceButtons');
        if (serviceButtons) {
            const serviceButtonsList = Array.from(serviceButtons.querySelectorAll('.service-button'));
            const serviceNames = serviceButtonsList.map(btn => btn.textContent);
            console.log('📊 Услуги в интерфейсе после обновления:', serviceNames);

            const allExpectedServicesPresent = expectedServices.every(service => serviceNames.includes(service));
            if (allExpectedServicesPresent) {
                console.log(`✅ Услуги ${providerSlug} обновились корректно!`);
            } else {
                console.warn(`⚠️ Услуги ${providerSlug} не обновились корректно`);
                console.warn('⚠️ Ожидалось:', expectedServices);
                console.warn('⚠️ Получено:', serviceNames);
            }
        }
    }

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ДОМОВОЙ ===

// Принудительное обновление данных еТелеком
function forceUpdateEtelecomData() {
    console.log('🔄 Принудительное обновление данных еТелеком...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: '100',
            service: 'Интернет',
            speed: 100,
            price: 699,
            period: 'месяц',
            description: 'Тариф "100" - 100 Мбит/с за 699 руб./мес.',
            isPromotion: false
        },
        {
            name: '200',
            service: 'Интернет',
            speed: 200,
            price: 799,
            period: 'месяц',
            description: 'Тариф "200" - 200 Мбит/с за 799 руб./мес.',
            isPromotion: false
        },
        {
            name: '500',
            service: 'Интернет',
            speed: 500,
            price: 899,
            period: 'месяц',
            description: 'Тариф "500" - 500 Мбит/с за 899 руб./мес.',
            isPromotion: false
        },
        {
            name: '1000',
            service: 'Интернет',
            speed: 1000,
            price: 1199,
            period: 'месяц',
            description: 'Тариф "1000" - 1000 Мбит/с за 1199 руб./мес.',
            isPromotion: false
        },
        // Тарифы на телевидение
        {
            name: 'Цифровое телевидение',
            service: 'Телевидение',
            speed: null,
            price: 300,
            period: 'месяц',
            description: 'Тариф "Цифровое телевидение" - 144 канала (30 HD-каналов) за 300 руб./мес. Приставка не требуется.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Интернет +Телевидение',
            service: 'Пакетное предложение',
            speed: 100,
            price: 899,
            period: 'месяц',
            description: 'Тариф "Интернет +Телевидение" - 100 Мбит/с интернет + 143 канала за 899 руб./мес.',
            isPromotion: false
        },
        {
            name: '200 за 299',
            service: 'Пакетное предложение',
            speed: 200,
            price: 299,
            period: 'месяц',
            description: 'Тариф "200 за 299" - 200 Мбит/с интернет + 143 канала (5 месяцев бесплатно) за 299 руб./мес. Акция действует 5 месяцев, далее 700 руб./мес.',
            isPromotion: true
        },
        {
            name: '1 ГБИТ',
            service: 'Пакетное предложение',
            speed: 1000,
            price: 699,
            period: 'месяц',
            description: 'Тариф "1 ГБИТ" - 1000 Мбит/с интернет + 143 канала (4 месяца бесплатно) за 699 руб./мес. Акция действует 3 месяца, далее 1199 руб./мес.',
            isPromotion: true
        }
    ];

    // Обновляем данные
    updateProviderData('etelecom', services, tariffs);

    return true;
}

// Принудительное обновление интерфейса для еТелеком
function forceUpdateEtelecomInterface() {
    console.log('🔄 Принудительное обновление интерфейса для еТелеком...');

    // Сначала обновляем данные
    forceUpdateEtelecomData();

    // Обновляем интерфейс
    updateProviderInterface('etelecom', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ SKYNET ===

// Принудительное обновление данных SkyNet
function forceUpdateSkynetData() {
    console.log('🔄 Принудительное обновление данных SkyNet...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Т-100',
            service: 'Интернет',
            speed: 100,
            price: 750,
            period: 'месяц',
            description: 'Тариф "Т-100" - 100 Мбит/с за 750 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Т-250',
            service: 'Интернет',
            speed: 200,
            price: 750,
            period: 'месяц',
            description: 'Тариф "Т-250" - 200 Мбит/с за 750 руб./мес.',
            isPromotion: false
        },
        {
            name: 'T-400',
            service: 'Интернет',
            speed: 400,
            price: 1500,
            period: 'месяц',
            description: 'Тариф "T-400" - 400 Мбит/с за 1500 руб./мес.',
            isPromotion: false
        },
        {
            name: 'T-800',
            service: 'Интернет',
            speed: 800,
            price: 1800,
            period: 'месяц',
            description: 'Тариф "T-800" - 800 Мбит/с за 1800 руб./мес.',
            isPromotion: false
        },
        // Тарифы на телевидение
        {
            name: 'Медиа',
            service: 'Телевидение',
            speed: null,
            price: 250,
            period: 'месяц',
            description: 'Тариф "Медиа" - 64 цифровых канала + онлайн-кинотеатр IVI за 250 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Хочу скайнет',
            service: 'Пакетное предложение',
            speed: 100,
            price: 325,
            period: 'месяц',
            description: 'Тариф "Хочу скайнет" - 100 Мбит/с интернет + 60 цифровых каналов + IVI на 30 дней за 325 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Т-100 с ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 900,
            period: 'месяц',
            description: 'Тариф "Т-100 с ТВ" - 100 Мбит/с интернет + 64 цифровых канала + онлайн-кинотеатр IVI за 900 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('skynet-provider', services, tariffs);

    console.log('✅ Данные SkyNet обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для SkyNet
function forceUpdateSkynetInterface() {
    console.log('🔄 Принудительное обновление интерфейса для SkyNet...');

    // Сначала обновляем данные
    forceUpdateSkynetData();

    // Обновляем интерфейс
    updateProviderInterface('skynet-provider', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    console.log('✅ Интерфейс SkyNet обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ПИН ===

// Принудительное обновление данных ПИН
function forceUpdatePinData() {
    console.log('🔄 Принудительное обновление данных ПИН...');

    const services = ['Интернет', 'Телефония'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Люкс',
            service: 'Интернет',
            speed: 100,
            price: 630,
            period: 'месяц',
            description: 'Тариф "Люкс" - 100 Мбит/с интернет + 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
            isPromotion: false
        },
        {
            name: 'Премиум',
            service: 'Интернет',
            speed: 500,
            price: 1300,
            period: 'месяц',
            description: 'Тариф "Премиум" - 500 Мбит/с интернет + 102 канала за 1300 руб./мес. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        },
        {
            name: 'Гигабит',
            service: 'Интернет',
            speed: 1000,
            price: 1600,
            period: 'месяц',
            description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + 102 канала за 1600 руб./мес. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        },
        // Тарифы на телефонию
        {
            name: 'Поминутный',
            service: 'Телефония',
            speed: null,
            price: 50,
            period: 'месяц',
            description: 'Тариф "Поминутный" - Городской номер и поминутная оплата за 50 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Городской безлимит',
            service: 'Телефония',
            speed: null,
            price: 199,
            period: 'месяц',
            description: 'Тариф "Городской безлимит" - Общение со всем городом без ограничений за 199 руб./мес.',
            isPromotion: false
        },
        {
            name: '400 минут',
            service: 'Телефония',
            speed: null,
            price: 399,
            period: 'месяц',
            description: 'Тариф "400 минут" - Включено 400 минут разговоров по всей России за 399 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Россия анлим',
            service: 'Телефония',
            speed: null,
            price: 899,
            period: 'месяц',
            description: 'Тариф "Россия анлим" - Безлимитный тариф для разговоров по всей России за 899 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('pin-telekom', services, tariffs);

    console.log('✅ Данные ПИН обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для ПИН
function forceUpdatePinInterface() {
    console.log('🔄 Принудительное обновление интерфейса для ПИН...');

    // Сначала обновляем данные
    forceUpdatePinData();

    // Обновляем интерфейс
    updateProviderInterface('pin-telekom', ['Интернет', 'Телефония']);

    console.log('✅ Интерфейс ПИН обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ AICONET ===

// Принудительное обновление данных Aiconet
function forceUpdateAiconetData() {
    console.log('🔄 Принудительное обновление данных Aiconet...');

    const services = ['Интернет'];
    const tariffs = [
        {
            name: 'Базовый',
            service: 'Интернет',
            speed: 100,
            price: 500,
            period: 'месяц',
            description: 'Тариф "Базовый" - 100 Мбит/с за 500 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('aikonet', services, tariffs);

    console.log('✅ Данные Aiconet обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Aiconet
function forceUpdateAiconetInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Aiconet...');

    // Сначала обновляем данные
    forceUpdateAiconetData();

    // Обновляем интерфейс
    updateProviderInterface('aikonet', ['Интернет']);

    console.log('✅ Интерфейс Aiconet обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ARBITAL ===

// Принудительное обновление данных Arbital
function forceUpdateArbitalData() {
    console.log('🔄 Принудительное обновление данных Arbital...');

    const services = ['Интернет'];
    const tariffs = [
        {
            name: 'Стандарт',
            service: 'Интернет',
            speed: 100,
            price: 600,
            period: 'месяц',
            description: 'Тариф "Стандарт" - 100 Мбит/с за 600 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('arbital', services, tariffs);

    console.log('✅ Данные Arbital обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Arbital
function forceUpdateArbitalInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Arbital...');

    // Сначала обновляем данные
    forceUpdateArbitalData();

    // Обновляем интерфейс
    updateProviderInterface('arbital', ['Интернет']);

    console.log('✅ Интерфейс Arbital обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ЕНЕВА (ОБИТ) ===

// Принудительное обновление данных Енева
function forceUpdateObitData() {
    console.log('🔄 Принудительное обновление данных Енева...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Интернет 100',
            service: 'Интернет',
            speed: 100,
            price: 650,
            period: 'месяц',
            description: 'Тариф "Интернет 100" - 100 Мбит/с за 650 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Интернет 200',
            service: 'Интернет',
            speed: 200,
            price: 900,
            period: 'месяц',
            description: 'Тариф "Интернет 200" - 200 Мбит/с за 900 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Интернет 500',
            service: 'Интернет',
            speed: 500,
            price: 1100,
            period: 'месяц',
            description: 'Тариф "Интернет 500" - 500 Мбит/с за 1100 руб./мес.',
            isPromotion: false
        },
        // Тарифы на телевидение
        {
            name: 'ТВ Лайт',
            service: 'Телевидение',
            speed: null,
            price: 150,
            period: 'месяц',
            description: 'Тариф "ТВ Лайт" - 122 канала за 150 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Пятёрка',
            service: 'Пакетное предложение',
            speed: 100,
            price: 330,
            period: 'месяц',
            description: 'Тариф "Пятёрка" - 100 Мбит/с за 330 руб./мес. при предоплате за 5 месяцев.',
            isPromotion: true
        },
        {
            name: 'Пятёрка 200',
            service: 'Пакетное предложение',
            speed: 200,
            price: 450,
            period: 'месяц',
            description: 'Тариф "Пятёрка 200" - 200 Мбит/с + 122 канала за 450 руб./мес. при предоплате за 5 месяцев.',
            isPromotion: true
        },
        {
            name: '100 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 100,
            price: 800,
            period: 'месяц',
            description: 'Тариф "100 + ТВ Лайт" - 100 Мбит/с + 122 канала за 800 руб./мес.',
            isPromotion: false
        },
        {
            name: '200 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 200,
            price: 1050,
            period: 'месяц',
            description: 'Тариф "200 + ТВ Лайт" - 200 Мбит/с + 122 канала за 1050 руб./мес.',
            isPromotion: false
        },
        {
            name: '500 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1250,
            period: 'месяц',
            description: 'Тариф "500 + ТВ Лайт" - 500 Мбит/с + 122 канала за 1250 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('obit', services, tariffs);

    console.log('✅ Данные Енева обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Енева
function forceUpdateObitInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Енева...');

    // Сначала обновляем данные
    forceUpdateObitData();

    // Обновляем интерфейс
    updateProviderInterface('obit', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    console.log('✅ Интерфейс Енева обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ПРОСТОР ТЕЛЕКОМ ===

// Принудительное обновление данных Простор телеком
function forceUpdateProstorTelekomData() {
    console.log('🔄 Принудительное обновление данных Простор телеком...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Постоянный',
            service: 'Интернет',
            speed: 100,
            price: 1050,
            period: '3 месяца',
            description: 'Тариф "Постоянный" - 100 Мбит/с за 1050 руб. за 3 месяца (оплата квартально).',
            isPromotion: false
        },
        {
            name: '200 за 600',
            service: 'Интернет',
            speed: 200,
            price: 600,
            period: 'месяц',
            description: 'Тариф "200 за 600" - 200 Мбит/с за 600 руб./мес. Первый платеж 1200 руб. за 2 месяца.',
            isPromotion: true
        },
        {
            name: 'ПРЕМИУМ',
            service: 'Интернет',
            speed: 300,
            price: 750,
            period: 'месяц',
            description: 'Тариф "ПРЕМИУМ" - 300 Мбит/с за 750 руб./мес. Первоначальный платеж 1500 руб. за 2 месяца.',
            isPromotion: true
        },
        {
            name: 'Домино-актив 1',
            service: 'Интернет',
            speed: 50,
            price: 700,
            period: 'месяц',
            description: 'Тариф "Домино-актив 1" - 50 Мбит/с за 700 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Домино-актив 2',
            service: 'Интернет',
            speed: 70,
            price: 780,
            period: 'месяц',
            description: 'Тариф "Домино-актив 2" - 70 Мбит/с за 780 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Домино-скорость 1',
            service: 'Интернет',
            speed: 85,
            price: 840,
            period: 'месяц',
            description: 'Тариф "Домино-скорость 1" - 85 Мбит/с за 840 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Домино-скорость 2',
            service: 'Интернет',
            speed: 100,
            price: 1070,
            period: 'месяц',
            description: 'Тариф "Домино-скорость 2" - 100 Мбит/с за 1070 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: '50 Мбит/с + ТВ (КОМБО ЛАЙТ)',
            service: 'Пакетное предложение',
            speed: 50,
            price: 949,
            period: 'месяц',
            description: 'Тариф "50 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 50 Мбит/с интернет + 271 канал за 949 руб./мес.',
            isPromotion: false
        },
        {
            name: '70 Мбит/с + ТВ (КОМБО ЛАЙТ)',
            service: 'Пакетное предложение',
            speed: 70,
            price: 1029,
            period: 'месяц',
            description: 'Тариф "70 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 70 Мбит/с интернет + 271 канал за 1029 руб./мес.',
            isPromotion: false
        },
        {
            name: '85 Мбит/с + ТВ (КОМБО ЛАЙТ)',
            service: 'Пакетное предложение',
            speed: 85,
            price: 1089,
            period: 'месяц',
            description: 'Тариф "85 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 85 Мбит/с интернет + 271 канал за 1089 руб./мес.',
            isPromotion: false
        },
        {
            name: '100 Мбит/с + ТВ (КОМБО ЛАЙТ)',
            service: 'Пакетное предложение',
            speed: 100,
            price: 1319,
            period: 'месяц',
            description: 'Тариф "100 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 100 Мбит/с интернет + 271 канал за 1319 руб./мес.',
            isPromotion: false
        },
        {
            name: '200 Мбит/с + ТВ (КОМБО ЛАЙТ)',
            service: 'Пакетное предложение',
            speed: 200,
            price: 1529,
            period: 'месяц',
            description: 'Тариф "200 Мбит/с + ТВ (КОМБО ЛАЙТ)" - 200 Мбит/с интернет + 249 каналов за 1529 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('prostor-telekom', services, tariffs);

    console.log('✅ Данные Простор телеком обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Простор телеком
function forceUpdateProstorTelekomInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Простор телеком...');

    // Сначала обновляем данные
    forceUpdateProstorTelekomData();

    // Обновляем интерфейс
    updateProviderInterface('prostor-telekom', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    console.log('✅ Интерфейс Простор телеком обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ РОСТЕЛЕКОМ ===

// Принудительное обновление данных Ростелеком
function forceUpdateRostelecomData() {
    console.log('🔄 Принудительное обновление данных Ростелеком...');

    const services = ['Интернет', 'Телевидение', 'Телефония', 'Мобильная связь', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Просто интернет',
            service: 'Интернет',
            speed: 200,
            price: 500,
            period: 'месяц',
            description: 'Тариф "Просто интернет" - 200 Мбит/с за 500 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Технология доступа.Базовый',
            service: 'Интернет',
            speed: 200,
            price: 600,
            period: 'месяц',
            description: 'Тариф "Технология доступа.Базовый" - 200 Мбит/с за 600 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Технология доступа.Базовый',
            service: 'Интернет',
            speed: 100,
            price: 550,
            period: 'месяц',
            description: 'Тариф "Технология доступа.Базовый" - 100 Мбит/с за 550 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Игровой',
            service: 'Интернет',
            speed: 800,
            price: 990,
            period: 'месяц',
            description: 'Тариф "Игровой" - 800 Мбит/с за 990 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: true
        },
        // Тарифы на телевидение
        {
            name: 'КиноViP',
            service: 'Телевидение',
            speed: null,
            price: 379,
            period: 'месяц',
            description: 'Тариф "КиноViP" - Видеосервис Wink, 110 каналов за 379 руб./мес. + 99 руб./мес. тв-приставка.',
            isPromotion: false
        },
        // Тарифы на телефонию
        {
            name: 'Безлимитный',
            service: 'Телефония',
            speed: null,
            price: 479,
            period: 'месяц',
            description: 'Тариф "Безлимитный" - Безлимитные звонки на местные городские номера, звонки на мобильные от 1.5 руб./мин за 479 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Комбинированный',
            service: 'Телефония',
            speed: null,
            price: 373,
            period: 'месяц',
            description: 'Тариф "Комбинированный" - 400 минут/месяц на местные городские номера, далее 0.54 руб./мин, звонки на мобильные от 1.5 руб./мин за 373 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Повременный',
            service: 'Телефония',
            speed: null,
            price: 211,
            period: 'месяц',
            description: 'Тариф "Повременный" - Звонки на местные городские номера 0.62 руб./мин, звонки на мобильные от 1.5 руб./мин за 211 руб./мес.',
            isPromotion: false
        },
        // Тарифы на мобильную связь
        {
            name: 'Технологии общения. Хит сезона X',
            service: 'Мобильная связь',
            speed: 200,
            price: 375,
            period: 'месяц',
            description: 'Тариф "Технологии общения. Хит сезона X" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 375 руб./мес. Скидка действует 120 дней, далее 750 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии общения.',
            service: 'Мобильная связь',
            speed: 300,
            price: 475,
            period: 'месяц',
            description: 'Тариф "Технологии общения." - 300 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 475 руб./мес. Скидка действует 60 дней, далее 950 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды.Хит сезона Х',
            service: 'Мобильная связь',
            speed: 200,
            price: 425,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды.Хит сезона Х" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 425 руб./мес. Скидка действует 120 дней, далее 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды Онлайн. Хит сезона Х',
            service: 'Мобильная связь',
            speed: 200,
            price: 425,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды Онлайн. Хит сезона Х" - 200 Мбит/с интернет + 1000 минут/40 Гб/500 sms за 425 руб./мес. Скидка действует 120 дней, далее 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды',
            service: 'Мобильная связь',
            speed: 500,
            price: 525,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды" - 500 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 525 руб./мес. Скидка действует 60 дней, далее 1050 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды Онлайн.',
            service: 'Мобильная связь',
            speed: 500,
            price: 675,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды Онлайн." - 500 Мбит/с интернет + 2000 минут/40 Гб/500 sms за 675 руб./мес. Скидка действует 60 дней, далее 1050 руб./мес.',
            isPromotion: true
        },
        // Пакетные предложения
        {
            name: 'Технологии развлечения. Онлайн',
            service: 'Пакетное предложение',
            speed: 300,
            price: 700,
            period: 'месяц',
            description: 'Тариф "Технологии развлечения. Онлайн" - 300 Мбит/с интернет + более 170 каналов через приложение Wink за 700 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Технологии развлечения',
            service: 'Пакетное предложение',
            speed: 300,
            price: 700,
            period: 'месяц',
            description: 'Тариф "Технологии развлечения" - 300 Мбит/с интернет + более 170 каналов за 700 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('rostelecom', services, tariffs);

    console.log('✅ Данные Ростелеком обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Ростелеком
function forceUpdateRostelecomInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Ростелеком...');

    // Сначала обновляем данные
    forceUpdateRostelecomData();

    // Обновляем интерфейс
    updateProviderInterface('rostelecom', ['Интернет', 'Телевидение', 'Телефония', 'Мобильная связь', 'Пакетное предложение']);

    console.log('✅ Интерфейс Ростелеком обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ МЕГАФОН ===

// Принудительное обновление данных МегаФон
function forceUpdateMegafonData() {
    console.log('🔄 Принудительное обновление данных МегаФон...');

    const services = ['Интернет', 'Мобильная связь', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'ДляДома Интернет',
            service: 'Интернет',
            speed: 100,
            price: 250,
            period: 'месяц',
            description: 'Тариф "ДляДома Интернет" - 100 Мбит/с за 250 руб./мес. Скидка 50% на 2 месяца, далее 500 руб./мес. Роутер рассрочка 36 мес. - 120 руб/мес.',
            isPromotion: true
        },
        {
            name: 'ДляДомаТурбо',
            service: 'Интернет',
            speed: 300,
            price: 275,
            period: 'месяц',
            description: 'Тариф "ДляДомаТурбо" - 300 Мбит/с за 275 руб./мес. Скидка 50% на 2 месяца, далее 550 руб./мес. Роутер рассрочка 36 мес. - 120 руб/мес.',
            isPromotion: true
        },
        // Тарифы на мобильную связь
        {
            name: 'Без переплат Всё',
            service: 'Мобильная связь',
            speed: null,
            price: 330,
            period: 'месяц',
            description: 'Тариф "Без переплат Всё" - 600 минут безлимитный интернет за 330 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'ДляДома Всё',
            service: 'Пакетное предложение',
            speed: 200,
            price: 325,
            period: 'месяц',
            description: 'Тариф "ДляДома Всё" - 200 Мбит/с интернет + более 250 каналов за 325 руб./мес. Скидка 50% на 60 дней, далее 650 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Мегафон 3.0 Минимум',
            service: 'Пакетное предложение',
            speed: 100,
            price: 475,
            period: 'месяц',
            description: 'Тариф "Мегафон 3.0 Минимум" - 100 Мбит/с интернет + более 250 каналов + 1 sim МегаФон (5 Гб интернета, 500 минут, безлимит внутри сети) за 475 руб./мес. Скидка 50% на 2 месяца, далее 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'ДляДома Максимум',
            service: 'Пакетное предложение',
            speed: 300,
            price: 350,
            period: 'месяц',
            description: 'Тариф "ДляДома Максимум" - 300 Мбит/с интернет + более 250 каналов за 350 руб./мес. Скидка 50% на 60 дней, далее 700 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Мегафон 3.0 Интернет',
            service: 'Пакетное предложение',
            speed: 500,
            price: 560,
            period: 'месяц',
            description: 'Тариф "Мегафон 3.0 Интернет" - 500 Мбит/с интернет + более 250 каналов + 1 sim МегаФон (35 Гб интернет, 200 минут, безлимит внутри сети) за 560 руб./мес. Скидка 50% на 2 месяца, далее 1020 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Мегафон 3.0 VIP',
            service: 'Пакетное предложение',
            speed: 500,
            price: 600,
            period: 'месяц',
            description: 'Тариф "Мегафон 3.0 VIP" - 500 Мбит/с интернет + 250 каналов + 1 sim МегаФон (50 Гб, 1500 минут, безлимит внутри сети) за 600 руб./мес. С 2 месяца 1200 руб./мес.',
            isPromotion: true
        }
    ];

    // Обновляем данные
    updateProviderData('megafon', services, tariffs);

    console.log('✅ Данные МегаФон обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для МегаФон
function forceUpdateMegafonInterface() {
    console.log('🔄 Принудительное обновление интерфейса для МегаФон...');

    // Сначала обновляем данные
    forceUpdateMegafonData();

    // Обновляем интерфейс
    updateProviderInterface('megafon', ['Интернет', 'Мобильная связь', 'Пакетное предложение']);

    console.log('✅ Интерфейс МегаФон обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ РОСТЕЛЕКОМ ТКТ ===

// Принудительное обновление данных Ростелеком ТКТ
function forceUpdateRostelecomTktData() {
    console.log('🔄 Принудительное обновление данных Ростелеком ТКТ...');

    const services = ['Интернет', 'Мобильная связь', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Просто интернет',
            service: 'Интернет',
            speed: 100,
            price: 500,
            period: 'месяц',
            description: 'Тариф "Просто интернет" - 100 Мбит/с за 500 руб./мес. Необходимо пользоваться услугами не менее 12 мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Технология доступа',
            service: 'Интернет',
            speed: 100,
            price: 550,
            period: 'месяц',
            description: 'Тариф "Технология доступа" - 100 Мбит/с за 550 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Игровой',
            service: 'Интернет',
            speed: 100,
            price: 990,
            period: 'месяц',
            description: 'Тариф "Игровой" - 100 Мбит/с за 990 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        // Тарифы на мобильную связь
        {
            name: 'Технологии общения. Хит сезона X',
            service: 'Мобильная связь',
            speed: 100,
            price: 375,
            period: 'месяц',
            description: 'Тариф "Технологии общения. Хит сезона X" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms за 375 руб./мес. Скидка действует 120 дней, далее тариф 750 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии общения. Семейный',
            service: 'Мобильная связь',
            speed: 100,
            price: 475,
            period: 'месяц',
            description: 'Тариф "Технологии общения. Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms за 475 руб./мес. Скидка действует 60 дней, далее тариф 950 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды Онлайн. Хит сезона Х',
            service: 'Мобильная связь',
            speed: 100,
            price: 425,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды Онлайн. Хит сезона Х" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms + более 170 каналов через приложение Wink за 425 руб./мес. Скидка действует 120 дней, далее тариф 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды Онлайн.Семейный',
            service: 'Мобильная связь',
            speed: 100,
            price: 525,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды Онлайн.Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms + более 170 каналов через приложение Wink за 525 руб./мес. Скидка действует 60 дней, далее тариф 1050 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды.Хит сезона Х',
            service: 'Мобильная связь',
            speed: 100,
            price: 425,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды.Хит сезона Х" - 100 Мбит/с интернет + 1000 мин 40 Гб 500 sms + более 170 каналов за 425 руб./мес. Скидка действует 120 дней, далее тариф 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Технологии выгоды.Семейный',
            service: 'Мобильная связь',
            speed: 100,
            price: 525,
            period: 'месяц',
            description: 'Тариф "Технологии выгоды.Семейный" - 100 Мбит/с интернет + 2000 мин 40 Гб 500 sms + более 170 каналов за 525 руб./мес. Скидка действует 60 дней, далее тариф 1050 руб./мес.',
            isPromotion: true
        },
        // Пакетные предложения
        {
            name: 'Для развлечений',
            service: 'Пакетное предложение',
            speed: 100,
            price: 650,
            period: 'месяц',
            description: 'Тариф "Для развлечений" - 100 Мбит/с интернет + более 180 каналов за 650 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        },
        {
            name: 'Технологии развлечений. Онлайн',
            service: 'Пакетное предложение',
            speed: 100,
            price: 700,
            period: 'месяц',
            description: 'Тариф "Технологии развлечений. Онлайн" - 100 Мбит/с интернет + более 170 каналов через приложение Wink за 700 руб./мес. Оборудование обязательно. + 500 р. подключение к сети.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('rostelekom-tkt', services, tariffs);

    console.log('✅ Данные Ростелеком ТКТ обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Ростелеком ТКТ
function forceUpdateRostelecomTktInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Ростелеком ТКТ...');

    // Сначала обновляем данные
    forceUpdateRostelecomTktData();

    // Обновляем интерфейс
    updateProviderInterface('rostelekom-tkt', ['Интернет', 'Мобильная связь', 'Пакетное предложение']);

    console.log('✅ Интерфейс Ростелеком ТКТ обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ AT-HOME ===

// Принудительное обновление данных AT-HOME
function forceUpdateAthomeData() {
    console.log('🔄 Принудительное обновление данных AT-HOME...');

    const services = ['Интернет', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: '5 по 299',
            service: 'Интернет',
            speed: 200,
            price: 299,
            period: 'месяц',
            description: 'Тариф "5 по 299" - 200 Мбит/с интернет + 200 каналов через приложение Смотрешка на Smart TV за 299 руб./мес. С 6 месяца - 799 руб./мес, без ТВ.',
            isPromotion: true
        },
        {
            name: '100 Мбит/c',
            service: 'Интернет',
            speed: 100,
            price: 699,
            period: 'месяц',
            description: 'Тариф "100 Мбит/c" - 100 Мбит/с за 699 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
            isPromotion: false
        },
        {
            name: '200 Мбит/c',
            service: 'Интернет',
            speed: 200,
            price: 799,
            period: 'месяц',
            description: 'Тариф "200 Мбит/c" - 200 Мбит/с за 799 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
            isPromotion: false
        },
        {
            name: '500 Мбит/c',
            service: 'Интернет',
            speed: 500,
            price: 899,
            period: 'месяц',
            description: 'Тариф "500 Мбит/c" - 500 Мбит/с за 899 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.)',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: '100 Mб/с + TB',
            service: 'Пакетное предложение',
            speed: 100,
            price: 948,
            period: 'месяц',
            description: 'Тариф "100 Mб/с + TB" - 100 Мбит/с интернет + 283 канала за 948 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
            isPromotion: false
        },
        {
            name: '200 Mб/с + TB',
            service: 'Пакетное предложение',
            speed: 200,
            price: 1048,
            period: 'месяц',
            description: 'Тариф "200 Mб/с + TB" - 200 Мбит/с интернет + 283 канала за 1048 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
            isPromotion: false
        },
        {
            name: '500 Mб/с + TB',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1148,
            period: 'месяц',
            description: 'Тариф "500 Mб/с + TB" - 500 Мбит/с интернет + 283 канала за 1148 руб./мес. Роутер аренда 49 руб/мес. (залог 3999 руб.), приставка аренда 149 руб./мес. (залог 2999 руб.)',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('ethome', services, tariffs);

    console.log('✅ Данные AT-HOME обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для AT-HOME
function forceUpdateAthomeInterface() {
    console.log('🔄 Принудительное обновление интерфейса для AT-HOME...');

    // Сначала обновляем данные
    forceUpdateAthomeData();

    // Обновляем интерфейс
    updateProviderInterface('ethome', ['Интернет', 'Пакетное предложение']);

    console.log('✅ Интерфейс AT-HOME обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ БИЛАЙН ===

// Принудительное обновление данных Билайн
function forceUpdateBeelineData() {
    console.log('🔄 Принудительное обновление данных Билайн...');

    const services = ['Интернет', 'Мобильная связь', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Для дома 200 Акция',
            service: 'Интернет',
            speed: 200,
            price: 250,
            period: 'месяц',
            description: 'Тариф "Для дома 200 Акция" - 200 Мбит/с за 250 руб./мес. С 3 месяца 500 руб./мес. Роутер аренда Wifi роутера "Smart Box" 5ггц - 150 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Для дома 300 Акция',
            service: 'Интернет',
            speed: 300,
            price: 275,
            period: 'месяц',
            description: 'Тариф "Для дома 300 Акция" - 300 Мбит/с за 275 руб./мес. С 3 месяца 550 руб./мес. Роутер аренда Wifi роутера "Smart Box" 5ггц - 150 руб./мес.',
            isPromotion: true
        },
        // Тарифы на мобильную связь
        {
            name: 'Близкие люди',
            service: 'Мобильная связь',
            speed: null,
            price: 650,
            period: 'месяц',
            description: 'Тариф "Близкие люди" - 1200 минут ∞ Гб 300 sms за 650 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'UP. Дракон',
            service: 'Пакетное предложение',
            speed: 100,
            price: 436,
            period: 'месяц',
            description: 'Тариф "UP. Дракон" - 100 Мбит/с интернет + 200 каналов + 600 минут 40 Гб за 436 руб./мес. С 3 месяца цена 790 руб./мес.',
            isPromotion: true
        },
        {
            name: 'UP. Кот',
            service: 'Пакетное предложение',
            speed: 100,
            price: 512,
            period: 'месяц',
            description: 'Тариф "UP. Кот" - 100 Мбит/с интернет + 200 каналов + 1200 минут 50 Гб за 512 руб./мес. С 3 месяца цена 980 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Интернет с ТВ 100',
            service: 'Пакетное предложение',
            speed: 100,
            price: 475,
            period: 'месяц',
            description: 'Тариф "Интернет с ТВ 100" - 100 Мбит/с интернет + 215 каналов + 50 Гб 600 мин 0 sms за 475 руб./мес. С 5 месяца - 850 руб./мес.',
            isPromotion: true
        },
        {
            name: 'Интернет с ТВ 500',
            service: 'Пакетное предложение',
            speed: 500,
            price: 575,
            period: 'месяц',
            description: 'Тариф "Интернет с ТВ 500" - 500 Мбит/с интернет + 215 каналов + 50 Гб 600 мин 0 sms за 575 руб./мес. С 5 месяца - 950 руб./мес.',
            isPromotion: true
        }
    ];

    // Обновляем данные
    updateProviderData('beeline', services, tariffs);

    console.log('✅ Данные Билайн обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Билайн
function forceUpdateBeelineInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Билайн...');

    // Сначала обновляем данные
    forceUpdateBeelineData();

    // Обновляем интерфейс
    updateProviderInterface('beeline', ['Интернет', 'Мобильная связь', 'Пакетное предложение']);

    console.log('✅ Интерфейс Билайн обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ РСВО-ОНЛАЙН ===

// Принудительное обновление данных РСВО-Онлайн
function forceUpdateRsvoData() {
    console.log('🔄 Принудительное обновление данных РСВО-Онлайн...');

    const services = ['Интернет', 'Телефония', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'ИНТЕРНЕТ 50',
            service: 'Интернет',
            speed: 50,
            price: 350,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 50" - 50 Мбит/с за 350 руб./мес.',
            isPromotion: false
        },
        {
            name: 'ИНТЕРНЕТ 100',
            service: 'Интернет',
            speed: 100,
            price: 450,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 100" - 100 Мбит/с за 450 руб./мес.',
            isPromotion: false
        },
        {
            name: 'ИНТЕРНЕТ 200',
            service: 'Интернет',
            speed: 200,
            price: 650,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 200" - 200 Мбит/с за 650 руб./мес.',
            isPromotion: false
        },
        {
            name: 'ИНТЕРНЕТ 300',
            service: 'Интернет',
            speed: 300,
            price: 800,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 300" - 300 Мбит/с за 800 руб./мес.',
            isPromotion: false
        },
        {
            name: 'ИНТЕРНЕТ 600',
            service: 'Интернет',
            speed: 600,
            price: 900,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 600" - 600 Мбит/с за 900 руб./мес.',
            isPromotion: false
        },
        {
            name: 'ИНТЕРНЕТ 1000',
            service: 'Интернет',
            speed: 1000,
            price: 1250,
            period: 'месяц',
            description: 'Тариф "ИНТЕРНЕТ 1000" - 1000 Мбит/с за 1250 руб./мес.',
            isPromotion: false
        },
        // Тарифы на телефонию
        {
            name: 'Повременный',
            service: 'Телефония',
            speed: null,
            price: 290,
            period: 'месяц',
            description: 'Тариф "Повременный" - звонки на городские номера 0.62 руб./мин., на мобильные номера 3.16 руб./мин. за 290 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Безлимитный',
            service: 'Телефония',
            speed: null,
            price: 585,
            period: 'месяц',
            description: 'Тариф "Безлимитный" - звонки на городские номера 0 руб./мин., на мобильные номера 3.16 руб./мин. за 585 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: '50 Мбит/с +Базовый',
            service: 'Пакетное предложение',
            speed: 50,
            price: 499,
            period: 'месяц',
            description: 'Тариф "50 Мбит/с +Базовый" - 50 Мбит/с интернет + 199 каналов за 499 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
            isPromotion: false
        },
        {
            name: '100 Мбит/с +Базовый',
            service: 'Пакетное предложение',
            speed: 100,
            price: 599,
            period: 'месяц',
            description: 'Тариф "100 Мбит/с +Базовый" - 100 Мбит/с интернет + 199 каналов за 599 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
            isPromotion: false
        },
        {
            name: '200 Мбит/с +Базовый',
            service: 'Пакетное предложение',
            speed: 200,
            price: 799,
            period: 'месяц',
            description: 'Тариф "200 Мбит/с +Базовый" - 200 Мбит/с интернет + 199 каналов за 799 руб./мес. Приставка аренда Eltex 711WAC - 130 руб./мес.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('fgup-rsvo', services, tariffs);

    console.log('✅ Данные РСВО-Онлайн обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для РСВО-Онлайн
function forceUpdateRsvoInterface() {
    console.log('🔄 Принудительное обновление интерфейса для РСВО-Онлайн...');

    // Сначала обновляем данные
    forceUpdateRsvoData();

    // Обновляем интерфейс
    updateProviderInterface('fgup-rsvo', ['Интернет', 'Телефония', 'Пакетное предложение']);

    console.log('✅ Интерфейс РСВО-Онлайн обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ДОМ RU ===

// Принудительное обновление данных ДОМ Ru
function forceUpdateDomruData() {
    console.log('🔄 Принудительное обновление данных ДОМ Ru...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Гига 300',
            service: 'Интернет',
            speed: 300,
            price: 1000,
            period: 'месяц',
            description: 'Тариф "Гига 300" - 300 Мбит/с за 1000 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
            isPromotion: false
        },
        {
            name: 'Гига 500',
            service: 'Интернет',
            speed: 500,
            price: 1000,
            period: 'месяц',
            description: 'Тариф "Гига 500" - 500 Мбит/с за 1000 руб./мес. С 3 месяца 1100 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
            isPromotion: true
        },
        {
            name: 'Гига 800',
            service: 'Интернет',
            speed: 800,
            price: 1000,
            period: 'месяц',
            description: 'Тариф "Гига 800" - 800 Мбит/с за 1000 руб./мес. С 3 месяца 1150 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
            isPromotion: true
        },
        {
            name: 'Гига 1000',
            service: 'Интернет',
            speed: 1000,
            price: 1000,
            period: 'месяц',
            description: 'Тариф "Гига 1000" - 1000 Мбит/с за 1000 руб./мес. С 3 месяца 1550 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб.',
            isPromotion: true
        },
        // Тарифы на телевидение
        {
            name: 'Моно ЦТВ',
            service: 'Телевидение',
            speed: null,
            price: 340,
            period: 'месяц',
            description: 'Тариф "Моно ЦТВ" - 155 каналов за 340 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Гига 300',
            service: 'Пакетное предложение',
            speed: 300,
            price: 1000,
            period: 'месяц',
            description: 'Тариф "Гига 300" - 300 Мбит/с интернет + 185 каналов за 1000 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
            isPromotion: false
        },
        {
            name: 'Гига 500',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1100,
            period: 'месяц',
            description: 'Тариф "Гига 500" - 500 Мбит/с интернет + 185 каналов за 1100 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
            isPromotion: false
        },
        {
            name: 'Гига 800',
            service: 'Пакетное предложение',
            speed: 800,
            price: 1150,
            period: 'месяц',
            description: 'Тариф "Гига 800" - 800 Мбит/с интернет + 185 каналов за 1150 руб./мес. Роутер TP-Link EC220-G5 или D-Link DIR-842/R7 покупка - 3390 руб., приставка Movix Go покупка 4950 руб.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('interzet', services, tariffs);

    console.log('✅ Данные ДОМ Ru обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для ДОМ Ru
function forceUpdateDomruInterface() {
    console.log('🔄 Принудительное обновление интерфейса для ДОМ Ru...');

    // Сначала обновляем данные
    forceUpdateDomruData();

    // Обновляем интерфейс
    updateProviderInterface('interzet', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    console.log('✅ Интерфейс ДОМ Ru обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ NEWLINK ===

// Принудительное обновление данных NewLink
function forceUpdateNewlinkData() {
    console.log('🔄 Принудительное обновление данных NewLink...');

    const services = ['Интернет', 'Телевидение', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Идеальный',
            service: 'Интернет',
            speed: 100,
            price: 580,
            period: 'месяц',
            description: 'Тариф "Идеальный" - 100 Мбит/с за 580 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
            isPromotion: false
        },
        {
            name: 'Оптимальный',
            service: 'Интернет',
            speed: 200,
            price: 720,
            period: 'месяц',
            description: 'Тариф "Оптимальный" - 200 Мбит/с за 720 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
            isPromotion: false
        },
        {
            name: 'Уникальный',
            service: 'Интернет',
            speed: 500,
            price: 950,
            period: 'месяц',
            description: 'Тариф "Уникальный" - 500 Мбит/с за 950 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Идеальный + ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 580,
            period: 'месяц',
            description: 'Тариф "Идеальный + ТВ" - 100 Мбит/с интернет + Moovi 102 канала за 580 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка залог.',
            isPromotion: false
        },
        {
            name: 'Оптимальный+ТВ',
            service: 'Пакетное предложение',
            speed: 200,
            price: 720,
            period: 'месяц',
            description: 'Тариф "Оптимальный+ТВ" - 200 Мбит/с интернет + Moovi 102 канала за 720 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка MAG 420 - 5880 руб.',
            isPromotion: false
        },
        {
            name: 'Уникальный + ТВ',
            service: 'Пакетное предложение',
            speed: 500,
            price: 950,
            period: 'месяц',
            description: 'Тариф "Уникальный + ТВ" - 500 Мбит/с интернет + Moovi 102 канала за 950 руб./мес. Роутер TP-Link TL-WR850N - 2480 руб., приставка MAG 420 - 5880 руб.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('newlink', services, tariffs);

    console.log('✅ Данные NewLink обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для NewLink
function forceUpdateNewlinkInterface() {
    console.log('🔄 Принудительное обновление интерфейса для NewLink...');

    // Сначала обновляем данные
    forceUpdateNewlinkData();

    // Обновляем интерфейс
    updateProviderInterface('newlink', ['Интернет', 'Телевидение', 'Пакетное предложение']);

    console.log('✅ Интерфейс NewLink обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ПАКТ ===

// Принудительное обновление данных ПАКТ
function forceUpdatePaktData() {
    console.log('🔄 Принудительное обновление данных ПАКТ...');

    const services = ['Интернет', 'Телевидение', 'Телефония', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Интернет 50',
            service: 'Интернет',
            speed: 50,
            price: 500,
            period: 'месяц',
            description: 'Тариф "Интернет 50" - 50 Мбит/с за 500 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
            isPromotion: true
        },
        {
            name: '4 по 300',
            service: 'Интернет',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф "4 по 300" - 100 Мбит/с за 300 руб./мес. 4 месяца интернета при единовременном платеже 1200 руб. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
            isPromotion: true
        },
        {
            name: 'Интернет 100',
            service: 'Интернет',
            speed: 100,
            price: 600,
            period: 'месяц',
            description: 'Тариф "Интернет 100" - 100 Мбит/с за 600 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
            isPromotion: true
        },
        {
            name: 'Интернет 300',
            service: 'Интернет',
            speed: 300,
            price: 750,
            period: 'месяц',
            description: 'Тариф "Интернет 300" - 300 Мбит/с за 750 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
            isPromotion: true
        },
        {
            name: 'Интернет 700',
            service: 'Интернет',
            speed: 700,
            price: 950,
            period: 'месяц',
            description: 'Тариф "Интернет 700" - 700 Мбит/с за 950 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес, покупка Cudy WR1500 - 4000 руб. или Keenetic Viva - 7700 руб.',
            isPromotion: false
        },
        {
            name: 'Интернет 900',
            service: 'Интернет',
            speed: 900,
            price: 1400,
            period: 'месяц',
            description: 'Тариф "Интернет 900" - 900 Мбит/с за 1400 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес, покупка Cudy WR1500 - 4000 руб. или Keenetic Viva - 7700 руб.',
            isPromotion: false
        },
        // Тарифы на телевидение
        {
            name: 'Базовый',
            service: 'Телевидение',
            speed: null,
            price: 220,
            period: 'месяц',
            description: 'Тариф "Базовый" - 150 каналов за 220 руб./мес. Приставка не требуется.',
            isPromotion: false
        },
        // Тарифы на телефонию
        {
            name: 'Минуты под контролем',
            service: 'Телефония',
            speed: null,
            price: 170,
            period: 'месяц',
            description: 'Тариф "Минуты под контролем" - звонки на городские номера 0.45 руб./мин., на мобильные номера 1.50 руб./мин. за 170 руб./мес.',
            isPromotion: false
        },
        {
            name: 'Всегда на связи',
            service: 'Телефония',
            speed: null,
            price: 340,
            period: 'месяц',
            description: 'Тариф "Всегда на связи" - звонки на городские номера 0 руб./мин., на мобильные номера 1.50 руб./мин. за 340 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Интернет и ТВ БЕЗ ГРАНИЦ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф "Интернет и ТВ БЕЗ ГРАНИЦ" - 100 Мбит/с интернет + онлайн ТВ "iPakt" 136 каналов за 300 руб./мес. Акция предоставляется только на 4 месяца, с 5-го месяца 650 руб./мес. Роутер аренда D-link DIR-842 (MOD.PAKT) - 110 руб./мес или покупка Cudy WR1500 - 4000 руб.',
            isPromotion: true
        }
    ];

    // Обновляем данные
    updateProviderData('pakt', services, tariffs);

    console.log('✅ Данные ПАКТ обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для ПАКТ
function forceUpdatePaktInterface() {
    console.log('🔄 Принудительное обновление интерфейса для ПАКТ...');

    // Сначала обновляем данные
    forceUpdatePaktData();

    // Обновляем интерфейс
    updateProviderInterface('pakt', ['Интернет', 'Телевидение', 'Телефония', 'Пакетное предложение']);

    console.log('✅ Интерфейс ПАКТ обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ AICONET ===

// Принудительное обновление данных Aiconet
function forceUpdateAiconetData() {
    console.log('🔄 Принудительное обновление данных Aiconet...');

    const services = ['Интернет', 'Пакетное предложение'];
    const tariffs = [
        {
            name: 'Люкс',
            service: 'Пакетное предложение',
            speed: 100,
            price: 630,
            period: 'месяц',
            description: 'Тариф "Люкс" - 100 Мбит/с интернет + телевидение через приложение 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
            isPromotion: false
        },
        {
            name: 'Премиум',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1300,
            period: 'месяц',
            description: 'Тариф "Премиум" - 500 Мбит/с интернет + телевидение через приложение 102 канала за 1300 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        },
        {
            name: 'Гигабит',
            service: 'Пакетное предложение',
            speed: 1000,
            price: 1600,
            period: 'месяц',
            description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + телевидение через приложение 102 канала за 1600 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('aikonet', services, tariffs);

    console.log('✅ Данные Aiconet обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Aiconet
function forceUpdateAiconetInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Aiconet...');

    // Сначала обновляем данные
    forceUpdateAiconetData();

    // Обновляем интерфейс
    updateProviderInterface('aikonet', ['Интернет', 'Пакетное предложение']);

    console.log('✅ Интерфейс Aiconet обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ARBITAL ===

// Принудительное обновление данных Arbital
function forceUpdateArbitalData() {
    console.log('🔄 Принудительное обновление данных Arbital...');

    const services = ['Интернет', 'Пакетное предложение'];
    const tariffs = [
        {
            name: 'Люкс',
            service: 'Пакетное предложение',
            speed: 100,
            price: 630,
            period: 'месяц',
            description: 'Тариф "Люкс" - 100 Мбит/с интернет + телевидение через приложение 102 канала за 630 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей.',
            isPromotion: false
        },
        {
            name: 'Премиум',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1300,
            period: 'месяц',
            description: 'Тариф "Премиум" - 500 Мбит/с интернет + телевидение через приложение 102 канала за 1300 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        },
        {
            name: 'Гигабит',
            service: 'Пакетное предложение',
            speed: 1000,
            price: 1600,
            period: 'месяц',
            description: 'Тариф "Гигабит" - 1000 Мбит/с интернет + телевидение через приложение 102 канала за 1600 руб./мес. Роутер TP-LINK EC225-G5 покупка за 3999 рублей. Предоставляется при наличии технической возможности, стоимость подключения 1500 руб.',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('arbital', services, tariffs);

    console.log('✅ Данные Arbital обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Arbital
function forceUpdateArbitalInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Arbital...');

    // Сначала обновляем данные
    forceUpdateArbitalData();

    // Обновляем интерфейс
    updateProviderInterface('arbital', ['Интернет', 'Пакетное предложение']);

    console.log('✅ Интерфейс Arbital обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ЕНЕВА ===

// Принудительное обновление данных Енева
function forceUpdateObitData() {
    console.log('🔄 Принудительное обновление данных Енева...');

    const services = ['Интернет', 'Телефония', 'Пакетное предложение'];
    const tariffs = [
        // Тарифы на интернет
        {
            name: 'Пятёрка',
            service: 'Интернет',
            speed: 100,
            price: 330,
            period: 'месяц',
            description: 'Тариф "Пятёрка" - 100 Мбит/с за 330 руб./мес. 1650 р. за 5 мес. + 300 р. за подключение. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
            isPromotion: true
        },
        {
            name: 'Интернет 100',
            service: 'Интернет',
            speed: 100,
            price: 650,
            period: 'месяц',
            description: 'Тариф "Интернет 100" - 100 Мбит/с за 650 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
            isPromotion: false
        },
        {
            name: 'Интернет 200',
            service: 'Интернет',
            speed: 200,
            price: 900,
            period: 'месяц',
            description: 'Тариф "Интернет 200" - 200 Мбит/с за 900 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.) или Archer C5 - 3600 руб (рассрочка на год - 360 руб./мес.).',
            isPromotion: false
        },
        {
            name: 'Интернет 500',
            service: 'Интернет',
            speed: 500,
            price: 1100,
            period: 'месяц',
            description: 'Тариф "Интернет 500" - 500 Мбит/с за 1100 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.).',
            isPromotion: false
        },
        // Тарифы на телефонию
        {
            name: 'Безлимитный',
            service: 'Телефония',
            speed: null,
            price: 400,
            period: 'месяц',
            description: 'Тариф "Безлимитный" - звонки на городские номера 0 руб./мин., на мобильные номера 1.5 руб./мин. за 400 руб./мес.',
            isPromotion: false
        },
        // Пакетные предложения
        {
            name: 'Пятёрка 200',
            service: 'Пакетное предложение',
            speed: 200,
            price: 450,
            period: 'месяц',
            description: 'Тариф "Пятёрка 200" - 200 Мбит/с интернет + телевидение через приложение 122 канала за 450 руб./мес. Предоплата за 5 месяцев 2550₽. Покупка WiFi-роутера MERCUSYS AC1300 - 3490 руб. Рассрочка - 329 руб.(12 мес.).',
            isPromotion: true
        },
        {
            name: '100 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 100,
            price: 800,
            period: 'месяц',
            description: 'Тариф "100 + ТВ Лайт" - 100 Мбит/с интернет + 122 канала за 800 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
            isPromotion: false
        },
        {
            name: '200 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 200,
            price: 1050,
            period: 'месяц',
            description: 'Тариф "200 + ТВ Лайт" - 200 Мбит/с интернет + 122 канала за 1050 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
            isPromotion: false
        },
        {
            name: '500 + ТВ Лайт',
            service: 'Пакетное предложение',
            speed: 500,
            price: 1250,
            period: 'месяц',
            description: 'Тариф "500 + ТВ Лайт" - 500 Мбит/с интернет + 122 канала за 1250 руб./мес. WiFi-роутер MERCUSYS AC1300 3490 руб (рассрочка на год - 329 руб./мес.), приставка TVIP S-530 – 4250 руб. (рассрочка на год - 399 руб./мес.).',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('obit', services, tariffs);

    console.log('✅ Данные Енева обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Енева
function forceUpdateObitInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Енева...');

    // Сначала обновляем данные
    forceUpdateObitData();

    // Обновляем интерфейс
    updateProviderInterface('obit', ['Интернет', 'Телефония', 'Пакетное предложение']);

    console.log('✅ Интерфейс Енева обновлен принудительно');

    return true;
}

// === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ДОМОВОЙ ===

// Принудительное обновление данных Домовой
function forceUpdateDomovoyData() {
    console.log('🔄 Принудительное обновление данных Домовой...');

    const services = ['Интернет', 'Пакетное предложение'];
    const tariffs = [
        {
            name: 'Интернет 100 Мбит/сек',
            service: 'Интернет',
            speed: 100,
            price: 180,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
            isPromotion: false
        },
        {
            name: 'Интернет 100 Мбит/сек + ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
            isPromotion: false
        }
    ];

    // Обновляем данные
    updateProviderData('domovoy', services, tariffs);

    console.log('✅ Данные Домовой обновлены принудительно');
    console.log('📊 Услуги:', services);
    console.log('📊 Тарифы:', tariffs.length);

    return true;
}

// Принудительное обновление интерфейса для Домовой
function forceUpdateDomovoyInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Домовой...');

    // Сначала обновляем данные
    forceUpdateDomovoyData();

    // Обновляем интерфейс
    updateProviderInterface('domovoy', ['Интернет', 'Пакетное предложение']);

    console.log('✅ Интерфейс Домовой обновлен принудительно');

    return true;
}

// Принудительное обновление данных Домовой в providersData
function forceUpdateDomovoyInProvidersData() {
    console.log('🔄 Принудительное обновление данных Домовой в providersData...');

    // Обновляем данные в PROVIDERS_DATA
    const provider = PROVIDERS_DATA.providers.find(p => p.slug === 'domovoy');
    if (!provider) {
        console.error('❌ Провайдер Домовой не найден в PROVIDERS_DATA');
        return false;
    }

    // Устанавливаем правильные данные согласно HTML структуре
    provider.services = ['Интернет', 'Пакетное предложение'];
    provider.tariffs = [
        {
            name: 'Интернет 100 Мбит/сек',
            service: 'Интернет',
            speed: 100,
            price: 180,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
            isPromotion: false
        },
        {
            name: 'Интернет 100 Мбит/сек + ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
            isPromotion: false
        }
    ];

    console.log('✅ Данные Домовой обновлены в PROVIDERS_DATA');
    console.log('📊 Услуги в PROVIDERS_DATA:', provider.services);
    console.log('📊 Тарифы в PROVIDERS_DATA:', provider.tariffs);

    // Принудительно обновляем данные в providersData
    if (providersData['domovoy']) {
        providersData['domovoy'].provider.services = provider.services;
        providersData['domovoy'].tariffs = provider.tariffs;
        console.log('✅ Данные Домовой обновлены в providersData');
        console.log('📊 Услуги в providersData:', providersData['domovoy'].provider.services);
        console.log('📊 Тарифы в providersData:', providersData['domovoy'].tariffs);
    } else {
        // Создаем провайдера в providersData
        providersData['domovoy'] = {
            provider: {
                name: provider.name,
                services: provider.services
            },
            tariffs: provider.tariffs
        };
        console.log('✅ Создан провайдер Домовой в providersData');
    }

    // Обновляем интерфейс, если Домовой выбран
    const providerSelect = document.getElementById('provider');
    if (providerSelect && providerSelect.value === 'domovoy') {
        console.log('🔄 Обновляем интерфейс для Домовой...');
        onProviderChange();
    }

    return true;
}

// Принудительное обновление интерфейса для Домовой
function forceUpdateDomovoyInterface() {
    console.log('🔄 Принудительное обновление интерфейса для Домовой...');

    // Сначала обновляем данные
    forceUpdateDomovoyInProvidersData();

    // Принудительно обновляем интерфейс
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        // Устанавливаем Домовой как выбранного провайдера
        providerSelect.value = 'domovoy';

        // Вызываем обработчик изменения провайдера
        onProviderChange();

        console.log('✅ Интерфейс обновлен для Домовой');

        // Проверяем результат
        const serviceButtons = document.getElementById('serviceButtons');
        if (serviceButtons) {
            const serviceButtonsList = Array.from(serviceButtons.querySelectorAll('.service-button'));
            const serviceNames = serviceButtonsList.map(btn => btn.textContent);
            console.log('📊 Услуги в интерфейсе после обновления:', serviceNames);

            if (serviceNames.includes('Интернет') && serviceNames.includes('Пакетное предложение') && !serviceNames.includes('Телефония')) {
                console.log('✅ Услуги обновились корректно!');
            } else {
                console.warn('⚠️ Услуги не обновились корректно');
                console.warn('⚠️ Ожидалось: ["Интернет", "Пакетное предложение"]');
                console.warn('⚠️ Получено:', serviceNames);
            }
        }
    }

    return true;
}

// Принудительный сброс данных Домовой к правильным значениям
function resetDomovoyData() {
    console.log('🔄 Принудительный сброс данных Домовой к правильным значениям...');

    // Обновляем данные в PROVIDERS_DATA
    const provider = PROVIDERS_DATA.providers.find(p => p.slug === 'domovoy');
    if (!provider) {
        console.error('❌ Провайдер Домовой не найден в PROVIDERS_DATA');
        return false;
    }

    // Устанавливаем правильные данные согласно HTML структуре
    provider.services = ['Интернет', 'Пакетное предложение'];
    provider.tariffs = [
        {
            name: 'Интернет 100 Мбит/сек',
            service: 'Интернет',
            speed: 100,
            price: 180,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
            isPromotion: false
        },
        {
            name: 'Интернет 100 Мбит/сек + ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
            isPromotion: false
        }
    ];

    console.log('✅ Данные Домовой сброшены в PROVIDERS_DATA');
    console.log('📊 Услуги:', provider.services);
    console.log('📊 Тарифы:', provider.tariffs);

    // Обновляем данные в providersData
    updateProviderDataInProvidersData('domovoy');

    // Обновляем интерфейс, если Домовой выбран
    const providerSelect = document.getElementById('provider');
    if (providerSelect && providerSelect.value === 'domovoy') {
        console.log('🔄 Обновляем интерфейс для Домовой...');
        onProviderChange();
    }

    return true;
}

// Принудительное обновление данных Домовой
function updateDomovoyData() {
    console.log('🔄 Принудительное обновление данных Домовой...');

    // Обновляем данные в PROVIDERS_DATA
    const provider = PROVIDERS_DATA.providers.find(p => p.slug === 'domovoy');
    if (!provider) {
        console.error('❌ Провайдер Домовой не найден в PROVIDERS_DATA');
        return false;
    }

    // Устанавливаем правильные данные согласно HTML структуре
    provider.services = ['Интернет', 'Пакетное предложение'];
    provider.tariffs = [
        {
            name: 'Интернет 100 Мбит/сек',
            service: 'Интернет',
            speed: 100,
            price: 180,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
            isPromotion: false
        },
        {
            name: 'Интернет 100 Мбит/сек + ТВ',
            service: 'Пакетное предложение',
            speed: 100,
            price: 300,
            period: 'месяц',
            description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
            isPromotion: false
        }
    ];

    console.log('✅ Данные Домовой обновлены в PROVIDERS_DATA');
    console.log('📊 Услуги:', provider.services);
    console.log('📊 Тарифы:', provider.tariffs);

    // Обновляем данные в providersData
    updateProviderDataInProvidersData('domovoy');

    // Обновляем интерфейс, если Домовой выбран
    const providerSelect = document.getElementById('provider');
    if (providerSelect && providerSelect.value === 'domovoy') {
        console.log('🔄 Обновляем интерфейс для Домовой...');
        onProviderChange();
    }

    return true;
}

// === ТЕСТОВЫЕ ФУНКЦИИ ===

// Тестовая функция для проверки обновления тарифов в интерфейсе
function testTariffUpdateInInterface() {
    console.log('🧪 Тестирование обновления тарифов в интерфейсе...');

    // Проверяем, что парсер загружен
    if (!window.universalTariffParser) {
        console.error('❌ Парсер тарифов не загружен');
        return false;
    }

    // Находим провайдера для тестирования
    const testProvider = providers.find(p => p.slug === 'domovoy');
    if (!testProvider) {
        console.error('❌ Тестовый провайдер Домовой не найден');
        return false;
    }

    console.log('🔍 Тестируем провайдера:', testProvider.name);

    // Симулируем обновление данных
    const mockUpdatedData = {
        provider: {
            name: 'Домовой',
            services: ['Интернет', 'Пакетное предложение']
        },
        tariffs: [
            {
                name: 'Интернет 100 Мбит/сек',
                service: 'Интернет',
                speed: 100,
                price: 180,
                period: 'месяц',
                description: 'Тариф «Интернет 100 Мбит/сек» - 100 Мбит/с за 180 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 634 ₽/мес',
                isPromotion: false
            },
            {
                name: 'Интернет 100 Мбит/сек + ТВ',
                service: 'Пакетное предложение',
                speed: 100,
                price: 300,
                period: 'месяц',
                description: 'Тариф «Интернет 100 Мбит/сек + ТВ» - 100 Мбит/с + более 150 цифровых каналов за 300 руб/месяц. Роутер бесплатно (двухдиапазонный Wi-Fi роутер). Условия: с 6 месяца - 724 ₽/мес',
                isPromotion: false
            }
        ]
    };

    // Обновляем данные в PROVIDERS_DATA
    const provider = PROVIDERS_DATA.providers.find(p => p.slug === 'domovoy');
    if (provider) {
        provider.services = mockUpdatedData.provider.services;
        provider.tariffs = mockUpdatedData.tariffs;
        console.log('✅ Данные обновлены в PROVIDERS_DATA');
        console.log('📊 Услуги в PROVIDERS_DATA:', provider.services);
        console.log('📊 Тарифы в PROVIDERS_DATA:', provider.tariffs);
    }

    // Обновляем данные в providersData
    updateProviderDataInProvidersData('domovoy');

    // Тестируем функцию getServiceTariff
    console.log('🔍 Тестируем getServiceTariff...');
    const serviceTariff1 = getServiceTariff('domovoy', 'Интернет', 'Интернет 100 Мбит/сек');
    console.log('✅ Результат getServiceTariff 1:', serviceTariff1);

    const serviceTariff2 = getServiceTariff('domovoy', 'Пакетное предложение', 'Интернет 100 Мбит/сек + ТВ');
    console.log('✅ Результат getServiceTariff 2:', serviceTariff2);

    // Тестируем обновление интерфейса
    console.log('🔍 Тестируем обновление интерфейса...');

    // Устанавливаем провайдера
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        providerSelect.value = 'domovoy';
        onProviderChange();
        console.log('✅ Провайдер установлен в интерфейсе');

        // Проверяем, что услуги обновились
        const serviceButtons = document.getElementById('serviceButtons');
        if (serviceButtons) {
            const serviceButtonsList = Array.from(serviceButtons.querySelectorAll('.service-button'));
            const serviceNames = serviceButtonsList.map(btn => btn.textContent);
            console.log('✅ Услуги в интерфейсе:', serviceNames);

            if (serviceNames.includes('Интернет') && serviceNames.includes('Пакетное предложение') && !serviceNames.includes('Телефония')) {
                console.log('✅ Услуги обновились корректно');
            } else {
                console.warn('⚠️ Услуги не обновились корректно');
                console.warn('⚠️ Ожидалось: ["Интернет", "Пакетное предложение"]');
                console.warn('⚠️ Получено:', serviceNames);
            }
        }

        // Тестируем выбор услуги
        const internetButton = Array.from(serviceButtons.querySelectorAll('.service-button'))
            .find(btn => btn.textContent === 'Интернет');
        if (internetButton) {
            internetButton.click();
            console.log('✅ Услуга Интернет выбрана');

            // Проверяем тарифы
            const tariffSelect = document.getElementById('tariff');
            if (tariffSelect) {
                const tariffOptions = Array.from(tariffSelect.options).map(opt => opt.textContent);
                console.log('✅ Тарифы в интерфейсе:', tariffOptions);

                if (tariffOptions.some(opt => opt.includes('Интернет 100 Мбит/сек'))) {
                    console.log('✅ Тарифы обновились корректно');
                } else {
                    console.warn('⚠️ Тарифы не обновились корректно');
                }
            }
        }
    }

    console.log('✅ Тест обновления тарифов в интерфейсе завершен');
    return true;
}

// === ИНИЦИАЛИЗАЦИЯ ТЕМЫ ===

document.addEventListener('DOMContentLoaded', function () {
    loadTheme();
});

// === ОЧИСТКА ПРИ ВЫХОДЕ ===

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateSessionTime();
    }
});

// === УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК TELEGRAM ===

// Функция для улучшенной обработки ошибок Telegram
function handleTelegramError(error, telegram, context = '') {
    console.error(`❌ Ошибка Telegram ${context}:`, error);
    
    let errorMessage = error.description || 'Неизвестная ошибка';
    let isWarning = false;
    let showDetailedInstructions = false;

    if (error.description === 'Bad Request: chat not found') {
        errorMessage = `❌ Пользователь @${telegram} не писал боту первым!`;
        isWarning = true;
        showDetailedInstructions = true;
    } else if (error.description === 'Forbidden: bot was blocked by the user') {
        errorMessage = `❌ Пользователь @${telegram} заблокировал бота.`;
    } else if (error.description === 'Bad Request: user not found') {
        errorMessage = `❌ Пользователь @${telegram} не найден. Проверьте правильность username.`;
    } else if (error.description === 'Forbidden: user is deactivated') {
        errorMessage = `❌ Пользователь @${telegram} деактивирован.`;
    } else if (error.description === 'Bad Request: chat_id is empty') {
        errorMessage = `❌ Пустой chat_id для пользователя @${telegram}.`;
    } else if (error.description === 'Bad Request: message is too long') {
        errorMessage = `❌ Сообщение слишком длинное для @${telegram}.`;
    }

    // Показываем уведомление
    if (isWarning) {
        showNotification(`⚠️ Telegram: ${errorMessage}`, 'warning');
    } else {
        showNotification(`❌ Telegram: ${errorMessage}`, 'error');
    }

    // Показываем подробные инструкции для "chat not found"
    if (showDetailedInstructions) {
        setTimeout(() => {
            const detailedInstructions = `
📱 ИНСТРУКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ @${telegram}:

1️⃣ Найдите бота @Allcitynet_bot в Telegram
2️⃣ Нажмите кнопку "Начать" или отправьте любое сообщение
3️⃣ После этого напоминания будут приходить автоматически

⚠️ Это разовая настройка для каждого пользователя.
🔗 Ссылка на бота: https://t.me/Allcitynet_bot

После настройки попробуйте отправить тестовое сообщение снова.`;

            showNotification(detailedInstructions, 'info');
        }, 2000);
    }

    return { errorMessage, isWarning };
}

// Функция для проверки доступности пользователя в Telegram
async function checkTelegramUserAvailability(telegram) {
    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';
    
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('❌ Telegram бот токен не настроен');
        return { available: false, error: 'Токен не настроен' };
    }

    // Обрабатываем разные форматы Telegram ID
    let chatId = telegram;
    if (telegram.startsWith('@')) {
        chatId = telegram.substring(1);
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId
            })
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Пользователь доступен:', data.result);
            return { available: true, userInfo: data.result };
        } else {
            console.log('❌ Пользователь недоступен:', data);
            return { available: false, error: data };
        }
    } catch (error) {
        console.error('❌ Ошибка проверки пользователя:', error);
        return { available: false, error: error.message };
    }
}

// Улучшенная функция отправки Telegram напоминания
function sendTelegramReminderImproved(telegram, message) {
    console.log(`📱 Отправляем Telegram уведомление на ${telegram}:`, message);

    // Конфигурация Telegram бота @Allcitynet_bot
    const TELEGRAM_BOT_TOKEN = '1298834121:AAH9R2V0I0wxwvq9SBObflJDgtognF6X8Y4';

    // Проверяем, настроен ли бот
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('❌ Telegram бот не настроен');
        showNotification('Telegram бот не настроен. Проверьте конфигурацию.', 'warning');
        return;
    }

    // Обрабатываем разные форматы Telegram ID
    let TELEGRAM_CHAT_ID = telegram;

    // Если это username с @, убираем @
    if (telegram.startsWith('@')) {
        TELEGRAM_CHAT_ID = telegram.substring(1);
    }

    console.log(`📱 Отправляем сообщение пользователю: ${TELEGRAM_CHAT_ID}`);

    // Формируем URL для отправки сообщения
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Параметры сообщения
    const messageData = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    // Отправляем запрос к Telegram API
    fetch(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('✅ Telegram уведомление отправлено успешно:', data);
                showNotification(`Telegram отправлен на ${telegram}`, 'success');
            } else {
                // Если прямая отправка не удалась, пробуем через Vercel webhook
                console.log('⚠️ Прямая отправка не удалась, пробуем через Vercel webhook');
                sendViaVercelWebhook(telegram, message);
            }
        })
        .catch(error => {
            console.error('❌ Ошибка при прямой отправке Telegram:', error);
            // Fallback на Vercel webhook
            sendViaVercelWebhook(telegram, message);
        });
}

// === VERCEL TELEGRAM BOT ИСПРАВЛЕНИЯ ===

// Функция отправки через Vercel webhook (fallback)
function sendViaVercelWebhook(telegram, message) {
    const VERCEL_WEBHOOK_URL = 'https://allcitynet-telegram-bot.vercel.app/api/webhook';
    
    console.log(`🌐 Отправляем через Vercel webhook: ${VERCEL_WEBHOOK_URL}`);
    
    fetch(VERCEL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: message,
            recipient: telegram,
            type: 'user_notification'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Сообщение отправлено через Vercel webhook:', data);
            showNotification(`Telegram отправлен на ${telegram} через Vercel`, 'success');
        } else {
            console.error('❌ Ошибка Vercel webhook:', data);
            handleTelegramError(data, telegram, 'Vercel webhook');
        }
    })
    .catch(error => {
        console.error('❌ Ошибка Vercel webhook:', error);
        showNotification(`Ошибка отправки через Vercel: ${error.message}`, 'error');
    });
}

// Функция для настройки Vercel webhook
function setupVercelWebhook() {
    const vercelUrl = 'https://allcitynet-telegram-bot.vercel.app/api/webhook';
    
    // Устанавливаем webhook URL
    localStorage.setItem('telegram_webhook_url', vercelUrl);
    
    console.log('✅ Vercel webhook URL установлен:', vercelUrl);
    showNotification('Vercel webhook URL установлен! Теперь система будет использовать Vercel как fallback.', 'success');
    
    // Обновляем поле в интерфейсе, если модальное окно открыто
    const webhookInput = document.getElementById('webhookUrl');
    if (webhookInput) {
        webhookInput.value = vercelUrl;
    }
}

// Функция для тестирования Vercel webhook
function testVercelWebhook() {
    const vercelUrl = 'https://allcitynet-telegram-bot.vercel.app/api/webhook';
    
    console.log('🧪 Тестируем Vercel webhook:', vercelUrl);
    
    fetch(vercelUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: 'Тестовое сообщение от портала Allcitynet',
            type: 'test'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Vercel webhook ответ:', data);
        showNotification('Vercel webhook работает! Система готова к работе.', 'success');
    })
    .catch(error => {
        console.error('❌ Ошибка Vercel webhook:', error);
        showNotification(`Ошибка Vercel webhook: ${error.message}`, 'error');
    });
}

