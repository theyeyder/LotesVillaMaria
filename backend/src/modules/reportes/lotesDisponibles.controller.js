import Lote from "../lotes/lote.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado =
    Number(valor);

  return Number.isFinite(
    resultado
  )
    ? resultado
    : 0;
};

const texto = (valor) => {
  return String(
    valor ?? ""
  ).trim();
};

const textoMinuscula = (
  valor
) => {
  return texto(
    valor
  ).toLowerCase();
};

/* =========================================================
   FORMATEAR MEDIDA
========================================================= */

const obtenerMedidaLote = (
  metros = 0,
  centimetros = 0
) => {
  const m =
    numero(
      metros
    );

  const cm =
    numero(
      centimetros
    );

  if (
    m === 0 &&
    cm === 0
  ) {
    return "—";
  }

  if (
    cm === 0
  ) {
    return `${m} m`;
  }

  if (
    m === 0
  ) {
    return `${cm} cm`;
  }

  return `${m} m ${cm} cm`;
};

/* =========================================================
   CÓDIGO MANZANA
========================================================= */

const obtenerCodigoManzana = (
  manzana
) => {
  return (
    manzana?.codigo ||
    manzana?.nombre ||
    "—"
  );
};

/* =========================================================
   REPORTE LOTES DISPONIBLES

   GET /api/reportes/lotes-disponibles

   FILTROS:
   ?buscar=
   &manzana=
   &tipo=
   &areaDesde=
   &areaHasta=
   &valorDesde=
   &valorHasta=
========================================================= */

