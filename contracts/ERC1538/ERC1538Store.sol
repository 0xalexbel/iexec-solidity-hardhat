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

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "solstruct/contracts/libs/LibMap2.bytes4.address.bytes.sol";

contract ERC1538Store is Ownable {
    using LibMap2_bytes4_address_bytes for LibMap2_bytes4_address_bytes.map;

    LibMap2_bytes4_address_bytes.map private m_funcs;

    function _value1AtIndex(uint256 _index) internal view returns (address) {
        (, address funcDelegate) = m_funcs.tryGet1(m_funcs.keyAt(_index));
        return funcDelegate;
    }

    function _value2AtIndex(
        uint256 _index
    ) internal view returns (bytes memory) {
        (, bytes memory funcSignature) = m_funcs.tryGet2(m_funcs.keyAt(_index));
        return funcSignature;
    }

    function _contains(bytes4 _funcId) internal view returns (bool) {
        return m_funcs.contains(_funcId);
    }

    function _value1(bytes4 _funcId) internal view returns (address) {
        (, address funcDelegate) = m_funcs.tryGet1(_funcId);
        return funcDelegate;
    }

    function _value2(bytes4 _funcId) internal view returns (bytes memory) {
        (, bytes memory funcSignature) = m_funcs.tryGet2(_funcId);
        return funcSignature;
    }

    function _at(
        uint256 _index
    ) internal view returns (bytes4, address, bytes memory) {
        return m_funcs.at(_index);
    }

    function _del(bytes4 _funcId) internal {
        m_funcs.del(_funcId);
    }

    function _set(
        bytes4 _funcId,
        address _funcDelegate,
        bytes memory _funcSignatureAsBytes
    ) internal {
        m_funcs.set(_funcId, _funcDelegate, _funcSignatureAsBytes);
    }

    function _length() internal view returns (uint256) {
        return m_funcs.length();
    }
}