# JDM Legends Подготовка к защите

Команда **letsgo**: **Dastan и Beibarys**, группа **SE-2516**, Astana IT University.

Это единый материал для подготовки к защите текущего React-проекта. Для каждого требования здесь есть: что проверяет преподаватель, что показать на сайте, где находится реализация, как объяснить код и что ответить на вопросы. Объяснения даны по-русски; короткие реплики для выступления — по-английски.

Фрагменты ниже взяты из текущих исходников. Некоторые вырезаны из середины компонента: они нужны для разбора и не являются отдельными готовыми программами. Раздел с тренировочными изменениями явно отделён от уже реализованного кода.

## 1. Кто что защищает

| Участник | Подтверждённая работа        | Что особенно хорошо знать                                                                                                                                         |
| -------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dastan   | About Us, Culture, Profile   | JSX страниц; вывод массивов через map; связь статьи с автомобилем; получение user и saved из Context; вывод профиля; guest-состояние и сохранённые машины         |
| Beibarys | Остальные страницы и функции | Home, Collection, детали автомобилей, Drive Forecast, Contact, Sign Up/Log In; маршруты, общая стилизация, адаптивность, темы, валидация, localStorage, API и GIF |

Каждый должен уметь объяснить общий путь данных. Dastan недостаточно сказать «профиль показывает имя»: нужно показать, откуда приходит `user`. Beibarys должен уметь объяснить связь авторизации с профилем Dastan.

**Главная мысль проекта:** посетитель знакомится с японскими автомобилями, ищет интересующую модель, читает её историю и сохраняет её в свой гараж.

**Не путайте фактическое поведение:**

- Аккаунты и сообщения работают локально, без сервера.
- Пароль хранится как хеш с солью, а не открытым текстом.
- Гостевой и личный гаражи разделены.
- Поиск работает по локальному массиву; погода приходит из внешнего API.
- У приложения один HTML-вход и несколько React-маршрутов.
- Наличие workflow для GitHub Pages ещё не подтверждает публикацию. Перед защитой нужен рабочий live-адрес.

## 2. Карта всех требований

Минимум задания — **6 связанных функциональных страниц**. В проекте **15 содержательных маршрутов**: 9 основных и 6 страниц автомобилей; отдельно есть экран 404.

| Требование              | Баллы            | Где показать                                           | Где искать код                                                 |
| ----------------------- | ---------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| 1. Responsiveness       | 10               | Home, Collection и меню на 390/768/1440 px             | styles.css, hero.css, Header в App.jsx                         |
| 2. Hosting              | 5                | Живой сайт, обновление страницы, ссылки и изображения  | vite.config.js, .github/workflows/pages.yml                    |
| 3. Light and Dark Modes | 5                | Переключить тему, перейти на другую страницу, обновить | theme.js, index.html, CSS-переменные                           |
| 4. Design and UX        | 20               | Главная, каталог, читаемые формы, понятные действия    | hero.css, styles.css, компоненты                               |
| 5. Enhanced JavaScript  | 25 за весь пункт | Регистрация/вход/профиль, ошибки форм, поиск и фильтры | account.js, validation.js, Account.jsx, Garage.jsx, storage.js |
| 6. Animated UI Effects  | 5                | Hover, карточки, GIF и уменьшение анимации             | styles.css, Home.jsx, файлы GIF/WebP                           |
| 7. External API         | 10               | Tokyo/Yokohama/Suzuka, загрузка, ошибка и повтор       | Drive.jsx, data.js                                             |
| 8. Feature Cohesion     | 10               | Объяснить связь каталога, культуры, гаража и погоды    | Editorial.jsx, data.js, переходы между страницами              |
| 9. Presentation         | 5                | Совместное выступление на 4:30–5:00                    | Сценарий в разделе 15 этого файла                              |
| 10. Code Quality        | 5                | Структура, общие компоненты, тесты и сборка            | src/, tests/, package.json                                     |

**Всего — 100 баллов.** Подпункты 5.1–5.3 входят в общие 25 баллов, а не оцениваются по 25 каждый.

## 3. Как устроен проект и как о нём рассказать

### 3.1. Что запускается первым

Файл: `src/main.jsx`.

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./hero.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`createRoot` подключает React к `<div id="root">` из HTML. `App` — корневой компонент. Два CSS-файла разделяют общие стили и главный экран.

`StrictMode` помогает замечать проблемы во время разработки. В режиме разработки React может повторно выполнять некоторые функции и цикл setup/cleanup эффектов. Это не означает, что пользователь намеренно дважды отправляет форму или что production обязательно делает два запроса.

**Реплика:** “We use React components for the interface and shared state for themes, user accounts and saved cars. Vite builds the application for static hosting.”

### 3.2. Маршруты вместо отдельных HTML-файлов

Файл: `src/App.jsx`.

```jsx
function getRoute() {
  return window.location.hash.slice(1).split("?")[0] || "/";
}
```

Для адреса `/#/cars/r34` значение `window.location.hash` — `#/cars/r34`. `slice(1)` убирает решётку, получается `/cars/r34`. Пустой hash превращается в `/`.

Файл: `src/App.jsx`.

```jsx
useEffect(() => {
  const onRoute = () => setRoute(getRoute());
  window.addEventListener("hashchange", onRoute);
  return () => window.removeEventListener("hashchange", onRoute);
}, []);
```

Событие `hashchange` обновляет React state. Возвращённая из эффекта функция снимает обработчик при очистке. Это предотвращает накопление слушателей.

Файл: `src/App.jsx`.

```jsx
let page;
if (route === "/") page = <Home />;
else if (route === "/cars") page = <Garage />;
else if (
  route.startsWith("/cars/") &&
  cars.some((car) => car.id === route.split("/")[2])
)
  page = <CarDetails id={route.split("/")[2]} />;
else if (route === "/culture") page = <Culture />;
else if (route === "/drive") page = <Drive />;
else if (route === "/about") page = <About />;
else if (route === "/contact") page = <Contact />;
else if (route === "/login" || route === "/signup")
  page = <Auth key={route} kind={route.slice(1)} />;
else if (route === "/profile") page = <Profile />;
```

Значение маршрута определяет, какой компонент попадёт в `main`. При неизвестном маршруте показывается экран 404 с переходом домой.

**Важная формулировка:** “This is a React single-page application with fifteen content routes. The routes represent different pages and are connected through navigation.”

Не говорите, что в папке лежит 15 HTML-файлов: физическая точка входа — `index.html`.

### 3.3. Как связаны компоненты

Файл: `src/App.jsx`.

```jsx
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
```

Context даёт вложенным компонентам доступ к общим данным. `useApp()` — короткий пользовательский хук вокруг `useContext`.

Путь сохранённой машины:

1. `CarCard` получает объект `car` через props.
2. Клик по сердцу вызывает `toggleSaved(car.id)` из Context.
3. `App` обновляет гараж текущего владельца.
4. Обновление сохраняется в localStorage.
5. `Profile` получает новый `saved` и отрисовывает соответствующие машины.

**State** — изменяемые данные компонента. **Props** — входные данные, которые передал родитель. **Context** — способ передать общие данные глубже по дереву.

## 4. Таск 1 Responsiveness — 10 баллов

### Что нужно показать

Откройте Collection и включите режим устройств в DevTools. Покажите хотя бы **1440 px**, **768 px** и **390 px**. Дополнительно полезно проверить 320 px.

Должно быть видно, что:

- количество колонок меняется;
- текст не перекрывает кнопки;
- страница не прокручивается горизонтально;
- на телефоне появляется кнопка меню;
- поля формы удобно помещаются на экране.

### Код и объяснение

Файл: `src/styles.css`.

```css
.car-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 25px;
}
```

`display: grid` включает сетку. `repeat(3, …)` создаёт три колонки. `1fr` распределяет доступную ширину. `minmax(0, 1fr)` позволяет колонке сужаться, не заставляя длинное содержимое раздвигать страницу.

Ниже — правила из media queries без соседних селекторов:

```css
@media (max-width: 900px) {
  .car-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .car-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
```

На широком экране — три колонки, затем две, затем одна. В шапке, кнопках и фильтрах также используется Flexbox. В `hero.css` главный блок отдельно адаптируется под мобильную компоновку.

