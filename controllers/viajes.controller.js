const conexion = require("../db/db-connection");

class Viaje {
  //**********************************
  //* Métodos llamados por el router *
  //**********************************

  //**********************************
  //* Listados *
  //**********************************

  viajesTurnoActivo = async (req, res) => {
    try {
      let { turno_id } = req.params; //Recupera el turno enviado por parámetro
      let sql = `SELECT v.viaje_id, v.usuario_id, v.turno_id, j.movil_id, j.chofer_id, 
                          v.jornada_id, v.tipo_viaje_id, v.estado_viaje_id, v.fecha_hora, 
                          v.origen_nombre, v.origen_altura, v.observaciones
                     FROM viajes v JOIN jornadas_moviles j
                       ON v.jornada_id = j.jornada_id
                    WHERE v.turno_id=? 
                    ORDER BY v.viaje_id`;

      const lista = await conexion.query(sql, [turno_id]);
      if (!lista.length) {
        res.status(404).json({
          success: false,
          message: "No hay Viajes cargados en el Turno",
        });
      } else {
        res.status(200).json(lista);
      }
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json(error);
    }
  };

  viajesEntreFechas = async (req, res) => {
    try {
      
      //Observacion: el offset se setea en '0' como string y no como number debido a que de otra manera,
      //el driver mysql2 arroja un error de argumento no valido al intentar ejecutar la consulta
      let { ini, fin, cant, offset = '0' } = req.query; //Recupera los parámetros enviados por query
      
      //Convierte los valores recibidos a formato Fecha válido    
      ini = new Date(ini);
      fin = new Date(fin);
      
      
      console.log('ini:',ini,'fin:',fin,'cant:',cant, 'offset:', offset);
      
      let sql = `SELECT v.viaje_id, v.usuario_id, v.turno_id, j.movil_id, j.chofer_id, 
                          v.jornada_id, v.tipo_viaje_id, v.estado_viaje_id, v.fecha_hora, 
                          v.origen_nombre, v.origen_altura, v.observaciones
                     FROM viajes v JOIN jornadas_moviles j
                       ON v.jornada_id = j.jornada_id
                    WHERE v.fecha_hora >= CAST(? AS DATETIME) AND v.fecha_hora <= CAST(? AS DATETIME) 
                    ORDER BY v.viaje_id LIMIT ? OFFSET ?`;

      const lista = await conexion.query(sql, [ini, fin, cant, offset]);
      
      if (!lista.length) {
        res.status(404).json({
          success: false,
          message: "No hay Viajes cargados en el rango de Fechas",
        });
      } else {
        res.status(200).json(lista);
      }
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json(error);
    }
  };

  pendientesActivos = async (req, res) => {
    try {
      let sql = `SELECT vp.viaje_pendiente_id, vp.usuario_id, u.alias, vp.turno_id,  
                          vp.estado_viaje_id, vp.registrado, vp.fecha_hora, 
                          vp.origen_nombre, vp.origen_altura, vp.observaciones
                     FROM viajes_pendientes vp JOIN usuarios u
                       ON vp.usuario_id = u.usuario_id
                    WHERE vp.viaje_id IS NULL
                    ORDER BY vp.fecha_hora`;

      const lista = await conexion.query(sql);
      if (!lista.length) {
        res.status(404).json({
          success: false,
          message: "No hay Viajes Pendientes por Asignar",
        });
      } else {
        res.status(200).json(lista);
      }
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json(error);
    }
  };

  tiposViaje = async (req, res) => {
    try {
      let sql = `SELECT t.tipo_viaje_id, t.nombre, t.descripcion
                     FROM tipos_viaje t`;

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

  estadosViaje = async (req, res) => {
    try {
      let sql = `SELECT e.estado_viaje_id, e.nombre, e.descripcion
                     FROM estados_viaje e`;

      const lista = await conexion.query(sql);
      if (!lista.length) {
        res
          .status(404)
          .json({ success: false, message: "No hay Estados cargados" });
      } else {
        res.status(200).json(lista);
      }
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json({ success: false, err });
    }
  };

  //**********************************
  //* Creación de Registros *
  //**********************************

  nuevoViajeNormal = async (req, res) => {
    try {
      let {
        usuario_id,
        turno_id,
        jornada_id,
        tipo_viaje_id,
        estado_viaje_id,
        fecha_hora,
        origen_nombre,
        origen_altura,
        observaciones = null,
      } = req.body; //Recupera los campos del form

      fecha_hora = new Date(fecha_hora); //Convierte los valores recibidos a formato Fecha válido
      let sql = `INSERT INTO viajes
                            (usuario_id, turno_id, jornada_id, 
                            tipo_viaje_id, estado_viaje_id, fecha_hora, 
                            origen_nombre, origen_altura, observaciones)
                      VALUES (?,?,?,?,?,?,?,?,?)`;
      await conexion
        .query(sql, [
          usuario_id,
          turno_id,
          jornada_id,
          tipo_viaje_id,
          estado_viaje_id,
          fecha_hora,
          origen_nombre,
          origen_altura,
          observaciones,
        ])
        .then((resp) => {
          console.log("INSERT VIAJE => ", resp);
          return res.status(201).json({ success: true, action: "added", resp });
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json({ success: false, error });
    }
  };

  nuevoViajePendiente = async (req, res) => {
    try {
      let {
        usuario_id,
        turno_id,
        estado_viaje_id,
        registrado,
        fecha_hora,
        origen_nombre,
        origen_altura,
        observaciones = null,
      } = req.body; //Recupera los campos del form

      registrado = new Date(registrado);
      fecha_hora = new Date(fecha_hora);
      let sql = `INSERT INTO viajes_pendientes 
                            (usuario_id, turno_id, 
                            estado_viaje_id, 
                            registrado, fecha_hora, 
                            origen_nombre, origen_altura, 
                            observaciones)
                      VALUES (?,?,?,?,?,?,?,?)`;
      await conexion
        .query(sql, [
          usuario_id,
          turno_id,
          estado_viaje_id,
          registrado,
          fecha_hora,
          origen_nombre,
          origen_altura,
          observaciones,
        ])
        .then((resp) => {
          console.log("INSERT PENDIENTE => ", resp);
          return res.status(201).json({ success: true, action: "added", resp });
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json({ success: false, error });
    }
  };

  //**********************************
  //* Edición de Registros *
  //**********************************

  asignaPendiente = async (req, res) => {
    try {
      let { viaje_pendiente_id } = req.params; //Recupera el id enviado por parámetro
      let {
        usuario_id,
        turno_id,
        jornada_id,
        tipo_viaje_id,
        estado_viaje_id,
        fecha_hora,
        origen_nombre,
        origen_altura,
        observaciones = null,
      } = req.body; //Recupera los campos enviados desde el form

      fecha_hora = new Date(fecha_hora); //Convierte los valores recibidos a formato Fecha válido
      let sql = 'CALL asigna_pendiente(?,?,?,?,?,?,?,?,?,?)';
      await conexion
        .query(sql, [
          viaje_pendiente_id,
          usuario_id,
          turno_id,
          jornada_id,
          tipo_viaje_id,
          estado_viaje_id,
          fecha_hora,
          origen_nombre,
          origen_altura,
          observaciones,
        ])
        .then((resp) => {
          console.log("UPDATE Pendiente => ", resp);
          return res.status(201).json({ success: true, action: "asigned", resp });
        })
        .catch((err) => {
          throw err;
        });

    } catch (error) {
      console.log("Error interno", error);
      return res.status(500).json({ success: false, error });
    }
  };
}

module.exports = new Viaje();
