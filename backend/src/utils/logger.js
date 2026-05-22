const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Complete logger utility
 * - Colored console output
 * - Writes to log files
 * - Automatically handles Error objects for all log methods
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, process.env.LOG_FILE || 'app.log');
const errorLogFile = path.join(logsDir, 'error.log');

// Ensure log file directories exist (in case LOG_FILE contains a subfolder)
[logFile, errorLogFile].forEach(file => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const timestamp = () =>
  new Date().toLocaleString('en-GB', { hour12: false });

const LABEL_WIDTH = 7;

// Format console output
const format = (label, labelColor, textColor, message) => {
  const paddedLabel = label.padEnd(LABEL_WIDTH, ' ');
  console.log(
    chalk.gray(`[${timestamp()}]`) +
    '  ' +
    labelColor(paddedLabel) +
    '  ' +
    textColor(message)
  );
};

// Format log message for file writing
const formatLog = (level, message, meta = {}) => {
  const ts = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
};

// Write log to file
const writeLog = (file, message) => {
  fs.appendFile(file, message, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

// Convert any input to string (handles Error objects, objects, etc.)
const stringify = (input) => {
  if (input instanceof Error) {
    return input.stack || input.message;
  } else if (typeof input === 'object') {
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  }
  return String(input);
};

// Unified logger method to handle multiple arguments
const logMethod = (label, labelColor, textColor, fileTargets = []) => (...args) => {
  const message = args.map(arg => stringify(arg)).join(' ');
  format(label, labelColor, textColor, message);
  if (process.env.NODE_ENV !== 'test') {
    fileTargets.forEach(file => writeLog(file, formatLog(label.toLowerCase(), message)));
  }
};

const logger = {
  info: logMethod('INFO', chalk.blue, chalk.cyan, [logFile]),
  success: logMethod('SUCCESS', chalk.green, chalk.greenBright, [logFile]),
  warn: logMethod('WARN', chalk.yellow, chalk.yellowBright, [logFile]),
  error: logMethod('ERROR', chalk.red, chalk.redBright, [logFile, errorLogFile]),
  debug: (...args) => {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      logMethod('DEBUG', chalk.magenta, chalk.magentaBright, [logFile])(...args);
    }
  },
  start: logMethod('START', chalk.hex('#9d4edd'), chalk.hex('#9d4edd'), [logFile]),
};

module.exports = logger;