Мобильное меню хранит булево состояние `open`. Кнопка меняет его, класс `is-open` показывает меню, `aria-expanded` сообщает состояние вспомогательным технологиям. При переходе на другой маршрут меню закрывается эффектом.

### Что сказать

> “We use CSS Grid for the collection and Flexbox for alignment. Media queries reduce the grid from three columns to two and then one. On mobile, the navigation becomes a collapsible menu.”

### Возможные вопросы

| Вопрос                                             | Ответ                                                                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Почему не задать всем блокам фиксированную ширину? | На узком экране блок может выйти за доступную ширину. Мы используем относительную ширину контейнера, сетки и ограничения max-width. |
| Чем Grid отличается от Flexbox?                    | Grid удобен для строк и колонок карточек; Flexbox — для выравнивания элементов в одном направлении, например действий в шапке.      |
| Что такое breakpoint?                              | Ширина, при которой media query меняет правила компоновки.                                                                          |
| Достаточно ли только уменьшить шрифт?              | Нет. Нужно менять саму компоновку и проверять управление, переносы и отсутствие наложений.                                          |

## 5. Таск 2 Hosting — 5 баллов

### Что требуется до защиты

Репозиторий команды: **https://github.com/lackoftalentt/final-web1**.

В `docs/report-details.json` live-адрес пока не указан. Перед защитой опубликуйте актуальную сборку и проверьте адрес. Не подставляйте предполагаемый GitHub Pages URL как подтверждённый.

В `Links.txt` должны быть **две разные ссылки**: на исходники и на работающий сайт.

### Что именно публикуется

```bash
npm ci
npm test
npm run build
npm run preview
```

`npm ci` устанавливает версии из lock-файла. `npm test` запускает тесты. `npm run build` создаёт production-файлы в `dist/`. `npm run preview` позволяет проверить эту сборку локально, но сам по себе не публикует её в интернет.

Файл: `vite.config.js`.

```js
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  esbuild: { jsx: "automatic" },
});
```

`base: "./"` делает пути к ассетам относительными. Это важно для размещения проекта в подкаталоге GitHub Pages.

### Как работает готовый workflow

Файл: `.github/workflows/pages.yml`.

```yaml
name: Deploy JDM Legends

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Publish site
        id: deployment
        uses: actions/deploy-pages@v4
```

Порядок: checkout → Node.js → установка зависимостей → тесты → сборка → загрузка `dist` → публикация.

- `build` готовит файлы.
- `deploy` зависит от успешного `build` через `needs`.
- `pages: write` и `id-token: write` разрешают workflow выполнить публикацию.
- `workflow_dispatch` позволяет запустить workflow вручную.
- `page_url` — результат успешной публикации.

Если в репозиторий переносится содержимое папки `final-project`, вместе с ним нужно перенести скрытую папку `.github` в корень этого репозитория. В настройках Pages выбирается источник GitHub Actions.

### Что показать

1. Открыть настоящий live-адрес.
2. Перейти на детали машины и нажать Refresh.
3. Проверить, что изображения, шрифт и навигация загружаются.
4. Отдельно показать репозиторий.

**Реплика:** “Vite creates a static production build. GitHub Actions runs our checks, builds the project and deploys the dist folder to GitHub Pages. Hash-based routes keep page reloads compatible with static hosting.”

Если публикация ещё не сделана, прямо скажите об этом. Этот пункт нельзя считать выполненным только из-за наличия YAML-файла.

## 6. Таск 3 Light and Dark Modes — 5 баллов

### Демонстрация

Открыть Home → сменить тему → перейти в Culture → обновить страницу. Выбранная тема должна сохраниться. При первом открытии без сохранённого выбора используется чёрная тема.

### Код переключения и сохранения

Файл: `src/theme.js`.

```js
import { useEffect, useState } from "react";
import { readStored, writeStored } from "./storage.js";

export function readTheme() {
  return readStored("theme", "dark") === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#0b0b0c" : "#f6f6f2";
    writeStored("theme", theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === "jdm:theme" || event.key === null)
        setTheme(readTheme());
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return [theme, setTheme];
}
```

Что нужно объяснить:

1. `readTheme()` читает сохранённое значение; неизвестное значение заменяется на `dark`.
2. `useState(readTheme)` получает начальную тему через ленивую инициализацию.
3. Первый `useEffect` меняет `data-theme`, цвет браузерной панели и localStorage.
4. Зависимость `[theme]` означает, что эффект реагирует на изменение темы.
5. Второй эффект слушает изменения localStorage из других вкладок.
6. Возвращённая функция снимает обработчик.

Событие `storage` обычно приходит в другие документы того же origin. В текущей вкладке интерфейс обновляется через React state.

### Почему теперь корректно меняется весь сайт

Файл: `src/styles.css`.

```css
:root {
  font-family: Adwaita, Arial, Helvetica, sans-serif;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  font-synthesis-weight: none;
  --bg: #0b0b0c;
  --surface: #151517;
  --subtle: #202023;
  --text: #f3f3ee;
  --muted: #acaca8;
  --border: #353538;
  --accent: #d6f36b;
  --accent-text: #202618;
  --dark: #080809;
  --error: #ff9a91;
  --radius: 8px;
  color-scheme: dark;
}
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f6f6f2;
  --surface: #fff;
  --subtle: #eceee8;
  --text: #232724;
  --muted: #686e66;
  --border: #dcded6;
  --dark: #191e1b;
  --error: #ae302a;
}
```

Корневые `color` и `background` читают переменные. Переключение набора переменных меняет фон страницы, текст, поверхности и границы.

Раньше корневой фон и текст были заданы фиксированными цветами. Компоненты менялись, но часть страницы сохраняла старую палитру. Исправление состояло в том, чтобы и корень, и body использовали те же переменные.

### Зачем нужен код до запуска React

Файл: `index.html`.

```html
<script>
  (() => {
    let theme = "dark";
    try {
      if (JSON.parse(localStorage.getItem("jdm:theme")) === "light")
        theme = "light";
    } catch {}
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#0b0b0c" : "#f6f6f2";
  })();
</script>
```

Этот маленький скрипт выбирает тему до отрисовки React. Без него при сохранённой светлой теме могла бы сначала появляться тёмная страница, а затем происходить переключение. Начальная HTML-логика и `readTheme()` используют одно правило выбора.

### Что сказать

> “The theme is stored in localStorage and applied through CSS variables. We apply it before React starts to avoid a flash of the wrong theme. The same preference stays active across routes and page reloads.”

**Не говорите:** «Тема работает только через изменение backgroundColor». Здесь меняется согласованная палитра нескольких типов элементов.

## 7. Таск 4 Design and User Experience — 20 баллов

### Идея оформления

Сайт посвящён японским спортивным автомобилям. Основные решения:

- чёрный и графитовый фон по умолчанию;
- лаймовый акцент на главном действии;
- крупный короткий заголовок главной;
- GIF на весь главный контейнер;
- одинаковые поля, кнопки и карточки;
- тематические SVG-иллюстрации;
- понятная навигация без часов, звуков и лишних панелей.

Задача дизайна — направить посетителя в коллекцию, затем к машине и её сохранению.

### Как текст располагается поверх изображения

Файл: `src/hero.css`.

```css
.hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  aspect-ratio: 498 / 278;
  min-height: 620px;
  overflow: hidden;
  border-radius: var(--radius);
  background: #080a0c;
  color: #f7f7f2;
}

.hero-motion {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.hero-motion img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(90deg, #080a0cc7, #080a0c66 42%, transparent 76%),
    linear-gradient(0deg, #080a0cf5, #080a0c33 65%, transparent);
}
```

Нужно понимать:

- `position: relative` задаёт систему координат главного блока.
- Абсолютно расположенный `picture` заполняет этот блок через `inset: 0`.
- `object-fit: cover` заполняет область картинкой; на некоторых пропорциях часть изображения может обрезаться.
- Псевдоэлемент `::after` создаёт затемнение.
- Контент имеет больший `z-index`, поэтому находится поверх изображения и затемнения.
- `pointer-events: none` у затемнения позволяет нажимать ссылки и кнопки.
- На мобильных используется отдельная компоновка, чтобы текст не закрывал машину.

