const { createLogger, format, transports, add } = require('winston');
// const logger = winston.loggers.get('main');
const logger = createLogger({
      //level: 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.simple()
      ),
      defaultMeta: { service: 'choob-bot' },
      transports: [
        new transports.File({ filename: 'logs/choob_bot-error.log', level: 'error', handleExceptions: true }),
        new transports.File({ filename: 'logs/choob_bot-info.log', level: 'info' }),
        new transports.File({ filename: 'logs/choob_bot-verbose.log', level: 'verbose'}),
      ]
    });

function setupLogger() {
  const checkEmpty = (info: any): string => {
    if (Object.keys(info).length > 2) {
      return '\n' + JSON.stringify(info, (key, value) => {
        if (key === 'timestamp' || key === 'service') {
          return undefined;
        }
        return value;
      }, 2)
    }
    return ''
  }

  if (process.env.LOGGING_LEVEL != 'PRODUCTION') {
    logger.add(new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.metadata(),
        format.printf((info: any) => `${info.metadata.timestamp} ${info.level}: ${info.message} ${checkEmpty(info.metadata)}`),
      )
    }));
  }
  logger.info('Running in mode: ' + process.env.LOGGING_LEVEL)
}

setupLogger();
export { logger as ChoobLogger };