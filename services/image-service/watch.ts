import { spawn, ChildProcess } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';

let serverProcess: ChildProcess | undefined;

// Function to start the server
const startServer = () => {
  if (serverProcess) serverProcess.kill();
  serverProcess = spawn('node', ['./dist/node_esbuild.cjs'], {
    stdio: 'inherit',
  });
};

// Watch the src directory for changes
const watcher = chokidar.watch(path.resolve(__dirname, 'src'), {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
});

watcher.on('change', (filePath) => {
  console.log(`File ${filePath} has changed, rebuilding...`);
  const buildProcess = spawn('yarn', ['build:esbuild'], { stdio: 'inherit' });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      startServer(); // Restart the server if build is successful
    } else {
      console.error('Build process exited with code:', code);
    }
  });
});

// Initial server start
startServer();
