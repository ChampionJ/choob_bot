declare namespace NodeJS {
  export interface ProcessEnv {
    TWITCH_USERNAME?: string;
    TWITCH_PASS?: string;
    TWITCH_CLIENT_ID?: string;
    TWITCH_CLIENT_SECRET?: string;
    TWITCH_CALLBACK_URL?: string;
    DB_HOST?: string;
    PORT?: string;
    LOGGING_LEVEL: LoggingLevel;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    DISCORD_TOKEN?: string;
  }
  export type LoggingLevel = 'DEVELOPMENT' | 'PRODUCTION' | 'TEST';
}