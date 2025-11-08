# 🔧 Виправлення помилки 403: access_denied

## Проблема

При спробі авторизації ви отримуєте помилку:
```
Помилка 403: access_denied
Додаток не пройшов процедуру підтвердження від Google
```

Це нормально для додатків в режимі розробки/тестування.

## Швидке рішення: Додати тестувальника

### Крок 1: Відкрийте Google Cloud Console

1. Перейдіть до https://console.cloud.google.com/
2. Виберіть ваш проєкт (YouTube Bookmarks Extension або як ви його назвали)

### Крок 2: Налаштування OAuth Consent Screen

1. У лівому меню виберіть **"APIs & Services"** → **"OAuth consent screen"**
2. Прокрутіть вниз до секції **"Test users"**
3. Натисніть кнопку **"+ ADD USERS"**
4. Введіть ваш Gmail адресу (з яким ви хочете використовувати розширення)
5. Натисніть **"SAVE"**

### Крок 3: Очистити кеш авторизації

1. Відкрийте розширення
2. Перейдіть у **Налаштування**
3. Якщо є кнопка "Вийти" - натисніть її
4. Закрийте та знову відкрийте Chrome
5. Спробуйте авторизуватися знову

### Альтернативний спосіб очистки кешу:

```javascript
// Відкрийте консоль розробника (F12) на сторінці налаштувань розширення
// Вставте та виконайте:
chrome.identity.clearAllCachedAuthTokens(() => {
  console.log('Auth tokens cleared');
});
```

## Детальна інструкція з скріншотами кроків

### Варіант 1: Через Google Cloud Console UI

**1. Перейдіть до OAuth consent screen:**
   - URL: https://console.cloud.google.com/apis/credentials/consent
   - Або: APIs & Services → OAuth consent screen

**2. Знайдіть секцію "Test users":**
   ```
   Test users
   Add the email addresses of users who should be able to access
   your app during testing. You can add up to 100 test users.

   [+ ADD USERS]

   Email addresses:
   (список доданих емейлів)
   ```

**3. Натисніть "+ ADD USERS"**

**4. Введіть email адреси:**
   - Введіть ваш Gmail (наприклад: yourname@gmail.com)
   - Можна додати кілька емейлів через кому або Enter
   - Натисніть "ADD"

**5. Збережіть зміни:**
   - Натисніть "SAVE" внизу сторінки

### Варіант 2: Через gcloud CLI (якщо встановлено)

```bash
# Встановіть gcloud CLI якщо потрібно
# https://cloud.google.com/sdk/docs/install

# Додайте тестувальника
gcloud alpha iap oauth-brands list
# Скопіюйте brand name

gcloud alpha iap oauth-clients create BRAND_NAME \
  --display_name="YouTube Bookmarks Test Client"
```

## Після додавання тестувальника

### Крок 1: Оновіть розширення

1. Перейдіть до `chrome://extensions/`
2. Знайдіть "YouTube Bookmarks Saver"
3. Натисніть кнопку оновлення (🔄)

### Крок 2: Спробуйте авторизуватися

1. Відкрийте розширення
2. Перейдіть у Налаштування
3. Натисніть "Увійти в Google"
4. Ви побачите попередження:

```
Google hasn't verified this app
This app hasn't been verified by Google yet.

[Show Advanced] [Back to safety]
```

5. **ВАЖЛИВО:** Натисніть "Show Advanced" (або "Розширені")
6. Натисніть "Go to yt-saver (unsafe)" (або "Перейти до yt-saver (небезпечно)")
7. Дозвольте доступ до Google Sheets

## Чому це безпечно?

- Це ваш власний додаток
- Код відкритий і ви можете його перевірити
- Дані зберігаються лише у вашій Google Таблиці
- Жодні сторонні сервери не використовуються

## Видалення попередження (опціонально)

Якщо ви хочете прибрати це попередження назавжди, потрібно пройти верифікацію Google:

### Процес верифікації:

1. **Підготовка:**
   - Додайте Privacy Policy
   - Додайте Terms of Service
   - Підготуйте відео демонстрацію
   - Заповніть всі поля в OAuth Consent Screen

2. **Подання на верифікацію:**
   - У OAuth Consent Screen натисніть "PUBLISH APP"
   - Натисніть "PREPARE FOR VERIFICATION"
   - Заповніть форму верифікації
   - Підтвердьте домен (якщо є)

3. **Очікування:**
   - Процес може зайняти 3-5 робочих днів
   - Google надішле email з результатом

**Примітка:** Для особистого використання верифікація не потрібна - достатньо додати себе як тестувальника.

## Поширені помилки та рішення

### Помилка: "The developer hasn't given you access to this app"

**Рішення:**
- Перевірте, чи додано правильний email до Test users
- Email має співпадати з тим, яким ви авторизуєтесь
- Зачекайте 1-2 хвилини після додавання

### Помилка: "redirect_uri_mismatch"

**Рішення:**
- Перевірте, чи правильно вказано Extension ID в OAuth Client
- Extension ID має співпадати з поточним ID розширення

### Помилка: "invalid_client"

**Рішення:**
- Перевірте, чи правильно вказано Client ID в manifest.json
- Перезавантажте розширення після зміни manifest.json

## Швидкий чеклист

- [ ] Відкрив Google Cloud Console
- [ ] Перейшов до OAuth consent screen
- [ ] Знайшов секцію "Test users"
- [ ] Натиснув "+ ADD USERS"
- [ ] Додав свій Gmail
- [ ] Натиснув "SAVE"
- [ ] Очистив кеш авторизації
- [ ] Оновив розширення
- [ ] Спробував авторизуватися знову
- [ ] Натиснув "Show Advanced" на попередженні
- [ ] Натиснув "Go to yt-saver (unsafe)"
- [ ] Дозволив доступ до Google Sheets
- [ ] ✅ Працює!

## Для кількох користувачів

Якщо розширення буде використовувати кілька людей:

1. Додайте всіх їхні email до Test users (до 100 користувачів)
2. Або пройдіть верифікацію Google для публічного використання

## Потрібна допомога?

Якщо проблема залишається:
1. Перевірте консоль браузера (F12) на помилки
2. Перевірте Background Service Worker в `chrome://extensions/`
3. Створіть Issue на GitHub з логами помилок
