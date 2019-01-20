pragma solidity ^0.5.0;

import "../Libs/SafeMath.sol";
import "../Libs/ECDSALib.sol";

import "../ERC20_Token/IERC20.sol";
import "../ERC725_IdentityProxy/ERC725.sol";
import "./IERC1077Refund.sol";

contract ERC1077Refund is IERC1077Refund, ERC725
{
	using SafeMath for uint256;
	using ECDSALib for bytes32;

	uint256 m_lastNonce;
	uint256 m_lastTimestamp;

	function lastNonce()
	external view returns (uint256)
	{
		return m_lastNonce;
	}

	function lastTimestamp()
	external view returns (uint256)
	{
		return m_lastNonce;
	}

	function executeSigned(
		address        to,
		uint256        value,
		bytes calldata data,
		uint256        nonce,
		uint256        gasPrice,
		address        gasToken,
		uint256        gasLimit,
		OperationType  operationType,
		bytes calldata signatures)
	external returns (bytes32)
	{
		uint256 gasBefore = gasleft();

		// Check nonce
		require(nonce == m_lastNonce, "Invalid nonce");

		// Hash message
		bytes32 messageHash = calculateMessageHash(
			address(this),
			to,
			value,
			data,
			nonce,
			gasPrice,
			gasToken,
			gasLimit,
			operationType);

		// Check signature
		bytes32 signerKey = addrToKey(messageHash.toEthSignedMessageHash().recover(signatures));
		if (to == address(this))
		{
			require(m_keys.find(signerKey, MANAGEMENT_KEY));
		}
		else
		{
			require(m_keys.find(signerKey, ACTION_KEY));
		}

		// Perform call
		bool success;
		// bytes memory resultdata;
		(success, /*resultdata*/) = to.call.value(value)(data);

		// Report
		emit ExecutedSigned(messageHash, nonce, success);
		m_lastNonce++;
		m_lastTimestamp = now;

		refund(gasBefore.sub(gasleft()), gasPrice, gasToken);
		return messageHash;
	}

	function calculateMessageHash(
		address       from,
		address       to,
		uint256       value,
		bytes memory  data,
		uint256       nonce,
		uint256       gasPrice,
		address       gasToken,
		uint256       gasLimit,
		OperationType operationType)
	public pure returns (bytes32)
	{
		return keccak256(abi.encodePacked(
			from,
			to,
			value,
			keccak256(data),
			nonce,
			gasPrice,
			gasToken,
			gasLimit,
			uint256(operationType)
		));
	}

	function refund(uint256 gasUsed, uint256 gasPrice, address gasToken)
	private
	{
		if (gasToken != address(0))
		{
			IERC20 token = IERC20(gasToken);
			token.transfer(msg.sender, gasUsed.mul(gasPrice));
		}
		else
		{
			msg.sender.transfer(gasUsed.mul(gasPrice));
		}
	}
}