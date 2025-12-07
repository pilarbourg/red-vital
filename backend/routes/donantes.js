/* Se debe unir a la DB los modelos:
donante, usuario, disponibilidad, donacion, notificacion
*/
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const { Donante, Usuario, Donacion, Notificacion, Hospital, Solicitud  } = require("../db");

// ================== PERFIL DEL DONANTE ==================
router.get("/donantes/:id/perfil", async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id, {
     include: [{model: Usuario, as: "usuario",
    attributes: ["id", "email", "direccion", "telefono"]}]
    });

    if (!donante) {
      return res.status(404).json({ ok: false, message: "Donante no encontrado" });
    }

    res.json({
      ok: true,
      id: donante.id,
      nombre: donante.nombre,
      apellidos: donante.apellidos,
      genero: donante.genero,
      dob: donante.dob,
      grupo_sanguineo: donante.grupo_sanguineo,
      condiciones: donante.condiciones,
      edad: donante.edad,
      usuario: {
        email: donante.usuario?.email,
        direccion: donante.usuario?.direccion,
        telefono: donante.usuario?.telefono
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error obteniendo perfil" });
  }
});


// ================== HISTORIAL DE DONACIONES ==================
router.get("/donantes/:id/historial", async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await Donacion.findAll({
      where: { usuario_id: id },
      include: [
        {
          model: Solicitud,
          include: [
            {
              model: Hospital
            }
          ]
        }
      ]
    });

   res.json(historial.map(d => ({
  fecha: d.fecha,
  cantidad_ml: d.cantidad_ml,
  centro: d.solicitud?.hospital?.nombre || "Desconocido"
})));

  } catch (err) {
    console.error("ERROR HISTORIAL:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ================== NOTIFICACIONES ==================
router.get("/donantes/:id/notificaciones", async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id);

    if (!donante) {
      return res.status(404).json({ ok: false, error: "Donante no encontrado" });
    }

    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: donante.usuario_id }
    });

    res.json(notificaciones);

  } catch (err) {
    console.error("ERROR NOTIFICACIONES:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ================== HOSPITALES CERCANOS =================

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "RedVital/1.0" }
  });

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

router.get("/donantes/:id/hospitales_cercanos", async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id, {
      include: Usuario
    });

    if (!donante || !donante.usuario) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const direccionUsuario = donante.usuario.direccion;

    if (!direccionUsuario) {
      return res.json([]); // No tiene dirección → no hay hospitales cercanos
    }

    // Geocode donante
    const coordUser = await geocode(direccionUsuario);
    if (!coordUser) {
      return res.json([]);
    }

    const hospitales = await Hospital.findAll();

    const result = [];

    for (let h of hospitales) {
      const coordHosp = await geocode(h.direccion);
      if (!coordHosp) continue;

      const dist = distanceKm(coordUser.lat, coordUser.lon, coordHosp.lat, coordHosp.lon);

      if (dist <= donante.radio_km_periferico) {
        result.push({
          nombre: h.nombre,
          direccion: h.direccion,
          distancia_km: dist.toFixed(1)
        });
      }
    }

    res.json(result);

  } catch (err) {
    console.error("ERROR HOSPITALES CERCANOS:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ================== ACTUALIZAR CREDENCIALES ==================
// PUT /api/donantes/:id/credenciales
router.put("/donantes/:id/credenciales", async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id);

    if (!donante) {
      return res.status(404).json({ ok: false, message: "Donante no encontrado" });
    }

    const usuarioId =  await Usuario.findByPk(donante.usuario_id);

    const updateData = {};
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.password) updateData.password = req.body.password;

    await Usuario.update(updateData, { where: { id: usuarioId } });

    res.json({ ok: true, message: "Credenciales actualizadas" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


router.get("/donantes/:id/credenciales", async (req, res) => {
  try {

    const donante = await Donante.findByPk(req.params.id);

    if (!donante) {
      return res.status(404).json({ ok: false, message: "Donante no encontrado" });
    }

    const usuario = await Usuario.findByPk(req.params.id)

    if (!usuario) {
      return res.status(404).json({ ok: false, message: "Donante no encontrado" });
    }

    res.json({
      ok: true,
      email: usuario.email,
      rol: usuario.rol,
      //password: usuario.password
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


router.get("/donantes/test", async (req, res) => {
  try {
    const lista = await Donante.findAll();
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//===================== BUSCAR DONANTE POR USUARIO ==================
router.get("/donantes/byUsuario/:usuario_id", async (req, res) => {
  try {
    const usuario_id = req.params.usuario_id;

    const donante = await Donante.findOne({
      where: { usuario_id },
      include: [{ 
        model: Usuario,
        as: 'usuario',                    
        attributes: ['id', 'email', 'direccion', 'telefono']
      }]
    });

    if (!donante) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró un donante asociado a este usuario"
      });
    }

    return res.json({
      ok: true,
      id: donante.id,
      usuario_id: donante.usuario_id,
      nombre: donante.nombre,
      apellidos: donante.apellidos,
      genero: donante.genero,
      dob: donante.dob,
      grupo_sanguineo: donante.grupo_sanguineo,
      condiciones: donante.condiciones,
      usuario: {
        email: donante.usuario?.email || null,
        direccion: donante.usuario?.direccion || null,
        telefono: donante.usuario?.telefono || null, 
      }
    });

  } catch (error) {
    console.error("Error en /donantes/byUsuario:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al buscar donante por usuario"
    });
  }

  function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}
});


module.exports = router;
