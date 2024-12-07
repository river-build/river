// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {DeployLlamaFactory} from "@llama/script/DeployLlamaFactory.s.sol";
import {DeployLlamaInstance} from "@llama/script/DeployLlamaInstance.s.sol";
import {ConfigureAdvancedLlamaInstance} from "@llama/script/ConfigureAdvancedLlamaInstance.s.sol";
import {MockInstanceConfig} from "@llama/test/mock/MockInstanceConfig.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";

contract Counter {
  uint256 count;

  function increment() external {
    count++;
  }
}

contract LlamaInstanceConfigScriptTest is
  Test,
  DeployLlamaFactory,
  DeployLlamaInstance,
  ConfigureAdvancedLlamaInstance
{
  event StrategyAuthorizationSet(
    ILlamaStrategy indexed strategy,
    bool authorized
  );

  // This is the address that we're using with the CreateAction script to
  // automate action creation to deploy new Llama instances. It could be
  // replaced with any address that we hold the private key for.
  address LLAMA_INSTANCE_DEPLOYER = 0x3d9fEa8AeD0249990133132Bb4BC8d07C6a8259a;
  address configScriptAddress;
  address counter = 0x6D6bbe95aD0E71a4084Af5f26A97BD73483b4914;
  ILlamaStrategy strategy =
    ILlamaStrategy(0xC64d3931cD638A275CA185dc758cd5028c163f58);

  function setUp() public virtual {
    DeployLlamaFactory.run();
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "advancedInstanceConfig.json"
    );
    configScriptAddress = address(new MockInstanceConfig());
  }

  function mineBlock() internal {
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1);
  }
}

contract Execute is LlamaInstanceConfigScriptTest {
  using stdJson for string;

  function _configureAdvancedInstance() internal {
    mineBlock();
    ConfigureAdvancedLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "advancedInstanceConfig.json",
      core,
      configScriptAddress,
      "Core Team"
    );
    mineBlock();
  }

  function test_CounterContractIsDeployed() public {
    assertEq(counter.code.length, 0);
    _configureAdvancedInstance();
    assertGt(counter.code.length, 0);
  }

  function test_StrategyisCreatedAndAuthorized() public {
    (bool deployed, bool authorized) = core.strategies(strategy);
    assertFalse(deployed);
    assertFalse(authorized);
    _configureAdvancedInstance();
    (deployed, authorized) = core.strategies(strategy);
    assertTrue(deployed);
    assertTrue(authorized);
  }

  function test_PolicyholderHasPermissionId() public {
    address mockPolicyHolder = address(0x1337);
    uint8 assignedRole = uint8(1);
    bytes32 permissionId = lens.computePermissionId(
      PermissionData(
        counter, // target
        bytes4(Counter.increment.selector), // selector
        strategy // strategy
      )
    );

    assertFalse(
      core.policy().hasPermissionId(
        mockPolicyHolder,
        assignedRole,
        permissionId
      )
    );
    _configureAdvancedInstance();
    assertTrue(
      core.policy().hasPermissionId(
        mockPolicyHolder,
        assignedRole,
        permissionId
      )
    );
  }
}
