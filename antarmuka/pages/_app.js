import "../styles/globals.css";
import { WalletProvider } from "../hooks/useWalletContext";
import Navbar from "../components/Navbar";

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Navbar />
      <Component {...pageProps} />
      <footer>course-marketplace-dapp · jaringan simulasi Hardhat (chainId 31337)</footer>
    </WalletProvider>
  );
}
