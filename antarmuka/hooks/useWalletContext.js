import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connectWallet, isMetaMaskInstalled, subscribeToWalletEvents } from "konektor";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = useCallback(async () => {
    setError("");
    setConnecting(true);
    try {
      const acc = await connectWallet();
      setAccount(acc);
    } catch (err) {
      setError(err.message || "Gagal terhubung ke MetaMask");
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    // Cek apakah sudah pernah terhubung sebelumnya (tanpa popup)
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
      })
      .catch(() => {});

    const unsubscribe = subscribeToWalletEvents({
      onAccountsChanged: (accounts) => setAccount(accounts.length > 0 ? accounts[0] : null),
      onChainChanged: () => window.location.reload()
    });

    return unsubscribe;
  }, []);

  return (
    <WalletContext.Provider value={{ account, connecting, error, connect: handleConnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
