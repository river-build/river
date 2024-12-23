// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

library InflationLib {
  // keccak256(abi.encode(uint256(keccak256("tokens.towns.inflation.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x1751b9c8ac3148682f9ef0da585cc07853a54d615d924287aba6eacade108900;

  struct Layout {
    uint256 lastMintTime;
    uint256 overrideInflationRate;
    bool overrideInflation;
    address tokenRecipient;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }

  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) external {
    layout().overrideInflation = overrideInflation;
    layout().overrideInflationRate = overrideInflationRate;
  }

  /**
   * @dev Returns the current inflation rate.
   * @return inflation rate in basis points (0-100)
   */
  function getCurrentInflationRateBPS(
    uint256 deployedAt,
    uint256 inflationDecreaseInterval,
    uint256 inflationDecreaseRate,
    uint256 initialInflationRate,
    uint256 finalInflationRate
  ) internal view returns (uint256) {
    uint256 yearsSinceDeployment = (block.timestamp - deployedAt) / 365 days;

    if (layout().overrideInflation) return layout().overrideInflationRate; // override inflation rate

    // return final inflation rate if yearsSinceDeployment is greater than or equal to inflationDecreaseInterval
    if (yearsSinceDeployment >= inflationDecreaseInterval)
      return finalInflationRate;

    // linear decrease from initialInflationRate to finalInflationRate over the inflationDecreateInterval
    uint256 decreasePerYear = inflationDecreaseRate / inflationDecreaseInterval;
    return initialInflationRate - (yearsSinceDeployment * decreasePerYear);
  }
}
