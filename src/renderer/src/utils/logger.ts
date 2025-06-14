type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
	[key: string]: unknown
}

class Logger {
	private static log(level: LogLevel, category: string, message: string, data?: LogData) {
		const timestamp = new Date().toISOString()
		const prefix = `[${timestamp}] [${category}] ${message}`
		
		switch (level) {
			case 'info':
				console.info(prefix, data || '')
				break
			case 'warn':
				console.warn(prefix, data || '')
				break
			case 'error':
				console.error(prefix, data || '')
				break
			case 'debug':
				console.debug(prefix, data || '')
				break
		}
	}

	static info(category: string, message: string, data?: LogData) {
		this.log('info', category, message, data)
	}

	static warn(category: string, message: string, data?: LogData) {
		this.log('warn', category, message, data)
	}

	static error(category: string, message: string, data?: LogData) {
		this.log('error', category, message, data)
	}

	static debug(category: string, message: string, data?: LogData) {
		this.log('debug', category, message, data)
	}
}

export default Logger
