import React from "react";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import WebApp from '@twa-dev/sdk';



import Landing from "./pages/WelcomePage";
import DepositPage from "./pages/depositPage";
import RedeemPage from "./pages/RedeemPage";
import UserDeposits from "./pages/UserDeposits";
import SetROIPage from "./pages/SetROIPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import Pacman from "./pages/Pacman";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Packman2 from "./pages/Pacman2";
const App = () => {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Packman2 />} />
          {/* <Route path="/deposit" element={<DepositPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
          <Route path="/user-deposits" element={<UserDeposits />} />
          <Route path="/set-roi" element={<SetROIPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<NotFoundPage />} /> */}
        </Routes>
      </Router>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </WalletProvider>
  );
};

export default App;
