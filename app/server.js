const express = require('express');
const path = require('path');
const expressValidator = require('express-validator');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

const errorHandlers = require('./handlers/errorHandlers');
const {localPort} = require('./server/config/configFile');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, './public')));

app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

app.use(expressValidator({
  errorFormatter(param, msg, value){
    let namespace = param.split('.');
    let root = namespace.shift();
    let formParam = root;

    while (namespace.length) {
        formParam += '[' + namespace.shift() + ']';
    }
    return{
        param: formParam,
        msg,
        value
    };
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.flashes = req.flash();
  next();
});

app.use(require('./routes/index'));
app.use(require('./routes/post'));
app.use(require('./routes/error'));

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// One of our error handlers will see if these errors are just validation errors
app.use(errorHandlers.flashValidationErrors);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get('env') === 'development') {
    /* Development Error Handler - Prints stack trace */
    app.use(errorHandlers.developmentErrors);
}

// production error handler
app.use(errorHandlers.productionErrors);

const port = process.env.PORT || localPort;
app.listen(port, () => console.log(`Server have been started on the port ${port}`));
