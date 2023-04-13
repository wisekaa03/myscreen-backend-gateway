### Подготовка
Перед использованием у вас должен быть .env, пример лежит в .env.example.
- yarn docker:dev - отладочная версия чтобы подготовить postgres и pgadmin4
- yarn docker:prod - рабочая версия, только чистый postgres
### Запуск
- yarn start:debug - отладочная версия
- yarn build && yarn start:prod - рабочая версия
