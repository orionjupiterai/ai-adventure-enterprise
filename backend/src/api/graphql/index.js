const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { verifyToken } = require('../../middleware/authentication');
const logger = require('../../utils/logger');

const setupGraphQL = async (app) => {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      // Add the user to the context
      let user = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        user = await verifyToken(token);
      }

      return {
        user,
        req
      };
    },
    formatError: (err) => {
      logger.error('GraphQL error:', err);
      return err;
    },
    plugins: [
      {
        requestDidStart() {
          return {
            willSendResponse(requestContext) {
              // Log GraphQL queries in development
              if (process.env.NODE_ENV === 'development') {
                logger.debug('GraphQL query:', requestContext.request.query);
              }
            }
          };
        }
      }
    ]
  });

  await server.start();
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }
  });

  return server;
};

module.exports = { setupGraphQL };