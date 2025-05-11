import NotFound from '../erreur/not-found';

export default function NotFoundCatchAll() {
  return <NotFound />;
}

export const dynamicParams = false; // Important for static generation