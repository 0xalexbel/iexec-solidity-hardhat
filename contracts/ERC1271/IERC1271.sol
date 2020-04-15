pragma solidity ^0.6.0;

interface IERC1271
{
	function isValidSignature(bytes calldata data, bytes calldata signature) external view returns (bytes4 magicValue);
}

interface IERC1654
{
	function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}