### Что показать преподавателю

На Home объясните иерархию: сначала изображение и заголовок, затем короткое описание, затем кнопка. На Collection покажите одинаковую структуру карточек. На форме покажите постоянные подписи полей, которые не исчезают при вводе.

**Реплика:** “We keep the interface focused on the collection. A compact colour palette, consistent spacing and reusable components make the pages feel connected. The hero attracts attention, while the main action leads directly to the cars.”

### Доступность как часть UX

`label` связывается с полем через `htmlFor/id`. Кнопки-иконки имеют `aria-label`. Ошибки связаны с полями через `aria-describedby`. У страницы есть skip link, видимый фокус и управление вкладками с клавиатуры.

Если преподаватель спросит, почему иконка — настоящая кнопка, ответ: кнопка уже поддерживает фокус и привычное управление с клавиатуры; кликабельный `div` потребовал бы дополнительной логики.

## 8. Таск 5 Enhanced JavaScript — 25 баллов

### 8.1. Хранение данных в localStorage

Файл: `src/storage.js`.

```js
export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(`jdm:${key}`)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(`jdm:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
```

`localStorage` сохраняет строки. Поэтому объект превращается в JSON через `JSON.stringify`, а при чтении восстанавливается через `JSON.parse`.

- Префикс `jdm:` отделяет данные проекта от других записей.
- `?? fallback` использует запасное значение для `null` или `undefined`.
- `try/catch` обрабатывает повреждённый JSON и недоступное хранилище.
- `writeStored` возвращает успешность записи.

| Ключ         | Что хранится                             |
| ------------ | ---------------------------------------- |
| jdm:theme    | Тема                                     |
| jdm:accounts | Профили и хеши паролей                   |
| jdm:session  | ID текущего аккаунта                     |
| jdm:garages  | Массивы ID машин по владельцам           |
| jdm:filters  | Поиск, привод, производитель, сортировка |
| jdm:messages | Локальные сообщения                      |

Хранилище зависит от origin: протокола, имени хоста и порта. `localhost:5173`, `127.0.0.1:5173` и опубликованный сайт имеют отдельные данные. Аккаунт, созданный локально, сам по себе не появится на GitHub Pages.

### 8.2. Связь хранилища с React state

Файл: `src/storage.js`.

```js
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  const update = useCallback(
    (next) => {
      setValue((previous) => {
        const result = typeof next === "function" ? next(previous) : next;
        writeStored(key, result);
        return result;
      });
    },
    [key],
  );
  return [value, update];
}
```

Начальное состояние читается из localStorage. При обновлении вычисляется новое значение, записывается в хранилище и возвращается React.

`next` может быть готовым значением или функцией от предыдущего состояния. `useCallback` сохраняет ссылку на функцию до изменения её зависимости `key`.

В этом хуке запись находится внутри updater-функции. В development StrictMode updater может вызываться повторно; повторная запись того же значения не должна создавать дополнительное действие. Сохранение темы сделано другим способом — отдельным эффектом в `useTheme`.

**Главный ответ:** localStorage сохраняет данные после обновления страницы, а React state немедленно обновляет интерфейс. Одна запись в localStorage сама по себе не вызывает перерисовку текущего компонента.

### 8.3. Подпункт 5.1 Authentication Simulation

#### Порядок действий

1. Пользователь вводит данные.
2. JavaScript проверяет форму.
3. Sign Up нормализует email и проверяет дубликат.
4. Создаёт ID и случайную соль.
5. Вычисляет хеш пароля.
6. Сохраняет аккаунт.
7. Сохраняет ID сессии.
8. Открывает Profile.

#### Код регистрации и входа

Файл: `src/account.js`.

```js
import { hashPassword, readStored, writeStored } from "./storage.js";

export function getAccounts() {
  const accounts = readStored("accounts", []);
  return Array.isArray(accounts) ? accounts : [];
}

export async function registerAccount(values) {
  const email = values.email.trim().toLowerCase();
  if (getAccounts().some((account) => account.email === email)) {
    throw new Error(
      "An account with this email already exists. Please sign in.",
    );
  }
  const salt = crypto.randomUUID();
  const account = {
    id: crypto.randomUUID(),
    name: values.name.trim(),
    email,
    phone: values.phone.trim(),
    salt,
    passwordHash: await hashPassword(values.password, salt),
    joined: new Date().toISOString(),
  };
  // Re-read after asynchronous hashing so a newer local registration is retained.
  const accounts = getAccounts();
  if (accounts.some((existing) => existing.email === email)) {
    throw new Error(
      "An account with this email already exists. Please sign in.",
    );
  }
  if (!writeStored("accounts", [...accounts, account])) {
    throw new Error(
      "Your account couldn’t be saved. Please allow local storage.",
    );
  }
  return account;
}

