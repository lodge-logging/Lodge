const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class WebTools extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    // const machineImage = ec2.MachineImage.fromSsmParameter(
    //   "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
    //   ec2.OperatingSystemType.LINUX
    // );

    this.instance = new ec2.Instance(this, "WebTools", {
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.PublicSubnets[0]],
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: props.sshKey,
      role: props.s3Role,
    });

    let brokersIps = `\"${props.kafkaInstances[0].instancePrivateIp}:9092\",\"${props.kafkaInstances[1].instancePrivateIp}:9092\",\"${props.kafkaInstances[2].instancePrivateIp}:9092\"`;

    let bucketName = props.bucket.bucketName;

    let kibanaDns = props.kibanaInstance.instancePublicDnsName;

    let ESMasters = `http://${props.ESInstances[0].instancePrivateIp}:9200,http://${props.ESInstances[1].instancePrivateIp}:9200,http://${props.ESInstances[2].instancePrivateIp}:9200`;

    let data = {
      kafkaHosts: `[${brokersIps}]`,
      kibanaHost: `${kibanaDns}:5601`,
      bucketName: `${bucketName}`,
      esIPs: ESMasters.split(","),
      hostIP: "",
      region: props.env.region,
    };

    data = JSON.stringify(data);

    this.instance.userData.addCommands(
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo yum update -y`,
      `sudo yum install -y yum-utils`,
      `sudo yum install -y wget nano tar curl git`,
      `sudo curl  https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh -o install.sh`,
      // `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash`,
      `sudo chmod +x install.sh`,
      `sudo ./install.sh`,
      `. ~/.nvm/nvm.sh`,
      `nvm install node`,
      `sudo amazon-linux-extras install docker -y`,
      `sudo systemctl enable docker`,
      `sudo service docker start`,
      `sudo usermod -aG docker $(whoami)`,
      `sudo usermod -a -G docker ec2-user`,
      `newgrp docker`,
      `docker run -d -p 8001:9000 -e HTTP_PORT=9000 --name zoonavigator --restart unless-stopped elkozmon/zoonavigator:latest`,
      `docker run -d -p 8080:8080 -e KAFKA_BROKERS=${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092 quay.io/cloudhut/kowl:master`,
      //`docker run -d -p 5000:5000 elastichq/elasticsearch-hq`,
      `mkdir /home/ec2-user/app`,
      `sudo chown -R ec2-user:ec2-user /home/ec2-user/app`,
      `cd /home/ec2-user/app`,
      `sudo git clone https://github.com/lodge-logging/Lodge-Dashboard.git .`,
      `mkdir /home/ec2-user/app/server/filebeatConfigs`,
      `echo '${data}' | sudo tee /home/ec2-user/app/server/data.json`,
      `var=$(curl http://checkip.amazonaws.com)`,
      `echo $var | sudo tee /home/ec2-user/app/server/ip`,
      `sudo sed -i "s|\\"hostIP\\":\\"\\"|\\"hostIP\\":\\"$var\\"|" /home/ec2-user/app/server/data.json`,
      `cd /home/ec2-user/app/server`,
      `sudo npm i`,
      `npm start`
    );

    // this.instance.userData.addCommands(
    //   `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
    //   `sudo apt-get update`,
    //   `sudo apt-get install -y wget net-tools nano tar netcat npm apt-transport-https ca-certificates software-properties-common curl`,
    //   `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`,
    //   `sudo add-apt-repository \
    //   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    //   $(lsb_release -cs) \
    //   stable"`,
    //   `sudo apt-get update`,
    //   `sudo apt-get install -y docker-ce docker-compose`,
    //   `sudo usermod -aG docker $(whoami)`,
    //   `newgrp docker`,
    //   `docker run -d -p 8001:9000 -e HTTP_PORT=9000 --name zoonavigator --restart unless-stopped elkozmon/zoonavigator:latest`,
    //   `docker run -d -p 8080:8080 -e KAFKA_BROKERS=${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092 quay.io/cloudhut/kowl:master`,
    //   //`docker run -d -p 5000:5000 elastichq/elasticsearch-hq`,
    //   `mkdir /home/ubuntu/app`,
    //   `sudo chown -R ubuntu:ubuntu /home/ubuntu/app`,
    //   `cd /home/ubuntu/app`,
    //   `sudo git clone https://github.com/lodge-logging/Lodge-Dashboard.git .`,
    //   `mkdir /home/ubuntu/app/server/filebeatConfigs`,
    //   `echo '${data}' | sudo tee /home/ubuntu/app/server/data.json`,
    //   `var=$(curl http://checkip.amazonaws.com)`,
    //   `echo $var | sudo tee /home/ubuntu/app/server/ip`,
    //   `sudo sed -i "s|\\"hostIP\\":\\"\\"|\\"hostIP\\":\\"$var\\"|" /home/ubuntu/app/server/data.json`,
    //   `cd /home/ubuntu/app/server`,
    //   `sudo npm i`,
    //   `npm start`
    // );
  }
}

module.exports = { WebTools };
