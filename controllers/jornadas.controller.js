const conexion = require("../db/db-connection");

class Jornada {
  //**********************************
  //* Métodos llamados por el router *
  //**********************************
  jornadasMovilesRangoFechas = async (req, res) => {
    try {
      let {
        movil_id,
        chofer_id,
        hora_inicio = "2015-01-01",
        hora_cierre = "2035-12-31",
      } = req.query; //Recupera los datos desde la query, o asigna valores por default

      let { usuario_id, rol_id } = req.user; //Recupera los datos del usuario logueado actualmente

      let fechaDesde = "j.hora_inicio >= CAST(? AS DATETIME)";
      let fechaHasta = "j.hora_cierre <= CAST(? AS DATETIME)";

      let sql = `SELECT j.jornada_id, j.movil_id, j.chofer_id, 
                      j.usuario_id, u.alias,
                      j.hora_inicio, j.hora_cierre 
                 FROM jornadas_moviles j JOIN usuarios u
                   ON j.usuario_id = u.usuario_id
                WHERE ${fechaDesde} AND ${fechaHasta}`;
      const lista = await conexion.query(sql, [hora_inicio, hora_cierre]);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No se encontraron jornadas" });
      } else {
        res.status(200).json(lista);
      }
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json(error);
    }
  };

  jornadasActivas = async (req, res) => {
    try {
      /* ** Consulta Original: no devuelve las últimas jornadas creadas. Deprecada **
      
      //Con LEFT JOIN trae todos los móviles aunque no tengan una jornada creada aún.
      let sql = `SELECT m.movil_id, m.nro_interno, m.nro_habilitacion, m.chofer_pref, 
                        t.nombre AS tipo, CONCAT(m.marca, ' ', m.modelo) as marca_modelo,
                        j.jornada_id, j.chofer_id, j.turno_inicio, 
                        j.hora_inicio, j.turno_cierre, j.hora_cierre 
                   FROM tipos_movil t JOIN moviles m
                     ON t.tipo_movil_id = m.tipo_movil_id
                   LEFT JOIN jornadas_moviles j
                     ON m.movil_id = j.movil_id
                  GROUP BY m.movil_id
                  ORDER BY m.nro_interno`;
      */

      // *** CONSULTA CORRECTA: Devuelve siempre las últimas Jornadas creadas ***
      let sql = `SELECT m.movil_id, m.nro_interno, m.nro_habilitacion, m.chofer_pref,
                        t.nombre AS tipo, CONCAT(m.marca, ' ', m.modelo) AS modelo, 
                        j.jornada_id, j.chofer_id, j.turno_inicio, 
                        j.hora_inicio, j.turno_cierre, j.hora_cierre
                   FROM tipos_movil t INNER JOIN moviles m 
                     ON t.tipo_movil_id = m.tipo_movil_id
                   LEFT JOIN jornadas_moviles j 
                     ON j.movil_id = m.movil_id
                  WHERE j.jornada_id IN
                        (SELECT MAX(jm.jornada_id) FROM jornadas_moviles jm GROUP BY jm.movil_id)
                  ORDER BY m.nro_interno ASC`;
      
      const lista = await conexion.query(sql);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No hay Móviles cargados" });
      } else {
        res.status(200).json(lista);
      }
    } catch (error) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };

  detalleJornada = async (req, res) => {
    try {
      let { id } = req.params; //Recupera el id enviado por parámetro
      let sql = `SELECT j.jornada_id, j.movil_id, j.chofer_id,
                        j.turno_inicio, j.hora_inicio, 
                        j.turno_cierre, j.hora_cierre 
                   FROM jornadas_moviles j
                  WHERE j.jornada_id = ?`;
      const results = await conexion.query(sql, [id]);

      if (results.length > 0) {
        res.status(200).json(results);
      } else {
        res.status(404).json({ success: false, message: "No existe Jornada" });
      }
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json({ success: false, error });
    }
  };

  inicioJornada = async (req, res) => {
    try {
      let { movil_id, chofer_id, turno_inicio, hora_inicio } = req.body; //Recupera los campos del form

      //Convierte 'hora_inicio' que viene como string a un objeto Date válido
      hora_inicio = new Date(hora_inicio);

      let sql = `INSERT INTO jornadas_moviles
                                (movil_id, chofer_id, 
                                turno_inicio, hora_inicio)
                        VALUES (?,?,?,?)`;
      await conexion
        .query(sql, [movil_id, chofer_id, turno_inicio, hora_inicio])
        .then((resp) => {
          console.log("INSERT JORNADA => ", resp);
          return res.status(201).json({ success: true, action: "added", resp });
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

  cierreJornada = async (req, res) => {
    try {
      let { jornada_id, turno_cierre, hora_cierre } = req.body;

      //Convierte 'hora_cierre' que viene como string a un objeto Date válido
      hora_cierre = new Date(hora_cierre);

      let sql = `UPDATE jornadas_moviles 
                  SET turno_cierre=?, hora_cierre=?
                WHERE jornada_id=?`;
      await conexion
        .query(sql, [turno_cierre, hora_cierre, jornada_id])
        .then((resp) => {
          console.log("UPDATE =>", resp);
          return res
            .status(200)
            .json({ success: "true", action: "updated", resp });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json(err);
        });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  };
}

module.exports = new Jornada();
