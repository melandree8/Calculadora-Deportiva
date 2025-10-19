// Seleccionamos todos los elementos de interés
const cuotas = document.querySelectorAll(".cuota");
const apuestas = document.querySelectorAll(".apuesta");
const beneficios = document.querySelectorAll(".beneficio");
const radios = document.querySelectorAll(".fijo");
const totalApuesta = document.getElementById("apuesta-total");

// Función para recalcular apuestas y beneficios
function recalcular() {
    let fijoIndex = [...radios].findIndex(r => r.checked); // fila fija
    let cuotaFija = parseFloat(cuotas[fijoIndex].value);
    let apuestaFija = parseFloat(apuestas[fijoIndex].value);

    // Beneficio esperado
    let beneficioEsperado = apuestaFija * cuotaFija;

    // Calcular las otras apuestas
    cuotas.forEach((cuotaInput, i) => {
        let cuota = parseFloat(cuotaInput.value);
        if (i !== fijoIndex) {
            let apuestaCalculada = beneficioEsperado / cuota;
            apuestas[i].value = apuestaCalculada.toFixed(2);
        }
    });

 // Calcular beneficios por fila y total
let total = 0;
cuotas.forEach((cuotaInput, i) => {
    let cuota = parseFloat(cuotaInput.value);
    let apuesta = parseFloat(apuestas[i].value);
    total += apuesta;

    // Beneficio neto = (cuota * apuesta) - suma de TODAS las apuestas
    let beneficioNeto = (cuota * apuesta) - 
        ([...apuestas].reduce((acc, ap) => acc + parseFloat(ap.value || 0), 0));

    beneficios[i].textContent = beneficioNeto.toFixed(2);
});
totalApuesta.textContent = `S/${total.toFixed(2)}`;

}

// Eventos: cuando cambian cuota, apuesta o radio
cuotas.forEach(input => input.addEventListener("input", recalcular));
apuestas.forEach(input => input.addEventListener("input", recalcular));
radios.forEach(input => input.addEventListener("change", recalcular));

// Llamada inicial
recalcular();

// ============== RESET + TEMA OSCURO ==============
const resetBtn = document.getElementById("reset-btn");
const themeToggle = document.getElementById("theme-toggle");
// Menú de apps eliminado
const appsMenu = null;
// Botón lateral eliminado
const teamAInput = document.getElementById("team-a");
const teamBInput = document.getElementById("team-b");
const labelFila1 = document.getElementById("label-row-1"); // arriba (Equipo 2)
const labelFila2 = document.getElementById("label-row-2"); // medio (Empate)
const labelFila3 = document.getElementById("label-row-3"); // abajo (Equipo 1)

// Valores iniciales por defecto de la calculadora principal
const valoresIniciales = {
    cuotas: [4, 3, 3],
    apuestas: [0, 0, 0],
    fijoIndex: 0,
};

