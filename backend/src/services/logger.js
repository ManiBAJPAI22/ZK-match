const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}] ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        
        return msg;
    })
);

// File format (no colors, more detailed)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { 
        service: 'zk-biometric-system',
        pid: process.pid,
        hostname: require('os').hostname()
    },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        
        // Performance log file (for ZK proof timing)
        new winston.transports.File({
            filename: path.join(logDir, 'performance.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 3,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            // Only log performance-related messages
            filter: (info) => {
                return info.message && (
                    info.message.includes('proof') ||
                    info.message.includes('verification') ||
                    info.message.includes('benchmark') ||
                    info.message.includes('performance')
                );
            }
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
        })
    ],
    
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Performance logging helpers
logger.startTimer = (operation) => {
    const start = Date.now();
    return {
        end: (additionalInfo = {}) => {
            const duration = Date.now() - start;
            logger.info(`Performance: ${operation} completed`, {
                operation,
                duration: `${duration}ms`,
                ...additionalInfo
            });
            return duration;
        }
    };
};

// ZK-specific logging methods
logger.zkInfo = (message, meta = {}) => {
    logger.info(`[ZK] ${message}`, { category: 'zero-knowledge', ...meta });
};

logger.zkError = (message, error = null, meta = {}) => {
    logger.error(`[ZK] ${message}`, { 
        category: 'zero-knowledge', 
        error: error ? error.message : null,
        stack: error ? error.stack : null,
        ...meta 
    });
};

logger.biometricInfo = (message, meta = {}) => {
    logger.info(`[BIOMETRIC] ${message}`, { category: 'biometric', ...meta });
};

logger.biometricError = (message, error = null, meta = {}) => {
    logger.error(`[BIOMETRIC] ${message}`, { 
        category: 'biometric',
        error: error ? error.message : null,
        stack: error ? error.stack : null,
        ...meta 
    });
};

logger.apiRequest = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('API Request', {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        category: 'api-request'
    });
    
    // Log response when finished
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        logger.info('API Response', {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            category: 'api-response'
        });
        
        return originalSend.call(this, data);
    };
    
    if (next) next();
};

// Graceful shutdown logging
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
});

module.exports = logger;