// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";

// helpers
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";

import {Architect} from "contracts/src/factory/facets/architect/Architect.sol";
import {ProxyManager} from "contracts/src/diamond/proxy/manager/ProxyManager.sol";

// space helpers
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

// deployments
import {DeployOwnable} from "contracts/scripts/deployments/facets/DeployOwnable.s.sol";
import {DeployDiamondCut} from "contracts/scripts/deployments/facets/DeployDiamondCut.s.sol";
import {DeployDiamondLoupe} from "contracts/scripts/deployments/facets/DeployDiamondLoupe.s.sol";
import {DeployIntrospection} from "contracts/scripts/deployments/facets/DeployIntrospection.s.sol";
import {DeployMetadata} from "contracts/scripts/deployments/facets/DeployMetadata.s.sol";
import {DeployArchitect} from "contracts/scripts/deployments/facets/DeployArchitect.s.sol";
import {DeployProxyManager} from "contracts/scripts/deployments/facets/DeployProxyManager.s.sol";

import {DeployUserEntitlement} from "contracts/scripts/deployments/DeployUserEntitlement.s.sol";
import {DeployMultiInit} from "contracts/scripts/deployments/DeployMultiInit.s.sol";
import {DeploySpace} from "contracts/scripts/deployments/DeploySpace.s.sol";
import {DeploySpaceOwner} from "contracts/scripts/deployments/DeploySpaceOwner.s.sol";
import {DeployRuleEntitlement, DeployRuleEntitlementV2} from "contracts/scripts/deployments/DeployRuleEntitlement.s.sol";
import {DeployWalletLink} from "contracts/scripts/deployments/facets/DeployWalletLink.s.sol";
import {DeployTieredLogPricing} from "contracts/scripts/deployments/DeployTieredLogPricing.s.sol";
import {DeployFixedPricing} from "contracts/scripts/deployments/DeployFixedPricing.s.sol";
import {DeployPricingModules} from "contracts/scripts/deployments/facets/DeployPricingModules.s.sol";
import {DeployImplementationRegistry} from "contracts/scripts/deployments/facets/DeployImplementationRegistry.s.sol";
import {DeployPausable} from "contracts/scripts/deployments/facets/DeployPausable.s.sol";
import {DeployPlatformRequirements} from "./facets/DeployPlatformRequirements.s.sol";
import {DeployEIP712Facet} from "contracts/scripts/deployments/facets/DeployEIP712Facet.s.sol";

<<<<<<< HEAD
import {SpaceFactory} from "contracts/src/factory/SpaceFactory.sol";

