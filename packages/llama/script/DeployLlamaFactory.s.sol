// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, stdJson} from "forge-std/Script.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaAccountWithDelegation} from "@llama/src/accounts/LlamaAccountWithDelegation.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {LlamaLens} from "@llama/src/LlamaLens.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaPolicyMetadata} from "@llama/src/LlamaPolicyMetadata.sol";
import {LlamaAccountTokenDelegationScript} from "@llama/src/llama-scripts/LlamaAccountTokenDelegationScript.sol";
import {LlamaGovernanceScript} from "@llama/src/llama-scripts/LlamaGovernanceScript.sol";
import {LlamaAbsolutePeerReview} from "@llama/src/strategies/absolute/LlamaAbsolutePeerReview.sol";
import {LlamaAbsoluteQuorum} from "@llama/src/strategies/absolute/LlamaAbsoluteQuorum.sol";
import {LlamaRelativeHolderQuorum} from "@llama/src/strategies/relative/LlamaRelativeHolderQuorum.sol";
import {LlamaRelativeQuantityQuorum} from "@llama/src/strategies/relative/LlamaRelativeQuantityQuorum.sol";
import {LlamaRelativeUniqueHolderQuorum} from "@llama/src/strategies/relative/LlamaRelativeUniqueHolderQuorum.sol";
import {DeployUtils} from "@llama/script/DeployUtils.sol";

contract DeployLlamaFactory is Script {
  using stdJson for string;

  // Logic contracts.
  LlamaCore coreLogic;
  LlamaRelativeHolderQuorum relativeHolderQuorumLogic;
  LlamaRelativeQuantityQuorum relativeQuantityQuorumLogic;
  LlamaRelativeUniqueHolderQuorum relativeUniqueHolderQuorumLogic;
  LlamaAbsolutePeerReview absolutePeerReviewLogic;
  LlamaAbsoluteQuorum absoluteQuorumLogic;
  LlamaAccount accountLogic;
  LlamaAccountWithDelegation accountWithDelegationLogic;
  LlamaPolicy policyLogic;
  LlamaPolicyMetadata policyMetadataLogic;

  // Factory and lens contracts.
  LlamaFactory factory;
  LlamaLens lens;

  // Llama scripts
  LlamaGovernanceScript governanceScript;
  LlamaAccountTokenDelegationScript accountTokenDelegationScript;

  function run() public {
    DeployUtils.print(
      string.concat(
        "Deploying Llama factory to chain:",
        vm.toString(block.chainid)
      )
    );

    vm.broadcast();
    coreLogic = new LlamaCore();
    DeployUtils.print(
      string.concat("  LlamaCoreLogic:", vm.toString(address(coreLogic)))
    );

    vm.broadcast();
    relativeHolderQuorumLogic = new LlamaRelativeHolderQuorum();
    DeployUtils.print(
      string.concat(
        "  LlamaRelativeHolderQuorumLogic:",
        vm.toString(address(relativeHolderQuorumLogic))
      )
    );

    // This 0 value, 0x bytecode self-call ensures that deployments on new chains will maintain address consistency with
    // chains deployed before the absolute strategy update.
    vm.broadcast();
    (bool success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    accountLogic = new LlamaAccount();
    DeployUtils.print(
      string.concat("  LlamaAccountLogic:", vm.toString(address(accountLogic)))
    );

    vm.broadcast();
    policyLogic = new LlamaPolicy();
    DeployUtils.print(
      string.concat("  LlamaPolicyLogic:", vm.toString(address(policyLogic)))
    );

    vm.broadcast();
    policyMetadataLogic = new LlamaPolicyMetadata();
    DeployUtils.print(
      string.concat(
        "  LlamaPolicyMetadataLogic:",
        vm.toString(address(policyMetadataLogic))
      )
    );

    vm.broadcast();
    factory = new LlamaFactory(coreLogic, policyLogic, policyMetadataLogic);
    DeployUtils.print(
      string.concat("  LlamaFactory:", vm.toString(address(factory)))
    );

    vm.broadcast();
    lens = new LlamaLens(address(factory));
    DeployUtils.print(
      string.concat("  LlamaLens:", vm.toString(address(lens)))
    );

    // This 0 value, 0x bytecode self-call ensures that deployments on new chains will maintain address consistency with
    // chains deployed before the absolute strategy update.
    vm.broadcast();
    (success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    relativeQuantityQuorumLogic = new LlamaRelativeQuantityQuorum();
    DeployUtils.print(
      string.concat(
        "  LlamaRelativeQuantityQuorumLogic:",
        vm.toString(address(relativeQuantityQuorumLogic))
      )
    );

    vm.broadcast();
    relativeUniqueHolderQuorumLogic = new LlamaRelativeUniqueHolderQuorum();
    DeployUtils.print(
      string.concat(
        "  LlamaRelativeUniqueHolderQuorumLogic:",
        vm.toString(address(relativeUniqueHolderQuorumLogic))
      )
    );

    // These 0 value, 0x bytecode self-calls ensure that deployments on new chains will maintain address consistency
    // with chains deployed before the absolute strategy update.

    vm.broadcast();
    (success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    (success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    (success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    (success, ) = msg.sender.call("");
    DeployUtils.print(
      string.concat("  Self call succeeded? ", vm.toString(success))
    );

    vm.broadcast();
    absoluteQuorumLogic = new LlamaAbsoluteQuorum();
    DeployUtils.print(
      string.concat(
        "  LlamaAbsoluteQuorumLogic:",
        vm.toString(address(absoluteQuorumLogic))
      )
    );

    vm.broadcast();
    absolutePeerReviewLogic = new LlamaAbsolutePeerReview();
    DeployUtils.print(
      string.concat(
        "  LlamaAbsolutePeerReviewLogic:",
        vm.toString(address(absolutePeerReviewLogic))
      )
    );

    vm.broadcast();
    governanceScript = new LlamaGovernanceScript();
    DeployUtils.print(
      string.concat(
        "  LlamaGovernanceScript:",
        vm.toString(address(governanceScript))
      )
    );

    vm.broadcast();
    accountWithDelegationLogic = new LlamaAccountWithDelegation();
    DeployUtils.print(
      string.concat(
        "  LlamaAccountWithDelegationLogic:",
        vm.toString(address(accountWithDelegationLogic))
      )
    );

    vm.broadcast();
    accountTokenDelegationScript = new LlamaAccountTokenDelegationScript();
    DeployUtils.print(
      string.concat(
        "  LlamaAccountTokenDelegationScript:",
        vm.toString(address(accountTokenDelegationScript))
      )
    );
  }
}
