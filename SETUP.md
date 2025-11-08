# 🚀 Швидке налаштування YouTube Bookmarks Saver

## Крок 1: Клонування репозиторію

```bash
git clone https://github.com/yourusername/yt-saver-claude.git
cd yt-saver-claude
```

## Крок 2: Налаштування Google Cloud Project

### 2.1. Створення проєкту

1. Перейдіть до https://console.cloud.google.com/
2. Натисніть "Select a project" → "New Project"
3. Введіть назву: "YouTube Bookmarks Extension"
4. Натисніть "Create"

### 2.2. Увімкнення Google Sheets API

1. У пошуку вгорі введіть "Google Sheets API"
2. Натисніть на результат
3. Натисніть "Enable"

### 2.3. Налаштування OAuth Consent Screen

1. Перейдіть до "APIs & Services" → "OAuth consent screen"
2. Виберіть "External" → "Create"
3. Заповніть обов'язкові поля:
   - **App name**: YouTube Bookmarks Saver
   - **User support email**: ваш email
   - **Developer contact**: ваш email
4. Натисніть "Save and Continue"
5. На екрані "Scopes":
   - Натисніть "Add or Remove Scopes"
   - Знайдіть і виберіть `.../auth/spreadsheets`
   - Натисніть "Update" → "Save and Continue"
6. **ВАЖЛИВО - "Test users":**
   - Натисніть "+ ADD USERS"
   - Додайте свій Gmail адресу (з яким ви будете використовувати розширення)
   - Можна додати кілька email адрес (до 100)
   - Натисніть "ADD"
   - **⚠️ Якщо не додати себе, отримаєте помилку 403: access_denied**
7. Натисніть "Save and Continue" → "Back to Dashboard"

## Крок 3: Створення OAuth 2.0 Client ID

### 3.1. Тимчасова установка розширення (для отримання Extension ID)

1. Відкрийте Chrome
2. Перейдіть до `chrome://extensions/`
3. Увімкніть "Developer mode" (праворуч вгорі)
4. Натисніть "Load unpacked"
5. Виберіть папку `extension` з клонованого репозиторію
6. **ВАЖЛИВО**: Скопіюйте Extension ID (довгий рядок під назвою розширення)
   - Приклад: `abcdefghijklmnopqrstuvwxyz123456`

### 3.2. Створення OAuth Client ID

1. Поверніться до Google Cloud Console
2. Перейдіть до "APIs & Services" → "Credentials"
3. Натисніть "Create Credentials" → "OAuth client ID"
4. Application type: **Chrome Extension**
5. Name: YouTube Bookmarks Extension
6. **Application ID**: вставте скопійований Extension ID
7. Натисніть "Create"
8. **ВАЖЛИВО**: Скопіюйте Client ID
   - Формат: `xxxxxxxxxxxxxx.apps.googleusercontent.com`

## Крок 4: Оновлення manifest.json

1. Відкрийте файл `extension/manifest.json`
2. Знайдіть секцію `oauth2`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

3. Замініть `YOUR_CLIENT_ID.apps.googleusercontent.com` на ваш Client ID
4. Збережіть файл

## Крок 5: Перезавантаження розширення

1. Поверніться до `chrome://extensions/`
2. Знайдіть "YouTube Bookmarks Saver"
3. Натисніть кнопку оновлення (🔄) або вимкніть/ввімкніть розширення

## Крок 6: Перше використання та авторизація

### 6.1. Відкриття налаштувань

1. Натисніть на іконку розширення в панелі інструментів Chrome
2. Натисніть "⚙️ Налаштування"

### 6.2. Авторизація Google (важливо!)

1. Натисніть "Увійти в Google"
2. З'явиться вікно авторизації Google
3. **Ви побачите попередження:**

```
Google hasn't verified this app
This app hasn't been verified by Google yet.

[Show Advanced] [Back to safety]
```

або українською:

```
Додаток yt-saver не пройшов процедуру підтвердження від Google
Зараз він тестується й доступний лише тестувальникам

[Розширені налаштування] [Назад]
```

