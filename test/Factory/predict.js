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

const { ethers } = require("hardhat");
const web3Utils = require("web3-utils");

/**
 * @param {any} salt
 * @returns {string}
 */
function prepareSalt(salt, call = "") {
  let a = web3Utils.soliditySha3(
    { t: "bytes", v: salt },
    { t: "bytes", v: call }
  );
  let b = call ? ethers.getBytes(call) : new Uint8Array();
  let c = ethers.solidityPackedKeccak256(["bytes32", "bytes"], [salt, b]);
  if (a !== c) {
    throw new Error("Ethers & web3 differs!");
  }
  return c;
}

function web3_create2(address, code, salt) {
  let a = web3Utils.soliditySha3(
    { t: "bytes1", v: "0xff" },
    { t: "address", v: address },
    { t: "bytes", v: salt },
    { t: "bytes", v: web3Utils.keccak256(code) }
  );
  if (!a) {
    return "";
  }
  return a.slice(26);
}

/**
 * @param {any} address
 * @param {import("ethers").BytesLike} code
 * @param {string} salt
 * @returns {string}
 */
function create2(address, code, salt) {
  let no_checksum_addr_web3 = web3_create2(address, code, salt);
  let no_checksum_addr = ethers
    .solidityPackedKeccak256(
      ["bytes1", "address", "bytes32", "bytes32"],
      ["0xff", address, salt, ethers.keccak256(code)]
    )
    .slice(26);

  if (no_checksum_addr_web3 !== no_checksum_addr) {
    throw new Error("Ethers & web3 differs!");
  }

  let checksum_addr = ethers.getAddress(no_checksum_addr);
  if (web3Utils.toChecksumAddress(no_checksum_addr_web3) !== checksum_addr) {
    throw new Error("Ethers & web3 differs!");
  }

  return checksum_addr;
}

/**
 * @param {any} address
 * @param {import("ethers").BytesLike} code
 * @param {any} salt
 * @param {string | undefined} call
 * @returns {string}
 */
function predict(address, code, salt, call = "") {
  return create2(address, code, prepareSalt(salt, call));
}

module.exports = {
  predict,
};