export async function authenticate(email, password) {
  const account = getAccounts().find(
    (account) => account.email === email.trim().toLowerCase(),
  );
  if (
    !account ||
    (await hashPassword(password, account.salt)) !== account.passwordHash
  ) {
    throw new Error("That email and password don’t match. Please try again.");
  }
  return account;
}
```

Что объяснять по строкам:

- `trim()` удаляет пробелы по краям.
- `toLowerCase()` позволяет искать email без учёта регистра.
- `some()` отвечает, существует ли дубликат.
- `crypto.randomUUID()` создаёт ID и соль.
- `await` ожидает результат хеширования.
- Повторное чтение аккаунтов после `await` помогает не затереть более новую локальную регистрацию.
- `find()` возвращает нужный аккаунт или `undefined`.
- Если аккаунт отсутствует либо хеш не совпал, выбрасывается ошибка.

#### Как хешируется пароль

Файл: `src/storage.js`.

```js
export async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
```

`TextEncoder` превращает строку в байты. `crypto.subtle.digest` вычисляет SHA-256. `Uint8Array` даёт отдельные байты результата; `toString(16)` и `padStart(2, "0")` превращают их в строку шестнадцатеричных символов.

**Соль** делает результаты одинаковых паролей в разных аккаунтах различными. Хеширование не является шифрованием с обратной расшифровкой.

Это учебная симуляция: пользователь может редактировать localStorage. Нельзя представлять её как защищённую production-авторизацию. Для настоящего сервиса нужны серверная проверка и защищённое управление сессией; одного SHA-256 в браузере недостаточно.

#### Как форма связывает всё вместе

Файл: `src/pages/Account.jsx`.

```jsx
async function submit(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const nextErrors = validate(values, kind);
  setErrors(nextErrors);
  setStatus("");
  if (Object.keys(nextErrors).length) {
    focusFirstError(form);
    return;
  }
  setBusy(true);
  try {
    const account = signup
      ? await registerAccount(values)
      : await authenticate(values.email, values.password);
    if (!writeStored("session", { id: account.id }))
      throw new Error(
        "Your session couldn’t be saved. Please allow local storage.",
      );
    setSession({ id: account.id });
    notify(
      signup
        ? `Welcome to the garage, ${account.name}.`
        : `Welcome back, ${account.name}.`,
    );
    navigate("/profile");
  } catch (error) {
    setStatus(
      error instanceof TypeError
        ? "Account access is unavailable. Use localhost or HTTPS and allow local storage."
        : error.message,
    );
  } finally {
    setBusy(false);
  }
}
```

- `preventDefault()` отменяет обычную отправку и перезагрузку страницы.
- `busy` предотвращает повторную обработку, пока текущая не завершилась.
- `Object.keys(nextErrors).length` проверяет, есть ли ошибки.
- `try/catch/finally` разделяет успех, ошибку и обязательный сброс `busy`.
- `setSession` обновляет интерфейс через состояние.
- `navigate("/profile")` меняет hash-маршрут.

#### Как устроен Profile Dastan

Файл: `src/pages/Account.jsx`.

```jsx
export function Profile() {
  const { user, saved, logout } = useApp();
  const savedCars = cars.filter((car) => saved.includes(car.id));
  const stored = readStored("messages", []);
  const messages = Array.isArray(stored)
    ? stored.filter((message) => message.owner === user?.id)
    : [];
```

`saved` — массив ID машин. `filter` превращает его в массив объектов автомобилей для карточек. Сообщения также фильтруются по ID владельца.

Файл: `src/pages/Account.jsx`.

```jsx
<div className="profile-info">
  <span className="profile-avatar" aria-hidden="true">
    {user.name[0].toUpperCase()}
  </span>
  <div>
    <h2>{user.name}</h2>
    <span>{user.email}</span>
  </div>
  <div>
    <span className="eyebrow">Phone</span>
    <p>{user.phone}</p>
  </div>
  <div>
    <span className="eyebrow">Member since</span>
    <p>
      {new Date(user.joined).toLocaleDateString("en", {
        month: "long",
        year: "numeric",
      })}
    </p>
  </div>
</div>
```

В JSX фигурные скобки вставляют JavaScript-значения. `user.name` и `user.email` взяты из сохранённого аккаунта. `new Date(...).toLocaleDateString` форматирует дату регистрации для вывода.

Если `user` отсутствует, Profile показывает гостевое состояние с действиями Sign In/Create Account. Это не серверная защита маршрута: страница доступна гостю, но отображает другой интерфейс.

#### Как показать авторизацию без заминок

Используйте вымышленные данные:

| Поле             | Значение            |
| ---------------- | ------------------- |
| Name             | Demo Driver         |
| Email            | defense@example.com |
| Phone            | +77001234567        |
| Password         | Skyline#34          |
| Confirm password | Skyline#34          |

Сначала зарегистрируйтесь, затем сохраните автомобиль **под аккаунтом**, затем откройте Profile и обновите страницу. После этого выйдите и войдите снова.

При повторной репетиции используйте другой email, например `defense+2@example.com`, либо войдите в уже созданный аккаунт. Не удаляйте все данные браузера посреди выступления.

**Реплика:** “Authentication is simulated with localStorage. Sign Up stores a local profile and a salted password hash. Log In checks the credentials, saves the current account ID and opens the profile.”

### 8.4. Подпункт 5.2 Form Validation

#### Что требуется

Ошибки должны появляться на странице. Проверяются обязательные значения, формат email, телефон и сложность пароля там, где эти поля присутствуют.

Открывающий тег формы:

Файл: `src/pages/Account.jsx`.

```jsx
<form
  noValidate
  onSubmit={submit}
  aria-label={signup ? "Create account" : "Sign in"}
>
```

`noValidate` отключает стандартный браузерный механизм проверки формы. Правила выполняет наш JavaScript. `inputMode="email"` помогает выбрать клавиатуру, но не проверяет email. `type="tel"` тоже не заменяет нашу проверку телефона.

#### Вся функция проверки

Файл: `src/validation.js`.

```js
export function validate(values, kind) {
  const errors = {};
  if (kind !== "login") {
    if (!values.name?.trim()) errors.name = "Please enter your name.";
    if (!values.phone?.trim()) errors.phone = "Please enter your phone number.";
    else if (
      !/^\+?[\d\s()-]+$/.test(values.phone) ||
      !/^\d{10,15}$/.test(values.phone.replace(/\D/g, ""))
    ) {
      errors.phone = "Use 10–15 digits, with an optional country code.";
    }
  }
  if (!values.email?.trim()) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "Enter an address like name@example.com.";
  if (kind === "login" || kind === "signup") {
    if (!values.password) errors.password = "Please enter your password.";
    else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
        values.password,
      )
    ) {
      errors.password =
        "Use 8+ characters with uppercase, lowercase, a number, and a symbol.";
    }
    if (kind === "signup" && !values.confirm)
      errors.confirm = "Please confirm your password.";
    else if (kind === "signup" && values.confirm !== values.password)
      errors.confirm = "Your passwords do not match.";
  }
  if (kind === "contact") {
    if (!values.subject?.trim()) errors.subject = "Please choose a topic.";
    if (!values.message?.trim()) errors.message = "Please write a message.";
    else if (values.message.trim().length < 10)
      errors.message = "Add a little detail — at least 10 characters.";
  }
  return errors;
}
```

Разбор регулярных выражений:

| Часть              | Значение                                                      |
| ------------------ | ------------------------------------------------------------- |
| ^ и $              | Начало и конец проверяемой строки                             |
| \d                 | Цифра                                                         |
| {10,15}            | От 10 до 15 повторений                                        |
| \+?                | Необязательный плюс                                           |
| (?=.*[a-z])        | В строке есть строчная латинская буква                        |
| (?=.*[A-Z])        | Есть заглавная латинская буква                                |
| (?=.*\d)           | Есть цифра                                                    |
| (?=.*[^A-Za-z0-9]) | Есть символ вне букв и цифр                                   |
| .{8,}              | Длина не меньше 8 символов                                    |
| replace(/\D/g, "") | Удаление всех нецифровых символов для проверки длины телефона |

Телефон проходит две проверки: разрешённые символы и количество цифр. Поэтому `+7 (700) 123-45-67` допустим, а `123` — нет.

Email-регулярка подходит для учебной формы, но не является полной реализацией всех возможных email-адресов.

#### Как ошибки связываются с полями

Файл: `src/components/Field.jsx`.

```jsx
const shared = {
  id,
  name,
  value,
  onChange,
  "aria-invalid": Boolean(error),
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  ...props,
};
```

Файл: `src/components/Field.jsx`.

```jsx
{
  error ? (
    <p id={`${id}-error`} className="field-error">
      {error}
    </p>
  ) : (
    hint && (
      <p id={`${id}-hint`} className="field-hint">
        {hint}
      </p>
    )
  );
}
```

`aria-invalid` указывает на ошибку, а `aria-describedby` связывает поле с текстом пояснения. Сам текст выводится обычным элементом на странице, без `alert()`.

Файл: `src/pages/Account.jsx`.

```jsx
function focusFirstError(form) {
  requestAnimationFrame(() =>
    form.querySelector('[aria-invalid="true"]')?.focus(),
  );
}
```

После обновления интерфейса выбирается первое ошибочное поле и получает фокус. `?.` предотвращает ошибку, если такого элемента нет.

#### Что вводить для демонстрации

| Проверка        | Неверное значение                 | Что должно произойти              |
| --------------- | --------------------------------- | --------------------------------- |
| Required        | Пустая форма                      | Сообщения у обязательных полей    |
| Email           | driver                            | Подсказка формата email           |
| Phone           | 123                               | Сообщение о 10–15 цифрах          |
| Password length | Aa1!                              | Сообщение о сложности/длине       |
| Uppercase       | skyline#34                        | Не хватает заглавной буквы        |
| Lowercase       | SKYLINE#34                        | Не хватает строчной               |
| Digit           | Skyline###                        | Не хватает цифры                  |
| Symbol          | Skyline123                        | Не хватает спецсимвола            |
| Confirmation    | Отличается от пароля              | Сообщение о несовпадении          |
| Credentials     | Wrong#2026 при существующем email | Ошибка входа, а не ошибка формата |
| Contact message | short                             | Нужно хотя бы 10 символов         |

Для демонстрации неверных credentials используйте пароль, который сам проходит правила сложности. Слово `wrong` сначала вызовет ошибку формата пароля, до сравнения с аккаунтом.

**Реплика:** “All forms use JavaScript validation with noValidate. Errors are displayed next to the fields, and focus moves to the first invalid input. We check required values, email, phone numbers and password complexity.”

### 8.5. Подпункт 5.3 Search and Filtering

#### Управляемое поле

Файл: `src/pages/Garage.jsx`.

```jsx
<input
  type="search"
  value={current.query}
  onChange={(event) => update({ query: event.target.value })}
  placeholder="Search a car, engine, or manufacturer…"
/>
```

`value` берётся из состояния. `onChange` записывает новый текст. Поэтому React всегда знает текущее значение поля.

#### Фильтрация и сортировка

Файл: `src/pages/Garage.jsx`.

```jsx
const [filters, setFilters] = useStoredState("filters", {
  query: "",
  layout: "all",
  maker: "all",
  sort: "curated",
});
const current = {
  query: "",
  layout: "all",
  maker: "all",
  sort: "curated",
  ...filters,
};
const update = (changes) => setFilters({ ...current, ...changes });
let results = cars.filter(
  (car) =>
    `${car.maker} ${car.name} ${car.generation} ${car.engine} ${car.engineType}`
      .toLowerCase()
      .includes(String(current.query).toLowerCase().trim()) &&
    (current.layout === "all" || car.layout === current.layout) &&
    (current.maker === "all" || car.maker === current.maker),
);
if (current.sort === "name")
  results = [...results].sort((a, b) => a.name.localeCompare(b.name));
