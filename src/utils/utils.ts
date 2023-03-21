import fs from 'fs-extra'
import { Db, DbList, EnvList } from '../types/database'
import { showError, showInfo } from './logger';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class Utils {

    //----------------------------------------------------------------------------------------------------------
    public static onlyLettersAndNumbers(str: string) {
        return /^[A-Za-z0-9]*$/.test(str);
    }

    //----------------------------------------------------------------------------------------------------------
    public static writeFile(path: string, fileName: string, content: string) {
        const baseDir = process.cwd()
        // Additional options to write file
        const options = {
            mode: 0o666,
            flag: "w"
        }
        fs.outputFileSync(`${baseDir}/${path}/${fileName}`, content, options)
    }

    //----------------------------------------------------------------------------------------------------------
    public static emptyDir(dirPath: string) {
        fs.emptyDirSync(dirPath)
    }

    //----------------------------------------------------------------------------------------------------------
    public static listFiles(directory: string) 
    {
        const files = fs.readdir(directory)
        return files
    }

    //----------------------------------------------------------------------------------------------------------
    public static createDirIfNotExists(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
    }

    //----------------------------------------------------------------------------------------------------------
    public static createFile(pathFile: string, data: string) {
        fs.writeFileSync(pathFile, data)
    }

    //----------------------------------------------------------------------------------------------------------
    public static readFile(directory: string, fileName: string) 
    {
        const fileContent = fs.readFile(`${directory}/${fileName}`, 'utf-8')
        return fileContent
    }

    //----------------------------------------------------------------------------------------------------------
    public static sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

    //----------------------------------------------------------------------------------------------------------
    public static async getEnvironmentsList()
    {
        let envList: EnvList = {}
        const pathDbCredentials = process.cwd()+ `/.secret/databases.json`
        const databaseCredentials: DbList = require(pathDbCredentials)
        const databases = databaseCredentials.list
        for (let i = 0; i < databases.length; i++) {
            const db: Db = databases[i]
            envList[db.name] = db
        }    
        return envList
    }

    //----------------------------------------------------------------------------------------------------------
    /**
     * Promisify 'exec' command
     * @param cmd 
     * @returns 
     */
    public static async executeShellCommand(cmd: string) {
        const { stdout, stderr } = await exec(cmd);
        if (stdout) {
            showInfo('stdout: ' + stdout);
        }
        showError('stderr: ' + stderr);
    }

    //----------------------------------------------------------------------------------------------------------
    public static escapeSpecialChars(str: string) {
        const escapedString = str.replace(/[.*+?^&~`"${}()|[\]\\]/g, '\\$&')
        return escapedString
    }

    //----------------------------------------------------------------------------------------------------------
    /**
     * Remove MySQL comments Dump that cause errors when migrating DB from MemeSQL ==> MySQL
     * @param dirDumpFile 
     * @param dumpFileName 
     * @returns 
     */
    public static async removeDumpComments(dirDumpFile: string, dumpFileName: string) 
    {
        let pathDumpFile = `${dirDumpFile}/${dumpFileName}`
        pathDumpFile += '.sql'
        const dumpFilecontent = await fs.readFile(`${pathDumpFile}`, 'utf-8')
        const result1 = dumpFilecontent.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/g, '||');
        let newPathDumpFile = `${dirDumpFile}/${dumpFileName}`.slice(0, -1) 
        newPathDumpFile += '.sql'
        const finalResult = result1.replace(/\|\|;/g, '');
        fs.writeFileSync(newPathDumpFile, finalResult)
        return newPathDumpFile
    }

} 

export default Utils