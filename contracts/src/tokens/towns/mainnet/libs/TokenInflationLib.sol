// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";

// libraries

// contracts

library TokenInflationLib {
  struct Layout {
    uint256 lastMintTime;
    address inflationReceiver;
    uint256 initialInflationRate;
    uint256 finalInflationRate;
    uint256 inflationDecayRate;
    uint256 inflationDecayInterval;
    bool overrideInflation;
    uint256 overrideInflationRate;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = keccak256("towns.token.inflation");
    assembly {
      l.slot := slot
    }
  }

  function initialize(ITownsBase.InflationConfig memory config) internal {
    Layout storage ds = layout();
    ds.lastMintTime = config.lastMintTime;
    ds.inflationReceiver = config.inflationReceiver;
    ds.initialInflationRate = config.initialInflationRate;
    ds.finalInflationRate = config.finalInflationRate;
    ds.inflationDecayRate = config.inflationDecayRate;
    ds.inflationDecayInterval = config.inflationDecayInterval;
  }

  function finalInflationRate() internal view returns (uint256) {
    return layout().finalInflationRate;
  }

  function inflationReceiver() internal view returns (address) {
    return layout().inflationReceiver;
  }

  function setInflationReceiver(address receiver) internal {
    layout().inflationReceiver = receiver;
  }

  function updateLastMintTime() internal {
    layout().lastMintTime = block.timestamp;
  }

  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) internal {
    layout().overrideInflation = overrideInflation;
    layout().overrideInflationRate = overrideInflationRate;
  }

  /**
   * @dev Returns the current inflation rate.
   * @return inflation rate in basis points (0-100)
   */
  function getCurrentInflationRateBPS() internal view returns (uint256) {
    Layout storage ds = layout();

    if (ds.overrideInflation) return ds.overrideInflationRate; // override inflation rate

    uint256 yearsSinceDeployment = (block.timestamp - ds.lastMintTime) /
      365 days;

    // return final inflation rate if yearsSinceDeployment is greater than or equal to inflationDecreaseInterval
    if (yearsSinceDeployment >= ds.inflationDecayInterval)
      return ds.finalInflationRate;

    // linear decrease from initialInflationRate to finalInflationRate over the inflationDecreateInterval
    uint256 decreasePerYear = ds.inflationDecayRate / ds.inflationDecayInterval;
    return ds.initialInflationRate - (yearsSinceDeployment * decreasePerYear);
  }
}
