// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondLoupe, IDiamondLoupeBase} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IOwnablePending} from "contracts/src/diamond/facets/ownable/pending/IOwnablePending.sol";

import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";

// libraries
import {stdJson} from "forge-std/StdJson.sol";
import "forge-std/console.sol";

// contracts
import {DeployHelpers} from "../common/DeployHelpers.s.sol";
import {AlphaHelper} from "contracts/scripts/interactions/helpers/AlphaHelper.sol";

import {DeploySpace} from "contracts/scripts/deployments/diamonds/DeploySpace.s.sol";
import {DeploySpaceFactory} from "contracts/scripts/deployments/diamonds/DeploySpaceFactory.s.sol";
import {DeployBaseRegistry} from "contracts/scripts/deployments/diamonds/DeployBaseRegistry.s.sol";
import {DeploySpaceOwner} from "contracts/scripts/deployments/diamonds/DeploySpaceOwner.s.sol";

contract InteractAlphaSparse is AlphaHelper {
  using stdJson for string;

  DeploySpace deploySpace = new DeploySpace();
  DeploySpaceFactory deploySpaceFactory = new DeploySpaceFactory();
  DeployBaseRegistry deployBaseRegistry = new DeployBaseRegistry();
  DeploySpaceOwner deploySpaceOwner = new DeploySpaceOwner();

  string constant DEFAULT_JSON_FILE = "compiled_source_diff.json";
  string constant DEFAULT_REPORT_PATH = "/scripts/bytecode-diff/source-diffs/";

  struct DiamondFacets {
    string diamond;
    uint256 numFacets;
    FacetData[] facets;
  }

  struct FacetData {
    string facetName;
    address deployedAddress;
    bytes32 sourceHash;
  }

  string private jsonData;

  function readJSON(string memory filename) internal {
    {
      string memory root = vm.projectRoot();
      string memory path = string.concat(root, DEFAULT_REPORT_PATH, filename);
      jsonData = vm.readFile(path);
    }
  }

  function __interact(address deployer) internal override {
    readJSON(DEFAULT_JSON_FILE);
    DiamondFacets[] memory diamonds;
    uint256 updatedDiamondLen;
    // scope to avoid stack-too-deep error
    {
      updatedDiamondLen = abi.decode(
        vm.parseJson(jsonData, ".numUpdated"),
        (uint256)
      );
      diamonds = new DiamondFacets[](updatedDiamondLen);

      for (uint256 i = 0; i < updatedDiamondLen; i++) {
        bytes memory diamondData = vm.parseJson(
          jsonData,
          string.concat(".updated[", vm.toString(i), "]")
        );

        // Decode diamond name and number of facets
        (string memory diamondName, uint256 numFacets) = abi.decode(
          diamondData,
          (string, uint256)
        );

        // Create DiamondFacets struct with fixed-size facets array
        diamonds[i] = DiamondFacets({
          diamond: diamondName,
          numFacets: numFacets,
          facets: new FacetData[](numFacets)
        });

        // Decode facets one by one
        for (uint256 j = 0; j < numFacets; j++) {
          bytes memory facetData = vm.parseJson(
            jsonData,
            string.concat(
              ".updated[",
              vm.toString(i),
              "].facets[",
              vm.toString(j),
              "]"
            )
          );
          diamonds[i].facets[j] = abi.decode(facetData, (FacetData));
        }
      }
    }

    vm.setEnv("OVERRIDE_DEPLOYMENTS", "1");

    // Iterate over diamonds array and process each diamond
    for (uint256 i = 0; i < diamonds.length; i++) {
      string memory diamondName = diamonds[i].diamond;
      address diamondAddress;
      FacetCut[] memory newCuts;
      Facet[] memory existingFacets;
      string[] memory facetNames = new string[](diamonds[i].numFacets);
      address[] memory facetAddresses = new address[](diamonds[i].numFacets);

      for (uint256 j = 0; j < diamonds[i].numFacets; j++) {
        facetAddresses[j] = diamonds[i].facets[j].deployedAddress;
      }
      // Create an in-memory array of facet names from diamonds[i]
      for (uint256 j = 0; j < diamonds[i].numFacets; j++) {
        facetNames[j] = diamonds[i].facets[j].facetName;
      }
      bytes32 diamondNameHash = keccak256(abi.encodePacked(diamondName));

      if (diamondNameHash == keccak256(abi.encodePacked("space"))) {
        diamondAddress = getDeployment("space");
        existingFacets = IDiamondLoupe(diamondAddress).facets();
        // remove and redeploy facets based on diamond facet array of updated facets
        removeRemoteFacetsByAddresses(deployer, diamondAddress, facetAddresses);
        deploySpace.diamondInitParams(deployer);
        newCuts = deploySpace.getCuts();
      } else if (diamondNameHash == keccak256(abi.encodePacked("spaceOwner"))) {
        diamondAddress = getDeployment("spaceOwner");
        existingFacets = IDiamondLoupe(diamondAddress).facets();
        // remove and redeploy facets based on diamond facet array of updated facets
        removeRemoteFacetsByAddresses(deployer, diamondAddress, facetAddresses);
        deploySpaceOwner.diamondInitParams(deployer);
        newCuts = deploySpaceOwner.getCuts();
      } else if (
        diamondNameHash == keccak256(abi.encodePacked("spaceFactory"))
      ) {
        diamondAddress = getDeployment("spaceFactory");
        existingFacets = IDiamondLoupe(diamondAddress).facets();
        // remove and redeploy facets based on diamond facet array of updated facets
        removeRemoteFacetsByAddresses(deployer, diamondAddress, facetAddresses);
        deploySpaceFactory.diamondInitParams(deployer);
        newCuts = deploySpaceFactory.getCuts();
      } else if (
        diamondNameHash == keccak256(abi.encodePacked("baseRegistry"))
      ) {
        diamondAddress = getDeployment("baseRegistry");
        existingFacets = IDiamondLoupe(diamondAddress).facets();
        // remove and redeploy facets based on diamond facet array of updated facets
        removeRemoteFacetsByAddresses(deployer, diamondAddress, facetAddresses);
        deployBaseRegistry.diamondInitParams(deployer);
        newCuts = deployBaseRegistry.getCuts();
      } else {
        console.log("Unknown diamond:", diamondName);
        continue;
      }

      vm.broadcast(deployer);
      IDiamondCut(diamondAddress).diamondCut(newCuts, address(0), "");
    }
  }
}
