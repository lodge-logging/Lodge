const subnets = require("../../subnets.json");
const { getIps } = require("../utils/getIps");

function getIpsAndSubnets(vpc) {
  return vpc.publicSubnets.map((subnet) => {
    const res = {
      id: subnet.subnetId,
      az: subnet.availabilityZone,
      ip: getIps(subnet.ipv4CidrBlock, 1)[0],
    };
    console.log(res);
    return res;
  });
}

module.exports = { getIpsAndSubnets };
