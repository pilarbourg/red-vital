const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const { Usuario, Donante, Hospital, Solicitud, Donacion } = require("../db");

router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalDonantes,
      totalHospitales,
      totalSolicitudes,
      solicitudesPendientes,
      solicitudesAlta,
      totalDonaciones,
    ] = await Promise.all([
      Usuario.count(),
      Donante.count(),
      Hospital.count(),
      Solicitud.count(),
      Solicitud.count({ where: { estado: "PENDIENTE" } }),
      Solicitud.count({ where: { urgencia: "ALTA" } }),
      Donacion.count(),
    ]);

    res.json({
      totalUsuarios,
      totalDonantes,
      totalHospitales,
      totalSolicitudes,
      solicitudesPendientes,
      solicitudesAlta,
      totalDonaciones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener datos del dashboard" });
  }
});

router.get("/usuarios", async (req, res) => {
  try {
    const { rol, activo } = req.query;

    const where = {};
    if (rol) where.rol = rol;
    if (typeof activo !== "undefined") {
      where.activo = activo === "true";
    }

    const usuarios = await Usuario.findAll({
      where,
      order: [["id", "ASC"]],
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar usuarios" });
  }
});

router.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener usuario" });
  }
});

router.put(
  "/usuarios/:id",
  [
    body("email").optional().isEmail().withMessage("Email no válido"),
    body("rol")
      .optional()
      .isIn(["DONANTE", "HOSPITAL", "ADMIN"])
      .withMessage("Rol no válido"),
    body("activo")
      .optional()
      .isBoolean()
      .withMessage("El campo 'activo' debe ser booleano"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      const { nombre, email, rol, activo } = req.body;

      // Si se intenta cambiar el email, comprobar que no exista ya
      if (email && email !== usuario.email) {
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
          return res
            .status(400)
            .json({ mensaje: "Ese email ya está siendo utilizado" });
        }
        usuario.email = email;
      }

      if (typeof nombre !== "undefined") usuario.nombre = nombre;
      if (typeof rol !== "undefined") usuario.rol = rol;
      if (typeof activo !== "undefined") usuario.activo = activo;

      await usuario.save();

      res.json({ mensaje: "Usuario actualizado correctamente", usuario });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al actualizar usuario" });
    }
  }
);

router.delete("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    await usuario.destroy();

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
});

router.get("/solicitudes", async (req, res) => {
  try {
    const { estado, prioridad } = req.query;

    const where = {};
    if (estado) where.estado = estado.toUpperCase();
    if (prioridad) where.urgencia = prioridad.toUpperCase();

    const solicitudes = await Solicitud.findAll({
      where,
      include: [
        {
          model: Hospital,
          attributes: ["id", "nombre"],
        },
      ],
      order: [["id", "DESC"]],
    });

    res.json(
      solicitudes.map((s) => ({
        id: s.id,
        tipoSangre: s.grupo_sanguineo,
        cantidad: s.cantidad_unidades,
        prioridad: s.urgencia.toLowerCase(),
        estado: s.estado.toLowerCase(),
        Hospital: { nombre: s.Hospital.nombre },
        createdAt: s.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar solicitudes" });
  }
});

router.put(
  "/solicitudes/:id",
  [
    body("estado")
      .isIn(["pendiente", "parcial", "cubierta", "cancelada"])
      .withMessage("Estado no válido"),
    body("prioridad")
      .isIn(["alta", "media", "baja"])
      .withMessage("Prioridad no válida"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const solicitud = await Solicitud.findByPk(req.params.id);
      if (!solicitud) {
        return res.status(404).json({ mensaje: "Solicitud no encontrada" });
      }

      const { estado, urgencia } = req.body;
      if (typeof estado !== "undefined") solicitud.estado = estado;
      if (typeof prioridad !== "undefined") solicitud.urgencia = urgencia;

      await solicitud.save();

      res.json({ mensaje: "Solicitud actualizada correctamente", solicitud });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al actualizar solicitud" });
    }
  }
);

router.post(
  "/hospitales",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").isEmail().withMessage("Email no válido"),
    body("localizacion")
      .notEmpty()
      .withMessage("La localización es obligatoria"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const { nombre, email, localizacion, password } = req.body;

      const existe = await Usuario.findOne({ where: { email } });
      if (existe) {
        return res
          .status(400)
          .json({ mensaje: "Ya existe un usuario con ese email" });
      }

      const hospitalUsuario = await Usuario.create({
        nombre,
        email,
        rol: "HOSPITAL",
        activo: true,
        password: password || "123456",
      });

      const hospital = await Hospital.create({
        nombre,
        direccion: localizacion,
        ciudad: "Madrid",
        usuario_id: hospitalUsuario.id,
      });

      res.status(201).json({
        mensaje: "Hospital creado correctamente",
        hospital,
        usuario: hospitalUsuario,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al crear hospital" });
    }
  }
);

module.exports = router;
