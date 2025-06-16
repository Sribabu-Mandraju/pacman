import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletContext";
import {
  FaSpinner,
  FaArrowLeft,
  FaEthereum,
  FaCoins,
  FaCheckCircle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaNetworkWired,
  FaLink,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getContractInstance, currentNetwork } from "../config/contract.config";

const AdminPage = () => {
  const navigate = useNavigate();
  const { account, signer } = useWallet();
  const [activeTab, setActiveTab] = useState("eth");
  const [isOwner, setIsOwner] = useState(false);
  const [ethBalance, setEthBalance] = useState("0");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState({
    status: "",
    message: "",
    hash: "",
  });
  const [totalDeposited, setTotalDeposited] = useState("0");

  useEffect(() => {
    const checkOwner = async () => {
      if (!account || !signer) return;
      try {
        const { address, abi } = getContractInstance();
        const contract = new ethers.Contract(address, abi, signer);
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());

        // Get ETH balance
        const balance = await signer.provider.getBalance(address);
        setEthBalance(ethers.formatEther(balance));

        // Get total USDT deposited
        const total = await contract.totalDeposited();
        setTotalDeposited(ethers.formatUnits(total, 6));

        // Fetch USDT address from API
        try {
          const response = await fetch("http://localhost:5000/market/usdt");
          const data = await response.json();
          setUsdtAddress(data.usdt);
        } catch (error) {
          console.error("Error fetching USDT address:", error);
        }
      } catch (err) {
        console.error("Error checking owner status:", err);
      }
    };

    checkOwner();
  }, [account, signer]);

  const handleCollectETH = async () => {
    if (!account || !signer) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { address, abi } = getContractInstance();
      const contract = new ethers.Contract(address, abi, signer);

      setTxStatus({
        status: "pending",
        message: "Preparing transaction...",
        hash: "",
      });

      const tx = await contract.collectFeesNUCLEAR();
      setTxStatus({
        status: "confirming",
        message: "Transaction submitted! Waiting for confirmation...",
        hash: tx.hash,
      });

      toast.info(
        <div>
          <p>Transaction submitted!</p>
          <a
            href={`${currentNetwork.chain.blockExplorers?.default.url}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300"
          >
            View on Explorer
          </a>
        </div>
      );

      await tx.wait();
      setTxStatus({
        status: "success",
        message: "ETH collected successfully!",
        hash: tx.hash,
      });
      toast.success("ETH collected successfully!");

      // Refresh ETH balance
      const balance = await signer.provider.getBalance(address);
      setEthBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Error collecting ETH:", err);
      let errorMessage = "Failed to collect ETH";
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (err.code === -32603) {
        errorMessage =
          "Transaction failed: Insufficient gas or invalid parameters";
      } else if (err.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      }

      setTxStatus({
        status: "error",
        message: errorMessage,
        hash: err.transaction?.hash || "",
      });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectUSDT = async () => {
    if (!account || !signer) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!usdtAmount || isNaN(usdtAmount) || parseFloat(usdtAmount) <= 0) {
      toast.error("Please enter a valid USDT amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { address, abi } = getContractInstance();
      const contract = new ethers.Contract(address, abi, signer);

      setTxStatus({
        status: "pending",
        message: "Preparing transaction...",
        hash: "",
      });

      const tx = await contract.collectUSDTNuclear(
        import.meta.env.VITE_USDT_CONTRACT,
        ethers.parseUnits(usdtAmount, 6)
      );
      setTxStatus({
        status: "confirming",
        message: "Transaction submitted! Waiting for confirmation...",
        hash: tx.hash,
      });

      toast.info(
        <div>
          <p>Transaction submitted!</p>
          <a
            href={`${currentNetwork.chain.blockExplorers?.default.url}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300"
          >
            View on Explorer
          </a>
        </div>
      );

      await tx.wait();
      setTxStatus({
        status: "success",
        message: "USDT collected successfully!",
        hash: tx.hash,
      });
      toast.success("USDT collected successfully!");

      // Reset form
      setUsdtAmount("");
    } catch (err) {
      console.error("Error collecting USDT:", err);
      let errorMessage = "Failed to collect USDT";
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (err.code === -32603) {
        errorMessage =
          "Transaction failed: Insufficient gas or invalid parameters";
      } else if (err.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      }

      setTxStatus({
        status: "error",
        message: errorMessage,
        hash: err.transaction?.hash || "",
      });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetUSDT = async () => {
    if (!account || !signer) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!ethers.isAddress(usdtAddress)) {
      toast.error("Please enter a valid USDT contract address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { address, abi } = getContractInstance();
      const contract = new ethers.Contract(address, abi, signer);

      setTxStatus({
        status: "pending",
        message: "Preparing transaction...",
        hash: "",
      });

      const tx = await contract.setUSDT(usdtAddress);
      setTxStatus({
        status: "confirming",
        message: "Transaction submitted! Waiting for confirmation...",
        hash: tx.hash,
      });

      toast.info(
        <div>
          <p>Transaction submitted!</p>
          <a
            href={`${currentNetwork.chain.blockExplorers?.default.url}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300"
          >
            View on Explorer
          </a>
        </div>
      );

      await tx.wait();
      setTxStatus({
        status: "success",
        message: "USDT address set successfully!",
        hash: tx.hash,
      });
      toast.success("USDT address set successfully!");

      // Reset form
      setUsdtAddress("");
    } catch (err) {
      console.error("Error setting USDT address:", err);
      let errorMessage = "Failed to set USDT address";
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (err.code === -32603) {
        errorMessage =
          "Transaction failed: Insufficient gas or invalid parameters";
      } else if (err.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      }

      setTxStatus({
        status: "error",
        message: errorMessage,
        hash: err.transaction?.hash || "",
      });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h1>
            <p className="text-gray-400">
              You must be the contract owner to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </button>
          <div className="flex items-center text-gray-400 text-sm">
            <FaNetworkWired className="mr-2" />
            {currentNetwork.name}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Manage contract funds and tokens
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab("eth")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "eth"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <FaEthereum className="mr-2" />
                Collect ETH
              </div>
            </button>
            <button
              onClick={() => setActiveTab("usdt")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "usdt"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <FaCoins className="mr-2" />
                Collect USDT
              </div>
            </button>
            <button
              onClick={() => setActiveTab("setusdt")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "setusdt"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <FaLink className="mr-2" />
                Set USDT
              </div>
            </button>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            {/* ETH Collection Tab */}
            {activeTab === "eth" && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FaEthereum className="text-yellow-400 text-xl" />
                      <h3 className="text-lg font-semibold text-white">
                        Contract ETH Balance
                      </h3>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">
                      {parseFloat(ethBalance).toFixed(4)} ETH
                    </span>
                  </div>
                  <button
                    onClick={handleCollectETH}
                    disabled={isSubmitting || parseFloat(ethBalance) === 0}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm ${
                      isSubmitting || parseFloat(ethBalance) === 0
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      "Collect ETH"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* USDT Collection Tab */}
            {activeTab === "usdt" && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FaCoins className="text-yellow-400 text-xl" />
                      <h3 className="text-lg font-semibold text-white">
                        Contract USDT Balance
                      </h3>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">
                      {parseFloat(totalDeposited).toFixed(2)} USDT
                    </span>
                  </div>

                  {/* Info Section */}
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                      Contract Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                          Current USDT Address
                        </span>
                        <span className="text-white break-all text-sm">
                          {usdtAddress || "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Deposited</span>
                        <span className="text-white">
                          {parseFloat(totalDeposited).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <input
                      type="number"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      placeholder="Enter USDT amount"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                      disabled={isSubmitting}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      USDT
                    </div>
                  </div>
                  <button
                    onClick={handleCollectUSDT}
                    disabled={isSubmitting || !usdtAmount}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm ${
                      isSubmitting || !usdtAmount
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      "Collect USDT"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* USDT Address Setting Tab */}
            {activeTab === "setusdt" && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FaLink className="text-yellow-400 text-xl" />
                    <h3 className="text-lg font-semibold text-white">
                      Set USDT Contract Address
                    </h3>
                  </div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      placeholder="Enter USDT contract address"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    Current USDT Address:{" "}
                    <span className="text-yellow-400 break-all">
                      {usdtAddress || "Not set"}
                    </span>
                  </div>
                  <button
                    onClick={handleSetUSDT}
                    disabled={isSubmitting || !usdtAddress}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm ${
                      isSubmitting || !usdtAddress
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      "Set USDT Address"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {txStatus.status && (
              <div
                className={`p-3 rounded-lg ${
                  txStatus.status === "error"
                    ? "bg-red-500/10 border border-red-500/20"
                    : txStatus.status === "success"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {txStatus.status === "pending" ||
                  txStatus.status === "confirming" ? (
                    <FaSpinner className="animate-spin text-yellow-400 mt-0.5 text-sm" />
                  ) : txStatus.status === "success" ? (
                    <FaCheckCircle className="text-green-400 mt-0.5 text-sm" />
                  ) : (
                    <FaTimesCircle className="text-red-400 mt-0.5 text-sm" />
                  )}
                  <div>
                    <p
                      className={`text-xs ${
                        txStatus.status === "error"
                          ? "text-red-400"
                          : txStatus.status === "success"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {txStatus.message}
                    </p>
                    {txStatus.hash && (
                      <a
                        href={`${currentNetwork.chain.blockExplorers?.default.url}/tx/${txStatus.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 text-xs mt-0.5 flex items-center"
                      >
                        <FaExternalLinkAlt className="mr-1 text-xs" />
                        View on Explorer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
