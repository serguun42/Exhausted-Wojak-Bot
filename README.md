# Exhausted-Wojak-Bot

Inline Telegram bot. Sends picture of exhausted wojak (or anything else) with your message.

### Config

You need to edit [`config/telegram.json`](./config/telegram.json) file to include the following:

-   Token from [@BotFather](https://t.me/BotFather)
-   URLs of pictures being sent
    -   `url` for full image
    -   `thumb` for small-size preview
    -   `width` and `height` – sizes of full image, can be omitted
-   Admin's user ID - for sending notifications
-   Bot's username - for proper help command
-   Text for `/help` command

### How to run

1. Install necessary dependencies – `npm i --production`
2. Run bot – `npm run production`

### How to use

Instuction are given in `WELCOME_MESSAGE` property in configuration file, bot's username is being injected into default template.

### Some links

-   [Telegraf Module for Node.js](https://telegraf.js.org/)
-   [Telegram Bots API](https://core.telegram.org/bots/api)

---

### [BSL-1.0 License](./LICENSE)
