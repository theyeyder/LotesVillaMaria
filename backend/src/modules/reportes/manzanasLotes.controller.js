import Manzana from "../manzanas/manzana.model.js";
import Lote from "../lotes/lote.model.js";

/* =========================================================
   UTILIDADES
========================================================= */

const numero = (
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

const texto = (
  valor = ""
) => {
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
   OBTENER CÓDIGO DE MANZANA
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
   METROS TOTALES DE MANZANA

   Se dejan varias opciones para soportar posibles registros
   antiguos.
========================================================= */

const obtenerMetrosManzana = (
  manzana
) => {
  return numero(
    manzana?.metrosTotales ??
      manzana?.area ??
      manzana?.areaTotal ??
      manzana?.metrosCuadrados ??
      0
  );
};

/* =========================================================
   ÁREA DEL LOTE
========================================================= */

const obtenerAreaLote = (
  lote
) => {
  return numero(
    lote?.area ??
      lote?.metros ??
      lote?.metrosCuadrados ??
      lote?.areaTotal ??
      0
  );
};

/* =========================================================
   VALOR DEL LOTE
========================================================= */

const obtenerValorLote = (
  lote
) => {
  return numero(
    lote?.valor ??
      lote?.valorLote ??
      lote?.precio ??
      lote?.valorVenta ??
      0
  );
};

/* =========================================================
   ESTADO DEL LOTE
========================================================= */

const obtenerEstadoLote = (
  lote
) => {
  const estado =
    texto(
      lote?.estado
    );

  return estado ||
    "Disponible";
};

/* =========================================================
   INFORME MANZANAS Y LOTES

   GET /api/reportes/manzanas-lotes

   Filtros:
   ?buscar=Mz 1
   &estado=Disponible
   &tipo=Regular
   &manzana=<id>
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
              "codigo nombre metrosTotales area areaTotal metrosCuadrados",
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
        (
          lote
        ) => {
          const manzanaId =
            lote.manzana
              ?._id
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
         CONSTRUIR MANZANAS
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
                (
                  lote
                ) => ({
                  _id:
                    lote._id,

                  codigo:
                    texto(
                      lote.codigo
                    ) ||
                    "—",

                  tipo:
                    texto(
                      lote.tipo
                    ) ||
                    "—",

                  area:
                    obtenerAreaLote(
                      lote
                    ),

                  valor:
                    obtenerValorLote(
                      lote
                    ),

                  estado:
                    obtenerEstadoLote(
                      lote
                    ),

                  vendido:
                    normalizarTexto(
                      obtenerEstadoLote(
                        lote
                      )
                    ) ===
                    "vendido",

                  disponible:
                    normalizarTexto(
                      obtenerEstadoLote(
                        lote
                      )
                    ) ===
                    "disponible",
                })
              );

            const lotesDisponibles =
              lotesDetalle.filter(
                (
                  lote
                ) =>
                  lote.disponible
              ).length;

            const lotesVendidos =
              lotesDetalle.filter(
                (
                  lote
                ) =>
                  lote.vendido
              ).length;

            const areaLotes =
              lotesDetalle.reduce(
                (
                  total,
                  lote
                ) =>
                  total +
                  numero(
                    lote.area
                  ),
                0
              );

            const valorInventario =
              lotesDetalle
                .filter(
                  (
                    lote
                  ) =>
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

            const valorLotes =
              lotesDetalle.reduce(
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

            return {
              _id:
                manzanaRegistro._id,

              codigo:
                obtenerCodigoManzana(
                  manzanaRegistro
                ),

              metrosTotales:
                obtenerMetrosManzana(
                  manzanaRegistro
                ),

              cantidadLotes:
                lotesDetalle.length,

              lotesDisponibles,

              lotesVendidos,

              areaLotes,

              diferenciaArea:
                obtenerMetrosManzana(
                  manzanaRegistro
                ) > 0
                  ? obtenerMetrosManzana(
                      manzanaRegistro
                    ) -
                    areaLotes
                  : 0,

              valorTotalLotes:
                valorLotes,

              valorInventarioDisponible:
                valorInventario,

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
         INCLUIR LOTES SIN MANZANA

         Solo si existen datos antiguos o inconsistentes.
      ===================================================== */

      const lotesSinManzana =
        lotesPorManzana.get(
          "sin-manzana"
        ) || [];

      if (
        lotesSinManzana.length
      ) {
        const detalle =
          lotesSinManzana.map(
            (
              lote
            ) => ({
              _id:
                lote._id,

              codigo:
                texto(
                  lote.codigo
                ) ||
                "—",

              tipo:
                texto(
                  lote.tipo
                ) ||
                "—",

              area:
                obtenerAreaLote(
                  lote
                ),

              valor:
                obtenerValorLote(
                  lote
                ),

              estado:
                obtenerEstadoLote(
                  lote
                ),

              vendido:
                normalizarTexto(
                  obtenerEstadoLote(
                    lote
                  )
                ) ===
                "vendido",

              disponible:
                normalizarTexto(
                  obtenerEstadoLote(
                    lote
                  )
                ) ===
                "disponible",
            })
          );

        registros.push({
          _id:
            "sin-manzana",

          codigo:
            "Sin manzana",

          metrosTotales:
            0,

          cantidadLotes:
            detalle.length,

          lotesDisponibles:
            detalle.filter(
              (
                lote
              ) =>
                lote.disponible
            ).length,

          lotesVendidos:
            detalle.filter(
              (
                lote
              ) =>
                lote.vendido
            ).length,

          areaLotes:
            detalle.reduce(
              (
                total,
                lote
              ) =>
                total +
                numero(
                  lote.area
                ),
              0
            ),

          diferenciaArea:
            0,

          valorTotalLotes:
            detalle.reduce(
              (
                total,
                lote
              ) =>
                total +
                numero(
                  lote.valor
                ),
              0
            ),

          valorInventarioDisponible:
            detalle
              .filter(
                (
                  lote
                ) =>
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
              ),

          createdAt:
            null,

          updatedAt:
            null,

          lotes:
            detalle,
        });
      }

      /* =====================================================
         FILTRO MANZANA
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
            (
              registro
            ) =>
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
         FILTRAR LOTES POR ESTADO / TIPO

         Importante:
         la manzana se conserva si después del filtro tiene
         al menos un lote.
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

                return {
                  ...registro,

                  lotes:
                    lotesFiltrados,

                  cantidadLotes:
                    lotesFiltrados.length,

                  lotesDisponibles:
                    lotesFiltrados.filter(
                      (
                        lote
                      ) =>
                        lote.disponible
                    ).length,

                  lotesVendidos:
                    lotesFiltrados.filter(
                      (
                        lote
                      ) =>
                        lote.vendido
                    ).length,

                  areaLotes:
                    lotesFiltrados.reduce(
                      (
                        total,
                        lote
                      ) =>
                        total +
                        numero(
                          lote.area
                        ),
                      0
                    ),

                  valorTotalLotes:
                    lotesFiltrados.reduce(
                      (
                        total,
                        lote
                      ) =>
                        total +
                        numero(
                          lote.valor
                        ),
                      0
                    ),

                  valorInventarioDisponible:
                    lotesFiltrados
                      .filter(
                        (
                          lote
                        ) =>
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
                      ),
                };
              }
            )
            .filter(
              (
                registro
              ) =>
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
                  normalizarTexto(
                    registro.codigo
                  ).includes(
                    busqueda
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
                        lote.tipo,
                        lote.estado,
                        lote.area,
                        lote.valor,
                      ];

                      return campos.some(
                        (
                          campo
                        ) =>
                          normalizarTexto(
                            campo
                          ).includes(
                            busqueda
                          )
                      );
                    }
                  );

                return {
                  ...registro,
                  lotes:
                    lotesCoincidentes,

                  cantidadLotes:
                    lotesCoincidentes.length,

                  lotesDisponibles:
                    lotesCoincidentes.filter(
                      (
                        lote
                      ) =>
                        lote.disponible
                    ).length,

                  lotesVendidos:
                    lotesCoincidentes.filter(
                      (
                        lote
                      ) =>
                        lote.vendido
                    ).length,

                  areaLotes:
                    lotesCoincidentes.reduce(
                      (
                        total,
                        lote
                      ) =>
                        total +
                        numero(
                          lote.area
                        ),
                      0
                    ),

                  valorTotalLotes:
                    lotesCoincidentes.reduce(
                      (
                        total,
                        lote
                      ) =>
                        total +
                        numero(
                          lote.valor
                        ),
                      0
                    ),

                  valorInventarioDisponible:
                    lotesCoincidentes
                      .filter(
                        (
                          lote
                        ) =>
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
                      ),
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
                )
            );
      }

      /* =====================================================
         DETALLE PLANO DE LOTES

         Esto facilitará PDF / Excel / HTML.
      ===================================================== */

      const detalleLotes =
        [];

      registros.forEach(
        (
          registro
        ) => {
          registro.lotes.forEach(
            (
              lote
            ) => {
              detalleLotes.push({
                _id:
                  lote._id,

                manzana: {
                  _id:
                    registro._id,

                  codigo:
                    registro.codigo,

                  metrosTotales:
                    registro.metrosTotales,
                },

                codigo:
                  lote.codigo,

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
          (
            lote
          ) =>
            normalizarTexto(
              lote.estado
            ) ===
            "disponible"
        ).length;

      const lotesVendidos =
        detalleLotes.filter(
          (
            lote
          ) =>
            normalizarTexto(
              lote.estado
            ) ===
            "vendido"
        ).length;

      const lotesRegulares =
        detalleLotes.filter(
          (
            lote
          ) =>
            normalizarTexto(
              lote.tipo
            ) ===
            "regular"
        ).length;

      const lotesIrregulares =
        detalleLotes.filter(
          (
            lote
          ) =>
            normalizarTexto(
              lote.tipo
            ) ===
            "irregular"
        ).length;

      const areaTotalManzanas =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.metrosTotales
            ),
          0
        );

      const areaTotalLotes =
        detalleLotes.reduce(
          (
            total,
            lote
          ) =>
            total +
            numero(
              lote.area
            ),
          0
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
            (
              lote
            ) =>
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

          lotesVendidos,

          lotesRegulares,

          lotesIrregulares,

          areaTotalManzanas,

          areaTotalLotes,

          diferenciaArea:
            areaTotalManzanas >
            0
              ? areaTotalManzanas -
                areaTotalLotes
              : 0,

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