if (current.sort === "year")
  results = [...results].sort((a, b) => a.year - b.year);
if (current.sort === "weight")
  results = [...results].sort((a, b) => a.weight - b.weight);
```

Три условия соединены через `&&`: поисковая строка, привод и производитель. Все должны быть истинными.

- `includes` ищет подстроку.
- `toLowerCase` убирает различие между заглавными и строчными буквами.
- `trim` убирает случайные пробелы в запросе.
- Значение `"all"` отключает соответствующее ограничение.
- `[...results]` создаёт копию перед `sort`, потому что `sort` меняет массив.
- `localeCompare` сравнивает названия.
- `a.weight - b.weight` сортирует по возрастанию массы.

Данные автомобилей находятся в `src/data.js`. API для поиска не вызывается.

#### Демонстрация на 20 секунд

1. Открыть Collection.
2. Ввести `rotary`: останется RX-7.
3. Включить AWD: появится пустое состояние.
4. Нажать Reset filters: вернутся шесть машин.
5. При необходимости выбрать производителя или Lightest first.

Если после перезагрузки сохраняется поиск, это ожидаемое поведение: фильтры записаны в `jdm:filters`.

**Реплика:** “Search updates the collection as the user types. It works together with manufacturer and drivetrain filters. We also provide sorting, a result count and a useful empty state.”

### 8.6. Избранное и отдельные гаражи

Файл: `src/App.jsx`.

```jsx
const accounts = readStored("accounts", []);
const user = Array.isArray(accounts)
  ? accounts.find((account) => account.id === session?.id)
  : null;
const owner = user?.id || "guest";
const saved = Array.isArray(garages?.[owner]) ? garages[owner] : [];
```

По `session.id` ищется аккаунт. Ключ владельца — ID пользователя либо `guest`.

Файл: `src/App.jsx`.

```jsx
function toggleSaved(id) {
  const exists = saved.includes(id);
  setGarages((previous) => ({
    ...previous,
    [owner]: exists ? saved.filter((item) => item !== id) : [...saved, id],
  }));
  notify(exists ? "Removed from your garage." : "Added to your garage.");
}
```

`includes` определяет, сохранена ли машина. Если она уже есть, `filter` удаляет её ID. Иначе spread создаёт новый массив с добавленным ID.

`...previous` сохраняет гаражи остальных владельцев. Квадратные скобки `[owner]` создают вычисляемое имя свойства.

**Важно для демонстрации:** если сохранить машину гостем, а потом зарегистрироваться, личный гараж будет отдельным. Это не потеря данных. Для личного профиля сохраните машину после входа.

Мини-таблица методов:

| Метод    | Что возвращает в нашем проекте                               |
| -------- | ------------------------------------------------------------ |
| map      | Новый массив элементов интерфейса                            |
| filter   | Новый массив подходящих машин                                |
| find     | Один аккаунт или автомобиль, либо undefined                  |
| some     | true/false: существует ли дубликат                           |
| includes | true/false: есть ли ID или подстрока                         |
| sort     | Отсортированный массив; меняет тот массив, на котором вызван |

## 9. Таск 6 Animated Button and UI Effects — 5 баллов

### Hover-эффекты

Файл: `src/styles.css`.

```css
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px #00000013;
}
.button svg {
  transition: transform 0.2s;
}
.button:hover svg {
  transform: translate(2px, -1px);
}
```

`transition` у базовой кнопки делает изменение плавным. `transform` сдвигает кнопку и иконку без изменения размеров соседних блоков. У карточек есть короткая анимация появления и небольшой эффект на иллюстрации.

### Уменьшение анимации

Файл: `src/styles.css`.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  .button:hover,
  .car-card:hover .car-art {
    transform: none;
  }
}
```

`prefers-reduced-motion` отражает системное предпочтение пользователя. В этом режиме отключаются необязательные CSS-анимации и трансформации.

### Как работает наш GIF

Файл: `src/pages/Home.jsx`.

```jsx
<picture className="hero-motion">
  <source
    media="(prefers-reduced-motion: reduce)"
    srcSet={`${import.meta.env.BASE_URL}images/initiald-last.webp`}
  />
  <img
    src={`${import.meta.env.BASE_URL}images/initiald-once.gif`}
    alt="A black Mitsubishi Lancer Evolution on a mountain road in Initial D"
    width="498"
    height="278"
    fetchPriority="high"
  />
</picture>
```

`picture` выбирает статичный последний кадр, если включено уменьшение анимации. В обычном режиме загружается `initiald-once.gif`.

В этом GIF **109 кадров по 50 мс: 109 × 50 = 5450 мс**, то есть **5,45 секунды**. Повтор отключён внутри самого файла. Никакого `setInterval` для перелистывания кадров нет.

Вот разовая подготовка ассета; это не код, который выполняется на сайте:

```python
from pathlib import Path
from PIL import Image

source = Path("/home/morninginheaven/Downloads/initiald.gif")
data = source.read_bytes()
loop_extension = b"\x21\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00"

assert data.count(loop_extension) == 1
Path("public/images/initiald-once.gif").write_bytes(
    data.replace(loop_extension, b"", 1)
)

with Image.open("public/images/initiald-once.gif") as image:
    image.seek(image.n_frames - 1)
    image.convert("RGB").save(
        "public/images/initiald-last.webp", lossless=True
    )
```

Этот пример относится к предоставленному файлу с проверенным расширением повтора. Это не универсальный конвертер любых GIF.

В браузере после одного прохода остаётся последний кадр. У `img` нет рабочего HTML-атрибута `loop` для управления GIF: повтор задаётся в данных изображения.

**Реплика:** “The effects are short and support the interaction. The hero GIF plays once, then stays on its last frame. Users who prefer reduced motion see that static frame immediately.”

## 10. Таск 7 External API Integration — 10 баллов

### Что приходит извне

Open-Meteo возвращает погоду для выбранного города:

- температуру и код состояния погоды;
- скорость ветра;
- максимум и минимум температуры на три дня;
- вероятность осадков.

Города — Tokyo, Yokohama и Suzuka. Координаты находятся в `src/data.js`. Это дополнение для планирования посещения японских автомобильных локаций.

### Код жизненного цикла запроса

Файл: `src/pages/Drive.jsx`.

```jsx
useEffect(() => {
  const controller = new AbortController();
  let disposed = false;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 12000);
  setRequest({ status: "loading", data: null });
  async function load() {
    try {
      const params = new URLSearchParams({
        latitude: city.latitude,
        longitude: city.longitude,
        current: "temperature_2m,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "Asia/Tokyo",
        forecast_days: "3",
      });
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Weather service is unavailable.");
```

### Как объяснить этот код

1. `useEffect` запускает загрузку при изменении `city.id` или `attempt`.
2. `AbortController` позволяет отменить запрос.
3. Сразу устанавливается состояние `loading`.
4. Таймер через 12 000 мс отменяет слишком долгую загрузку.
5. `URLSearchParams` формирует параметры запроса.
6. `fetch` возвращает HTTP-ответ.
7. `response.ok` проверяет HTTP-статус. Сам `fetch` не превращает любой HTTP 404/500 в исключение.
8. `await response.json()` читает JSON.
9. Данные дополнительно проверяются: числа должны быть конечными, массивы должны содержать три дня.
10. `setRequest({ status: "success", data })` обновляет интерфейс.
11. `catch` создаёт понятное сообщение об ошибке.
12. `finally` очищает таймер.
13. Cleanup отменяет старый запрос и помечает компонент как неактуальный.
14. `disposed` не даёт старому ответу перезаписать новую выбранную локацию.
15. Кнопка Try again увеличивает `attempt`, поэтому эффект запускается снова.

