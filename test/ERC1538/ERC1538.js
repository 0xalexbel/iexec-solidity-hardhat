const fs = require("fs");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * @param {{ type: string; components: any[]; }} entry
 */
function getSerializedObject(entry) {
  if (entry.type == "tuple") {
    return "(" + entry.components.map(getSerializedObject).join(",") + ")";
  } else {
    return entry.type;
  }
}

/**
 * @param {any[]} abi
 */
function getFunctionSignatures(abi) {
  return abi
    .filter((entry) => entry.type == "function")
    .filter((entry) => !entry.name.startsWith("coverage_0x")) // remove solidity coverage injected code
    .map(
      (entry) =>
        entry.name +
        "(" +
        entry.inputs.map(getSerializedObject).join(",") +
        ");"
    )
    .join("");
}

/**
 * @param {{ logs: any[]; }} txMined
 * @param {any} address
 * @param {string} name
 */
function extractEvents(txMined, address, name) {
  return txMined.logs.filter((/** @type {{ address: any; eventName: any; }} */ ev) => {
    return ev.address == address && ev.eventName == name;
  });
}

async function fixture() {
  const [owner, other] = await ethers.getSigners();

  // ERC1538UpdateInstance = await ERC1538Update.new();
  const ERC1538UpdateDelegateInstance = await ethers.deployContract(
    "ERC1538UpdateDelegate"
  );
  const ERC1538UpdateDelegateInstance_addr =
    await ERC1538UpdateDelegateInstance.getAddress();

  // ERC1538QueryInstance = await ERC1538Query.new();
  const ERC1538QueryDelegateInstance = await ethers.deployContract(
    "ERC1538QueryDelegate"
  );
  const ERC1538QueryDelegateInstance_addr =
    await ERC1538QueryDelegateInstance.getAddress();

  // ProxyInterface = await ERC1538Proxy.new(ERC1538UpdateInstance.address);
  const ProxyInterface = await ethers.deployContract("ERC1538Proxy", [
    ERC1538UpdateDelegateInstance_addr,
  ]);
  const ProxyInterface_addr = await ProxyInterface.getAddress();

  // UpdateInterface = await ERC1538Update.at(ProxyInterface.address);
  const ERC1538UpdateDelegateContractFactory = await ethers.getContractFactory(
    "ERC1538UpdateDelegate"
  );
  const UpdateInterface =
    ERC1538UpdateDelegateContractFactory.attach(ProxyInterface_addr);

  // QueryInterface = await ERC1538Query.at(ProxyInterface.address);
  const ERC1538QueryDelegateContractFactory = await ethers.getContractFactory(
    "ERC1538QueryDelegate"
  );
  const QueryInterface =
    ERC1538QueryDelegateContractFactory.attach(ProxyInterface_addr);

  // TestContractInstance = await TestContract.new();
  const TestContractInstance = await ethers.deployContract("TestContract");
  const TestContractInstance_addr = await TestContractInstance.getAddress();

  const ERC1538QueryDelegate_artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/ERC1538/ERC1538Modules/ERC1538Query.sol/ERC1538QueryDelegate.json",
      "utf8"
    )
  );

  await UpdateInterface.updateContract(
    ERC1538QueryDelegateInstance_addr,
    getFunctionSignatures(ERC1538QueryDelegate_artifact.abi),
    "Linking ERC1538QueryDelegate"
  );

  const signatures = {
    "updateContract(address,string,string)": ERC1538UpdateDelegateInstance_addr,
    "delegateAddress(string)": ERC1538QueryDelegateInstance_addr,
    "delegateAddresses()": ERC1538QueryDelegateInstance_addr,
    "delegateFunctionSignatures(address)": ERC1538QueryDelegateInstance_addr,
    "functionById(bytes4)": ERC1538QueryDelegateInstance_addr,
    "functionByIndex(uint256)": ERC1538QueryDelegateInstance_addr,
    "functionExists(string)": ERC1538QueryDelegateInstance_addr,
    "functionSignatures()": ERC1538QueryDelegateInstance_addr,
    "owner()": ERC1538QueryDelegateInstance_addr,
    "renounceOwnership()": ERC1538QueryDelegateInstance_addr,
    "totalFunctions()": ERC1538QueryDelegateInstance_addr,
    "transferOwnership(address)": ERC1538QueryDelegateInstance_addr,
  };

  const test_signatures = {
    "transferOwnership(address)": ERC1538QueryDelegateInstance_addr,
  };

  return {
    owner,
    other,
    ERC1538UpdateDelegateInstance,
    ERC1538QueryDelegateInstance,
    TestContractInstance,
    ProxyInterface,
    UpdateInterface,
    QueryInterface,
    signatures,
    test_signatures,
  };
}

