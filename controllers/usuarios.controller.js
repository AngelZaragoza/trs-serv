const bcrypt = require("bcrypt");
const conexion = require("../db/db-connection");

class Usuario {
  nombreTabla = "usuarios";

  //**********************************
  //* Métodos llamados por el router *
  //**********************************
  listaRoles = async (req, res) => {
    let sql = `SELECT * FROM roles`;

    const lista = await conexion.query(sql);
    if (!lista.length) {
      res
        .status(404)
        .json({ success: false, message: "No se encontraron roles" });
    }
    res.status(200).json(lista);
  };

  listaUsuarios = async (req, res) => {
    let sql = `SELECT p.apellido, p.nombre, p.fecha_nac, u.usuario_id, u.alias, r.nombre AS rol
      FROM personas p JOIN usuarios u
        ON p.persona_id = u.persona_id
      JOIN roles r
        ON u.rol_id = r.rol_id`;

    const lista = await conexion.query(sql);
    if (!lista.length) {
      res
        .status(404)
        .json({ success: false, message: "No se encontraron usuarios" });
    } else {
      res.status(200).json(lista);
    }
  };

  detalleUsuario = async (req, res) => {
    let { id } = req.params; //Recupera el id enviado por parámetro
    let sql = `SELECT p.persona_id, p.apellido, p.nombre, p.direccion,
                      p.telefono, p.email, DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') AS fecha_nac,
                      u.usuario_id, u.rol_id, u.alias, u.password
                FROM personas p JOIN usuarios u
                  ON p.persona_id = u.persona_id
               WHERE u.usuario_id = ?`;
    
    const results = await conexion.query(sql, [id]);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ success: false, message: "No existe Usuario" });
    }
  };

  nuevoUsuarioFull = async (req, res) => {
    try {
      let {
        apellido,
        nombre,
        direccion,
        telefono,
        email = null,
        fecha_nac = null,
        alias,
        password,
        rol_id,
      } = req.body; //Recupera los campos enviados desde el form

      password = await this.passwordUtil(password);
      console.log(password);

      let user = { apellido, nombre, alias };
      console.log(user);

      //Llama el stored procedure que inserta la persona y el usuario al mismo tiempo
      let sql = "CALL nuevo_usuario(?,?,?,?,?,?,?,?,?)";
      const results = await conexion
        .query(sql, [
          apellido,
          nombre,
          direccion,
          telefono,
          email,
          fecha_nac,
          alias,
          password,
          rol_id,
        ])
        .then((resp) => {
          console.log("CALL =>", resp);
          return res
            .status(201)
            .json({ success: "true", action: "added", user, resp });
        })
        .catch((err) => {
          console.log("Error en procedure", err);
          return res.status(500).json(err);
        });
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };
  
  updateUsuario = async (req, res) => {
    try {
      let { id } = req.params;
      let {
        rol_id,
        alias,        
        passwordAnterior,
        passwordConfirm
      } = req.body; //Recupera los campos enviados desde el form
      let user;

      if (id > 0) {
        user = await this.getUsuario("usuario_id", id);
      } else {
        return res.status(403).json({ success: false, message: "Falta id de usuario" });
      }

      //Compara el password ingresado por el Usuario, si no es correcto se corta la ejecución
      let passCorrecto = await this.passwordUtil(passwordAnterior, user.password);
      if (!passCorrecto) {
        // let { password, ...userSinPass } = user;
        return res.status(403).json({ success: false, message: "El password ingresado no es correcto" });
      } 
      
      //Si el password anterior es correcto, se hashea el nuevo password
      const password = await this.passwordUtil(passwordConfirm);

      //Llama el stored procedure que inserta la persona y el usuario al mismo tiempo
      let sql = `UPDATE usuarios SET 
                        rol_id=?, alias=?, password=?
                  WHERE usuario_id=?`;
      const results = await conexion
        .query(sql, [
          rol_id,
          alias,
          password,
          id
        ])
        .then((resp) => {
          console.log("UPDATE =>", resp);
          return res
            .status(200)
            .json({ success: true, action: "updated", resp });
        })
        .catch((err) => {
          console.log('Error en Update =>', err);
          throw err;
        });
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };

  updateUsuario = async (req, res) => {
    try {
      let { id } = req.params;
      let {
        rol_id,
        alias,        
        passwordAnterior,
        passwordConfirm
      } = req.body; //Recupera los campos enviados desde el form
      let user;

      if (id > 0) {
        user = await this.getUsuario("usuario_id", id);
      } else {
        return res.status(403).json({ success: false, message: "Falta id de usuario" });
      }

      //Compara el password ingresado por el Usuario, si no es correcto se corta la ejecución
      let passCorrecto = await this.passwordUtil(passwordAnterior, user.password);
      if (!passCorrecto) {
        // let { password, ...userSinPass } = user;
        return res.status(403).json({ success: false, message: "El password ingresado no es correcto" });
      } 
      
      //Si el password anterior es correcto, se hashea el nuevo password
      const password = await this.passwordUtil(passwordConfirm);

      //Llama el stored procedure que inserta la persona y el usuario al mismo tiempo
      let sql = `UPDATE usuarios SET 
                        rol_id=?, alias=?, password=?
                  WHERE usuario_id=?`;
      const results = await conexion
        .query(sql, [
          rol_id,
          alias,
          password,
          id
        ])
        .then((resp) => {
          console.log("UPDATE =>", resp);
          return res
            .status(200)
            .json({ success: true, action: "updated", resp });
        })
        .catch((err) => {
          console.log('Error en Update =>', err);
          throw err;
        });
    } catch (err) {
      console.log("Error interno", err);
      return res.status(500).json(err);
    }
  };

  //**********************************
  //* Métodos llamados por passport *
  //**********************************

  loginUsuario = async (req, res) => {
    let { usuario, pass } = req.body;
    let user = {};

    if (usuario.length > 0) {
      user = await this.getUsuario("alias", usuario);
    } else {
      return res.status(400).json({ error: "Introduzca nombre de usuario" });
    }

    if (user) {
      console.log(user);
      let autorizado = await this.passwordUtil(pass, user.password);
      if (autorizado) {
        let { password, ...userSinPass } = user;
        console.log(req.session);
        return res.status(200).json({ userSinPass, auth: autorizado });
      }
    } else {
      console.log(user);
      res.status(404).json({ error: "No existe usuario" });
    }
  };

  checkAuth(req, res, next) {
    console.log("Desde la prueba de auth:");
    if (req.isAuthenticated()) {
      console.log("Logueado");
      console.log(req.user);
      res.redirect("login-success");
    } else {
      console.log("Debe Loguear... next");
      next();
    }
  }

  loginSuccess = (req, res) => {
    console.log("Desde login Success");
    console.log("Session:", req.session);
    let { password, ...userSinPass } = req.user;
    console.log(userSinPass);
    res.status(200).json({ logged: true, ...userSinPass });
  };

  loginFailed = (req, res) => {
    console.log("Session F:", req.session);
    console.log("Usuario F:", req.user);
    res
      .status(401)
      .json({ success: false, message: "Usuario o Password incorrectos" });
  };

  logoutUsuario = (req, res, next) => {
    req.logout();
    console.log(req.session);
    res.status(200).json({ logged: false, message: "Sesión cerrada" });
  };

  //**********************************
  //* Métodos auxiliares internos *
  //**********************************

  getUsuario = async (field, value) => {
    // Sentencia original: trataba los strings como case insensitive
    // let sql = `SELECT * FROM usuarios WHERE ${field} = ?`;

    // Si el campo a buscar es "alias", se convierte la comparación a case sensitive,
    // caso contrario 'Admin' sería igual de válido que 'admin' o 'ADmiN'
    let sql =
      field == "alias"
        ? `SELECT * FROM usuarios WHERE ${field} = CONVERT(? USING utf8mb4) COLLATE utf8mb4_0900_as_cs`
        : `SELECT * FROM usuarios WHERE ${field} = ?`;
    
    const user = await conexion.query(sql, [value]);
    if (user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  };

  passwordUtil = async (password, hash) => {
    if (!hash) {
      //Si no se proporciona hash, se calcula y devuelve hash
      return await bcrypt.hash(password, 10);
    } else {
      //Si se proporciona hash, se compara y devuelve true o false
      let authorized = await bcrypt.compare(password, hash);
      return authorized;
    }
  };

}

module.exports = new Usuario();
