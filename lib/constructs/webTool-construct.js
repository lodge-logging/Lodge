const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class WebTools extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ec2.OperatingSystemType.LINUX
    );

    this.instance = new ec2.Instance(this, "WebTools", {
      vpc: props.vpc,
      // vpcSubnets: {
      //   subnetType: ec2.SubnetType.PUBLIC,
      // },
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(
            this,
            `WebToolSubnetFromAttributes1`,
            {
              subnetId: `${props.ipsAndSubnets[0].id}`,
              availabilityZone: `${props.ipsAndSubnets[0].az}`,
            }
          ),
        ],
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,
      machineImage: machineImage,
      keyName: props.sshKey,
      role: props.s3Role,
    });

    let brokersIps = `\"${props.kafkaInstances[0].instancePrivateIp}:9092\",\"${props.kafkaInstances[1].instancePrivateIp}:9092\",\"${props.kafkaInstances[2].instancePrivateIp}:9092\"`;

    let bucketName = props.bucket.bucketName;

    let kibanaDns = props.kibanaInstance.instancePublicDnsName;
    // let kibanaDns = props.kibanaInstance.instancePublicIp;

    let ESMasters = `"http://${props.ESInstances[0].instancePrivateIp}:9200","http://${props.ESInstances[1].instancePrivateIp}:9200","http://${props.ESInstances[2].instancePrivateIp}:9200"`;

    let data = {
      kafkaHosts: `[${brokersIps}]`,
      kibanaHost: `${kibanaDns}:5601`,
      bucketName: `${bucketName}`,
      esIPs: `[${ESMasters}]`,
    };

    data = JSON.stringify(data);

    this.instance.userData.addCommands(
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo apt-get update`,
      `sudo apt-get install -y wget net-tools nano tar netcat npm apt-transport-https ca-certificates software-properties-common curl`,
      `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`,
      `sudo add-apt-repository \
      "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) \
      stable"`,
      `sudo apt-get update`,
      `sudo apt-get install -y docker-ce docker-compose`,
      `sudo usermod -aG docker $(whoami)`,
      `newgrp docker`,
      `docker run -d -p 8001:9000 -e HTTP_PORT=9000 --name zoonavigator --restart unless-stopped elkozmon/zoonavigator:latest`,
      `docker run -d -p 8080:8080 -e KAFKA_BROKERS=${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092 quay.io/cloudhut/kowl:master`,
      `docker run -d -p 5000:5000 elastichq/elasticsearch-hq`,
      `mkdir /home/ubuntu/app`,
      `sudo chown -R ubuntu:ubuntu /home/ubuntu/app`,
      `cd /home/ubuntu/app`,
      `sudo git clone https://github.com/lodge-logging/Lodge-Dashboard.git .`,
      `echo '${data}' | sudo tee /home/ubuntu/app/client/src/data.json`,
      `echo '${data}' | sudo tee /home/ubuntu/app/server/data.json`,
      `cd ./client`,
      `sudo npm i`,
      `npm start`
    );
  }
}

module.exports = { WebTools };
