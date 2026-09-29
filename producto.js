let products = ListaProductos;

// Dibuja las tarjetas según el buscador y los filtros
function render() {
    const q = norm($("q").value);
    const c = $("categoria").value;
    const pr = $("promocion").value;

    // Se queda con los productos que cumplen categoría, promoción y búsqueda
    const list = products.filter(p =>
        (!c || p.categoria === c) &&
        (!pr || p.promocion === pr) &&
        (!q || norm(`${p.producto} ${p.descripcion} ${p.codigo}`).includes(q))
    );

    // Convierte cada producto en HTML y lo inserta en la grilla
    $("grid").innerHTML = list.map(p => {
        const pk = norm(p.promocion);

        return `
        <article class="card ${pk === "agotado" ? "out" : ""}">

            ${p.promocion
                ? `<span class="tag t-${esc(pk)}">${esc(p.promocion)}</span>`
                : ""
            }

            ${p.imagen
                ? `<img 
                    src="${esc(p.imagen)}" 
                    alt="${esc(p.producto)}" 
                    loading="lazy"
                    onerror="this.outerHTML='<div class=noimg>Sin imagen</div>'"
                  >`
                : `<div class="noimg">Sin imagen</div>`
            }

            <div class="body">

                ${p.categoria
                    ? `<span class="cat">${esc(p.categoria)}</span>`
                    : ""
                }

                <span class="name">${esc(p.producto)}</span>

                ${p.codigo
                    ? `<span class="code">Cód: ${esc(p.codigo)}</span>`
                    : ""
                }

                ${p.descripcion
                    ? `<span class="desc">${esc(p.descripcion)}</span>`
                    : ""
                }

                ${chips("Colores", p.colores)}
                ${chips(p.tipomedida || "Medidas", p.medidas)}

                <div class="prices">

                    ${p.pmenor != null
                        ? `<span class="menor">${esc(fmt(p.pmenor))}</span>`
                        : ""
                    }

                    ${MOSTRAR_MAYORISTA && p.pmayor != null
                        ? `<span class="mayor">Mayorista: ${esc(fmt(p.pmayor))}</span>`
                        : ""
                    }

                </div>

            </div>
        </article>`;
    }).join("");

    // Si no hay resultados muestra un aviso
    $("msg").textContent = list.length
        ? ""
        : "No se encontraron productos.";
}


// Llena un desplegable con los valores únicos y ordenados
function fillSelect(id, key) {

    [...new Set(
        products
            .map(p => p[key])
            .filter(Boolean)
    )]
    .sort()
    .forEach(v => {

        const o = document.createElement("option");

        o.value = v;
        o.textContent = v;

        $(id).appendChild(o);
    });
}


/* ================= INICIO ================= */

// Inicializa los filtros y dibuja los productos
function init() {

    try {

        fillSelect("categoria", "categoria");
        fillSelect("promocion", "promocion");

        render();

    } catch (e) {

        $("msg").textContent =
            "No se pudieron cargar los productos.";

        console.error(e);
    }
}


// Cada vez que escribes o cambias un filtro,
// se vuelven a dibujar las tarjetas
$("q").addEventListener("input", render);
$("categoria").addEventListener("change", render);
$("promocion").addEventListener("change", render);


init();