const { readFileSync, writeFileSync } = require('fs');

const insertIPsIntoConfig = (filename, ips) => {
  const regex = /{{.+}}/;
  let newFile = readFileSync(filename, 'utf-8');
  ips.forEach(ip => {
    newFile = newFile.replace(regex, ip);
  })
  
  writeFileSync(filename, newFile);
}

module.exports = { insertIPsIntoConfig }