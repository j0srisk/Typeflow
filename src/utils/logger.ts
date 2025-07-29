import colors from 'picocolors';
import ms from 'ms';

export interface LogOptions {
  timestamp?: boolean;
  clear?: boolean;
}

class Logger {
  private startTime = Date.now();
  
  private formatMessage(level: string, message: string, options: LogOptions = {}): string {
    const parts: string[] = [];
    
    if (options.timestamp) {
      const time = new Date().toLocaleTimeString();
      parts.push(colors.dim(`[${time}]`));
    }
    
    parts.push(colors.bold(colors.cyan('typeflow')));
    parts.push(message);
    
    return parts.join(' ');
  }

  info(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write('\x1Bc');
    console.log(this.formatMessage('info', colors.cyan(message), options));
  }

  success(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write('\x1Bc');
    console.log(this.formatMessage('success', colors.green(message), options));
  }

  warn(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write('\x1Bc');
    console.log(this.formatMessage('warn', colors.yellow(message), options));
  }

  error(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write('\x1Bc');
    console.error(this.formatMessage('error', colors.red(message), options));
  }

  debug(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write('\x1Bc');
    console.log(this.formatMessage('debug', colors.dim(message), options));
  }

  logServerStart(port: string | number) {
    console.log();
    console.log(`  ${colors.bold(colors.cyan('typeflow'))} ${colors.dim('v1.0.0')} dev server running at:`);
    console.log();
    console.log(`  ${colors.green('➜')}  ${colors.bold('Local:')}   ${colors.cyan(`http://localhost:${port}/`)}`);
    console.log(`  ${colors.green('➜')}  ${colors.bold('Network:')} ${colors.dim('use --host to expose')}`);
    console.log();
  }

  logReady(duration?: number) {
    const time = duration ? `${duration}ms` : `${Date.now() - this.startTime}ms`;
    console.log(`  ${colors.green('ready')} in ${colors.bold(time)}.`);
    console.log();
  }

  logFileChange(file: string, duration?: number) {
    const durationStr = duration ? colors.dim(` (+${duration}ms)`) : '';
    console.log(`${colors.dim(file)} changed, reloading...`);
    console.log(`${colors.green('page reload')} ${colors.dim(file)}${durationStr}`);
  }

  logBuild(files: Array<{name: string, size: string, gzip?: string}>, duration: number) {
    console.log(`${colors.green('✓')} built in ${colors.bold(`${duration}ms`)}`);
    
    files.forEach(file => {
      const parts = [colors.dim(file.name), colors.bold(file.size)];
      if (file.gzip) {
        parts.push(colors.dim('│'), colors.dim(`gzip: ${file.gzip}`));
      }
      console.log(parts.join(' '));
    });
  }
}

export const logger = new Logger();