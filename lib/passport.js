const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const usuariosController = require("../controllers/usuarios.controller");

//Personalizar el nombre de los campos que recibirá
const customFields = {
  usernameField: "usuario",
  passwordField: "pass",
};

//Toma usuario y password del request y realiza la autenticación
const verifyCallback = (username, password, done) => {
  usuariosController.getUsuario("alias", username).then(async (user) => {
    //Si no existe usuario, retorna falso
    if (!user) {
      return done(null, false, { message: "Usuario inexistente" });
    }
    //Si existe usuario, comprueba el password
    const autenticado = await usuariosController.passwordUtil(
      password,
      user.password
    );

    if (!autenticado) {
      return done(null, false, { message: "Password incorrecto" });
    }

    //Si todo es correcto, devuelve el usuario
    return done(null, user);
  });
};

const strategy = new LocalStrategy(customFields, verifyCallback);

//Configura el middleware de passport con las funciones de strategy
passport.use(strategy);

//Devuelve el usuario y lo adjunta al objeto request
passport.serializeUser((user, done) => {  
  done(null, user.usuario_id);
});

passport.deserializeUser(function (id, done) {
  usuariosController.getUsuario("usuario_id", id).then((user) => {
    done(null, user);
  });
});
