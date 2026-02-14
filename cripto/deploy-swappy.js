const { ethers } = require("hardhat");

async function main() {
  const treasury = "0xYourTreasury";          // troque
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 SWAPPY
  const maxTx = ethers.parseUnits("20000", 18);           // 2% do supply; ou 0 para desligar

  const SWAPPY = await ethers.getContractFactory("SWAPPY");
  const swappy = await SWAPPY.deploy(treasury, initialSupply, maxTx);
  await swappy.waitForDeployment();

  console.log("SWAPPY deployed to:", await swappy.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