function aplicarTema(tema) {
    if (tema === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

function cargarTema() {
    const guardado = localStorage.getItem("theme-preference");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const tema = guardado || (prefersDark ? "dark" : "light");
    aplicarTema(tema);
    if (themeToggle) themeToggle.checked = (tema === "dark");
}

function alternarTema() {
    const esDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme-preference", esDark ? "dark" : "light");
}

function resetearTodo() {
    // Reset calculadora principal
    valoresIniciales.cuotas.forEach((valor, i) => {
        if (cuotas[i]) cuotas[i].value = valor;
    });
    valoresIniciales.apuestas.forEach((valor, i) => {
        if (apuestas[i]) apuestas[i].value = valor;
    });
    if (radios[valoresIniciales.fijoIndex]) {
        radios.forEach(r => (r.checked = false));
        radios[valoresIniciales.fijoIndex].checked = true;
    }

    // Reset FREEBET a valores por defecto del HTML
    const defaults = { freebet: 250, c1: 3, c2: 2.5, c3: 2 };
    const freebetAmountEl = document.getElementById("freebet-amount");
    const cuotaFreebetEl = document.getElementById("cuota-freebet");
    const cuota2El = document.getElementById("cuota2");
    const cuota3El = document.getElementById("cuota3");
    if (freebetAmountEl) freebetAmountEl.value = defaults.freebet;
    if (cuotaFreebetEl) cuotaFreebetEl.value = defaults.c1;
    if (cuota2El) cuota2El.value = defaults.c2;
    if (cuota3El) cuota3El.value = defaults.c3;

    recalcular();
    calcularFreebet();

    // Reset equipos
    if (teamAInput) teamAInput.value = "";
    if (teamBInput) teamBInput.value = "";

    // Limpiar persistencia de equipos
    localStorage.removeItem("match-team-a");
    localStorage.removeItem("match-team-b");

    // Reset nombres personalizados de CUOTAS (FREEBET)
    if (typeof labelText1 !== 'undefined' && labelText1) labelText1.value = "";
    if (typeof labelText2 !== 'undefined' && labelText2) labelText2.value = "";
    if (typeof labelText3 !== 'undefined' && labelText3) labelText3.value = "";
    localStorage.removeItem("freebet-label-texts");
    if (typeof actualizarLabelsFreebetPersonalizado === 'function') {
        actualizarLabelsFreebetPersonalizado();
    }
}

if (resetBtn) {
    resetBtn.addEventListener("click", resetearTodo);
}

if (themeToggle) {
    themeToggle.addEventListener("change", alternarTema);
}

// Cargar tema inicial
cargarTema();

// Navegar a secciones
function scrollToSelector(selector) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// (removido) listeners del menú

// Al cargar con hash, hacer scroll a la sección
function scrollOnHash() {
    if (location.hash === '#surebet') scrollToSelector('#surebet');
    if (location.hash === '#freebet') scrollToSelector('#freebet');
}

window.addEventListener('load', scrollOnHash);
window.addEventListener('hashchange', scrollOnHash);

// (removido) lógica del botón lateral

// ============== PERSISTENCIA DE EQUIPOS ==============
function cargarEquipos() {
    const a = localStorage.getItem("match-team-a") || "";
    const b = localStorage.getItem("match-team-b") || "";
    if (teamAInput) teamAInput.value = a;
    if (teamBInput) teamBInput.value = b;
    actualizarEtiquetasResultados();
}

function guardarEquipoA() {
    localStorage.setItem("match-team-a", teamAInput.value.trim());
    actualizarEtiquetasResultados();
}

function guardarEquipoB() {
    localStorage.setItem("match-team-b", teamBInput.value.trim());
    actualizarEtiquetasResultados();
}

function actualizarEtiquetasResultados() {
    const nombreA = (teamAInput?.value || "Equipo 1").trim() || "Equipo 1";
    const nombreB = (teamBInput?.value || "Equipo 2").trim() || "Equipo 2";
    if (labelFila1) labelFila1.textContent = nombreB; // arriba
    if (labelFila2) labelFila2.textContent = "Empate"; // medio
    if (labelFila3) labelFila3.textContent = nombreA; // abajo
}

if (teamAInput) teamAInput.addEventListener("input", guardarEquipoA);
if (teamBInput) teamBInput.addEventListener("input", guardarEquipoB);

cargarEquipos();

// ==================== CALCULADORA FREEBET ====================

// Seleccionamos elementos de la calculadora FREEBET
const freebetAmount = document.getElementById("freebet-amount");
const cuotaFreebet = document.getElementById("cuota-freebet");
const cuota2 = document.getElementById("cuota2");
const cuota3 = document.getElementById("cuota3");

const apuesta2 = document.getElementById("apuesta2");
const apuesta3 = document.getElementById("apuesta3");

const gananciaFreebet = document.getElementById("ganancia-freebet");
const gananciaFreebetFinal = document.getElementById("ganancia-freebet-final");
const ganancia2 = document.getElementById("ganancia2");
const ganancia3 = document.getElementById("ganancia3");

const percentageTop = document.getElementById("percentage-top");
const freebetLabel1 = document.getElementById("freebet-label-1");
const freebetLabel2 = document.getElementById("freebet-label-2");
const freebetLabel3 = document.getElementById("freebet-label-3");
const labelText1 = document.getElementById("label-text-1");
const labelText2 = document.getElementById("label-text-2");
const labelText3 = document.getElementById("label-text-3");

// Función para calcular la calculadora FREEBET
function calcularFreebet() {
    // Obtener valores
    const freebet = parseFloat(freebetAmount.value) || 0;
    const c1 = parseFloat(cuotaFreebet.value) || 1;
    const c2 = parseFloat(cuota2.value) || 1;
    const c3 = parseFloat(cuota3.value) || 1;
    

    // Cálculo dinámico basado en las fórmulas correctas de FREEBET
    
    // Para la FILA 1 (FREEBET):
    // Apuesta1 = (cuota1 × freebet) - freebet = ganancia neta del FREEBET
    const apuesta1 = (c1 * freebet) - freebet; // (5 × 450) - 450 = 2250 - 450 = 1800
    gananciaFreebet.textContent = `S/${apuesta1.toFixed(2)}`;
    
    // Calcular apuesta2: apuesta1 / cuota2
    const apuesta2Valor = apuesta1 / c2; // 1800 / 3 = 600
    
    // Calcular apuesta3: apuesta1 / cuota3
    const apuesta3Valor = apuesta1 / c3; // 1800 / 2.7 = 666.67
    
    // Actualizar displays de apuestas
    apuesta2.textContent = `S/${apuesta2Valor.toFixed(2)}`;
    apuesta3.textContent = `S/${apuesta3Valor.toFixed(2)}`;
    
    // Calcular ganancia unificada para todas las opciones
    // La ganancia debe ser igual para todos los escenarios
    const inversionTotal = apuesta2Valor + apuesta3Valor;
    // Ganancia = apuesta1 - inversión total (ya que apuesta1 es la ganancia neta del FREEBET)
    const gananciaUnificada = apuesta1 - inversionTotal;
    
    // Actualizar ganancia final para FREEBET
    gananciaFreebetFinal.textContent = `S/${gananciaUnificada.toFixed(2)}`;
    
    // Actualizar displays de ganancias (todas iguales)
    ganancia2.textContent = `S/${gananciaUnificada.toFixed(2)}`;
    ganancia3.textContent = `S/${gananciaUnificada.toFixed(2)}`;
    
    // Calcular rentabilidad: (ganancia / freebet) * 100% = E34/D31*100
    const rentabilidad = freebet > 0 ? (gananciaUnificada / freebet) * 100 : 0;
    
    // Actualizar porcentaje superior
    percentageTop.textContent = `${rentabilidad.toFixed(4)}%`;
}

// Eventos para la calculadora FREEBET
freebetAmount.addEventListener("input", calcularFreebet);
cuotaFreebet.addEventListener("input", calcularFreebet);
cuota2.addEventListener("input", calcularFreebet);
cuota3.addEventListener("input", calcularFreebet);

// Llamada inicial para FREEBET
calcularFreebet();

// ==================== Etiquetas FREEBET personalizadas ====================
function actualizarLabelsFreebetPersonalizado() {
    const l1 = (labelText1?.value || "CUOTA 1").trim() || "CUOTA 1";
    const l2 = (labelText2?.value || "CUOTA 2").trim() || "CUOTA 2";
    const l3 = (labelText3?.value || "CUOTA 3").trim() || "CUOTA 3";
    if (freebetLabel1) freebetLabel1.textContent = `${l1} (FREEBET)`;
    if (freebetLabel2) freebetLabel2.textContent = l2;
    if (freebetLabel3) freebetLabel3.textContent = l3;
    localStorage.setItem("freebet-label-texts", JSON.stringify({ l1, l2, l3 }));
}

function cargarLabelsFreebetPersonalizado() {
    const raw = localStorage.getItem("freebet-label-texts");
    if (raw) {
        try {
            const data = JSON.parse(raw);
            if (labelText1 && data.l1) labelText1.value = data.l1;
            if (labelText2 && data.l2) labelText2.value = data.l2;
            if (labelText3 && data.l3) labelText3.value = data.l3;
        } catch {}
    }
    actualizarLabelsFreebetPersonalizado();
}

if (labelText1) labelText1.addEventListener("input", actualizarLabelsFreebetPersonalizado);
if (labelText2) labelText2.addEventListener("input", actualizarLabelsFreebetPersonalizado);
if (labelText3) labelText3.addEventListener("input", actualizarLabelsFreebetPersonalizado);

cargarLabelsFreebetPersonalizado();
