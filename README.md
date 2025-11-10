# 📚 YouTube Bookmarks Saver (Local Storage Edition)

**Version:** 3.0.0
**Версія:** 3.0.0

**Storage:** IndexedDB (Local)
**Сховище:** IndexedDB (Локальне)

**Status:** ✅ Production Ready
**Статус:** ✅ Готово до використання

---

## 🎯 Overview / Огляд

**EN:** Browser extension for Chrome/Edge/Brave/Opera that saves YouTube video bookmarks with precise timestamps to **local IndexedDB storage**. No cloud services, no configuration needed, complete privacy.

**UK:** Розширення для Chrome/Edge/Brave/Opera, яке зберігає закладки з YouTube відео з точними тайм-штампами у **локальне IndexedDB сховище**. Без хмарних сервісів, без налаштувань, повна приватність.

---

## ✨ Key Features / Ключові можливості

### EN:
- ✅ **Local Storage** - All data stored in browser's IndexedDB
- ✅ **Zero Configuration** - Works immediately after installation
- ✅ **Offline Support** - No internet connection required
- ✅ **Fast** - Save bookmarks in <50ms
- ✅ **Privacy First** - Data never leaves your device
- ✅ **Export/Import** - JSON format for backups
- ✅ **Search & Filter** - Find bookmarks quickly
- ✅ **Organize** - Group by categories/themes
- ✅ **Portable** - Easy data migration between devices
- ✅ **Internationalization** - English and Ukrainian languages
- ✅ **Theme Support** - Light and dark themes
- ✅ **Auto-Pause** - Option to pause video when saving bookmark

### UK:
- ✅ **Локальне зберігання** - Всі дані у IndexedDB браузера
- ✅ **Без налаштувань** - Працює одразу після встановлення
- ✅ **Офлайн підтримка** - Не потрібне інтернет-з'єднання
- ✅ **Швидко** - Збереження за <50мс
- ✅ **Приватність** - Дані не покидають пристрій
- ✅ **Експорт/Імпорт** - JSON формат для резервних копій
- ✅ **Пошук і фільтрація** - Швидкий пошук закладок
- ✅ **Організація** - Групування за категоріями/темами
- ✅ **Переносність** - Легке перенесення даних між пристроями
- ✅ **Інтернаціоналізація** - Англійська та українська мови
- ✅ **Підтримка тем** - Світла та темна теми
- ✅ **Авто-пауза** - Опція паузи відео при збереженні закладки

---

## 🚀 Quick Start / Швидкий старт

### Installation / Встановлення

**EN:**
1. Clone this repository
2. Open Chrome → Extensions → Enable Developer Mode
3. Click "Load Unpacked" → Select `extension/` folder
4. Done! No configuration needed.

**UK:**
1. Клонуйте цей репозиторій
2. Відкрийте Chrome → Розширення → Увімкніть режим розробника
3. Натисніть "Завантажити розпаковане" → Оберіть папку `extension/`
4. Готово! Налаштування не потрібні.

### Usage / Використання

**EN:**
1. **Open any YouTube video**
2. **Press Ctrl+Shift+B** (or Cmd+Shift+B on Mac)
3. **Select category** and add optional description
4. **Click Save** - bookmark saved instantly!

**UK:**
1. **Відкрийте будь-яке YouTube відео**
2. **Натисніть Ctrl+Shift+B** (або Cmd+Shift+B на Mac)
3. **Оберіть категорію** та додайте опис (опціонально)
4. **Натисніть Зберегти** - закладка збережена миттєво!

### View Bookmarks / Перегляд закладок

**EN:**
- Click extension icon → **"📖 Saved"** button (available on any page)
- Or open `chrome-extension://[your-id]/bookmarks/bookmarks-viewer.html`

**UK:**
- Натисніть іконку розширення → кнопка **"📖 Збережене"** (доступна на будь-якій сторінці)
- Або відкрийте `chrome-extension://[your-id]/bookmarks/bookmarks-viewer.html`

---

## 📦 What's Included / Що включено

