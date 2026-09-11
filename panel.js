// ============================================
// PANEL.JS - Dashboard Administrador
// VERSIÓN COMPLETA Y CORREGIDA
// ============================================

let usuarioAEliminar = null;
let pacienteEditandoId = null;
let odontologoEditandoId = null;

const API = "http://127.0.0.1:8000";


// ============================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ============================================================

function togglePassword(id) {

    const input = document.getElementById(id);

    if (!input) return;

    const icon = input.nextElementSibling;

    if (input.type === "password") {

        input.type = "text";

        if (icon) {
            icon.textContent = "visibility";
        }

    } else {

        input.type = "password";

        if (icon) {
            icon.textContent = "visibility_off";
        }
    }
}

window.togglePassword = togglePassword;


// ============================================================
// MOSTRAR CAMPOS SEGÚN EL ROL
// ============================================================

function toggleCamposPaciente() {

    const rol = document.getElementById("inRol")?.value;

    const camposComunes =
        document.getElementById("camposComunes");

    const camposPaciente =
        document.getElementById("camposPaciente");

    const camposOdontologo =
        document.getElementById("camposOdontologo");


    camposComunes?.classList.remove("show");
    camposPaciente?.classList.remove("show");
    camposOdontologo?.classList.remove("show");


    if (rol === "Administrador") {

        camposComunes?.classList.add("show");

    } else if (rol === "Paciente") {

        camposComunes?.classList.add("show");
        camposPaciente?.classList.add("show");

    } else if (rol === "Odontologo") {

        camposComunes?.classList.add("show");
        camposOdontologo?.classList.add("show");
    }
}

window.toggleCamposPaciente = toggleCamposPaciente;


// ============================================================
// VALIDAR CORREO
// ============================================================

function validarCorreo(correo) {

    const regex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return regex.test(correo);
}


// ============================================================
// VALIDAR TELÉFONO
// ============================================================

function validarTelefono(telefono) {

    if (!telefono) return false;

    const limpio =
        telefono.replace(/[\s\-]/g, "");

    const regex =
        /^(\+57)?[0-9]{7,10}$/;

    return regex.test(limpio);
}


// ============================================================
// TOAST
// ============================================================

function toast(msg, tipo = "success") {

    const t =
        document.getElementById("toast");

    if (!t) return;

    t.textContent = msg;

    t.className =
        `toast show ${tipo}`;

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
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };


        if (body !== null) {

            opciones.body =
                JSON.stringify(body);
        }


        const res =
            await fetch(
                `${API}${path}`,
                opciones
            );


        if (!res.ok) {

            const errorData =
                await res.json().catch(
                    () => ({})
                );


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
            `❌ Error API ${method} ${path}:`,
            error
        );

        throw error;
    }
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }


    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// RENDERIZAR TABLA
// ============================================================

function renderTabla(usuarios) {

    const colores = {
        "Administrador": "red",
        "Odontologo": "blue",
        "Paciente": "yellow"
    };


    const tbody =
        document.getElementById(
            "tablaUsuarios"
        );


    if (!tbody) return;


    if (
        !usuarios ||
        usuarios.length === 0
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
                    Sin usuarios registrados
                </td>
            </tr>
        `;

        actualizarContadores([]);

        return;
    }


    usuarios.sort(
        (a, b) =>
            a.id_usuario - b.id_usuario
    );


    tbody.innerHTML =
        usuarios.map((u, index) => {

            const correo =
                escaparHTML(u.correo);

            const rol =
                escaparHTML(u.rol);

            const estado =
                escaparHTML(u.estado);


            return `
                <tr>

                    <td>
                        <strong>
                            ${index + 1}
                        </strong>
                    </td>

                    <td>
                        ${correo}
                    </td>

                    <td>
                        <span class="badge ${
                            colores[u.rol] || "blue"
                        }">
                            ${rol || "—"}
                        </span>
                    </td>

                    <td>
                        <span class="badge ${
                            u.estado === "Activo"
                                ? "green"
                                : "yellow"
                        }">
                            ${estado || "—"}
                        </span>
                    </td>

                    <td>

                        <button
                            class="btn-icon"
                            title="Editar"
                            onclick="
                                editarUsuario(
                                    ${u.id_usuario}
                                )
                            "
                        >
                            <span class="material-symbols-outlined">
                                edit
                            </span>
                        </button>


                        <button
                            class="btn-danger"
                            title="Eliminar"
                            onclick="
                                abrirConfirmModal(
                                    ${u.id_usuario},
                                    '${correo}',
                                    '${rol}'
                                )
                            "
                        >
                            <span class="material-symbols-outlined">
                                delete
                            </span>
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    actualizarContadores(usuarios);
}


