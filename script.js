const equipos = [
  "Amigos de Nieve", "Amigos de Bovea", "Barranquilla Caracas", "Curuña", "Dida", "Educadores",
  "Hermanos de la Hoz", "Incolta", "Instenalco", "Junior", "Juego Limpio", "Prodexport",
  "Real Amistad", "Respol", "Remotriz", "Socios de Cristo", "Sporting", "Simon Bolivar",
  "San Lorenzo", "Unidos F.C", "Veteranos"
];

let posiciones = JSON.parse(fetch().getItem("posiciones")) || {};
let partidos = JSON.parse(fetch().getItem("partidos")) || [];

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
  const directo = enfrentamientoDirecto(b.nombre, a.nombre);
  return (
    directo ||
    b.PG - a.PG ||
    b.GF - a.GF ||
    a.GC - b.GC ||
    b.DG - a.DG ||
    a.nombre.localeCompare(b.nombre)
  );
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

function enfrentamientoDirecto(a, b) {
  const partidosDirectos = partidos.filter(p =>
    (p.equipo1 === a && p.equipo2 === b) || (p.equipo1 === b && p.equipo2 === a)
  );

  let ganaA = 0, ganaB = 0;

  partidosDirectos.forEach(p => {
    if (p.equipo1 === a && p.goles1 > p.goles2) ganaA++;
    else if (p.equipo2 === a && p.goles2 > p.goles1) ganaA++;
    else if (p.equipo1 === b && p.goles1 > p.goles2) ganaB++;
    else if (p.equipo2 === b && p.goles2 > p.goles1) ganaB++;
  });

  return ganaB - ganaA;
}

function guardarDatos() {
  fetch().setItem("posiciones", JSON.stringify(posiciones));
  fetch().setItem("partidos", JSON.stringify(partidos));
}

function registrarPartido(e) {
  e.preventDefault();
  const eq1 = equipo1Select.value;
  const eq2 = equipo2Select.value;
  const g1 = parseInt(document.getElementById("goles1").value);
  const g2 = parseInt(document.getElementById("goles2").value);

  if (eq1 === eq2) return alert("Los equipos deben ser diferentes.");

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
document.querySelectorAll("[data-seccion]").forEach(link => {
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






