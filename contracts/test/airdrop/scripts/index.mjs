import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// (1)
const values = [
  ["0x5E38d087315217D5E1791553D8C3101A820C7E40", "1000000000000000000"],
  ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "1000000000000000000"],
  ["0x2FaC60B7bCcEc9b234A2f07448D3B2a045d621B9", "1000000000000000000"],
  ["0xd2ABa91375eC2C3f021525FeD8FAFdcd2bC08460", "1000000000000000000"],
  ["0xCe3827fFDC199d8EDce73de2517cdE8fbE79837E", "1000000000000000000"],
  ["0x669a0Ce817227375368F054109BF9bf5D6174eD3", "1000000000000000000"],
];

// (2)
const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

// (3)
console.log(tree.root);
