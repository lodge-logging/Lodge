import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

export class PeeringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const connection = new ec2.CfnVPCPeeringConnection(this, "Peer", {
      lodgeVpc: props.lodgeVpc,
    });

    props.lodgeVpc.privateSubnets.forEach(
      ({ routeTable: { routeTableId } }, index) => {
        new ec2.CfnRoute(this, "RouteFromPrivateSubnetOfLodgeToUser" + index, {
          destinationCidrBlock: props.lodgeVpc.userCider,
          routeTableId,
          vpcPeeringConnectionId: connection.ref,
        });
      }
    );
  }
}

module.exports = { PeeringStack };
