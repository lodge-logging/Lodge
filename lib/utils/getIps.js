const { execSync } = require("child_process");

// subnets = {};
// know the subnet cider
// then start a loop over the IPs in that sider
// const ips = [];
// while (ips.length < target) {
//   let res = JSON.parse(
//     execSync(
//       `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${currentIP}`
//     ).toString()
//   );
//   console.log(res);
//   if (res.NetworkInterfaces.length === 0) {
//     // this ip is avaialable
//     ips.push(currentIP);
//   }
// }

function getIps(subnetId) {
  const ips = [];
  let subnetsInfo = JSON.parse(
    execSync(`aws ec2 describe-subnets --subnet-ids ${subnetId}`).toString()
  );
  let ipv4Cider = subnetsInfo["Subnets"][0].CidrBlock;
  console.log(ipv4Cider);
  let rangeStart = "";
  let rangeEnd = "";
  // for (let currentIP = rangeStart; currentIP <= rangeEnd; currentIP++) {
  //   let res = JSON.parse(
  //     execSync(
  //       `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${currentIP}`
  //     ).toString()
  //   );
  //   if (res.NetworkInterfaces.length === 0) {
  //     ips.push(currentIP);
  //   }
  //   if (ips.length === 3) {
  //     break;
  //   }
  // }
  return ips;
}

module.exports = { getIps };

// aws ec2 get-subnet-cidr-reservations --subnet-id subnet-023aea76c08ec1244
