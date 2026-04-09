import fs from 'fs';
import path from 'path';

// ENSURE LOG DIRECTORY EXISTS
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// HELPER TO WRITE LOG FILES
const writeToFile = (filename: string, message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFile(path.join(logDir, filename), logMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
};

//COLORS
const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

//LOGGER
export const logger = {
  info: (message: string, meta: any = {}) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}${metaStr}`);
    writeToFile('traffic.log', `[INFO] ${message}${metaStr}`);
  },
  success: (message: string, meta: any = {}) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}${metaStr}`);
    writeToFile('system.log', `[SUCCESS] ${message}${metaStr}`);
  },
  warn: (message: string, meta: any = {}) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}${metaStr}`);
    writeToFile('system.log', `[WARN] ${message}${metaStr}`);
  },
  error: (message: string, error?: any, meta: any = {}) => {
    let cleanLog = `[ERROR] ${message}`;
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
    
    if (error && error.stack) {
      console.error(`${colors.red}Stack Trace:${colors.reset}\n`, error.stack);
      cleanLog += `\nStack Trace: ${error.stack}`;
    } else if (error) {
      console.error(`${colors.red}Details:${colors.reset}`, error);
      cleanLog += `\nDetails: ${error}`;
    }
    
    if (Object.keys(meta).length) {
      const metaStr = JSON.stringify(meta, null, 2);
      console.error(`${colors.red}Context:${colors.reset}\n`, metaStr);
      cleanLog += `\nContext: ${metaStr}`;
    }
    
    writeToFile('error.log', cleanLog);
  },
  db: (message: string, ms: number) => {
    const color = ms >= 1000 ? colors.red : ms >= 500 ? colors.yellow : colors.blue;
    console.log(`${color}[DB]${colors.reset} ${message} - ${ms}ms`);
    writeToFile('db.log', `[DB] ${message} - ${ms}ms`);
  },
  system: (message: string) => {
    console.log(`${colors.magenta}[SYSTEM]${colors.reset} ${message}`);
    writeToFile('system.log', `[SYSTEM] ${message}`);
  }
};