`city.id` и `attempt` — зависимости эффекта. Если снова запросить тот же город, одного значения `city.id` было бы недостаточно, поэтому есть отдельный счётчик попыток.

### Что показать

- Открыть Drive Forecast.
- Показать загруженные значения и источник Open-Meteo.
- Выбрать другой город.
- Для ошибки включить Offline в Network, нажать Refresh weather.
- Показать понятную ошибку и Try again.
- Выключить Offline и повторить запрос.

Не оставляйте Offline включённым перед следующей частью демонстрации.

### Как объяснить loading, error и success

Это три взаимоисключающих состояния одного запроса. При загрузке показывается индикатор, при ошибке — сообщение и повтор, при успехе — погодные данные. Не нужно рисовать случайные значения, когда сеть недоступна.

Автоматические тесты дополнительно используют контролируемые ответы для воспроизводимости. Они проверяют обработку интерфейса, но не доказывают доступность живого сервиса. В PDF такие ответы подписаны отдельно от live-данных.

**Реплика:** “We use async fetch to request weather from Open-Meteo. The component displays loading, success and error states. It cancels obsolete requests, applies a timeout and lets the user retry.”

### Частые вопросы

| Вопрос                                      | Ответ                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Почему API соответствует теме?              | Города связаны с японской автомобильной культурой, а погода помогает спланировать посещение.        |
| Где API key?                                | В этой реализации используемый публичный endpoint не требует ключа.                                 |
| Зачем проверять JSON после HTTP 200?        | Успешный статус не гарантирует ожидаемую структуру и корректные значения.                           |
| Что будет при быстром переключении городов? | Cleanup отменяет старый запрос; disposed предотвращает применение неактуального ответа.             |
| Для чего timezone?                          | API возвращает прогноз для Asia/Tokyo; даты в интерфейсе также интерпретируются как японское время. |
| Будет ли погода работать без интернета?     | Нет. Будет показано обработанное состояние ошибки.                                                  |

## 11. Таск 8 Feature Cohesion and Relevance — 10 баллов

Не перечисляйте фичи как несвязанные технические упражнения. Объясняйте пользовательскую задачу.

| Функция              | Связь с темой                                                         |
| -------------------- | --------------------------------------------------------------------- |
| Collection и details | Исследование японских автомобилей и их инженерии                      |
| Search/filter        | Поиск модели по производителю, приводу и двигателю                    |
| Culture              | Контекст: инженерия, вождение и автоспорт                             |
| Profile/garage       | Личная коллекция любимых машин                                        |
| Drive Forecast       | Планирование посещения тематических локаций в Японии                  |
| Contact              | Предложение машины, история или обратная связь                        |
| Initial D GIF        | Узнаваемое тематическое вступление, которое затем перестаёт отвлекать |

### Что должен объяснить Dastan про Culture

Файл: `src/pages/Editorial.jsx`.

```jsx
<div className="editorial-stories">
  {stories.map((story) => (
    <article key={story.id} className="editorial-story">
      <div className="story-visual">
        <span className="story-number">{story.number}</span>
        <CarArt car={cars.find((car) => car.id === story.car)} />
        <span className="eyebrow">{story.category}</span>
      </div>
      <div className="story-text">
        <span className="eyebrow">{story.category}</span>
        <h2>{story.title}</h2>
        <p className="story-intro">{story.intro}</p>
        <p>{story.text}</p>
        <a className="text-link" href={`#/cars/${story.car}`}>
          Meet the machine <Icon name="diagonal" />
        </a>
      </div>
    </article>
  ))}
</div>
```

- `stories` — массив статей из `data.js`.
- `map` превращает его в элементы `article`.
- `key={story.id}` даёт каждому элементу устойчивый идентификатор.
- `find` выбирает связанную машину.
- Ссылка ведёт на её подробную страницу.
- Данные отделены от разметки: новую статью можно добавить в массив.

About Us использует статический текст и массивы для участников и ценностей проекта. У каждого участника выводятся имя, номер и подпись; `map` сохраняет одинаковую структуру карточек.

Фрагмент About Us для разбора Dastan. Файл: `src/pages/Editorial.jsx`.

```jsx
<div className="team-grid">
  {[
    ["01", "Dastan", "Explore. Build. Refine."],
    ["02", "Beibarys", "Details make the difference."],
  ].map(([number, name, motto]) => (
    <article className="team-member" key={name}>
      <div className="team-avatar" aria-hidden="true">
        {name[0]}
        <span>{number}</span>
      </div>
      <div>
        <span className="eyebrow">Team letsgo / SE-2516</span>
        <h3>{name}</h3>
        <p>{motto}</p>
      </div>
    </article>
  ))}
