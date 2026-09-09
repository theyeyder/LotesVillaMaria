import {
  build,
} from "esbuild";

import {
  mkdir,
  rm,
} from "fs/promises";

import path from "path";

import {
  fileURLToPath,
} from "url";

/* =========================================================
   RUTAS
========================================================= */

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const carpetaDist =
  path.join(
    __dirname,
    "dist"
  );

const archivoEntrada =
  path.join(
    __dirname,
    "src",
    "server.js"
  );

const archivoSalida =
  path.join(
    carpetaDist,
    "server.mjs"
  );

/* =========================================================
   LIMPIAR DIST
========================================================= */

console.log("");
console.log(
  "=============================================="
);

console.log(
  "   LOTES VILLA MARÍA - BUILD COMERCIAL"
);

console.log(
  "=============================================="
);

console.log("");

console.log(
  "Limpiando compilación anterior..."
);

await rm(
  carpetaDist,
  {
    recursive: true,
    force: true,
  }
);

await mkdir(
  carpetaDist,
  {
    recursive: true,
  }
);

/* =========================================================
   COMPILAR BACKEND
========================================================= */

console.log(
  "Compilando backend..."
);

await build({
  entryPoints: [
    archivoEntrada,
  ],

  outfile:
    archivoSalida,

  bundle:
    true,

  platform:
    "node",

  format:
    "esm",

  target:
    "node24",

  packages:
    "external",

  minify:
    true,

  sourcemap:
    false,

  legalComments:
    "none",

  logLevel:
    "info",
});

/* =========================================================
   TERMINADO
========================================================= */

console.log("");

console.log(
  "Backend compilado correctamente."
);

console.log("");

console.log(
  `Archivo generado:`
);

console.log(
  archivoSalida
);

console.log("");

console.log(
  "=============================================="
);

console.log(
  "   BUILD FINALIZADO"
);

console.log(
  "=============================================="
);

console.log("");