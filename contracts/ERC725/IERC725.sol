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

interface IERC725
{
	event DataChanged(bytes32 indexed key, bytes32 indexed value);
	event ContractCreated(address indexed contractAddress);

	function getData(bytes32 _key) external view returns (bytes32 _value);
	function setData(bytes32 _key, bytes32 _value) external;
	function execute(uint256 _operationType, address _to, uint256 _value, bytes calldata _data) external;
}
