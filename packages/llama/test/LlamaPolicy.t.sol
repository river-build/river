// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, stdError, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {LibString} from "@solady/utils/LibString.sol";

import {Roles, LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";
import {SolarrayLlama} from "@llama/test/utils/SolarrayLlama.sol";

import {ILlamaPolicyMetadata} from "@llama/src/interfaces/ILlamaPolicyMetadata.sol";
import {PolicyholderCheckpoints} from "@llama/src/lib/PolicyholderCheckpoints.sol";
import {LlamaInstanceConfig, LlamaPolicyConfig, PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaPolicyMetadata} from "@llama/src/LlamaPolicyMetadata.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract LlamaPolicyTest is LlamaTestSetup {
  event RoleAssigned(
    address indexed policyholder,
    uint8 indexed role,
    uint64 expiration,
    uint96 quantity
  );
  event RolePermissionAssigned(
    uint8 indexed role,
    bytes32 indexed permissionId,
    PermissionData permissionData,
    bool hasPermission
  );
  event RoleInitialized(uint8 indexed role, RoleDescription description);
  event Transfer(address indexed from, address indexed to, uint256 indexed id);
  event PolicyMetadataSet(
    ILlamaPolicyMetadata policyMetadata,
    ILlamaPolicyMetadata indexed policyMetadataLogic,
    bytes initializationData
  );
  event ExpiredRoleRevoked(
    address indexed caller,
    address indexed policyholder,
    uint8 indexed role
  );

  uint8 constant ALL_HOLDERS_ROLE = 0;
  address arbitraryAddress = makeAddr("arbitraryAddress");
  address arbitraryPolicyholder = makeAddr("arbitraryPolicyholder");
  string color = "#FF0420";
  string logo =
    "<g fill='#FF0420'><path d='M44.876 462c-3.783 0-6.883-.881-9.3-2.645-2.384-1.794-3.576-4.344-3.576-7.65 0-.692.08-1.542.238-2.55.414-2.266 1.002-4.989 1.765-8.169C36.165 432.329 41.744 428 50.742 428c2.448 0 4.641.409 6.58 1.228 1.94.787 3.466 1.983 4.579 3.589 1.112 1.574 1.669 3.463 1.669 5.666 0 .661-.08 1.496-.239 2.503a106.077 106.077 0 0 1-1.716 8.169c-1.113 4.314-3.037 7.54-5.77 9.681-2.735 2.109-6.39 3.164-10.97 3.164Zm.668-6.8c1.78 0 3.29-.52 4.53-1.558 1.272-1.039 2.178-2.629 2.718-4.77.731-2.959 1.288-5.541 1.67-7.744.127-.661.19-1.338.19-2.031 0-2.865-1.51-4.297-4.53-4.297-1.78 0-3.307.519-4.578 1.558-1.24 1.039-2.13 2.629-2.671 4.77-.572 2.109-1.145 4.691-1.717 7.744-.127.63-.19 1.291-.19 1.983 0 2.897 1.526 4.345 4.578 4.345ZM68.409 461.528c-.35 0-.62-.11-.81-.331a1.12 1.12 0 0 1-.144-.85l6.581-30.694c.064-.347.239-.63.525-.85.286-.221.588-.331.906-.331h12.685c3.529 0 6.358.724 8.489 2.172 2.161 1.449 3.242 3.542 3.242 6.281 0 .787-.095 1.605-.286 2.455-.795 3.621-2.4 6.297-4.816 8.028-2.385 1.732-5.66 2.597-9.824 2.597h-6.438l-2.194 10.342a1.35 1.35 0 0 1-.524.85c-.287.221-.588.331-.907.331H68.41Zm16.882-18.039c1.335 0 2.495-.362 3.48-1.086 1.018-.724 1.686-1.763 2.004-3.117a8.185 8.185 0 0 0 .143-1.417c0-.913-.27-1.605-.81-2.077-.541-.504-1.463-.756-2.767-.756H81.62l-1.813 8.453h5.485ZM110.628 461.528c-.349 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l5.293-24.461h-8.488c-.35 0-.62-.11-.811-.33a1.12 1.12 0 0 1-.143-.851l1.097-5.052c.063-.347.238-.63.524-.85.286-.221.588-.331.906-.331h25.657c.35 0 .62.11.811.331.127.189.19.378.19.566a.909.909 0 0 1-.047.284l-1.097 5.052c-.064.347-.239.63-.525.851-.254.22-.556.33-.906.33h-8.441l-5.293 24.461c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-6.295ZM135.88 461.528c-.35 0-.62-.11-.811-.331a1.016 1.016 0 0 1-.191-.85l6.629-30.694a1.35 1.35 0 0 1 .525-.85c.286-.221.588-.331.906-.331h6.438c.349 0 .62.11.81.331.128.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-6.438ZM154.038 461.528c-.349 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.064-.347.238-.63.524-.85.287-.221.605-.331.954-.331h5.151c.763 0 1.255.346 1.478 1.039l5.198 14.875 11.588-14.875c.159-.252.382-.488.668-.708.318-.221.7-.331 1.145-.331h5.198c.349 0 .62.11.81.331.127.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-5.771c-.349 0-.62-.11-.81-.331a1.118 1.118 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803-.286.189-.62.283-1.002.283h-2.479c-.668 0-1.129-.362-1.383-1.086l-3.386-10.011-3.815 17.85c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-5.723ZM196.132 461.528c-.35 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l6.628-30.694a1.35 1.35 0 0 1 .525-.85c.285-.221.588-.331.906-.331h6.438c.35 0 .62.11.811.331.127.189.19.378.19.566a.88.88 0 0 1-.047.284l-6.581 30.694c-.063.346-.238.63-.525.85a1.46 1.46 0 0 1-.907.331h-6.437ZM226.07 462c-2.798 0-5.198-.378-7.201-1.133-1.972-.756-3.466-1.763-4.483-3.022-.986-1.26-1.479-2.661-1.479-4.203 0-.252.033-.63.095-1.134.065-.283.193-.519.383-.708.223-.189.476-.283.763-.283h6.103c.383 0 .668.063.859.188.222.126.445.347.668.662.223.818.731 1.495 1.526 2.03.827.535 1.955.803 3.385.803 1.812 0 3.276-.283 4.388-.85 1.113-.567 1.781-1.338 2.002-2.314a2.42 2.42 0 0 0 .048-.566c0-.788-.491-1.401-1.477-1.842-.986-.473-2.798-1.023-5.437-1.653-3.084-.661-5.421-1.653-7.011-2.975-1.589-1.354-2.383-3.117-2.383-5.289 0-.755.095-1.527.286-2.314.635-2.928 2.21-5.226 4.72-6.894 2.544-1.669 5.818-2.503 9.825-2.503 2.415 0 4.563.425 6.438 1.275 1.875.85 3.321 1.936 4.34 3.258 1.049 1.291 1.572 2.582 1.572 3.873 0 .377-.015.645-.047.802-.063.284-.206.52-.429.709a.975.975 0 0 1-.715.283h-6.391c-.698 0-1.176-.268-1.429-.803-.033-.724-.415-1.338-1.146-1.841-.731-.504-1.685-.756-2.861-.756-1.399 0-2.559.252-3.482.756-.889.503-1.447 1.243-1.668 2.219a3.172 3.172 0 0 0-.049.614c0 .755.445 1.385 1.336 1.889.922.472 2.528.96 4.816 1.464 3.562.692 6.153 1.684 7.774 2.975 1.653 1.29 2.479 3.006 2.479 5.147 0 .724-.095 1.511-.286 2.361-.698 3.211-2.4 5.651-5.103 7.32-2.669 1.636-6.246 2.455-10.729 2.455ZM248.515 461.528c-.35 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.063-.347.238-.63.525-.85.286-.221.604-.331.954-.331h5.149c.763 0 1.256.346 1.479 1.039l5.199 14.875 11.587-14.875c.16-.252.382-.488.668-.708.318-.221.699-.331 1.144-.331h5.199c.35 0 .62.11.811.331.127.189.19.378.19.566a.856.856 0 0 1-.048.284l-6.58 30.694c-.065.346-.24.63-.526.85a1.456 1.456 0 0 1-.906.331h-5.769c-.351 0-.621-.11-.811-.331a1.109 1.109 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803a1.776 1.776 0 0 1-1.001.283h-2.481c-.668 0-1.128-.362-1.382-1.086l-3.386-10.011-3.815 17.85a1.36 1.36 0 0 1-.525.85c-.286.221-.588.331-.906.331h-5.723Z'/></g>";

  function getRoleDescription(
    string memory str
  ) internal pure returns (RoleDescription) {
    return RoleDescription.wrap(bytes32(bytes(str)));
  }

  function deployLlamaWithQuotesInName() internal returns (LlamaCore) {
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
      '"name": "Mock Protocol Llama"',
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    return factory.deploy(instanceConfig);
  }

  function setUp() public virtual override {
    LlamaTestSetup.setUp();

    // The tests in this file have hardcoded timestamps for simplicity, so if this statement is ever
    // untrue we should update those hardcoded timestamps accordingly.
    require(
      block.timestamp < 2_680_220_800,
      "The tests in this file have hardcoded timestamps"
    );
  }
}

// ================================
// ======== Modifier Tests ========
// ================================

contract MockPolicy is LlamaPolicy {
  function exposed_onlyLlama() public onlyLlama {}
  function exposed_nonTransferableToken() public nonTransferableToken {}
}

contract OnlyLlama is LlamaPolicyTest {
  function test_RevertIf_CallerIsNotLlama() public {
    MockPolicy mockPolicy = new MockPolicy();
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);
    mockPolicy.exposed_onlyLlama();
  }
}

contract NonTransferableToken is LlamaPolicyTest {
  function test_RevertIf_CallerIsNotLlama() public {
    MockPolicy mockPolicy = new MockPolicy();
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mockPolicy.exposed_nonTransferableToken();
  }
}

