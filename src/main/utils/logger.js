import * as winston from 'winston'
import path from 'path'
import { userFolder } from './configuration.js'

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
	transports: [
		//
		// - Write all logs with level `error` and below to `error.log`
		// - Write all logs with level `info` and below to `combined.log`
		//
		new winston.transports.File({ filename: path.join(userFolder, 'error.log'), level: 'error' }),
		new winston.transports.File({ filename: path.join(userFolder, 'combined.log') }),
	],
});

export default logger;

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (import.meta.env.DEV)
{
	logger.add(new winston.transports.Console({
		format: winston.format.simple(),
	}));
}
