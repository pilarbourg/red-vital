const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const { Donante, Usuario, Donacion, Notificacion, Hospital, Solicitud, Cita, SecurityCode } = require("../db");


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

const { Op } = require("sequelize");

router.get("/donantes/:id/dashboard", async (req, res) => {
  try {
    const donanteId = req.params.id;
    const hoy = new Date();

    
    const donaciones = await Donacion.findAll({
      where: { usuario_id: donanteId },
      include: [
        {
          model: Solicitud,
          include: [{ model: Hospital }]
        }
      ],
      order: [["fecha", "DESC"]]
    });

   
    const citas = await Cita.findAll({
      where: {
        donante_id: donanteId,
        fecha: { [Op.gte]: hoy }
      },
      include: [{ model: Hospital }],
      order: [["fecha", "ASC"]]
    });

    res.json({
      ok: true,
      donaciones,
      citas
    });

  } catch (err) {
    console.error("ERROR DASHBOARD:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});



router.get("/donantes/:id/historial", async (req, res) => {
  try {
    const { id } = req.params;

   const historial = await Donacion.findAll({
      where: { usuario_id: donanteId },
      include: [
        {
          model: Solicitud,
          include: [{ model: Hospital }]
        }
      ],
      order: [["fecha", "DESC"]]
    });

    const hoy = new Date();

    const citas = await Cita.findAll({
      where: {
        donante_id: donanteId,
        fecha: { [Op.gte]: hoy }
      },
      include: [{ model: Hospital }],
      order: [["fecha", "ASC"]]
    });

    res.json({
      ok: true,
      historial,
      citas
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


router.get("/donantes/:id/notificaciones", async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id);
    
    if (!donante) {
      return res.status(404).json({ ok: false, error: "Donante no encontrado" });
    }
      const usuario_id= donante.usuario_id;
      const grupo = donante.grupo_sanguineo;

    // 1) Notificaciones personales del usuario
    const personales = await Notificacion.findAll({
      where: { usuario_id }
    });

    // 2) Notificaciones globales emitidas por hospitales
    const globales = await Notificacion.findAll({
      where: { tipo: "HOSPITAL" }
    });

    // 3) Unificamos ambas listas
    const todas = [...personales, ...globales];

    // Solicitudes urgentes de hospitales
    const solicitudes = await Solicitud.findAll({
      where: {
        grupo_sanguineo: grupo,
        estado: "PENDIENTE",
        urgencia: ["MEDIA", "ALTA"]
      },
      include: [ Hospital ]
    });

    return res.json({
      ok: true,
      personales,
      globales,
      solicitudes
    });

  } catch (err) {
    console.error("ERROR NOTIFICACIONES:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});



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
      return res.json([]); 
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


const bcrypt = require("bcrypt");
const { enviarCorreoSeguro } = require("../utils/mail");

router.put("/donantes/:id/credenciales/solicitar", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, username } = req.body;

    const donante = await Donante.findByPk(id, { include: Usuario });
    if (!donante) {
      return res.status(404).json({ ok: false, error: "Donante no encontrado" });
    }

    const usuario = await Usuario.findByPk(donante.usuario_id);

    let cambios = [];

    if (email && email !== usuario.email) {

      // Expresión regular de email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ ok: false, error: "Email no válido" });
      }

      // Comprobar si ya existe ese email
      const existe = await Usuario.findOne({ where: { email } });
      if (existe) {
        return res.status(400).json({ ok: false, error: "Este email ya está en uso" });
      }

      await usuario.update({ email });
      cambios.push("email");
    }


    if (password) {
      const segura =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[\W]/.test(password);

      if (!segura) {
        return res.status(400).json({
          ok: false,
          error:
            "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
        });
      }

      const hash = await bcrypt.hash(password, 10);
      await usuario.update({ password: hash });
      cambios.push("contraseña");
    }
    
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);
    console.log(codigo);
    
    await SecurityCode.create({
      usuario_id: usuario.id,
      codigo,
      tipo: "CAMBIO_CREDENCIALES",
      expiracion,
      email,
      password
    });
    
    await enviarCorreoSeguro(
      usuario.email,
      "Código de verificación – RedVital",
      `Tu código de verificación es: <strong>${codigo}</strong>`,
      usuario.username
    );

    return res.json({
      ok: true,
      message: "Código enviado al email.",
      cambios
    });

  } catch (err) {
    console.error("ERROR ACTUALIZANDO CREDENCIALES:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/donantes/:id/credenciales/verificar", async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo } = req.body;

    const donante = await Donante.findByPk(id);
    if (!donante) return res.status(404).json({ ok: false, error: "Donante no encontrado" });

    const usuario = await Usuario.findByPk(donante.usuario_id);

    const registro = await SecurityCode.findOne({
      where: {
        usuario_id: usuario.id,
        codigo,
        tipo: "CAMBIO_CREDENCIALES"
      }
    });

    if (!registro) {
      return res.status(400).json({ ok: false, error: "Código incorrecto" });
    }

    if (new Date() > registro.expiracion) {
      return res.status(400).json({ ok: false, error: "Código expirado" });
    }

    let cambios = [];

    if (registro.newEmail) {
      usuario.email = registro.newEmail;
      cambios.push("email");
    }

    if (registro.newPassword) {
      usuario.password = await bcrypt.hash(registro.newPassword, 10);
      cambios.push("contraseña");
    }

    if (registro.newUsername) {
      usuario.username = registro.newUsername;
      cambios.push("usuario");
    }

    await usuario.save();
    await registro.destroy();

    await enviarCorreoSeguro(
      usuario.email,
      "Cambios aplicados – RedVital",
      `Se han aplicado los cambios: ${cambios.join(", ")}`,
      usuario.username
    );

    return res.json({ ok: true, cambios });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put("/donantes/:id/perfil", async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, telefono, condiciones } = req.body;

    // Obtener donante
    const donante = await Donante.findByPk(id);
    if (!donante) {
      return res.status(404).json({ ok: false, error: "Donante no encontrado" });
    }

    // Obtener usuario asociado
    const usuario = await Usuario.findByPk(donante.usuario_id);
    if (!usuario) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    let cambios = [];

    if (direccion) {
      const geo = await validarDireccion(direccion);

      if (!geo) {
        return res.status(400).json({
          ok: false,
          error: "La dirección no existe. Verifícala."
        });
      }

      await usuario.update({
        direccion,
        latitud: geo.lat,
        longitud: geo.lon
      });
    }


    if (telefono && telefono !== usuario.telefono) {
      await usuario.update({ telefono });
      cambios.push("teléfono");
    }

    if (condiciones && condiciones !== donante.condiciones) {
      await donante.update({ condiciones });
      cambios.push("condiciones médicas");
    }

    return res.json({
      ok: true,
      cambios,
      message: "Perfil actualizado correctamente"
    });

  } catch (err) {
    console.error("Error actualización perfil:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});



async function validarDireccion(direccion) {
  if (!direccion) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "RedVital/1.0 (email@example.com)"
    }
  });

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null; // Dirección no válida
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon)
  };
}

module.exports = { validarDireccion };

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
