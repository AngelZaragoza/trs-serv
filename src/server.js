const express = require("express");
const dotenv = require("dotenv").config();
const conexion = require("../db/db-connection");
const cors = require("cors");
const usuarios = require("../routes/usuarios.route");
const adherentes = require("../routes/adherentes.route");
const choferes = require("../routes/choferes.route");
const moviles = require("../routes/moviles.route");
const jornadas = require("../routes/jornadas.route");
const turnos = require("../routes/turnos.route");
const viajes = require("../routes/viajes.route");

const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const passport = require('passport');
require('../lib/passport');


//*****************************************
//Configuración de varios middleware
//*****************************************

const app = express();

// let corsOrigins = app.get('env') != 'production' ? 'https://taxresys-serv.herokuapp.com' : 'http://localhost:4200';
// console.log(corsOrigins);

const corsOptions = {
  origin: process.env.ORIGIN,
  credentials: true
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./files'));

//*****************************************
//Configuración del middleware de sesiones
//*****************************************
const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  createDatabaseTable: true,
  endConnectionOnClose: false,
};

const sessionStore = new MySQLStore(options);

app.use(
  session({
    // key: 'session_cookie_name',
    secret: process.env.SECRET_KEY,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly : false,
      maxAge: 1000 * 60 * 60 * 8 //8hrs de duración máxima de la cookie
    }
  })
);

//*****************************************
//Configuración del middleware passport
//*****************************************

app.use(passport.initialize());
app.use(passport.session());

//*****************************************
//Configuración del puerto del servidor
//*****************************************

const port = Number(process.env.PORT || 3400);

//*****************************************
//Configuración de las rutas del servidor
//*****************************************

app.get('/', (req, res) => {
  console.log('Probando')
  res.set('Content-Type', 'text/html');
  res.status(200).sendFile('index.html');
});

app.use("/usuarios", usuarios);
app.use("/adherentes", adherentes);
app.use("/choferes", choferes);
app.use("/moviles", moviles);
app.use("/jornadas", jornadas);
app.use("/turnos", turnos);
app.use("/viajes", viajes);

//*****************************************
//Levanta el servidor e informa el puerto
//*****************************************

const server = app.listen(port, () => {
  console.log(`Express server listening on ${JSON.stringify(server.address())} port ${port}`);
});

//*****************************************
//Manejo "elegante" de cierre del servidor
//*****************************************

process.on("SIGTERM", () => {
  shutDown("SIGTERM");
});

process.on("SIGINT", () => {
  shutDown("SIGINT");
});

function shutDown(signal) {
  console.log(`${signal} recibido: cerrando server`);
  //sessionStore.clearExpiredSessions();  
  server.close(() => {
    console.log("Servidor cerrado con éxito");
    process.exit(0);
  });
}
