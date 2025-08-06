const API_URL = 'https://api-campeonato.onrender.com'; // ← reemplázalo por tu URL real

document.addEventListener('DOMContentLoaded', () => {
    cargarEquipos();
    document.getElementById('formularioResultado').addEventListener('submit', registrarPartido);
});

async function cargarEquipos() {
    try {
        const res = await fetch(`${API_URL}/equipos`);
        const equipos = await res.json();
        renderizarTabla(equipos);
        llenarSelectEquipos(equipos);
    } catch (error) {
        console.error('Error al cargar equipos:', error);
    }
}

function llenarSelectEquipos(equipos) {
    const selectLocal = document.getElementById('equipoLocal');
    const selectVisitante = document.getElementById('equipoVisitante');
    selectLocal.innerHTML = '';
    selectVisitante.innerHTML = '';
    equipos.forEach(equipo => {
        const option1 = document.createElement('option');
        option1.value = equipo.nombre;
        option1.textContent = equipo.nombre;

        const option2 = option1.cloneNode(true);

        selectLocal.appendChild(option1);
        selectVisitante.appendChild(option2);
    });
}

async function registrarPartido(e) {
    e.preventDefault();
    const local = document.getElementById('equipoLocal').value;
    const visitante = document.getElementById('equipoVisitante').value;
    const golesLocal = parseInt(document.getElementById('golesLocal').value);
    const golesVisitante = parseInt(document.getElementById('golesVisitante').value);

    if (local === visitante) {
        alert("Un equipo no puede jugar contra sí mismo.");
        return;
    }

    const partido = {
        local,
        visitante,
        golesLocal,
        golesVisitante
    };

    try {
        const res = await fetch(`${API_URL}/partidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partido)
        });

        if (res.ok) {
            await cargarEquipos();
            document.getElementById('formularioResultado').reset();
        } else {
            console.error('Error al registrar partido:', await res.text());
        }
    } catch (error) {
        console.error('Error al conectar con la API:', error);
    }
}

function renderizarTabla(equipos) {
    const tbody = document.querySelector('#tablaPosiciones tbody');
    tbody.innerHTML = '';
    equipos.sort((a, b) => {
        // Criterios de desempate
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
        if (a.golesContra !== b.golesContra) return a.golesContra - b.golesContra;
        if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
        return a.nombre.localeCompare(b.nombre);
    });

    equipos.forEach(equipo => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${equipo.nombre}</td>
            <td contenteditable="true" onblur="actualizarCampo(this, '${equipo._id}', 'pj')">${equipo.pj}</td>
            <td contenteditable="true" onblur="actualizarCampo(this, '${equipo._id}', 'pg')">${equipo.pg}</td>
            <td contenteditable="true" onblur="actualizarCampo(this, '${equipo._id}', 'pe')">${equipo.pe}</td>
            <td contenteditable="true" onblur="actualizarCampo(this, '${equipo._id}', 'pp')">${equipo.pp}</td>
            <td>${equipo.gf}</td>
            <td>${equipo.gc}</td>
            <td>${equipo.diferenciaGoles}</td>
            <td>${equipo.puntos}</td>
            <td><button onclick="eliminarEquipo('${equipo._id}')">🗑️</button></td>
        `;

        tbody.appendChild(tr);
    });
}

async function actualizarCampo(td, id, campo) {
    const nuevoValor = parseInt(td.textContent);
    if (isNaN(nuevoValor)) {
        alert('Debe ser un número');
        await cargarEquipos();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/equipos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [campo]: nuevoValor })
        });

        if (res.ok) {
            await cargarEquipos(); // para actualizar GF, GC, puntos, etc.
        } else {
            console.error('Error al actualizar campo:', await res.text());
        }
    } catch (error) {
        console.error('Error al conectar con la API:', error);
    }
}

async function eliminarEquipo(id) {
    const confirmacion = confirm('¿Estás seguro de eliminar este equipo?');
    if (!confirmacion) return;

    try {
        const res = await fetch(`${API_URL}/equipos/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await cargarEquipos();
        } else {
            console.error('Error al eliminar equipo:', await res.text());
        }
    } catch (error) {
        console.error('Error al conectar con la API:', error);
    }
}
