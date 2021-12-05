const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const region = "us-west-2";

const params = {
  MasterInstanceType: "t3.medium",
  VoteOnlyInstanceType: "t3.medium",
  DataHotInstanceType: "t3.medium",
  DataWarmInstanceType: "t3.medium",
  MinDataNodes: "2",
  MaxHotDataNodes: "3",
  MaxWarmDataNodes: "3",
  num: 2,
};

class Elasticsearch extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.masters = [];
    // iam.Role();
    // const subnets = props.vpc.publicSubnets;

    for (let i = 1; i <= params.num; i++) {
      const master = new ec2.Instance(this, `ES-Master-${i}`, {
        vpc: props.vpc,
        // machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
        // machineImage: new ec2.AmazonLinuxImage(),
        machineImage: ec2.MachineImage.latestAmazonLinux({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        securityGroup: props.securityGroup,
        vpcSubnets: {
          subnets: [
            ec2.Subnet.fromSubnetAttributes(
              this,
              `EsSubnetFromAttributes${i}`,
              {
                subnetId: `${props.ipsAndSubnets[i - 1].id}`,
                availabilityZone: `${props.ipsAndSubnets[i - 1].az}`,
              }
            ),
          ],
        },
        keyName: props.sshKey,
        //blockDevices: [],
        //instanceName: '',
        //privateIpAddress: ''
        //resourceSignalTimeout: new cdk.Duration()
        role: props.esRole,
        //sourceDestCheck: true || false,
        // userDataCausesReplacement: true || false,
      });

      this.masters.push(master);

      const commands = [
        `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
        `sudo yum update -y`,
        `sudo rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch`,
        `touch elasticsearch.repo`,
        `echo -e "[elasticsearch]\nname=Elasticsearch repository for 7.x packages\nbaseurl=https://artifacts.elastic.co/packages/7.x/yum\ngpgcheck=1\ngpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch\nenabled=0\nautorefresh=1\ntype=rpm-md" >> elasticsearch.repo`,
        `sudo mv ./elasticsearch.repo /etc/yum.repos.d/`,
        `sudo yum -y install --enablerepo=elasticsearch elasticsearch`,
        `sudo /bin/systemctl daemon-reload`,
        `sudo /bin/systemctl enable elasticsearch.service`,
        `sudo systemctl start elasticsearch.service`,
        `sleep 15`,
        `sed -i 's/## -Xms4g/-Xms2g/' /etc/elasticsearch/jvm.options`,
        `sed -i 's/## -Xmx4g/-Xmx2g/' /etc/elasticsearch/jvm.options`,
        `sudo echo -y | sudo /usr/share/elasticsearch/bin/elasticsearch-plugin install --batch discovery-ec2`,
        `sudo mkdir -p /etc/systemd/system/elasticsearch.service.d`,
        `sudo echo -e "[Service]\nLimitMEMLOCK=infinity" >> /etc/systemd/system/elasticsearch.service.d/override.conf`,
        `sudo systemctl daemon-reload`,
        `sudo systemctl restart elasticsearch.service`,
        `sleep 15`,
        `sudo systemctl stop elasticsearch.service`,
        `sleep 5`,
        `sudo rm -rf /var/lib/elasticsearch/nodes/`,
        `sudo rm /etc/elasticsearch/elasticsearch.yml`,
        `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/es -o /etc/elasticsearch/elasticsearch.yml`,
        `sed -i 's/node.name:.*/node.name: master-${i}/' /etc/elasticsearch/elasticsearch.yml`,
        `sed -i 's/node.roles:.*/node.roles: [ master ]/' /etc/elasticsearch/elasticsearch.yml`,
        `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
        `sudo systemctl start elasticsearch.service`,
      ];

      master.userData.addCommands(...commands);
    }

    const voteOnly = new ec2.Instance(this, "ES-Vote-Only", {
      vpc: props.vpc,
      //machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
      //machineImage: new ec2.AmazonLinuxImage(),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,

      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, `EsSubnetFromAttributes3`, {
            subnetId: `${props.ipsAndSubnets[2].id}`,
            availabilityZone: `${props.ipsAndSubnets[2].az}`,
          }),
        ],
      },
      keyName: props.sshKey,
      role: props.esRole,
    });

    this.masters.push(voteOnly);
    const voteOnlyCommands = [
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo yum update -y`,
      `sudo rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch`,
      `touch elasticsearch.repo`,
      `echo -e "[elasticsearch]\nname=Elasticsearch repository for 7.x packages\nbaseurl=https://artifacts.elastic.co/packages/7.x/yum\ngpgcheck=1\ngpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch\nenabled=0\nautorefresh=1\ntype=rpm-md" >> elasticsearch.repo`,
      `sudo mv ./elasticsearch.repo /etc/yum.repos.d/`,
      `sudo yum -y install --enablerepo=elasticsearch elasticsearch`,
      `sudo /bin/systemctl daemon-reload`,
      `sudo /bin/systemctl enable elasticsearch.service`,
      `sudo systemctl start elasticsearch.service`,
      `sleep 15`,
      `sed -i 's/## -Xms4g/-Xms2g/' /etc/elasticsearch/jvm.options`,
      `sed -i 's/## -Xmx4g/-Xmx2g/' /etc/elasticsearch/jvm.options`,
      `sudo echo -y | sudo /usr/share/elasticsearch/bin/elasticsearch-plugin install --batch discovery-ec2`,
      `sudo mkdir -p /etc/systemd/system/elasticsearch.service.d`,
      `sudo echo -e "[Service]\nLimitMEMLOCK=infinity" >> /etc/systemd/system/elasticsearch.service.d/override.conf`,
      `sudo systemctl daemon-reload`,
      `sudo systemctl restart elasticsearch.service`,
      `sleep 15`,
      `sudo systemctl stop elasticsearch.service`,
      `sleep 5`,
      `sudo rm -rf /var/lib/elasticsearch/nodes/`,
      `sudo rm /etc/elasticsearch/elasticsearch.yml`,
      `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/es -o /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.name:.*/node.name: vote-only/' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.roles:.*/node.roles: [ master, voting_only ]/' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
      `sudo systemctl start elasticsearch.service`,
    ];

    voteOnly.userData.addCommands(...voteOnlyCommands);
    //-------------------------------------------
    // data-content node
    // const dataContent = new ec2.Instance(this, "Data-Content", {
    //   vpc: props.vpc,
    //   machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.BURSTABLE3,
    //     ec2.InstanceSize.MEDIUM
    //   ),
    //   securityGroup: props.securityGroup,

    //   vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    //   keyName: props.sshKey,
    //   role: role,
    // });

    // const dataContentCommands = [
    //   `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
    //   `sudo systemctl stop elasticsearch.service`,
    //   `sudo rm -rf /var/lib/elasticsearch/nodes/`,
    //   `sed -i 's/node.name:.*//' /etc/elasticsearch/elasticsearch.yml`,
    //   `sed -i 's/node.roles:.*/node.roles: [ data_content ]/' /etc/elasticsearch/elasticsearch.yml`,
    //   `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
    //   `sudo systemctl start elasticsearch.service`,
    // ];

    // dataContent.userData.addCommands(...dataContentCommands);

    //-------------------------------------------

    // data hot
    const dataHotASG = new autoscaling.AutoScalingGroup(this, "Data-Hot-ASG", {
      vpc: props.vpc,
      // machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: props.securityGroup,
      minCapacity: params.MinDataNodes,
      maxCapacity: params.MaxHotDataNodes,
      //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(100)),
      keyName: props.sshKey,
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, `EsSubnetFromAttributes4`, {
            subnetId: `${props.ipsAndSubnets[2].id}`,
            availabilityZone: `${props.ipsAndSubnets[2].az}`,
          }),
        ],
      },
      // autoScalingGroupName: '',
      // blockDevices: [],
      // cooldown: cdk.Duration.minutes(5),
      // GroupMetrics: [],
      // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
      role: props.esRole,
      // signals: new autoscaling.Signals()
    });

    const dataHotCommands = [
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo yum update -y`,
      `sudo rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch`,
      `touch elasticsearch.repo`,
      `echo -e "[elasticsearch]\nname=Elasticsearch repository for 7.x packages\nbaseurl=https://artifacts.elastic.co/packages/7.x/yum\ngpgcheck=1\ngpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch\nenabled=0\nautorefresh=1\ntype=rpm-md" >> elasticsearch.repo`,
      `sudo mv ./elasticsearch.repo /etc/yum.repos.d/`,
      `sudo yum -y install --enablerepo=elasticsearch elasticsearch`,
      `sudo /bin/systemctl daemon-reload`,
      `sudo /bin/systemctl enable elasticsearch.service`,
      `sudo systemctl start elasticsearch.service`,
      `sleep 15`,
      `sed -i 's/## -Xms4g/-Xms2g/' /etc/elasticsearch/jvm.options`,
      `sed -i 's/## -Xmx4g/-Xmx2g/' /etc/elasticsearch/jvm.options`,
      `sudo echo -y | sudo /usr/share/elasticsearch/bin/elasticsearch-plugin install --batch discovery-ec2`,
      `sudo mkdir -p /etc/systemd/system/elasticsearch.service.d`,
      `sudo echo -e "[Service]\nLimitMEMLOCK=infinity" >> /etc/systemd/system/elasticsearch.service.d/override.conf`,
      `sudo systemctl daemon-reload`,
      `sudo systemctl restart elasticsearch.service`,
      `sleep 15`,
      `sudo systemctl stop elasticsearch.service`,
      `sleep 5`,
      `sudo rm -rf /var/lib/elasticsearch/nodes/`,
      `sudo rm /etc/elasticsearch/elasticsearch.yml`,
      `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/es -o /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.name:.*//' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.roles:.*/node.roles: [ data_hot, data_content ]/' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
      `sudo systemctl start elasticsearch.service`,
    ];

    dataHotASG.userData.addCommands(...dataHotCommands);

    // const dataWarmASG = new autoscaling.AutoScalingGroup(this, 'Data-Warm-ASG', {
    //   vpc: props.vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: new ec2.InstanceType(params.DataWarmInstanceType),
    //   securityGroup: props.securityGroup,
    //   allowAllOutbound: false,
    //   minCapacity: params.MinDataNodes,
    //   maxCapacity: params.MaxWarmDataNodes,
    //   //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(params.HealthCheckGracePeriod)),
    //   keyName: props.sshKey,
    //   vpcSubnets: {
    //     subnets,
    //   }
    //   // autoScalingGroupName: '',
    //   // blockDevices: [],
    //   // cooldown: cdk.Duration.minutes(5),
    //   // GroupMetrics: [],
    //   // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
    //   // role: '',
    //   // signals: new autoscaling.Signals()
    // });

    this.masters.forEach((node, i) => {
      this.outputs = new cdk.CfnOutput(this, "ESExports" + i, {
        value: node.instancePrivateIp,
        exportName: `es-private-ip-${i}`,
      });
    });
    // ------------------------------------------------

    // this.dataColdASG = new autoscaling.AutoScalingGroup(this, 'Data-Cold-ASG', {
    //   vpc: props.vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: new ec2.InstanceType(params.DataColdInstanceType),
    //   securityGroup: props.securityGroup,
    //   allowAllOutbound: false,
    //   minCapacity: params.MinDataNodes,
    //   maxCapacity: params.MaxColdDataNodes,
    //   //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(params.HealthCheckGracePeriod)),
    //   keyName: props.sshKey,
    //   vpcSubnets: {
    //     subnets,
    //   }
    //   // autoScalingGroupName: '',
    //   // blockDevices: [],
    //   // cooldown: cdk.Duration.minutes(5),
    //   // GroupMetrics: [],
    //   // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
    //   // role: '',
    //   // signals: new autoscaling.Signals()
    // });

    // SCALING METHODS
    // scaleOnCpuUtilization(id, props) => Scale out or in to achieve a target CPU utilization.
    // scaleToTrackMetric(id, props) => Scale out or in in order to keep a metric around a target value.
    // scaleOnMetric(id, props) => Scale out or in, in response to a metric.
    // scaleOnIncomingBytes(id, props) => Scale out or in to achieve a target network ingress rate.
    // scaleOnOutgoingBytes(id, props) => Scale out or in to achieve a target network egress rate.
  }
}

module.exports = { Elasticsearch };
