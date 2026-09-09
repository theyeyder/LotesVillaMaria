import {
  CircleDollarSign,
} from "lucide-react";

import "./Navbar.css";

export default function Navbar({
  onNewPayment,
}) {
  return (
    <header className="navbar">

      <div className="navbar-actions">

        <button
          type="button"
          className="navbar-payment-button"
          onClick={
            onNewPayment
          }
        >
          <CircleDollarSign
            size={19}
          />

          Registrar pago
        </button>

      </div>

    </header>
  );
}