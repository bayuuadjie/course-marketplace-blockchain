/**
 * web3Connector.js
 * -----------------------------------------------------------
 * Modul "konektor" yang menjembatani antarmuka (frontend Next.js)
 * dengan blockchain melalui MetaMask, menggunakan library ethers.js.
 * -----------------------------------------------------------
 */

import { ethers } from "ethers";
import contractConfig from "./contractConfig.json";

const LOCAL_CHAIN_ID_HEX = "0x7A69"; // 31337 dalam hex (chain id Hardhat)
const LOCAL_RPC_URL = "http://127.0.0.1:8545";

/**
 * Mengecek apakah MetaMask (atau wallet kompatibel EIP-1193) terpasang
 */
export function isMetaMaskInstalled() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

/**
 * Meminta koneksi akun ke MetaMask dan mengembalikan alamat akun aktif
 */
export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask tidak ditemukan. Silakan install ekstensi MetaMask di browser.");
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

  // Pastikan network yang dipakai adalah network lokal Hardhat
  await ensureLocalNetwork();

  return accounts[0];
}

/**
 * Memastikan MetaMask terhubung ke network lokal Hardhat (chainId 31337).
 * Jika network belum ada di MetaMask, otomatis ditambahkan.
 */
export async function ensureLocalNetwork() {
  if (!isMetaMaskInstalled()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LOCAL_CHAIN_ID_HEX }]
    });
  } catch (switchError) {
    // error code 4902 = network belum dikenal oleh MetaMask
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: LOCAL_CHAIN_ID_HEX,
            chainName: "Hardhat Local",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [LOCAL_RPC_URL]
          }
        ]
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Mengambil provider ethers.js dari MetaMask (untuk operasi read-only)
 */
export function getProvider() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask tidak ditemukan.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Mengambil signer ethers.js (dibutuhkan untuk transaksi yang mengubah state)
 */
export async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

/**
 * Mengambil instance contract CourseMarketplace siap pakai.
 * @param {boolean} withSigner - true jika butuh kirim transaksi (write), false untuk read-only
 */
export async function getContract(withSigner = false) {
  if (!contractConfig.address) {
    throw new Error(
      "Alamat contract belum tersedia. Jalankan 'npm run deploy:local' di folder backend terlebih dahulu."
    );
  }

  const provider = getProvider();

  // Validasi 1: pastikan MetaMask berada di network yang sama dengan contract (chainId 31337)
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== Number(contractConfig.chainId)) {
    throw new Error(
      `MetaMask sedang terhubung ke network yang salah (chainId ${network.chainId}). ` +
        `Ganti ke "Hardhat Local" (chainId ${contractConfig.chainId}) lalu coba lagi.`
    );
  }

  // Validasi 2: pastikan benar-benar ada kode contract di address tersebut.
  // Ini akar penyebab error "BAD_DATA value=0x" — biasanya terjadi karena
  // node Hardhat di-restart (state ter-reset) tapi contractConfig.json masih
  // menyimpan address lama, atau lupa deploy ulang.
  const code = await provider.getCode(contractConfig.address);
  if (code === "0x") {
    throw new Error(
      "Contract tidak ditemukan di address ini. Kemungkinan node Hardhat baru saja di-restart " +
        "(state ter-reset). Jalankan ulang 'npm run deploy:local' di folder backend, lalu refresh halaman ini."
    );
  }

  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
  }

  return new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
}

/**
 * Helper untuk listen perubahan akun / network di MetaMask.
 * Berguna agar UI otomatis update saat user pindah akun di MetaMask.
 */
export function subscribeToWalletEvents({ onAccountsChanged, onChainChanged }) {
  if (!isMetaMaskInstalled()) return () => {};

  if (onAccountsChanged) window.ethereum.on("accountsChanged", onAccountsChanged);
  if (onChainChanged) window.ethereum.on("chainChanged", onChainChanged);

  // fungsi untuk unsubscribe (dipanggil saat komponen unmount)
  return () => {
    if (onAccountsChanged) window.ethereum.removeListener("accountsChanged", onAccountsChanged);
    if (onChainChanged) window.ethereum.removeListener("chainChanged", onChainChanged);
  };
}

/** Helper format: wei -> ETH (string) */
export function weiToEth(wei) {
  return ethers.formatEther(wei);
}

/** Helper format: ETH (string/number) -> wei (BigInt) */
export function ethToWei(eth) {
  return ethers.parseEther(eth.toString());
}

export { contractConfig };
