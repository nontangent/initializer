#! /usr/local/bin/node
const cli = require('cac')();
const { createFirebase } = require('./features/create-firebase');

cli
  .command('firebase <projectName>', 'creating firebase')
  .option('--force', 'force creating firebase')
  .action(async (projectName, options) => {
    await createFirebase(projectName, options);
  });

cli.help();

cli.parse();