'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';
import { ReactNode } from 'react';

interface ApolloProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Apollo Client para la aplicación Next.js
 * Envuelve la aplicación y proporciona acceso al cliente GraphQL
 */
export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {children}
    </BaseApolloProvider>
  );
}

export default ApolloProvider; 