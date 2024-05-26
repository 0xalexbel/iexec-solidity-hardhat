// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2020 IEXEC BLOCKCHAIN TECH                                       *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/

pragma solidity ^0.8.0;

import "../ERC1538Module.sol";


interface ERC1538Query
{
	function totalFunctions            (                           ) external view returns(uint256);
	function functionByIndex           (uint256          _index    ) external view returns(string memory, bytes4, address);
	function functionById              (bytes4           _id       ) external view returns(string memory, bytes4, address);
	function functionExists            (string  calldata _signature) external view returns(bool);
	function functionSignatures        (                           ) external view returns(string memory);
	function delegateFunctionSignatures(address          _delegate ) external view returns(string memory);
	function delegateAddress           (string  calldata _signature) external view returns(address);
	function delegateAddresses         (                           ) external view returns(address[] memory);
}

contract ERC1538QueryDelegate is ERC1538Query, ERC1538Module
{
	function totalFunctions()
	external override view returns(uint256)
	{
		return _length();
	}

	function functionByIndex(uint256 _index)
	external override view returns(string memory signature, bytes4 id, address delegate)
	{
		(bytes4 funcId, address funcDelegate, bytes memory funcSignature) = _at(_index + 1);
		return (string(funcSignature), funcId, funcDelegate);
	}

	function functionById(bytes4 _funcId)
	external override view returns(string memory signature, bytes4 id, address delegate)
	{
	    return (string(_value2(_funcId)), _funcId, _value1(_funcId));
		//return (string(m_funcs.value2(_funcId)), _funcId, m_funcs.value1(_funcId));
	}

	function functionExists(string calldata _funcSignature)
	external override view returns(bool)
	{
		return _contains(bytes4(keccak256(bytes(_funcSignature))));
	}

	function delegateAddress(string calldata _funcSignature)
	external override view returns(address)
	{
		return _value1(bytes4(keccak256(bytes(_funcSignature))));
	}

	function functionSignatures()
	external override view returns(string memory)
	{
        uint256 len = _length();
		uint256 signaturesLength = 0;
		for (uint256 i = 1; i <= len; ++i)
		{
			signaturesLength += _value2AtIndex(i).length + 1; // EDIT
		}

		bytes memory signatures = new bytes(signaturesLength);
		uint256 charPos = 0;
		for (uint256 i = 1; i <= len; ++i)
		{
			bytes memory signature = _value2AtIndex(i);
			for (uint256 c = 0; c < signature.length; ++c)
			{
				signatures[charPos] = signature[c];
				++charPos;
			}
			signatures[charPos] = 0x3B;
			++charPos;
		}

		return string(signatures);
	}

	function delegateFunctionSignatures(address _delegate)
	external override view returns(string memory)
	{
        uint256 len = _length();
		bytes[] memory delegateSignatures = new bytes[](len);
		uint256 delegateSignaturesLength = 0;

		uint256 signaturesLength = 0;
		for (uint256 i = 1; i <= len; ++i)
		{
			(, address funcDelegate, bytes memory funcSignature) = _at(i);
			if (_delegate == funcDelegate)
			{
				signaturesLength += funcSignature.length + 1;
				delegateSignatures[delegateSignaturesLength] = funcSignature;
				++delegateSignaturesLength;
			}
		}

		bytes memory signatures = new bytes(signaturesLength);
		uint256 charPos = 0;
		for (uint256 i = 0; i < delegateSignaturesLength; ++i)
		{
			bytes memory signature = delegateSignatures[i];
			for (uint256 c = 0; c < signature.length; ++c)
			{
				signatures[charPos] = signature[c];
				++charPos;
			}
			signatures[charPos] = 0x3B;
			++charPos;
		}

		return string(signatures);
	}

	function delegateAddresses()
	external override view returns(address[] memory)
	{
        uint256 len = _length();
		address[] memory delegatesBucket = new address[](len);

		uint256 numDelegates = 0;
		for (uint256 i = 1; i <= len; ++i)
		{
			address delegate = _value1AtIndex(i);
			bool seen = false;
			for (uint256 j = 0; j < numDelegates; ++j)
			{
				if (delegate == delegatesBucket[j])
				{
					seen = true;
					break;
				}
			}
			if (seen == false)
			{
				delegatesBucket[numDelegates] = delegate;
				++numDelegates;
			}
		}

		address[] memory delegates = new address[](numDelegates);
		for (uint256 i = 0; i < numDelegates; ++i)
		{
			delegates[i] = delegatesBucket[i];
		}
		return delegates;
	}
}
