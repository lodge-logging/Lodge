const arg = require("arg");
const inquirer = require("inquirer");

function showHelp() {
  const message = `
Lodge is a framework for standing up your own ELK stack on AWS.
run 'lodge --install' or 'lodge --i' to get started.
`;
  console.log(message);
}

function validateCIDR(input, answers) {
  input = input.trim();
  const cidrRegex = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/(1[6-9]|2[0-8])$/);

  if (!cidrRegex.test(input)) {
    return "Please enter a valid CIDR Block. eg: 0.0.0.0/22";
  }

  const pass = answers.newVPCCIDR !== input && answers.existingSubnetCIDR !== input && answers.whitelistCIDR !== input;
  return (pass) ? true : "This CIDR Block was previously assigned. Please enter a different CIDR Block";
}

function confirmationMessage(answers) {
  return `Is this correct? 
    Installation Type: ${answers.vpc}
    ${answers.newVPCCIDR ? `New VPC CIDR: ${answers.newVPCCIDR}` : `Existing subnet CIDR: ${answers.existingSubnetCIDR}`}
    CIDR to whitelist: ${answers.whitelistCIDR}
  `;
}

function parseArgsToOptions(rawArgs) {
  const expectedArgs = arg(
    {
      "--install": Boolean,
      "--help": Boolean,
      "-i": "--install",
    },
    {
      argv: rawArgs.slice(2)
    }
  );

  return {
    runInstall: expectedArgs["--install"] || false,
    showHelp: expectedArgs["--help"] || false,
  }
}

async function installPrompt() {
  const questions = [
    {
      type: "confirm",
      name: "awsConfirm",
      message: "Welcome to Lodge! This installation assumes you already have the AWS CLI installed and configured. Please confirm",
    },
    {
      type: "list",
      name: "vpc",
      message: "Please choose how you wish to install Lodge:",
      choices: ["Use an existing VPC", "Spin up a new VPC"],
      when: (answers) => answers.awsConfirm === true
    },
    {
      type: "input",
      name: "existingSubnetCIDR",
      message: "Enter a valid CIDR Block of the subnet you wish to deploy in",
      validate: validateCIDR,
      when: (answers) => answers.vpc === "Use an existing VPC" && answers.awsConfirm === true
    },
    {
      type: "input",
      name: "newVPCCIDR",
      message: "Enter a unique CIDR Block to deploy your new VPC in",
      validate: validateCIDR,
      when: (answers) => answers.vpc === "Spin up a new VPC" && answers.awsConfirm === true
    },
    {
      type: "input",
      name: "whitelistCIDR",
      message: "Input a valid CIDR Block to whitelist",
      validate: validateCIDR,
      when: (answers) => answers.awsConfirm === true
    },
  ];

  let again = true;
  while (again) {
    const answers = await inquirer.prompt(questions);
    const confirmation = await inquirer.prompt([
      {
        type: "confirm",
        name: "again",
        message: confirmationMessage(answers),
      }
    ]);

    again = !confirmation.again;
  }
}

async function cli(args) {
  let options = parseArgsToOptions(args);

  if (options.showHelp) {
    showHelp();
  }

  if (options.runInstall) {

    await installPrompt();
    /* do in stages. 
      Tell them we assume they've already installed and configured aws cli
      look in to automating cdk installation so they can run it. 

      clone repo and npm install dependencies

      deploy cdk 
      wait for it to be done
      run cdk deploy again
      wait for it to be done again
    
      'lodge connect' and be able to run 'connect' to SSH to bastion host. 
      celebrate
    */
  }
}

exports.cli = cli;
