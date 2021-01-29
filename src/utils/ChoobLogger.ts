const winston = require('winston');
const logger = winston.loggers.get('main');

function setupLogger() {
  winston.loggers.add('main',
    {
      level: 'info',
      format: winston.format.combine(

        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
      ),
      defaultMeta: { service: 'choob_bot' },
      transports: [
        new winston.transports.File({ filename: 'logs/choob_bot-error.log', level: 'error', handleExceptions: true }),
        new winston.transports.File({ filename: 'logs/choob_bot-info.log', level: 'info' }),
        new winston.transports.File({ filename: 'logs/choob_bot-combined.log', level: 'verbose' })
      ]
    });

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
    winston.loggers.get('main').add(new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.metadata(),
        winston.format.printf((info: any) => `${info.metadata.timestamp} ${info.level}: ${info.message} ${checkEmpty(info.metadata)}`),
      )
    }));
  }
  logger.info('Running in mode: ' + process.env.LOGGING_LEVEL)
}

setupLogger();
export { logger as ChoobLogger };