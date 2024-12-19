// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IntrospectionBase} from "@river-build/diamond/src/facets/introspection/IntrospectionBase.sol";

abstract contract Facet is Initializable, IntrospectionBase {
  constructor() {
    _disableInitializers();
  }
}
