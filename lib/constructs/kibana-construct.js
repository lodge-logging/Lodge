const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
// const { readFileSync } = require("fs");
// const path = require("path");
//const params = require("../params/kibana-params");

// const userDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'kibana-user-data.sh');

class Kibana extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const kibana = new ec2.Instance(this, "Kibana", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      securityGroup: props.securityGroup,
      machineImage: ec2.MachineImage.lookup({
        name: "Kibana",
        owners: ["504304018644"],
      }),
      keyName: props.sshKey,
    });

    kibana.userData.addCommands(
      `var=$(curl http://checkip.amazonaws.com)`,
      `sed -i "s|server.host:.*|server.host:$var|" /etc/kibana/kibana.yml`,
      `sed -i "s|elasticsearch.hosts:.*|elasticsearch.hosts:[]|" /etc/kibana/kibana.yml`
    );
  }
}

module.exports = { Kibana };