// ============================================================
// CONTADORES
// ============================================================

function actualizarContadores(usuarios) {

    const odontologos =
        document.getElementById(
            "cntOdontologos"
        );

    const pacientes =
        document.getElementById(
            "cntPacientes"
        );


    if (odontologos) {

        odontologos.textContent =
            usuarios.filter(
                u => u.rol === "Odontologo"
            ).length;
    }


    if (pacientes) {

        pacientes.textContent =
            usuarios.filter(
                u => u.rol === "Paciente"
            ).length;
    }
}


// ============================================================
// CARGAR USUARIOS
// ============================================================

async function cargarUsuarios() {

    try {

        console.log(
            "🔄 Cargando usuarios..."
        );


        const usuarios =
            await api(
                "GET",
                "/usuarios"
            );


        console.log(
            "✅ Usuarios cargados:",
            usuarios.length
        );


        renderTabla(usuarios);


    } catch (error) {

        console.error(
            "❌ Error al cargar usuarios:",
            error
        );


        toast(
            "❌ No se pudo conectar con el servidor",
            "error"
        );


        const tbody =
            document.getElementById(
                "tablaUsuarios"
            );


        if (tbody) {

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
                        ❌ Error de conexión:
                        ${escaparHTML(error.message)}
                    </td>
                </tr>
            `;
        }
    }
}


// ============================================================
// LIMPIAR FORMULARIO
// ============================================================

function limpiarFormularioUsuario() {

    const campos = [
        "editId",
        "inCorreo",
        "inPassword",
        "inNombre",
        "inApellido",
        "inTelefono",
        "inDocumento",
        "inEspecialidad",
        "inConsultorio",
        "inFechaNacimiento",
        "inGenero",
        "inDireccion",
        "inEps",
        "inAlergias"
    ];


    campos.forEach(id => {

        const elemento =
            document.getElementById(id);

        if (elemento) {
            elemento.value = "";
        }
    });


    document
        .getElementById("correoError")
        ?.classList.remove("show");

    document
        .getElementById("passwordError")
        ?.classList.remove("show");

    document
        .getElementById("telefonoError")
        ?.classList.remove("show");


    document
        .getElementById("inCorreo")
        ?.classList.remove("input-error");

    document
        .getElementById("inPassword")
        ?.classList.remove("input-error");

    document
        .getElementById("inTelefono")
        ?.classList.remove("input-error");
}


// ============================================================
// ABRIR MODAL NUEVO USUARIO
// ============================================================

function abrirModal() {

    pacienteEditandoId = null;
    odontologoEditandoId = null;


    limpiarFormularioUsuario();


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Nuevo Usuario";


    document.getElementById(
        "inPassword"
    ).placeholder =
        "•••••••• (mínimo 6 caracteres)";


    document.getElementById(
        "inRol"
    ).value =
        "Paciente";


    document.getElementById(
        "inEstado"
    ).value =
        "Activo";


    toggleCamposPaciente();


    const btn =
        document.getElementById(
            "btnGuardarUsuario"
        );


    if (btn) {

        btn.disabled = false;

        btn.innerHTML = `
            <span class="material-symbols-outlined">
                save
            </span>
            Guardar
        `;
    }


    document
        .getElementById(
            "modalUsuario"
        )
        ?.classList.add("open");
}

window.abrirModal = abrirModal;


// ============================================================
// CERRAR MODAL
// ============================================================

function cerrarModal() {

    document
        .getElementById(
            "modalUsuario"
        )
        ?.classList.remove("open");


    pacienteEditandoId = null;
    odontologoEditandoId = null;
}

window.cerrarModal = cerrarModal;


// ============================================================
// BUSCAR PACIENTE
// ============================================================

async function obtenerPacienteDeUsuario(usuario) {

    try {

        const pacientes =
            await api(
                "GET",
                "/pacientes"
            );


        if (!Array.isArray(pacientes)) {
            return null;
        }


        let paciente =
            pacientes.find(
                p =>
                    p.correo ===
                    usuario.correo
            );


        if (
            !paciente &&
            usuario.documento
        ) {

            paciente =
                pacientes.find(
                    p =>
                        p.documento ===
                        usuario.documento
                );
        }


        if (
            !paciente &&
            usuario.nombre &&
            usuario.apellido
        ) {

            paciente =
                pacientes.find(
                    p =>
                        p.nombre ===
                            usuario.nombre &&
                        p.apellido ===
                            usuario.apellido
                );
        }


        return paciente || null;


    } catch (error) {

        console.warn(
            "⚠️ Error buscando paciente:",
            error
        );

        return null;
    }
}


// ============================================================
// BUSCAR ODONTÓLOGO
// ============================================================

async function obtenerOdontologoDeUsuario(usuario) {

    try {

        const odontologos =
            await api(
                "GET",
                "/odontologos"
            );


        if (!Array.isArray(odontologos)) {
            return null;
        }


        let odontologo =
            odontologos.find(
                o =>
                    o.correo ===
                    usuario.correo
            );


        if (
            !odontologo &&
            usuario.documento
        ) {

            odontologo =
                odontologos.find(
                    o =>
                        o.documento ===
                        usuario.documento
                );
        }


        if (
            !odontologo &&
            usuario.nombre &&
            usuario.apellido
        ) {

            odontologo =
                odontologos.find(
                    o =>
                        o.nombre ===
                            usuario.nombre &&
                        o.apellido ===
                            usuario.apellido
                );
        }


        return odontologo || null;


    } catch (error) {

        console.warn(
            "⚠️ Error buscando odontólogo:",
            error
        );

        return null;
    }
}


// ============================================================
// EDITAR USUARIO
// ============================================================

async function editarUsuario(id) {

    try {

        console.log(
            "🔄 Editando usuario:",
            id
        );


        // ----------------------------------------------------
        // Obtener usuario
        // ----------------------------------------------------

        const usuario =
            await api(
                "GET",
                `/usuarios/${id}`
            );


        console.log(
            "✅ Usuario recibido:",
            usuario
        );


        // ----------------------------------------------------
        // Reiniciar IDs
        // ----------------------------------------------------

        pacienteEditandoId = null;
        odontologoEditandoId = null;


        limpiarFormularioUsuario();


        // ----------------------------------------------------
        // Datos básicos
        // ----------------------------------------------------

        document.getElementById(
            "editId"
        ).value =
            usuario.id_usuario;


        document.getElementById(
            "modalTitulo"
        ).textContent =
            "Editar Usuario";


        document.getElementById(
            "inCorreo"
        ).value =
            usuario.correo || "";


        document.getElementById(
            "inRol"
        ).value =
            usuario.rol || "Paciente";


        document.getElementById(
            "inEstado"
        ).value =
            usuario.estado || "Activo";


        document.getElementById(
            "inPassword"
        ).value =
            usuario.contrasena_plano ||
            "********";


        // ====================================================
        // ADMINISTRADOR
        // ====================================================

        if (
            usuario.rol === "Administrador"
        ) {

            console.log(
                "👤 Datos del Administrador:",
                {
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    documento: usuario.documento,
                    telefono: usuario.telefono
                }
            );


            document.getElementById(
                "inNombre"
            ).value =
                usuario.nombre || "";


            document.getElementById(
                "inApellido"
            ).value =
                usuario.apellido || "";


            document.getElementById(
                "inDocumento"
            ).value =
                usuario.documento || "";


            document.getElementById(
                "inTelefono"
            ).value =
                usuario.telefono || "";
        }


        // ====================================================
        // PACIENTE
        // ====================================================

        else if (
            usuario.rol === "Paciente"
        ) {

            let paciente =
                await obtenerPacienteDeUsuario(
                    usuario
                );


            if (!paciente) {

                paciente = {

                    id_paciente:
                        usuario.paciente_id ||
                        null,

                    nombre:
                        usuario.nombre ||
                        "",

                    apellido:
                        usuario.apellido ||
                        "",

                    documento:
                        usuario.documento ||
                        "",

                    telefono:
                        usuario.telefono ||
                        "",

                    fecha_nacimiento:
                        usuario.fecha_nacimiento ||
                        null,

                    genero:
                        usuario.genero ||
                        null,

                    direccion:
                        usuario.direccion ||
                        null,

                    eps:
                        usuario.eps ||
                        null,

                    alergias:
                        usuario.alergias ||
                        null,

                    contrasena_plano:
                        usuario.contrasena_plano ||
                        null
                };
            }


            pacienteEditandoId =
                paciente.id_paciente ||
                null;


            document.getElementById(
                "inNombre"
            ).value =
                paciente.nombre || "";


            document.getElementById(
                "inApellido"
            ).value =
                paciente.apellido || "";


            document.getElementById(
                "inDocumento"
            ).value =
                paciente.documento || "";


            document.getElementById(
                "inTelefono"
            ).value =
                paciente.telefono || "";


            document.getElementById(
                "inFechaNacimiento"
            ).value =
                paciente.fecha_nacimiento
                    ? String(
                        paciente.fecha_nacimiento
                    ).substring(0, 10)
                    : "";


            document.getElementById(
                "inGenero"
            ).value =
                paciente.genero || "";


            document.getElementById(
                "inDireccion"
            ).value =
                paciente.direccion || "";


            document.getElementById(
                "inEps"
            ).value =
                paciente.eps || "";


            document.getElementById(
                "inAlergias"
            ).value =
                paciente.alergias || "";


            if (
                paciente.contrasena_plano
            ) {

                document.getElementById(
                    "inPassword"
                ).value =
                    paciente.contrasena_plano;
            }
        }


        // ====================================================
        // ODONTÓLOGO
        // ====================================================

        else if (
            usuario.rol === "Odontologo"
        ) {

            const odontologo =
                await obtenerOdontologoDeUsuario(
                    usuario
                );


            if (odontologo) {

                odontologoEditandoId =
                    odontologo.id_odontologo;


                document.getElementById(
                    "inNombre"
                ).value =
                    odontologo.nombre || "";


                document.getElementById(
                    "inApellido"
                ).value =
                    odontologo.apellido || "";


                document.getElementById(
                    "inDocumento"
                ).value =
                    odontologo.documento || "";


                document.getElementById(
                    "inTelefono"
                ).value =
                    odontologo.telefono || "";


                document.getElementById(
                    "inEspecialidad"
                ).value =
                    odontologo.especialidad || "";


                document.getElementById(
                    "inConsultorio"
                ).value =
                    odontologo.id_consultorio || "";

            } else {

                console.log(
                    "ℹ️ El odontólogo todavía no tiene ficha profesional."
                );
            }
        }


        toggleCamposPaciente();


        const btn =
            document.getElementById(
                "btnGuardarUsuario"
            );


        if (btn) {

            btn.disabled = false;

            btn.innerHTML = `
                <span class="material-symbols-outlined">
                    save
                </span>
                Guardar
            `;
        }


        document
            .getElementById(
                "modalUsuario"
            )
            ?.classList.add("open");


    } catch (error) {

        console.error(
            "❌ Error al editar usuario:",
            error
        );


        toast(
            `❌ ${error.message}`,
            "error"
        );
    }
}

window.editarUsuario = editarUsuario;


// ============================================================
// GUARDAR USUARIO
// ============================================================

async function guardarUsuario() {

    const id =
        document.getElementById(
            "editId"
        )?.value.trim();


    const correo =
        document.getElementById(
            "inCorreo"
        )?.value.trim();


    const contrasena =
        document.getElementById(
            "inPassword"
        )?.value.trim();


    const rol =
        document.getElementById(
            "inRol"
        )?.value;


    const estado =
        document.getElementById(
            "inEstado"
        )?.value;


    const btn =
        document.getElementById(
            "btnGuardarUsuario"
        );


    // ========================================================
    // DATOS PERSONALES
    // ========================================================

    const nombre =
        document.getElementById(
            "inNombre"
        )?.value.trim() || "";


    const apellido =
        document.getElementById(
            "inApellido"
        )?.value.trim() || "";


    const documento =
        document.getElementById(
            "inDocumento"
        )?.value.trim() || "";


    const telefono =
        document.getElementById(
            "inTelefono"
        )?.value.trim() || "";


    // ========================================================
    // DATOS ODONTÓLOGO
    // ========================================================

    const especialidad =
        document.getElementById(
            "inEspecialidad"
        )?.value.trim() || "";


    const id_consultorio =
        parseInt(
            document.getElementById(
                "inConsultorio"
            )?.value
        ) || 0;


    // ========================================================
    // DATOS PACIENTE
    // ========================================================

    const fecha_nacimiento =
        document.getElementById(
            "inFechaNacimiento"
        )?.value || null;


    const genero =
        document.getElementById(
            "inGenero"
        )?.value || null;


    const direccion =
        document.getElementById(
            "inDireccion"
        )?.value.trim() || null;


    const eps =
        document.getElementById(
            "inEps"
        )?.value.trim() || null;


    const alergias =
        document.getElementById(
            "inAlergias"
        )?.value.trim() || null;


    // ========================================================
    // VALIDAR CORREO
    // ========================================================

    if (!correo) {

        toast(
            "Ingrese el correo.",
            "warning"
        );

        return;
    }


    if (!validarCorreo(correo)) {

        toast(
            "Correo inválido.",
            "error"
        );

        return;
    }


    // ========================================================
    // CONTRASEÑA
    // ========================================================

    const PLACEHOLDER =
        "********";


    const esPlaceholder =
        contrasena === PLACEHOLDER;


    const estaVacia =
        contrasena === "";


    let enviarContrasena = null;


    if (!id) {

        if (
            estaVacia ||
            esPlaceholder
        ) {

            toast(
                "Ingrese una contraseña.",
                "warning"
            );

            return;
        }


        if (
            contrasena.length < 6
        ) {

            toast(
                "La contraseña debe tener mínimo 6 caracteres.",
                "error"
            );

            return;
        }


        enviarContrasena =
            contrasena;

    } else {

        if (
            !estaVacia &&
            !esPlaceholder
        ) {

            if (
                contrasena.length < 6
            ) {

                toast(
                    "La contraseña debe tener mínimo 6 caracteres.",
                    "error"
                );

                return;
            }


            enviarContrasena =
                contrasena;
        }
    }


    // ========================================================
    // VALIDACIÓN PACIENTE
    // ========================================================

    if (
        rol === "Paciente"
    ) {

        if (
            !nombre ||
            !apellido ||
            !documento ||
            !telefono
        ) {

            toast(
                "Complete todos los datos del paciente.",
                "warning"
            );

            return;
        }
    }


    // ========================================================
    // VALIDACIÓN ODONTÓLOGO
    // ========================================================

    if (
        rol === "Odontologo"
    ) {

        if (
            !nombre ||
            !apellido ||
            !documento ||
            !telefono ||
            !especialidad ||
            !id_consultorio
        ) {

            toast(
                "Complete todos los datos del odontólogo.",
                "warning"
            );

            return;
        }
    }


    // ========================================================
    // VALIDACIÓN ADMINISTRADOR
    // ========================================================

    if (
        rol === "Administrador"
    ) {

        if (
            !nombre ||
            !apellido ||
            !documento ||
            !telefono
        ) {

            toast(
                "Complete todos los datos del administrador.",
                "warning"
            );

            return;
        }
    }


    // ========================================================
    // BOTÓN
    // ========================================================

    if (btn) {

        btn.disabled = true;

        btn.innerHTML = `
            <span class="material-symbols-outlined spinner">
                progress_activity
            </span>
            Guardando...
        `;
    }


    try {

        // ====================================================
        // EDITAR
        // ====================================================

        if (id) {

            const usuarioActual =
                await api(
                    "GET",
                    `/usuarios/${id}`
                );


            const correoAnterior =
                usuarioActual.correo;


            const rolAnterior =
                usuarioActual.rol;


            console.log(
                "======================================"
            );

            console.log(
                "✏️ EDITANDO USUARIO"
            );

            console.log(
                "ID:",
                id
            );

            console.log(
                "Rol anterior:",
                rolAnterior
            );

            console.log(
                "Rol nuevo:",
                rol
            );

            console.log(
                "Correo anterior:",
                correoAnterior
            );

            console.log(
                "Correo nuevo:",
                correo
            );

            console.log(
                "======================================"
            );


            // ==================================================
            // DATOS PARA PUT /usuarios
            //
            // ESTO ES CLAVE PARA ADMINISTRADOR.
            // ==================================================

            const dataUsuario = {

                correo,
                rol,
                estado,

                nombre,
                apellido,
                documento,
                telefono
            };


            if (
                enviarContrasena
            ) {

                dataUsuario.contrasena =
                    enviarContrasena;
            }


            console.log(
                "📤 DATOS QUE SE ENVIARÁN A PUT /usuarios:",
                dataUsuario
            );


            // ==================================================
            // ACTUALIZAR USUARIO
            // ==================================================

            await api(
                "PUT",
                `/usuarios/${id}`,
                dataUsuario
            );


            console.log(
                "✅ PUT /usuarios completado"
            );


            // ==================================================
            // ADMINISTRADOR
            // ==================================================

            if (
                rol === "Administrador"
            ) {

                console.log(
                    "✅ Administrador actualizado"
                );


                toast(
                    "✅ Administrador actualizado correctamente",
                    "success"
                );
            }


            // ==================================================
            // PACIENTE
            // ==================================================

            else if (
                rol === "Paciente"
            ) {

                let paciente = null;


                try {

                    const pacientes =
                        await api(
                            "GET",
                            "/pacientes"
                        );


                    if (
                        Array.isArray(
                            pacientes
                        )
                    ) {

                        paciente =
                            pacientes.find(

                                p =>

                                    p.correo ===
                                        correoAnterior ||

                                    p.correo ===
                                        correo ||

                                    (
                                        documento &&
                                        p.documento ===
                                            documento
                                    )

                            );
                    }


                } catch (error) {

                    console.warn(
                        "⚠️ Error buscando paciente:",
                        error
                    );
                }


                if (paciente) {

                    pacienteEditandoId =
                        paciente.id_paciente;


                    await api(
                        "PUT",
                        `/pacientes/${paciente.id_paciente}`,
                        {

                            nombre,
                            apellido,
                            documento,
                            telefono,
                            correo,
                            fecha_nacimiento,
                            genero,
                            direccion,
                            eps,
                            alergias

                        }
                    );


                    toast(
                        "✅ Paciente actualizado correctamente",
                        "success"
                    );


                } else {

                    toast(
                        "✅ Usuario actualizado, pero no se encontró una ficha de paciente.",
                        "warning"
                    );
                }
            }


            // ==================================================
            // ODONTÓLOGO
            // ==================================================

            else if (
                rol === "Odontologo"
            ) {

                let odontologo = null;


                try {

                    const odontologos =
                        await api(
                            "GET",
                            "/odontologos"
                        );


                    if (
                        Array.isArray(
                            odontologos
                        )
                    ) {

                        odontologo =
                            odontologos.find(

                                o =>
                                    o.correo ===
                                    correoAnterior

                            );


                        if (
                            !odontologo
                        ) {

                            odontologo =
                                odontologos.find(

                                    o =>
                                        o.correo ===
                                        correo

                                );
                        }


                        if (
                            !odontologo &&
                            documento
                        ) {

                            odontologo =
                                odontologos.find(

                                    o =>
                                        o.documento ===
                                        documento

                                );
                        }
                    }


                } catch (error) {

                    console.warn(
                        "⚠️ Error buscando odontólogo:",
                        error
                    );
                }


                // ------------------------------------------------
                // EXISTE
                // ------------------------------------------------

                if (odontologo) {

                    odontologoEditandoId =
                        odontologo.id_odontologo;


                    await api(
                        "PUT",
                        `/odontologos/${odontologo.id_odontologo}`,
                        {

                            nombre,
                            apellido,
                            documento,
                            telefono,
                            correo,
                            especialidad,
                            id_consultorio

                        }
                    );


                    toast(
                        "✅ Odontólogo actualizado correctamente",
                        "success"
                    );


                }

                // ------------------------------------------------
                // NO EXISTE: CREAR
                // ------------------------------------------------

                else {

                    console.log(
                        "🦷 No existe ficha de odontólogo. Creando..."
                    );


                    const nuevoOdontologo =
                        await api(
                            "POST",
                            "/odontologos",
                            {

                                nombre,
                                apellido,
                                documento,
                                telefono,
                                correo,
                                especialidad,
                                id_consultorio

                            }
                        );


                    odontologoEditandoId =
                        nuevoOdontologo?.id_odontologo ||
                        null;


                    toast(
                        "✅ Usuario convertido a Odontólogo correctamente",
                        "success"
                    );
                }
            }
        }


        // ====================================================
        // CREAR
        // ====================================================

        else {

            // ==================================================
            // ADMINISTRADOR
            // ==================================================

            if (
                rol === "Administrador"
            ) {

                const dataAdministrador = {

                    correo,

                    contrasena:
                        enviarContrasena,

                    rol:
                        "Administrador",

                    estado,

                    nombre,
                    apellido,
                    documento,
                    telefono
                };


                console.log(
                    "📤 DATOS ADMINISTRADOR QUE SE VAN A GUARDAR:",
                    dataAdministrador
                );


                await api(
                    "POST",
                    "/usuarios",
                    dataAdministrador
                );


                console.log(
                    "✅ Administrador creado correctamente"
                );


                toast(
                    "✅ Administrador registrado correctamente",
                    "success"
                );
            }


            // ==================================================
            // PACIENTE
            // ==================================================

            else if (
                rol === "Paciente"
            ) {

                await api(
                    "POST",
                    "/usuarios/registro",
                    {

                        correo,

                        contrasena:
                            enviarContrasena,

                        rol:
                            "Paciente",

                        estado,

                        nombre,
                        apellido,
                        documento,
                        telefono,

                        fecha_nacimiento,
                        genero,
                        direccion,
                        eps,
                        alergias

                    }
                );


                toast(
                    "✅ Paciente registrado correctamente",
                    "success"
                );
            }


            // ==================================================
            // ODONTÓLOGO
            // ==================================================

            else if (
                rol === "Odontologo"
            ) {

                await api(
                    "POST",
                    "/usuarios/registro",
                    {

                        correo,

                        contrasena:
                            enviarContrasena,

                        rol:
                            "Odontologo",

                        estado,

                        nombre,
                        apellido,
                        documento,
                        telefono,

                        especialidad,

                        id_consultorio

                    }
                );


                toast(
                    "✅ Odontólogo registrado correctamente",
                    "success"
                );
            }
        }


        // ====================================================
        // RECARGAR TABLA
        // ====================================================

        await cargarUsuarios();


        // ====================================================
        // CERRAR MODAL
        // ====================================================

        cerrarModal();


    } catch (error) {

        console.error(
            "❌ Error al guardar usuario:",
            error
        );


        toast(
            error.message ||
            "Error al guardar el usuario",
            "error"
        );


        if (btn) {

            btn.disabled = false;

            btn.innerHTML = `
                <span class="material-symbols-outlined">
                    save
                </span>
                Guardar
            `;
        }
    }
}

window.guardarUsuario = guardarUsuario;


// ============================================================
// MODAL CONFIRMACIÓN ELIMINAR
// ============================================================

function abrirConfirmModal(
    id,
    correo,
    rol
) {

    usuarioAEliminar = id;


    document.getElementById(
        "confirmIcon"
    ).textContent =
        "warning";


    document.getElementById(
        "confirmIcon"
    ).className =
        "material-symbols-outlined confirm-icon warning";


    document.getElementById(
        "confirmTitulo"
    ).textContent =
        "¿Eliminar este usuario?";


    document.getElementById(
        "confirmMensaje"
    ).textContent =
        "Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.";


    document.getElementById(
        "userInfo"
    ).style.display =
        "block";


    document.getElementById(
        "confirmFooter"
    ).style.display =
        "flex";


    document.getElementById(
        "confirmId"
    ).textContent =
        id;


    document.getElementById(
        "confirmCorreo"
    ).textContent =
        correo;


    document.getElementById(
        "confirmRol"
    ).textContent =
        rol;


    const btn =
        document.getElementById(
            "btnConfirmEliminar"
        );


    btn.disabled = false;

    btn.className =
        "btn-confirm-eliminar";


    btn.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        Eliminar
    `;


    btn.onclick = function () {
        confirmarEliminar();
    };


    document
        .getElementById(
            "confirmModal"
        )
        .classList.add("open");
}

window.abrirConfirmModal =
    abrirConfirmModal;


// ============================================================
// CERRAR MODAL CONFIRMACIÓN
// ============================================================

function cerrarConfirmModal() {

    document
        .getElementById(
            "confirmModal"
        )
        ?.classList.remove("open");


    usuarioAEliminar = null;
}

window.cerrarConfirmModal =
    cerrarConfirmModal;


// ============================================================
// MOSTRAR ERROR ELIMINACIÓN
// ============================================================

function mostrarErrorConfirmacion(
    mensaje
) {

    document.getElementById(
        "confirmIcon"
    ).textContent =
        "error";


    document.getElementById(
        "confirmIcon"
    ).className =
        "material-symbols-outlined confirm-icon error";


    document.getElementById(
        "confirmTitulo"
    ).textContent =
        "❌ No se puede eliminar";


    document.getElementById(
        "confirmMensaje"
    ).textContent =
        mensaje ||
        "No se pudo eliminar el usuario.";


    document.getElementById(
        "userInfo"
    ).style.display =
        "none";


    document.getElementById(
        "confirmFooter"
    ).style.display =
        "flex";


    const btn =
        document.getElementById(
            "btnConfirmEliminar"
        );


    btn.disabled = false;

    btn.className =
        "btn-confirm-cancelar";


    btn.innerHTML = `
        <span class="material-symbols-outlined">
            close
        </span>
        Cerrar
    `;


    btn.onclick = function () {
        cerrarConfirmModal();
    };
}


// ============================================================
// CONFIRMAR ELIMINACIÓN
// ============================================================

async function confirmarEliminar() {

    if (!usuarioAEliminar) {
        return;
    }


    const id =
        usuarioAEliminar;


    const btn =
        document.getElementById(
            "btnConfirmEliminar"
        );


    btn.disabled = true;


    btn.innerHTML = `
        <span class="material-symbols-outlined spinner">
            progress_activity
        </span>
        Eliminando...
    `;


    try {

        await api(
            "DELETE",
            `/usuarios/${id}`
        );


        toast(
            "✅ Usuario eliminado correctamente",
            "success"
        );


        cerrarConfirmModal();


        await cargarUsuarios();


    } catch (error) {

        console.error(
            "❌ Error al eliminar:",
            error
        );


        mostrarErrorConfirmacion(
            error.message ||
            "Error al eliminar el usuario"
        );
    }
}

window.confirmarEliminar =
    confirmarEliminar;


// ============================================================
// DOM CONTENT LOADED
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ====================================================
        // SESIÓN
        // ====================================================

        const usuarioActual =
            JSON.parse(
                localStorage.getItem(
                    "usuario_actual"
                ) || "null"
            );


        if (!usuarioActual) {

            window.location.href =
                "login.html";

            return;
        }

        const rolSesion = String(usuarioActual.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (rolSesion === "odontologo") {
            window.location.href = "panel_odontologo.html";
            return;
        }
        if (rolSesion === "paciente") {
            window.location.href = "panel_cliente.html";
            return;
        }


        // ====================================================
        // CARGAR USUARIOS
        // ====================================================

        cargarUsuarios();


        // ====================================================
        // VALIDAR CORREO
        // ====================================================

        const correoInput =
            document.getElementById(
                "inCorreo"
            );


        const correoError =
            document.getElementById(
                "correoError"
            );


        correoInput?.addEventListener(
            "input",
            function () {

                const correo =
                    this.value.trim();


                if (!correo) {

                    this.classList.remove(
                        "input-error"
                    );


                    correoError?.classList.remove(
                        "show"
                    );


                    return;
                }


                if (
                    validarCorreo(correo)
                ) {

                    this.classList.remove(
                        "input-error"
                    );


                    correoError?.classList.remove(
                        "show"
                    );

                } else {

                    this.classList.add(
                        "input-error"
                    );


                    correoError?.classList.add(
                        "show"
                    );
                }
            }
        );


        // ====================================================
        // VALIDAR CONTRASEÑA
        // ====================================================

        const passwordInput =
            document.getElementById(
                "inPassword"
            );


        const passwordError =
            document.getElementById(
                "passwordError"
            );


        passwordInput?.addEventListener(
            "input",
            function () {

                const pwd =
                    this.value;


                if (
                    pwd === "********" ||
                    pwd === ""
                ) {

                    this.classList.remove(
                        "input-error"
                    );


                    passwordError?.classList.remove(
                        "show"
                    );


                    return;
                }


                if (
                    pwd.length < 6
                ) {

                    this.classList.add(
                        "input-error"
                    );


                    passwordError?.classList.add(
                        "show"
                    );

                } else {

                    this.classList.remove(
                        "input-error"
                    );


                    passwordError?.classList.remove(
                        "show"
                    );
                }
            }
        );


        // ====================================================
        // VALIDAR TELÉFONO
        // ====================================================

        const telefonoInput =
            document.getElementById(
                "inTelefono"
            );


        const telefonoError =
            document.getElementById(
                "telefonoError"
            );


        telefonoInput?.addEventListener(
            "input",
            function () {

                const telefono =
                    this.value.trim();


                if (!telefono) {

                    this.classList.remove(
                        "input-error"
                    );


                    telefonoError?.classList.remove(
                        "show"
                    );


                    return;
                }


                if (
                    validarTelefono(
                        telefono
                    )
                ) {

                    this.classList.remove(
                        "input-error"
                    );


                    telefonoError?.classList.remove(
                        "show"
                    );

                } else {

                    this.classList.add(
                        "input-error"
                    );


                    telefonoError?.classList.add(
                        "show"
                    );
                }
            }
        );


        // ====================================================
        // BOTÓN GUARDAR
        // ====================================================

        document
            .getElementById(
                "btnGuardarUsuario"
            )
            ?.addEventListener(
                "click",
                guardarUsuario
            );


        // ====================================================
        // CAMBIO DE ROL
        // ====================================================

        document
            .getElementById(
                "inRol"
            )
            ?.addEventListener(
                "change",
                function () {

                    console.log(
                        "🔄 Cambio de rol:",
                        this.value
                    );


                    toggleCamposPaciente();

                }
            );

    }
);
