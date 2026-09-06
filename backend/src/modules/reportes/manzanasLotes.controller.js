import Manzana from "../manzanas/manzana.model.js";
import Lote from "../lotes/lote.model.js";

/* =========================================================
   UTILIDADES
========================================================= */

const numero = (valor = 0) => {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
};

const texto = (valor = "") => {
  return String(
    valor ?? ""
  ).trim();
};

const normalizarTexto = (
  valor = ""
) => {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
};

/* =========================================================
   CÓDIGO DE MANZANA
========================================================= */

const obtenerCodigoManzana = (
  manzana
) => {
  return (
    texto(
      manzana?.codigo
    ) ||
    texto(
      manzana?.nombre
    ) ||
    "—"
  );
};

/* =========================================================
   ÁREA TOTAL OFICIAL DE LA MANZANA

   IMPORTANTE:
   - areaM2 puede ser null porque es opcional.
   - null NO significa 0.
========================================================= */

const obtenerAreaManzana = (
  manzana
) => {
  const valor =
    manzana?.areaM2;

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const area =
    Number(valor);

  return Number.isFinite(area)
    ? area
    : null;
};

/* =========================================================
   ÁREA OFICIAL DEL LOTE
========================================================= */

const obtenerAreaLote = (
  lote
) => {
  return numero(
    lote?.areaM2
  );
};

/* =========================================================
   TIPO REAL DEL LOTE
========================================================= */

const obtenerTipoLote = (
  lote
) => {
  return (
    texto(
      lote?.tipoLote
    ) ||
    "Regular"
  );
};

/* =========================================================
   VALOR REAL DEL LOTE
========================================================= */

const obtenerValorLote = (
  lote
) => {
  return numero(
    lote?.valorLote
  );
};

/* =========================================================
   ESTADO REAL DEL LOTE
========================================================= */

const obtenerEstadoLote = (
  lote
) => {
  return (
    texto(
      lote?.estado
    ) ||
    "Disponible"
  );
};

/* =========================================================
   CONVERTIR LOTE A FORMATO DE REPORTE
========================================================= */

const construirLoteDetalle = (
  lote
) => {
  const estado =
    obtenerEstadoLote(
      lote
    );

  const estadoNormalizado =
    normalizarTexto(
      estado
    );

  return {
    _id:
      lote._id,

    codigo:
      texto(
        lote.codigo
      ) ||
      "—",

    numeroLote:
      texto(
        lote.numeroLote
      ) ||
      "—",

    tipo:
      obtenerTipoLote(
        lote
      ),

    area:
      obtenerAreaLote(
        lote
      ),

    valor:
      obtenerValorLote(
        lote
      ),

    estado,

    disponible:
      estadoNormalizado ===
      "disponible",

    reservado:
      estadoNormalizado ===
      "reservado",

    vendido:
      estadoNormalizado ===
      "vendido",
  };
};

/* =========================================================
   RECALCULAR DATOS DE UNA MANZANA
========================================================= */

const calcularDatosManzana = ({
  manzana,
  lotes,
}) => {
  const areaTotalManzana =
    obtenerAreaManzana(
      manzana
    );

  const cantidadLotes =
    lotes.length;

  const lotesDisponibles =
    lotes.filter(
      (lote) =>
        lote.disponible
    ).length;

  const lotesReservados =
    lotes.filter(
      (lote) =>
        lote.reservado
    ).length;

  const lotesVendidos =
    lotes.filter(
      (lote) =>
        lote.vendido
    ).length;

  const areaLotes =
    Number(
      lotes
        .reduce(
          (
            total,
            lote
          ) =>
            total +
            numero(
              lote.area
            ),
          0
        )
        .toFixed(2)
    );

  const valorTotalLotes =
    lotes.reduce(
      (
        total,
        lote
      ) =>
        total +
        numero(
          lote.valor
        ),
      0
    );

  const valorInventarioDisponible =
    lotes
      .filter(
        (lote) =>
          lote.disponible
      )
      .reduce(
        (
          total,
          lote
        ) =>
          total +
          numero(
            lote.valor
          ),
        0
      );

  /*
    Si el área de la manzana no está registrada,
    NO podemos calcular el área restante.
  */

  const diferenciaArea =
    areaTotalManzana ===
    null
      ? null
      : Number(
          (
            areaTotalManzana -
            areaLotes
          ).toFixed(2)
        );

  return {
    areaTotalManzana,

    /*
      Conservamos temporalmente metrosTotales
      para no romper el frontend existente.

      Su valor ahora proviene del campo correcto:
      manzana.areaM2.
    */

    metrosTotales:
      areaTotalManzana,

    cantidadLotes,

    lotesDisponibles,

    lotesReservados,

    lotesVendidos,

    areaLotes,

    diferenciaArea,

    valorTotalLotes,

    valorInventarioDisponible,
  };
};

