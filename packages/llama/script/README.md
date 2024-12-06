# Llama Scripts

The current Llama scripts are:
* `DeployLlamaFactory.s.sol`, which deploys the LlamaFactory, logic/implementation contracts, and LlamaLens to new chains
* `DeployLlamaInstance.s.sol`, which deploys new Llama instances using a JSON-based configuration
* `ConfigureAdvancedLlamaInstance.s.sol`, which completes the initialization of advanced instance deployments with a code-based configuration

Additionally, both `DeployLlamaFactory` and `DeployLlamaInstance` are called during the test bootstrap process to establish the state against which most of the test suite runs.

## Deployment Configurations

Before running any script that deploys a new Llama instance, it is important to understand the one special-cased role ID and permission ID in the system.

A newly deployed Llama instance may be unusable if not properly configured. In particular, the core requirements are:
- A policyholder can call the policy's `setRolePermission` method.
- The strategy used when calling that method can be executed.

With those two requirements satisfied, new permissions can be assigned to reconfigure the instance with any desired permissions.
Therefore, we help enforce this at the protocol level with the following behavior:

- We refer to the very first strategy in the `initialStrategies` array as the `bootstrapStrategy` because this strategy can be used (in tandem with the below) to bootstrap the instance to any configuration.
- Role ID 1 is special-cased to be the corresponding `bootstrapRole` because this role can be used (in tandem with the above) to bootstrap the instance to any configuration.
- The `LlamaFactory.deploy` method, will verify that at least 1 role holder in the `initialRoleHolders` array has the `bootstrapRole` role ID of 1. If this is not the case, deployment reverts.
- The `deploy` method will then deploy and initialize the `LlamaCore` contract, and the `LlamaCore` contract will deploy and initialize the `LlamaPolicy` contract.
- Initialization of the `LlamaCore` contract is where the `bootstrapStrategy` is deployed and the bootstrap permission ID is set. This is the permission ID (the `(target, selector, strategy)` tuple) that can be used to call the `setRolePermission` method.

A key part of ensuring the instance is not misconfigured is ensuring that the `bootstrapStrategy` is a valid strategy that can actually be executed. This is checked in deploy scripts, because the strategy can have any logic, so it's not necessarily possible to check this at the protocol level.

### Standard vs Advanced Deployments

Standard deployments define their instance configuration in a JSON file. The `DeployLlamaInstance` script uses this JSON-based configuration as the input to call the `LlamaFactory` deploy function. This is the preferred deployment method for most instances. 

For instances that want a more flexible, code-based deployment method, they can use the `DeployLlamaInstance` script along with the `ConfigureAdvancedInstance` script. This can be used to handle advanced use cases such as configuring both absolute and relative strategies. The `DeployLlamaInstance` script is run using a configuration similar to `script/input/31337/advancedInstanceConfig.json`. This deploys the instance with a single configuration bot policyholder. The configuration file for advanced deployments must have an instant execution strategy as the bootstrap strategy (first strategy in `initialStrategies`) and role #1 must be assigned to the deployer of the `ConfigureAdvancedInstance` script.

We've provided `src/scripts/LlamaInstanceConfigBase.sol` as a parent contract for configuration scripts to simplify the process of removing all traces of the config bot from the instance post-configuration. Please note that the body of the instance configuration script must assign roles, permissions, and strategies in a functional way or else there's a risk that the instance will be unaccessible. We recommend using the JSON-based configuration by default because it has built-in protection against these user errors.

## DeployLlamaFactory

To perform a dry-run of the `DeployLlamaFactory` script on a network, first set the
`SCRIPT_RPC_URL` variable in your `.env` file to a local node, e.g. anvil.

To start anvil:

```shell
# Start anvil, forking from the desired network.
anvil --fork-url $OPTIMISM_RPC_URL
```
Next, set `SCRIPT_PRIVATE_KEY` in your `.env` file. For a dry run, you can just
use one of the pre-provisioned private keys that anvil provides on startup.

Then, to execute the call:

```shell
just dry-run-deploy
```

If that looked good, try broadcasting the script transactions to the local node.
With the local node URL still set as `SCRIPT_RPC_URL` in your `.env` file:

```shell
just deploy
```

When you are ready to deploy to a live network, simply follow the steps above
but with `SCRIPT_RPC_URL` pointing to the appropriate node and
`SCRIPT_PRIVATE_KEY` set to the deployer private key.

## DeployLlamaInstance

The `DeployLlamaInstance` script presupposes that the `DeployLlamaFactory` script has already
been run for a given chain. So follow the instructions above before continuing
here.

Once `DeployLlamaFactory` has been run, set a `SCRIPT_DEPLOYER_ADDRESS` in your `.env` that corresponds to the `SCRIPT_PRIVATE_KEY` that you want deploy the Llama instance.
It does *not* have to be the same address that did the initial deploy, but it could be.
Add your desired Llama instance configuration JSON file to `script/input/<CHAIN_ID_OF_DEPLOYMENT_CHAIN>` and update the `run-deploy-instance-script` command in the `justfile` to match your configuration's filename.

Once your `.env` file is configured and anvil is running, you can perform a dry
run like this:

```shell
just dry-run-deploy-instance
```

If all goes well, broadcast as follows:

```shell
just deploy-instance
```
