import express from 'express';
import path from 'path';
import initialize from './controllers/initialize';
import log4js from 'log4js';


let app = express();

log4js.configure({
  appenders: [
    { type: 'console' },
    //{ type: 'file', filename: 'cheese.log', category: 'cheese' }
  ]
});

let logger = log4js.getLogger('console');
logger.setLevel(log4js.levels.INFO);

app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO, format: ':method :status [:response-time ms] :url ' }));

// view engine setup
app.set('views', path.join(__dirname, 'frontend', 'templates'));
app.set('view engine', 'twig');

initialize(app);

export default app;
