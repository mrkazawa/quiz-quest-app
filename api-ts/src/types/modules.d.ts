// TypeScript module resolution helper
// This file helps VS Code's TypeScript language server resolve modules correctly

declare module '*.ts' {
  const content: any;
  export default content;
}

declare module './config/session' {
  const config: any;
  export default config;
}

declare module './config/cors' {
  const config: any;
  export default config;
}

declare module './socket/socketConfig' {
  const config: any;
  export default config;
}

declare module './routes/*' {
  const router: any;
  export default router;
}

declare module './handlers/*' {
  const handler: any;
  export default handler;
}
