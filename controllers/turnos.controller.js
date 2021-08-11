const conexion = require("../db/db-connection");

class Turno {
  //**********************************
  //* Métodos llamados por el router *
  //**********************************

  //**********************************
  //* Listados *
  //**********************************

  estadoTurnosFechas = async (req, res) => {
    try {
      let {
        hora_inicio = "2015-01-01 00:00",
        hora_cierre = "2035-12-31 23:59",
      } = req.query; //Recupera los datos desde la query, o asigna valores por default

      console.log("Start:", hora_inicio, "End:", hora_cierre);

      hora_inicio = new Date(hora_inicio);
      hora_cierre = new Date(hora_cierre);

      let { usuario_id, rol_id } = req.user; //Recupera los datos del usuario logueado actualmente

      console.log("User de Passport:", req.user);
      console.log(
        "User:",
        usuario_id,
        "Rol:",
        rol_id,
        "Start:",
        hora_inicio,
        "End:",
        hora_cierre
      );

      let isAdmin;
      //Si el usuario es Admin o Encargado, cambia el usuario_id para recuperar todos los registros
      if (rol_id < 3) {
        isAdmin = ">=?";
        usuario_id = 1;
      } else {
        isAdmin = " =?";
      }

      let fechaDesde = "t.hora_inicio >= CAST(? AS DATETIME)";
      let fechaHasta = "t.hora_cierre <= CAST(? AS DATETIME)";

      let sql = `SELECT t.turno_id, t.usuario_id, u.alias,
                        t.estado_pago_id, ep.estado,
                        t.hora_inicio, t.hora_cierre, 
                        t.horas_extra, t.observaciones 
                   FROM turnos_operadores t JOIN usuarios u
                     ON t.usuario_id = u.usuario_id
                   JOIN estado_pago ep
                     ON t.estado_pago_id = ep.estado_pago_id
                  WHERE t.usuario_id${isAdmin} AND (${fechaDesde} AND ${fechaHasta})`;

      const lista = await conexion.query(sql, [
        usuario_id,
        hora_inicio,
        hora_cierre,
      ]);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No se encontraron turnos" });
      } else {
        res.status(200).json(lista);
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };

  ultimosNTurnos = async (req, res) => {
    try {
      //Cantidad de registros a recuperar por query
      //Default: 5
      let { cant = 5 } = req.query;

      let sql = `SELECT t.turno_id, t.usuario_id, u.alias,
                          t.hora_inicio, t.hora_cierre, 
                          t.observaciones 
                     FROM turnos_operadores t JOIN usuarios u
                       ON t.usuario_id = u.usuario_id
                    ORDER BY t.turno_id DESC LIMIT ?`;
      const result = await conexion.query(sql, [cant]);
      if (!result.length) {
        res
          .status(404)
          .json({ success: false, message: "No se encontraron turnos" });
      } else {
        res.status(200).json(result);
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };

  getTurnoActivo = async (req, res, next) => {
    let sql = `SELECT t.turno_id, t.usuario_id, u.alias,
                      t.estado_pago_id, t.hora_inicio, 
                      t.hora_cierre, t.horas_extra, t.observaciones
                FROM turnos_operadores t JOIN usuarios u
                  ON t.usuario_id = u.usuario_id
               ORDER BY turno_id DESC LIMIT 1`;

    const result = await conexion.query(sql);
    if (result.length) {
      if (req.method === "GET") {
        //Si la petición es tipo GET se devuelve el resultado al cliente
        res.status(200).json({
          success: true,
          message: "Último turno cargado",
          turno: result[0],
        });
      } else {
        //Si la petición es de otro tipo, se pasa el control y el resultado al siguiente middleware
        req.turno = result[0];
        next();
      }
    } else {
      //Si no hay resultados, se procede según el tipo de petición
      console.log("No hay turnos cargados");
      if (req.method === "GET") {
        res
          .status(200)
          .json({ success: false, message: "No hay turnos cargados" });
      } else {
        next();
      }
    }
  };

  //**********************************
  //* Operaciones con los Turnos *
  //**********************************

  inicioTurno = async (req, res) => {
    try {
      let {
        usuario_id,
        estado_pago_id = 1,
        hora_inicio,
        horas_extra = 0,
        observaciones = null,
      } = req.body; //Recupera los campos del form

      console.log("Desde form.hora_inicio =>", hora_inicio);
      console.log("Desde prev.hora_inicio =>", req.turno.hora_inicio);
      console.log("Desde prev.hora_cierre =>", req.turno.hora_cierre);

      //Convierte 'hora_inicio' que viene como string a un objeto Date válido
      let abre = new Date(hora_inicio);
      hora_inicio = abre;
      console.log("hora_abre convertida =>", abre);

      //Si el turno anterior está cerrado...
      if (req.turno.hora_cierre) {
        //Verifica que la hora_inicio sea mayor a la hora_cierre
        let valido = hora_inicio >= req.turno.hora_cierre;
        console.log("Hora_inicio correcta? =>", valido);

        //Si el valor es válido, se inserta el nuevo turno
        if (valido) {
          let sql = `INSERT INTO turnos_operadores
                                (usuario_id, estado_pago_id,
                                hora_inicio, horas_extra, observaciones)
                        VALUES (?,?,?,?,?)`;
          await conexion
            .query(sql, [
              usuario_id,
              estado_pago_id,
              hora_inicio,
              horas_extra,
              observaciones,
            ])
            .then((resp) => {
              console.log("INSERT TURNO => ", resp);
              return res
                .status(201)
                .json({ success: true, action: "added", resp });
            })
            .catch((err) => {
              console.log("Error interno", err);
              return res.status(500).json({ success: false, err });
            });
        } else {
          return res
            .status(200)
            .json({ success: false, message: "Hora de Inicio incorrecta" });
        }
      } else {
        //Si el turno anterior NO está cerrado...
        console.log("Error: Turno sin cerrar");
        res
          .status(200)
          .json({ success: false, message: "Error: Turno sin cerrar" });
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };

  cierreTurno = async (req, res) => {
    try {
      let {
        turno_id,
        usuario_id,
        hora_cierre,
        horas_extra = 0,
        observaciones = null,
      } = req.body;

      hora_cierre = new Date(hora_cierre);

      let sql = `UPDATE turnos_operadores 
                  SET hora_cierre=?, 
                      horas_extra=?, 
                      observaciones=? 
                WHERE turno_id=?`;
      await conexion
        .query(sql, [hora_cierre, horas_extra, observaciones, turno_id])
        .then((resp) => {
          if (resp.changedRows > 0) {
            console.log("UPDATE =>", resp);
            return res
              .status(200)
              .json({ success: true, action: "updated", resp });
          } else {
            console.log("UPDATE failed =>", resp);
            return res
              .status(200)
              .json({ success: false, action: "unchanged", resp });
          }
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

module.exports = new Turno();
