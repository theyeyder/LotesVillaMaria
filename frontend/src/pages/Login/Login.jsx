import { useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import "./Login.css";

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123*");
  const [error, setError] = useState("");
  const submit = e => {
    e.preventDefault();
    if (username.trim() === "admin" && password === "Admin123*") { setError(""); onLogin(); }
    else setError("Usuario o contraseña incorrectos. Esta validación es temporal hasta conectar MongoDB.");
  };
  return <main className="login-page">
    <div className="login-card">
      <section className="login-hero topography">
        <div>
          <span className="login-mark"><Building2 /></span>
          <p className="login-kicker">Proyecto Villa María</p>
          <h1 className="serif-title">Gestión de lotes, pagos y maquinaria.</h1>
          <p className="login-copy">Una vista clara para administrar clientes, ventas, cuotas, facturas y operación de maquinaria.</p>
        </div>
        <p className="login-foot">Acceso protegido para el administrador</p>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <p className="page-eyebrow">Acceso al sistema</p>
          <h2 className="serif-title">Iniciar sesión</h2>
          <label>Usuario<div className="login-input"><UserRound /><input value={username} onChange={e=>setUsername(e.target.value)} required /></div></label>
          <label>Contraseña<div className="login-input"><LockKeyhole /><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required /><button type="button" onClick={()=>setShow(v=>!v)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
          {error && <div className="login-error">{error}</div>}
          <Button className="login-submit"><KeyRound /> Ingresar</Button>
          <p className="login-demo">Acceso temporal de diseño: <b>admin</b> / <b>Admin123*</b></p>
        </form>
      </section>
    </div>
  </main>;
}
