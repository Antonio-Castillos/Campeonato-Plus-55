const equipos = [
  "Amigos de Nieve", "Amigos de Bovea", "Barranquilla Caracas", "Curuña", "Dida", "Educadores",
  "Hermanos de la Hoz", "Incolta", "Instenalco", "Junior", "Juego Limpio", "Prodexport",
  "Real Amistad", "Respol", "Remotriz", "Socios de Cristo", "Sporting", "Simon Bolivar",
  "San Lorenzo", "Unidos F.C", "Veteranos"
];

let posiciones = JSON.parse(localStorage.getItem("posiciones")) || {};
let partidos = JSON.parse(localStorage.getItem("partidos")) || [];

const equipo1Select = document.getElementById("equipo1");
const equipo2Select = document.getElementById("equipo2");
const tablaBody = document.querySelector("#tablaPosiciones tbody");
const form = document.getElementById("formResultado");
const listaPartidos = document.getElementById("listaPartidos");

function init() {
  equipos.forEach(nombre => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = opt2.value = nombre;
    opt1.textContent = opt2.textContent = nombre;
    equipo1Select.appendChild(opt1);
    equipo2Select.appendChild(opt2);

    if (!posiciones[nombre]) {
      posiciones[nombre] = {
        nombre, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, DG: 0, Pts: 0
      };
    }
  });

  renderTabla();
  renderPartidos();
}

function renderTabla() {
  tablaBody.innerHTML = "";

  const orden = Object.values(posiciones).sort((a, b) => {
  // Enfrentamiento directo
  const directo = enfrentamientoDirecto(b.nombre, a.nombre);
  if (directo !== 0) return directo;

  // Partidos ganados
  if (b.PG !== a.PG) return b.PG - a.PG;

  // Goles a favor
  if (b.GF !== a.GF) return b.GF - a.GF;

  // Goles en contra (menor es mejor)
  if (a.GC !== b.GC) return a.GC - b.GC;

  // Diferencia de goles
  if (b.DG !== a.DG) return b.DG - a.DG;

  // Orden alfabético como último recurso
  return a.nombre.localeCompare(b.nombre);
});

  orden.forEach(equipo => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${equipo.nombre}</td>
      <td contenteditable="true" data-field="PJ">${equipo.PJ}</td>
      <td contenteditable="true" data-field="PG">${equipo.PG}</td>
      <td contenteditable="true" data-field="PE">${equipo.PE}</td>
      <td contenteditable="true" data-field="PP">${equipo.PP}</td>
      <td>${equipo.GF}</td>
      <td>${equipo.GC}</td>
      <td>${equipo.DG}</td>
      <td>${equipo.Pts}</td>
      <td><button onclick="resetearEquipo('${equipo.nombre}')">🔄</button></td>
    `;

    tr.querySelectorAll("[contenteditable]").forEach(cell => {
      cell.addEventListener("blur", () => {
        const field = cell.dataset.field;
        const valor = parseInt(cell.textContent) || 0;
        posiciones[equipo.nombre][field] = valor;
        recalcularDesdeManual(equipo.nombre);
        guardarDatos();
        renderTabla();
      });
    });

    tablaBody.appendChild(tr);
  });
}

function enfrentamientoDirecto(equipoA, equipoB) {
  const enfrentamientos = partidos.filter(
    (r) =>
      (r.equipoLocal === equipoA && r.equipoVisitante === equipoB) ||
      (r.equipoLocal === equipoB && r.equipoVisitante === equipoA)
  );

  let puntosA = 0;
  let puntosB = 0;

  enfrentamientos.forEach((r) => {
    const local = r.equipoLocal;
    const visitante = r.equipoVisitante;
    const golesLocal = parseInt(r.golesLocal);
    const golesVisitante = parseInt(r.golesVisitante);

    if (golesLocal === golesVisitante) {
      puntosA += 1;
      puntosB += 1;
    } else if (
      (local === equipoA && golesLocal > golesVisitante) ||
      (visitante === equipoA && golesVisitante > golesLocal)
    ) {
      puntosA += 3;
    } else {
      puntosB += 3;
    }
  });

  if (puntosA > puntosB) return -1; // A va antes que B
  if (puntosB > puntosA) return 1;  // B va antes que A
  return 0; // Empate
}

function guardarDatos() {
  localStorage.setItem("posiciones", JSON.stringify(posiciones));
  localStorage.setItem("partidos", JSON.stringify(partidos));
}

function registrarPartido(e) {
  e.preventDefault();
  const eq1 = equipo1Select.value;
  const eq2 = equipo2Select.value;
  const g1 = parseInt(document.getElementById("goles1").value);
  const g2 = parseInt(document.getElementById("goles2").value);

  if (eq1 === eq2) return alert("Los equipos deben ser diferentes.");
  if (!eq1 || !eq2 || isNaN(g1) || isNaN(g2)) {
  return alert("Debes completar todos los campos correctamente.");
}

  partidos.push({ equipo1: eq1, equipo2: eq2, goles1: g1, goles2: g2 });

  actualizarEstadisticas(eq1, eq2, g1, g2);
  guardarDatos();
  renderTabla();
  renderPartidos();
  form.reset();
}

function actualizarEstadisticas(eq1, eq2, g1, g2) {
  const e1 = posiciones[eq1];
  const e2 = posiciones[eq2];

  e1.PJ++; e2.PJ++;
  e1.GF += g1; e1.GC += g2;
  e2.GF += g2; e2.GC += g1;
  e1.DG = e1.GF - e1.GC;
  e2.DG = e2.GF - e2.GC;

  if (g1 > g2) {
    e1.PG++; e1.Pts += 3;
    e2.PP++;
  } else if (g1 < g2) {
    e2.PG++; e2.Pts += 3;
    e1.PP++;
  } else {
    e1.PE++; e2.PE++;
    e1.Pts += 1; e2.Pts += 1;
  }

  e1.DG = e1.GF - e1.GC;
  e2.DG = e2.GF - e2.GC;
}

function renderPartidos() {
  listaPartidos.innerHTML = "";

  if (partidos.length === 0) {
    listaPartidos.innerHTML = "<p>Aún no se han registrado partidos.</p>";
    return;
  }

  partidos.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${p.equipo1}</strong> ${p.goles1} - ${p.goles2} <strong>${p.equipo2}</strong>`;
    listaPartidos.appendChild(div);
  });
}