contract Constructor is LlamaPolicyTest {
  function test_RevertIf_InitializeImplementationContract() public {
    string memory name = mpPolicy.name();
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );
    policyLogic.initialize(
      name,
      config,
      policyMetadataLogic,
      address(mpExecutor),
      pausePermission
    );
  }
}

contract Initialize is LlamaPolicyTest {
  uint8 constant INIT_TEST_ROLE = 1;

  function test_RevertIf_NoRolesAssignedAtInitialization() public {
    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));
    string memory name = mpPolicy.name();
    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );
    PermissionData memory permissionData = PermissionData(
      address(localPolicy),
      SET_ROLE_PERMISSION_SELECTOR,
      mpBootstrapStrategy
    );
    vm.expectRevert(LlamaPolicy.InvalidRoleHolderInput.selector);
    localPolicy.initialize(
      name,
      config,
      policyMetadataLogic,
      address(mpExecutor),
      permissionData
    );
  }

  function test_SetsNameAndSymbol() public {
    assertEq(mpPolicy.name(), "Mock Protocol Llama");
    assertEq(mpPolicy.symbol(), "LL-MOCK-PROTOCOL-LLAMA");
  }

  function testFuzz_SetsNumRolesToNumberOfRoleDescriptionsGiven(
    uint256 numRoles
  ) public {
    numRoles = bound(numRoles, 1, 255); // Reverts if zero roles are given.

    RoleDescription[] memory roleDescriptions = new RoleDescription[](numRoles);
    for (uint8 i = 0; i < numRoles; i++) {
      roleDescriptions[i] = RoleDescription.wrap(
        bytes32(bytes(string.concat("Role ", vm.toString(i))))
      );
    }

    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));
    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      roleDescriptions,
      defaultActionCreatorRoleHolder(actionCreatorAaron),
      new RolePermissionData[](0),
      color,
      logo
    );
    localPolicy.initialize(
      mpPolicy.name(),
      config,
      policyMetadataLogic,
      address(mpExecutor),
      PermissionData(
        address(localPolicy),
        SET_ROLE_PERMISSION_SELECTOR,
        mpBootstrapStrategy
      )
    );
    assertEq(localPolicy.numRoles(), numRoles);
  }

  function test_RevertIf_InitializeIsCalledTwice() public {
    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      color,
      logo
    );
    PermissionData memory permissionData = PermissionData(
      address(mpPolicy),
      SET_ROLE_PERMISSION_SELECTOR,
      mpBootstrapStrategy
    );
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpPolicy.initialize(
      "Test",
      config,
      policyMetadataLogic,
      address(mpExecutor),
      permissionData
    );
  }

  function test_SetsRoleDescriptions() public {
    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));

    RoleDescription[] memory roleDescriptions = new RoleDescription[](1);
    roleDescriptions[0] = RoleDescription.wrap("Test Policy");
    RoleHolderData[] memory roleHolders = new RoleHolderData[](1);
    roleHolders[0] = RoleHolderData(
      INIT_TEST_ROLE,
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    RolePermissionData[] memory rolePermissions = new RolePermissionData[](1);
    rolePermissions[0] = RolePermissionData(
      INIT_TEST_ROLE,
      pausePermission,
      true
    );

    vm.expectEmit();
    emit RoleInitialized(ALL_HOLDERS_ROLE, RoleDescription.wrap("All Holders"));
    vm.expectEmit();
    emit RoleInitialized(1, RoleDescription.wrap("Test Policy"));

    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      roleDescriptions,
      roleHolders,
      rolePermissions,
      color,
      logo
    );
    localPolicy.initialize(
      mpPolicy.name(),
      config,
      policyMetadataLogic,
      address(mpExecutor),
      PermissionData(
        address(localPolicy),
        SET_ROLE_PERMISSION_SELECTOR,
        mpBootstrapStrategy
      )
    );
  }

  function test_SetsRoleHolders() public {
    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));

    RoleDescription[] memory roleDescriptions = new RoleDescription[](1);
    roleDescriptions[0] = RoleDescription.wrap("Test Role 1");
    RoleHolderData[] memory roleHolders = new RoleHolderData[](1);
    roleHolders[0] = RoleHolderData(
      INIT_TEST_ROLE,
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    RolePermissionData[] memory rolePermissions = new RolePermissionData[](1);
    rolePermissions[0] = RolePermissionData(
      INIT_TEST_ROLE,
      pausePermission,
      true
    );

    uint256 prevSupply = localPolicy.getRoleSupplyAsQuantitySum(INIT_TEST_ROLE);

    vm.expectEmit();
    emit RoleAssigned(
      address(this),
      INIT_TEST_ROLE,
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );

    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      roleDescriptions,
      roleHolders,
      rolePermissions,
      color,
      logo
    );
    localPolicy.initialize(
      "Test Policy",
      config,
      policyMetadataLogic,
      address(mpExecutor),
      PermissionData(
        address(localPolicy),
        SET_ROLE_PERMISSION_SELECTOR,
        mpBootstrapStrategy
      )
    );

    assertEq(
      localPolicy.getRoleSupplyAsQuantitySum(INIT_TEST_ROLE),
      prevSupply + DEFAULT_ROLE_QTY
    );
    assertEq(localPolicy.numRoles(), 1);
  }

  function test_SetsRolePermissions() public {
    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));
    assertFalse(localPolicy.canCreateAction(INIT_TEST_ROLE, pausePermissionId));

    RoleDescription[] memory roleDescriptions = new RoleDescription[](1);
    roleDescriptions[0] = RoleDescription.wrap("Test Role 1");
    RoleHolderData[] memory roleHolders = new RoleHolderData[](1);
    roleHolders[0] = RoleHolderData(
      INIT_TEST_ROLE,
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    RolePermissionData[] memory rolePermissions = new RolePermissionData[](1);
    rolePermissions[0] = RolePermissionData(
      INIT_TEST_ROLE,
      pausePermission,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      INIT_TEST_ROLE,
      pausePermissionId,
      pausePermission,
      true
    );

    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      roleDescriptions,
      roleHolders,
      rolePermissions,
      color,
      logo
    );
    localPolicy.initialize(
      "Test Policy",
      config,
      policyMetadataLogic,
      address(mpExecutor),
      PermissionData(
        address(localPolicy),
        SET_ROLE_PERMISSION_SELECTOR,
        mpBootstrapStrategy
      )
    );
    assertTrue(localPolicy.canCreateAction(INIT_TEST_ROLE, pausePermissionId));
  }

  function test_SetsAndInitializesPolicyMetadata() public {
    LlamaPolicy localPolicy = LlamaPolicy(Clones.clone(address(mpPolicy)));
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    ILlamaPolicyMetadata llamaPolicyMetadata = lens
      .computeLlamaPolicyMetadataAddress(
        address(llamaPolicyMetadataLogic),
        abi.encode(color, logo),
        address(localPolicy)
      );

    RoleDescription[] memory roleDescriptions = new RoleDescription[](1);
    roleDescriptions[0] = RoleDescription.wrap("Test Policy");
    RoleHolderData[] memory roleHolders = new RoleHolderData[](1);
    roleHolders[0] = RoleHolderData(
      INIT_TEST_ROLE,
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    RolePermissionData[] memory rolePermissions = new RolePermissionData[](1);
    rolePermissions[0] = RolePermissionData(
      INIT_TEST_ROLE,
      pausePermission,
      true
    );

    vm.expectEmit();
    emit PolicyMetadataSet(
      llamaPolicyMetadata,
      llamaPolicyMetadataLogic,
      abi.encode(color, logo)
    );

    LlamaPolicyConfig memory config = LlamaPolicyConfig(
      roleDescriptions,
      roleHolders,
      rolePermissions,
      color,
      logo
    );
    localPolicy.initialize(
      "Test Policy",
      config,
      llamaPolicyMetadataLogic,
      address(mpExecutor),
      PermissionData(
        address(localPolicy),
        SET_ROLE_PERMISSION_SELECTOR,
        mpBootstrapStrategy
      )
    );

    assertEq(
      address(llamaPolicyMetadata),
      address(localPolicy.llamaPolicyMetadata())
    );
    assertEq(color, LlamaPolicyMetadata(address(llamaPolicyMetadata)).color());
    assertEq(logo, LlamaPolicyMetadata(address(llamaPolicyMetadata)).logo());
  }
}

// =======================================
// ======== Permission Management ========
// =======================================

contract InitializeRole is LlamaPolicyTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);

    vm.prank(caller);
    mpPolicy.initializeRole(RoleDescription.wrap("TestRole1"));
  }

  function test_IncrementsNumRoles() public {
    assertEq(mpPolicy.numRoles(), NUM_INIT_ROLES);
    vm.startPrank(address(mpExecutor));

    mpPolicy.initializeRole(RoleDescription.wrap("TestRole1"));
    assertEq(mpPolicy.numRoles(), NUM_INIT_ROLES + 1);

    mpPolicy.initializeRole(RoleDescription.wrap("TestRole2"));
    assertEq(mpPolicy.numRoles(), NUM_INIT_ROLES + 2);
  }

  function test_RevertIf_OverflowOccurs() public {
    vm.startPrank(address(mpExecutor));
    while (mpPolicy.numRoles() < type(uint8).max)
      mpPolicy.initializeRole(getRoleDescription("TestRole"));

    // Now the `numRoles` is at the max value, so the next call should revert.
    vm.expectRevert(stdError.arithmeticError);
    mpPolicy.initializeRole(getRoleDescription("TestRole"));
  }

  function test_EmitsRoleInitializedEvent() public {
    vm.expectEmit();
    emit RoleInitialized(NUM_INIT_ROLES + 1, getRoleDescription("TestRole"));
    vm.prank(address(mpExecutor));

    mpPolicy.initializeRole(getRoleDescription("TestRole"));
  }

  function test_DoesNotGuardAgainstSameDescriptionUsedForMultipleRoles()
    public
  {
    vm.startPrank(address(mpExecutor));
    mpPolicy.initializeRole(getRoleDescription("TestRole"));
    mpPolicy.initializeRole(getRoleDescription("TestRole"));
    mpPolicy.initializeRole(getRoleDescription("TestRole"));
  }
}

