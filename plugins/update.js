const { command } = require('../lib');
const { exec } = require('child_process');
const simpleGit = require('simple-git');

const git = simpleGit();

command(
  {
    pattern: 'update',
    fromMe: true,
    desc: 'Update the bot',
    type: 'user',
  },
  async (king, match) => {
    const prefix = king.prefix;
    await git.fetch();

    // Corrected the git log syntax
    const commits = await git.log(['origin/main']); // Changed master to main
    if (!match) {
      if (commits.total === 0) {
        return await king.reply('No update available');
      } else {
        let changes = 'UPDATE FOUND\n\n';
        changes += `*Changes:* ${commits.total}\n`;
        changes += 'Updates:\n';
        commits.all.forEach((commit, index) => {
          changes += `${index + 1}. ${commit.message}\n`;
        });
        changes += `\n*To update, use* ${prefix}update now\``;
        await king.reply(changes);
      }
    }

    if (match && match === 'now') {
      if (commits.total === 0) {
        return await king.reply('No changes in the latest commit');
      }
      await king.reply('Updating...');
      exec('git stash && git pull origin main', async (err, stdout, stderr) => { // Changed master to main
        if (err) {
          return await king.reply(`${stderr}`);
        }
        await king.reply('Restarting...');
        const dependency = await updatedDependencies();
        if (dependency) {
          await king.reply('Dependencies changed. Installing new dependencies...');
          exec('npm install', async (err, stdout, stderr) => {
            if (err) {
              return await king.reply(`${stderr}`);
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    }
  }
);

const updatedDependencies = async () => {
  try {
    // Corrected the git diff syntax
    const diff = await git.diff(['origin/main']); // Changed master to main
    return diff.includes('"dependencies":');
  } catch (error) {
    console.error('Error occurred while checking package.json:', error);
    return false;
  }
};