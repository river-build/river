// test/lib/metadata.js
// Takes a tokenURI as input and returns the encoded metadata for use in Solidity tests.
// Based on https://github.com/gakonst/lootloose/blob/master/scripts/metadata.js
const { ethers } = require('./ethers');

// Validate arguments.
const args = process.argv.slice(2);
if (args.length != 1) throw new Error('Must provide tokenURI as the only input.');

// Decode metadata and SVG.
const tokenUri = args[0].replace('data:application/json;base64,', '');
const tokenUriDecoded = Buffer.from(tokenUri, 'base64').toString();
const metadataJson = JSON.parse(tokenUriDecoded);
const svg = metadataJson.image.replace('data:image/svg+xml;base64,', '');
const svgDecoded = Buffer.from(svg, 'base64').toString();
metadataJson.image = svgDecoded; // Overwrite the base64 encoded image with the decoded SVG.

// Define ABI for the Metadata and Svg structs in our test file. Note that the order of arguments
// in the tuple must match the ordering of the `Metadata` struct in the tests.
const sigMetadata =
  'tuple(string name, string description, string image, string external_url)';
const abi = [`function x(${sigMetadata})`];
const iface = new ethers.utils.Interface(abi);

// Encode data with a dummy function name, then strip the function selector and return the encoded data.
const encoded = iface.encodeFunctionData('x', [metadataJson]);
process.stdout.write(`0x${encoded.slice(10)}`);