contract SetRoleHolder is LlamaPolicyTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);

    vm.prank(caller);
    mpPolicy.setRoleHolder(
      uint8(Roles.AllHolders),
      arbitraryAddress,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
  }

  function test_RevertIf_NonExistentRole(uint8 role) public {
    role = uint8(bound(role, mpPolicy.numRoles() + 1, type(uint8).max));
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(LlamaPolicy.RoleNotInitialized.selector, role)
    );
    mpPolicy.setRoleHolder(
      role,
      arbitraryAddress,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
  }

  function test_RevertIf_InvalidExpiration(
    uint64 expiration,
    uint256 timestamp
  ) public {
    timestamp = bound(timestamp, block.timestamp, type(uint64).max);
    expiration = uint64(bound(expiration, 0, timestamp - 1));
    vm.warp(timestamp);
    vm.expectRevert(LlamaPolicy.InvalidRoleHolderInput.selector);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryAddress,
      DEFAULT_ROLE_QTY,
      expiration
    );
  }

  function test_RevertIf_InvalidQuantity() public {
    vm.startPrank(address(mpExecutor));

    vm.expectRevert(LlamaPolicy.InvalidRoleHolderInput.selector);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryAddress,
      0,
      DEFAULT_ROLE_EXPIRATION
    );
  }

  function test_RevertIf_AllHoldersRole() public {
    vm.startPrank(address(mpExecutor));

    vm.expectRevert(LlamaPolicy.AllHoldersRole.selector);
    mpPolicy.setRoleHolder(
      uint8(Roles.AllHolders),
      arbitraryAddress,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
  }

  function test_NoOpIfNoChangesAreMade_WhenUserAlreadyHasSameRoleData() public {
    address policyholder = arbitraryPolicyholder;
    vm.startPrank(address(mpExecutor));

    uint256 initRoleHolders = 7;
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders,
      "0"
    );

    // Assign role to policyholder with quantity of 1.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "10"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY,
      "20"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "30"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "40"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      1,
      "50"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "60"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "70"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "80"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "90"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "100"
    );

    // Reassign role to policyholder with quantity of 1, i.e. no changes. All code and assertions
    // should be identical to the above set.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "110"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY,
      "120"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "130"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "140"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      1,
      "150"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "160"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "170"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "180"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "190"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "1100"
    );
  }

  function test_NoOpIfNoChangesAreMade_WhenUserDoesNotHavePolicy() public {
    address policyholder = arbitraryPolicyholder;
    vm.startPrank(address(mpExecutor));

    uint256 initRoleHolders = 7;
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders,
      "0"
    );

    // Policyholder has no policy. We assign nothing, and things should not change except for them
    // now holding a policy and having `ALL_HOLDERS_ROLE` set.
    assertEq(mpPolicy.balanceOf(policyholder), 0, "1");
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.AllHolders),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(uint8(Roles.TestRole1), policyholder, 0, 0);

    assertEq(mpPolicy.balanceOf(policyholder), 1, "2");
    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      false,
      "10"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      0,
      "20"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      0,
      "30"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      0,
      "40"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      0,
      "50"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "60"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "70"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "80"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "90"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "100"
    );

    // Now we assign them a role and then immediately revoke it, so their balance is still 1 but they
    // hold no roles. Nothing should change.
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    assertEq(mpPolicy.balanceOf(policyholder), 1, "101");
    mpPolicy.setRoleHolder(uint8(Roles.TestRole1), policyholder, 0, 0);

    assertEq(mpPolicy.balanceOf(policyholder), 1, "102");
    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      false,
      "110"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      0,
      "120"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      0,
      "130"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      0,
      "140"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      0,
      "150"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "160"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "170"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "180"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "190"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "200"
    );

    // We again call `setRoleHolder` and nothing should change.
    mpPolicy.setRoleHolder(uint8(Roles.TestRole1), policyholder, 0, 0);

    assertEq(mpPolicy.balanceOf(policyholder), 1, "202");
    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      false,
      "210"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      0,
      "220"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      0,
      "230"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      0,
      "240"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      0,
      "250"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "260"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "270"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "280"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "290"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "300"
    );
  }

  function test_NoOpIfNoChangesAreMade_WhenRoleExpirationToBeUpdated() public {
    address policyholder = arbitraryPolicyholder;
    vm.startPrank(address(mpExecutor));

    uint256 initRoleHolders = 7;
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders,
      "0"
    );

    // Assign role to policyholder with quantity of 1.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "10"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY,
      "20"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "30"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "40"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      1,
      "50"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "60"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "70"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "80"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "90"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "100"
    );

    // Reassign role to policyholder with quantity of 1 and (expiration - 1). i.e only expiration changes.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION - 1,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION - 1
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "110"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY,
      "120"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION - 1,
      "130"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "140"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      1,
      "150"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "160"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "170"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "180"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "190"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "1100"
    );
  }

  function test_SetsRoleHolder(address policyholder) public {
    vm.assume(
      policyholder != address(0) && policyholder != arbitraryPolicyholder
    );
    if (mpPolicy.balanceOf(policyholder) > 0)
      policyholder = makeAddr("policyholderWithoutPolicy");
    vm.startPrank(address(mpExecutor));

    uint256 initRoleHolders = 7;
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders,
      "0"
    );

    assertEq(mpPolicy.balanceOf(policyholder), 0);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)), false);
    assertEq(mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)), 0);
    assertEq(mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)), 0);
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      0
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 0);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)), false);
    assertEq(mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)), 0);
    assertEq(mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)), 0);
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders
    );

    // Policyholder has no policy currently. Assign role to policyholder with quantity of 1. As part of policy minting,
    // ALL_HOLDERS_ROLE is set.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.AllHolders),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      DEFAULT_ROLE_QTY
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "10"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY,
      "20"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "30"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "40"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      1,
      "50"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "60"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "70"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "80"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "90"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "100"
    );

    // Adjust policyholder's policy to have quantity greater than 1.
    vm.expectEmit();
    emit RoleAssigned(
      policyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION - 10,
      5
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      5,
      DEFAULT_ROLE_EXPIRATION - 10
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      true,
      "110"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      5,
      "120"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION - 10,
      "130"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "140"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      5,
      "150"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "160"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "170"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "180"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "190"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 1,
      "200"
    );

    // Add another policyholder with a quantity of 3.
    vm.expectEmit();
    emit RoleAssigned(
      arbitraryPolicyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      3
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      3,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      true,
      "210"
    );
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      3,
      "220"
    );
    assertEq(
      mpPolicy.roleExpiration(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "230"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      2,
      "240"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      8,
      "250"
    );

    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      true,
      "260"
    );
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      1,
      "270"
    );
    assertEq(
      mpPolicy.roleExpiration(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "280"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "290"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "300"
    );

    // Decrease the new policyholder's quantity to 2.
    vm.expectEmit();
    emit RoleAssigned(
      arbitraryPolicyholder,
      uint8(Roles.TestRole1),
      DEFAULT_ROLE_EXPIRATION,
      2
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      2,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      true,
      "301"
    );
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      2,
      "302"
    );
    assertEq(
      mpPolicy.roleExpiration(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION,
      "303"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      2,
      "304"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      7,
      "305"
    );

    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      true,
      "306"
    );
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      1,
      "307"
    );
    assertEq(
      mpPolicy.roleExpiration(arbitraryPolicyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "308"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "309"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "310"
    );

    // Revoke the original policyholder's role. We did not revoke their policy so they still have the all holders role.
    vm.expectEmit();
    emit RoleAssigned(policyholder, uint8(Roles.TestRole1), 0, 0);
    mpPolicy.setRoleHolder(uint8(Roles.TestRole1), policyholder, 0, 0);

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)),
      false,
      "311"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      0,
      "320"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      0,
      "330"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1,
      "340"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)),
      2,
      "350"
    );

    assertEq(
      mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)),
      true,
      "360"
    );
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      1,
      "370"
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION,
      "380"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "390"
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      initRoleHolders + 2,
      "400"
    );
  }
}

contract SetRolePermission is LlamaPolicyTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);

    vm.prank(caller);
    mpPolicy.setRolePermission(uint8(Roles.TestRole1), pausePermission, true);
  }

  function test_SetsRolePermission(
    PermissionData memory permissionData,
    bool hasPermission
  ) public {
    bytes32 permissionId = lens.computePermissionId(permissionData);
    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.TestRole1),
      permissionId,
      permissionData,
      hasPermission
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.TestRole1),
      permissionData,
      hasPermission
    );

    assertEq(
      mpPolicy.canCreateAction(uint8(Roles.TestRole1), permissionId),
      hasPermission
    );
  }

  function test_RevertIf_RoleNotInitialized(uint8 role) public {
    role = uint8(bound(role, mpPolicy.numRoles() + 1, type(uint8).max));
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(LlamaPolicy.RoleNotInitialized.selector, role)
    );
    mpPolicy.setRolePermission(role, pausePermission, true);
  }

  function test_CanReadPermissionDataFromEvent() external {
    PermissionData memory permissionData;
    vm.recordLogs();
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(uint8(Roles.TestRole1), pausePermission, true);
    Vm.Log[] memory emittedEvents = vm.getRecordedLogs();

    bytes32 rolePermissionAssignedSig = keccak256(
      "RolePermissionAssigned(uint8,bytes32,(address,bytes4,address),bool)"
    );

    Vm.Log memory _event;
    for (uint256 i = 0; i < emittedEvents.length; i++) {
      _event = emittedEvents[i];
      bytes32 eventSig = _event.topics[0];
      if (eventSig == rolePermissionAssignedSig) {
        // event RolePermissionAssigned(
        //   uint8 indexed role,
        //   bytes32 indexed permissionId,
        //   PermissionData permissionData,       <--- What we want.
        //   bool hasPermission
        // )
        (permissionData, ) = abi.decode(_event.data, (PermissionData, bool));
      }
    }
    assertEq(pausePermission.target, permissionData.target);
    assertEq(pausePermission.selector, permissionData.selector);
    assertEq(
      address(pausePermission.strategy),
      address(permissionData.strategy)
    );
  }
}

