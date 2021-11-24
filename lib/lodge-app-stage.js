const cdk = require("@aws-cdk/core");

const { LodgeVPCStack } = require("./stacks/vpc-stack");
const { LodgeZookeeperStack } = require("./stacks/zookeeper-stack");
const { LodgeKafkaStack } = require("./stacks/kafka-stack");
const { LodgeLogstashStack } = require("./stacks/logstash-stack");
const { LodgeKibanaStack } = require("./stacks/kibana-stack");
const { LodgeElasticsearchStack } = require("./lodge-app-sam-stack");
const { LodgeWebToolsStack } = require("./stacks/webtools-stack");
const { LodgeS3Stack } = require("./stacks/s3-stack");
const { LodgeIAMRoleStack } = require("./stacks/iam-stack");
const { PeeringStack } = require("./stacks/vpc-peer-stack");

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
      // create new vpc
      lodgeVPC = new LodgeVPCStack(scope, "LodgeVPCStack", {
        env: props.env,
      });
      const lodgePeering = new PeeringStack(scope, "LodgePeeringStack", {
        lodgeVpc: lodgeVPC.vpc,
      });
      lodgePeering.addDependency(lodgeVPC);
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
        vpc: lodgeVPC.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.securityGroups.elasticsearchSG,
      }
    );
    lodgeElasticsearch.addDependency(lodgeVPC);

    // zookeeper
    const lodgeZookeeper = new LodgeZookeeperStack(
      scope,
      "LodgeZookeeperStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.securityGroups.zookeeperSG,
      }
    );
    lodgeZookeeper.addDependency(lodgeVPC);

    // kafka
    const lodgeKafka = new LodgeKafkaStack(scope, "LodgeKafkaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kafkaSG,
      zookeeperInstances: lodgeZookeeper.zookeeperCluster.instances,
    });
    lodgeKafka.addDependency(lodgeZookeeper);

    //logstash
    const lodgeLogstash = new LodgeLogstashStack(scope, "LodgeLogstashStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.logstashSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
      bucket: lodgeS3.bucket.instance,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
    });
    lodgeLogstash.addDependency(lodgeKafka);
    lodgeLogstash.addDependency(lodgeElasticsearch);
    lodgeLogstash.addDependency(lodgeS3);
    lodgeLogstash.addDependency(lodgeIAMRoles);

    // kibana
    const lodgeKibana = new LodgeKibanaStack(scope, "LodgeKibanaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kibanaSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
    });
    lodgeKibana.addDependency(lodgeElasticsearch);

    // webtools
    const lodgeWebTools = new LodgeWebToolsStack(scope, "LodgeWebToolsStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.webtoolSG,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
      bucket: lodgeS3.bucket.instance,
      kibanaInstance: lodgeKibana.kibana.instance,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
    });
    lodgeWebTools.addDependency(lodgeKafka);
    lodgeWebTools.addDependency(lodgeIAMRoles);
    lodgeWebTools.addDependency(lodgeS3);
    lodgeWebTools.addDependency(lodgeKibana);
    lodgeWebTools.addDependency(lodgeElasticsearch);
  }
}

module.exports = { LodgeAppStage };
