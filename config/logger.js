const winston = require('winston');
const properties = require('properties-reader')('./config/application.properties');
winston.emitErrs = true;

let logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			level: properties.get('logger.level'),
			handleExceptions: true,
			json: false,
			timestamp: () => (new Date()).toISOString(),
			colorize: true
		})
	],
	exitOnError: false
});

logger.file = function(fileName) {
	return new winston.Logger({
		transports: [
			new winston.transports.File({
				level: properties.get('logger.level'),
				handleExceptions: true,
				json: false,
				timestamp: () => (new Date()).toISOString(),
				colorize: true,
				filename: 'log/' + fileName
			})
		],
		exitOnError: false
	});
};

module.exports = logger;
module.exports.stream = {
	write: function(message, encoding) {
		if (message.slice(-1) === '\n') {
			message = message.slice(0, -1);
		}
		logger.debug(message);
	}
};
