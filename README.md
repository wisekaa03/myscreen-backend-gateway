### Подготовка
Перед использованием у вас должен быть .env, пример лежит в .env.example.
- yarn docker:dev - отладочная версия чтобы подготовить postgres и pgadmin4
- yarn docker:prod - рабочая версия, только чистый postgres
### Запуск
- yarn start:debug - отладочная версия
- yarn build && yarn start:prod - рабочая версия
### WS Server
- Подключаемся к ws://localhost:3000/ws
- Вводим
  ```
  {
    "event": "auth/token",
    "data": {
      "token": "...То, что мы получили через http://localhost:3000/api/v2/auth/monitor...",
      "date": "...Текущая дата..."
    }
  }
  ```
