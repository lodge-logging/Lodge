const IPCIDR = require("ip-cidr");
const SKIP = 5;

function getIps(address, num) {
  const ips = [];
  let skipped = 0;
  const cidr = new IPCIDR(address);
  cidr.loop((ip) => {
    if (skipped++ >= SKIP && ips.length < num) {
      ips.push(ip);
    }
  });
  return ips;
}

module.exports = { getIps };
