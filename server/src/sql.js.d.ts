declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  interface Database {
    run(sql: string, params?: any[]): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }
  interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject<T = any>(): T;
    free(): boolean;
  }
  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
  export type { Database };
}
