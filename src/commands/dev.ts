import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger';
import { FileWatcher, scanDirectory } from '../utils/file-watcher';
import { cleanDirectory, ensureDirectory } from '../utils/fs-utils';

interface DevOptions {
  port: string;
  reload: boolean;
}

export async function devCommand(options: DevOptions) {
  const startTime = Date.now();
  const port = parseInt(options.port);
  const srcDir = path.resolve(process.cwd(), 'src');
  
  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    logger.error('src directory not found. Please create a src folder with your TypeScript/CSS files.');
    process.exit(1);
  }

  logger.info('Starting development server...');

  // Clean dist directory on startup
  const distDir = path.resolve(process.cwd(), 'dist');
  cleanDirectory(distDir);
  ensureDirectory(distDir);

  // Scan for initial files
  let entryPoints = scanDirectory(srcDir);
  
  if (entryPoints.length === 0) {
    logger.warn('No TypeScript, JavaScript, or CSS files found in src directory.');
    logger.info('Watching for new files...');
  }

  // WebSocket server for live reload
  let wsServer: WebSocketServer | null = null;
  if (options.reload) {
    wsServer = new WebSocketServer({ port: port + 1 });
    wsServer.on('connection', (ws) => {
      logger.debug('Client connected to live reload');
    });
  }

  // Create esbuild context with current files
  let ctx = await createESBuildContext(entryPoints, srcDir, port, options.reload);

  // Start the development server (only once)
  const serveResult = await ctx.serve({
    servedir: 'dist',
    port: port,
    host: 'localhost'
  });
  
  const servePort = serveResult.port;

  // Set up file watcher
  const fileWatcher = new FileWatcher(srcDir);
  
  // Handle file changes
  fileWatcher.on('change', async (event) => {
    const changeStart = Date.now();
    logger.debug(`File changed: ${event.relativePath}`);
    
    try {
      await ctx.rebuild();
      const duration = Date.now() - changeStart;
      logger.logFileChange(event.relativePath, duration);
      notifyClients(wsServer);
    } catch (error) {
      logger.error(`Build failed: ${error}`);
    }
  });

  // Handle new files
  fileWatcher.on('add', async (event) => {
    if (!event.path.match(/\.(ts|js|css)$/)) return;
    
    const changeStart = Date.now();
    logger.debug(`New file added: ${event.relativePath}`);
    
    try {
      // For new files, we need to restart everything to pick up new entry points
      logger.info('Restarting server to pick up new files...');
      
      // Stop current server and file watcher
      fileWatcher.stop();
      await ctx.dispose();
      
      // Restart with new scan
      entryPoints = scanDirectory(srcDir);
      cleanDirectory(distDir);
      ensureDirectory(distDir);
      
      // Create new context and server
      ctx = await createESBuildContext(entryPoints, srcDir, port, options.reload);
      await ctx.serve({
        servedir: 'dist',
        port: port,
        host: 'localhost'
      });
      
      await ctx.rebuild();
      
      // Restart file watcher
      fileWatcher.start();
      
      const duration = Date.now() - changeStart;
      logger.success(`Server restarted with new file: ${event.relativePath} (+${duration}ms)`);
      notifyClients(wsServer);
    } catch (error) {
      logger.error(`Failed to restart server: ${error}`);
    }
  });

  // Handle deleted files
  fileWatcher.on('unlink', async (event) => {
    if (!event.path.match(/\.(ts|js|css)$/)) return;
    
    const changeStart = Date.now();
    logger.debug(`File deleted: ${event.relativePath}`);
    
    try {
      // For deleted files, we need to restart everything to remove from entry points
      logger.info('Restarting server to remove deleted files...');
      
      // Stop current server and file watcher
      fileWatcher.stop();
      await ctx.dispose();
      
      // Restart with new scan
      entryPoints = scanDirectory(srcDir);
      cleanDirectory(distDir);
      ensureDirectory(distDir);
      
      // Create new context and server
      ctx = await createESBuildContext(entryPoints, srcDir, port, options.reload);
      await ctx.serve({
        servedir: 'dist',
        port: port,
        host: 'localhost'
      });
      
      if (entryPoints.length > 0) {
        await ctx.rebuild();
      }
      
      // Restart file watcher
      fileWatcher.start();
      
      const duration = Date.now() - changeStart;
      logger.warn(`Server restarted after file deletion: ${event.relativePath} (+${duration}ms)`);
      notifyClients(wsServer);
    } catch (error) {
      logger.error(`Failed to restart server: ${error}`);
    }
  });

  // Start file watcher
  fileWatcher.start();

  // Initial build
  if (entryPoints.length > 0) {
    try {
      await ctx.rebuild();
    } catch (error) {
      logger.error(`Initial build failed: ${error}`);
      process.exit(1);
    }
  }

  const duration = Date.now() - startTime;
  logger.logServerStart(servePort);
  logger.logReady(duration);

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    fileWatcher.stop();
    await ctx.dispose();
    if (wsServer) {
      wsServer.close();
    }
    process.exit(0);
  });
}

async function createESBuildContext(
  entryPoints: string[], 
  srcDir: string, 
  port: number, 
  enableReload: boolean
): Promise<esbuild.BuildContext> {
  return esbuild.context({
    entryPoints,
    bundle: false,
    outdir: 'dist',
    outbase: srcDir,
    format: 'esm',
    target: 'es2020',
    loader: {
      '.ts': 'ts',
      '.js': 'js',
      '.css': 'css'
    },
    sourcemap: true,
    write: true,
    plugins: enableReload ? [
      {
        name: 'live-reload-inject',
        setup(build) {
          build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            const injectedCode = `
// Live reload client
if (typeof window !== 'undefined') {
  const ws = new WebSocket('ws://localhost:${port + 1}');
  ws.onmessage = () => window.location.reload();
}

${contents}`;
            return {
              contents: injectedCode,
              loader: 'ts'
            };
          });
        }
      }
    ] : []
  });
}

function notifyClients(wsServer: WebSocketServer | null): void {
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send('reload');
      }
    });
  }
}