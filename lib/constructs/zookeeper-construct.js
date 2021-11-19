const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class ZookeeperCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.instances = [];

    for (let i = 1; i <= props.num; i++) {
      const zookeeper = new ec2.Instance(this, "zk" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: ec2.MachineImage.lookup({
          name: "Zookeeper-Lodge",
          owners: ["504304018644"],
        }),
        //vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        keyName: props.sshKey,
        securityGroup: props.securityGroup,
      });

      this.instances.push(zookeeper);

      const ip = zookeeper.instancePrivateIp;
      // zookeeper.userData.addCommands("touch TEST_FILE");
      this.outputs = new cdk.CfnOutput(this, "ZookeeperExports" + i, {
        value: ip,
        exportName: `zk-private-ip-${i}`,
      });
    }
  }

  // getIps() {
  //   Object.keys(this.outputs).forEach((output) => {
  //     console.log(this.outputs[output]);
  //   });
  // this.instances.forEach((i) => {
  //   console.log(i.instancePrivateIp);
  // });
  //}
}

module.exports = { ZookeeperCluster };
