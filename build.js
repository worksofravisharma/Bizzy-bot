const fs = require('fs-extra');
const concat = require('concat');

const build = async () => {
  const files = [
    './dist/bot-element/runtime.js',
    './dist/bot-element/polyfills.js',
    './dist/bot-element/vendor.js',
    './dist/bot-element/main.js',
  ];

  console.log('files', files);
  // Avoid `fs.rm(./build)` here: on Windows + OneDrive, rmdir on `build/assets` often throws EPERM.
  await fs.ensureDir('./build');
  await fs.ensureDir('./build/assets');

  await fs.copyFile('./dist/bot-element/runtime.js', './build/runtime.js');
  await fs.copyFile('./dist/bot-element/polyfills.js', './build/polyfills.js');

  try {
    await fs.access('./dist/bot-element/vendor.js');
    await fs.copyFile('./dist/bot-element/vendor.js', './build/vendor.js');
  } catch {
    console.log('Vendor chunk not found, skipping...');
    files.splice(2, 1);
  }

  await fs.copyFile('./dist/bot-element/main.js', './build/main.js');

  await concat(files, './build/bot-element.js');

  await fs.copyFile('./dist/bot-element/styles.css', './build/styles.css');
  await fs.copyFile('./dist/bot-element/favicon.ico', './build/favicon.ico');

  await fs.copyFile('./template/index.html', './build/index.html');
  await fs.copyFile('./template/widget-loader.js', './build/widget-loader.js');

  if (await fs.pathExists('./dist/bot-element/assets')) {
    await fs.copy('./dist/bot-element/assets/', './build/assets/', { overwrite: true });
  }
};

build()
  .then(() => console.log('Build complete'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