export const obtenerReporteLotesDisponibles =
  async (
    req,
    res
  ) => {
    try {
      const {
        buscar = "",
        manzana = "",
        tipo = "",
        areaDesde = "",
        areaHasta = "",
        valorDesde = "",
        valorHasta = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE

         SOLO LOTES DISPONIBLES
      ===================================================== */

      const filtro = {
        estado:
          "Disponible",
      };

      /* =====================================================
         MANZANA
      ===================================================== */

      if (
        texto(
          manzana
        )
      ) {
        filtro.manzana =
          manzana;
      }

      /* =====================================================
         TIPO DE LOTE
      ===================================================== */

      if (
        texto(
          tipo
        )
      ) {
        filtro.tipoLote =
          texto(
            tipo
          );
      }

      /* =====================================================
         FILTRO POR ÁREA
      ===================================================== */

      if (
        areaDesde !== "" ||
        areaHasta !== ""
      ) {
        filtro.areaM2 = {};

        if (
          areaDesde !== ""
        ) {
          const minimo =
            numero(
              areaDesde
            );

          if (
            minimo < 0
          ) {
            return res
              .status(
                400
              )
              .json({
                message:
                  "El área mínima no puede ser negativa.",
              });
          }

          filtro.areaM2.$gte =
            minimo;
        }

        if (
          areaHasta !== ""
        ) {
          const maximo =
            numero(
              areaHasta
            );

          if (
            maximo < 0
          ) {
            return res
              .status(
                400
              )
              .json({
                message:
                  "El área máxima no puede ser negativa.",
              });
          }

          filtro.areaM2.$lte =
            maximo;
        }
      }

      /* =====================================================
         FILTRO POR VALOR
      ===================================================== */

      if (
        valorDesde !== "" ||
        valorHasta !== ""
      ) {
        filtro.valorLote = {};

        if (
          valorDesde !== ""
        ) {
          const minimo =
            numero(
              valorDesde
            );

          if (
            minimo < 0
          ) {
            return res
              .status(
                400
              )
              .json({
                message:
                  "El valor mínimo no puede ser negativo.",
              });
          }

          filtro.valorLote.$gte =
            minimo;
        }

        if (
          valorHasta !== ""
        ) {
          const maximo =
            numero(
              valorHasta
            );

          if (
            maximo < 0
          ) {
            return res
              .status(
                400
              )
              .json({
                message:
                  "El valor máximo no puede ser negativo.",
              });
          }

          filtro.valorLote.$lte =
            maximo;
        }
      }

      /* =====================================================
         CONSULTAR LOTES
      ===================================================== */

      const lotes =
        await Lote.find(
          filtro
        )
          .populate({
            path:
              "manzana",

            select:
              "codigo nombre areaM2 descripcion estado",
          })
          .sort({
            manzana:
              1,

            numeroLote:
              1,

            codigo:
              1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR REGISTROS
      ===================================================== */

      let registros =
        lotes.map(
          (
            lote
          ) => {
            const manzanaLote =
              lote.manzana;

            return {
              _id:
                lote._id,

              codigo:
                lote.codigo ||
                "—",

              numeroLote:
                lote.numeroLote ||
                "",

              tipo:
                lote.tipoLote ||
                "—",

              frente:
                obtenerMedidaLote(
                  lote.frenteMetros,
                  lote.frenteCentimetros
                ),

              fondo:
                obtenerMedidaLote(
                  lote.fondoMetros,
                  lote.fondoCentimetros
                ),

              frenteMetros:
                numero(
                  lote.frenteMetros
                ),

              frenteCentimetros:
                numero(
                  lote.frenteCentimetros
                ),

              fondoMetros:
                numero(
                  lote.fondoMetros
                ),

              fondoCentimetros:
                numero(
                  lote.fondoCentimetros
                ),

              areaM2:
                numero(
                  lote.areaM2
                ),

              valorLote:
                numero(
                  lote.valorLote
                ),

              estado:
                lote.estado ||
                "Disponible",

              manzana: {
                _id:
                  manzanaLote?._id ||
                  null,

                codigo:
                  obtenerCodigoManzana(
                    manzanaLote
                  ),

                nombre:
                  manzanaLote?.nombre ||
                  "",

                areaM2:
                  manzanaLote?.areaM2 ??
                  null,

                estado:
                  manzanaLote?.estado ||
                  "",
              },
            };
          }
        );

      /* =====================================================
         BUSCADOR GENERAL
      ===================================================== */

      if (
        texto(
          buscar
        )
      ) {
        const busqueda =
          textoMinuscula(
            buscar
          );

        registros =
          registros.filter(
            (
              registro
            ) => {
              const campos = [
                registro.codigo,

                registro.numeroLote,

                registro.tipo,

                registro.frente,

                registro.fondo,

                registro
                  .manzana
                  .codigo,

                registro
                  .manzana
                  .nombre,

                registro.estado,
              ];

              return campos.some(
                (
                  campo
                ) =>
                  textoMinuscula(
                    campo
                  ).includes(
                    busqueda
                  )
              );
            }
          );
      }

      /* =====================================================
         AGRUPAR POR MANZANA
      ===================================================== */

      const mapaManzanas =
        new Map();

      registros.forEach(
        (
          registro
        ) => {
          const clave =
            String(
              registro
                .manzana
                ._id ||
              registro
                .manzana
                .codigo ||
              "sin-manzana"
            );

          if (
            !mapaManzanas.has(
              clave
            )
          ) {
            mapaManzanas.set(
              clave,
              {
                manzana:
                  registro.manzana,

                cantidadLotes:
                  0,

                lotesRegulares:
                  0,

                lotesIrregulares:
                  0,

                areaDisponible:
                  0,

                valorInventario:
                  0,

                valorPromedio:
                  0,
              }
            );
          }

          const grupo =
            mapaManzanas.get(
              clave
            );

          grupo.cantidadLotes +=
            1;

          grupo.areaDisponible +=
            numero(
              registro.areaM2
            );

          grupo.valorInventario +=
            numero(
              registro.valorLote
            );

          if (
            registro.tipo ===
            "Regular"
          ) {
            grupo.lotesRegulares +=
              1;
          }

          if (
            registro.tipo ===
            "Irregular"
          ) {
            grupo.lotesIrregulares +=
              1;
          }
        }
      );

      /* =====================================================
         RESUMEN POR MANZANA
      ===================================================== */

      const manzanas =
        Array.from(
          mapaManzanas.values()
        )
          .map(
            (
              grupo
            ) => {
              const promedio =
                grupo.cantidadLotes >
                0
                  ? grupo.valorInventario /
                    grupo.cantidadLotes
                  : 0;

              return {
                manzana:
                  grupo.manzana,

                cantidadLotes:
                  grupo.cantidadLotes,

                lotesRegulares:
                  grupo.lotesRegulares,

                lotesIrregulares:
                  grupo.lotesIrregulares,

                areaDisponible:
                  Number(
                    grupo.areaDisponible.toFixed(
                      2
                    )
                  ),

                valorInventario:
                  Number(
                    grupo.valorInventario.toFixed(
                      2
                    )
                  ),

                valorPromedio:
                  Number(
                    promedio.toFixed(
                      2
                    )
                  ),
              };
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                a.manzana?.codigo ||
                  ""
              ).localeCompare(
                String(
                  b.manzana?.codigo ||
                    ""
                ),
                "es",
                {
                  numeric:
                    true,
                }
              )
          );

      /* =====================================================
         RESUMEN GENERAL
      ===================================================== */

      const areaDisponible =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.areaM2
            ),
          0
        );

      const valorInventario =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorLote
            ),
          0
        );

      const lotesRegulares =
        registros.filter(
          (
            registro
          ) =>
            registro.tipo ===
            "Regular"
        ).length;

      const lotesIrregulares =
        registros.filter(
          (
            registro
          ) =>
            registro.tipo ===
            "Irregular"
        ).length;

      const valorPromedio =
        registros.length >
        0
          ? valorInventario /
            registros.length
          : 0;

      const areaPromedio =
        registros.length >
        0
          ? areaDisponible /
            registros.length
          : 0;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res
        .status(
          200
        )
        .json({
          tipoReporte:
            "lotes-disponibles",

          titulo:
            "Informe de lotes disponibles",

          filtros: {
            buscar,
            manzana,
            tipo,
            areaDesde,
            areaHasta,
            valorDesde,
            valorHasta,
          },

          resumen: {
            manzanas:
              manzanas.length,

            lotesDisponibles:
              registros.length,

            lotesRegulares,

            lotesIrregulares,

            areaDisponible:
              Number(
                areaDisponible.toFixed(
                  2
                )
              ),

            areaPromedio:
              Number(
                areaPromedio.toFixed(
                  2
                )
              ),

            valorInventario:
              Number(
                valorInventario.toFixed(
                  2
                )
              ),

            valorPromedio:
              Number(
                valorPromedio.toFixed(
                  2
                )
              ),
          },

          manzanas,

          registros,
        });
    } catch (
      error
    ) {
      console.error(
        "Error generando informe de lotes disponibles:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          message:
            "No fue posible generar el informe de lotes disponibles.",

          error:
            error.message,
        });
    }
  };