4. **Не хвилюйтеся - це нормально!** Це ваш власний додаток в режимі тестування
5. Натисніть **"Show Advanced"** (або "Розширені налаштування")
6. Натисніть **"Go to yt-saver (unsafe)"** (або "Перейти до yt-saver (небезпечно)")
7. На наступному екрані натисніть **"Allow"** (або "Дозволити") для доступу до Google Sheets

### 6.3. Створення таблиці

1. Після успішної авторизації ви повернетеся до налаштувань
2. Натисніть "Створити нову таблицю"
3. Таблиця буде створена автоматично
4. Готово! 🎉

### ℹ️ Чому виникає попередження?

- Розширення не пройшло публічну верифікацію Google (це займає 3-5 днів)
- Для особистого використання це не потрібно
- Ви додали свій email до "Test users", тому маєте доступ
- Код розширення відкритий і ви можете його перевірити
- Дані зберігаються лише у вашій Google Таблиці

## Крок 7: Тестування

1. Відкрийте будь-яке відео на YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
2. Натисніть `Ctrl+Shift+B` (або `Cmd+Shift+B` на Mac)
3. У спливаючому вікні:
   - Виберіть тему (або створіть нову, наприклад "Тест")
   - Виберіть "Початок фрагменту"
   - Додайте опис: "Тестове збереження"
4. Натисніть "Зберегти"
5. Перевірте Google Таблицю - там має з'явитися новий запис!

## ⚠️ Поширені проблеми

### Помилка 403: access_denied

**Повне повідомлення:**
```
Додаток yt-saver не пройшов процедуру підтвердження від Google.
Зараз він тестується й доступний лише тестувальникам, яких схвалив розробник.
Помилка 403: access_denied
```

**Рішення:**
1. **Перевірте Test Users:**
   - Перейдіть до https://console.cloud.google.com/apis/credentials/consent
   - Прокрутіть до секції "Test users"
   - Переконайтеся, що ваш Gmail додано до списку
   - Якщо немає - натисніть "+ ADD USERS" і додайте

2. **Очистіть кеш авторизації:**
   - У налаштуваннях розширення натисніть "Вийти"
   - Закрийте та знову відкрийте Chrome
   - Спробуйте авторизуватися знову

3. **Дозвольте доступ:**
   - Натисніть "Розширені налаштування" / "Show Advanced"
   - Натисніть "Перейти до yt-saver (небезпечно)" / "Go to yt-saver (unsafe)"

📖 Детальна інструкція: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Помилка: "OAuth2 not granted or revoked"

**Рішення:**
1. Перевірте, чи правильно вказано Client ID у `manifest.json`
2. Перевірте, чи Extension ID у Google Cloud Console співпадає з поточним Extension ID
3. Якщо Extension ID змінився - оновіть його в Google Cloud Console та створіть новий Client ID

### Помилка: "Access blocked: This app's request is invalid"

**Рішення:**
1. Перевірте OAuth Consent Screen - чи додано scope `.../auth/spreadsheets`
2. **Додайте свій email до Test Users** (найчастіша причина!)
3. Перевірте, чи увімкнено Google Sheets API

### Розширення не бачить відео на YouTube

**Рішення:**
1. Перезавантажте сторінку YouTube
2. Перевірте, чи URL починається з `youtube.com/watch`
3. Відкрийте консоль (F12) і перевірте на помилки

### Не створюється таблиця

**Рішення:**
1. Перевірте, чи ви авторизовані (статус у налаштуваннях)
2. Перевірте інтернет-з'єднання
3. Спробуйте вийти та увійти знову

## 📚 Корисні посилання

- [Google Cloud Console](https://console.cloud.google.com/)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Google Sheets API](https://developers.google.com/sheets/api)

## 🎓 Наступні кроки

Після успішного налаштування:

1. Створіть свої теми (Python, JavaScript, Tutorials, тощо)
2. Налаштуйте зручне клавіатурне скорочення в `chrome://extensions/shortcuts`
3. Почніть зберігати цікаві моменти!

---

**Потрібна допомога?** Створіть Issue на GitHub або перевірте розділ FAQ у README.md
