const getLastIp = (cidr) => {
  const [octetStrings, maskString] = cidr.split("/");
  const octets = octetStrings.split(".").map((octet) => Number(octet));
  const targetIndex = Math.floor(Number(maskString) / 8);
  const remainingBits = Number(maskString) % 8;
  const bitFactorAdd = Math.pow(2, remainingBits);
  const bitFactorMult = (100 - remainingBits) / 100;

  return octets.map((octet, idx) => {
    if (idx === targetIndex - 1) {
      return octet * bitFactorMult + bitFactorAdd - 1;
    } else if (idx > targetIndex - 1) {
      return 254;
    } else {
      return octet;
    }
  });
};

module.exports = { getLastIp };

// const { readFileSync, writeFileSync } = require('fs');

// const insertIPsIntoConfig = (filename, ips, newFileName) => {
//   const regex = /{{.+}}/;
//   let newFile = readFileSync(filename, 'utf-8');
//   ips.forEach(ip => {
//     newFile = newFile.replace(regex, ip);
//   })

//   writeFileSync(newFileName, newFile);
// }

// module.exports = { insertIPsIntoConfig }
