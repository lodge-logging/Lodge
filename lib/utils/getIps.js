const IPCIDR = require("ip-cidr");
const { execSync } = require("child_process");
const SKIP = 5;
const options = { stdio: "pipe" };

function getIps(address, num) {
  const ips = [];
  let skipped = 0;
  const cidr = new IPCIDR(address);
  cidr.loop((ip) => {
    if (skipped++ >= SKIP && ips.length < num) {
      const res = checkIp(ip);
      if (res.NetworkInterfaces.length === 0) {
        ips.push(ip);
      }
    }
  });
  return ips;
}

async function checkIp(ip) {
  try {
    return JSON.parse(
      execSync(
        `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${ip}`,
        options
      )
    );
  } catch (error) {
    console.error(error);
  }
}

module.exports = { getIps };
