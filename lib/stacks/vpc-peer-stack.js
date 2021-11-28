const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class PeeringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const connection = new ec2.CfnVPCPeeringConnection(this, "Peer", {
      lodgeVpc: props.lodgeVpc,
      peerVpcId: this.node.tryGetContext('USER_VPC_ID'),
    });

    props.lodgeVpc.privateSubnets.forEach(
      ({ routeTable: { routeTableId } }, index) => {
        new ec2.CfnRoute(this, "RouteFromPrivateSubnetOfLodgeToUser" + index, {
          destinationCidrBlock: props.lodgeVpc.userCidr,
          routeTableId,
          vpcPeeringConnectionId: connection.ref,
        });
      }
    );
  }
}

module.exports = { PeeringStack };
