const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const data = require("../../user-data.json");
const params = require("../config/vpc-params");
class VPC extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.vpc;
    this.PrivateSubnets;
    this.PublicSubnets;

    if (props.existingVPC) {
      this.vpc = ec2.Vpc.fromLookup(this, "Imported-VPC", {
        vpcId: props.userVPCId,
      });

      let privateSubnetsAttributes = Object.keys(data.privateSubnets).map(
        (s) => {
          return {
            id: data.privateSubnets[s].id,
            az: data.privateSubnets[s].az,
            cidr: data.privateSubnets[s].cidr,
          };
        }
      );

      this.PrivateSubnets = privateSubnetsAttributes.map(({ id, az, cidr }) =>
        ec2.Subnet.fromSubnetAttributes(this, `subnet-${id}`, {
          subnetId: id,
          availabilityZone: az,
          ipv4CidrBlock: cidr,
        })
      );

      let publicSubnetsAttributes = [data.publicSubnet];
      this.PublicSubnets = publicSubnetsAttributes.map(({ id, az, cidr }) =>
        ec2.Subnet.fromSubnetAttributes(this, `subnet-${id}`, {
          subnetId: id,
          availabilityZone: az,
          //ipv4CidrBlock: cidr,
        })
      );
    } else {
      this.vpc = new ec2.Vpc(this, "VPC", {
        cidr: data.lodgeVpc.cidr || "10.0.0.0/16",
        maxAzs: 3,
        subnetConfiguration: [
          {
            name: "public-subnet",
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 26,
          },
          {
            name: "private-subnet",
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
            cidrMask: 20,
          },
        ],
      });

      this.PrivateSubnets = this.vpc.privateSubnets;
      this.PublicSubnets = this.vpc.publicSubnets;
    }

    this.userCidr = data.userCidr || "0.0.0.0/0";

    this.vpc.addGatewayEndpoint("s3-VPC-gateway-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [ec2.SubnetType.PRIVATE_ISOLATED],
    });

    const sshSG = new ec2.SecurityGroup(this, "ssh-sg", {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: "security group for ssh host",
    });

    const webtoolSG = new ec2.SecurityGroup(this, "webtool-sg", {
      vpc: this.vpc,
      description: "security group for the webtool",
    });

    const kibanaSG = new ec2.SecurityGroup(this, "kibana-sg", {
      vpc: this.vpc,
      description: "security group for kibana",
    });

    const zookeeperSG = new ec2.SecurityGroup(this, "zookeeper-sg", {
      vpc: this.vpc,
      description: "security group for zookeeper",
    });

    const kafkaSG = new ec2.SecurityGroup(this, "kafka-sg", {
      vpc: this.vpc,
      description: "security group for kafka",
    });

    const logstashSG = new ec2.SecurityGroup(this, "logstash-sg", {
      vpc: this.vpc,
      description: "security group for logstash",
    });

    const elasticsearchSG = new ec2.SecurityGroup(this, "elasticsearch-sg", {
      vpc: this.vpc,
      description: "security group for elasticsearch",
    });

    // this.vpc.addInterfaceEndpoint("ssm-messages", {
    //   open: true,
    //   privateDnsEnabled: true,
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    //   subnets: this.vpc.selectSubnets(),
    //   securityGroups: [sshSG],
    // });

    // this.vpc.addInterfaceEndpoint("ec2-messages", {
    //   open: true,
    //   privateDnsEnabled: true,
    //   service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    //   subnets: this.vpc.selectSubnets(),
    //   securityGroups: [sshSG],
    // });

    // this.vpc.addInterfaceEndpoint("ssm", {
    //   open: true,
    //   privateDnsEnabled: true,
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM,
    //   subnets: this.vpc.selectSubnets(),
    //   securityGroups: [sshSG],
    // });

    webtoolSG.addIngressRule(
      ec2.Peer.ipv4(this.userCidr),
      ec2.Port.tcp(params.ports.external.ZooManager),
      "allow tcp from user to ZooManager"
    );
    webtoolSG.addIngressRule(
      ec2.Peer.ipv4(this.userCidr),
      ec2.Port.tcp(params.ports.external.Kowl),
      "allow tcp from user to Kowl"
    );
    webtoolSG.addIngressRule(
      ec2.Peer.ipv4(this.userCidr),
      ec2.Port.tcp(params.ports.external.s3Dashboard),
      "allow tcp from user to s3Dashboard"
    );

    webtoolSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    kibanaSG.addIngressRule(
      ec2.Peer.ipv4(this.userCidr),
      ec2.Port.tcp(params.ports.external.Kibana),
      "allow tcp from user to Kibana"
    );

    kibanaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    zookeeperSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    zookeeperSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [webtoolSG],
      }),
      ec2.Port.tcp(params.ports.external.Zookeeper)
    );
    zookeeperSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [kafkaSG],
      }),
      ec2.Port.tcp(params.ports.external.Zookeeper)
    );

    zookeeperSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [zookeeperSG],
      }),
      ec2.Port.tcpRange(...params.ports.internal.Zookeeper)
    );

    zookeeperSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [zookeeperSG],
      }),
      ec2.Port.tcp(params.ports.external.Zookeeper)
    );

    kafkaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    kafkaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [zookeeperSG],
      }),
      ec2.Port.tcp(params.ports.external.Kafka)
    );
    kafkaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [kafkaSG],
      }),
      ec2.Port.tcp(params.ports.external.Kafka)
    );
    kafkaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [logstashSG],
      }),
      ec2.Port.tcp(params.ports.external.Kafka)
    );

    kafkaSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [webtoolSG],
      }),
      ec2.Port.tcp(params.ports.external.Kafka)
    );

    logstashSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );

    elasticsearchSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [sshSG],
      }),
      ec2.Port.tcp(params.ports.external.SSH)
    );
    elasticsearchSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [logstashSG],
      }),
      ec2.Port.tcpRange(...params.ports.external.Elasticsearch)
    );

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
      ec2.Port.tcpRange(...params.ports.internal.Elasticsearch)
    );

    this.securityGroups = {
      sshSG,
      webtoolSG,
      kibanaSG,
      zookeeperSG,
      kafkaSG,
      logstashSG,
      elasticsearchSG,
    };
  }
}

module.exports = { VPC };