```
extension/
├── manifest.json              # Extension config v3.0.0
├── background/
│   └── service-worker.js      # Background logic
├── popup/
│   ├── popup.html/js/css      # Save bookmark form
├── bookmarks/
│   ├── bookmarks-viewer.html  # View all bookmarks
│   ├── bookmarks-viewer.js    # Search, filter, sort
│   └── bookmarks-viewer.css   # Row-based display
├── content/
│   └── youtube-script.js      # Extract YouTube metadata
├── options/
│   ├── options-idb.html/js    # Settings & export/import
│   └── options.css
├── locales/
│   ├── en.json                # English translations
│   └── uk.json                # Ukrainian translations
└── utils/
    ├── idb-api.js             # IndexedDB API wrapper
    └── i18n.js                # Internationalization utility

doc/
└── CONTEXT_ENGINEERING.md     # Full documentation (1200+ lines)
```

---

## 💾 Storage Details / Деталі сховища

**Technology / Технологія:** IndexedDB
**Database / База даних:** `youtube-bookmarks`
**Storage Quota / Квота сховища:** ~50-100 MB (browser-dependent / залежить від браузера)
**Performance / Продуктивність:** <50ms save time, <100ms load 1000 bookmarks / <50мс збереження, <100мс завантаження 1000 закладок

**Data Structure / Структура даних:**
```json
{
  "id": 1,
  "title": "Video Title",
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://youtube.com/watch?v=...",
  "watchUrl": "https://youtube.com/watch?v=...&t=123s",
  "currentTime": 123,
  "channelName": "Channel Name",
  "channelUrl": "https://youtube.com/@channel",
  "category": "Programming",
  "description": "User notes...",
  "createdAt": "2024-11-10T12:00:00.000Z",
  "updatedAt": "2024-11-10T12:00:00.000Z"
}
```

---

## 🔧 Features / Функції

### Bookmarks Viewer / Переглядач закладок

**EN:**
- **Search** - Real-time search across all fields
- **Filter** - By category dropdown
- **Sort** - Newest, oldest, by title, by category
- **Display** - Clean row format: `[description] [link] [delete]`
- **Export** - Download JSON backup
- **Delete** - With confirmation modal

**UK:**
- **Пошук** - Пошук в реальному часі по всіх полях
- **Фільтр** - За категорією через випадаючий список
- **Сортування** - Найновіші, найстаріші, за назвою, за категорією
- **Відображення** - Чистий формат рядків: `[опис] [посилання] [видалити]`
- **Експорт** - Завантаження резервної копії JSON
- **Видалення** - З підтвердженням у модальному вікні

### Options Page / Сторінка налаштувань

**EN:**
- General settings (theme, language, auto-pause)
- View database status and statistics
- Export all bookmarks to JSON
- Import from JSON file
- Manage themes/categories
- Clear all data (danger zone)

**UK:**
- Основні налаштування (тема, мова, авто-пауза)
- Перегляд статусу бази даних та статистики
- Експорт всіх закладок у JSON
- Імпорт з JSON файлу
- Управління темами/категоріями
- Видалення всіх даних (небезпечна зона)

### Popup

**EN:**
- Save form (YouTube pages only)
- Footer buttons **always accessible**:
  - 📖 **Saved** - Open bookmarks viewer
  - ⚙️ **Settings** - Open options page

**UK:**
- Форма збереження (тільки на сторінках YouTube)
- Кнопки футера **завжди доступні**:
  - 📖 **Збережене** - Відкрити переглядач закладок
  - ⚙️ **Налаштування** - Відкрити сторінку налаштувань

---

## 🌍 Internationalization / Інтернаціоналізація

**Supported Languages / Підтримувані мови:**
- 🇬🇧 English
- 🇺🇦 Українська

**Features / Можливості:**
- Automatic language detection from settings / Автоматичне визначення мови з налаштувань
- Switch language in options page / Перемикання мови на сторінці налаштувань
- All UI elements translated / Всі елементи інтерфейсу перекладені
- Dynamic content localized / Динамічний контент локалізований

---

## 📖 Documentation / Документація

**Full documentation / Повна документація:** [`doc/CONTEXT_ENGINEERING.md`](doc/CONTEXT_ENGINEERING.md) (1200+ lines)

**Includes / Включає:**

**EN:**
- Architecture & tech stack
- IndexedDB schema & API
- UI/UX details
- Development guide
- Code examples
- Debugging guide
- Migration guides
- Performance benchmarks

**UK:**
- Архітектура та технологічний стек
- Схема та API IndexedDB
- Деталі UI/UX
- Посібник з розробки
- Приклади коду
- Посібник з налагодження
- Посібники з міграції
- Показники продуктивності

