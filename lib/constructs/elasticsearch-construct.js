const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const iam = require("@aws-cdk/aws-iam");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const { insertIPsIntoConfig } = require("../utils/addIPs");
//const params = require('../params/elasticsearch-params');
// const { readFileSync } = require('fs');
// const path = require('path');

// const master1UserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-master1-user-data.sh');
// const master2UserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-master2-user-data.sh');
// const voteOnlyUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-vote-only-user-data.sh');
// const dataHotUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-hot-user-data.sh');
// const dataWarmUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-warm-user-data.sh');
// const dataColdUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-cold-user-data.sh');
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
    const subnets = props.vpc.publicSubnets;

    const output = this.node.tryGetContext("output");

    const clusterDiscovery = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["ec2:DescribeInstances"],
          // 👇 Default for `effect` is ALLOW
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    // 👇 Create role, to which we'll attach our Policies
    const role = new iam.Role(this, "ec2-describe-instances", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "An example IAM role in AWS CDK",
      inlinePolicies: {
        // 👇 attach the Policy Document as inline policies
        clusterDiscovery,
      },
    });

    for (let i = 1; i <= params.num; i++) {
      const master = new ec2.Instance(this, `ES-Master-${i}`, {
        vpc: props.vpc,
        machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
        instanceType: new ec2.InstanceType(params.MasterInstanceType),
        securityGroup: props.securityGroup,
        vpcSubnets: {
          subnets: [subnets[i - 1]],
        },
        keyName: props.sshKey,
        //blockDevices: [],
        //instanceName: '',
        //privateIpAddress: ''
        //resourceSignalTimeout: new cdk.Duration()
        role: role,
        //sourceDestCheck: true || false,
        // userDataCausesReplacement: true || false,
      });

      this.masters.push(master);

      const commands = [
        `sudo systemctl stop elasticsearch.service`,
        `sudo rm -rf /var/lib/elasticsearch/nodes/`,
        `sed -i 's/node.name:.*/node.name: master-${i}/' /etc/elasticsearch/elasticsearch.yml`,
        `sed -i 's/node.roles:.*/node.roles: [ master ]/' /etc/elasticsearch/elasticsearch.yml`,
        `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
        `sudo systemctl start elasticsearch.service`,
      ];

      master.userData.addCommands(...commands);
    }

    // const master1 = new ec2.Instance(this, 'ES-Master-1', {
    //   vpc: props.vpc,
    //   machineImage: ec2.MachineImage.lookup({name: 'Elasticsearch'}),
    //   instanceType: new ec2.InstanceType(params.MasterInstanceType),
    //   securityGroup: props.securityGroup,
    //   vpcSubnets: {
    //     subnets: [subnets[0]],
    //   },
    //   keyName: props.sshKey,
    //   //blockDevices: [],
    //   //instanceName: '',
    //   //privateIpAddress: ''
    //   //resourceSignalTimeout: new cdk.Duration()
    //   //role: '',
    //   //sourceDestCheck: true || false,
    //   // userDataCausesReplacement: true || false,
    // });

    // const master2 = new ec2.Instance(this, 'ES-Master-2', {
    //   vpc: props.vpc,
    //   machineImage: ec2.MachineImage.lookup({name: 'Elasticsearch'}),
    //   instanceType: new ec2.InstanceType(params.MasterInstanceType),
    //   securityGroup: props.securityGroup,
    //   vpcSubnets: {
    //     subnets: [subnets[1]],
    //   },
    //   keyName: props.sshKey,
    //   //role: '',
    // });
    const voteOnly = new ec2.Instance(this, "ES-Vote-Only", {
      vpc: props.vpc,
      machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
      instanceType: new ec2.InstanceType(params.VoteOnlyInstanceType),
      securityGroup: props.securityGroup,

      vpcSubnets: {
        subnets: [subnets[0]],
      },
      keyName: props.sshKey,
      role: role,
    });

    this.masters.push(voteOnly);
    const voteOnlyCommands = [
      `sudo systemctl stop elasticsearch.service`,
      `sudo rm -rf /var/lib/elasticsearch/nodes/`,
      `sed -i 's/node.name:.*/node.name: vote-only/' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.roles:.*/node.roles: [ master, voting_only ]/' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/discovery.ec2.endpoint:.*/discovery.ec2.endpoint: ec2.${region}.amazonaws.com/' /etc/elasticsearch/elasticsearch.yml`,
      `sudo systemctl start elasticsearch.service`,
    ];

    voteOnly.userData.addCommands(...voteOnlyCommands);

    const dataHotASG = new autoscaling.AutoScalingGroup(this, "Data-Hot-ASG", {
      vpc: props.vpc,
      machineImage: ec2.MachineImage.lookup({ name: "Elasticsearch-Lodge" }),
      instanceType: new ec2.InstanceType(params.DataHotInstanceType),
      securityGroup: props.securityGroup,
      allowAllOutbound: false,
      minCapacity: params.MinDataNodes,
      maxCapacity: params.MaxHotDataNodes,
      //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(100)),
      keyName: props.sshKey,
      vpcSubnets: {
        subnets,
      },
      // autoScalingGroupName: '',
      // blockDevices: [],
      // cooldown: cdk.Duration.minutes(5),
      // GroupMetrics: [],
      // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
      role: role,
      // signals: new autoscaling.Signals()
    });

    const dataHotCommands = [
      `sudo systemctl stop elasticsearch.service`,
      `sudo rm -rf /var/lib/elasticsearch/nodes/`,
      `sed -i 's/node.name:.*//' /etc/elasticsearch/elasticsearch.yml`,
      `sed -i 's/node.roles:.*/node.roles: [ data_hot ]/' /etc/elasticsearch/elasticsearch.yml`,
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

    // if (output.SamStack) {
    //   const ES_IPs = Object.entries(output.SamStack)
    //     .map((entry) => {
    //       if (entry[0].includes("ESExports")) {
    //         return entry[1];
    //       }
    //       return null;
    //     })
    //     .filter((ip) => ip);
    //   this.masters.forEach((master, idx) => {
    //     master.userData.addCommands(`touch test${ES_IPs[idx]}.txt`);
    //     master.instancePrivateIp = ES_IPs[idx];
    //   });
    // } else {
    //   console.log("output is empty");
    //   this.masters.forEach((master) => {
    //     master.userData.addCommands(
    //       "rm /var/lib/cloud/instances/*/sem/config_scripts_user"
    //     );
    //   });
    // }
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

    // USER DATA
    // const master1UserDataScript = readFileSync(master1UserDataPath, 'utf8');
    // const master2UserDataScript = readFileSync(master2UserDataPath, 'utf8');
    // const voteOnlyUserDataScript = readFileSync(voteOnlyUserDataPath, 'utf8');
    // const dataHotUserDataScript = readFileSync(dataHotUserDataPath, 'utf8');
    // const dataWarmUserDataScript = readFileSync(dataWarmUserDataPath, 'utf8');
    // const dataColdUserDataScript = readFileSync(dataColdUserDataPath, 'utf8');

    // this.master1.addUserData(master1UserDataScript);
    // this.master2.addUserData(master2UserDataScript);
    // this.voteOnly.addUserData(voteOnlyUserDataScript);
    // this.dataHotASG.addUserData(dataHotUserDataScript);
    // this.dataWarmASG.addUserData(dataWarmUserDataScript);
    // this.dataColdASG.addUserData(dataColdUserDataScript);

    // CLOUDFORMATION INIT
    // applyCloudFormationInit(init, options?)

    // SCALING METHODS
    // scaleOnCpuUtilization(id, props) => Scale out or in to achieve a target CPU utilization.
    // scaleToTrackMetric(id, props) => Scale out or in in order to keep a metric around a target value.
    // scaleOnMetric(id, props) => Scale out or in, in response to a metric.
    // scaleOnIncomingBytes(id, props) => Scale out or in to achieve a target network ingress rate.
    // scaleOnOutgoingBytes(id, props) => Scale out or in to achieve a target network egress rate.
  }
}

module.exports = { Elasticsearch };
