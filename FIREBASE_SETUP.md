# 🔥 Налаштування Firebase для YouTube Bookmarks Saver

Цей гайд допоможе вам налаштувати Firebase Firestore для зберігання ваших YouTube закладок.

## ⏱️ Час налаштування: ~10 хвилин

## 📋 Покрокова інструкція

### Крок 1: Створення Firebase проєкту

1. Перейдіть до [Firebase Console](https://console.firebase.google.com/)
2. Натисніть **"Add project"** (Додати проєкт)
3. Введіть назву проєкту: **"YouTube Bookmarks"** (або будь-яку іншу)
4. (Опціонально) Вимкніть Google Analytics - для цього проєкту він не потрібен
5. Натисніть **"Create project"** і зачекайте завершення створення

### Крок 2: Створення Web App

1. На головній сторінці проєкту натисніть іконку **"</>** (Web)"
2. Введіть назву додатку: **"YouTube Bookmarks Extension"**
3. **НЕ** вмикайте "Firebase Hosting" - це не потрібно
4. Натисніть **"Register app"**

### Крок 3: Копіювання Firebase Config

Після реєстрації додатку ви побачите код конфігурації:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

**ВАЖЛИВО:** Скопіюйте цю конфігурацію - вона знадобиться в наступному кроці!

### Крок 4: Налаштування Firestore Database

1. В меню зліва виберіть **"Build"** → **"Firestore Database"**
2. Натисніть **"Create database"**
3. Виберіть **"Start in test mode"** (для початку)
   - Це дозволить читати/записувати дані без авторизації
   - ⚠️ **Важливо:** Пізніше обов'язково налаштуйте правила безпеки!
4. Виберіть розташування (location):
   - Рекомендую: **europe-west** (для України та Європи)
   - Або **us-central** (за замовчуванням)
5. Натисніть **"Enable"**

### Крок 5: Налаштування правил безпеки (ВАЖЛИВО!)

⚠️ **Test mode** дозволяє всім читати/записувати дані! Це небезпечно!

Замініть правила на більш безпечні:

1. В Firestore Database перейдіть на вкладку **"Rules"**
2. Замініть вміст на:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Дозволити тільки для bookmarks collection
    match /bookmarks/{document=**} {
      // Дозволити читання та запис
      // В продакшені додайте авторизацію!
      allow read, write: if true;
    }

    // Заборонити доступ до інших колекцій
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Натисніть **"Publish"**

**💡 Порада:** Для більшої безпеки можна додати API key перевірку або інші правила.

### Крок 6: Оновлення firebase-config.js

1. Відкрийте файл розширення:
   ```
   extension/utils/firebase-config.js
   ```

2. Замініть placeholder значення на ваші дані з Firebase Config (з Кроку 3):

```javascript
const FIREBASE_CONFIG = {
  apiKey: "ВАШ_API_KEY_ТУТ",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

3. Збережіть файл

### Крок 7: Перезавантаження розширення

1. Відкрийте `chrome://extensions/`
2. Знайдіть **"YouTube Bookmarks Saver (Firebase)"**
3. Натисніть кнопку оновлення **(🔄)**
4. Або вимкніть та ввімкніть розширення

### Крок 8: Тестування

1. Натисніть на іконку розширення
2. Перейдіть до **"⚙️ Налаштування"**
3. Натисніть **"Перевірити з'єднання"**
4. Якщо все налаштовано правильно, побачите: **"З'єднання успішне! Firebase працює."** ✅

## ✅ Готово!

Тепер можна користуватися розширенням:

1. Відкрийте відео на YouTube
2. Натисніть `Ctrl+Shift+B`
3. Заповніть форму та збережіть

Дані будуть автоматично зберігатися в Firebase Firestore!

---

## 📊 Перегляд даних

### Через Firebase Console

1. Перейдіть до [Firebase Console](https://console.firebase.google.com/)
2. Виберіть ваш проєкт
3. **Firestore Database** → вкладка **"Data"**
4. Тут ви побачите колекцію **"bookmarks"** з усіма закладками

### Структура документа

Кожна закладка зберігається як документ з полями:

| Поле | Тип | Опис |
|------|-----|------|
| title | string | Назва відео |
| watchUrl | string | Посилання з timestamp |
| videoUrl | string | Повне посилання на відео |
| videoId | string | ID відео |
| description | string | Ваш опис |
| channelUrl | string | Посилання на канал |
| channelName | string | Назва каналу |
| category | string | Категорія/тема |
| currentTime | number | Час в секундах |
| createdAt | timestamp | Дата створення |
| updatedAt | timestamp | Дата оновлення |

---

## 🔒 Покращення безпеки (Опціонально)

### Варіант 1: Обмеження за API Key

Додайте API key обмеження в Firebase Console:

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Знайдіть ваш API Key
3. **Application restrictions** → **HTTP referrers**
4. Додайте:
   ```
   chrome-extension://ВАШ_EXTENSION_ID/*
   ```

### Варіант 2: Додати Simple Authentication

Можна додати просту авторизацію через Firebase Authentication (в майбутніх версіях).

---

## 💰 Ціноутворення

Firebase має щедрий безкоштовний план:

| Операція | Безкоштовно | Вартість (понад ліміт) |
|----------|-------------|------------------------|
| Читання | 50,000/день | $0.06 за 100K |
| Запис | 20,000/день | $0.18 за 100K |
| Видалення | 20,000/день | $0.02 за 100K |
| Зберігання | 1 GB | $0.18/GB |

**Для особистого використання** - завжди безкоштовно! 💚

---

## ❓ Поширені проблеми

### Помилка: "Firebase не налаштовано"

**Рішення:**
- Перевірте, чи правильно скопійовано Config з Firebase Console
- Переконайтеся, що ви замінили ВСІ placeholder значення
- Перезавантажте розширення

### Помилка: "Permission denied"

**Рішення:**
- Перевірте правила безпеки Firestore
- Переконайтеся, що правила дозволяють читання/запис
- Опублікуйте оновлені правила

### Помилка: "Failed to add bookmark"

**Рішення:**
- Перевірте інтернет-з'єднання
- Перевірте, чи існує проєкт у Firebase
- Подивіться консоль браузера (F12) на детальні помилки

### Не відображаються дані в Firebase Console

**Рішення:**
- Оновіть сторінку Firebase Console
- Перевірте, чи створена колекція "bookmarks"
- Спробуйте зберегти нову закладку

---

## 📱 Доступ з інших пристроїв

Firebase Firestore доступний з будь-якого пристрою! Ви можете:

1. Встановити розширення на інших комп'ютерах з тим самим `firebase-config.js`
2. Створити веб-інтерфейс для перегляду закладок
3. Створити мобільний додаток (iOS/Android)

Всі пристрої матимуть доступ до тих самих даних! ⚡

---

## 🔄 Міграція з Google Sheets

Якщо у вас вже є дані в Google Sheets:

1. Експортуйте таблицю в CSV
2. Використайте скрипт міграції (дивіться `MIGRATION.md`)
3. Або створіть дані заново (якщо їх небагато)

---

## 📞 Потрібна допомога?

- 📖 [Firebase Documentation](https://firebase.google.com/docs/firestore)
- 💬 [GitHub Issues](https://github.com/Kostyaov/yt-saver-claude/issues)
- 📺 [Відео-інструкція](link-to-video) (якщо є)

---

**Готово!** Тепер ви використовуєте швидку та надійну Firebase Firestore для збереження YouTube закладок! 🎉
