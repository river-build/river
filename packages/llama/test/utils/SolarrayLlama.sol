// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {RoleDescription} from "@llama/src/lib/UDVTs.sol";

library SolarrayLlama {
  function roleDescription(
    bytes32 a
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](1);
    arr[0] = RoleDescription.wrap(a);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](2);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b,
    bytes32 c
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](3);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    arr[2] = RoleDescription.wrap(c);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b,
    bytes32 c,
    bytes32 d
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](4);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    arr[2] = RoleDescription.wrap(c);
    arr[3] = RoleDescription.wrap(d);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b,
    bytes32 c,
    bytes32 d,
    bytes32 e
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](5);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    arr[2] = RoleDescription.wrap(c);
    arr[3] = RoleDescription.wrap(d);
    arr[4] = RoleDescription.wrap(e);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b,
    bytes32 c,
    bytes32 d,
    bytes32 e,
    bytes32 f
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](6);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    arr[2] = RoleDescription.wrap(c);
    arr[3] = RoleDescription.wrap(d);
    arr[4] = RoleDescription.wrap(e);
    arr[5] = RoleDescription.wrap(f);
    return arr;
  }

  function roleDescription(
    bytes32 a,
    bytes32 b,
    bytes32 c,
    bytes32 d,
    bytes32 e,
    bytes32 f,
    bytes32 g
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](7);
    arr[0] = RoleDescription.wrap(a);
    arr[1] = RoleDescription.wrap(b);
    arr[2] = RoleDescription.wrap(c);
    arr[3] = RoleDescription.wrap(d);
    arr[4] = RoleDescription.wrap(e);
    arr[5] = RoleDescription.wrap(f);
    arr[6] = RoleDescription.wrap(g);
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 1)
    }
    arr[0] = a;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 2)
    }
    arr[0] = a;
    arr[1] = b;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b,
    RoleDescription c
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 3)
    }
    arr[0] = a;
    arr[1] = b;
    arr[2] = c;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b,
    RoleDescription c,
    RoleDescription d
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 4)
    }
    arr[0] = a;
    arr[1] = b;
    arr[2] = c;
    arr[3] = d;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b,
    RoleDescription c,
    RoleDescription d,
    RoleDescription e
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 5)
    }
    arr[0] = a;
    arr[1] = b;
    arr[2] = c;
    arr[3] = d;
    arr[4] = e;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b,
    RoleDescription c,
    RoleDescription d,
    RoleDescription e,
    RoleDescription f
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 6)
    }
    arr[0] = a;
    arr[1] = b;
    arr[2] = c;
    arr[3] = d;
    arr[4] = e;
    arr[5] = f;
    return arr;
  }

  function roleDescriptionWithMaxLength(
    uint256 maxLength,
    RoleDescription a,
    RoleDescription b,
    RoleDescription c,
    RoleDescription d,
    RoleDescription e,
    RoleDescription f,
    RoleDescription g
  ) internal pure returns (RoleDescription[] memory) {
    RoleDescription[] memory arr = new RoleDescription[](maxLength);
    assembly {
      mstore(arr, 7)
    }
    arr[0] = a;
    arr[1] = b;
    arr[2] = c;
    arr[3] = d;
    arr[4] = e;
    arr[5] = f;
    arr[6] = g;
    return arr;
  }

  function extend(
    RoleDescription[] memory arr1,
    RoleDescription[] memory arr2
  ) internal pure returns (RoleDescription[] memory newArr) {
    uint256 length1 = arr1.length;
    uint256 length2 = arr2.length;
    newArr = new RoleDescription[](length1 + length2);
    for (uint256 i = 0; i < length1; ) {
      newArr[i] = arr1[i];
      unchecked {
        ++i;
      }
    }
    for (uint256 i = 0; i < arr2.length; ) {
      uint256 j;
      unchecked {
        j = i + length1;
      }
      newArr[j] = arr2[i];
      unchecked {
        ++i;
      }
    }
  }

  function allocateRoleDescriptions(
    uint256 length
  ) internal pure returns (RoleDescription[] memory arr) {
    arr = new RoleDescription[](length);
    assembly {
      mstore(arr, 0)
    }
  }

  function truncate(
    RoleDescription[] memory arr,
    uint256 newLength
  ) internal pure returns (RoleDescription[] memory _arr) {
    // truncate the array
    assembly {
      let oldLength := mload(arr)
      returndatacopy(
        returndatasize(),
        returndatasize(),
        gt(newLength, oldLength)
      )
      mstore(arr, newLength)
      _arr := arr
    }
  }

  function truncateUnsafe(
    RoleDescription[] memory arr,
    uint256 newLength
  ) internal pure returns (RoleDescription[] memory _arr) {
    // truncate the array
    assembly {
      mstore(arr, newLength)
      _arr := arr
    }
  }

  function append(
    RoleDescription[] memory arr,
    RoleDescription value
  ) internal pure returns (RoleDescription[] memory newArr) {
    uint256 length = arr.length;
    newArr = new RoleDescription[](length + 1);
    newArr[length] = value;
    for (uint256 i = 0; i < length; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function appendUnsafe(
    RoleDescription[] memory arr,
    RoleDescription value
  ) internal pure returns (RoleDescription[] memory modifiedArr) {
    uint256 length = arr.length;
    modifiedArr = arr;
    assembly {
      mstore(modifiedArr, add(length, 1))
      mstore(add(modifiedArr, shl(5, add(length, 1))), value)
    }
  }

  function copy(
    RoleDescription[] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    uint256 length = arr.length;
    newArr = new RoleDescription[](length);
    for (uint256 i = 0; i < length; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function copyAndResize(
    RoleDescription[] memory arr,
    uint256 newLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](newLength);
    uint256 length = arr.length;
    // allow shrinking a copy without copying extra members
    length = (length > newLength) ? newLength : length;
    for (uint256 i = 0; i < length; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    // TODO: consider writing 0-pointer to the rest of the array if longer for dynamic elements
  }

  function copyAndAllocate(
    RoleDescription[] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    uint256 originalLength = arr.length;
    for (uint256 i = 0; i < originalLength; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, originalLength)
    }
  }

  function pop(
    RoleDescription[] memory arr
  ) internal pure returns (RoleDescription value) {
    assembly {
      let length := mload(arr)
      returndatacopy(returndatasize(), returndatasize(), iszero(length))
      value := mload(add(arr, shl(5, length)))
      mstore(arr, sub(length, 1))
    }
  }

  function popUnsafe(
    RoleDescription[] memory arr
  ) internal pure returns (RoleDescription value) {
    // This function is unsafe because it does not check if the array is empty.
    assembly {
      let length := mload(arr)
      value := mload(add(arr, shl(5, length)))
      mstore(arr, sub(length, 1))
    }
  }

  function popLeft(
    RoleDescription[] memory arr
  )
    internal
    pure
    returns (RoleDescription[] memory newArr, RoleDescription value)
  {
    assembly {
      let length := mload(arr)
      returndatacopy(returndatasize(), returndatasize(), iszero(length))
      value := mload(add(arr, 0x20))
      newArr := add(arr, 0x20)
      mstore(newArr, sub(length, 1))
    }
  }

  function popLeftUnsafe(
    RoleDescription[] memory arr
  )
    internal
    pure
    returns (RoleDescription[] memory newArr, RoleDescription value)
  {
    // This function is unsafe because it does not check if the array is empty.
    assembly {
      let length := mload(arr)
      value := mload(add(arr, 0x20))
      newArr := add(arr, 0x20)
      mstore(newArr, sub(length, 1))
    }
  }

  function fromFixed(
    RoleDescription[1] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](1);
    for (uint256 i = 0; i < 1; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[1] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 1; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 1)
    }
  }

  function fromFixed(
    RoleDescription[2] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](2);
    for (uint256 i = 0; i < 2; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[2] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 2; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 2)
    }
  }

  function fromFixed(
    RoleDescription[3] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](3);
    for (uint256 i = 0; i < 3; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[3] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 3; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 3)
    }
  }

  function fromFixed(
    RoleDescription[4] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](4);
    for (uint256 i = 0; i < 4; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[4] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 4; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 4)
    }
  }

  function fromFixed(
    RoleDescription[5] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](5);
    for (uint256 i = 0; i < 5; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[5] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 5; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 5)
    }
  }

  function fromFixed(
    RoleDescription[6] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](6);
    for (uint256 i = 0; i < 6; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[6] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 6; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 6)
    }
  }

  function fromFixed(
    RoleDescription[7] memory arr
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](7);
    for (uint256 i = 0; i < 7; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
  }

  function fromFixedWithMaxLength(
    RoleDescription[7] memory arr,
    uint256 maxLength
  ) internal pure returns (RoleDescription[] memory newArr) {
    newArr = new RoleDescription[](maxLength);
    for (uint256 i = 0; i < 7; ) {
      newArr[i] = arr[i];
      unchecked {
        ++i;
      }
    }
    assembly {
      mstore(newArr, 7)
    }
  }
}
