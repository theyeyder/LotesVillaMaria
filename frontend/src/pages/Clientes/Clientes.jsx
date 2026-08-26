import { Plus, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import "./Clientes.css";
const rows=[
  ["Carlos Ramírez","1.110.458.920","310 456 7812","VM-014","$ 18.500.000"],
  ["Diana Torres","65.884.120","315 620 0921","VM-008","$ 9.250.000"],
  ["Andrés Gómez","1.005.673.842","300 112 3490","VM-021","$ 24.000.000"],
  ["Martha Rodríguez","28.996.441","320 501 7731","VM-005","$ 0"],
];
export default function Clientes({ search }) { const t=search.toLowerCase(); const filtered=rows.filter(r=>r.join(" ").toLowerCase().includes(t)); return <div className="clientes-page page-stack"><header className="page-header"><div><p className="page-eyebrow">Relación comercial</p><h1 className="page-title">Clientes</h1><p className="page-description">Información de contacto, lote comprado y saldo de cada cliente.</p></div><Button><Plus/> Nuevo cliente</Button></header><section className="surface clientes-summary"><div><UserRound/><span><small>Clientes registrados</small><strong>{rows.length}</strong></span></div><p>Datos de muestra para definir el diseño. La conexión con MongoDB se hará al trabajar este módulo.</p></section><section className="surface table-shell"><div className="table-scroll"><table className="data-table"><thead><tr><th>Cliente</th><th>Documento</th><th>Teléfono</th><th>Lote</th><th className="text-right">Saldo</th></tr></thead><tbody>{filtered.map(r=><tr key={r[1]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td><span className="code-pill">{r[3]}</span></td><td className="text-right money">{r[4]}</td></tr>)}</tbody></table></div></section></div> }
