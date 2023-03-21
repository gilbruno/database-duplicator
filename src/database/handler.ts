import { EnvList, Db, SqlEngine } from "../types/database"
import { Answer } from "../types/inquirer"
import Utils from "../utils/utils"
import mysql from 'mysql2/promise'

/**
 * class that handle the Database
 */
class Handler {

    private pools: any = {}
    private genericPool: any = {}
    public envList: EnvList = {}
    public environmentSource: string
    public environmentTarget: string
    public databaseSource: string
    public databaseTarget: string
    public useLastCreateTableScripts: boolean

    // private CREATE_DATABASE   = `CREATE DATABASE {{dbName}} DEFAULT CHARACTER SET = 'utf8mb4'`
    // private SHOW_CREATE_TABLE = 'show create table {{tableName}}'
    // private SHOW_TABLES       = 'show tables' as const
    private SHOW_DATABASES    = 'show databases' as const
    private SHOW_SQL_ENGINE   = "show variables like 'pid_file'" as const
    private SCRIPTS_BASE_DIR  = '/scripts' as const 
    private MYSQL             = 'mysql' as const
    private MEMSQL            = 'memsql' as const

    //----------------------------------------------------------------------------------------------------------
    constructor() {}

    //----------------------------------------------------------------------------------------------------------
    public setup(_answers: Answer, cleanScriptFiles?: boolean)
    {
        this.environmentSource         = _answers.environmentSource    
        this.environmentTarget         = _answers.environmentTarget
        this.databaseSource            = _answers.dbNameSource
        this.databaseTarget            = _answers.dbNameTarget
        this.useLastCreateTableScripts = _answers.useLastCreateTableScripts
        if (cleanScriptFiles) {
            this.cleanScriptFiles()
        }
        this.setGenericPool(this.environmentSource)
        this.setGenericPool(this.environmentTarget)
    }

    //----------------------------------------------------------------------------------------------------------
    public async dbTargetExists(environment: string, dbTarget: string)
    {
        let sql = `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbTarget}'`;
        const result: any = await this.genericPool[environment].query(sql)
        return !!result[0]?.length
    }

    //----------------------------------------------------------------------------------------------------------
    private cleanScriptFiles()
    {
        Utils.emptyDir(process.cwd()+this.SCRIPTS_BASE_DIR)
    }

    //----------------------------------------------------------------------------------------------------------
    public setGenericPool(environment: string) 
    {
        const databaseCredentials: Db = this.envList[environment]
        if (this.genericPool === undefined || this.genericPool[environment] === undefined) {
            const pool = mysql.createPool(
                {
                    host: databaseCredentials.host,
                    user: databaseCredentials.user,
                    password: databaseCredentials.password,
                    connectionLimit: 30
                }
            )
            this.genericPool[environment] = pool
        }
    }

    //----------------------------------------------------------------------------------------------------------
    public setPool(dbName: string, environment: string) 
    {
        const envName = environment
        const pathCredentials = process.cwd()+`/.secret/database.${envName}`
        const databaseCredentials: Db = require(pathCredentials)
        if (this.pools === undefined || this.pools[dbName] === undefined) {
            const pool = mysql.createPool(
                {
                    host: databaseCredentials.host,
                    user: databaseCredentials.user,
                    password: databaseCredentials.password,
                    database: dbName,
                    connectionLimit: 30
                }
            )
            this.pools[dbName] = pool
            }    
    }

    //----------------------------------------------------------------------------------------------------------
    public async showDatabases(environment: string) 
    {
        const response: any = await this.genericPool[environment].query(this.SHOW_DATABASES)
        let dbList = response[0].map(
            (item: any) => {
                return item['Database']
            }
        )
        dbList = dbList.filter((item: any) => {
            if (item === 'cluster' || item === 'information_schema' || item === 'memsql') {
                return false
            }
            return true
        })
        return dbList
    }
    
    //----------------------------------------------------------------------------------------------------------
    public async getSqlEngine(host: string): Promise<SqlEngine>
    {
        let sqlEngine: SqlEngine = '' 
        const response: any = await this.genericPool[host].query(this.SHOW_SQL_ENGINE)
        const pidFile = response[0][0]['Value']
        if (pidFile.includes(this.MYSQL)) {
            sqlEngine = this.MYSQL
        }
        if (pidFile.includes(this.MEMSQL)) {
            sqlEngine = this.MEMSQL
        }
        return sqlEngine
    }

    
    //----------------------------------------------------------------------------------------------------------
    /*
    private releasePools() 
    {
        for (const key in this.genericPool) {
            this.genericPool[key]?.end()
        }
        
        for (const key in this.pools) {
            this.pools[key]?.end()
        }
    }*/

}

export default Handler