const express = require("express");
const conexion = require("../db/db-connection");

class Adherente {
  //**********************************
  //* Métodos llamados por el router *
  //**********************************
  listaAdherentes = async (req, res) => {
    let sql = `SELECT p.persona_id,p.apellido, p.nombre,
                      a.adherente_id, a.moviles_activos
                 FROM personas p JOIN adherentes a
                   ON p.persona_id = a.persona_id`;

    const lista = await conexion.query(sql);
    if (!lista.length) {
      res
        .status(404)
        .json({ success: false, message: "No hay Adherentes cargados" });
    } else {
      res.status(200).json(lista);
    }
  };

  detalleAdherente = async (req, res) => {
    let { id } = req.params; //Recupera el id enviado por parámetro
    let sql = `SELECT p.persona_id, p.apellido, p.nombre, p.direccion,
                      p.telefono, p.email, DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') AS fecha_nac,
                      a.adherente_id, a.moviles_activos, a.observaciones
                FROM personas p JOIN adherentes a
                  ON p.persona_id = a.persona_id
               WHERE a.adherente_id = ?`;
    const results = await conexion.query(sql, [id]);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ success: false, message: "No existe Adherente" });
    }
  };

  nuevoAdherenteFull = async (req, res) => {
    try {
      let {
        apellido,
        nombre,
        direccion,
        telefono,
        email = null,
        fecha_nac = null,
        moviles_activos,
        observaciones = null,
      } = req.body; //Recupera los campos enviados desde el form

      let adher = { apellido, nombre, moviles_activos };
      console.log(adher);

      //Llama el stored procedure que inserta la persona y el adherente al mismo tiempo
      let sql = "CALL nuevo_adherente(?,?,?,?,?,?,?,?)";
      const results = await conexion
        .query(sql, [
          apellido,
          nombre,
          direccion,
          telefono,
          email,
          fecha_nac,
          moviles_activos,
          observaciones,
        ])
        .then((resp) => {
          console.log("CALL =>", resp);
          return res
            .status(201)
            .json({ success: true, action: "added", adher, resp });
        })
        .catch((err) => {
          console.log("Error en procedure", err);
          return res.status(500).json({ success: false, err });
        });      
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };

  updateAdherente = async (req, res) => {
    try {
      let { id } = req.params; //Recupera el id enviado por parámetro
      let {
        observaciones = null
      } = req.body; //Recupera los campos enviados desde el form
      console.log("Id:", id,  "Obs: ", observaciones);
      let sql = `UPDATE adherentes SET 
                        observaciones=?
                  WHERE adherente_id=?`;
      const results = await conexion
        .query(sql, [
          observaciones,
          id
        ])
        .then((resp) => {
          console.log("UPDATE =>", resp);
          return res
            .status(200)
            .json({ success: "true", action: "updated", resp });
        })
        .catch((err) => {
          console.log("Error en update", err);
          return res.status(500).json(err);
        });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  };
}

module.exports = new Adherente();
