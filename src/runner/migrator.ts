import Handler from "../database/handler";
import { showSuccessWithLogSymbol } from "../utils/logger";
import Utils from "../utils/utils";
import Path from 'path'

class Migrator {

    private dbHandler: Handler

    private DIR_CREATE_TABLES = '/scripts/create_table' as const
    private DIR_MIGRATIONS    = '/scripts/migrations' as const
    private USE_NATIVE_SQL_EXPORT_IMPORT = false as const

    //----------------------------------------------------------------------------------------------------------
    constructor(_dbHandler: Handler) {
        this.dbHandler= _dbHandler
    }

    //----------------------------------------------------------------------------------------------------------
    public async migrateData() 
    {
        const dirMigrations = process.cwd()+this.DIR_MIGRATIONS
        const files = await Utils.listFiles(dirMigrations)
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i]
            const fileNameWithoutExtension = Path.parse(`${dirMigrations}/${fileName}`).name
            const fileContent = await Utils.readFile(`${dirMigrations}`, `${fileName}`)
            this.dbHandler.createTargetTables(fileContent)
            showSuccessWithLogSymbol(`Migration of data : ${fileNameWithoutExtension}`)
            await Utils.sleep(200)
        }    
        return files
    }
    
    //----------------------------------------------------------------------------------------------------------
    public async createTables() 
    {
        const dirTablesCreation = process.cwd()+this.DIR_CREATE_TABLES
        const files = await Utils.listFiles(process.cwd()+this.DIR_CREATE_TABLES)
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i]
            const fileNameWithoutExtension = Path.parse(`${dirTablesCreation}/${fileName}`).name
            const fileContent = await Utils.readFile(`${dirTablesCreation}`, `${fileName}`)
            this.dbHandler.createTargetTables(fileContent)
            showSuccessWithLogSymbol(`Creation of table : ${fileNameWithoutExtension}`)
            await Utils.sleep(500)
        }
        return files
    } 
    
    //----------------------------------------------------------------------------------------------------------
    private async areSqlEnginesIdenticalBetweenSourceAndTarget()
    {
        return await this.dbHandler.areSqlEnginesIdentical(this.dbHandler.environmentSource, this.dbHandler.environmentTarget)
    }

    //----------------------------------------------------------------------------------------------------------
    public async runSingleServer(useNativeSql: boolean) {
        if (useNativeSql) {
            //Step 1 : Create database
            await this.dbHandler.createDataBase()
            await this.dbHandler.setPool(this.dbHandler.databaseTarget, this.dbHandler.environmentTarget)
            showSuccessWithLogSymbol(`===> Database ${this.dbHandler.databaseTarget} created`)

            //Step 2 : Generate Create Tables Script
            const tables = await this.dbHandler.showTables(this.dbHandler.databaseSource)
            await this.dbHandler.writeTablesScripts(tables)
            showSuccessWithLogSymbol('===> Table scripts creation')

            //Step 3 : Generate Data Migration Script
            this.dbHandler.writeMigrationScripts(tables, this.dbHandler.databaseSource)

            //Step 4 : Execute Create Tables Script
            await this.createTables()

            //Step 5 : Execute Data Migration Script
            await this.migrateData()
        }
        else {
            const dirDumpFile = process.cwd()+'/scripts/dump'
            Utils.createDirIfNotExists(dirDumpFile)
            await Utils.sleep(200)
            const dumpFileName = `dump_${this.dbHandler.databaseSource}_`
            let pathDumpFile = `${dirDumpFile}/${dumpFileName}.sql`
    
            //Step 1 : Create dump file with 'Creata Database <target>' sql command
            await this.dbHandler.createDataBase()

            let noCreateTableOptionExport = false
            if (this.dbHandler.useLastCreateTableScripts) {
                //Step 2 : Create Tables
                await this.dbHandler.createTables()    
                noCreateTableOptionExport = true
            }
            
            //Step 2 : Create dump file of the DB source locally with 'create tables' statements
            await this.dbHandler.createDumpFile(pathDumpFile, noCreateTableOptionExport)
            
            //Step 3 : Import the dump file in the DB target
            await this.dbHandler.importDumpFile(pathDumpFile) 
        }
    }

    //----------------------------------------------------------------------------------------------------------
    public async runMultiServers() 
    {
        const dirDumpFile = process.cwd()+'/scripts/dump'
        Utils.createDirIfNotExists(dirDumpFile)
        await Utils.sleep(200)
        const dumpFileName = `dump_${this.dbHandler.databaseSource}_`
        let pathDumpFile = `${dirDumpFile}/${dumpFileName}.sql`

        //Step 1 : Create dump file with 'Creata Database <target>' sql command
        await this.dbHandler.createDataBase()
        
        const areIdentical = await this.areSqlEnginesIdenticalBetweenSourceAndTarget()

        if (areIdentical) {
            //Step 2 : Create Tables ==> Do Nothing, the "create tables" statements will be in the dump file creation
            
            //Step 3 : Create dump file of the DB source locally with 'create tables' statements
            await this.dbHandler.createDumpFile(pathDumpFile, false)
        }
        else {
            //Step 2 : Create Tables
            await this.dbHandler.createTables()

            //Step 3 : Create dump file of the DB source locally WITHOUT 'create tables' statements
            await this.dbHandler.createDumpFile(pathDumpFile, true)
            pathDumpFile = await Utils.removeDumpComments(dirDumpFile, dumpFileName)
        }
        
        //Step 4 : Import the dump file in the DB target
        await this.dbHandler.importDumpFile(pathDumpFile)   
    }

    //----------------------------------------------------------------------------------------------------------
    public async run(singleServer: boolean) {
        if (singleServer) {
            await this.runSingleServer(this.USE_NATIVE_SQL_EXPORT_IMPORT)
        }
        else {
            await this.runMultiServers()
        }
    }
}    

export default Migrator