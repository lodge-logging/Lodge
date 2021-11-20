const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
// const s3 = require('@aws-cdk/aws-s3');
// const iam = require('@aws-cdk/aws-iam');
//const params = require('../params/vpc-params');
const params = {
  VPCCidrBlock: "10.0.0.0/16",
  ports: {
    internal: {
      Elasticsearch: [9300, 9400],
    },
    external: {
      Elasticsearch: [9200, 9300],
      SSH: 22,
    },
    test: {
      Elasticsearch: [9200, 9400],
    },
  },
};
class VPC extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // this.importedVPC = ec2.Vpc.fromLookup(this, 'Imported-VPC', {
    //   // This imports the default VPC but you can also
    //   // specify a 'vpcName' or 'tags'.
    //   vpcId: 'vpc-0608e4926bebf1a20',
    //   isDefault: false,
    // });
    this.vpc = new ec2.Vpc(this, "VPC", {
      cidr: params.VPCCidrBlock,
      // gatewayEndpoints: '',
      // natGatewayProvider: ec2.NatProvider.instance({
      //   instanceType: new ec2.InstanceType('t2.micro'),
      // }),
      // natGatewaySubnets: '',
      //natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 26,
        },
        {
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 20,
        },
      ],

      // vpnConnections: '',
      // vpnGateway: '',
      // vpnGatewayAsn: '',
      // vpnRoutePropagation: '',
    });

    this.vpc.addGatewayEndpoint("s3-VPC-gateway-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [ec2.SubnetType.PRIVATE_ISOLATED],
    });

    const sshSG = new ec2.SecurityGroup(this, "ssh-sg", {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: "security group for ssh host",
    });

    // const webtoolSG = new ec2.SecurityGroup(this, "webtool-sg", {
    //   vpc: this.vpc,
    //   description: "security group for the webtool",
    // });

    const kibanaSG = new ec2.SecurityGroup(this, "kibana-sg", {
      vpc: this.vpc,
      description: "security group for kibana",
    });

    // const zookeeperSG = new ec2.SecurityGroup(this, "zookeeper-sg", {
    //   vpc: this.vpc,
    //   description: "security group for zookeeper",
    // });

    // const kafkaSG = new ec2.SecurityGroup(this, "kafka-sg", {
    //   vpc: this.vpc,
    //   description: "security group for kafka",
    // });

    // const logstashSG = new ec2.SecurityGroup(this, "logstash-sg", {
    //   vpc: this.vpc,
    //   description: "security group for logstash",
    // });

    const elasticsearchSG = new ec2.SecurityGroup(this, "elasticsearch-sg", {
      vpc: this.vpc,
      description: "security group for elasticsearch",
    });

    this.vpc.addInterfaceEndpoint("ssm-messages", {
      open: true,
      privateDnsEnabled: true,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: this.vpc.selectSubnets(),
      securityGroups: [sshSG],
    });

    this.vpc.addInterfaceEndpoint("ec2-messages", {
      open: true,
      privateDnsEnabled: true,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: this.vpc.selectSubnets(),
      securityGroups: [sshSG],
    });

    this.vpc.addInterfaceEndpoint("ssm", {
      open: true,
      privateDnsEnabled: true,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: this.vpc.selectSubnets(),
      securityGroups: [sshSG],
    });

    // webtoolSG.addIngressRule(
    //   ec2.Peer.ipv4(params.userCidr),
    //   ec2.Port.tcp(params.ports.external.ZooManager),
    //   'allow tcp from user to ZooManager'
    // )
    // webtoolSG.addIngressRule(
    //   ec2.Peer.ipv4(params.userCidr),
    //   ec2.Port.tcp(params.ports.external.Kowl),
    //   'allow tcp from user to Kowl'
    // )

    // webtoolSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [sshSG],
    //   }),
    //   ec2.Port.tcp(params.ports.external.SSH)
    // );

    // kibanaSG.addIngressRule(
    //   ec2.Peer.ipv4(params.userCidr),
    //   ec2.Port.tcp(params.ports.external.Kibana),
    //   'allow tcp from user to Kibana'
    // )

    kibanaSG.connections.allowFromAnyIpv4(ec2.Port.tcp(5601));

    kibanaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    // zookeeperSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [sshSG],
    //   }),
    //   ec2.Port.tcp(params.ports.external.SSH)
    // );

    // zookeeperSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [webtoolSG],
    //   }),
    //   ec2.Port.tcp(2181)
    // );
    // zookeeperSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [kafkaSG],
    //   }),
    //   ec2.Port.tcp(2181)
    // );

    // zookeeperSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [zookeeperSG],
    //   }),
    //   ec2.Port.tcpRange(2181, 3888)
    // );

    // kafkaSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [sshSG],
    //   }),
    //   ec2.Port.tcp(params.ports.external.SSH)
    // );

    // kafkaSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [zookeeperSG],
    //   }),
    //   ec2.Port.tcp(9092)
    // );
    // kafkaSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [kafkaSG],
    //   }),
    //   ec2.Port.tcp(9092)
    // );
    // kafkaSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [logstashSG],
    //   }),
    //   ec2.Port.tcp(9092)
    // );

    // kafkaSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [webtoolSG],
    //   }),
    //   ec2.Port.tcp(9092)
    // );

    // logstashSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [sshSG],
    //   }),
    //   ec2.Port.tcp(params.ports.external.SSH)
    // );

    elasticsearchSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );
    // elasticsearchSG.connections.allowFrom(
    //   new ec2.Connections({
    //     securityGroups: [logstashSG],
    //   }),
    //   ec2.Port.tcpRange(...params.ports.external.Elasticsearch)
    // );

    elasticsearchSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [kibanaSG],
      }),
      ec2.Port.tcpRange(...params.ports.external.Elasticsearch)
    );

    elasticsearchSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [elasticsearchSG],
      }),
      // ec2.Port.tcpRange(...params.ports.internal.Elasticsearch)
      ec2.Port.tcpRange(...params.ports.test.Elasticsearch)
    );
    // elasticsearchSG.connections.allowInternally(
    //   ec2.Port.tcpRange(...params.ports.internal.Elasticsearch)
    // )
    // function tagSubnets(subnets, tagName, tagValue) {
    //   for (const subnet of subnets) {
    //     cdk.Aspects.of(subnet).add(new cdk.Tag(tagName, tagValue));
    //   }
    // }

    // tagSubnets(this.vpc.privateSubnets, 'Name', `your-private-subnet-name`);
    // tagSubnets(this.vpc.publicSubnets, 'Name', `your-public-subnet-name`);

    this.securityGroups = {
      sshSG,
      //webtoolSG,
      kibanaSG,
      //zookeeperSG,
      //kafkaSG,
      //logstashSG,
      elasticsearchSG,
    };
  }
}

module.exports = { VPC };
