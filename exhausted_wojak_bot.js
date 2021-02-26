const
	fs = require("fs"),
	DEV = require("os").platform() === "win32" || process.argv[2] === "DEV",
	Telegraf = require("telegraf");


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



/** @type {import("telegraf").Telegraf} */
const BOT = new Telegraf.Telegraf(TELEGRAM_BOT_TOKEN);
const telegram = BOT.telegram;



/**
 * @param  {Error[] | String[]} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
	const containsAnyError = (args.findIndex((message) => message instanceof Error) > -1),
		  out = (containsAnyError ? console.error : console.log);

	out(new Date());
	args.forEach((message) => out(message));
	out("~~~~~~~~~~~\n\n");


	if (DEV) fs.writeFile("./out/logmessageorerror.json", JSON.stringify([...args], false, "\t"), () => {});
};

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
	}).catch(LogMessageOrError);
};

if (!DEV)
	TelegramSendToAdmin(`Exhausted Wojak Bot have been spawned at ${new Date().toISOString()} <i>(ISO 8601, UTC)</i>`);



BOT.on("text", (ctx) => {
	const text = ctx?.message?.text;
	if (!text) return false;

	if (ctx?.chat?.type !== "private" && text.indexOf("@exhausted_wojak_bot") < 0) return;

	if (/^\/(help|start)$/i.test(text.trim().replace(/@exhausted_wojak_bot/i, ""))) {
		ctx.reply(WELCOME_MESSAGE, {
			disable_web_page_preview: true,
			parse_mode: "HTML"
		}).catch(LogMessageOrError);
	};
});

BOT.on("inline_query", (ctx) => {
	const
		userMessage = ctx.inlineQuery.query,
		executed = /^\d+/.exec(userMessage),
		caption = userMessage.replace(/^(\\|\d+)/, ""),
		selectedPicture = PICTURES[executed ? (parseInt(executed) - 1 || 0) : 0] || PICTURES[0];

	const answer = {
		type: "photo",
		id: `exhausted_wojak_${ctx.inlineQuery.from.username || ctx.inlineQuery.from.id}_${Date.now()}`.slice(0, 64),
		photo_url: selectedPicture.url,
		photo_width: selectedPicture.width,
		photo_height: selectedPicture.height,
		thumb_url: selectedPicture.thumb,
		title: TGE(caption),
		caption: TGE(caption),
		parse_mode: "HTML"
	};

	return ctx.answerInlineQuery([answer]).catch(LogMessageOrError);
}).catch(LogMessageOrError);

BOT.launch();

process.on("unhandledRejection", (reason, p) => {
	if (DEV) {
		LogMessageOrError("Unhandled Rejection at: Promise", p, "reason:", reason);
	};
});
