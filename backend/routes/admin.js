const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Op, Sequelize } = require("sequelize");

const { Usuario, Donante, Hospital, Solicitud, Donacion, InventarioSangre } = require("../db");
const authRouter = require("./auth");
const { crearDoctoresParaHospital } = authRouter;

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

router.get("/usuarios/donantes", async (req, res) => {
  try {
    const donantes = await Donante.findAll({
    
      include: [
        {
          model: Usuario,
          attributes: ["id", "email"],
        }
      ],
      order: [["id", "ASC"]],
    });

    const resultado = donantes.map( (d) => ({
      id: d.usuario ? d.usuario.id : null,
      nombre: `${d.nombre} ${d.apellidos}`,         
      email: d.usuario ? d.usuario.email : null,
      grupo_sanguineo: d.grupo_sanguineo,
      ultima_donacion: d.fecha_ultima_donacion,
      
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener donantes" });
  }
});


router.get("/usuarios/hospitales", async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: Usuario,
          attributes: ["id", "email"],
        },
      ],
    });

    const resultado = hospitales.map((h) => ({
      id: h.usuario ? h.usuario.id : null,
      nombre: h.nombre,                          
      email: h.usuario ? h.usuario.email : null, 
      direccion: h.direccion,
      ciudad: h.ciudad,
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener hospitales" });
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
        cantidad: s.unidades_disponibles,
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

router.post( "/hospitales",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").isEmail().withMessage("Email no válido"),
    body("localizacion").notEmpty() .withMessage("La localización es obligatoria"),
    body("password").optional().isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
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

      await crearDoctoresParaHospital(hospital.id);

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

router.get("/inventarios", async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({
      attributes: ['id', 'nombre'],
    });

    const resultado = await Promise.all(
      hospitales.map(async (hospital) => {
        const inventarios = await InventarioSangre.findAll({
          where: { hospital_id: hospital.id },
          order: [['fecha_ultima_actualizacion', 'DESC']],
        });

        return {
          hospital: {
            id: hospital.id,
            nombre: hospital.nombre,
          },
          inventarios,
        };
      })
    );

    res.json(resultado);
  } catch (error) {
    console.error("Error obteniendo inventarios:", error);
    res.status(500).json({ error: "Error obteniendo inventarios" });
  }
});

router.get("/inventarios/ultimos-por-grupo", async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({
      attributes: ['id', 'nombre'],
    });

    const resultado = await Promise.all(
      hospitales.map(async (hospital) => {
        const grupos = await InventarioSangre.findAll({
          where: { hospital_id: hospital.id },
          attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('grupo_sanguineo')), 'grupo_sanguineo']
          ],
          raw: true,
        });

        const inventarios = await Promise.all(
          grupos.map(async (g) => {
            return await InventarioSangre.findOne({
              where: {
                hospital_id: hospital.id,
                grupo_sanguineo: g.grupo_sanguineo,
              },
              order: [['fecha_ultima_actualizacion', 'DESC']],
            });
          })
        );

        return {
          hospital: {
            id: hospital.id,
            nombre: hospital.nombre,
          },
          inventarios,  
        };
      })
    );

    res.json(resultado);
  } catch (error) {
    console.error("Error obteniendo inventarios:", error);
    res.status(500).json({ error: "Error obteniendo inventarios" });
  }
});



router.get("/inventarios/ultimos", async (req, res) => {
  try {
    // 1. Traer todos los hospitales activos (o todos los que quieras)
    const hospitales = await Hospital.findAll({
      attributes: ['id', 'nombre'],
    });

    // 2. Para cada hospital, obtener el último inventario
    const inventariosUltimos = await Promise.all(
      hospitales.map(async (hospital) => {
        const ultimoInventario = await InventarioSangre.findOne({
          where: { hospital_id: hospital.id },
          order: [['fecha_ultima_actualizacion', 'DESC']],
        });

        return {
          hospital: {
            id: hospital.id,
            nombre: hospital.nombre,
          },
          inventario: ultimoInventario || null,
        };
      })
    );

    res.json(inventariosUltimos);
  } catch (error) {
    console.error("Error obteniendo últimos inventarios:", error);
    res.status(500).json({ error: "Error obteniendo últimos inventarios" });
  }
});



router.post("/hospitales/:id/inventario", async (req, res) => {
  try {
    const { grupo_sanguineo, unidades_disponibles } = req.body;
    const hospital_id = req.params.id;

    let inventario = await InventarioSangre.findOne({
      where: { hospital_id, grupo_sanguineo }
    });

    if (inventario) {
      inventario.unidades_disponibles += unidades_disponibles; // suma la nueva cantidad
      await inventario.save();
    } else {
      inventario = await InventarioSangre.create({
        hospital_id,
        grupo_sanguineo,
        unidades_disponibles,
      });
    }

    res.json({ message: "Inventario actualizado", inventario });
  } catch (err) {
    res.status(500).json({ error: "Error actualizando inventario", details: err.message });
  }
});


module.exports = router;
