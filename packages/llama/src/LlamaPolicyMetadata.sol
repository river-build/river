// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import {LibString} from "@solady/utils/LibString.sol";

import {ILlamaPolicyMetadata} from "@llama/src/interfaces/ILlamaPolicyMetadata.sol";

/// @title Llama Policy Metadata
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice Utility contract to compute Llama policy metadata.
contract LlamaPolicyMetadata is ILlamaPolicyMetadata, Initializable {
  // =================================================
  // ======== Constants and Storage Variables ========
  // =================================================

  /// @notice Color code for SVG.
  string public color;

  /// @notice Logo for SVG.
  string public logo;

  // ======================================================
  // ======== Contract Creation and Initialization ========
  // ======================================================

  /// @dev This contract is deployed as a minimal proxy from the policy's `_setAndInitializePolicyMetadata` function. The
  /// `_disableInitializers` locks the implementation (logic) contract, preventing any future initialization of it.
  constructor() {
    _disableInitializers();
  }

  /// @inheritdoc ILlamaPolicyMetadata
  function initialize(bytes memory config) external initializer returns (bool) {
    (string memory _color, string memory _logo) = abi.decode(
      config,
      (string, string)
    );
    color = _color;
    logo = _logo;

    return true;
  }

  /// @inheritdoc ILlamaPolicyMetadata
  function getTokenURI(
    string memory name,
    address executor,
    uint256 tokenId
  ) external view returns (string memory) {
    string[21] memory parts;
    string memory policyholder = LibString.toHexString(
      address(uint160(tokenId))
    );
    string memory truncatedAddress = string.concat(
      LibString.slice(policyholder, 0, 6),
      "...",
      LibString.slice(policyholder, 38, 42)
    );

    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="500" fill="none"><g clip-path="url(#a)"><rect width="390" height="500" fill="#0B101A" rx="13.393" /><mask id="b" width="364" height="305" x="4" y="30" maskUnits="userSpaceOnUse" style="mask-type:alpha"><ellipse cx="186.475" cy="182.744" fill="#8000FF" rx="196.994" ry="131.329" transform="rotate(-31.49 186.475 182.744)" /></mask><g mask="url(#b)"><g filter="url(#c)"><ellipse cx="226.274" cy="247.516" fill="url(#d)" rx="140.048" ry="59.062" transform="rotate(-31.49 226.274 247.516)" /></g><g filter="url(#e)"><ellipse cx="231.368" cy="254.717" fill="url(#f)" rx="102.858" ry="43.378" transform="rotate(-31.49 231.368 254.717)" /></g></g><g filter="url(#g)"><ellipse cx="237.625" cy="248.969" fill="url(#h)" rx="140.048" ry="59.062" transform="rotate(-31.49 237.625 248.969)" /></g><circle cx="109.839" cy="147.893" r="22" fill="url(#i)" /><rect width="150" height="35.071" x="32" y="376.875" fill="';

    parts[1] = color;

    parts[
      2
    ] = '" rx="17.536" /><text xml:space="preserve" fill="#0B101A" font-family="ui-monospace,Cascadia Mono,Menlo,Monaco,Segoe UI Mono,Roboto Mono,Oxygen Mono,Ubuntu Monospace,Source Code Pro,Droid Sans Mono,Fira Mono,Courier,monospace" font-size="16"><tspan x="45.393" y="399.851">';

    parts[3] = truncatedAddress;

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

    // This output has been broken up into multiple outputs to avoid a stack too deep error
    string memory output1 = string.concat(
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
    string memory output2 = string.concat(
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
    string memory output = string.concat(
      output1,
      output2,
      parts[18],
      parts[19],
      parts[20]
    );
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(executor)
    );

    string memory json = Base64.encode(
      bytes(
        string.concat(
          '{"name": "',
          truncatedAddress,
          ' Policy", "description": "This NFT represents membership in the Llama instance: ',
          LibString.escapeJSON(name),
          ". The owner of this NFT can participate in governance according to their roles and permissions. Visit ",
          instanceUrl,
          "/policies/",
          policyholder,
          ' to see more details.", "external_url": "',
          instanceUrl,
          '", "image": "data:image/svg+xml;base64,',
          Base64.encode(bytes(output)),
          '"}'
        )
      )
    );
    output = string.concat("data:application/json;base64,", json);

    return output;
  }

  /// @inheritdoc ILlamaPolicyMetadata
  function getContractURI(
    string memory name,
    address executor
  ) external view returns (string memory) {
    string memory instanceUrl = string.concat(
      "https://app.llama.xyz/orgs/",
      LibString.toString(block.chainid),
      ":",
      LibString.toHexString(executor)
    );
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
    return string.concat("data:application/json;base64,", json);
  }
}
