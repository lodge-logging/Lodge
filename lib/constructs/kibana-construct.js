const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class Kibana extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ec2.OperatingSystemType.LINUX
    );

    this.instance = new ec2.Instance(this, "Kibana", {
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.PublicSubnets[0]],
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,
      machineImage: machineImage,
      keyName: props.sshKey,
    });

    this.instance.userData.addCommands(
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo apt-get update`,
      `sudo apt-get -y install wget net-tools nano tar netcat`,
      `wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -`,
      `sudo apt-get install apt-transport-https`,
      `echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list`,
      `sudo apt-get update && sudo apt-get install kibana`,
      `sudo /bin/systemctl daemon-reload`,
      `sudo /bin/systemctl enable kibana.service`,
      `var=$(curl http://checkip.amazonaws.com)`,
      "ip=${var//./-}",
      `sudo sed -i "s|#server.host:.*|server.host: \\"ec2-$ip.${props.env.region}.compute.amazonaws.com\\"|" /etc/kibana/kibana.yml`,
      `sudo sed -i "s|#elasticsearch.hosts:.*|elasticsearch.hosts:\\n  - http://${props.ESInstances[0].instancePrivateIp}:9200\\n  - http://${props.ESInstances[1].instancePrivateIp}:9200|" /etc/kibana/kibana.yml`,
      `sudo systemctl start kibana.service`
    );
  }
}

module.exports = { Kibana };
