const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CourseMarketplace ke network:", hre.network.name);

  const CourseMarketplace = await hre.ethers.getContractFactory("CourseMarketplace");
  const contract = await CourseMarketplace.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CourseMarketplace berhasil di-deploy di address:", address);

  // Ambil ABI dari artifact hasil compile
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CourseMarketplace.sol/CourseMarketplace.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Tulis konfigurasi (address + ABI) ke folder "konektor" agar
  // frontend (antarmuka) bisa langsung memakainya.
  const konektorDir = path.join(__dirname, "../../konektor");
  const outputPath = path.join(konektorDir, "contractConfig.json");

  const config = {
    address: address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    abi: artifact.abi
  };

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log("Konfigurasi contract berhasil ditulis ke:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