function resetearEquipo(nombreEquipo) {
  if (posiciones[nombreEquipo]) {
    posiciones[nombreEquipo] = {
      nombre: nombreEquipo,
      PJ: 0, PG: 0, PE: 0, PP: 0,
      GF: 0, GC: 0, DG: 0, Pts: 0
    };

    // Eliminar partidos en los que participa este equipo
    partidos = partidos.filter(p => p.equipo1 !== nombreEquipo && p.equipo2 !== nombreEquipo);

    guardarDatos();
    renderTabla();
    renderPartidos();
  }
}

function recalcularDesdeManual(nombre) {
  const eq = posiciones[nombre];
  eq.Pts = eq.PG * 3 + eq.PE;
  eq.DG = eq.GF - eq.GC;
}

form.addEventListener("submit", registrarPartido);
init();

// Mostrar solo una sección a la vez
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const seccionId = link.getAttribute("data-seccion");
    mostrarSeccion(seccionId);
  });
});

function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(sec => {
    sec.classList.remove("activa");
  });
  document.getElementById(id).classList.add("activa");
}

// Mostrar sección de inicio al cargar
mostrarSeccion("inicio");

function resetearTodo() {
  const confirmar = confirm("¿Estás seguro de que deseas reiniciar el campeonato? Se borrarán todos los datos.");
  if (confirmar) {
    localStorage.clear();
    location.reload();
  }
}

document.getElementById("reiniciarBtn").addEventListener("click", resetearTodo);
