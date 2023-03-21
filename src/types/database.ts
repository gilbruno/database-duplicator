export type Db = {
    name: string,
    host: string,
    user: string,
    password: string,
    port: string
}

export type DbList = {
    list: Db[]
}

export type EnvList = Record<string, Db>

export type SqlEngine = 'memsql' | 'mysql' | ''


export type TableScript = {
    script: string
}