contract RevokeExpiredRole is LlamaPolicyTest {
  function test_RevokesExpiredRole(
    address policyholder,
    uint64 expiration
  ) public {
    vm.assume(policyholder != address(0));
    expiration = uint64(
      bound(expiration, block.timestamp + 1, type(uint64).max - 1)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      expiration
    );

    vm.warp(expiration + 1);

    vm.expectEmit();
    emit RoleAssigned(policyholder, uint8(Roles.TestRole1), 0, 0);
    vm.expectEmit();
    emit ExpiredRoleRevoked(
      address(this),
      policyholder,
      uint8(Roles.TestRole1)
    );

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)), true);

    mpPolicy.revokeExpiredRole(uint8(Roles.TestRole1), policyholder);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)), false);
  }

  function test_RevertIf_NotExpiredYet(
    address policyholder,
    uint64 expiration
  ) public {
    vm.assume(policyholder != address(0));
    expiration = uint64(
      bound(expiration, block.timestamp + 1, type(uint64).max)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      expiration
    );

    vm.expectRevert(LlamaPolicy.InvalidRoleHolderInput.selector);
    mpPolicy.revokeExpiredRole(uint8(Roles.TestRole1), policyholder);
  }
}

contract RevokePolicy is LlamaPolicyTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);

    vm.prank(caller);
    mpPolicy.revokePolicy(makeAddr("policyholder"));
  }

  function test_RevokesPolicy(address policyholder) public {
    vm.assume(policyholder != address(0));
    vm.assume(mpPolicy.balanceOf(policyholder) == 0);

    vm.startPrank(address(mpExecutor));

    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    uint256 allHoldersRoleHolders = mpPolicy.totalSupply();

    assertEq(mpPolicy.balanceOf(policyholder), 1);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)), true);
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_QTY
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)),
      DEFAULT_ROLE_EXPIRATION
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      1
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 1);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)), true);
    assertEq(
      mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_QTY
    );
    assertEq(
      mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)),
      DEFAULT_ROLE_EXPIRATION
    );
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      allHoldersRoleHolders
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      allHoldersRoleHolders
    );

    vm.expectEmit();
    emit Transfer(policyholder, address(0), uint256(uint160(policyholder)));
    vm.expectEmit();
    emit RoleAssigned(policyholder, uint8(Roles.AllHolders), 0, 0);
    mpPolicy.revokePolicy(policyholder);

    assertEq(mpPolicy.balanceOf(policyholder), 0);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.TestRole1)), false);
    assertEq(mpPolicy.getQuantity(policyholder, uint8(Roles.TestRole1)), 0);
    assertEq(mpPolicy.roleExpiration(policyholder, uint8(Roles.TestRole1)), 0);
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1)),
      0
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 0);

    assertEq(mpPolicy.hasRole(policyholder, uint8(Roles.AllHolders)), false);
    assertEq(mpPolicy.getQuantity(policyholder, uint8(Roles.AllHolders)), 0);
    assertEq(mpPolicy.roleExpiration(policyholder, uint8(Roles.AllHolders)), 0);
    assertEq(
      mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.AllHolders)),
      allHoldersRoleHolders - 1
    );
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.AllHolders)),
      allHoldersRoleHolders - 1
    );
  }

  function test_RevertIf_PolicyDoesNotExist(address policyholder) public {
    vm.assume(policyholder != address(0));
    vm.assume(mpPolicy.balanceOf(policyholder) == 0);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaPolicy.AddressDoesNotHoldPolicy.selector,
        policyholder
      )
    );
    vm.prank(address(mpExecutor));
    mpPolicy.revokePolicy(policyholder);
  }
}

// =================================
// ======== ERC-721 Methods ========
// =================================

contract TransferFrom is LlamaPolicyTest {
  function test_RevertIf_Called() public {
    uint256 tokenId = 0; // Token ID does not actually matter, since that input is never used.
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mpPolicy.transferFrom(address(this), arbitraryAddress, tokenId);
  }
}

contract SafeTransferFrom is LlamaPolicyTest {
  function test_RevertIf_Called() public {
    uint256 tokenId = 0; // Token ID does not actually matter, since that input is never used.
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mpPolicy.safeTransferFrom(address(this), arbitraryAddress, tokenId);
  }
}

contract SafeTransferFromBytesOverload is LlamaPolicyTest {
  function test_RevertIf_Called() public {
    uint256 tokenId = 0; // Token ID does not actually matter, since that input is never used.
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mpPolicy.safeTransferFrom(address(this), arbitraryAddress, tokenId, "");
  }
}

contract Approve is LlamaPolicyTest {
  function test_RevertIf_Called() public {
    uint256 tokenId = 0; // Token ID does not actually matter, since that input is never used.
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mpPolicy.approve(arbitraryAddress, tokenId);
  }
}

contract SetApprovalForAll is LlamaPolicyTest {
  function test_RevertIf_Called() public {
    vm.expectRevert(LlamaPolicy.NonTransferableToken.selector);
    mpPolicy.setApprovalForAll(arbitraryAddress, true);
  }
}

// ====================================
// ======== Permission Getters ========
// ====================================
// The actual checkpointing logic is tested in `PolicyholderCheckpoints.t.sol` and `SupplyCheckpoints.t.sol`,
// so here we just test the logic that's added on top of that.

contract GetQuantity is LlamaPolicyTest {
  function test_ReturnsZeroIfPolicyholderDoesNotHoldRole() public {
    assertEq(
      mpPolicy.getQuantity(arbitraryAddress, uint8(Roles.MadeUpRole)),
      0
    );
  }

  function test_ReturnsOneIfRoleHasExpiredButWasNotRevoked() public {
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      100
    );

    vm.warp(100);
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      1
    );

    vm.warp(101);
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      1
    );
  }

  function test_ReturnsOneIfRoleHasNotExpired() public {
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      100
    );

    vm.warp(99);
    assertEq(
      mpPolicy.getQuantity(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      1
    );
  }
}

contract GetPastQuantity is LlamaPolicyTest {
  function setUp() public override {
    LlamaPolicyTest.setUp();
    vm.startPrank(address(mpExecutor));

    vm.warp(100);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      105
    );

    vm.warp(110);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      200
    );

    vm.warp(120);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      EMPTY_ROLE_QTY,
      0
    );

    vm.warp(130);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      200
    );

    vm.warp(140);
    mpPolicy.revokePolicy(arbitraryPolicyholder);

    vm.warp(150);
    vm.stopPrank();
  }

  function test_ReturnsZeroIfPolicyholderDidNotHaveRoleAndOneIfPolicyholderDidHaveRoleAtTimestamp()
    public
  {
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        99
      ),
      0,
      "99"
    );
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        100
      ),
      1,
      "100"
    ); // Role set.
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        101
      ),
      1,
      "101"
    );

    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        104
      ),
      1,
      "104"
    );
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        105
      ),
      1,
      "105"
    ); // Role expires,
    // but not
    // revoked.
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        106
      ),
      1,
      "106"
    );

    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        109
      ),
      1,
      "109"
    );
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        110
      ),
      1,
      "110"
    ); // Role set.
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        111
      ),
      1,
      "111"
    );

    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        119
      ),
      1,
      "119"
    );
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        120
      ),
      0,
      "120"
    ); // Role revoked.
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        121
      ),
      0,
      "121"
    );

    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        129
      ),
      0,
      "129"
    );
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        130
      ),
      1,
      "130"
    ); // Role set.
    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        131
      ),
      1,
      "131"
    ); // Role set.

    assertEq(
      mpPolicy.getPastQuantity(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        140
      ),
      0,
      "140"
    ); // Role revoked
  }
}

contract GetSupply is LlamaPolicyTest {
  function setUp() public override {
    LlamaPolicyTest.setUp();
    vm.startPrank(address(mpExecutor));
  }

  function test_IncrementsWhenRolesAreAddedAndDecrementsWhenRolesAreRemoved()
    public
  {
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 0);
    uint256 initPolicySupply = mpPolicy.getRoleSupplyAsQuantitySum(
      ALL_HOLDERS_ROLE
    );

    // Assigning a role increases supply.
    vm.warp(100);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      150
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 1);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 1
    );

    // Updating the role does not change supply.
    vm.warp(110);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      160
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 1);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 1
    );

    // Assigning the role to a new person increases supply.
    vm.warp(120);
    address newRoleHolder = makeAddr("newRoleHolder");
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      newRoleHolder,
      DEFAULT_ROLE_QTY,
      200
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 2);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 2
    );

    // Assigning new role to the same person does not change supply.
    vm.warp(130);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      newRoleHolder,
      DEFAULT_ROLE_QTY,
      300
    );
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 2);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 2
    );

    // Revoking all roles from the policyholder should only decrease supply by 1.
    vm.warp(140);
    mpPolicy.revokePolicy(newRoleHolder);
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 1);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 1
    );

    // Revoking expired roles changes supply of the revoked role, but they still hold a policy, so
    // it doesn't change the total supply.
    vm.warp(200);
    mpPolicy.revokeExpiredRole(uint8(Roles.TestRole1), arbitraryPolicyholder);
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(uint8(Roles.TestRole1)), 0);
    assertEq(
      mpPolicy.getRoleSupplyAsQuantitySum(ALL_HOLDERS_ROLE),
      initPolicySupply + 1
    );
  }
}