describe("ERC1538", function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it("emits ownership transfer events during construction", async function () {
    await expect(this.ERC1538UpdateDelegateInstance.deploymentTransaction())
      .to.emit(this.ERC1538UpdateDelegateInstance, "OwnershipTransferred")
      .withArgs(ethers.ZeroAddress, this.owner)
      .and.to.emit(this.ERC1538UpdateDelegateInstance, "OwnershipTransferred")
      .withArgs(this.owner, ethers.ZeroAddress);
  });

  it("Ownership", async function () {
    expect(await this.ERC1538UpdateDelegateInstance.owner()).to.equal(
      ethers.ZeroAddress
    );
    expect(await this.ERC1538QueryDelegateInstance.owner()).to.equal(
      ethers.ZeroAddress
    );
    expect(await this.ProxyInterface.owner()).to.equal(this.owner);
    expect(await this.UpdateInterface.owner()).to.equal(this.owner);
    expect(await this.QueryInterface.owner()).to.equal(this.owner);
  });

  it("ERC1538Query - totalFunctions", async function () {
    expect(await this.QueryInterface.totalFunctions()).to.equal(
      Object.keys(this.signatures).length
    );
  });

  it("ERC1538Query - functionByIndex", async function () {
    for (const i in Object.keys(this.signatures)) {
      const [signature, delegate] = Object.entries(this.signatures)[i];
      const id = ethers
        .solidityPackedKeccak256(["string"], [signature])
        .substring(0, 10);
      const result = await this.QueryInterface.functionByIndex(i);
      expect(result.signature).to.equal(signature);
      expect(result.id).to.equal(id);
      expect(result.delegate).to.equal(delegate);
    }
  });

  it("ERC1538Query - functionById", async function () {
    for (const i in Object.keys(this.signatures)) {
      const [signature, delegate] = Object.entries(this.signatures)[i];
      const id = ethers
        .solidityPackedKeccak256(["string"], [signature])
        .substring(0, 10);
      const result = await this.QueryInterface.functionById(id);
      expect(result.signature).to.equal(signature);
      expect(result.id).to.equal(id);
      expect(result.delegate).to.equal(delegate);
    }
  });

  it("ERC1538Query - functionExists", async function () {
    for (const signature of Object.keys(this.signatures)) {
      expect(await this.QueryInterface.functionExists(signature)).to.equal(
        true
      );
    }
  });

  it("ERC1538Query - functionSignatures", async function () {
    expect(await this.QueryInterface.functionSignatures()).to.equal(
      [...Object.keys(this.signatures), ""].join(";")
    );
  });

  it("ERC1538Query - delegateFunctionSignatures", async function () {
    for (let delegate of await this.QueryInterface.delegateAddresses()) {
      expect(
        await this.QueryInterface.delegateFunctionSignatures(delegate)
      ).to.equal(
        [
          ...Object.entries(this.signatures)
            .filter(([s, d]) => d == delegate)
            .map(([s, d]) => s),
          "",
        ].join(";")
      );
    }
  });

  it("ERC1538Query - delegateAddress", async function () {
    for (const [signature, delegate] of Object.entries(this.signatures)) {
      expect(await this.QueryInterface.delegateAddress(signature)).to.equal(
        delegate
      );
    }
  });

  it("ERC1538Query - delegateAddresses", async function () {
    expect(await this.QueryInterface.delegateAddresses()).to.deep.equal(
      Object.values(this.signatures).filter((v, i, a) => a.indexOf(v) === i)
    );
  });

  it("ERC1538 - receive", async function () {
    let test_addr = await this.TestContractInstance.getAddress();
    let update_addr = await this.UpdateInterface.getAddress();

    let tx = await this.UpdateInterface.updateContract(
      test_addr,
      "receive;",
      "adding receive delegate"
    );
    let result = await tx.wait();
    let evs = extractEvents(result, update_addr, "FunctionUpdate");

    expect(evs).lengthOf(1);
    expect(evs[0].args.functionId).to.equal("0x00000000");
    expect(evs[0].args.oldDelegate).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(evs[0].args.newDelegate).to.equal(test_addr);
    expect(evs[0].args.functionSignature).to.equal("receive");

    evs = extractEvents(result, update_addr, "CommitMessage");
    expect(evs).lengthOf(1);
    expect(evs[0].args.message).to.equal("adding receive delegate");

    tx = await this.owner.sendTransaction({
      to: update_addr,
      value: 1,
      data: "0x",
      gasLimit: 500000,
    });
    result = await tx.wait();

    expect(result.logs[0].topics[0]).equal(
      ethers.keccak256(ethers.toUtf8Bytes("Receive(uint256,bytes)"))
    );
  });

  it("ERC1538 - fallback", async function () {
    let test_addr = await this.TestContractInstance.getAddress();
    let update_addr = await this.UpdateInterface.getAddress();

    let tx = await this.UpdateInterface.updateContract(
      test_addr,
      "fallback;",
      "adding fallback delegate"
    );
    let result = await tx.wait();

    let evs = extractEvents(result, update_addr, "FunctionUpdate");
    expect(evs).lengthOf(1);
    expect(evs[0].args.functionId).to.equal("0xffffffff");
    expect(evs[0].args.oldDelegate).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(evs[0].args.newDelegate).to.equal(test_addr);
    expect(evs[0].args.functionSignature).to.equal("fallback");

    evs = extractEvents(result, update_addr, "CommitMessage");
    expect(evs).lengthOf(1);
    expect(evs[0].args.message).to.equal("adding fallback delegate");

    tx = await this.owner.sendTransaction({
      to: update_addr,
      value: 1,
      data: "0xc0ffee",
      gasLimit: 500000,
    });
    result = await tx.wait();

    expect(result.logs[0].topics[0]).equal(
      ethers.keccak256(ethers.toUtf8Bytes("Fallback(uint256,bytes)"))
    );
  });

  it("ERC1538 - no update", async function () {
    let test_addr = await this.TestContractInstance.getAddress();
    let update_addr = await this.UpdateInterface.getAddress();

    // Add fallback
    let tx = await this.UpdateInterface.updateContract(
      test_addr,
      "fallback;",
      "adding fallback delegate"
    );
    let result = await tx.wait();
    let evs = extractEvents(result, update_addr, "FunctionUpdate");

    // Add again, test no change
    tx = await this.UpdateInterface.updateContract(
      test_addr,
      "fallback;",
      "no changes"
    );
    result = await tx.wait();

    evs = extractEvents(result, update_addr, "FunctionUpdate");
    expect(evs).lengthOf(0);

    evs = extractEvents(result, update_addr, "CommitMessage");
    expect(evs).lengthOf(1);
    expect(evs[0].args.message).to.equal("no changes");
  });

  it("ERC1538 - remove fallback", async function () {
    let test_addr = await this.TestContractInstance.getAddress();
    let update_addr = await this.UpdateInterface.getAddress();

    // Add fallback
    let tx = await this.UpdateInterface.updateContract(
      test_addr,
      "fallback;",
      "adding fallback delegate"
    );
    let result = await tx.wait();
    let evs = extractEvents(result, update_addr, "FunctionUpdate");

    // Remove fallback
    tx = await this.UpdateInterface.updateContract(
      "0x0000000000000000000000000000000000000000",
      "fallback;",
      "removing"
    );
    result = await tx.wait();

    evs = extractEvents(result, update_addr, "FunctionUpdate");
    expect(evs).lengthOf(1);
    expect(evs[0].args.oldDelegate).to.equal(test_addr);
    expect(evs[0].args.newDelegate).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(evs[0].args.functionSignature).to.equal("fallback");

    evs = extractEvents(result, update_addr, "CommitMessage");
    expect(evs).lengthOf(1);
    expect(evs[0].args.message).to.equal("removing");
  });
});
