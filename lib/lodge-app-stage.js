const cdk = require("@aws-cdk/core");

const { LodgeVPCStack } = require("./stacks/vpc-stack");
const { LodgeZookeeperStack } = require("./stacks/zookeeper-stack");
const { LodgeKafkaStack } = require("./stacks/kafka-stack");
const { LodgeLogstashStack } = require("./stacks/logstash-stack");
const { LodgeKibanaStack } = require("./stacks/kibana-stack");
const { LodgeElasticsearchStack } = require("./stacks/elasticsearch-stack");
const { LodgeWebToolsStack } = require("./stacks/webtools-stack");
const { LodgeS3Stack } = require("./stacks/s3-stack");
const { LodgeIAMRoleStack } = require("./stacks/iam-stack");
const { LodgeBastionHostStack } = require("./stacks/bastion-host-satck");
// const { PeeringStack } = require("./stacks/vpc-peer-stack");
const { getPrivateSubnets, getPublicSubnets } = require("./utils/getSubnets");

class LodgeAppStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    let lodgeVPC;
    let importedVPCId = this.node.tryGetContext("VPC_ID");
    if (importedVPCId) {
      // use user vpc
      lodgeVPC = new LodgeVPCStack(scope, "LodgeVPCStack", {
        env: props.env,
        existingVPC: true,
        userVPCId: importedVPCId,
      });
    } else {
      console.log("hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
      // create new vpc
      lodgeVPC = new LodgeVPCStack(scope, "LodgeVPCStack", {
        env: props.env,
      });

      lodgeVPC.vpcStack.PrivateSubnets = getPrivateSubnets(
        lodgeVPC.vpcStack.vpc
      );

      lodgeVPC.vpcStack.PublicSubnets = getPublicSubnets(lodgeVPC.vpcStack.vpc);

      // const lodgePeering = new PeeringStack(scope, "LodgePeeringStack", {
      //   lodgeVpc: lodgeVPC.vpc,
      // });

      // lodgePeering.addDependency(lodgeVPC);
    }

    // s3
    const lodgeS3 = new LodgeS3Stack(scope, "LodgeS3Stack", {
      env: props.env,
    });

    // IAM roles
    const lodgeIAMRoles = new LodgeIAMRoleStack(scope, "LodgeIAMRoleStack", {
      env: props.env,
      bucket: lodgeS3.bucket.instance,
    });
    lodgeIAMRoles.addDependency(lodgeS3);

    // elasticsearch
    const lodgeElasticsearch = new LodgeElasticsearchStack(
      scope,
      "LodgeElasticsearchStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpcStack.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.vpcStack.securityGroups.elasticsearchSG,
        esRole: lodgeIAMRoles.iamRole.esRole,
        PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
      }
    );
    lodgeElasticsearch.addDependency(lodgeVPC);
    lodgeElasticsearch.addDependency(lodgeIAMRoles);

    // zookeeper
    const lodgeZookeeper = new LodgeZookeeperStack(
      scope,
      "LodgeZookeeperStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpcStack.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.vpcStack.securityGroups.zookeeperSG,
        PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
      }
    );
    lodgeZookeeper.addDependency(lodgeVPC);

    // kafka
    const lodgeKafka = new LodgeKafkaStack(scope, "LodgeKafkaStack", {
      env: props.env,
      vpc: lodgeVPC.vpcStack.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.vpcStack.securityGroups.kafkaSG,
      zookeeperInstances: lodgeZookeeper.zookeeperCluster.instances,
      PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
    });
    lodgeKafka.addDependency(lodgeZookeeper);

    //logstash
    const lodgeLogstash = new LodgeLogstashStack(scope, "LodgeLogstashStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpcStack.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.vpcStack.securityGroups.logstashSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
      bucket: lodgeS3.bucket.instance,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
      PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
    });
    lodgeLogstash.addDependency(lodgeKafka);
    lodgeLogstash.addDependency(lodgeElasticsearch);
    lodgeLogstash.addDependency(lodgeS3);
    lodgeLogstash.addDependency(lodgeIAMRoles);

    // kibana
    const lodgeKibana = new LodgeKibanaStack(scope, "LodgeKibanaStack", {
      env: props.env,
      vpc: lodgeVPC.vpcStack.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.vpcStack.securityGroups.kibanaSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
      // PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
      PublicSubnets: lodgeVPC.vpcStack.PublicSubnets,
    });
    lodgeKibana.addDependency(lodgeElasticsearch);

    // webtools
    const lodgeWebTools = new LodgeWebToolsStack(scope, "LodgeWebToolsStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpcStack.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.vpcStack.securityGroups.webtoolSG,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
      bucket: lodgeS3.bucket.instance,
      kibanaInstance: lodgeKibana.kibana.instance,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
      PublicSubnets: lodgeVPC.vpcStack.PublicSubnets,
      //PrivateSubnets: lodgeVPC.vpcStack.PrivateSubnets,
    });
    lodgeWebTools.addDependency(lodgeKafka);
    lodgeWebTools.addDependency(lodgeIAMRoles);
    lodgeWebTools.addDependency(lodgeS3);
    lodgeWebTools.addDependency(lodgeKibana);
    lodgeWebTools.addDependency(lodgeElasticsearch);

    // Bastion Host
    const lodgeBastionHost = new LodgeBastionHostStack(
      scope,
      "LodgeBastionHostStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpcStack.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.vpcStack.securityGroups.sshSG,
        ec2Role: lodgeIAMRoles.iamRole.ec2Role,
        ESInstances: lodgeElasticsearch.elasticsearch.masters,
        kafkaInstances: lodgeKafka.kafkaCluster.instances,
        zookeeperInstances: lodgeZookeeper.zookeeperCluster.instances,
        kibanaInstance: lodgeKibana.kibana.instance,
        webToolsInstance: lodgeWebTools.webtools.instance,
      }
    );
    lodgeBastionHost.addDependency(lodgeKafka);
    lodgeBastionHost.addDependency(lodgeIAMRoles);
    lodgeBastionHost.addDependency(lodgeZookeeper);
    lodgeBastionHost.addDependency(lodgeKibana);
    lodgeBastionHost.addDependency(lodgeElasticsearch);
    lodgeBastionHost.addDependency(lodgeWebTools);
  }
}

module.exports = { LodgeAppStage };
