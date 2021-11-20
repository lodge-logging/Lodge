const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

const region = "us-west-2";
class Kibana extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ec2.OperatingSystemType.LINUX
    );

    const kibana = new ec2.Instance(this, "Kibana", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,
      machineImage: machineImage,
      keyName: props.sshKey,
    });

    let ESMasters = `"http://${props.ESInstances[0].instancePrivateIp}:9200","http://${props.ESInstances[1].instancePrivateIp}:9200","http://${props.ESInstances[2].instancePrivateIp}:9200"`;

    kibana.userData.addCommands(
      `var=$(curl http://checkip.amazonaws.com)`,
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sed -i 's|server.host:.*|server.host:"ec2-$var.${region}.compute.amazonaws.com"|' /etc/kibana/kibana.yml`,
      `sed -i 's|elasticsearch.hosts:.*|elasticsearch.hosts:[${ESMasters}]|' /etc/kibana/kibana.yml`,
      `sudo systemctl start kibana.service`
    );
  }
}

// ec2 - publicIP.region.compute.amazonaws.com;
// ec2-34-220-200-145.us-west-2.compute.amazonaws.com

// `var=$(curl http://checkip.amazonaws.com)`

module.exports = { Kibana };
