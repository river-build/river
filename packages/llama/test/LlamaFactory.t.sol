// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {SolarrayLlama} from "@llama/test/utils/SolarrayLlama.sol";
import {LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaPolicyMetadata} from "@llama/src/interfaces/ILlamaPolicyMetadata.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {Action, LlamaInstanceConfig, LlamaPolicyConfig, RoleHolderData, RolePermissionData, PermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract LlamaFactoryTest is LlamaTestSetup {
  uint96 constant DEFAULT_QUANTITY = 1;
  string color = "#FF0420";
  string logo =
    '<g fill="#FF0420"><path d="M44.876 462c-3.783 0-6.883-.881-9.3-2.645-2.384-1.794-3.576-4.344-3.576-7.65 0-.692.08-1.542.238-2.55.414-2.266 1.002-4.989 1.765-8.169C36.165 432.329 41.744 428 50.742 428c2.448 0 4.641.409 6.58 1.228 1.94.787 3.466 1.983 4.579 3.589 1.112 1.574 1.669 3.463 1.669 5.666 0 .661-.08 1.496-.239 2.503a106.077 106.077 0 0 1-1.716 8.169c-1.113 4.314-3.037 7.54-5.77 9.681-2.735 2.109-6.39 3.164-10.97 3.164Zm.668-6.8c1.78 0 3.29-.52 4.53-1.558 1.272-1.039 2.178-2.629 2.718-4.77.731-2.959 1.288-5.541 1.67-7.744.127-.661.19-1.338.19-2.031 0-2.865-1.51-4.297-4.53-4.297-1.78 0-3.307.519-4.578 1.558-1.24 1.039-2.13 2.629-2.671 4.77-.572 2.109-1.145 4.691-1.717 7.744-.127.63-.19 1.291-.19 1.983 0 2.897 1.526 4.345 4.578 4.345ZM68.409 461.528c-.35 0-.62-.11-.81-.331a1.12 1.12 0 0 1-.144-.85l6.581-30.694c.064-.347.239-.63.525-.85.286-.221.588-.331.906-.331h12.685c3.529 0 6.358.724 8.489 2.172 2.161 1.449 3.242 3.542 3.242 6.281 0 .787-.095 1.605-.286 2.455-.795 3.621-2.4 6.297-4.816 8.028-2.385 1.732-5.66 2.597-9.824 2.597h-6.438l-2.194 10.342a1.35 1.35 0 0 1-.524.85c-.287.221-.588.331-.907.331H68.41Zm16.882-18.039c1.335 0 2.495-.362 3.48-1.086 1.018-.724 1.686-1.763 2.004-3.117a8.185 8.185 0 0 0 .143-1.417c0-.913-.27-1.605-.81-2.077-.541-.504-1.463-.756-2.767-.756H81.62l-1.813 8.453h5.485ZM110.628 461.528c-.349 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l5.293-24.461h-8.488c-.35 0-.62-.11-.811-.33a1.12 1.12 0 0 1-.143-.851l1.097-5.052c.063-.347.238-.63.524-.85.286-.221.588-.331.906-.331h25.657c.35 0 .62.11.811.331.127.189.19.378.19.566a.909.909 0 0 1-.047.284l-1.097 5.052c-.064.347-.239.63-.525.851-.254.22-.556.33-.906.33h-8.441l-5.293 24.461c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-6.295ZM135.88 461.528c-.35 0-.62-.11-.811-.331a1.016 1.016 0 0 1-.191-.85l6.629-30.694a1.35 1.35 0 0 1 .525-.85c.286-.221.588-.331.906-.331h6.438c.349 0 .62.11.81.331.128.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-6.438ZM154.038 461.528c-.349 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.064-.347.238-.63.524-.85.287-.221.605-.331.954-.331h5.151c.763 0 1.255.346 1.478 1.039l5.198 14.875 11.588-14.875c.159-.252.382-.488.668-.708.318-.221.7-.331 1.145-.331h5.198c.349 0 .62.11.81.331.127.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-5.771c-.349 0-.62-.11-.81-.331a1.118 1.118 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803-.286.189-.62.283-1.002.283h-2.479c-.668 0-1.129-.362-1.383-1.086l-3.386-10.011-3.815 17.85c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-5.723ZM196.132 461.528c-.35 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l6.628-30.694a1.35 1.35 0 0 1 .525-.85c.285-.221.588-.331.906-.331h6.438c.35 0 .62.11.811.331.127.189.19.378.19.566a.88.88 0 0 1-.047.284l-6.581 30.694c-.063.346-.238.63-.525.85a1.46 1.46 0 0 1-.907.331h-6.437ZM226.07 462c-2.798 0-5.198-.378-7.201-1.133-1.972-.756-3.466-1.763-4.483-3.022-.986-1.26-1.479-2.661-1.479-4.203 0-.252.033-.63.095-1.134.065-.283.193-.519.383-.708.223-.189.476-.283.763-.283h6.103c.383 0 .668.063.859.188.222.126.445.347.668.662.223.818.731 1.495 1.526 2.03.827.535 1.955.803 3.385.803 1.812 0 3.276-.283 4.388-.85 1.113-.567 1.781-1.338 2.002-2.314a2.42 2.42 0 0 0 .048-.566c0-.788-.491-1.401-1.477-1.842-.986-.473-2.798-1.023-5.437-1.653-3.084-.661-5.421-1.653-7.011-2.975-1.589-1.354-2.383-3.117-2.383-5.289 0-.755.095-1.527.286-2.314.635-2.928 2.21-5.226 4.72-6.894 2.544-1.669 5.818-2.503 9.825-2.503 2.415 0 4.563.425 6.438 1.275 1.875.85 3.321 1.936 4.34 3.258 1.049 1.291 1.572 2.582 1.572 3.873 0 .377-.015.645-.047.802-.063.284-.206.52-.429.709a.975.975 0 0 1-.715.283h-6.391c-.698 0-1.176-.268-1.429-.803-.033-.724-.415-1.338-1.146-1.841-.731-.504-1.685-.756-2.861-.756-1.399 0-2.559.252-3.482.756-.889.503-1.447 1.243-1.668 2.219a3.172 3.172 0 0 0-.049.614c0 .755.445 1.385 1.336 1.889.922.472 2.528.96 4.816 1.464 3.562.692 6.153 1.684 7.774 2.975 1.653 1.29 2.479 3.006 2.479 5.147 0 .724-.095 1.511-.286 2.361-.698 3.211-2.4 5.651-5.103 7.32-2.669 1.636-6.246 2.455-10.729 2.455ZM248.515 461.528c-.35 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.063-.347.238-.63.525-.85.286-.221.604-.331.954-.331h5.149c.763 0 1.256.346 1.479 1.039l5.199 14.875 11.587-14.875c.16-.252.382-.488.668-.708.318-.221.699-.331 1.144-.331h5.199c.35 0 .62.11.811.331.127.189.19.378.19.566a.856.856 0 0 1-.048.284l-6.58 30.694c-.065.346-.24.63-.526.85a1.456 1.456 0 0 1-.906.331h-5.769c-.351 0-.621-.11-.811-.331a1.109 1.109 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803a1.776 1.776 0 0 1-1.001.283h-2.481c-.668 0-1.128-.362-1.382-1.086l-3.386-10.011-3.815 17.85a1.36 1.36 0 0 1-.525.85c-.286.221-.588.331-.906.331h-5.723Z"/></g>';

  string rootColor = "#6A45EC";
  string rootLogo =
    '<g><path fill="#fff" d="M91.749 446.038H85.15v2.785h2.54v14.483h-3.272v2.785h9.746v-2.785h-2.416v-17.268ZM104.122 446.038h-6.598v2.785h2.54v14.483h-3.271v2.785h9.745v-2.785h-2.416v-17.268ZM113.237 456.162c.138-1.435 1.118-2.2 2.885-2.2 1.767 0 2.651.765 2.651 2.423v.403l-4.859.599c-2.885.362-5.149 1.63-5.149 4.484 0 2.841 2.14 4.47 5.383 4.47 2.72 0 3.921-1.044 4.487-1.935h.276v1.685h3.782v-9.135c0-3.983-2.54-5.78-6.488-5.78-3.975 0-6.404 1.797-6.694 4.568v.418h3.726Zm-.483 5.528c0-1.1.829-1.629 2.03-1.796l3.989-.529v.626c0 2.354-1.546 3.537-3.672 3.537-1.491 0-2.347-.724-2.347-1.838ZM125.765 466.091h3.727v-9.386c0-1.796.938-2.576 2.25-2.576 1.173 0 1.753.682 1.753 1.838v10.124h3.727v-9.386c0-1.796.939-2.576 2.236-2.576 1.187 0 1.753.682 1.753 1.838v10.124h3.741v-10.639c0-2.646-1.657-4.22-4.183-4.22-2.264 0-3.312.989-3.92 2.075h-.276c-.414-.947-1.436-2.075-3.534-2.075-2.056 0-2.954.864-3.45 1.741h-.277v-1.462h-3.547v14.58ZM151.545 456.162c.138-1.435 1.118-2.2 2.885-2.2 1.767 0 2.65.765 2.65 2.423v.403l-4.859.599c-2.885.362-5.149 1.63-5.149 4.484 0 2.841 2.14 4.47 5.384 4.47 2.719 0 3.92-1.044 4.486-1.935h.276v1.685H161v-9.135c0-3.983-2.54-5.78-6.488-5.78-3.975 0-6.404 1.797-6.694 4.568v.418h3.727Zm-.484 5.528c0-1.1.829-1.629 2.03-1.796l3.989-.529v.626c0 2.354-1.546 3.537-3.672 3.537-1.491 0-2.347-.724-2.347-1.838Z"/><g fill="#6A45EC"><path d="M36.736 456.934c.004-.338.137-.661.372-.901.234-.241.552-.38.886-.389h16.748a5.961 5.961 0 0 0 2.305-.458 6.036 6.036 0 0 0 3.263-3.287c.303-.737.46-1.528.46-2.326V428h-4.738v21.573c-.004.337-.137.66-.372.901-.234.24-.552.379-.886.388H38.01a5.984 5.984 0 0 0-4.248 1.781A6.108 6.108 0 0 0 32 456.934v14.891h4.736v-14.891ZM62.868 432.111h-.21l.2.204v4.448h4.36l2.043 2.084a6.008 6.008 0 0 0-3.456 2.109 6.12 6.12 0 0 0-1.358 3.841v27.034h4.717v-27.04c.005-.341.14-.666.38-.907.237-.24.56-.378.897-.383h.726c2.783 0 3.727-1.566 4.006-2.224.28-.658.711-2.453-1.257-4.448l-4.617-4.702h-1.437M50.34 469.477a7.728 7.728 0 0 1 3.013.61c.955.403 1.82.994 2.547 1.738h5.732a12.645 12.645 0 0 0-4.634-5.201 12.467 12.467 0 0 0-6.658-1.93c-2.355 0-4.662.669-6.659 1.93a12.644 12.644 0 0 0-4.634 5.201h5.733a7.799 7.799 0 0 1 2.546-1.738 7.728 7.728 0 0 1 3.014-.61Z"/></g></g>';

  event LlamaInstanceCreated(
    address indexed deployer,
    string indexed name,
    address llamaCore,
    address llamaExecutor,
    address llamaPolicy,
    uint256 chainId
  );

  event PolicyMetadataSet(
    ILlamaPolicyMetadata policyMetadata,
    ILlamaPolicyMetadata indexed policyMetadataLogic,
    bytes initializationData
  );
  event RolePermissionAssigned(
    uint8 indexed role,
    bytes32 indexed permissionId,
    PermissionData permissionData,
    bool hasPermission
  );
}