</div>
```

Массив содержит номер, имя и подпись. Деструктуризация `([number, name, motto])` даёт понятные переменные для JSX. `name[0]` берёт первую букву имени для аватара. `aria-hidden` исключает декоративный аватар из повторного озвучивания; имя участника остаётся в заголовке.

**Реплика:** “Every feature supports the same automotive theme. The collection explains the cars, Culture adds context, the garage keeps favourites, and the forecast supports visiting relevant Japanese destinations.”

## 12. Таск 9 Overall Presentation — 5 баллов

Презентация должна включать введение, демонстрацию и заключение. Время — **максимум 5 минут**, целевой диапазон **4:30–5:00**. По документу за каждые лишние 30 секунд снимают 2 балла; выступление короче 4 минут также не рекомендуется.

Код из этого файла нужен для понимания и ответов. Во время основного пятиминутного выступления показывайте готовый сайт. Не пытайтесь зачитывать все фрагменты или редактировать код во время плановой демонстрации.

Подробный сценарий и реплики — в разделе 15.

## 13. Таск 10 Code Quality and File Organization — 5 баллов

### Как организованы файлы

```text
final-project/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── data.js
│   ├── account.js
│   ├── storage.js
│   ├── theme.js
│   ├── validation.js
│   ├── styles.css
│   ├── hero.css
│   ├── components/
│   │   ├── CarCard.jsx
│   │   ├── CarArt.jsx
│   │   ├── Field.jsx
│   │   └── Icon.jsx
│   └── pages/
│       ├── Home.jsx
│       ├── Garage.jsx
│       ├── Editorial.jsx
│       ├── Account.jsx
│       └── Drive.jsx
├── public/
│   ├── images/
│   └── fonts/
├── tests/
├── docs/
└── .github/workflows/pages.yml
```

### Почему это удобно

- Общая проверка форм вынесена в `validation.js`, поэтому правила не расходятся между страницами.
- Регистрация и вход отделены от JSX в `account.js`.
- Карточки и поля формы переиспользуются.
- Данные машин, статей и городов находятся в `data.js`.
- Компоненты страниц отделены от общего каркаса.
- Lock-файл фиксирует дерево зависимостей.

### Команды проверки

```bash
npm test
npm run build
CHROMIUM_PATH=/usr/bin/google-chrome-stable npm run test:browser
npm run report
```

Путь к Chrome в третьей команде относится к текущей Linux-машине. Если установлен браузер Playwright, достаточно `npm run test:browser`.

`npm test` проверяет 16 именованных тестов в четырёх файлах: validation, account, theme, render. Проверяются неправильные значения, локальные аккаунты, хеши, storage errors, начальная тема и серверный рендеринг маршрутов.

`npm run build` подтверждает сборку production-файлов. Сам по себе он не подтверждает корректный вид на телефоне.

Браузерные проверки проверяют реальные клики, формы, темы и размеры экрана. Отчёт использует настоящие PNG-снимки; для них записываются контрольные суммы и fingerprint сборки.

На момент подготовки этого материала прошли **16 тестов логики/рендеринга** и **105 браузерных проверок**. Для отчёта снято **26 реальных состояний страниц**, включая мобильные варианты и формы; отдельно успешно проверен живой запрос к Open-Meteo. Эти результаты относятся к проверенной локальной сборке и не заменяют проверку опубликованного сайта перед выступлением.

**Реплика:** “We separate page components, reusable UI, data and business logic. The shared validation and account helpers are testable, and Vite produces a reproducible static build.”

## 14. Общие вопросы по React и JavaScript

| Вопрос преподавателя                                          | Короткий ответ                                                                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Что такое компонент?                                          | Функция, которая возвращает описание части интерфейса через JSX.                                                                  |
| Что такое JSX?                                                | Синтаксис описания интерфейса внутри JavaScript; Vite преобразует его для React.                                                  |
| Что такое props?                                              | Данные, которые родитель передаёт компоненту. Пример: объект car для CarCard.                                                     |
| Что такое state?                                              | Данные компонента, изменение которых через setter вызывает обновление интерфейса.                                                 |
| Почему не изменить обычную переменную?                        | React не узнает, что из-за такого изменения нужно обновить экран.                                                                 |
| Почему используют setter с previous?                          | Когда новое состояние зависит от предыдущего, функция получает актуальное предыдущее значение.                                    |
| Что делает useEffect?                                         | Синхронизирует компонент с внешними действиями: fetch, localStorage, DOM и событиями.                                             |
| Что такое cleanup?                                            | Функция, возвращаемая эффектом; снимает обработчики, очищает таймеры или отменяет запрос.                                         |
| Что делает useContext?                                        | Читает общее значение ближайшего Provider.                                                                                        |
| Что такое пользовательский хук?                               | Функция, начинающаяся с use, которая объединяет переиспользуемую логику хуков.                                                    |
| Зачем key в map?                                              | Для устойчивого сопоставления элементов списка при обновлениях. Используется ID, а не случайное число.                            |
| Почему нельзя мутировать массив state?                        | Изменение того же объекта усложняет обнаружение обновления; мы создаём новый массив/объект.                                       |
| Что делают ... в объектах и массивах?                         | Создают копию свойств или элементов; это поверхностная копия.                                                                     |
| Что такое controlled input?                                   | Поле, значение которого задаётся через state и обновляется через onChange.                                                        |
| event.target и currentTarget?                                 | target — исходный элемент события; currentTarget — элемент с текущим обработчиком. В submit нам нужна форма.                      |
| Зачем preventDefault?                                         | Чтобы браузер не выполнял стандартную отправку формы с перезагрузкой.                                                             |
| Что такое async/await?                                        | Синтаксис работы с Promise; await приостанавливает выполнение данной async-функции до результата.                                 |
| Что делает try/catch/finally?                                 | try выполняет операцию; catch обрабатывает ошибку; finally выполняется независимо от исхода.                                      |
| Что такое JSON?                                               | Текстовый формат данных. Он нужен для хранения объектов строками и чтения API-ответа.                                             |
| Что такое optional chaining ?. ?                              | Безопасный доступ, который возвращает undefined, если промежуточное значение null/undefined.                                      |
| Чем оператор ?? отличается от логического ИЛИ?                | ?? использует запасное значение только для null/undefined; логическое ИЛИ — для любого falsy-значения, включая 0 и пустую строку. |
| Есть ли backend?                                              | Нет. Аккаунты и Contact — локальные симуляции; погода запрашивается у внешнего сервиса.                                           |
| Есть ли JWT?                                                  | Нет. В jdm:session хранится ID локального аккаунта.                                                                               |
| Защищён ли Profile от редактирования localStorage?            | Нет. Это учебная симуляция; реальную защиту проверяет сервер.                                                                     |
| Можно ли через DevTools увидеть пароль?                       | Открытого пароля в аккаунте нет. Есть соль и хеш, но локальная модель всё равно не является защищённой авторизацией.              |
| Почему некоторые эффекты запускаются повторно при разработке? | Приложение обёрнуто в StrictMode; он помогает выявлять проблемы с чистотой функций и cleanup.                                     |

### Три цепочки, которые нужно уметь рассказать без подсказки

**Поиск:** ввод → onChange → setFilters → новое состояние → filter/sort → map карточек.

**Вход:** submit → validate → authenticate → сравнение хеша → setSession → navigate → Profile.

**Погода:** выбор города → эффект → loading → fetch → проверка HTTP и JSON → success/error → вывод интерфейса.

## 15. Полный сценарий демонстрации на 4 минуты 45 секунд

### Порядок и роли

| Время     | Кто      | Что показать                                                   |
| --------- | -------- | -------------------------------------------------------------- |
| 0:00–0:30 | Dastan   | Представить команду, группу, тему и аудиторию                  |
| 0:30–1:00 | Dastan   | About Us и Culture, затем вернуться на Home                    |
| 1:00–1:35 | Beibarys | Главная, GIF, кратко дизайн и смена темы с сохранением         |
| 1:35–2:15 | Beibarys | Collection: rotary, AWD, Reset, детали машины                  |
| 2:15–3:10 | Beibarys | Ошибки регистрации, правильная регистрация, выход и вход       |
| 3:10–3:40 | Dastan   | Сохранить машину после входа, Profile, Refresh, коротко mobile |
| 3:40–4:15 | Beibarys | Погода, смена города, loading/error/retry при необходимости    |
| 4:15–4:30 | Beibarys | Contact и локальное подтверждение                              |
| 4:30–4:45 | Оба      | Преимущества, дальнейшее развитие и благодарность              |

### Dastan Введение

> “Hello, we are Dastan and Beibarys from group SE-2516, team letsgo. Our project is JDM Legends, a React website about Japanese performance cars. It is designed for enthusiasts and curious newcomers. Our goal is to connect the cars, their engineering and the culture around them in one focused collection.”

### Dastan About Us и Culture

> “I implemented the About Us, Culture and Profile pages. About Us explains our purpose and introduces the team. Culture adds context through engineering, driving and motorsport stories. Each story can lead to a relevant car, so the content stays connected to the collection.”

### Beibarys Главная и тема

> “I implemented the remaining pages and shared functionality. The homepage uses a full-width Initial D animation with a short heading and one main action. It plays once and stays on the last frame. The theme toggle changes the complete palette and remembers the choice across pages and reloads.”

### Beibarys Каталог

> “The collection has six cars. Searching for rotary immediately shows the RX-7. If I combine it with AWD, there are no matches, so the page provides a clear empty state and reset action. Each car also has a detail page with a story, specifications and a save action.”

### Beibarys Формы и авторизация

> “Forms use our own JavaScript validation. Invalid email, phone numbers or weak passwords receive messages next to the fields. After valid registration, the application stores a local profile and a salted password hash. We can sign out, sign back in and return to the profile. This is the required local simulation.”

### Dastan Профиль

> “After signing in, I can save a car to my personal garage. Profile displays the stored name, email, phone number and saved cars. Reloading keeps the collection because it is stored in localStorage. Guest favourites are kept separately. The layout also adapts to a narrow mobile viewport.”

### Beibarys API

> “Drive Forecast requests real weather from Open-Meteo for Japanese automotive destinations. Selecting a city starts a new request. We handle loading, errors and retry, cancel outdated requests and use a timeout. The interface also shows the data source and forecast time.”

### Beibarys Contact

> “The contact form validates the message and saves it locally. The confirmation clearly explains that no email was sent.”

### Заключение

> “Our strengths are a focused collection, consistent themes, useful local features and a relevant public API. In the future, we would add a backend and cross-device garages. Thank you for your attention.”

### Что убрать, если время заканчивается

Сократите подробный рассказ о дизайне и не объясняйте все поля автомобиля. Оставьте хотя бы одну демонстрацию каждого ключевого пункта: mobile, theme, validation, authentication, search и API.

Не тратьте 30 секунд на ожидание второго проигрывания GIF: он специально не зациклен. Не показывайте все шесть автомобилей по очереди.

## 16. Как готовиться перед защитой

### План на два часа

| Время подготовки | Что сделать                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- |
| 0–15 минут       | Запустить сайт, пройти все маршруты, понять структуру файлов                       |
| 15–35 минут      | Разобрать собственные страницы и объяснить каждый вывод данных                     |
| 35–60 минут      | Разобрать state, Context, localStorage, регистрацию и валидацию                    |
| 60–80 минут      | Пройти поиск, API и обработку ошибок; найти код без долгого поиска                 |
| 80–100 минут     | Задавать друг другу вопросы из раздела 14 и выполнить одно тренировочное изменение |
| 100–115 минут    | Два раза прогнать демонстрацию с таймером и передачей слова                        |
| 115–120 минут    | Проверить live-ссылку, файлы сдачи, сеть и резервные снимки                        |

### Dastan Приоритеты

1. `Culture`: как `stories.map` создаёт статьи и как выбирается связанный автомобиль.
2. `About`: структура страницы, вывод команды и ценностей.
3. `Profile`: откуда берутся `user`, `saved` и сообщения.
4. Почему `savedCars` вычисляется через `filter`.
5. Что показывается гостю.
6. Как Profile связан с общим Context, сессией и localStorage.

### Beibarys Приоритеты

1. Маршрутизация и общие компоненты.
2. `validate` и обработчик `submit`.
3. Регистрация, хеш, проверка credentials и создание сессии.
4. Поиск и совместная работа фильтров.
5. `useTheme` и согласованная палитра.
6. `fetch`, зависимости эффекта, AbortController и timeout.
7. Адаптивные сетки, hero и однократный GIF.
8. Сборка и публикация.

### Если осталось только 20 минут

- 5 минут: выучить три цепочки данных и разделение работы.
- 5 минут: пройти успешный вход, поиск и API на сайте.
- 5 минут: проговорить вопросы о state, localStorage, validation и fetch.
- 5 минут: один раз выполнить укороченную демонстрацию с таймером.

Выучите смысл кода, а не только названия методов. Хорошая проверка: закрыть файл и своими словами объяснить, что изменится на экране после клика.

## 17. Тренировочные изменения для вопросов преподавателя

По правилам основная презентация идёт по готовому сайту без live coding. Следующие упражнения — для подготовки и отдельного запроса преподавателя. Они **не внесены** в текущую реализацию.

### Упражнение A Сделать минимум пароля 10 символов

В `src/validation.js` заменить:

```js
.{8,}
```

на:

```js
.{10,}
```

Также изменить сообщение об ошибке и подсказку `8+ characters` в `Account.jsx`. Если изменить только regex, интерфейс будет объяснять старое правило. После изменения обновить соответствующие тестовые примеры.

### Упражнение B Разрешить поиск по годам

Сейчас строка поиска собирает производителя, модель, поколение, код и тип двигателя. Добавьте `car.years` в эту строку.

Можно собрать её без шаблонного литерала:

```js
[
  car.maker,
  car.name,
  car.generation,
  car.engine,
  car.engineType,
  car.years,
].join(" ");
```

После этого текущая логика `toLowerCase().includes(...)` сможет находить текстовые годы. Это поиск по строке диапазона, а не полноценная проверка, производилась ли машина в любой год между границами.

### Упражнение C Сделать таймаут API 8 секунд

В `Drive.jsx` заменить `12000` в `setTimeout` на `8000`. Объясните: единицы — миллисекунды. Не удаляйте `clearTimeout` из `finally` и cleanup.

### Упражнение D Поменять акцентный цвет

Найти `--accent` в `styles.css` и заменить значение. Проверить основной CTA, сердечки и другие акцентные элементы в обеих темах. Для текста на акцентном фоне используется `--accent-text`; его контраст тоже нужно проверить.

### Упражнение E Изменить значение фильтра по умолчанию

Изменить `layout: "all"` на `layout: "AWD"` в начальных значениях Collection. При проверке учесть, что уже сохранённые фильтры могут переопределить default.

Только для сброса фильтров в демонстрационном origin:

```js
localStorage.removeItem("jdm:filters");
location.reload();
```

Не используйте `localStorage.clear()` ради одного фильтра: это удалит аккаунты, гаражи и другие данные этого сайта.

### Упражнение F Добавить статью Culture

Добавить объект в массив `stories` в `data.js` с полями `id`, `number`, `category`, `title`, `intro`, `text` и `car`. `car` должен совпадать с существующим ID автомобиля.

Компонент уже использует `map`, поэтому отдельную JSX-карточку вручную дублировать не требуется.

## 18. Если во время демонстрации что-то пошло не так

| Ситуация                                                 | Причина и действие                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| После входа пустой гараж                                 | Машина могла быть сохранена гостем. Сохраните её после входа в аккаунт.                                                            |
| Регистрация говорит, что email уже существует            | Используйте существующий аккаунт или новый sample email.                                                                           |
| После установки dark default всё ещё светло              | Сохранённый выбор пользователя имеет приоритет. Нажмите переключатель.                                                             |
| После смены порта аккаунт исчез                          | Другой origin имеет отдельный localStorage. Вернитесь на тот же хост и порт.                                                       |
| API показывает ошибку                                    | Проверьте Offline в DevTools и интернет, затем Try again. Объясните обработку ошибки; при необходимости покажите резервный снимок. |
| GIF не повторяется                                       | Это требуемое поведение. Файл настроен на один проход.                                                                             |
| GIF сразу статичный                                      | Возможно, включён prefers-reduced-motion: выбирается WebP последнего кадра.                                                        |
| Аккаунты не работают после открытия HTML двойным щелчком | Запустите через npm run dev и откройте localhost. Для Web Crypto нужен подходящий secure context, например localhost или HTTPS.    |
| Поиск уже отфильтрован                                   | Настройки сохраняются. Нажмите Reset filters.                                                                                      |
| Контактное сообщение не пришло на почту                  | Писем нет: это явная локальная симуляция.                                                                                          |
| Браузерный тест не находит Chromium                      | Укажите установленный браузер через CHROMIUM_PATH или установите Chromium через Playwright.                                        |
| После обновления опубликованного маршрута 404            | Проверьте корректный hash-адрес, публикацию dist и базовый путь.                                                                   |
| В PDF показаны тестовые погодные значения                | Убедитесь, что подпись указывает controlled response. Для живого API отдельно показывайте текущий запрос к сервису.                |

Лучше спокойно объяснить состояние и показать обработанный сценарий, чем обещать функцию, которой в проекте нет.

## 19. Что проверить перед входом в аудиторию

### Сайт и демонстрация

- [ ] Есть настоящий рабочий live-адрес.
- [ ] На live-сайте открываются все основные страницы и детали автомобилей.
- [ ] После Refresh маршрут работает.
- [ ] Тема сохраняется.
- [ ] Регистрация, вход, выход и профиль проверены.
- [ ] Машина сохраняется именно в аккаунт, который будете показывать.
- [ ] Поиск rotary, AWD и Reset отрепетированы.
- [ ] API проверен с рабочей сетью.
- [ ] В DevTools выключен Offline.
- [ ] Подготовлены sample email, телефон и пароль.
- [ ] Есть резервные скриншоты или запись экрана.
- [ ] Оба участника знают свою очередь и не укладываются впритык к 5:00.

### Файлы сдачи

По предоставленным PDF каждый участник сдаёт все три файла:

```text
JDM_Legends_SE2516_FinalProject.zip
JDM_Legends_SE2516_Report.pdf
JDM_Legends_SE2516_Links.txt
```

В отчёте нужны название и команда, цель, фактическое распределение работы, подробное описание сайта и скриншоты. В TXT нужны repository URL и live URL. ZIP должен содержать проект с исходниками и ассетами.

Срок из требований — **18.11.2026 23:59**. Подавать нужно в Moodle FINAL EXAM folder. Неверный формат, отсутствие файла или отсутствие индивидуальной подачи могут привести к указанному в документе штрафу **–30 баллов**.

## 20. Краткая памятка перед выступлением

1. **React:** компоненты + props + state; общие данные через Context.
2. **Routes:** читаем hash, обновляем state, выбираем компонент.
3. **Theme:** data-theme + CSS variables + localStorage.
4. **Auth:** validate → local account → salt/hash → session → profile.
5. **Forms:** noValidate, собственные правила, ошибки у полей.
6. **Search:** controlled input → filter → sort → map.
7. **Garage:** ID машин разделены по владельцам.
8. **API:** loading → fetch → проверка → success/error → retry; cleanup отменяет старое.
9. **GIF:** один цикл в файле, последний кадр; reduced motion — WebP.
10. **Hosting:** repository и live — разные ссылки; публикуется dist.
11. **Roles:** Dastan — About/Culture/Profile; Beibarys — остальные страницы и функции.
12. **Timing:** показать работающий сайт за 4:30–5:00; подробный код оставить для вопросов.
