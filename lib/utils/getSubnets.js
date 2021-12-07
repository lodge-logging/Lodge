const subnets = require("../../subnets.json");
const { getIps } = require("./getIps");

function getPrivateSubnets(vpc) {
  return vpc.privateSubnets.map((subnet) => {
    const res = {
      id: subnet.subnetId,
      az: subnet.availabilityZone,
      ip: getIps(subnet.ipv4CidrBlock, 1)[0],
    };
    // console.log(res);
    return res;
  });
}

function getPublicSubnets(vpc) {
  return vpc.publicSubnets.map((subnet) => {
    const res = {
      id: subnet.subnetId,
      az: subnet.availabilityZone,
      //ip: getIps(subnet.ipv4CidrBlock, 1)[0],
    };
    // console.log(res);
    return res;
  });
}

module.exports = { getPrivateSubnets, getPublicSubnets };
