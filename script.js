const calculadorasContainer = document.getElementById("calculadoras-container");
const btnAgregarCalculadora = document.getElementById("btn-agregar-calculadora");
const calculadoraTemplate = document.getElementById("calculadora-template");
const resetBtn = document.getElementById("reset-btn");
const themeToggle = document.getElementById("theme-toggle");
const totalInversionGlobal = document.getElementById("total-inversion-global");
const totalRetornoGlobal = document.getElementById("total-retorno-global");
const totalBeneficioGlobal = document.getElementById("total-beneficio-global");

const MIN_FILAS = 2;
const MIN_CALCULADORAS = 1;
const STORAGE_KEY = "surebet-calculadoras";

const FILAS_DEFECTO = [
    { nombre: "", cuota: 4 },
    { nombre: "Empate", cuota: 3 },
    { nombre: "", cuota: 3 },
];

const CALCULADORA_DEFECTO = {
    perdidaFija: -10,
    filas: FILAS_DEFECTO,
    resultado: "ganado",
};

let calculadoras = [];
let idContador = 0;

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function aplicarColorBeneficio(el, valor) {
    el.classList.remove("beneficio-positivo", "beneficio-negativo", "beneficio-neutro");
    if (valor > 0.005) el.classList.add("beneficio-positivo");
    else if (valor < -0.005) el.classList.add("beneficio-negativo");
    else el.classList.add("beneficio-neutro");
}

function aplicarColorBeneficioResumen(el, valor) {
    el.classList.remove("valor-positivo", "valor-negativo");
    if (valor > 0.005) el.classList.add("valor-positivo");
    else if (valor < -0.005) el.classList.add("valor-negativo");
}

function crearFila(datos = { nombre: "", cuota: 2 }) {
    const tr = document.createElement("tr");
    tr.className = "table-row";
    const nombre = escapeHtml(datos.nombre ?? "");
    const cuota = Number.isFinite(Number(datos.cuota)) ? Number(datos.cuota) : 2;
    tr.innerHTML = `
        <td class="resultado-col col-equipo">
            <input type="text" class="equipo-nombre modern-input input-equipo" placeholder="Nombre" value="${nombre}">
        </td>
        <td class="col-cuota">
            <div class="input-wrapper">
                <input type="number" step="0.001" class="cuota modern-input input-cuota" value="${cuota}" placeholder="0.00" min="0.01">
            </div>
        </td>
        <td class="col-apuesta">
            <div class="input-wrapper">
                <input type="number" step="0.01" class="apuesta modern-input output-apuesta" value="0.00" placeholder="0.00" readonly tabindex="-1">
            </div>
        </td>
        <td class="col-beneficio">
            <div class="beneficio-wrapper">
                <span class="beneficio beneficio-neutro">0.00</span>
            </div>
        </td>
    `;
    return tr;
}

class CalculadoraSurebet {
    constructor(datos = CALCULADORA_DEFECTO) {
        this.id = ++idContador;
        this.root = calculadoraTemplate.content.firstElementChild.cloneNode(true);
        this.el = this.root;
        this.titulo = this.el.querySelector(".calculadora-titulo");
        this.perdidaFijaInput = this.el.querySelector(".perdida-fija");
        this.errorEl = this.el.querySelector(".surebet-error");
        this.tbody = this.el.querySelector(".filas-tbody");
        this.totalApuesta = this.el.querySelector(".apuesta-total");
        this.retornoObjetivoEl = this.el.querySelector(".retorno-objetivo");
        this.beneficioRealEl = this.el.querySelector(".beneficio-real");
        this.btnEliminar = this.el.querySelector(".btn-eliminar-calculadora");
        this.btnGanado = this.el.querySelector(".btn-ganado");
        this.btnPerdido = this.el.querySelector(".btn-perdido");
        this.valores = { inversion: 0, retorno: 0, beneficio: 0 };
        this.resultado = datos.resultado === "perdido" ? "perdido" : "ganado";

        this.perdidaFijaInput.value = datos.perdidaFija ?? CALCULADORA_DEFECTO.perdidaFija;
        this.renderizarFilas(datos.filas ?? FILAS_DEFECTO);
        this.aplicarResultado(this.resultado);

        this.tbody.addEventListener("input", (e) => {
            if (e.target.matches(".cuota, .equipo-nombre")) {
                this.recalcular();
                guardarCalculadoras();
            }
        });

        this.perdidaFijaInput.addEventListener("input", () => {
            this.recalcular();
            guardarCalculadoras();
        });

        this.btnEliminar.addEventListener("click", () => eliminarCalculadora(this));

        this.btnGanado.addEventListener("click", () => this.establecerResultado("ganado"));
        this.btnPerdido.addEventListener("click", () => this.establecerResultado("perdido"));
    }

