const
	fs = require("fs"),
	DEV = require("os").platform() === "win32" || process.argv[2] === "DEV",
	L = function(arg) {
		if (DEV) {
			console.log(...arguments);
			if (typeof arg == "object") fs.writeFileSync("./out/errors.json", JSON.stringify(arg, false, "\t"));
		};
	},
	Telegraf = require("telegraf"),
	Sessions = require("telegraf/session"),
	Telegram = require("telegraf/telegram");


/**
 * @typedef {Object} Picture
 * @property {String} url
 * @property {String} thumb
 * @property {Number} width
 * @property {Number} height
 * 
 * @typedef {Object} ConfigFile
 * @property {String} TELEGRAM_BOT_TOKEN
 * @property {{id: number, username: string}} ADMIN_TELEGRAM_DATA
 * @property {Picture[]} PICTURES
 * @property {String} WELCOME_MESSAGE
 */
/** @type {ConfigFile} */
const
	CONFIG = require("./exhausted_wojak_bot.config.json"),
	{
		TELEGRAM_BOT_TOKEN,
		ADMIN_TELEGRAM_DATA,
		PICTURES,
		WELCOME_MESSAGE
	} = CONFIG;



const
	telegram = new Telegram(TELEGRAM_BOT_TOKEN),
	TOB = new Telegraf(TELEGRAM_BOT_TOKEN);



/**
 * @typedef {Object} TelegramFromObject
 * @property {Number} id
 * @property {String} first_name
 * @property {String} username
 * @property {Boolean} is_bot
 * @property {String} language_code
 * 
 * @typedef {Object} TelegramChatObject
 * @property {Number} id
 * @property {String} title
 * @property {String} type
 * 
 * @typedef {Object} TelegramPhotoObj
 * @property {String} file_id
 * @property {String} file_unique_id
 * @property {Number} file_size
 * @property {Number} width
 * @property {Number} height
 * 
 * @typedef {Object} TelegramMessageObject
 * @property {Number} message_id
 * @property {String} text
 * @property {TelegramFromObject} from
 * @property {TelegramChatObject} chat
 * @property {Number} date
 * @property {Array.<{offset: Number, length: Number, type: String}>} [entities]
 * @property {TelegramPhotoObj[]} [photo]
 * @property {TelegramMessageObject} [reply_to_message]
 * @property {{inline_keyboard: Array.<Array.<{text: string, callback_data: string, url: string}>>}} [reply_markup]
 * @property {String} [caption]
 * 
 * @typedef {Object} TelegramUpdateObject
 * @property {Number} update_id
 * @property {TelegramMessageObject} message
 * 
 * @typedef {Object} TelegramContext
 * @property {Object} telegram 
 * @property {String} updateType 
 * @property {Object} [updateSubTypes] 
 * @property {TelegramMessageObject} [message] 
 * @property {Object} [editedMessage] 
 * @property {Object} [inlineQuery] 
 * @property {Object} [chosenInlineResult] 
 * @property {Object} [callbackQuery] 
 * @property {Object} [shippingQuery] 
 * @property {Object} [preCheckoutQuery] 
 * @property {Object} [channelPost] 
 * @property {Object} [editedChannelPost] 
 * @property {Object} [poll] 
 * @property {Object} [pollAnswer] 
 * @property {TelegramChatObject} [chat] 
 * @property {TelegramFromObject} [from] 
 * @property {Object} [match] 
 * @property {TelegramUpdateObject} [update] 
 * @property {Boolean} webhookReply
 */
/**
 * @param {String} iStr
 * @returns {String}
 */
const TGE = iStr => {
	if (!iStr) return "";
	
	if (typeof iStr === "string")
		return iStr
			.replace(/\&/g, "&amp;")
			.replace(/\</g, "&lt;")
			.replace(/\>/g, "&gt;");
	else
		return TGE(iStr.toString());
};

/**
 * @param {String} message
 */
const TelegramSendToAdmin = (message) => {
	if (!message) return;

	telegram.sendMessage(ADMIN_TELEGRAM_DATA.id, message, {
		parse_mode: "HTML",
		disable_notification: true
	}).then(L).catch(L);
};

if (!DEV)
	TelegramSendToAdmin(`Exhausted Wojak Bot have been spawned at ${new Date().toISOString()} <i>(ISO 8601, UTC)</i>`);



TOB.use(Sessions());

TOB.on("text", /** @param {TelegramContext} ctx */ (ctx) => {
	const { chat } = ctx;
	if (!chat) return L({ message: "No chat", ctx });


	if (chat["type"] === "private") {
		const { message } = ctx;
		if (!message) return false;

		const { text } = message;
		if (!text) return false;

		if (text.trim() === "/help" || text.trim() === "/start") {
			ctx.reply(WELCOME_MESSAGE, {
				disable_web_page_preview: true,
				parse_mode: "HTML"
			}).then(L).catch(L);
		};
	};
});

TOB.on("inline_query", ({ inlineQuery, answerInlineQuery }) => {
	const
		userMessage = inlineQuery.query,
		executed = /^\d+/.exec(userMessage),
		caption = userMessage.replace(/^(\\|\d+)/, ""),
		selectedPicture = PICTURES[executed ? (parseInt(executed) - 1 || 0) : 0] || PICTURES[0];

	L(selectedPicture);

	const answer = {
		type: "photo",
		id: `exhausted_wojak_${inlineQuery.from.usernname || inlineQuery.from.id}_${Date.now()}`.slice(0, 64),
		photo_url: selectedPicture.url,
		photo_width: selectedPicture.width,
		photo_height: selectedPicture.height,
		thumb_url: selectedPicture.thumb,
		title: TGE(caption),
		caption: TGE(caption),
		parse_mode: "HTML"
	};

	L(answer);

	return answerInlineQuery([answer]).then(L).catch(L);
});

TOB.launch();
