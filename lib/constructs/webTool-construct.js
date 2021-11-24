const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class WebTools extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const webtools = new ec2.Instance(this, "WebTools", {
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
        name: "KafkaClusterWebTools",
        owners: ["504304018644"],
      }),
      keyName: props.sshKey,
      role: props.s3Role,
    });

    let brokersIps = `\"${props.kafkaInstances[0].instancePrivateIp}:9092\",\"${props.kafkaInstances[1].instancePrivateIp}:9092\",\"${props.kafkaInstances[2].instancePrivateIp}:9092\"`;

    let bucketName = props.bucket.bucketName;

    let kibanaDns = props.kibanaInstance.instancePublicDnsName;

    let ESMasters = `"http://${props.ESInstances[0].instancePrivateIp}:9200","http://${props.ESInstances[1].instancePrivateIp}:9200","http://${props.ESInstances[2].instancePrivateIp}:9200"`;

    let data = {
      kafkaHosts: `[${brokersIps}]`,
      kibanaHost: `${kibanaDns}:5601`,
      bucketName: `${bucketName}`,
      esIPs: `[${ESMasters}]`,
    };

    data = JSON.stringify(data);

    webtools.userData.addCommands(
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo apt update`,
      `sudo apt install npm -y`,
      `mkdir /home/ubuntu/app`,
      `sudo chown -R ubuntu:ubuntu /home/ubuntu/app`,
      `cd /home/ubuntu/app`,
      `sudo git clone https://github.com/lodge-logging/Lodge-Dashboard.git .`,
      `echo '${data}' | sudo tee ./data.json`,
      `cd ./client`,
      `sudo npm i`,
      `npm start`,
      `docker run -p 8080:8080 -e KAFKA_BROKERS=${brokersIps} quay.io/cloudhut/kowl:masterdocker`
    );
  }
}

module.exports = { WebTools };
