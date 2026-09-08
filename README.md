# MINUTO 93

Tienda de zapatillas y camisetas de fútbol de segunda mano. Web estática: sin
build, sin npm, sin backend. Se abre con doble clic o se arrastra a cualquier
hosting.

**Sin carrito, a propósito.** Cada pieza tiene una ficha con su año, su estado
real y su tallaje medido, y se reserva hablando: email o WhatsApp.

## Qué hace

- **Archivo** de piezas con filtros por tipo y ficha a pantalla completa.
- **Tallaje propio por producto**: talla EU y plantilla en cm para zapas, pecho
  × largo para camisetas. Las tallas agotadas se muestran tachadas, no se
  esconden.
- **Vista 3D** generada desde la propia foto: separa la pieza del fondo, levanta
  la silueta y le añade relieve según la luz. Es una malla real de Three.js que
  se gira con el dedo, no un vídeo.
- **Modo admin** con contraseña: alta, edición y borrado de piezas, subida de
  varias fotos (se comprimen a WebP y se guardan en IndexedDB), gestión del
  buzón y exportación/importación del catálogo en JSON.
- **Fichas redactadas automáticamente** por un motor local incluido en el
  proyecto y, si el administrador guarda una API key de Anthropic en su
  navegador, por `claude-opus-5`.
- **Buzón de peticiones** con muro público moderable.

## Cómo verla

```bash
python -m http.server 8765
```

Y abrir `http://localhost:8765`. Con doble clic en `index.html` funciona todo
menos el relieve del 3D: el navegador no deja leer los píxeles de las fotos
locales.

## Cómo publicarla

**Vercel:** entra en <https://vercel.com/new>, importa este repositorio, deja el
*Framework Preset* en **Other** y pulsa *Deploy*. No hay build ni dependencias
que instalar. A partir de ahí cada `git push` publica la versión nueva sola.

La configuración de cabeceras y caché ya está en `vercel.json`, y
`.vercelignore` deja fuera las fotos originales sin comprimir.

**Hostinger o similar:** arrastra el contenido de la carpeta a `public_html`,
incluido el `.htaccess` (que es el equivalente de `vercel.json` para Apache).

## Documentación

Todo lo demás —modo admin, dónde se guardan los datos, cómo cambiar textos y
colores, cómo publicarla— está en **[LEEME.md](LEEME.md)**.

## Estructura

```
index.html          La web entera (una sola página)
vercel.json         Cabeceras y caché para el despliegue en Vercel
styles.css          Diseño
main.js             Arranque y efectos
lib/manifest.js     Marca, contacto, tallajes y catálogo de fábrica
lib/store.js        Guardado en el navegador (localStorage + IndexedDB)
lib/ia.js           Redactor de fichas
lib/vista3d.js      Generación del modelo 3D desde la foto
lib/ficha.js        Ficha de producto
lib/admin.js        Panel de administración
assets/             Fotos (WebP) y créditos
```

## Aviso sobre las fotos

Las fotos del catálogo de ejemplo son de [Openverse](https://openverse.org) con
licencia Creative Commons; la atribución de cada una está en
`assets/credits.json`. Están para sustituirlas por fotos reales de las piezas.
