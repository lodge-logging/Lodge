const { getLastIp } = require("./getLastIp");
//const { checkIp } = require("../aws");

function getIps(subnets) {
  const ips = [];
  subnets.forEach((subnet, idx) => {
    const octets = getLastIp(subnet.cidr);
    const iterable = subnet.cidr.split("/")[0].split(".");
    for (let index = iterable.length - 1; ips.length < idx + 1; index--) {
      for (let start = iterable[index]; start < octets[index]; start++) {
        iterable[index] = start;
        if (index === iterable.length - 1) {
          if (
            start === "0" ||
            start === 1 ||
            start === 2 ||
            start === 3 ||
            start === 255
          )
            continue;
        }
        const currentIP = iterable.join(".");
        // const res = checkIp(currentIP);
        // if (res.NetworkInterfaces.length) {
        //   continue;
        // } else {
        ips.push(currentIP);
        break;
        // }
      }
    }
  });

  return ips;
}

// console.log(
//   getIps([
//     { cidr: "10.0.1.0/24" },
//     { cidr: "10.0.2.0/24" },
//     { cidr: "10.0.3.0/24" },
//   ])
// );

module.exports = { getIps };

// aws ec2 get-subnet-cidr-reservations --subnet-id subnet-023aea76c08ec1244

// const { execSync } = require("child_process");

// // subnets = {};
// // know the subnet cider
// // then start a loop over the IPs in that sider
// // const ips = [];
// // while (ips.length < target) {
// //   let res = JSON.parse(
// //     execSync(
// //       `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${currentIP}`
// //     ).toString()
// //   );
// //   console.log(res);
// //   if (res.NetworkInterfaces.length === 0) {
// //     // this ip is avaialable
// //     ips.push(currentIP);
// //   }
// // }

// function getIps(subnetId) {
//   const ips = [];
//   let subnetsInfo = JSON.parse(
//     execSync(`aws ec2 describe-subnets --subnet-ids ${subnetId}`).toString()
//   );
//   let ipv4Cider = subnetsInfo["Subnets"][0].CidrBlock;
//   console.log(ipv4Cider);
//   let rangeStart = "";
//   let rangeEnd = "";
//   // for (let currentIP = rangeStart; currentIP <= rangeEnd; nextIp) {
//   //   let res = JSON.parse(
//   //     execSync(
//   //       `aws ec2 describe-network-interfaces --filters Name=addresses.private-ip-address,Values=${currentIP}`
//   //     ).toString()
//   //   );
//   //   if (res.NetworkInterfaces.length === 0) {
//   //     ips.push(currentIP);
//   //   }
//   //   if (ips.length === 3) {
//   //     break;
//   //   }
//   // }
//   return ips;
// }

// aws ec2 get-subnet-cidr-reservations --subnet-id subnet-023aea76c08ec1244
