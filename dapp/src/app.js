import start from './executeTask';

start().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
