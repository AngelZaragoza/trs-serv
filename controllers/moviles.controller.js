const conexion = require("../db/db-connection");

class Movil {
  //**********************************
  //* Métodos llamados por el router *
  //**********************************
  listaMoviles = async (req, res) => {
    try {
      let sql = `SELECT m.movil_id, m.nro_interno, m.nro_habilitacion, m.marca, m.modelo,
                          p.persona_id, CONCAT(p.apellido, ', ', p.nombre) AS adherente,
                          t.tipo_movil_id, t.nombre AS tipo
                     FROM tipos_movil t JOIN moviles m
                       ON t.tipo_movil_id = m.tipo_movil_id
                     JOIN adherentes a
                       ON m.adherente_id = a.adherente_id
                     JOIN personas p
                       ON a.persona_id = p.persona_id
                    ORDER BY m.nro_interno`;

      const lista = await conexion.query(sql);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No hay Móviles cargados" });
      } else {
        res.status(200).json(lista);
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };

  detalleMovil = async (req, res) => {
    let { id } = req.params; //Recupera el id enviado por parámetro
    let sql = `SELECT m.movil_id, m.adherente_id, m.tipo_movil_id, m.marca, m.modelo,  
                      m.descripcion, m.dominio, m.nro_habilitacion, 
                      m.nro_interno, m.anio_fabr, m.chofer_pref, 
                      DATE_FORMAT(m.fecha_itv, '%Y-%m-%d') AS fecha_itv, m.seguro
                FROM moviles m 
               WHERE m.movil_id = ?`;
    const results = await conexion.query(sql, [id]);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ success: false, message: "No existe Móvil" });
    }
  };

  nuevoMovilFull = async (req, res) => {
    try {
      let {
        adherente_id,
        tipo_movil_id,
        marca,
        modelo,
        descripcion,
        dominio,
        nro_habilitacion,
        nro_interno,
        anio_fabr,
        chofer_pref = null,
        fecha_itv = null,
        seguro = null,
      } = req.body; //Recupera los campos enviados desde el form

      let movil = { marca, modelo, nro_interno, nro_habilitacion };
      console.log(movil);

      // let sql = `INSERT INTO moviles (
      //                   adherente_id, tipo_movil_id, marca, modelo,  
      //                   descripcion, dominio, nro_habilitacion, nro_interno, 
      //                   anio_fabr, chofer_pref, fecha_itv, seguro
      //                   )
      //             VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`;
      let sql = `CALL nuevo_movil(?,?,?,?,?,?,?,?,?,?,?,?)`
      const results = await conexion
        .query(sql, [
          adherente_id,
          tipo_movil_id,
          marca,
          modelo,
          descripcion,
          dominio,
          nro_habilitacion,
          nro_interno,
          anio_fabr,
          chofer_pref,
          fecha_itv,
          seguro,
        ])
        .then((resp) => {
          console.log("CALL NUEVO =>", resp);
          return res
            .status(201)
            .json({ success: true, action: "added", movil, resp });
        })
        .catch((err) => {
          console.log("Error interno", err);
          return res.status(500).json({ success: false, err });
        });
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };

  updateMovil = async (req, res) => {
    try {
      let { id } = req.params; //Recupera el id enviado por parámetro
      let {
        adherente_id,
        tipo_movil_id,
        marca,
        modelo,
        descripcion,
        dominio,
        nro_habilitacion,
        nro_interno,
        anio_fabr,
        chofer_pref = null,
        fecha_itv = null,
        seguro = null,
      } = req.body; //Recupera los campos enviados desde el form

      let sql = `CALL update_movil(?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const results = await conexion
        .query(sql, [
          id,
          adherente_id,
          tipo_movil_id,
          marca,
          modelo,
          descripcion,
          dominio,
          nro_habilitacion,
          nro_interno,
          anio_fabr,
          chofer_pref,
          fecha_itv,
          seguro          
        ])
        .then((resp) => {
          console.log("CALL UPDATE =>", resp);
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

  listaTipos = async (req, res) => {
    try {
      let sql = `SELECT t.tipo_movil_id, t.nombre
                     FROM tipos_movil t`;

      const lista = await conexion.query(sql);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No hay Tipos cargados" });
      } else {
        res.status(200).json(lista);
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };
}

module.exports = new Movil();
