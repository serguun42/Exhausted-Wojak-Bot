const { writeFile } = require('fs/promises');
const { inspect } = require('util');
const { Telegraf } = require('telegraf');

/** @type {import('./types').TelegramConfig} */
const TELEGRAM_CONFIG = require('./config/telegram.json');

const { TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_ID, PICTURES, BOT_USERNAME, WELCOME_MESSAGE } = TELEGRAM_CONFIG;
const telegraf = new Telegraf(TELEGRAM_BOT_TOKEN);
const { telegram } = telegraf;

const IS_DEV = process.env.NODE_ENV === 'development';

const SHORT_DELIMITER = Array.from({ length: 30 }, () => '~').join('');
const START_DELIMITER = Array.from({ length: 30 }, () => '🔽').join('');
const END_DELIMITER = Array.from({ length: 30 }, () => '🔼').join('');

/**
 * @param {...any} args
 * @returns {string}
 */
const WrapForOutput = (...args) =>
  args.map((arg) => inspect(arg, { depth: Infinity, colors: true })).join(`\n${SHORT_DELIMITER}\n`);

/**
 * @param  {...(string | Error)} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
  const containsError = args.some(
    (message) => message instanceof Error || (typeof message === 'string' && /error/i.test(message))
  );
  // eslint-disable-next-line no-console
  const out = containsError ? console.error : console.log;

  if (containsError) {
    out(START_DELIMITER);
    out(new Date());
    out(WrapForOutput(...args));
    out(END_DELIMITER);
  } else out(...args);

  if (IS_DEV) writeFile('./out/logmessageorerror.json', JSON.stringify(args, false, '\t')).catch(out);
};

if (!IS_DEV) {
  telegram
    .sendMessage(ADMIN_TELEGRAM_ID, `Exhausted Wojak Bot spawned at ${new Date().toISOString()}`, {
      disable_notification: true,
    })
    .catch(LogMessageOrError);
}

/**
 * @param {import('./types').TelegramUser} from
 * @returns {string}
 */
const UserToString = (from) =>
  `${from.first_name} ${from.last_name || ''} (lang: ${from.language_code}) (${
    from.username ? `@${from.username}` : `ID: ${from.id}`
  })`;

telegraf
  .on('message', (ctx) => {
    const { chat, from, message } = ctx;

    if (!('text' in message)) return;
    const { text } = message;
    if (!text) return;

    if (chat.type === 'private') LogMessageOrError(`Private chat – ${UserToString(from)}`);
    else LogMessageOrError('New group', chat.id, chat.title, chat.type);

    if (
      (chat.type === 'private' && /^\/(help|start)$/i.test(text.trim())) ||
      /^\/(help|start)@exhausted_wojak_bot$/i.test(text.trim())
    )
      ctx
        .reply(WELCOME_MESSAGE.replace(/\${BOT_USERNAME}/g, BOT_USERNAME), {
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        })
        .catch(LogMessageOrError);
  })
  .catch(LogMessageOrError);

telegraf
  .on('inline_query', (ctx) => {
    const userCaption = ctx.inlineQuery.query || undefined;

    LogMessageOrError(`Inline query – ${UserToString(ctx.from)}`);

    const results = PICTURES.map(
      /** @returns {import('./types').TelegramInlineQueryResult} */ (picture, pictureIndex) => ({
        type: 'photo',
        id: `ewb${pictureIndex}${Date.now()}`.slice(0, 64),
        photo_url: picture.url,
        photo_width: picture.width,
        photo_height: picture.height,
        thumb_url: picture.thumb,
        title: userCaption,
        caption: userCaption,
      })
    );

    return ctx.answerInlineQuery(results).catch(LogMessageOrError);
  })
  .catch(LogMessageOrError);

telegraf.launch();

process.on('unhandledRejection', (reason, promise) =>
  LogMessageOrError('Unhandled Rejection at: Promise', promise, 'reason:', reason)
);
process.once('SIGINT', () => telegraf.stop('SIGINT'));
process.once('SIGTERM', () => telegraf.stop('SIGTERM'));
