/* Se debe unir a la DB los modelos:
Usuario, Donante, Hospital, Admin
*/

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { sequelize, Usuario, Donante, Hospital, Admin, Doctor } = require("../db");  

const ROLES_VALIDOS = ["DONANTE", "HOSPITAL", "ADMIN"];

function normalizarRol(r) {
  if (!r) return null;
  const upper = String(r).toUpperCase();
  return ROLES_VALIDOS.includes(upper) ? upper : null;
}

const doctoresSeed = require("../seed/doctoresBase.json");

async function crearDoctoresParaHospital(hospitalId, transaction) {
  const base = doctoresSeed.doctores;

  const mezcla = [...base].sort(() => Math.random() - 0.5);
  const seleccion = mezcla.slice(0, 8);

  const payload = seleccion.map(d => ({
    hospital_id: hospitalId,
    nombre: d.nombre,
    departamento: d.departamento,
  }));

  await Doctor.bulkCreate(payload, { transaction });
}

// REGISTRO
router.post("/auth/register", async (req, res) => {
  const { email, password, rol: rolRaw, direccion, telefono } = req.body;
  
  const rol = normalizarRol(rolRaw);

  if (!email || !password || !rol) {
    return res.status(400).json({
      mensaje: "Email, password y rol son obligatorios",
    });
  }

  try {
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    const t = await sequelize.transaction();

    try {
      // 1) Crear usuario base
      const nuevoUsuario = await Usuario.create(
        {
          email,
          password, // se encripta en el hook beforeSave
          rol,
          direccion,
          telefono: telefono || null,
        },
        { transaction: t }
      );

      let perfil = null;

      // 2) Crear perfil según rol
      if (rol === "DONANTE") {
        const {
          nombre,
          apellidos,
          genero,
          dob,
          grupo_sanguineo,
          condiciones,
          radio_km_periferico,
        } = req.body;

        if (!nombre || !apellidos || !dob || !grupo_sanguineo) {
          await t.rollback();
          return res.status(400).json({
            mensaje:
              "Faltan campos de donante: nombre, apellidos, fecha de nacimiento o grupo sanguíneo",
          });
        }

        perfil = await Donante.create(
          {
            usuario_id: nuevoUsuario.id,
            nombre,
            apellidos,
            genero: genero || null,
            dob,
            grupo_sanguineo,
            fecha_ultima_donacion: null,
            radio_km_periferico: radio_km_periferico || 10,
            condiciones: condiciones || null,
          },
          { transaction: t }
        );
      } else if (rol === "HOSPITAL") {
        const {
          nombreHospital,
          direccionHospital,
          ciudadHospital,
        } = req.body;

        if (!nombreHospital || !direccionHospital || !ciudadHospital) {
          await t.rollback();
          return res.status(400).json({
            mensaje:
              "Faltan campos de hospital: nombre, dirección y ciudad",
          });
        }
        
        const yaExiste = await Hospital.findOne({
          where: { nombre: nombreHospital },
          transaction: t,
        });

        if (yaExiste) {
          await t.rollback();
          return res.status(400).json({
            mensaje: "Ya existe un hospital con ese nombre",
          });
        }

        perfil = await Hospital.create(
          {
            usuario_id: nuevoUsuario.id,
            nombre: nombreHospital,
            direccion: direccionHospital,
            ciudad: ciudadHospital,
          },
          { transaction: t }
        );

        await crearDoctoresParaHospital(perfil.id, t);

      } else if (rol === "ADMIN") {
        // Admin no necesita más datos
        perfil = await Admin.create(
          { usuario_id: nuevoUsuario.id },
          { transaction: t }
        );
      }

      await t.commit();

      return res.json({
        mensaje: "Usuario registrado correctamente",
        id: nuevoUsuario.id,
        rol: nuevoUsuario.rol,
        perfil,
      });
    } catch (errTx) {
      await t.rollback();
      console.error(errTx);
      return res.status(500).json({
        error: "Error al registrar el usuario",
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// LOGIN
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Usuario.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    //devolver id y rol para guardar en localStorage
    res.json({
      mensaje: "Login correcto",
      id: user.id,
      rol: user.rol,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