    establecerResultado(resultado) {
        this.resultado = resultado;
        this.aplicarResultado(resultado);
        actualizarTotalesGlobales();
        guardarCalculadoras();
    }

    aplicarResultado(resultado) {
        const esGanado = resultado === "ganado";
        this.btnGanado.classList.toggle("active", esGanado);
        this.btnPerdido.classList.toggle("active", !esGanado);
        this.el.classList.toggle("calculadora-perdida", !esGanado);
    }

    esGanado() {
        return this.resultado === "ganado";
    }

    obtenerFilas() {
        return [...this.tbody.querySelectorAll(".table-row")];
    }

    renderizarFilas(filas) {
        this.tbody.innerHTML = "";
        filas.forEach((f) => this.tbody.appendChild(crearFila(f)));
        this.recalcular();
    }

    recalcular() {
        const cuotas = this.obtenerFilas().map((f) => parseFloat(f.querySelector(".cuota").value));
        const perdidaFija = parseFloat(this.perdidaFijaInput.value);
        const apuestas = this.obtenerFilas().map((f) => f.querySelector(".apuesta"));
        const beneficios = this.obtenerFilas().map((f) => f.querySelector(".beneficio"));

        const cuotasValidas =
            cuotas.length >= MIN_FILAS &&
            cuotas.every((c) => Number.isFinite(c) && c > 0);

        if (!cuotasValidas || !Number.isFinite(perdidaFija)) {
            this.mostrarError("Introduce al menos 2 cuotas válidas (mayores a 0) y una pérdida fija numérica.");
            this.limpiarResultados();
            actualizarTotalesGlobales();
            return;
        }

        const sumaInversos = cuotas.reduce((acc, c) => acc + 1 / c, 0);

        if (Math.abs(sumaInversos - 1) < 1e-9) {
            this.mostrarError("Las cuotas están perfectamente equilibradas.");
            this.limpiarResultados();
            actualizarTotalesGlobales();
            return;
        }

        this.ocultarError();

        const retornoObjetivo = perdidaFija / (1 - sumaInversos);
        const montosApuesta = cuotas.map((c) => retornoObjetivo / c);
        const apuestaTotal = montosApuesta.reduce((a, m) => a + m, 0);
        const beneficioReal = retornoObjetivo - apuestaTotal;

        montosApuesta.forEach((monto, i) => {
            apuestas[i].value = monto.toFixed(2);
            beneficios[i].textContent = beneficioReal.toFixed(2);
            aplicarColorBeneficio(beneficios[i], beneficioReal);
        });

        this.totalApuesta.textContent = `S/${apuestaTotal.toFixed(2)}`;
        this.retornoObjetivoEl.textContent = `S/${retornoObjetivo.toFixed(2)}`;
        this.beneficioRealEl.textContent = `S/${beneficioReal.toFixed(2)}`;
        aplicarColorBeneficioResumen(this.beneficioRealEl, beneficioReal);

        this.valores = { inversion: apuestaTotal, retorno: retornoObjetivo, beneficio: beneficioReal };
        actualizarTotalesGlobales();
    }

    mostrarError(mensaje) {
        this.errorEl.textContent = mensaje;
        this.errorEl.hidden = false;
    }

    ocultarError() {
        this.errorEl.hidden = true;
        this.errorEl.textContent = "";
    }

    limpiarResultados() {
        this.obtenerFilas().forEach((fila) => {
            fila.querySelector(".apuesta").value = "0.00";
            const ben = fila.querySelector(".beneficio");
            ben.textContent = "0.00";
            aplicarColorBeneficio(ben, 0);
        });
        this.totalApuesta.textContent = "S/0.00";
        this.retornoObjetivoEl.textContent = "S/0.00";
        this.beneficioRealEl.textContent = "S/0.00";
        this.beneficioRealEl.classList.remove("valor-positivo", "valor-negativo");
        this.valores = { inversion: 0, retorno: 0, beneficio: 0 };
    }

