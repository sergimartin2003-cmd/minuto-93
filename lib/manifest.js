/* =============================================================
   MINUTO 93 — datos de la marca y catálogo semilla
   Este archivo es el ÚNICO sitio donde tocar el catálogo "de fábrica".
   Lo que añadas desde el modo admin se guarda en el navegador
   (localStorage + IndexedDB) y manda sobre esto.
   ============================================================= */
(function () {
  "use strict";

  window.__BRAND__ = {
    nombre: "MINUTO 93",
    lema: "Zapas y camisetas con biografía",
    ciudad: "Barcelona",
    email: "hola@minuto93.com",
    instagram: "@minuto93",
    whatsapp: "+34600000000",

    /* Guías de tallaje por familia de producto ------------------ */
    guias: {
      zapas: {
        titulo: "Zapas · talla EU",
        nota: "Medimos la plantilla interior en centímetros. Si dudas entre dos, mide un pie por la tarde y con calcetín.",
        filas: [
          { talla: "39", cm: "24,5 cm" },
          { talla: "40", cm: "25,0 cm" },
          { talla: "41", cm: "26,0 cm" },
          { talla: "42", cm: "26,5 cm" },
          { talla: "43", cm: "27,5 cm" },
          { talla: "44", cm: "28,0 cm" },
          { talla: "45", cm: "29,0 cm" },
          { talla: "46", cm: "29,5 cm" }
        ]
      },
      camiseta: {
        titulo: "Camisetas · pecho × largo",
        nota: "Medidas de la prenda en plano, no del cuerpo. El pecho se mide de costura a costura por debajo de la manga.",
        filas: [
          { talla: "S", cm: "48 × 68 cm" },
          { talla: "M", cm: "52 × 71 cm" },
          { talla: "L", cm: "55 × 74 cm" },
          { talla: "XL", cm: "58 × 77 cm" },
          { talla: "XXL", cm: "61 × 80 cm" }
        ]
      }
    },

    /* Catálogo semilla ------------------------------------------
       tipo:    "zapas" | "camiseta"
       tallas:  [{ talla, stock }]   stock 0 = agotada (se muestra tachada)
       fotos:   rutas relativas; la primera es la principal
    ------------------------------------------------------------- */
    productos: [
      {
        id: "m93-001",
        tipo: "zapas",
        nombre: "Blanca de piel",
        subtitulo: "Corte bajo · 1995",
        precio: 120,
        estado: "Usada · 8/10",
        minuto: "Minuto 12",
        historia: "Encontrada en un almacén de Terrassa dentro de su caja original, con el papel de seda todavía puesto.",
        descripcion: "Piel lisa que ya no se hace así: gruesa, de poro visible, con una pátina cálida en la puntera que sólo dan treinta años de armario. La suela conserva el dibujo entero y el interior no tiene hundimientos. Un zapato de vestir disfrazado de deportiva, para quien prefiere que la ropa hable bajo.",
        fotos: ["assets/img/p-air-1.webp"],
        tallas: [
          { talla: "40", stock: 1 }, { talla: "41", stock: 1 },
          { talla: "42", stock: 0 }, { talla: "43", stock: 2 }, { talla: "44", stock: 1 }
        ],
        notaTalla: "Talla justa. Si estás entre dos números, coge el mayor."
      },
      {
        id: "m93-002",
        tipo: "camiseta",
        nombre: "Roja de local",
        subtitulo: "Temporada 98/99",
        precio: 85,
        estado: "Usada · 9/10",
        minuto: "Minuto 45+2",
        historia: "Del vestuario de un filial del Vallès. La lavaron tantas veces que el escudo se quedó mate, y le sienta bien.",
        descripcion: "Poliéster de los que respiraban poco y aguantaban todo. Rojo profundo, cuello de pico reforzado y escudo bordado punto a punto, no estampado. Ni una rotura, ni un tirón: la prenda de un suplente que jugó poco y la cuidó mucho.",
        fotos: ["assets/img/p-camiseta-c.webp", "assets/img/p-retro-1.webp"],
        tallas: [
          { talla: "S", stock: 0 }, { talla: "M", stock: 1 },
          { talla: "L", stock: 1 }, { talla: "XL", stock: 1 }
        ],
        notaTalla: "Corte de época: más ancha de pecho y más corta de largo que una camiseta actual."
      },
      {
        id: "m93-003",
        tipo: "zapas",
        nombre: "Runner de malla",
        subtitulo: "Gris piedra · 2001",
        precio: 95,
        estado: "Usada · 7/10",
        minuto: "Minuto 27",
        historia: "Comprada a un corredor de montaña que se pasó a las de placa de carbono y no volvió a mirar atrás.",
        descripcion: "Malla técnica gris con refuerzos de ante en los flancos, esa combinación que ahora imitan todas. La entresuela sigue firme al apretar y el desgaste del talón es simétrico, señal de pisada neutra. No huele a nada, que en una zapa de veinte años es el mejor cumplido posible.",
        fotos: ["assets/img/p-run-1.webp"],
        tallas: [
          { talla: "41", stock: 1 }, { talla: "42", stock: 1 },
          { talla: "43", stock: 1 }, { talla: "45", stock: 0 }
        ],
        notaTalla: "Horma ancha. Con calcetín grueso entra sin apretar."
      },
      {
        id: "m93-004",
        tipo: "camiseta",
        nombre: "Visitante amarilla",
        subtitulo: "Temporada 02/03",
        precio: 70,
        estado: "Usada · 8/10",
        minuto: "Minuto 63",
        historia: "Apareció en un mercadillo de Sants, doblada dentro de una bolsa de plástico con el ticket de 2003 dentro.",
        descripcion: "Amarillo de bengala, sin dorsal y sin patrocinador en la espalda. Malla perforada con el brillo justo que se apaga con el uso y aquí sigue intacto. Escudo bordado, cuello con ribete verde y costuras laterales sin ceder. Se lleva sola con vaqueros oscuros y sin más explicación.",
        fotos: ["assets/img/p-kit-1.webp"],
        tallas: [
          { talla: "M", stock: 1 }, { talla: "L", stock: 2 }, { talla: "XL", stock: 0 }
        ],
        notaTalla: "Talla como una camiseta actual. Si la quieres holgada, sube una."
      },
      {
        id: "m93-005",
        tipo: "zapas",
        nombre: "Lona pintada a mano",
        subtitulo: "Pieza única · sin año",
        precio: 65,
        estado: "Usada · 7/10",
        minuto: "Minuto 78",
        historia: "De una ilustradora de Poble-sec que las pintó para una feria y se las puso dos veces. Llevaban diez años en una caja.",
        descripcion: "Lona blanca pintada a mano con acrílico: damero, estrellas y una guirnalda que recorre todo el flanco. El dibujo está sellado y no se ha cuarteado; la puntera de goma amarillea justo lo necesario. Cordones de cinta original, deshilachados en las puntas. No hay otro par igual y nunca lo habrá.",
        fotos: ["assets/img/p-hi-2.webp"],
        tallas: [
          { talla: "39", stock: 1 }, { talla: "40", stock: 1 },
          { talla: "42", stock: 1 }, { talla: "44", stock: 1 }
        ],
        notaTalla: "Talla grande. Baja media respecto a tu número habitual."
      },
      {
        id: "m93-006",
        tipo: "camiseta",
        nombre: "Granate y azul",
        subtitulo: "Temporada 06/07",
        precio: 110,
        estado: "Nueva con etiqueta",
        minuto: "Minuto 90",
        historia: "Stock muerto de una tienda de deportes que cerró en 2011. Cincuenta unidades sin abrir. Nos quedan tres.",
        descripcion: "Tejido pesado, del que cae recto y no se pega al cuerpo. Franja granate sobre azul, escudo aplicado en fieltro cosido y cuello reforzado por dentro. Al ser stock antiguo conserva la etiqueta de cartón y el olor a tienda cerrada. La prenda más nueva del archivo y, a la vez, la más vieja.",
        fotos: ["assets/img/p-camiseta-a.webp", "assets/img/p-retro-1.webp"],
        tallas: [
          { talla: "S", stock: 1 }, { talla: "M", stock: 1 }, { talla: "L", stock: 1 }
        ],
        notaTalla: "Algodón: puede encoger un dedo de largo en el primer lavado. Agua fría."
      },
      {
        id: "m93-007",
        tipo: "zapas",
        nombre: "Botas de tacos",
        subtitulo: "Piel negra · 1997",
        precio: 140,
        estado: "Usada · 8/10",
        minuto: "Minuto 5",
        historia: "De un lateral izquierdo de regional que las guardó el día que se rompió el cruzado. No volvió a usarlas.",
        descripcion: "Piel negra sin una sola marca en el empeine. Los tacos de aluminio están enteros y roscan sin forzar. La lengüeta plegable todavía tiene cuerpo. No son para jugar: son para tenerlas fuera de la caja, en una estantería, mirándolas.",
        fotos: ["assets/img/p-boots-1.webp", "assets/img/p-boots-2.webp"],
        tallas: [
          { talla: "41", stock: 1 }, { talla: "42", stock: 1 }, { talla: "43", stock: 0 }
        ],
        notaTalla: "Piel sin forro: da de sí media talla con el uso."
      },
      {
        id: "m93-008",
        tipo: "camiseta",
        nombre: "Portero verde",
        subtitulo: "Manga larga · 96/97",
        precio: 95,
        estado: "Usada · 8/10",
        minuto: "Minuto 93",
        historia: "La camiseta con la que empezó todo esto. Estuvo colgada dos años en casa antes de que existiera la tienda.",
        descripcion: "Verde botella con las cuñas negras en hombros y costados, codos reforzados sin abrir y puño elástico que todavía aprieta. Manga larga, cuello de pico con refuerzo interior. Tiene una marca de hierba en la cadera derecha que no quisimos quitar: es la prueba de que sirvió para algo.",
        fotos: ["assets/img/p-portero-1.webp"],
        tallas: [
          { talla: "M", stock: 1 }, { talla: "L", stock: 1 }, { talla: "XL", stock: 1 }
        ],
        notaTalla: "Camiseta de portero: una talla más ancha de lo normal, a propósito."
      }
    ],

    /* Peticiones de ejemplo del buzón (el admin puede borrarlas) */
    peticiones: [
      { id: "q-1", nombre: "Nil", tipo: "camiseta", pieza: "Cualquier camiseta de portero de los 90 con manga larga.", talla: "L", contacto: "", fecha: "2026-08-21", publica: true },
      { id: "q-2", nombre: "Marta", tipo: "zapas", pieza: "Runner de malla en 38 o 39, mejor si es gris.", talla: "39", contacto: "", fecha: "2026-08-29", publica: true },
      { id: "q-3", nombre: "Edu", tipo: "camiseta", pieza: "Una segunda equipación amarilla sin dorsal ni patrocinador.", talla: "M", contacto: "", fecha: "2026-09-02", publica: true }
    ]
  };
})();
