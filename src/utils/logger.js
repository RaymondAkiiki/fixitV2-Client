// frontend/src/utils/logger.js

const isDevelopment = process.env.NODE_ENV === 'development';

const BACKEND_API_BASE_URL = isDevelopment
    ? 'http://localhost:5000'
    : 'https://your-production-backend-url.com';

const createFrontendLogger = () => {
    const levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    };

    const colors = {
        error: 'red',
        warn: 'orange',
        info: 'green',
        http: 'magenta',
        debug: 'gray',
    };

    const logToConsole = (level, message, ...meta) => {
        // --- TEMPORARY CHANGE FOR DEBUGGING: Always log debug to console ---
        // In production, only log error and warn to the console to avoid verbose output for users
        if (!isDevelopment && levels[level] > levels.warn && level !== 'debug') { // Allow debug in production for this test
            return;
        }
        // --- END TEMPORARY CHANGE ---

        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        const consoleColor = colors[level] || 'black';

        switch (level) {
            case 'error':
                console.error(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
                break;
            case 'warn':
                console.warn(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
                break;
            case 'info':
                console.info(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
                break;
            case 'http':
                console.info(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
                break;
            case 'debug':
                console.debug(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
                break;
            default:
                console.log(`%c${formattedMessage}`, `color: ${consoleColor}; font-weight: bold;`, ...meta);
        }
    };

    const sendLogToBackend = async (level, message, meta) => {
        // We might need to temporarily send debug logs to backend if console is truly broken
        // For now, keep it as is, focusing on console output.
        if (levels[level] <= levels.http) {
            try {
                const logData = {
                    level,
                    message,
                    meta: meta.length > 0 ? JSON.stringify(meta) : null,
                    clientUrl: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                };
                await fetch(`${BACKEND_API_BASE_URL}/api/frontend-logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData),
                });
            } catch (err) {
                console.error(`%c[ERROR] Failed to send log to backend:`, 'color: red; font-weight: bold;', err);
            }
        }
    };

    return {
        error: (message, ...meta) => {
            logToConsole('error', message, ...meta);
            sendLogToBackend('error', message, meta);
        },
        warn: (message, ...meta) => {
            logToConsole('warn', message, ...meta);
            sendLogToBackend('warn', message, meta);
        },
        info: (message, ...meta) => {
            logToConsole('info', message, ...meta);
            sendLogToBackend('info', message, meta);
        },
        http: (message, ...meta) => {
            logToConsole('http', message, ...meta);
            sendLogToBackend('http', message, meta);
        },
        debug: (message, ...meta) => {
            logToConsole('debug', message, ...meta);
            // sendLogToBackend('debug', message, meta); // Keep this commented out for now
        },
    };
};

const frontendLogger = createFrontendLogger();
export default frontendLogger;