/* =========================================================
   INFORME DE MANZANAS Y LOTES

   GET /api/reportes/manzanas-lotes

   FILTROS:
   ?buscar=
   &estado=
   &tipo=
   &manzana=
========================================================= */

export const obtenerReporteManzanasLotes =
  async (
    req,
    res
  ) => {
    try {
      const {
        buscar = "",
        estado = "",
        tipo = "",
        manzana = "",
      } = req.query;

      /* =====================================================
         CONSULTAR MANZANAS
      ===================================================== */

      const manzanas =
        await Manzana.find(
          {}
        )
          .sort({
            codigo: 1,
            createdAt: 1,
          })
          .lean();

      /* =====================================================
         CONSULTAR LOTES
      ===================================================== */

      const lotes =
        await Lote.find(
          {}
        )
          .populate({
            path:
              "manzana",

            select:
              "codigo nombre areaM2 estado",
          })
          .sort({
            codigo: 1,
            createdAt: 1,
          })
          .lean();

      /* =====================================================
         AGRUPAR LOTES POR MANZANA
      ===================================================== */

      const lotesPorManzana =
        new Map();

      lotes.forEach(
        (lote) => {
          const manzanaId =
            lote.manzana?._id
              ? String(
                  lote.manzana._id
                )
              : lote.manzana
                ? String(
                    lote.manzana
                  )
                : "sin-manzana";

          if (
            !lotesPorManzana.has(
              manzanaId
            )
          ) {
            lotesPorManzana.set(
              manzanaId,
              []
            );
          }

          lotesPorManzana
            .get(
              manzanaId
            )
            .push(
              lote
            );
        }
      );

      /* =====================================================
         CONSTRUIR REGISTROS
      ===================================================== */

      let registros =
        manzanas.map(
          (
            manzanaRegistro
          ) => {
            const idManzana =
              String(
                manzanaRegistro._id
              );

            const lotesManzana =
              lotesPorManzana.get(
                idManzana
              ) || [];

            const lotesDetalle =
              lotesManzana.map(
                construirLoteDetalle
              );

            const datos =
              calcularDatosManzana({
                manzana:
                  manzanaRegistro,

                lotes:
                  lotesDetalle,
              });

            return {
              _id:
                manzanaRegistro._id,

              codigo:
                obtenerCodigoManzana(
                  manzanaRegistro
                ),

              nombre:
                texto(
                  manzanaRegistro.nombre
                ) ||
                "—",

              estado:
                texto(
                  manzanaRegistro.estado
                ) ||
                "—",

              ...datos,

              createdAt:
                manzanaRegistro.createdAt ||
                null,

              updatedAt:
                manzanaRegistro.updatedAt ||
                null,

              lotes:
                lotesDetalle,
            };
          }
        );

      /* =====================================================
         LOTES SIN MANZANA

         Solo para registros antiguos o inconsistentes.
      ===================================================== */

      const lotesSinManzana =
        lotesPorManzana.get(
          "sin-manzana"
        ) || [];

      if (
        lotesSinManzana.length >
        0
      ) {
        const detalle =
          lotesSinManzana.map(
            construirLoteDetalle
          );

        const datos =
          calcularDatosManzana({
            manzana: {
              areaM2:
                null,
            },

            lotes:
              detalle,
          });

        registros.push({
          _id:
            "sin-manzana",

          codigo:
            "Sin manzana",

          nombre:
            "Sin manzana",

          estado:
            "—",

          ...datos,

          createdAt:
            null,

          updatedAt:
            null,

          lotes:
            detalle,
        });
      }

      /* =====================================================
         FILTRO DE MANZANA
      ===================================================== */

      if (
        texto(
          manzana
        )
      ) {
        const valorManzana =
          normalizarTexto(
            manzana
          );

        registros =
          registros.filter(
            (registro) =>
              normalizarTexto(
                registro._id
              ) ===
                valorManzana ||
              normalizarTexto(
                registro.codigo
              ) ===
                valorManzana
          );
      }

      /* =====================================================
         FILTROS DE ESTADO Y TIPO
      ===================================================== */

      if (
        texto(
          estado
        ) ||
        texto(
          tipo
        )
      ) {
        const estadoBuscado =
          normalizarTexto(
            estado
          );

        const tipoBuscado =
          normalizarTexto(
            tipo
          );

        registros =
          registros
            .map(
              (
                registro
              ) => {
                const lotesFiltrados =
                  registro.lotes.filter(
                    (
                      lote
                    ) => {
                      const coincideEstado =
                        !estadoBuscado ||
                        normalizarTexto(
                          lote.estado
                        ) ===
                          estadoBuscado;

                      const coincideTipo =
                        !tipoBuscado ||
                        normalizarTexto(
                          lote.tipo
                        ) ===
                          tipoBuscado;

                      return (
                        coincideEstado &&
                        coincideTipo
                      );
                    }
                  );

                const datos =
                  calcularDatosManzana({
                    manzana: {
                      areaM2:
                        registro.areaTotalManzana,
                    },

                    lotes:
                      lotesFiltrados,
                  });

                return {
                  ...registro,

                  ...datos,

                  lotes:
                    lotesFiltrados,
                };
              }
            )
            .filter(
              (registro) =>
                registro.lotes.length >
                0
            );
      }

      /* =====================================================
         BUSCADOR GENERAL
      ===================================================== */

      if (
        texto(
          buscar
        )
      ) {
        const busqueda =
          normalizarTexto(
            buscar
          );

        registros =
          registros
            .map(
              (
                registro
              ) => {
                const coincideManzana =
                  [
                    registro.codigo,
                    registro.nombre,
                    registro.estado,
                  ].some(
                    (campo) =>
                      normalizarTexto(
                        campo
                      ).includes(
                        busqueda
                      )
                  );

                if (
                  coincideManzana
                ) {
                  return registro;
                }

                const lotesCoincidentes =
                  registro.lotes.filter(
                    (
                      lote
                    ) => {
                      const campos = [
                        lote.codigo,
                        lote.numeroLote,
                        lote.tipo,
                        lote.estado,
                        lote.area,
                        lote.valor,
                      ];

                      return campos.some(
                        (campo) =>
                          normalizarTexto(
                            campo
                          ).includes(
                            busqueda
                          )
                      );
                    }
                  );

                const datos =
                  calcularDatosManzana({
                    manzana: {
                      areaM2:
                        registro.areaTotalManzana,
                    },

                    lotes:
                      lotesCoincidentes,
                  });

                return {
                  ...registro,

                  ...datos,

                  lotes:
                    lotesCoincidentes,
                };
              }
            )
            .filter(
              (
                registro
              ) =>
                registro.lotes.length >
                  0 ||
                normalizarTexto(
                  registro.codigo
                ).includes(
                  busqueda
                ) ||
                normalizarTexto(
                  registro.nombre
                ).includes(
                  busqueda
                )
            );
      }

      /* =====================================================
         DETALLE PLANO DE LOTES
      ===================================================== */

      const detalleLotes =
        [];

      registros.forEach(
        (registro) => {
          registro.lotes.forEach(
            (lote) => {
              detalleLotes.push({
                _id:
                  lote._id,

                manzana: {
                  _id:
                    registro._id,

                  codigo:
                    registro.codigo,

                  nombre:
                    registro.nombre,

                  areaM2:
                    registro.areaTotalManzana,
                },

                codigo:
                  lote.codigo,

                numeroLote:
                  lote.numeroLote,

                tipo:
                  lote.tipo,

                area:
                  lote.area,

                valor:
                  lote.valor,

                estado:
                  lote.estado,
              });
            }
          );
        }
      );

      /* =====================================================
         RESUMEN
      ===================================================== */

      const totalManzanas =
        registros.length;

      const totalLotes =
        detalleLotes.length;

      const lotesDisponibles =
        detalleLotes.filter(
          (lote) =>
            normalizarTexto(
              lote.estado
            ) ===
            "disponible"
        ).length;

      const lotesReservados =
        detalleLotes.filter(
          (lote) =>
            normalizarTexto(
              lote.estado
            ) ===
            "reservado"
        ).length;

      const lotesVendidos =
        detalleLotes.filter(
          (lote) =>
            normalizarTexto(
              lote.estado
            ) ===
            "vendido"
        ).length;

      const lotesRegulares =
        detalleLotes.filter(
          (lote) =>
            normalizarTexto(
              lote.tipo
            ) ===
            "regular"
        ).length;

      const lotesIrregulares =
        detalleLotes.filter(
          (lote) =>
            normalizarTexto(
              lote.tipo
            ) ===
            "irregular"
        ).length;

      /*
        Solo sumamos las manzanas que
        realmente tienen área registrada.
      */

      const manzanasConAreaRegistrada =
        registros.filter(
          (registro) =>
            registro.areaTotalManzana !==
            null
        ).length;

      const manzanasSinAreaRegistrada =
        registros.filter(
          (registro) =>
            registro.areaTotalManzana ===
            null
        ).length;

      const areaTotalManzanas =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            (
              registro.areaTotalManzana ===
              null
                ? 0
                : numero(
                    registro.areaTotalManzana
                  )
            ),
          0
        );

      const areaTotalLotes =
        Number(
          detalleLotes
            .reduce(
              (
                total,
                lote
              ) =>
                total +
                numero(
                  lote.area
                ),
              0
            )
            .toFixed(2)
        );

      /*
        La diferencia global solamente es válida
        si TODAS las manzanas incluidas tienen
        área total registrada.
      */

      const diferenciaArea =
        manzanasSinAreaRegistrada >
        0
          ? null
          : Number(
              (
                areaTotalManzanas -
                areaTotalLotes
              ).toFixed(2)
            );

      const valorTotalLotes =
        detalleLotes.reduce(
          (
            total,
            lote
          ) =>
            total +
            numero(
              lote.valor
            ),
          0
        );

      const valorDisponible =
        detalleLotes
          .filter(
            (lote) =>
              normalizarTexto(
                lote.estado
              ) ===
              "disponible"
          )
          .reduce(
            (
              total,
              lote
            ) =>
              total +
              numero(
                lote.valor
              ),
            0
          );

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res.json({
        tipoReporte:
          "manzanas-lotes",

        titulo:
          "Informe de manzanas y lotes",

        filtros: {
          buscar:
            texto(
              buscar
            ),

          estado:
            texto(
              estado
            ),

          tipo:
            texto(
              tipo
            ),

          manzana:
            texto(
              manzana
            ),
        },

        resumen: {
          totalManzanas,

          totalLotes,

          lotesDisponibles,

          lotesReservados,

          lotesVendidos,

          lotesRegulares,

          lotesIrregulares,

          manzanasConAreaRegistrada,

          manzanasSinAreaRegistrada,

          areaTotalManzanas,

          areaTotalLotes,

          diferenciaArea,

          valorTotalLotes,

          valorDisponible,
        },

        registros,

        detalleLotes,
      });
    } catch (error) {
      console.error(
        "Error generando informe de manzanas y lotes:",
        error
      );

      return res.status(
        500
      ).json({
        message:
          "No fue posible generar el informe de manzanas y lotes.",

        error:
          error.message,
      });
    }
  };