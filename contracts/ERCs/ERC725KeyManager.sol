pragma solidity ^0.5.0;

import "./ERC725KeyBase.sol";

contract ERC725KeyManager is ERC725KeyBase
{
	/// @dev Add key data to the identity if key + purpose tuple doesn't already exist
	/// @param _key Key bytes to add
	/// @param _purpose Purpose to add
	/// @param _keyType Key type to add
	/// @return `true` if key was added, `false` if it already exists
	function addKey(
		bytes32 _key,
		uint256 _purpose,
		uint256 _keyType
	)
	public
	onlyManagement
	returns (bool success)
	{
		if (m_keys.find(_key, _purpose))
		{
			return false;
		}
		m_keys.add(_key, _purpose, _keyType);
		emit KeyAdded(_key, _purpose, _keyType);
		return true;
	}

	/// @dev Remove key data from the identity
	/// @param _key Key bytes to remove
	/// @param _purpose Purpose to remove
	/// @return `true` if key was found and removed, `false` if it wasn't found
	function removeKey(
		bytes32 _key,
		uint256 _purpose
	)
	public
	onlyManagement
	returns (bool success)
	{
		if (!m_keys.find(_key, _purpose))
		{
			return false;
		}
		uint256 keyType = m_keys.remove(_key, _purpose);
		emit KeyRemoved(_key, _purpose, keyType);
		return true;
	}

	/// @dev Add key data to the identity without checking if it already exists
	/// @param _key Key bytes to add
	/// @param _purpose Purpose to add
	/// @param _keyType Key type to add
	function _addKey(
		bytes32 _key,
		uint256 _purpose,
		uint256 _keyType
	)
	internal
	{
		m_keys.add(_key, _purpose, _keyType);
		emit KeyAdded(_key, _purpose, _keyType);
	}
}
