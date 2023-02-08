export type UploadedPicture = {
  url: string;
  thumb: string;
  width: number;
  height: number;
};

export type TelegramConfig = {
  TELEGRAM_BOT_TOKEN: string;
  ADMIN_TELEGRAM_ID: number;
  PICTURES: UploadedPicture[];
  BOT_USERNAME: string;
  WELCOME_MESSAGE: string;
};

export type TelegramUser = import('typegram').User;
export type TelegramInlineQueryResult = import('typegram').InlineQueryResult;
