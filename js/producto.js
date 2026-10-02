//import { ListaProductos, ObtenerProductos } from "./gsheets.js";
//
//let productos = [];
//async function mostrarProductos() {
//    await ObtenerProductos();
//    productos = ListaProductos;
//}
//mostrarProductos(); 


import { ListaProductos, ObtenerProductos } from "./gsheets.js";

//* ================= CONFIGURACIÓN ================= */
const MONEDA = "$";

//* ================= ATAJOS ================= */
const $ = id => document.getElementById(id);

//* ================= IMAGEN ================= */
// Arma la ruta local de la imagen de portada según categoría e id
// Ejemplo: categoria="remeras", id="001" -> "imagenes/remeras/001-img1.avif"
function resolverImagen(categoria, id) {
    if (!categoria || !id) return null;
    return `img/${categoria.toLowerCase()}/${id}-img1.avif`;
}

//* ================= FORMATO ================= */
// Da formato de precio argentino: 15000 -> "$15.000"
function formatearPrecio(numero) {
    if (numero === null || numero === undefined || numero === "") return "";
    if (typeof numero !== "number") return numero; // si no es número, lo muestra tal cual
    return MONEDA + numero.toLocaleString("es-AR");
}

// Evita que texto de la hoja rompa el HTML (seguridad básica)
function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// Arma el bloque "Etiqueta: chip chip chip" (colores, medidas). Si la lista está vacía, no dibuja nada
function chips(etiqueta, lista) {
    if (!lista || !lista.length) return "";
    const botones = lista.map(x => `<span class="chip">${esc(x)}</span>`).join("");
    return `<div class="opts"><b>${esc(etiqueta)}:</b>${botones}</div>`;
}

//* ================= TARJETA DE UN PRODUCTO ================= */
function crearTarjeta(p) {
    const promoClase = p.promocion ? p.promocion.toLowerCase().trim() : "";
    const img = resolverImagen(p.categoria, p.codigo);

    return `
    <article class="card">
    ${p.promocion ? `<span class="tag t-${esc(promoClase)}">${esc(p.promocion)}</span>` : ""}
    ${img
        ? `<img src="${esc(img)}" alt="${esc(p.producto)}" loading="lazy"
            onerror="this.outerHTML='<div class=noimg>Sin imagen</div>'">`
        : `<div class="noimg">Sin imagen</div>`}
    <div class="body">
        ${p.categoria ? `<span class="cat">${esc(p.categoria)}</span>` : ""}
        <span class="name">${esc(p.producto)}</span>
        ${p.codigo ? `<span class="code">Cód: ${esc(p.codigo)}</span>` : ""}
        ${p.descripcion ? `<span class="desc">${esc(p.descripcion)}</span>` : ""}
        ${chips("Colores", p.colores)}
        ${chips(p.tipomedida || "Medidas", p.medidas)}
        <div class="prices">
        ${p.pmenor ? `<span class="menor">${esc(formatearPrecio(p.pmenor))}</span>` : ""}
        ${p.pmayor ? `<span class="mayor">Mayorista: ${esc(formatearPrecio(p.pmayor))}</span>` : ""}
        </div>
    </div>
    </article>`;
}

//* ================= FILTROS Y BÚSQUEDA ================= */
function aplicarFiltros() {
    const texto = $("q").value.trim().toLowerCase();
    const categoria = $("categoria").value;
    const promocion = $("promocion").value;

    return ListaProductos.filter(p => {
        // Solo muestra productos marcados como "Mostrar" en la columna Web
        if (p.web && p.web.toLowerCase() !== "mostrar") return false;
        if (categoria && p.categoria !== categoria) return false;
        if (promocion && p.promocion !== promocion) return false;
        if (texto) {
            const contenido = `${p.producto} ${p.descripcion} ${p.codigo}`.toLowerCase();
            if (!contenido.includes(texto)) return false;
        }
        return true;
    });
}

//* ================= DIBUJAR ================= */
function renderizar() {
    const lista = aplicarFiltros();
    $("grid").innerHTML = lista.map(crearTarjeta).join("");
    $("msg").textContent = lista.length ? "" : "No se encontraron productos.";
}

// Llena un <select> con los valores únicos de una propiedad (categoría o promoción)
function llenarSelect(id, propiedad) {
    const valores = [...new Set(ListaProductos.map(p => p[propiedad]).filter(Boolean))].sort();
    const select = $(id);
    valores.forEach(v => {
        const opcion = document.createElement("option");
        opcion.value = v;
        opcion.textContent = v;
        select.appendChild(opcion);
    });
}

//* ================= INICIO ================= */
async function iniciar() {
    await ObtenerProductos();      // espera a que terminen de llegar los datos de Google Sheets

    llenarSelect("categoria", "categoria");
    llenarSelect("promocion", "promocion");
    renderizar();

    // Vuelve a dibujar cada vez que se escribe o se cambia un filtro
    $("q").addEventListener("input", renderizar);
    $("categoria").addEventListener("change", renderizar);
    $("promocion").addEventListener("change", renderizar);
}

iniciar();


