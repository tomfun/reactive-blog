import middleware, { preRoutes } from './middlewares';
import index from './views/index';

function initialize(app) {
  preRoutes(app);
  app.use(index);
  middleware(app);
}

export default initialize;