// Helper contract to setup state that's shared between some of the checkpointing tests.
contract RoleBalanceCheckpointTest is LlamaPolicyTest {
  address newRoleHolder = makeAddr("newRoleHolder");

  function setUp() public override {
    LlamaPolicyTest.setUp();

    vm.startPrank(address(mpExecutor));
    vm.warp(100);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      150
    );

    vm.warp(110);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      159
    );

    vm.warp(120);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      newRoleHolder,
      DEFAULT_ROLE_QTY,
      200
    );

    vm.warp(130);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      newRoleHolder,
      DEFAULT_ROLE_QTY,
      300
    );

    vm.warp(140);
    mpPolicy.revokePolicy(newRoleHolder);

    vm.warp(160);
    mpPolicy.revokeExpiredRole(uint8(Roles.TestRole1), arbitraryPolicyholder);

    vm.warp(161);
    vm.stopPrank();
  }
}

contract RoleBalanceCheckpoints is RoleBalanceCheckpointTest {
  function test_ReturnsBalanceCheckpoint() public {
    PolicyholderCheckpoints.History memory rbCheckpoint1 = mpPolicy
      .roleBalanceCheckpoints(arbitraryPolicyholder, uint8(Roles.TestRole1));
    PolicyholderCheckpoints.History memory rbCheckpoint2 = mpPolicy
      .roleBalanceCheckpoints(newRoleHolder, uint8(Roles.TestRole2));

    assertEq(rbCheckpoint1._checkpoints.length, 3);
    assertEq(rbCheckpoint1._checkpoints[0].timestamp, 100);
    assertEq(rbCheckpoint1._checkpoints[0].expiration, 150);
    assertEq(rbCheckpoint1._checkpoints[0].quantity, 1);
    assertEq(rbCheckpoint1._checkpoints[1].timestamp, 110);
    assertEq(rbCheckpoint1._checkpoints[1].expiration, 159);
    assertEq(rbCheckpoint1._checkpoints[1].quantity, 1);
    assertEq(rbCheckpoint1._checkpoints[2].timestamp, 160);
    assertEq(rbCheckpoint1._checkpoints[2].expiration, 0);
    assertEq(rbCheckpoint1._checkpoints[2].quantity, 0);

    assertEq(rbCheckpoint2._checkpoints.length, 3);
    assertEq(rbCheckpoint2._checkpoints[0].timestamp, 120);
    assertEq(rbCheckpoint2._checkpoints[0].expiration, 200);
    assertEq(rbCheckpoint2._checkpoints[0].quantity, 1);
    assertEq(rbCheckpoint2._checkpoints[1].timestamp, 130);
    assertEq(rbCheckpoint2._checkpoints[1].expiration, 300);
    assertEq(rbCheckpoint2._checkpoints[1].quantity, 1);
    assertEq(rbCheckpoint2._checkpoints[2].timestamp, 140);
    assertEq(rbCheckpoint2._checkpoints[2].expiration, 0);
    assertEq(rbCheckpoint2._checkpoints[2].quantity, 0);
  }
}

contract RoleBalanceCheckpointsOverload is RoleBalanceCheckpointTest {
  function assertEqSlice(
    PolicyholderCheckpoints.History memory full,
    uint256 start,
    uint256 end
  ) internal {
    PolicyholderCheckpoints.History memory slice = mpPolicy
      .roleBalanceCheckpoints(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        start,
        end
      );

    assertEq(slice._checkpoints.length, end - start);

    for (uint256 i = start; i < end; i++) {
      assertEq(
        slice._checkpoints[i - start].timestamp,
        full._checkpoints[i].timestamp
      );
      assertEq(
        slice._checkpoints[i - start].expiration,
        full._checkpoints[i].expiration
      );
      assertEq(
        slice._checkpoints[i - start].quantity,
        full._checkpoints[i].quantity
      );
    }
  }

  function test_RevertIf_StartIsGreaterThanEnd() public {
    vm.expectRevert(LlamaPolicy.InvalidIndices.selector);
    mpPolicy.roleBalanceCheckpoints(
      arbitraryPolicyholder,
      uint8(Roles.TestRole1),
      2,
      1
    );
  }

  function test_RevertIf_EndIsGreaterThanArrayLength() public {
    uint256 length = mpPolicy
      .roleBalanceCheckpoints(arbitraryPolicyholder, uint8(Roles.TestRole1))
      ._checkpoints
      .length;
    uint256 end = length + 1;
    vm.expectRevert(LlamaPolicy.InvalidIndices.selector);
    mpPolicy.roleBalanceCheckpoints(
      arbitraryPolicyholder,
      uint8(Roles.TestRole1),
      2,
      end
    );
  }

  function test_ReturnsSlicesOfCheckpointsArray() public {
    PolicyholderCheckpoints.History memory rbCheckpoint1 = mpPolicy
      .roleBalanceCheckpoints(arbitraryPolicyholder, uint8(Roles.TestRole1));

    assertEq(rbCheckpoint1._checkpoints.length, 3);

    assertEqSlice(rbCheckpoint1, 0, 0);
    assertEqSlice(rbCheckpoint1, 0, 1);
    assertEqSlice(rbCheckpoint1, 0, 2);
    assertEqSlice(rbCheckpoint1, 0, 3);

    assertEqSlice(rbCheckpoint1, 1, 1);
    assertEqSlice(rbCheckpoint1, 1, 2);
    assertEqSlice(rbCheckpoint1, 1, 3);

    assertEqSlice(rbCheckpoint1, 2, 2);
    assertEqSlice(rbCheckpoint1, 2, 3);

    assertEqSlice(rbCheckpoint1, 3, 3);
  }
}

contract RoleBalanceCheckpointsLength is RoleBalanceCheckpointTest {
  function test_ReturnsTheCorrectLength() public {
    PolicyholderCheckpoints.History memory checkpoints = mpPolicy
      .roleBalanceCheckpoints(arbitraryPolicyholder, uint8(Roles.TestRole1));
    uint256 length = mpPolicy.roleBalanceCheckpointsLength(
      arbitraryPolicyholder,
      uint8(Roles.TestRole1)
    );
    assertEq(length, checkpoints._checkpoints.length);
    assertEq(length, 3);
  }
}

contract HasRole is LlamaPolicyTest {
  function test_ReturnsTrueIfHolderHasRole() public {
    vm.warp(100);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      true
    );
  }

  function test_ReturnsFalseIfHolderDoesNotHaveRole() public {
    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      false
    );
  }
}

contract HasRoleUint256Overload is LlamaPolicyTest {
  function test_ReturnsTrueIfHolderHasRole() public {
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.warp(100);

    assertEq(
      mpPolicy.hasRole(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        block.timestamp - 1
      ),
      true
    );
    assertEq(
      mpPolicy.hasRole(arbitraryPolicyholder, uint8(Roles.TestRole1), 0),
      false
    );
  }

  function test_ReturnsFalseIfHolderDoesNotHaveRole() public {
    vm.warp(100);
    assertEq(
      mpPolicy.hasRole(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        block.timestamp - 1
      ),
      false
    );
  }
}

contract HasPermissionId is LlamaPolicyTest {
  function testFuzz_ReturnsTrueIfHolderHasPermission(
    PermissionData memory permissionData
  ) public {
    bytes32 permissionId = lens.computePermissionId(permissionData);

    vm.startPrank(address(mpExecutor));
    vm.warp(100);
    mpPolicy.setRolePermission(uint8(Roles.TestRole1), permissionData, true);
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    assertEq(
      mpPolicy.hasPermissionId(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        permissionId
      ),
      true
    );
  }

  function test_ReturnsFalseIfHolderDoesNotHaveQuanitity() public {
    assertEq(
      mpPolicy.hasPermissionId(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        pausePermissionId
      ),
      false
    );
  }

  function testFuzz_ReturnsFalseIfHolderDoesNotHavePermission(
    bytes32 permissionId
  ) public {
    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    assertEq(
      mpPolicy.hasPermissionId(
        arbitraryPolicyholder,
        uint8(Roles.TestRole1),
        permissionId
      ),
      false
    );
  }
}

contract TotalSupply is LlamaPolicyTest {
  function testFuzz_getsTotalSupply(uint256 numberOfPolicies) public {
    uint256 initPolicySupply = mpPolicy.getRoleSupplyAsQuantitySum(
      ALL_HOLDERS_ROLE
    );
    numberOfPolicies = bound(numberOfPolicies, 1, 1_000);
    for (uint256 i = 0; i < numberOfPolicies; i++) {
      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(
        uint8(Roles.TestRole1),
        address(uint160(i + 100)),
        DEFAULT_ROLE_QTY,
        DEFAULT_ROLE_EXPIRATION
      );
    }

    assertEq(mpPolicy.totalSupply(), initPolicySupply + numberOfPolicies);
  }
}

// =================================
// ======== ERC-721 Getters ========
// =================================