contract DeploySpaceFactory is DiamondHelper, Deployer {
=======
// legacy
import {DeployMockLegacyArchitect} from "./facets/DeployMockLegacyArchitect.s.sol";

contract DeploySpaceFactory is DiamondDeployer {
>>>>>>> refs/rewritten/fix-merge-conflict
  // diamond helpers
  DeployOwnable ownableHelper = new DeployOwnable();
  DeployDiamondCut diamondCutHelper = new DeployDiamondCut();
  DeployDiamondLoupe diamondLoupeHelper = new DeployDiamondLoupe();
  DeployIntrospection introspectionHelper = new DeployIntrospection();
  DeployMetadata metadataHelper = new DeployMetadata();

  DeployArchitect architectHelper = new DeployArchitect();
  DeployPricingModules pricingModulesHelper = new DeployPricingModules();
  DeployImplementationRegistry registryHelper =
    new DeployImplementationRegistry();
  DeployWalletLink walletLinkHelper = new DeployWalletLink();
  DeployProxyManager proxyManagerHelper = new DeployProxyManager();
  DeployPausable pausableHelper = new DeployPausable();
  DeployMultiInit deployMultiInit = new DeployMultiInit();

  // dependencies
  DeploySpace deploySpace = new DeploySpace();
  DeploySpaceOwner deploySpaceOwner = new DeploySpaceOwner();
  DeployUserEntitlement deployUserEntitlement = new DeployUserEntitlement();
  DeployRuleEntitlement deployLegacyRuleEntitlement =
    new DeployRuleEntitlement();
  DeployRuleEntitlementV2 deployRuleEntitlementV2 =
    new DeployRuleEntitlementV2();

  DeployTieredLogPricing deployTieredLogPricing = new DeployTieredLogPricing();
  DeployFixedPricing deployFixedPricing = new DeployFixedPricing();
  DeployPlatformRequirements platformReqsHelper =
    new DeployPlatformRequirements();
  DeployEIP712Facet eip712Helper = new DeployEIP712Facet();

  DeployMockLegacyArchitect deployMockLegacyArchitect =
    new DeployMockLegacyArchitect();

  // helpers

  // diamond addresses
  address ownable;
  address diamondCut;
  address diamondLoupe;
  address introspection;
  address metadata;

  // space addresses
  address architect;
  address legacyArchitect;
  address proxyManager;
  address pausable;
  address platformReqs;

  address registry;
  address walletLink;
  address eip712;

  // external contracts
  address public userEntitlement;
  address public legacyRuleEntitlement;
  address public ruleEntitlement;
  address public spaceOwner;

  address public tieredLogPricing;
  address public fixedPricing;

  function versionName() public pure override returns (string memory) {
    return "SpaceFactory";
  }

  function diamondInitParams(
    address deployer
  ) internal returns (Diamond.InitParams memory) {
    address multiInit = deployMultiInit.deploy();

    address space = deploySpace.deploy();
    spaceOwner = deploySpaceOwner.deploy();

    // entitlement modules
    userEntitlement = deployUserEntitlement.deploy();
    ruleEntitlement = deployRuleEntitlementV2.deploy();
    legacyRuleEntitlement = deployLegacyRuleEntitlement.deploy();

    // pricing modules
    tieredLogPricing = deployTieredLogPricing.deploy();
    fixedPricing = deployFixedPricing.deploy();

    // pricing modules facet
    address pricingModulesFacet = pricingModulesHelper.deploy();
    address[] memory pricingModules = new address[](2);
    pricingModules[0] = tieredLogPricing;
    pricingModules[1] = fixedPricing;

    // diamond facets
    ownable = ownableHelper.deploy();
    diamondCut = diamondCutHelper.deploy();
    diamondLoupe = diamondLoupeHelper.deploy();
    introspection = introspectionHelper.deploy();
    metadata = metadataHelper.deploy();

    architect = architectHelper.deploy();
    registry = registryHelper.deploy();
    walletLink = walletLinkHelper.deploy();
    proxyManager = proxyManagerHelper.deploy();

    pausable = pausableHelper.deploy();
    platformReqs = platformReqsHelper.deploy();

    eip712 = eip712Helper.deploy();

    // legacy
    legacyArchitect = deployMockLegacyArchitect.deploy();

    addFacet(
      diamondCutHelper.makeCut(diamondCut, IDiamond.FacetCutAction.Add),
      diamondCut,
      diamondCutHelper.makeInitData("")
    );
    addFacet(
      diamondLoupeHelper.makeCut(diamondLoupe, IDiamond.FacetCutAction.Add),
      diamondLoupe,
      diamondLoupeHelper.makeInitData("")
    );
    addFacet(
      introspectionHelper.makeCut(introspection, IDiamond.FacetCutAction.Add),
      introspection,
      introspectionHelper.makeInitData("")
    );
    addFacet(
      metadataHelper.makeCut(metadata, IDiamond.FacetCutAction.Add),
      metadata,
      metadataHelper.makeInitData(bytes32("SpaceFactory"), "")
    );
    addFacet(
      ownableHelper.makeCut(ownable, IDiamond.FacetCutAction.Add),
      ownable,
      ownableHelper.makeInitData(deployer)
    );
    addFacet(
      architectHelper.makeCut(architect, IDiamond.FacetCutAction.Add),
      architect,
      architectHelper.makeInitData(
        spaceOwner, // spaceOwner
        userEntitlement, // userEntitlement
        ruleEntitlement // ruleEntitlement
      )
    );
    addFacet(
      deployMockLegacyArchitect.makeCut(
        legacyArchitect,
        IDiamond.FacetCutAction.Add
      ),
      legacyArchitect,
      deployMockLegacyArchitect.makeInitData(
        spaceOwner, // spaceOwnerToken
        userEntitlement, // userEntitlement
        ruleEntitlement, // ruleEntitlement
        legacyRuleEntitlement // legacy ruleEntitlement
      )
    );
    addFacet(
      proxyManagerHelper.makeCut(proxyManager, IDiamond.FacetCutAction.Add),
      proxyManager,
      proxyManagerHelper.makeInitData(space)
    );
    addFacet(
      pausableHelper.makeCut(pausable, IDiamond.FacetCutAction.Add),
      pausable,
      pausableHelper.makeInitData("")
    );
    addFacet(
      platformReqsHelper.makeCut(platformReqs, IDiamond.FacetCutAction.Add),
      platformReqs,
      platformReqsHelper.makeInitData(
        deployer, // feeRecipient
        500, // membershipBps 5%
        0.005 ether, // membershipFee
        1_000, // membershipFreeAllocation
        365 days, // membershipDuration
        0.001 ether // membershipMinPrice
      )
    );
    addFacet(
      pricingModulesHelper.makeCut(
        pricingModulesFacet,
        IDiamond.FacetCutAction.Add
      ),
      pricingModulesFacet,
      pricingModulesHelper.makeInitData(pricingModules)
    );
    addFacet(
      registryHelper.makeCut(registry, IDiamond.FacetCutAction.Add),
      registry,
      registryHelper.makeInitData("")
    );
    addFacet(
      walletLinkHelper.makeCut(walletLink, IDiamond.FacetCutAction.Add),
      walletLink,
      walletLinkHelper.makeInitData("")
    );
    addFacet(
      eip712Helper.makeCut(eip712, IDiamond.FacetCutAction.Add),
      eip712,
      eip712Helper.makeInitData("SpaceFactory", "1")
    );

    return
      Diamond.InitParams({
        baseFacets: baseFacets(),
        init: multiInit,
        initData: abi.encodeWithSelector(
          MultiInit.multiInit.selector,
          _initAddresses,
          _initDatas
        )
      });
  }

  function __deploy(address deployer) public override returns (address) {
    Diamond.InitParams memory initDiamondCut = diamondInitParams(deployer);
    vm.broadcast(deployer);
    Diamond diamond = new Diamond(initDiamondCut);

    return address(diamond);
  }
}
