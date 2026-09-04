/* =========================================================
   FORMATOS COMPARTIDOS
   REPORTES - LOTES VILLA MARÍA
========================================================= */

/* =========================================================
   NÚMERO SEGURO
========================================================= */

export const numero = (
  valor = 0
) => {
  const resultado =
    Number(valor);

  return Number.isFinite(
    resultado
  )
    ? resultado
    : 0;
};

/* =========================================================
   MONEDA COP
========================================================= */

export const formatearDinero = (
  valor = 0
) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    numero(valor)
  );
};

/* =========================================================
   NÚMEROS
========================================================= */

export const formatearNumero = (
  valor = 0,
  decimales = 0
) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      minimumFractionDigits:
        decimales,

      maximumFractionDigits:
        decimales,
    }
  ).format(
    numero(valor)
  );
};

/* =========================================================
   FECHAS
========================================================= */

export const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const texto =
    String(fecha);

  /* =======================================================
     YYYY-MM-DD
     Evita problemas de zona horaria
  ======================================================= */

  const coincidencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (coincidencia) {
    const [
      ,
      anio,
      mes,
      dia,
    ] = coincidencia;

    return `${dia}/${mes}/${anio}`;
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

/* =========================================================
   FECHA CON HORA
========================================================= */

export const formatearFechaHora = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

/* =========================================================
   TEXTO SEGURO
========================================================= */

export const textoSeguro = (
  valor
) => {
  const resultado =
    String(
      valor ?? ""
    ).trim();

  return resultado ||
    "—";
};

/* =========================================================
   ESCAPAR HTML

   Para los informes HTML que se abren en otra pestaña.
========================================================= */

export const escaparHTML = (
  valor = ""
) => {
  return String(valor)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

/* =========================================================
   NORMALIZAR TEXTO
   Útil para búsquedas y filtros.
========================================================= */

export const normalizarTexto = (
  valor = ""
) => {
  return String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
};

/* =========================================================
   NOMBRE DE ARCHIVO

   Ejemplo:
   LotesVillaMaria_ClientesLotesVendidos_2026-09-03.xlsx
========================================================= */

export const crearNombreArchivo = (
  titulo,
  extension
) => {
  const fecha =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const nombreLimpio =
    String(
      titulo ||
        "Reporte"
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  const extensionLimpia =
    String(
      extension ||
        ""
    )
      .replace(
        /^\./,
        ""
      )
      .toLowerCase();

  return `LotesVillaMaria_${nombreLimpio}_${fecha}.${extensionLimpia}`;
};

/* =========================================================
   PORCENTAJE
========================================================= */

export const formatearPorcentaje = (
  valor = 0,
  decimales = 1
) => {
  return `${formatearNumero(
    valor,
    decimales
  )}%`;
};

/* =========================================================
   CALCULAR PORCENTAJE
========================================================= */

export const calcularPorcentaje = (
  parte,
  total
) => {
  const valorParte =
    numero(parte);

  const valorTotal =
    numero(total);

  if (
    valorTotal <= 0
  ) {
    return 0;
  }

  return (
    valorParte /
    valorTotal
  ) * 100;
};