contract PolicyMetadata is LlamaPolicyTest {
  // The token's JSON metadata.
  // The `image` field is the *decoded* SVG image, but in the contract it's base64-encoded.
  struct Metadata {
    string name;
    string description;
    string image; // Decoded SVG.
    string external_url;
  }

  function parseMetadata(string memory uri) internal returns (Metadata memory) {
    string[] memory inputs = new string[](3);
    inputs[0] = "node";
    inputs[1] = "packages/llama/test/lib/metadata.js";
    inputs[2] = uri;
    return abi.decode(vm.ffi(inputs), (Metadata));
  }

  function generateTokenUri(
    address policyholderAddress
  ) internal view returns (string memory) {
    string memory policyholder = LibString.toHexString(policyholderAddress);
    string[21] memory parts;

    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="500" fill="none"><g clip-path="url(#a)"><rect width="390" height="500" fill="#0B101A" rx="13.393" /><mask id="b" width="364" height="305" x="4" y="30" maskUnits="userSpaceOnUse" style="mask-type:alpha"><ellipse cx="186.475" cy="182.744" fill="#8000FF" rx="196.994" ry="131.329" transform="rotate(-31.49 186.475 182.744)" /></mask><g mask="url(#b)"><g filter="url(#c)"><ellipse cx="226.274" cy="247.516" fill="url(#d)" rx="140.048" ry="59.062" transform="rotate(-31.49 226.274 247.516)" /></g><g filter="url(#e)"><ellipse cx="231.368" cy="254.717" fill="url(#f)" rx="102.858" ry="43.378" transform="rotate(-31.49 231.368 254.717)" /></g></g><g filter="url(#g)"><ellipse cx="237.625" cy="248.969" fill="url(#h)" rx="140.048" ry="59.062" transform="rotate(-31.49 237.625 248.969)" /></g><circle cx="109.839" cy="147.893" r="22" fill="url(#i)" /><rect width="150" height="35.071" x="32" y="376.875" fill="';

    parts[1] = color;

    parts[
      2
    ] = '" rx="17.536" /><text xml:space="preserve" fill="#0B101A" font-family="ui-monospace,Cascadia Mono,Menlo,Monaco,Segoe UI Mono,Roboto Mono,Oxygen Mono,Ubuntu Monospace,Source Code Pro,Droid Sans Mono,Fira Mono,Courier,monospace" font-size="16"><tspan x="45.393" y="399.851">';

    parts[3] = string.concat(
      LibString.slice(policyholder, 0, 6),
      "...",
      LibString.slice(policyholder, 38, 42)
    );

    parts[
      4
    ] = '</tspan></text><path fill="#fff" d="M341 127.067a11.433 11.433 0 0 0 8.066-8.067 11.436 11.436 0 0 0 8.067 8.067 11.433 11.433 0 0 0-8.067 8.066 11.43 11.43 0 0 0-8.066-8.066Z" /><path stroke="#fff" stroke-width="1.5" d="M349.036 248.018V140.875" /><circle cx="349.036" cy="259.178" r="4.018" fill="#fff" /><path stroke="#fff" stroke-width="1.5" d="M349.036 292.214v-21.429" /><path fill="#fff" d="M343.364 33.506a1.364 1.364 0 0 0-2.728 0V43.85l-7.314-7.314a1.364 1.364 0 0 0-1.929 1.928l7.315 7.315h-10.344a1.364 1.364 0 0 0 0 2.727h10.344l-7.315 7.315a1.365 1.365 0 0 0 1.929 1.928l7.314-7.314v10.344a1.364 1.364 0 0 0 2.728 0V50.435l7.314 7.314a1.364 1.364 0 0 0 1.929-1.928l-7.315-7.315h10.344a1.364 1.364 0 1 0 0-2.727h-10.344l7.315-7.315a1.365 1.365 0 0 0-1.929-1.928l-7.314 7.314V33.506ZM73.81 44.512h-4.616v1.932h1.777v10.045h-2.29v1.932h6.82V56.49h-1.69V44.512ZM82.469 44.512h-4.617v1.932h1.777v10.045h-2.29v1.932h6.82V56.49h-1.69V44.512ZM88.847 51.534c.097-.995.783-1.526 2.02-1.526 1.236 0 1.854.531 1.854 1.68v.28l-3.4.416c-2.02.251-3.603 1.13-3.603 3.11 0 1.971 1.497 3.101 3.767 3.101 1.903 0 2.743-.724 3.14-1.343h.192v1.17h2.647v-6.337c0-2.763-1.777-4.009-4.54-4.009-2.782 0-4.482 1.246-4.685 3.168v.29h2.608Zm-.338 3.835c0-.763.58-1.13 1.42-1.246l2.792-.367v.435c0 1.632-1.082 2.453-2.57 2.453-1.043 0-1.642-.502-1.642-1.275ZM97.614 58.42h2.608v-6.51c0-1.246.657-1.787 1.575-1.787.821 0 1.226.474 1.226 1.275v7.023h2.609v-6.51c0-1.247.656-1.788 1.564-1.788.831 0 1.227.474 1.227 1.275v7.023h2.618v-7.38c0-1.835-1.159-2.927-2.927-2.927-1.584 0-2.318.686-2.743 1.44h-.194c-.289-.657-1.004-1.44-2.472-1.44-1.44 0-2.067.6-2.415 1.208h-.193v-1.015h-2.483v10.114ZM115.654 51.534c.097-.995.782-1.526 2.019-1.526 1.236 0 1.854.531 1.854 1.68v.28l-3.4.416c-2.019.251-3.603 1.13-3.603 3.11 0 1.971 1.498 3.101 3.767 3.101 1.903 0 2.744-.724 3.14-1.343h.193v1.17h2.647v-6.337c0-2.763-1.778-4.009-4.54-4.009-2.782 0-4.482 1.246-4.685 3.168v.29h2.608Zm-.338 3.835c0-.763.58-1.13 1.42-1.246l2.791-.367v.435c0 1.632-1.081 2.453-2.569 2.453-1.043 0-1.642-.502-1.642-1.275ZM35.314 52.07a.906.906 0 0 1 .88-.895h11.72a4.205 4.205 0 0 0 3.896-2.597 4.22 4.22 0 0 0 .323-1.614V32h-3.316v14.964a.907.907 0 0 1-.88.894H36.205a4.206 4.206 0 0 0-2.972 1.235A4.219 4.219 0 0 0 32 52.07v10.329h3.314v-10.33ZM53.6 34.852h-.147l.141.14v3.086h3.05l1.43 1.446a4.21 4.21 0 0 0-2.418 1.463 4.222 4.222 0 0 0-.95 2.664v18.752h3.3V43.647a.909.909 0 0 1 .894-.895h.508c1.947 0 2.608-1.086 2.803-1.543.196-.456.498-1.7-.88-3.085l-3.23-3.261h-1.006" /><path fill="#fff" d="M44.834 60.77a5.448 5.448 0 0 1 3.89 1.629h4.012a8.8 8.8 0 0 0-3.243-3.608 8.781 8.781 0 0 0-12.562 3.608h4.012a5.459 5.459 0 0 1 3.89-1.629Z" />';

    parts[5] = logo;

    parts[
      6
    ] = '</g><defs><radialGradient id="d" cx="0" cy="0" r="1" gradientTransform="rotate(-90.831 270.037 36.188) scale(115.966 274.979)" gradientUnits="userSpaceOnUse"><stop stop-color="';

    parts[7] = color;

    parts[8] = '" /><stop offset="1" stop-color="';

    parts[9] = color;

    parts[
      10
    ] = '" stop-opacity="0" /></radialGradient><radialGradient id="f" cx="0" cy="0" r="1" gradientTransform="matrix(7.1866 -72.99558 127.41796 12.54463 239.305 292.746)" gradientUnits="userSpaceOnUse"><stop stop-color="';

    parts[11] = color;

    parts[12] = '" /><stop offset="1" stop-color="';

    parts[13] = color;

    parts[
      14
    ] = '" stop-opacity="0" /></radialGradient><radialGradient id="h" cx="0" cy="0" r="1" gradientTransform="rotate(-94.142 264.008 51.235) scale(212.85 177.126)" gradientUnits="userSpaceOnUse"><stop stop-color="';

    parts[15] = color;

    parts[16] = '" /><stop offset="1" stop-color="';

    parts[17] = color;

    parts[
      18
    ] = '" stop-opacity="0" /></radialGradient><radialGradient id="i" cx="0" cy="0" r="1" gradientTransform="matrix(23.59563 32 -33.15047 24.44394 98.506 137.893)" gradientUnits="userSpaceOnUse"><stop stop-color="#0B101A" /><stop offset=".609" stop-color="';

    parts[19] = color;

    parts[
      20
    ] = '" /><stop offset="1" stop-color="#fff" /></radialGradient><filter id="c" width="346.748" height="277.643" x="52.9" y="108.695" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_260_71" stdDeviation="25" /></filter><filter id="e" width="221.224" height="170.469" x="120.757" y="169.482" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_260_71" stdDeviation="10" /></filter><filter id="g" width="446.748" height="377.643" x="14.251" y="60.147" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_260_71" stdDeviation="50" /></filter><clipPath id="a"><rect width="390" height="500" fill="#fff" rx="13.393" /></clipPath></defs></svg>';

    string memory svg1 = string.concat(
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      parts[6],
      parts[7],
      parts[8]
    );
    string memory svg2 = string.concat(
      parts[9],
      parts[10],
      parts[11],
      parts[12],
      parts[13],
      parts[14],
      parts[15],
      parts[16],
      parts[17]
    );
    return string.concat(svg1, svg2, parts[18], parts[19], parts[20]);
  }

  function test_ReturnsCorrectTokenURIWhenAddressHasLeadingZeroes(
    uint256 tokenIdWithLeadingZeroes
  ) public {
    // Setting this number as the upper limit ensures when this `tokenId` is converted to an address it will be be less
    // than `0x00000000000fffffffffffffffffffffffffffff`. This guarantees that the fuzz output will have at least 11
    // leading zeroes
    tokenIdWithLeadingZeroes = bound(
      tokenIdWithLeadingZeroes,
      1,
      5_444_517_870_735_015_415_413_993_718_908_291_383_295
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(uint160(tokenIdWithLeadingZeroes)),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    string memory uri = mpPolicy.tokenURI(tokenIdWithLeadingZeroes);
    Metadata memory metadata = parseMetadata(uri);
    assertEq(
      metadata.image,
      generateTokenUri(address(uint160(tokenIdWithLeadingZeroes)))
    );
  }

  function test_ReturnsCorrectTokenURI() public {
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    string memory addressAsString = LibString.toHexString(address(this));
    string memory truncatedAddress = string.concat(
      LibString.slice(addressAsString, 0, 6),
      "...",
      LibString.slice(addressAsString, 38, 42)
    );
    string memory uri = mpPolicy.tokenURI(uint256(uint160(address(this))));
    Metadata memory metadata = parseMetadata(uri);
    string memory name = LibString.concat(truncatedAddress, " Policy");
    string memory policyholder = LibString.toHexString(address(this));
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(address(mpExecutor))
    );
    string memory description1 = LibString.concat(
      "This NFT represents membership in the Llama instance: ",
      LibString.escapeJSON(mpPolicy.name())
    );
    string memory description = string.concat(
      description1,
      ". The owner of this NFT can participate in governance according to their roles and permissions. Visit ",
      instanceUrl,
      "/policies/",
      policyholder,
      " to see more details."
    );

    assertEq(metadata.description, description);
    assertEq(metadata.name, name);
    assertEq(metadata.image, generateTokenUri(address(this)));
  }

  function testFuzz_tokenURIProxiesCorrectly(address policyholder) external {
    vm.assume(policyholder != address(0));
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      policyholder,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    uint256 tokenId = uint256(uint160(policyholder));

    string memory name = "Mock Protocol Llama";
    assertEq(
      mpPolicy.tokenURI(tokenId),
      mpPolicyMetadata.getTokenURI(name, address(mpExecutor), tokenId)
    );
  }

  function test_ReturnsCorrectTokenURIEscapesJson() public {
    LlamaCore deployedCore = deployLlamaWithQuotesInName();
    LlamaExecutor deployedExecutor = deployedCore.executor();
    LlamaPolicy deployedPolicy = deployedCore.policy();
    string memory nameWithQuotes = '\\"name\\": \\"Mock Protocol Llama\\"';
    string memory addressAsString = LibString.toHexString(address(this));
    string memory truncatedAddress = string.concat(
      LibString.slice(addressAsString, 0, 6),
      "...",
      LibString.slice(addressAsString, 38, 42)
    );

    vm.startPrank(address(deployedExecutor));
    deployedPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.stopPrank();

    string memory uri = deployedPolicy.tokenURI(
      uint256(uint160(address(this)))
    );
    Metadata memory metadata = parseMetadata(uri);
    string memory name = LibString.concat(truncatedAddress, " Policy");
    string memory policyholder = LibString.toHexString(address(this));
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(address(deployedExecutor))
    );
    string memory description1 = LibString.concat(
      "This NFT represents membership in the Llama instance: ",
      nameWithQuotes
    );
    string memory description = string.concat(
      description1,
      ". The owner of this NFT can participate in governance according to their roles and permissions. Visit ",
      instanceUrl,
      "/policies/",
      policyholder,
      " to see more details."
    );

    assertEq(LibString.escapeJSON(metadata.description), description);
    assertEq(LibString.escapeJSON(metadata.name), name);
    assertEq(metadata.image, generateTokenUri(address(this)));
  }

  function testFuzz_RevertIf_NonExistantTokenId(
    uint256 nonExistantTokenId
  ) public {
    vm.assume(
      nonExistantTokenId != uint256(uint160(actionCreatorAaron)) &&
        nonExistantTokenId != uint256(uint160(approverAdam)) &&
        nonExistantTokenId != uint256(uint160(approverAlicia)) &&
        nonExistantTokenId != uint256(uint160(approverAndy)) &&
        nonExistantTokenId != uint256(uint160(disapproverDave)) &&
        nonExistantTokenId != uint256(uint160(disapproverDiane)) &&
        nonExistantTokenId != uint256(uint160(disapproverDrake))
    );
    vm.expectRevert("NOT_MINTED");
    mpPolicy.tokenURI(nonExistantTokenId);
  }
}