    serializar() {
        return {
            perdidaFija: parseFloat(this.perdidaFijaInput.value) || CALCULADORA_DEFECTO.perdidaFija,
            resultado: this.resultado,
            filas: this.obtenerFilas().map((f) => ({
                nombre: f.querySelector(".equipo-nombre")?.value ?? "",
                cuota: parseFloat(f.querySelector(".cuota")?.value) || 0,
            })),
        };
    }

    actualizarTitulo(numero) {
        this.titulo.textContent = `Calculadora Surebet #${numero}`;
    }

    actualizarBotonEliminar(mostrar) {
        this.btnEliminar.hidden = !mostrar;
    }
}

function actualizarTotalesGlobales() {
    const totales = calculadoras.reduce(
        (acc, calc) => {
            const { inversion = 0, retorno = 0, beneficio = 0 } = calc.valores ?? {};
            acc.inversion += inversion;
            acc.retorno += retorno;
            acc.beneficio += beneficio;
            return acc;
        },
        { inversion: 0, retorno: 0, beneficio: 0 }
    );

    if (totalInversionGlobal) {
        totalInversionGlobal.textContent = `S/${totales.inversion.toFixed(2)}`;
    }
    if (totalRetornoGlobal) {
        totalRetornoGlobal.textContent = `S/${totales.retorno.toFixed(2)}`;
        aplicarColorBeneficioResumen(totalRetornoGlobal, totales.retorno);
    }
    if (totalBeneficioGlobal) {
        totalBeneficioGlobal.textContent = `S/${totales.beneficio.toFixed(2)}`;
        aplicarColorBeneficioResumen(totalBeneficioGlobal, totales.beneficio);
    }
}

function agregarCalculadora(datos = CALCULADORA_DEFECTO) {
    const calc = new CalculadoraSurebet(JSON.parse(JSON.stringify(datos)));
    calculadoras.push(calc);
    calculadorasContainer.appendChild(calc.el);
    actualizarNumeracion();
    guardarCalculadoras();
    return calc;
}

function eliminarCalculadora(calc) {
    if (calculadoras.length <= MIN_CALCULADORAS) return;
    calc.el.remove();
    calculadoras = calculadoras.filter((c) => c !== calc);
    actualizarNumeracion();
    guardarCalculadoras();
    actualizarTotalesGlobales();
}

function actualizarNumeracion() {
    calculadoras.forEach((calc, i) => {
        calc.actualizarTitulo(i + 1);
        calc.actualizarBotonEliminar(calculadoras.length > MIN_CALCULADORAS);
    });
}

function guardarCalculadoras() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calculadoras.map((c) => c.serializar())));
}

function cargarCalculadoras() {
    calculadorasContainer.innerHTML = "";
    calculadoras = [];

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const lista = JSON.parse(raw);
            if (Array.isArray(lista) && lista.length > 0) {
                lista.forEach((datos) => agregarCalculadora(datos));
                return;
            }
        } catch {}
    }

    agregarCalculadora(CALCULADORA_DEFECTO);
}

function resetearTodo() {
    localStorage.removeItem(STORAGE_KEY);
    cargarCalculadoras();
}

function aplicarTema(tema) {
    document.documentElement.classList.toggle("dark", tema === "dark");
}

function cargarTema() {
    const guardado = localStorage.getItem("theme-preference");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const tema = guardado || (prefersDark ? "dark" : "light");
    aplicarTema(tema);
    if (themeToggle) themeToggle.checked = tema === "dark";
}

function alternarTema() {
    const esDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme-preference", esDark ? "dark" : "light");
}

if (btnAgregarCalculadora) {
    btnAgregarCalculadora.addEventListener("click", () => agregarCalculadora(CALCULADORA_DEFECTO));
}

if (resetBtn) resetBtn.addEventListener("click", resetearTodo);
if (themeToggle) themeToggle.addEventListener("change", alternarTema);

cargarTema();
cargarCalculadoras();
