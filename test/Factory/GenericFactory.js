const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { predict } = require("./predict");

/**
 * @param {{ logs: any[]; }} txMined
 * @param {any} address
 * @param {string} name
 */
function extractEvents(txMined, address, name) {
  return txMined.logs.filter(
    (/** @type {{ address: any; eventName: any; }} */ ev) => {
      return ev.address == address && ev.eventName == name;
    }
  );
}

function random32() {
  return ethers.zeroPadValue(ethers.randomBytes(31), 32);
}

async function fixture() {
  const [owner, other] = await ethers.getSigners();

  const GenericFactoryInstance = await ethers.deployContract("GenericFactory");
  const GenericFactoryInstance_addr = await GenericFactoryInstance.getAddress();

  return { owner, other, GenericFactoryInstance, GenericFactoryInstance_addr };
}

async function fixture2() {
  const TestContractInstance = await ethers.deployContract("TestContract");

  /*
    deploy_tx.data == contract code + constructor parameters
  */
  let deploy_tx = TestContractInstance.deploymentTransaction();
  let code = deploy_tx?.data;

  let salt = ethers.hexlify(ethers.randomBytes(32));
  let value = ethers.hexlify(ethers.randomBytes(64));
  let call = TestContractInstance.interface.encodeFunctionData("set", [value]);

  return { code, salt, call };
}

describe("GenericFactory", async function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe("createContract", async function () {
    before(async function () {
      Object.assign(this, await loadFixture(fixture2));
    });

    it("predict address + success (first) + failure (duplicate)", async function () {
      // predict address
      let predictedAddress = predict(
        this.GenericFactoryInstance_addr,
        this.code,
        this.salt
      );
      let actualAddress = await this.GenericFactoryInstance.predictAddress(
        this.code,
        this.salt
      );
      expect(actualAddress).equal(predictedAddress);

      // success (first)
      let txMined = await this.GenericFactoryInstance.createContract(
        this.code,
        this.salt
      );
      let result = await txMined.wait();

      let events = extractEvents(
        result,
        this.GenericFactoryInstance_addr,
        "NewContract"
      );
      expect(events[0].args.addr).equal(predictedAddress);

      // failure (duplicate)
      await expect(
        this.GenericFactoryInstance.createContract(this.code, this.salt)
      ).to.be.revertedWithoutReason();
    });
  });

  describe("createContractAndCall", async function () {
    before(async function () {
      Object.assign(this, await loadFixture(fixture2));
    });

    it("predict address + success (first) + failure (duplicate)", async function () {
      // predict address
      let predictedAddress = predict(
        this.GenericFactoryInstance_addr,
        this.code,
        this.salt,
        this.call
      );
      let actualAddress =
        await this.GenericFactoryInstance.predictAddressWithCall(
          this.code,
          this.salt,
          this.call
        );
      expect(actualAddress).equal(predictedAddress);

      // success (first)
      let txMined = await this.GenericFactoryInstance.createContractAndCall(
        this.code,
        this.salt,
        this.call
      );
      let result = await txMined.wait();

      let events = extractEvents(
        result,
        this.GenericFactoryInstance_addr,
        "NewContract"
      );
      expect(events[0].args.addr).equal(predictedAddress);

      // failure (duplicate)
      await expect(
        this.GenericFactoryInstance.createContractAndCall(
          this.code,
          this.salt,
          this.call
        )
      ).to.be.revertedWithoutReason();
    });
  });
});
