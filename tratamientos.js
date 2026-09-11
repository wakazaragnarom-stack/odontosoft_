
function normalizarRolNav(rol){return String(rol||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function aplicarNavegacionPorRol(){
    let u=null; try{u=JSON.parse(localStorage.getItem("usuario_actual")||"null")}catch{}
    if(!u)return;
    const rol=normalizarRolNav(u.rol);
    if(rol!=="odontologo")return;
    document.querySelectorAll('.sidebar-menu a[href="roles.html"], .sidebar-menu a[href="proveedores.html"]').forEach(a=>a.remove());
    const usuarios=document.querySelector('.sidebar-menu a[href="panel.html"]');
    if(usuarios){usuarios.href="panel_odontologo.html";usuarios.querySelectorAll('.material-symbols-outlined').forEach(i=>i.textContent="group");usuarios.lastChild.textContent=" Pacientes";}
}
// ============================================
// TRATAMIENTOS.JS - Gestión de Tratamientos
// ============================================

const API = "http://127.0.0.1:8000";

let tratamientoAEliminar = null;

function rolActual() {
    try { return JSON.parse(localStorage.getItem("usuario_actual") || "null")?.rol || ""; }
    catch { return ""; }
}

const ES_ODONTOLOGO = () => String(rolActual()).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase() === "odontologo";


// ============================================================
// TOAST
// ============================================================

function toast(msg, tipo = "success") {

    const t = document.getElementById("toast");

    if (!t) return;

    t.textContent = msg;

    t.className = `toast show ${tipo}`;

    setTimeout(() => {

        t.classList.remove("show");

    }, 3500);
}

window.toast = toast;


// ============================================================
// API
// ============================================================

async function api(method, path, body = null) {

    try {

        const opciones = {

            method: method,

            headers: {
                "Content-Type": "application/json",
                "X-User-Role": rolActual()
            }

        };


        if (body !== null) {

            opciones.body = JSON.stringify(body);

        }


        const res = await fetch(
            `${API}${path}`,
            opciones
        );


        if (!res.ok) {

            const errorData =
                await res.json().catch(() => ({}));


            throw new Error(
                errorData.detail ||
                `Error ${res.status}`
            );
        }


        if (res.status === 204) {

            return null;

        }


        return await res.json();

    } catch (error) {

        console.error(
            `❌ Error en API ${method} ${path}:`,
            error
        );

        throw error;
    }
}


// ============================================================
// FORMATEAR PRECIO EN PESOS COLOMBIANOS
//
// Ejemplos:
//
// 1000       → 1.000
// 10000      → 10.000
// 150000     → 150.000
// 1250000    → 1.250.000
// ============================================================

function formatearPrecioCOP(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "";

    }


    // Convertir a texto

    let texto = String(valor);


    // Eliminar símbolo $, COP y espacios

    texto = texto
        .replace(/\$/g, "")
        .replace(/COP/gi, "")
        .replace(/\s/g, "");


    // Dejar únicamente números

    const numero = texto.replace(/\D/g, "");


    if (!numero) {

        return "";

    }


    return Number(numero).toLocaleString("es-CO");
}

window.formatearPrecioCOP = formatearPrecioCOP;


// ============================================================
// OBTENER PRECIO NUMÉRICO PARA LA API
//
// Ejemplo:
//
// "150.000"       → 150000
// "$ 150.000 COP" → 150000
// ============================================================

function obtenerPrecioNumerico(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return 0;

    }


    let texto = String(valor);


    texto = texto
        .replace(/\$/g, "")
        .replace(/COP/gi, "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(/,/g, "");


    const numero = texto.replace(/\D/g, "");


    return Number(numero) || 0;
}

window.obtenerPrecioNumerico = obtenerPrecioNumerico;


// ============================================================
// MOSTRAR PRECIO EN LA TABLA
//
// Ejemplo:
//
// 150000 → $ 150.000 COP
// ============================================================

function mostrarPrecioCOP(valor) {

    const numero = Number(valor) || 0;


    return `$ ${numero.toLocaleString("es-CO")} COP`;
}

window.mostrarPrecioCOP = mostrarPrecioCOP;


// ============================================================
// CARGAR TRATAMIENTOS
// ============================================================

async function cargarTratamientos() {

    try {

        console.log(
            "🔄 Cargando tratamientos..."
        );


        const lista =
            await api(
                "GET",
                "/tratamientos"
            );


        console.log(
            "✅ Tratamientos cargados:",
            lista.length
        );


        renderTabla(lista);

    } catch (error) {

        console.error(
            "❌ Error al cargar tratamientos:",
            error
        );


        toast(
            "❌ No se pudo conectar con la API",
            "error"
        );


        const tabla =
            document.getElementById(
                "tablaTratamientos"
            );


        if (tabla) {

            tabla.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:30px;
                            color:var(--text-muted)
                        "
                    >

                        ❌ Error al cargar los datos:

                        ${error.message}

                    </td>

                </tr>

            `;

        }

    }
}

window.cargarTratamientos =
    cargarTratamientos;


// ============================================================
// RENDERIZAR TABLA
// ============================================================

function renderTabla(lista) {

    const tbody =
        document.getElementById(
            "tablaTratamientos"
        );


    if (!tbody) return;


    if (
        !lista ||
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                        color:var(--text-muted)
                    "
                >

                    Sin tratamientos registrados

                </td>

            </tr>

        `;

        return;
    }


    // Ordenar por ID

    lista.sort(
        (a, b) =>
            a.id_tratamiento -
            b.id_tratamiento
    );


    tbody.innerHTML = lista.map(
        (t, index) => {


            // Obtener costo

            const costo =
                Number(t.costo) || 0;


            // Formatear precio

            const precioFormateado =
                mostrarPrecioCOP(costo);


            // Nombre seguro para onclick

            const nombreSeguro =
                String(
                    t.nombre || ""
                )
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'");


            return `

                <tr>

                    <!-- ID -->

                    <td>

                        <strong>
                            ${index + 1}
                        </strong>

                    </td>


                    <!-- NOMBRE -->

                    <td>

                        <strong>
                            ${t.nombre || "—"}
                        </strong>

                    </td>


                    <!-- DESCRIPCIÓN -->

                    <td>

                        ${
                            t.descripcion ||
                            "—"
                        }

                    </td>


                    <!-- PRECIO -->

                    <td>

                        <span class="precio-tabla">

                            ${precioFormateado}

                        </span>

                    </td>


                    <!-- ACCIONES -->

                    <td>


                        <!-- EDITAR -->

                        <button
                            class="btn-icon"
                            title="Editar"
                            onclick="editarTratamiento(${t.id_tratamiento})"
                        >

                            <span class="material-symbols-outlined">
                                edit
                            </span>

                        </button>


                        <!-- ELIMINAR -->

                        <button
                            class="btn-danger"
                            title="Eliminar"
                            onclick="abrirConfirmModal(
                                ${t.id_tratamiento},
                                '${nombreSeguro}',
                                ${costo}
                            )"
                        >

                            <span class="material-symbols-outlined">
                                delete
                            </span>

                        </button>

                    </td>

                </tr>

            `;

        }
    ).join("");
}


// ============================================================
// ABRIR MODAL NUEVO
// ============================================================

function abrirModal() {

    const precioInputNuevo = document.getElementById("inPrecio");
    if (precioInputNuevo) precioInputNuevo.disabled = false;

    document.getElementById(
        "editId"
    ).value = "";


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Nuevo Tratamiento";


    document.getElementById(
        "inNombre"
    ).value = "";


    document.getElementById(
        "inDescripcion"
    ).value = "";


    document.getElementById(
        "inPrecio"
    ).value = "";


    const btn =
        document.getElementById(
            "btnGuardarTratamiento"
        );


    btn.disabled = false;


    btn.innerHTML =
        `
        <span class="material-symbols-outlined">
            save
        </span>
        Guardar
        `;


    document.getElementById(
        "modalTrat"
    ).classList.add("open");


    setTimeout(() => {

        document.getElementById(
            "inNombre"
        )?.focus();

    }, 100);
}

window.abrirModal = abrirModal;


// ============================================================
// CERRAR MODAL
// ============================================================

function cerrarModal() {

    document.getElementById(
        "modalTrat"
    ).classList.remove("open");
}

window.cerrarModal = cerrarModal;


// ============================================================
// EDITAR TRATAMIENTO
// ============================================================

async function editarTratamiento(id) {

    try {

        const t =
            await api(
                "GET",
                `/tratamientos/${id}`
            );


        // ID

        document.getElementById(
            "editId"
        ).value =
            t.id_tratamiento;


        // Título

        document.getElementById(
            "modalTitulo"
        ).textContent =
            "Editar Tratamiento";


        // Nombre

        document.getElementById(
            "inNombre"
        ).value =
            t.nombre || "";


        // Descripción

        document.getElementById(
            "inDescripcion"
        ).value =
            t.descripcion || "";


        // Precio

        const costo =
            Number(t.costo) || 0;


        document.getElementById(
            "inPrecio"
        ).value =
            costo > 0
                ? formatearPrecioCOP(costo)
                : "";

        // El odontólogo puede consultar el precio, pero no modificarlo.
        const precioInput = document.getElementById("inPrecio");
        if (precioInput) {
            precioInput.disabled = ES_ODONTOLOGO();
            precioInput.title = ES_ODONTOLOGO() ? "El precio solo puede ser modificado por el administrador" : "";
        }


        // Botón

        const btn =
            document.getElementById(
                "btnGuardarTratamiento"
            );


        btn.disabled = false;


        btn.innerHTML =
            `
            <span class="material-symbols-outlined">
                save
            </span>
            Guardar
            `;


        // Abrir modal

        document.getElementById(
            "modalTrat"
        ).classList.add("open");

    } catch (error) {

        console.error(
            "❌ Error al cargar tratamiento:",
            error
        );


        toast(
            "❌ Error al cargar el tratamiento",
            "error"
        );
    }
}

window.editarTratamiento =
    editarTratamiento;


// ============================================================
// GUARDAR TRATAMIENTO
// ============================================================

async function guardarTratamiento() {

    // ID

    const id =
        document.getElementById(
            "editId"
        ).value;


    // Nombre

    const nombre =
        document.getElementById(
            "inNombre"
        ).value.trim();


    // Descripción

    const descripcion =
        document.getElementById(
            "inDescripcion"
        ).value.trim();


    // Precio escrito

    const precioTexto =
        document.getElementById(
            "inPrecio"
        ).value;


    // Convertir:

    // 150.000 → 150000

    const costo =
        obtenerPrecioNumerico(
            precioTexto
        );

    // El odontólogo nunca puede cambiar el precio. En edición, el backend
    // también lo bloquea; aquí evitamos enviar el campo costo.
    const odontologoEditando = ES_ODONTOLOGO() && Boolean(id);


    const btn =
        document.getElementById(
            "btnGuardarTratamiento"
        );


    // ========================================================
    // VALIDAR NOMBRE
    // ========================================================

    if (!nombre) {

        toast(
            "⚠️ Por favor, ingresa el nombre del tratamiento",
            "warning"
        );


        document.getElementById(
            "inNombre"
        ).focus();


        return;
    }


    // ========================================================
    // VALIDAR PRECIO
    // ========================================================

    if (costo <= 0) {

        toast(
            "⚠️ Por favor, ingresa un precio válido",
            "warning"
        );


        document.getElementById(
            "inPrecio"
        ).focus();


        return;
    }


    // ========================================================
    // DESACTIVAR BOTÓN
    // ========================================================

    btn.disabled = true;


    btn.innerHTML =
        `
        <span class="material-symbols-outlined spinner">
            progress_activity
        </span>

        Guardando...
        `;


    try {

        // ====================================================
        // DATOS PARA FASTAPI
        // ====================================================

        const data = {

            nombre: nombre,

            descripcion: descripcion,

            // IMPORTANTE:
            // Se envía como número.
            //
            // 150.000 → 150000

            ...(odontologoEditando ? {} : { costo: costo })

        };


        console.log(
            "📤 Datos enviados:",
            data
        );


        // ====================================================
        // ACTUALIZAR
        // ====================================================

        if (id) {

            await api(
                "PUT",
                `/tratamientos/${id}`,
                data
            );


            toast(
                "✅ Tratamiento actualizado correctamente",
                "success"
            );

        }


        // ====================================================
        // CREAR
        // ====================================================

        else {

            await api(
                "POST",
                "/tratamientos",
                data
            );


            toast(
                "✅ Tratamiento creado correctamente",
                "success"
            );
        }


        // Cerrar modal

        cerrarModal();


        // Recargar tabla

        await cargarTratamientos();

    } catch (error) {

        console.error(
            "❌ Error al guardar tratamiento:",
            error
        );


        toast(
            `❌ ${error.message || "Error al guardar"}`,
            "error"
        );


        btn.disabled = false;


        btn.innerHTML =
            `
            <span class="material-symbols-outlined">
                save
            </span>

            Guardar
            `;
    }
}

window.guardarTratamiento =
    guardarTratamiento;


// ============================================================
// ABRIR MODAL CONFIRMACIÓN ELIMINAR
// ============================================================

function abrirConfirmModal(
    id,
    nombre,
    precio
) {

    tratamientoAEliminar = id;


    // Icono

    const icon =
        document.getElementById(
            "confirmIcon"
        );


    icon.textContent =
        "warning";


    icon.className =
        "material-symbols-outlined confirm-icon warning";


    // Título

    document.getElementById(
        "confirmTitulo"
    ).textContent =
        "¿Eliminar este tratamiento?";


    // Mensaje

    document.getElementById(
        "confirmMensaje"
    ).textContent =
        "Esta acción no se puede deshacer. El tratamiento será eliminado permanentemente del sistema.";


    // Nombre

    document.getElementById(
        "confirmNombre"
    ).textContent =
        nombre || "—";


    // Precio

    document.getElementById(
        "confirmPrecio"
    ).textContent =
        mostrarPrecioCOP(precio);


    // Botón

    const btn =
        document.getElementById(
            "btnConfirmEliminar"
        );


    btn.disabled = false;


    btn.className =
        "btn-confirm-eliminar";


    btn.innerHTML =
        `
        <span class="material-symbols-outlined">
            delete
        </span>

        Eliminar
        `;


    btn.onclick =
        function () {

            confirmarEliminar();

        };


    // Mostrar modal

    document.getElementById(
        "confirmModal"
    ).classList.add("open");
}

window.abrirConfirmModal =
    abrirConfirmModal;


// ============================================================
// CERRAR MODAL CONFIRMACIÓN
// ============================================================

function cerrarConfirmModal() {

    document.getElementById(
        "confirmModal"
    ).classList.remove("open");


    tratamientoAEliminar = null;
}

window.cerrarConfirmModal =
    cerrarConfirmModal;


// ============================================================
// CONFIRMAR ELIMINAR
// ============================================================

async function confirmarEliminar() {

    if (!tratamientoAEliminar) {

        return;

    }


    const btn =
        document.getElementById(
            "btnConfirmEliminar"
        );


    btn.disabled = true;


    btn.innerHTML =
        `
        <span class="material-symbols-outlined spinner">
            progress_activity
        </span>

        Eliminando...
        `;


    try {

        await api(
            "DELETE",
            `/tratamientos/${tratamientoAEliminar}`
        );


        toast(
            "✅ Tratamiento eliminado correctamente",
            "success"
        );


        cerrarConfirmModal();


        await cargarTratamientos();

    } catch (error) {

        console.error(
            "❌ Error al eliminar:",
            error
        );


        toast(
            `❌ ${error.message || "Error al eliminar"}`,
            "error"
        );


        btn.disabled = false;


        btn.innerHTML =
            `
            <span class="material-symbols-outlined">
                delete
            </span>

            Eliminar
            `;
    }
}

window.confirmarEliminar =
    confirmarEliminar;


// ============================================================
// INICIALIZAR
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ====================================================
        // VERIFICAR SESIÓN
        // ====================================================

        aplicarNavegacionPorRol();

        if (ES_ODONTOLOGO()) {
            document.getElementById("btnNuevoTratamiento")?.remove();
        }

        const usuarioActual =
            JSON.parse(
                localStorage.getItem(
                    "usuario_actual"
                ) || "null"
            );


        if (!usuarioActual) {

            window.location.href =
                "../login.html";

            return;
        }


        // ====================================================
        // CARGAR TRATAMIENTOS
        // ====================================================

        cargarTratamientos();


        // ====================================================
        // CAMPO PRECIO
        // ====================================================

        const inputPrecio =
            document.getElementById(
                "inPrecio"
            );

        if (ES_ODONTOLOGO() && inputPrecio) {
            inputPrecio.disabled = true;
            inputPrecio.readOnly = true;
            inputPrecio.title = "El precio solo puede ser modificado por el administrador";
        }

        if (inputPrecio) {

            inputPrecio.addEventListener(
                "input",
                function () {

                    this.value =
                        formatearPrecioCOP(
                            this.value
                        );

                }
            );


            // Evitar caracteres no numéricos

            inputPrecio.addEventListener(
                "keypress",
                function (event) {

                    if (
                        !/[0-9]/.test(event.key) &&
                        event.key !== "Backspace" &&
                        event.key !== "Delete" &&
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowRight" &&
                        event.key !== "Tab"
                    ) {

                        event.preventDefault();

                    }

                }
            );

        }


        // ====================================================
        // BOTÓN GUARDAR
        // ====================================================

        document
            .getElementById(
                "btnGuardarTratamiento"
            )
            ?.addEventListener(
                "click",
                guardarTratamiento
            );


        // ====================================================
        // CERRAR MODAL AL HACER CLICK AFUERA
        // ====================================================

        document
            .getElementById(
                "modalTrat"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === this
                    ) {

                        cerrarModal();

                    }

                }
            );


        document
            .getElementById(
                "confirmModal"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === this
                    ) {

                        cerrarConfirmModal();

                    }

                }
            );

    }
);