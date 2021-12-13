const IPCIDR = require("ip-cidr");
const { execSync } = require("child_process");
const SKIP = 5;
const options = { stdio: "pipe" };
const data = require("../../user-data.json");

function getIps(address, num) {
  const ips = [];
  let skipped = 0;
  const cidr = new IPCIDR(address);
  cidr.loop((ip) => {
    if (skipped++ >= SKIP && ips.length < num && checkIp(ip)) {
      ips.push(ip);
    }
  });
  return ips;
}

async function checkIp(ip) {
  if (!data.lodgeVpc.id) {
    return true;
  }
  try {
    return (
      JSON.parse(
        execSync(
          `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${ip}`,
          options
        )
      ).NetworkInterfaces.length === 0
    );
  } catch (error) {
    console.error(error);
  }
}

module.exports = { getIps };