---

## 🔒 Privacy & Security / Приватність і безпека

**All data stored locally / Всі дані зберігаються локально:**

**EN:**
- Cannot be accessed by other extensions
- Cannot be accessed by websites
- No external network requests
- No tracking or analytics
- No user authentication required

**UK:**
- Не можуть бути доступні іншим розширенням
- Не можуть бути доступні веб-сайтам
- Немає зовнішніх мережевих запитів
- Немає відстеження чи аналітики
- Не потрібна автентифікація користувача

**Permissions / Дозволи:**
- `activeTab` - Read YouTube page metadata / Читання метаданих сторінки YouTube
- `storage` - Save user preferences / Збереження налаштувань користувача
- `youtube.com` - Inject content script / Впровадження контент-скрипта

---

## 📊 Version History / Історія версій

| Version / Версія | Storage / Сховище | Status / Статус |
|---------|---------|--------|
| v3.0.0 | **IndexedDB (current / поточна)** | ✅ Active / Активна |
| v2.0.0 | Firebase Firestore | 🗑️ Removed / Видалена |
| v1.0.0 | Google Sheets | 🗑️ Removed / Видалена |

---

## 🚀 Future Enhancements / Майбутні покращення

**Planned features / Заплановані функції:**

**EN:**
- Tags system
- Collections/Playlists
- Statistics dashboard
- Video thumbnails
- Markdown notes support
- Advanced search (regex, date range)
- Bulk operations
- Multiple export formats

**UK:**
- Система тегів
- Колекції/Плейлисти
- Панель статистики
- Мініатюри відео
- Підтримка Markdown нотаток
- Розширений пошук (regex, діапазон дат)
- Масові операції
- Множинні формати експорту

---

## 🤝 Contributing / Внесок у проект

**EN:**

1. Create branch: `claude/feature-name-SESSION_ID`
2. Make changes
3. Test thoroughly
4. Commit: `type: description` (feat/fix/docs/refactor)
5. Push and create pull request

**Code Style:**
- JavaScript: 2 spaces, single quotes, semicolons
- CSS: 2 spaces, alphabetical properties
- Comments: Explain why, not what

**UK:**

1. Створіть гілку: `claude/feature-name-SESSION_ID`
2. Внесіть зміни
3. Ретельно протестуйте
4. Закомітьте: `type: опис` (feat/fix/docs/refactor)
5. Відправте та створіть pull request

**Стиль коду:**
- JavaScript: 2 пробіли, одинарні лапки, крапки з комою
- CSS: 2 пробіли, властивості в алфавітному порядку
- Коментарі: Пояснюйте чому, а не що

---

## 📞 Support / Підтримка

**EN:**
- **Documentation:** Read `doc/CONTEXT_ENGINEERING.md`
- **Issues:** Check existing GitHub issues
- **Debug:** Chrome DevTools → Application → IndexedDB → youtube-bookmarks

**UK:**
- **Документація:** Прочитайте `doc/CONTEXT_ENGINEERING.md`
- **Проблеми:** Перевірте існуючі GitHub issues
- **Налагодження:** Chrome DevTools → Application → IndexedDB → youtube-bookmarks

---

## 📄 License / Ліцензія

MIT License (or specify your license / або вкажіть вашу ліцензію)

---

## 🙏 Acknowledgments / Подяки

**EN:**
- Built for privacy-conscious users
- No external dependencies
- Pure vanilla JavaScript
- Works completely offline

**UK:**
- Створено для користувачів, які цінують приватність
- Без зовнішніх залежностей
- Чистий vanilla JavaScript
- Працює повністю офлайн

---

**Current Branch / Поточна гілка:** `claude/yt-saver-idb-011CUvZj39HXCfeFq2nvhizf`
**Last Updated / Останнє оновлення:** November 10, 2024
**Maintained by / Підтримується:** AI-assisted development / AI-асистована розробка

---

**Note / Примітка:**

**EN:** This is the IndexedDB local storage version (v3.0.0). Previous versions using Firebase (v2.0.0) and Google Sheets (v1.0.0) have been removed.

**UK:** Це версія з локальним сховищем IndexedDB (v3.0.0). Попередні версії з Firebase (v2.0.0) та Google Sheets (v1.0.0) були видалені.
