export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getDisplayName(address) {
  if (!address) return "";
  if (typeof window !== "undefined") {
    const savedName = localStorage.getItem(`userName_${address.toLowerCase()}`);
    if (savedName) return savedName;
  }
  return shortenAddress(address);
}
