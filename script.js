function mostrarSeccion(id) {
  const secciones = document.querySelectorAll('.contenido');
  secciones.forEach(sec => sec.classList.add('oculto'));
  document.getElementById(id).classList.remove('oculto');
}

  const equipos = {};
  const resultados = {};

  function normalizar(nombre) {
    return nombre.trim(); // sensible a mayúsculas/minúsculas
  }

  function guardarDatos() {
    localStorage.setItem('equipos_plus55', JSON.stringify(equipos));
    localStorage.setItem('resultados_plus55', JSON.stringify(resultados));
  }

  function cargarDatos() {
    const guardadosEquipos = localStorage.getItem('equipos_plus55');
    const guardadosResultados = localStorage.getItem('resultados_plus55');
    if (guardadosEquipos) {
      const eq = JSON.parse(guardadosEquipos);
      Object.keys(eq).forEach(k => equipos[k] = eq[k]);
    }
    if (guardadosResultados) {
      const res = JSON.parse(guardadosResultados);
      Object.keys(res).forEach(k => resultados[k] = res[k]);
    }
  }

  function actualizarTabla() {
    const cuerpo = document.querySelector("#tablaPosiciones tbody");
    cuerpo.innerHTML = "";

    const lista = Object.entries(equipos).map(([nombre, e]) => ({
      nombre,
      ...e,
      DG: e.GF - e.GC,
      Pts: e.PG * 3 + e.PE,
    }));

    lista.sort((a, b) =>
      b.Pts - a.Pts || b.DG - a.DG || b.GF - a.GF || a.nombre.localeCompare(b.nombre)
    );

    lista.forEach(e => {
      cuerpo.innerHTML += `
        <tr>
          <td>${e.nombre}</td>
          <td>${e.PJ}</td>
          <td>${e.PG}</td>
          <td>${e.PE}</td>
          <td>${e.PP}</td>
          <td>${e.GF}</td>
          <td>${e.GC}</td>
          <td>${e.DG}</td>
          <td>${e.Pts}</td>
        </tr>`;
    });
  }

  function procesarResultado(e1, g1, e2, g2) {
    e1 = normalizar(e1);
    e2 = normalizar(e2);

    const clave = `${e1}|${e2}`;
    const claveInvertida = `${e2}|${e1}`;

    for (const k of [clave, claveInvertida]) {
      if (resultados[k]) {
        const [prev1, prev2] = resultados[k];
        restarEstadisticas(e1, prev1, e2, prev2);
        delete resultados[k];
      }
    }

    resultados[clave] = [g1, g2];
    agregarEstadisticas(e1, g1, e2, g2);
    guardarDatos();
  }

  function agregarEstadisticas(e1, g1, e2, g2) {
    [e1, e2].forEach(e => {
      if (!equipos[e]) equipos[e] = { PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0 };
    });

    equipos[e1].PJ++; equipos[e2].PJ++;
    equipos[e1].GF += g1; equipos[e1].GC += g2;
    equipos[e2].GF += g2; equipos[e2].GC += g1;

    if (g1 > g2) {
      equipos[e1].PG++; equipos[e2].PP++;
    } else if (g1 < g2) {
      equipos[e2].PG++; equipos[e1].PP++;
    } else {
      equipos[e1].PE++; equipos[e2].PE++;
    }
  }

  function restarEstadisticas(e1, g1, e2, g2) {
    equipos[e1].PJ--; equipos[e2].PJ--;
    equipos[e1].GF -= g1; equipos[e1].GC -= g2;
    equipos[e2].GF -= g2; equipos[e2].GC -= g1;

    if (g1 > g2) {
      equipos[e1].PG--; equipos[e2].PP--;
    } else if (g1 < g2) {
      equipos[e2].PG--; equipos[e1].PP--;
    } else {
      equipos[e1].PE--; equipos[e2].PE--;
    }
  }

  document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();
    const e1 = document.getElementById("equipo1").value;
    const g1 = parseInt(document.getElementById("goles1").value);
    const e2 = document.getElementById("equipo2").value;
    const g2 = parseInt(document.getElementById("goles2").value);

    if (e1 === e2) {
      alert("Los equipos deben ser distintos.");
      return;
    }

    procesarResultado(e1, g1, e2, g2);
    actualizarTabla();
    this.reset();
  });

  // 🔁 Botón de reinicio
  const botonReiniciar = document.createElement("button");
  botonReiniciar.textContent = "Reiniciar Tabla";
  botonReiniciar.style.marginTop = "1rem";
  botonReiniciar.onclick = function () {
    if (confirm("¿Estás seguro de reiniciar toda la tabla?")) {
      localStorage.removeItem('equipos_plus55');
      localStorage.removeItem('resultados_plus55');
      location.reload();
    }
  };
  document.getElementById("tabla").appendChild(botonReiniciar);

  // Inicial
  cargarDatos();
  actualizarTabla();

    function descargarExcel() {
      const tabla = document.getElementById('partidos');
      const wb = XLSX.utils.table_to_book(tabla, { sheet: "Partidos" });
      XLSX.writeFile(wb, 'Proximos_Partidos.xlsx');
    }