contract Constructor is LlamaFactoryTest {
  function deployLlamaFactory() internal returns (LlamaFactory) {
    return new LlamaFactory(coreLogic, policyLogic, policyMetadataLogic);
  }

  function test_SetsLlamaCoreLogicAddress() public {
    assertEq(address(factory.LLAMA_CORE_LOGIC()), address(coreLogic));
  }

  function test_SetsLlamaPolicyLogicAddress() public {
    assertEq(address(factory.LLAMA_POLICY_LOGIC()), address(policyLogic));
  }

  function test_SetsLlamaPolicyMetadataAddress() public {
    assertEq(
      address(factory.LLAMA_POLICY_METADATA_LOGIC()),
      address(policyMetadataLogic)
    );
  }
}

contract Deploy is LlamaFactoryTest {
  function deployLlama() internal returns (LlamaCore) {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    return factory.deploy(instanceConfig);
  }

  function testFuzz_DeployCallsArePublic(address caller) public {
    LlamaCore computedLlama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(caller)
    );
    assertEq(address(computedLlama).code.length, 0);

    vm.prank(address(caller));
    deployLlama();
    assertGt(address(computedLlama).code.length, 0);
    assertEq("NewProject", computedLlama.name());
  }

  function test_RevertIf_InstanceDeployedWithSameNameAndCaller(
    string memory name
  ) public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      name,
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    factory.deploy(instanceConfig);

    vm.prank(disapproverDrake);

    factory.deploy(instanceConfig);
  }

  function test_AllowSameNamesFromDifferentDeployers(
    string memory name
  ) public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    vm.prank(disapproverDiane);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      name,
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    factory.deploy(instanceConfig);

    vm.prank(disapproverDrake);

    factory.deploy(instanceConfig);
  }

  function test_RevertIf_StrategyLogicIsZeroAddress() public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      ILlamaStrategy(address(0)),
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    vm.expectRevert();
    factory.deploy(instanceConfig);
  }

  function test_RevertIf_AccountLogicIsZeroAddress() public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      ILlamaAccount(address(0)),
      strategyConfigs,
      accounts,
      policyConfig
    );

    vm.expectRevert();
    factory.deploy(instanceConfig);
  }

  function test_RevertIf_AccountLogicIsEOA() public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleDescription[] memory roleDescriptionStrings = SolarrayLlama
      .roleDescription(
        "AllHolders",
        "ActionCreator",
        "Approver",
        "Disapprover",
        "TestRole1",
        "TestRole2",
        "MadeUpRole"
      );
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      roleDescriptionStrings,
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      ILlamaAccount(approverAdam),
      strategyConfigs,
      accounts,
      policyConfig
    );

    vm.expectRevert();
    factory.deploy(instanceConfig);
  }

  function test_RevertIf_RoleId1IsNotFirst() public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    vm.startPrank(address(rootExecutor));

    // Overwrite role ID at index 1 to ensure it does not have role 1.
    roleHolders[0].role = 2;
    vm.expectRevert(LlamaFactory.InvalidDeployConfiguration.selector);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      new RoleDescription[](0),
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    factory.deploy(instanceConfig);

    // Pass an empty array of role holders.
    vm.expectRevert(LlamaFactory.InvalidDeployConfiguration.selector);

    LlamaPolicyConfig memory policyConfig2 = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig2 = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig2
    );

    factory.deploy(instanceConfig2);
  }

  function test_RevertIf_RoleId1IsFirstWithBadExpiration() public {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    vm.startPrank(address(rootExecutor));

    // Overwrite role ID at index 1 to have expiration just below `type(uint64).max`
    roleHolders[0].expiration = type(uint64).max - 1;
    vm.expectRevert(LlamaFactory.InvalidDeployConfiguration.selector);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      new RoleDescription[](0),
      roleHolders,
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    factory.deploy(instanceConfig);

    // Overwrite role ID at index 1 to have expiration of `block.timestamp`
    roleHolders[0].expiration = toUint64(block.timestamp);
    vm.expectRevert(LlamaFactory.InvalidDeployConfiguration.selector);

    factory.deploy(instanceConfig);

    // Overwrite role ID at index 1 to have expiration of 0
    roleHolders[0].expiration = 0;
    vm.expectRevert(LlamaFactory.InvalidDeployConfiguration.selector);

    factory.deploy(instanceConfig);
  }

  function test_DeploysLlamaCore() public {
    LlamaCore _llama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    assertEq(address(_llama).code.length, 0);
    deployLlama();
    assertGt(address(_llama).code.length, 0);
    assertGt(address(_llama.policy()).code.length, 0);
    LlamaCore(address(_llama)).name(); // Sanity check that this doesn't revert.
    LlamaCore(address(_llama.policy())).name(); // Sanity check that this doesn't revert.
  }

  function test_RevertIf_ReinitializesLlamaCore() public {
    LlamaCore _llama = deployLlama();
    assertEq(_llama.name(), "NewProject");

    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );

    LlamaInstanceConfig memory config = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );
    _llama.initialize(config, policyLogic, policyMetadataLogic);
  }

  function test_DeploysPolicy() public {
    LlamaPolicy _policy = lens.computeLlamaPolicyAddress(
      "NewProject",
      address(this)
    );
    assertEq(address(_policy).code.length, 0);
    deployLlama();
    assertGt(address(_policy).code.length, 0);

    LlamaCore _llama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    assertEq(address(_llama.policy()), address(_policy));
  }

  function test_RevertIf_ReinitializesLlamaPolicy() public {
    deployLlama();
    LlamaPolicy _policy = lens.computeLlamaPolicyAddress(
      "NewProject",
      address(this)
    );
    LlamaExecutor _executor = lens.computeLlamaExecutorAddress(
      "NewProject",
      address(this)
    );

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );
    _policy.initialize(
      "NewProject",
      config,
      policyMetadataLogic,
      address(_executor),
      PermissionData(address(0), bytes4(0), ILlamaStrategy(address(0)))
    );
  }

  function test_SetsNameOnLlamaCore() public {
    LlamaCore _llama = deployLlama();
    assertEq(_llama.name(), "NewProject");
  }

  function test_SetsExecutorOnLlamaCore() public {
    LlamaExecutor computedExecutor = lens.computeLlamaExecutorAddress(
      "NewProject",
      address(this)
    );
    LlamaCore _llama = deployLlama();
    assertEq(address(_llama.executor()), address(computedExecutor));
  }

  function test_SetsPolicyOnLlamaCore() public {
    LlamaPolicy computedPolicy = lens.computeLlamaPolicyAddress(
      "NewProject",
      address(this)
    );
    LlamaCore _llama = deployLlama();
    assertEq(address(_llama.policy()), address(computedPolicy));
  }

  function test_SetsNameOnLlamaPolicy() public {
    LlamaCore _llama = deployLlama();
    LlamaPolicy _policy = _llama.policy();
    assertEq(_policy.name(), "NewProject");
  }

  function test_SetsExecutorOnLlamaPolicy() public {
    LlamaExecutor computedExecutor = lens.computeLlamaExecutorAddress(
      "NewProject",
      address(this)
    );
    LlamaCore _llama = deployLlama();
    LlamaPolicy _policy = _llama.policy();
    assertEq(_policy.llamaExecutor(), address(computedExecutor));
  }

  function test_EmitsLlamaInstanceCreatedEvent() public {
    vm.expectEmit();
    LlamaCore computedLlama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    LlamaPolicy computedPolicy = lens.computeLlamaPolicyAddress(
      "NewProject",
      address(this)
    );
    LlamaExecutor computedExecutor = lens.computeLlamaExecutorAddress(
      address(computedLlama)
    );
    emit LlamaInstanceCreated(
      address(this),
      "NewProject",
      address(computedLlama),
      address(computedExecutor),
      address(computedPolicy),
      block.chainid
    );
    deployLlama();
  }

  function test_ReturnsAddressOfTheNewLlamaCoreContract() public {
    LlamaCore computedLlama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    LlamaCore newLlama = deployLlama();
    assertEq(address(newLlama), address(computedLlama));
  }

  function test_ReturnsAddressOfTheNewLlamaExecutorContract() public {
    LlamaCore computedLlama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    LlamaExecutor computedExecutor = lens.computeLlamaExecutorAddress(
      address(computedLlama)
    );
    LlamaCore newLlama = deployLlama();
    LlamaExecutor newLlamaExecutor = newLlama.executor();
    assertEq(address(newLlamaExecutor), address(computedExecutor));
    assertEq(
      address(computedExecutor),
      LlamaPolicy(computedLlama.policy()).llamaExecutor()
    );
  }

  function test_BootstrapRoleHasSetRolePermissionPermission() public {
    LlamaCore computedLlama = lens.computeLlamaCoreAddress(
      "NewProject",
      address(this)
    );
    LlamaPolicy computedPolicy = lens.computeLlamaPolicyAddress(
      "NewProject",
      address(this)
    );

    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    ILlamaStrategy bootstrapStrategy = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      strategyConfigs[0],
      address(computedLlama)
    );
    PermissionData memory permissionData = PermissionData(
      address(computedPolicy),
      LlamaPolicy.setRolePermission.selector,
      bootstrapStrategy
    );
    bytes32 bootstrapPermissionId = keccak256(abi.encode(permissionData));

    vm.expectEmit();
    emit RolePermissionAssigned(
      BOOTSTRAP_ROLE,
      bootstrapPermissionId,
      permissionData,
      true
    );
    LlamaCore _llama = deployLlama();
    LlamaPolicy _policy = _llama.policy();
    assertEq(
      _policy.canCreateAction(BOOTSTRAP_ROLE, bootstrapPermissionId),
      true
    );
  }
}
