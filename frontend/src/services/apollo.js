import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

const wsLink = new WebSocketLink({
  uri: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/graphql',
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem('token'),
    },
  }
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  authLink.concat(httpLink),
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          worlds: {
            keyArgs: ['search', 'tags', 'featured'],
            merge(existing, incoming, { args }) {
              if (!args?.page || args.page === 1) {
                return incoming
              }
              return {
                ...incoming,
                worlds: [...(existing?.worlds || []), ...incoming.worlds]
              }
            }
          }
        }
      }
    }
  })
})