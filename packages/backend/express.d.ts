declare namespace Express {
  interface Request {
    session: (typeof import('./src/lib/auth').auth)['$Infer']['Session'] | null;
  }
}