contract PolicyMetadataExternalUrl is LlamaPolicyTest {
  // The token's JSON metadata.
  // The `image` field is the *decoded* SVG image, but in the contract it's base64-encoded.
  struct Metadata {
    string name;
    string description;
    string image; // Decoded SVG.
    string external_url;
  }

  function parseMetadata(string memory uri) internal returns (Metadata memory) {
    string[] memory inputs = new string[](3);
    inputs[0] = "node";
    inputs[1] = "packages/llama/test/lib/metadata.js";
    inputs[2] = uri;
    return abi.decode(vm.ffi(inputs), (Metadata));
  }

  function test_ReturnsCorrectExternalUrl() public {
    string memory external_url = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(address(mpExecutor))
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    string memory uri = mpPolicy.tokenURI(uint256(uint160(address(this))));
    Metadata memory metadata = parseMetadata(uri);
    console2.log(metadata.external_url);
    console2.log(external_url);
    assertEq(metadata.external_url, external_url);
  }
}

contract PolicyMetadataContractURI is LlamaPolicyTest {
  function test_ReturnsCorrectContractURI() external {
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(address(mpExecutor))
    );
    string memory name = "Mock Protocol Llama";
    string[9] memory parts;
    parts[0] = '{ "name": "Llama Policies: ';
    parts[1] = LibString.escapeJSON(name);
    parts[
      2
    ] = '", "description": "This collection includes all members of the Llama instance: ';
    parts[3] = LibString.escapeJSON(name);
    parts[4] = ". Visit ";
    parts[5] = instanceUrl;
    parts[
      6
    ] = ' to learn more.", "image":"https://llama.xyz/policy-nft/llama-profile.png", "external_link": "';
    parts[7] = instanceUrl;
    parts[8] = '", "banner":"https://llama.xyz/policy-nft/llama-banner.png" }';
    string memory json = Base64.encode(
      bytes(
        string.concat(
          parts[0],
          parts[1],
          parts[2],
          parts[3],
          parts[4],
          parts[5],
          parts[6],
          parts[7],
          parts[8]
        )
      )
    );
    string memory encodedContractURI = string.concat(
      "data:application/json;base64,",
      json
    );
    assertEq(mpPolicy.contractURI(), encodedContractURI);
  }

  function test_ReturnsContractURIEscapesJson() external {
    LlamaCore deployedInstance = deployLlamaWithQuotesInName();
    LlamaPolicy deployedPolicy = deployedInstance.policy();
    string memory escapedName = '\\"name\\": \\"Mock Protocol Llama\\"';
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(address(deployedInstance.executor()))
    );

    string[9] memory parts;
    parts[0] = '{ "name": "Llama Policies: ';
    parts[1] = escapedName;
    parts[
      2
    ] = '", "description": "This collection includes all members of the Llama instance: ';
    parts[3] = escapedName;
    parts[4] = ". Visit ";
    parts[5] = instanceUrl;
    parts[
      6
    ] = ' to learn more.", "image":"https://llama.xyz/policy-nft/llama-profile.png", "external_link": "';
    parts[7] = instanceUrl;
    parts[8] = '", "banner":"https://llama.xyz/policy-nft/llama-banner.png" }';
    string memory json = Base64.encode(
      bytes(
        string.concat(
          parts[0],
          parts[1],
          parts[2],
          parts[3],
          parts[4],
          parts[5],
          parts[6],
          parts[7],
          parts[8]
        )
      )
    );
    string memory encodedContractURI = string.concat(
      "data:application/json;base64,",
      json
    );
    assertEq(deployedPolicy.contractURI(), encodedContractURI);
  }

  function test_contractURIProxiesCorrectly() external {
    string memory name = "Mock Protocol Llama";
    assertEq(
      mpPolicy.contractURI(),
      mpPolicyMetadata.getContractURI(name, address(mpExecutor))
    );
  }
}

contract IsRoleExpired is LlamaPolicyTest {
  function testFuzz_ReturnsTrueForExpiredRole(uint64 expiration) public {
    expiration = uint64(
      bound(expiration, block.timestamp + 1, type(uint64).max - 1)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      expiration
    );

    vm.warp(expiration + 1);

    assertEq(
      mpPolicy.isRoleExpired(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      true
    );
  }

  function testFuzz_ReturnsFalseForNonExpiredRole(uint64 expiration) public {
    expiration = uint64(
      bound(expiration, block.timestamp + 1, type(uint64).max)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      arbitraryPolicyholder,
      DEFAULT_ROLE_QTY,
      expiration
    );

    assertEq(
      mpPolicy.isRoleExpired(arbitraryPolicyholder, uint8(Roles.TestRole1)),
      false
    );
  }

  function test_ReturnsFalseIfNoRole() public {
    address randomPolicyholder = makeAddr("randomPolicyholder");
    // Make sure policyholder has no role, in and in that case expired should be false.
    assertEq(
      mpPolicy.getQuantity(randomPolicyholder, uint8(Roles.TestRole1)),
      0
    );
    assertFalse(
      mpPolicy.isRoleExpired(randomPolicyholder, uint8(Roles.TestRole1))
    );
  }
}

contract UpdateRoleDescription is LlamaPolicyTest {
  function test_UpdatesRoleDescription() public {
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit RoleInitialized(
      uint8(Roles.TestRole1),
      RoleDescription.wrap("New Description")
    );

    mpPolicy.updateRoleDescription(
      uint8(Roles.TestRole1),
      RoleDescription.wrap("New Description")
    );
  }

  function test_RevertIf_RoleNotInitialized(uint8 role) public {
    // Bound role between first invalid role number and the uint8 max
    role = uint8(bound(role, mpPolicy.numRoles() + 1, uint8(255)));
    vm.prank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(LlamaPolicy.RoleNotInitialized.selector, role)
    );
    mpPolicy.updateRoleDescription(
      role,
      RoleDescription.wrap("New Description")
    );
  }

  function test_FailsForNonOwner() public {
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);
    mpPolicy.updateRoleDescription(
      uint8(Roles.TestRole1),
      RoleDescription.wrap("New Description")
    );
  }
}

