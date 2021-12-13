const { getIps } = require("./getIps");
const ec2 = require("@aws-cdk/aws-ec2");
const data = require("../../user-data.json");

function filter(vpc, type) {
  let subnetsIds = [];
  let res = [];
  if (type === "private") {
    subnetsIds = Object.keys(data.privateSubnets).map(
      (s) => data.privateSubnets[s].id
    );
    res = vpc.privateSubnets.filter((subnet) =>
      subnetsIds.includes(subnet.subnetId)
    );
    console.log("subnetsIds", subnetsIds);
    console.log("privatesubnets", vpc.privateSubnets.length);

    console.log("res", res[0].subnetId, res[1].subnetId, res[2].subnetId);
  } else {
    subnetsIds = [data.publicSubnet.id];
    res = vpc.publicSubnets.filter((subnet) =>
      subnetsIds.includes(subnet.subnetId)
    );
    console.log("subnetsIds", subnetsIds);
    console.log("publicubnets", vpc.publicSubnets.length);

    console.log("res", res[0].subnetId);
  }

  return res;
}

function getPrivateSubnets(vpc) {
  return vpc.privateSubnets.map((subnet) => {
    const res = {
      id: subnet.subnetId,
      az: subnet.availabilityZone,
      ip: getIps(subnet.ipv4CidrBlock, 1)[0],
    };

    return res;
  });
}

function getPublicSubnets(vpc) {
  return vpc.publicSubnets.map((subnet) => {
    const res = {
      id: subnet.subnetId,
      az: subnet.availabilityZone,
    };
    return res;
  });
}

function getISubnets(subnets, self) {
  return subnets.map((subnet) => {
    return ec2.Subnet.fromSubnetAttributes(self, `Subnet-${subnet.id}`, {
      subnetId: `${subnet.id}`,
      availabilityZone: `${subnet.az}`,
    });
  });
}

function getISubnet(subnet, self) {
  return ec2.Subnet.fromSubnetAttributes(self, `Subnet-${subnet.id}`, {
    subnetId: `${subnet.id}`,
    availabilityZone: `${subnet.az}`,
  });
}

module.exports = {
  getPrivateSubnets,
  getPublicSubnets,
  getISubnets,
  getISubnet,
  filter,
};
