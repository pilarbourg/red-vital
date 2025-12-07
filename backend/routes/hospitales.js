const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

const {
  Usuario,
  Hospital,
  Donante,
  Solicitud,
  InventarioSangre,
  Cita,
  Notificacion,
  Donacion,
} = require("../db");

router.post("/hospitales/register", async (req, res) => {
  //tested
  try {
    const { email, password, direccion, telefono } = req.body;

    const usuario = await Usuario.create({
      email,
      password,
      rol: "HOSPITAL",
      direccion,
      telefono,
    });

    res.status(201).json({ message: "Hospital registrado", usuario });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error registering hospital", details: err.message });
  }
});

//get all hospitals
router.get("/hospitales", async (req, res) => {
  //tested
  try {
    const hospitales = await Hospital.findAll({ include: Usuario });
    res.json(hospitales);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error getting hospitals", details: err.message });
  }
});

// get hospital by ID
router.get("/hospitales/:id", async (req, res) => {
  //tested
  try {
    const hospital = await Hospital.findByPk(req.params.id, {
      include: [Usuario, Solicitud, InventarioSangre, Cita],
    });

    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    res.json(hospital);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching hospital", details: err.message });
  }
});

// add blood type to hospital
router.post("/hospitales/:id/inventario", async (req, res) => {
  //tested
  try {
    const { grupo_sanguineo, cantidad_unidades } = req.body;

    const inventario = await InventarioSangre.create({
      hospital_id: req.params.id,
      grupo_sanguineo,
      cantidad_unidades,
    });

    res.json({ message: "Blood stock added", inventario });
  } catch (err) {
    res.status(500).json({ error: "Error adding stock", details: err.message });
  }
});

// get inventory by hospital
router.get("/hospitales/:id/inventario", async (req, res) => {
  //tested
  try {
    const stock = await InventarioSangre.findAll({
      where: { hospital_id: req.params.id },
    });

    res.json(stock);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error retrieving inventory", details: err.message });
  }
});

// create a blood request (solicitud)
router.post("/hospitales/:id/solicitud", async (req, res) => {
  try {
    const { grupo_sanguineo, cantidad_unidades, comentarios, urgencia } = req.body;

    const solicitud = await Solicitud.create({
      hospital_id: req.params.id,
      grupo_sanguineo,
      cantidad_unidades,
      comentarios,
      urgencia,
      estado: "PENDIENTE",
    });

    const io = req.app.get("io");
    io.emit("solicitud:nueva", solicitud);

    res.json({ message: "Solicitud creada correctamente", solicitud });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error creating solicitud", details: err.message });
  }
});

// view solicitudes by hospital
router.get("/hospitales/:id/solicitudes", async (req, res) => {
  //tested
  try {
    const solicitudes = await Solicitud.findAll({
      where: { hospital_id: req.params.id },
    });
    res.json(solicitudes);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching solicitudes", details: err.message });
  }
});

//view compatible donors
router.get("/hospitales/:hospitalId/donantes", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { grupo, nombre } = req.query;

    let filtro = {};

    if (grupo && grupo !== "Todos") filtro.grupo_sanguineo = grupo;

    if (nombre) {
      filtro[Op.or] = [
        { nombre: { [Op.like]: `%${nombre}%` } },
        { apellidos: { [Op.like]: `%${nombre}%` } },
      ];
    }

    const donantes = await Donante.findAll({
      where: filtro,
    });

    res.json(donantes);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error searching donors", details: err.message });
  }
});

//send a notification to a donor
router.post("/donantes/notificar", async (req, res) => {
  //tested
  try {
    const { usuario_id, grupo_sanguineo } = req.body;

    const notificacion = await Notificacion.create({
      usuario_id,
      grupo_sanguineo,
      mensaje: `Se requiere donación urgente del tipo ${grupo_sanguineo}`,
      tipo: "HOSPITAL",
      status: "ENVIADA",
    });

    res.json({ message: "Notificación enviada", notificacion });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error sending notification", details: err.message });
  }
});

//update state of request
router.put("/solicitud/:id", async (req, res) => {
  try {
    await Solicitud.update(req.body, { where: { id: req.params.id } });

    const updated = await Solicitud.findByPk(req.params.id);

    req.app.get("io").emit("solicitud:update", updated);

    res.json({ message: "Solicitud actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error updating", details: err.message });
  }
});

//register donation's results
router.post("/hospitales/donaciones", async (req, res) => {
  //tested
  try {
    const result = await Donacion.create(req.body);
    res.json({ message: "Resultado registrado", result });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error saving donation", details: err.message });
  }
});

router.get("/hospitales/donantes/estado", async (req, res) => {
  try {
    const donantes = await Donante.findAll({
      include: [
        {
          model: Donacion,
          include: [Solicitud],
          limit: 1,
          order: [["id", "DESC"]],
        },
      ],
    });

    res.json(donantes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/hospitales/:hospitalId/donaciones", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const donations = await Donacion.findAll({
      include: [
        {
          model: Solicitud,
          where: { hospital_id: hospitalId },
        },
      ],
    });

    res.json(donations);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching donations", details: err.message });
  }
});

// hospital stats
router.get("/hospitales/:id/solicitudes/stats", async (req, res) => {
  try {
    const [pendientes, cubiertas, total] = await Promise.all([
      Solicitud.count({
        where: { hospital_id: req.params.id, estado: "PENDIENTE" },
      }),
      Solicitud.count({
        where: { hospital_id: req.params.id, estado: "CUBIERTA" },
      }),
      Solicitud.count({ where: { hospital_id: req.params.id } }),
    ]);

    res.json({
      total,
      pendientes,
      cubiertas,
      porcentaje_cubiertas: total > 0 ? (cubiertas / total) * 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

// completed donations count per blood type
router.get("/hospitales/:hospitalId/donaciones/stats", async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const donations = await Donacion.findAll({
      include: [
        {
          model: Solicitud,
          where: {
            hospital_id: hospitalId,
            estado: "CUBIERTA",
          },
          attributes: ["grupo_sanguineo"],
        },
      ],
      attributes: ["id"],
    });

    const counts = {};
    donations.forEach((d) => {
      const bloodType = d.Solicitud.grupo_sanguineo;
      counts[bloodType] = (counts[bloodType] || 0) + 1;
    });

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error fetching donation stats",
      details: err.message,
    });
  }
});

// Obtener hospital por usuario_id (para el dashboard hospital)
router.get("/hospitales/byUsuario/:usuarioId", async (req, res) => {
  try {
    const hospital = await Hospital.findOne({
      where: { usuario_id: req.params.usuarioId },
    });

    if (!hospital) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Hospital no encontrado para este usuario" });
    }

    res.json({ ok: true, id: hospital.id, nombre: hospital.nombre });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Error buscando hospital",
      details: err.message,
    });
  }
});


module.exports = router;