contract SetAndInitializePolicyMetadata is LlamaPolicyTest {
  string newColor = "#BADA55";
  string newLogo =
    "<g fill='#BADA55'><path d='M44.876 462c-3.783 0-6.883-.881-9.3-2.645-2.384-1.794-3.576-4.344-3.576-7.65 0-.692.08-1.542.238-2.55.414-2.266 1.002-4.989 1.765-8.169C36.165 432.329 41.744 428 50.742 428c2.448 0 4.641.409 6.58 1.228 1.94.787 3.466 1.983 4.579 3.589 1.112 1.574 1.669 3.463 1.669 5.666 0 .661-.08 1.496-.239 2.503a106.077 106.077 0 0 1-1.716 8.169c-1.113 4.314-3.037 7.54-5.77 9.681-2.735 2.109-6.39 3.164-10.97 3.164Zm.668-6.8c1.78 0 3.29-.52 4.53-1.558 1.272-1.039 2.178-2.629 2.718-4.77.731-2.959 1.288-5.541 1.67-7.744.127-.661.19-1.338.19-2.031 0-2.865-1.51-4.297-4.53-4.297-1.78 0-3.307.519-4.578 1.558-1.24 1.039-2.13 2.629-2.671 4.77-.572 2.109-1.145 4.691-1.717 7.744-.127.63-.19 1.291-.19 1.983 0 2.897 1.526 4.345 4.578 4.345ZM68.409 461.528c-.35 0-.62-.11-.81-.331a1.12 1.12 0 0 1-.144-.85l6.581-30.694c.064-.347.239-.63.525-.85.286-.221.588-.331.906-.331h12.685c3.529 0 6.358.724 8.489 2.172 2.161 1.449 3.242 3.542 3.242 6.281 0 .787-.095 1.605-.286 2.455-.795 3.621-2.4 6.297-4.816 8.028-2.385 1.732-5.66 2.597-9.824 2.597h-6.438l-2.194 10.342a1.35 1.35 0 0 1-.524.85c-.287.221-.588.331-.907.331H68.41Zm16.882-18.039c1.335 0 2.495-.362 3.48-1.086 1.018-.724 1.686-1.763 2.004-3.117a8.185 8.185 0 0 0 .143-1.417c0-.913-.27-1.605-.81-2.077-.541-.504-1.463-.756-2.767-.756H81.62l-1.813 8.453h5.485ZM110.628 461.528c-.349 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l5.293-24.461h-8.488c-.35 0-.62-.11-.811-.33a1.12 1.12 0 0 1-.143-.851l1.097-5.052c.063-.347.238-.63.524-.85.286-.221.588-.331.906-.331h25.657c.35 0 .62.11.811.331.127.189.19.378.19.566a.909.909 0 0 1-.047.284l-1.097 5.052c-.064.347-.239.63-.525.851-.254.22-.556.33-.906.33h-8.441l-5.293 24.461c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-6.295ZM135.88 461.528c-.35 0-.62-.11-.811-.331a1.016 1.016 0 0 1-.191-.85l6.629-30.694a1.35 1.35 0 0 1 .525-.85c.286-.221.588-.331.906-.331h6.438c.349 0 .62.11.81.331.128.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-6.438ZM154.038 461.528c-.349 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.064-.347.238-.63.524-.85.287-.221.605-.331.954-.331h5.151c.763 0 1.255.346 1.478 1.039l5.198 14.875 11.588-14.875c.159-.252.382-.488.668-.708.318-.221.7-.331 1.145-.331h5.198c.349 0 .62.11.81.331.127.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-5.771c-.349 0-.62-.11-.81-.331a1.118 1.118 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803-.286.189-.62.283-1.002.283h-2.479c-.668 0-1.129-.362-1.383-1.086l-3.386-10.011-3.815 17.85c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-5.723ZM196.132 461.528c-.35 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l6.628-30.694a1.35 1.35 0 0 1 .525-.85c.285-.221.588-.331.906-.331h6.438c.35 0 .62.11.811.331.127.189.19.378.19.566a.88.88 0 0 1-.047.284l-6.581 30.694c-.063.346-.238.63-.525.85a1.46 1.46 0 0 1-.907.331h-6.437ZM226.07 462c-2.798 0-5.198-.378-7.201-1.133-1.972-.756-3.466-1.763-4.483-3.022-.986-1.26-1.479-2.661-1.479-4.203 0-.252.033-.63.095-1.134.065-.283.193-.519.383-.708.223-.189.476-.283.763-.283h6.103c.383 0 .668.063.859.188.222.126.445.347.668.662.223.818.731 1.495 1.526 2.03.827.535 1.955.803 3.385.803 1.812 0 3.276-.283 4.388-.85 1.113-.567 1.781-1.338 2.002-2.314a2.42 2.42 0 0 0 .048-.566c0-.788-.491-1.401-1.477-1.842-.986-.473-2.798-1.023-5.437-1.653-3.084-.661-5.421-1.653-7.011-2.975-1.589-1.354-2.383-3.117-2.383-5.289 0-.755.095-1.527.286-2.314.635-2.928 2.21-5.226 4.72-6.894 2.544-1.669 5.818-2.503 9.825-2.503 2.415 0 4.563.425 6.438 1.275 1.875.85 3.321 1.936 4.34 3.258 1.049 1.291 1.572 2.582 1.572 3.873 0 .377-.015.645-.047.802-.063.284-.206.52-.429.709a.975.975 0 0 1-.715.283h-6.391c-.698 0-1.176-.268-1.429-.803-.033-.724-.415-1.338-1.146-1.841-.731-.504-1.685-.756-2.861-.756-1.399 0-2.559.252-3.482.756-.889.503-1.447 1.243-1.668 2.219a3.172 3.172 0 0 0-.049.614c0 .755.445 1.385 1.336 1.889.922.472 2.528.96 4.816 1.464 3.562.692 6.153 1.684 7.774 2.975 1.653 1.29 2.479 3.006 2.479 5.147 0 .724-.095 1.511-.286 2.361-.698 3.211-2.4 5.651-5.103 7.32-2.669 1.636-6.246 2.455-10.729 2.455ZM248.515 461.528c-.35 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.063-.347.238-.63.525-.85.286-.221.604-.331.954-.331h5.149c.763 0 1.256.346 1.479 1.039l5.199 14.875 11.587-14.875c.16-.252.382-.488.668-.708.318-.221.699-.331 1.144-.331h5.199c.35 0 .62.11.811.331.127.189.19.378.19.566a.856.856 0 0 1-.048.284l-6.58 30.694c-.065.346-.24.63-.526.85a1.456 1.456 0 0 1-.906.331h-5.769c-.351 0-.621-.11-.811-.331a1.109 1.109 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803a1.776 1.776 0 0 1-1.001.283h-2.481c-.668 0-1.128-.362-1.382-1.086l-3.386-10.011-3.815 17.85a1.36 1.36 0 0 1-.525.85c-.286.221-.588.331-.906.331h-5.723Z'/></g>";

  function test_RevertIf_CallerIsNotLlama() public {
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    vm.expectRevert(LlamaPolicy.OnlyLlama.selector);
    mpPolicy.setAndInitializePolicyMetadata(
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );
  }

  function test_EmitsPolicyMetadataSetEvent() public {
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    ILlamaPolicyMetadata llamaPolicyMetadata = lens
      .computeLlamaPolicyMetadataAddress(
        address(llamaPolicyMetadataLogic),
        abi.encode(newColor, newLogo),
        address(mpPolicy)
      );
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit PolicyMetadataSet(
      llamaPolicyMetadata,
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );
    mpPolicy.setAndInitializePolicyMetadata(
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );
  }

  function test_DeploysAndSetsMetadataClone() public {
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    ILlamaPolicyMetadata llamaPolicyMetadata = lens
      .computeLlamaPolicyMetadataAddress(
        address(llamaPolicyMetadataLogic),
        abi.encode(newColor, newLogo),
        address(mpPolicy)
      );
    assertEq(address(llamaPolicyMetadata).code.length, 0);

    vm.prank(address(mpExecutor));
    mpPolicy.setAndInitializePolicyMetadata(
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );

    assertEq(
      address(llamaPolicyMetadata),
      address(mpPolicy.llamaPolicyMetadata())
    );
    assertGt(address(llamaPolicyMetadata).code.length, 0);
  }

  function test_InitializationSetsColor() public {
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    ILlamaPolicyMetadata llamaPolicyMetadata = lens
      .computeLlamaPolicyMetadataAddress(
        address(llamaPolicyMetadataLogic),
        abi.encode(newColor, newLogo),
        address(mpPolicy)
      );

    vm.prank(address(mpExecutor));
    mpPolicy.setAndInitializePolicyMetadata(
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );

    assertEq(
      newColor,
      LlamaPolicyMetadata(address(llamaPolicyMetadata)).color()
    );
  }

  function test_InitializationSetsLogo() public {
    ILlamaPolicyMetadata llamaPolicyMetadataLogic = factory
      .LLAMA_POLICY_METADATA_LOGIC();
    ILlamaPolicyMetadata llamaPolicyMetadata = lens
      .computeLlamaPolicyMetadataAddress(
        address(llamaPolicyMetadataLogic),
        abi.encode(newColor, newLogo),
        address(mpPolicy)
      );

    vm.prank(address(mpExecutor));
    mpPolicy.setAndInitializePolicyMetadata(
      llamaPolicyMetadataLogic,
      abi.encode(newColor, newLogo)
    );

    assertEq(newLogo, LlamaPolicyMetadata(address(llamaPolicyMetadata)).logo());
  }

  function test_InitializeCannotBeCalledTwice() public {
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpPolicyMetadata.initialize(abi.encode(color, logo));
  }

  function test_RevertIf_MetadataLogicIsZeroAddress() public {
    vm.expectRevert();
    vm.prank(address(mpExecutor));
    mpPolicy.setAndInitializePolicyMetadata(
      ILlamaPolicyMetadata(address(0)),
      abi.encode(newColor, newLogo)
    );
  }
}
