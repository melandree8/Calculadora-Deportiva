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
