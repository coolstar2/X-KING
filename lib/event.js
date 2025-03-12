var config = require("../config");
var commands = [];

function command(info, func) {
  var infos = info;
  infos.function = func;
  infos.pattern = new RegExp(
    `^${config.HANDLERS}(${info.pattern})$`, // Add ^ and $
    `i` // Remove 's' to avoid unnecessary multiline matches
  );
  if (!infos.dontAddCommandList) infos.dontAddCommandList = false;
  if (!infos.fromMe) infos.dontAddCommandList = false;

  // Ensure type exists, and keep it flexible for any type provided
  infos.type = infos.type || 'misc';

  commands.push(infos);
  return infos;
}

module.exports = {
  command,
  commands,
};