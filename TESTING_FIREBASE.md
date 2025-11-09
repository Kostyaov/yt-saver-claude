# 🧪 Тестування Firebase версії розширення

## 📋 Підготовка до тестування

### Крок 1: Переключення на Firebase гілку

```bash
# Переключитися на Firebase гілку
git checkout claude/yt-saver-ff-011CUvZj39HXCfeFq2nvhizf

# Перевірити що ви на правильній гілці
git branch --show-current
```

Ви побачите: `claude/yt-saver-ff-011CUvZj39HXCfeFq2nvhizf`

### Крок 2: Налаштування Firebase (ОБОВ'ЯЗКОВО!)

**⚠️ Важливо:** Firebase версія НЕ працюватиме без налаштування Firebase проекту!

1. Відкрийте та виконайте всі кроки з [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Головне - отримайте Firebase конфігурацію та вставте її в `extension/utils/firebase-config.js`
3. Налаштуйте Security Rules у Firestore

**Швидкий чеклист:**
- [ ] Створено Firebase проект
- [ ] Увімкнено Firestore Database
- [ ] Налаштовано Security Rules
- [ ] Оновлено `firebase-config.js` з вашими даними
- [ ] Скопійовано Web API Key

---

## 🌐 Сумісність з браузерами

### ✅ Повністю підтримуються (Chromium-based):

| Браузер | Підтримка | Версія | Примітки |
|---------|-----------|--------|----------|
| **Google Chrome** | ✅ Так | v88+ | Основний браузер для розробки |
| **Microsoft Edge** | ✅ Так | v88+ | Chromium-based, працює ідентично |
| **Brave** | ✅ Так | v1.20+ | Chromium-based, повна підтримка |
| **Opera** | ✅ Так | v74+ | Chromium-based, працює без змін |
| **Vivaldi** | ✅ Так | v3.6+ | Chromium-based, підтримка Manifest V3 |

### ⚠️ Потребує адаптації:

| Браузер | Підтримка | Що потрібно змінити |
|---------|-----------|---------------------|
| **Firefox** | ⚠️ Частково | Потрібна адаптація для Manifest V2/V3 Firefox |
| **Safari** | ⚠️ Складно | Потрібна повна переробка під Safari Extensions |

### 🔍 Деталі по браузерам:

#### Chrome / Edge / Brave / Opera (Chromium)
**Статус:** Працює "з коробки" ✅

Всі ці браузери використовують Chromium і підтримують:
- Manifest V3
- Chrome Extensions API
- Service Workers
- Chrome Storage API
- Fetch API для Firebase REST

**Різниці:** Немає. Код працює однаково.

#### Firefox
**Статус:** Потребує змін ⚠️

Проблеми:
1. Firefox має власну реалізацію Manifest V3 (ще не повна)
2. Використовує `browser.*` замість `chrome.*` API
3. Деякі API працюють інакше

**Рішення для Firefox:**
- Використати WebExtension Polyfill
- Або підтримувати Manifest V2 для Firefox
- Змінити `chrome.storage` на `browser.storage`

#### Safari
**Статус:** Потребує переробки ⚠️

Safari використує абсолютно інший формат розширень з 2021 року.

---

## 🚀 Тестування в Chrome/Edge/Brave

### Крок 1: Завантаження розширення

#### Для Chrome:

1. Відкрийте Chrome
2. Перейдіть до: `chrome://extensions/`
3. Увімкніть "Developer mode" (правий верхній кут)
4. Натисніть "Load unpacked" (Завантажити розпаковане)
5. Виберіть папку `extension` з вашого проекту
6. Розширення з'явиться в списку

#### Для Microsoft Edge:

1. Відкрийте Edge
2. Перейдіть до: `edge://extensions/`
3. Увімкніть "Developer mode"
4. Натисніть "Load unpacked"
5. Виберіть папку `extension`

#### Для Brave:

1. Відкрийте Brave
2. Перейдіть до: `brave://extensions/`
3. Увімкніть "Developer mode"
4. Натисніть "Load unpacked"
5. Виберіть папку `extension`

#### Для Opera:

1. Відкрийте Opera
2. Перейдіть до: `opera://extensions`
3. Увімкніть "Developer mode"
4. Натисніть "Load unpacked"
5. Виберіть папку `extension`

### Крок 2: Перевірка встановлення

Після завантаження перевірте:

1. **Іконка розширення** з'явилася на панелі інструментів
2. **Версія:** 2.0.0 (Firebase Edition)
3. **Назва:** YouTube Bookmarks Saver (Firebase)
4. **Permissions:** firestore.googleapis.com (БЕЗ identity для OAuth)

### Крок 3: Налаштування Firebase

1. Клацніть правою кнопкою на іконці розширення → "Options" (Параметри)
2. Або перейдіть до `chrome://extensions/` → YouTube Bookmarks Saver → Details → Extension options
3. Ви побачите сторінку налаштувань Firebase

**На сторінці налаштувань:**

1. **Статус підключення:**
   - 🔴 "Firebase не налаштовано" - якщо `firebase-config.js` не оновлено
   - 🟢 "Firebase підключено" - якщо все налаштовано правильно

2. **Кнопка "Test Connection":**
   - Натисніть щоб перевірити з'єднання з Firebase
   - Має показати "З'єднання успішне! Firebase працює."

3. **Статистика:**
   - Кількість закладок
   - Кількість категорій

### Крок 4: Тестування основного функціоналу

#### Тест 1: Збереження першої закладки

1. Відкрийте будь-яке відео на YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
2. Натисніть на іконку розширення
3. У формі заповніть:
   - **Тема:** Тест (або створіть нову)
   - **Опис:** Моя перша Firebase закладка
4. Натисніть "Зберегти"
5. Має з'явитись повідомлення про успіх

#### Тест 2: Перевірка в Firebase Console

1. Відкрийте Firebase Console: https://console.firebase.google.com/
2. Виберіть ваш проект
3. Firestore Database → Data
4. Колекція `bookmarks` → має бути 1 документ
5. Перевірте поля: title, watchUrl, description, channelUrl, category, etc.

#### Тест 3: Клавіатурне скорочення

1. Відкрийте відео на YouTube
2. Натисніть `Ctrl+Shift+B` (або `Cmd+Shift+B` на Mac)
3. Popup має відкритись автоматично
4. Заповніть та збережіть

#### Тест 4: Перегляд статистики

1. Відкрийте сторінку налаштувань (Options)
2. Перевірте що статистика оновилась:
   - Кількість закладок: 1+
   - Категорії: список ваших тем

#### Тест 5: Timestamped URLs

1. Відкрийте відео, прогорніть на 1:30 (90 секунд)
2. Збережіть закладку
3. У Firebase перевірте поле `watchUrl`
4. Має бути: `https://youtu.be/VIDEO_ID?t=90`
5. Клацніть на URL - має відкрити відео на 1:30

#### Тест 6: Метадані відео

Перевірте що зберігається:
- ✅ Назва відео (title)
- ✅ URL для перегляду з timestamp (watchUrl)
- ✅ Повний опис відео (description)
- ✅ URL каналу (channelUrl)
- ✅ Назва каналу (channelName)
- ✅ Категорія (category)
- ✅ Поточний час у секундах (currentTime)
- ✅ Дати створення/оновлення (createdAt, updatedAt)

### Крок 5: Тестування помилок

#### Тест 1: Firebase не налаштовано

1. У `firebase-config.js` залиште placeholder значення
2. Спробуйте зберегти закладку
3. Має показати помилку: "Firebase не налаштовано"

#### Тест 2: Неправильний API Key

1. Вставте неправильний `apiKey` в `firebase-config.js`
2. Перезавантажте розширення
3. Спробуйте зберегти
4. Має показати помилку про невалідний API key

#### Тест 3: Неправильні Security Rules

1. У Firebase Console змініть Security Rules на `allow read, write: if false;`
2. Спробуйте зберегти закладку
3. Має показати помилку: "Permission denied"

---

## 🔄 Перезавантаження розширення при змінах

**Коли потрібно перезавантажувати:**
- Після зміни `firebase-config.js`
- Після зміни `manifest.json`
- Після зміни будь-якого JavaScript файлу
- Після зміни HTML/CSS (іноді)

**Як перезавантажити:**

### Метод 1: Кнопка Reload
1. `chrome://extensions/`
2. Знайдіть YouTube Bookmarks Saver
3. Натисніть кнопку 🔄 (Reload)

### Метод 2: Remove + Load unpacked знову
1. `chrome://extensions/`
2. "Remove" розширення
3. "Load unpacked" знову

### Метод 3: Disable + Enable
1. `chrome://extensions/`
2. Вимкніть розширення
3. Увімкніть знову

**⚡ Швидкий спосіб:** Ctrl+R на сторінці `chrome://extensions/`

---

## 🐛 Налагодження (Debugging)

### Переглянути консоль Service Worker:

1. `chrome://extensions/`
2. YouTube Bookmarks Saver → "service worker"
3. Клацніть на "service worker" (синє посилання)
4. Відкриється DevTools з логами

### Переглянути консоль Popup:

1. Відкрийте popup розширення
2. Клацніть правою кнопкою на popup → "Inspect"
3. Відкриється DevTools для popup

### Переглянути консоль Options:

1. Відкрийте сторінку Options
2. F12 → DevTools
3. Перегляд помилок та логів

### Переглянути Chrome Storage:

```javascript
// В консолі DevTools (service worker або popup):
chrome.storage.sync.get(null, (data) => console.log(data));
```

### Корисні команди для відлагодження:

```javascript
// Перевірити Firebase конфігурацію
console.log(FIREBASE_CONFIG);

// Тест Firebase підключення
const api = new FirebaseAPI(FIREBASE_CONFIG);
api.addBookmark({...}).then(console.log).catch(console.error);

// Отримати всі закладки
const api = new FirebaseAPI(FIREBASE_CONFIG);
api.getAllBookmarks().then(console.log);
```

---

## 📊 Порівняння: Google Sheets vs Firebase

| Параметр | Google Sheets | Firebase |
|----------|---------------|----------|
| Швидкість збереження | 1-3 сек | <500 мс |
| Налаштування | OAuth (складно) | API Key (просто) |
| Безкоштовний ліміт | 300 запитів/хв | 50K читань/день |
| Перегляд даних | Google Sheets UI | Firebase Console |
| Експорт | CSV, Excel | JSON, CSV |
| Real-time | Ні | Можливо (майбутнє) |
| Гілка | main | `claude/yt-saver-ff-...` |

---

## ✅ Чеклист успішного тестування

- [ ] Розширення завантажено в браузер
- [ ] Firebase проект створено
- [ ] `firebase-config.js` оновлено
- [ ] Security Rules налаштовано
- [ ] Test Connection успішний
- [ ] Закладка збережена через popup
- [ ] Закладка збережена через Ctrl+Shift+B
- [ ] Дані відображаються в Firebase Console
- [ ] Timestamped URL працює
- [ ] Метадані (канал, опис) збережені
- [ ] Статистика відображається
- [ ] Теми додаються/видаляються

---

## 🆚 Тестування в різних браузерах

### Рекомендований порядок:

1. **Спочатку протестуйте в Chrome** (основний браузер)
2. **Потім в Edge** (перевірка Chromium сумісності)
3. **Потім в Brave** (privacy-focused браузер)
4. **Опціонально Opera** (інший Chromium fork)

### Що перевіряти в кожному браузері:

- ✅ Розширення завантажується
- ✅ Popup відкривається
- ✅ Service Worker працює
- ✅ Firebase з'єднання успішне
- ✅ Закладки зберігаються
- ✅ Клавіатурні скорочення працюють
- ✅ Options сторінка відкривається

### Очікувані результати:

Всі **Chromium браузери** (Chrome, Edge, Brave, Opera) мають працювати **ОДНАКОВО**.

Якщо щось працює в Chrome, але НЕ працює в Edge/Brave/Opera - це вказує на баг у розширенні, який потрібно виправити.

---

## 🚨 Поширені проблеми

### Проблема 1: "Firebase не налаштовано"

**Причина:** `firebase-config.js` містить placeholder значення

**Рішення:**
1. Відкрийте `extension/utils/firebase-config.js`
2. Замініть `YOUR_API_KEY` та інші значення на реальні
3. Перезавантажте розширення

### Проблема 2: "CORS error" або "403 Forbidden"

**Причина:** Security Rules в Firestore блокують доступ

**Рішення:**
1. Firebase Console → Firestore → Rules
2. Використайте правила з `FIREBASE_SETUP.md`
3. Опублікуйте зміни

### Проблема 3: Розширення не з'являється на YouTube

**Причина:** Content Script не завантажився

**Рішення:**
1. Перевірте `manifest.json` → `content_scripts`
2. Перезавантажте розширення
3. Перезавантажте сторінку YouTube

### Проблема 4: Popup не відкривається

**Причина:** Помилка в JavaScript

**Рішення:**
1. Правою кнопкою на іконці → Inspect Popup
2. Перегляньте консоль на помилки
3. Виправте помилки та перезавантажте

---

## 📞 Де отримати допомогу

1. **Firebase проблеми:** [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. **Загальні проблеми:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Міграція даних:** [migration/README.md](migration/README.md)
4. **Консоль браузера:** F12 → Console

---

**Успішного тестування! 🎉**

Якщо все працює - ваша Firebase версія готова до використання! 🚀
