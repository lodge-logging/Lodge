const { readFileSync, writeFileSync } = require('fs');

const insertIPsIntoConfig = (filename, ips, newFileName) => {
  const regex = /{{.+}}/;
  let newFile = readFileSync(filename, 'utf-8');
  ips.forEach(ip => {
    newFile = newFile.replace(regex, ip);
  })
  
  writeFileSync(newFileName, newFile);
}

module.exports = { insertIPsIntoConfig }