import inquirer, { Answers } from "inquirer"
import Handler from "../database/handler"
import { dbSourceChoice, dbTargetChoice, environmentSourceChoice, environmentTargetChoice, useLastCreateTableScripts } from "../question/questions"
import { EnvList } from "../types/database"
import { Answer, EnvironmentChoice } from "../types/inquirer"
import { showError, showSuccess, showTitleAndBanner } from "../utils/logger"
import Utils from "../utils/utils"

class Runner {


    public answers : Answer
    private environments: EnvList = {}
    private databases: Record<string, string[]> = {}
    private dbHandler: Handler

    //----------------------------------------------------------------------------------------------------------
    constructor() {
        this.dbHandler = new Handler()
    }

    //----------------------------------------------------------------------------------------------------------
    private async setEnvironments()
    {
        const envList = await Utils.getEnvironmentsList()
        this.dbHandler.envList = envList
        this.environments = envList
    }
    
    //----------------------------------------------------------------------------------------------------------
    private async buildDbSourceChoicesQuestion()
    {
        let dbSourceChoicesArray = []
        let dbSourceChoiceObject:any = {}
        for (let hostName in this.environments) {
            this.dbHandler.setGenericPool(hostName)
            const databases = await this.dbHandler.showDatabases(hostName)
            this.databases[hostName] = databases
            dbSourceChoiceObject = {
                choices: this.databases[hostName]
            }
            function when(answers:any) {
                return answers.environmentSource == hostName
            }
            dbSourceChoiceObject = {...dbSourceChoiceObject, when}
            dbSourceChoiceObject = {...dbSourceChoice, ...dbSourceChoiceObject}
            dbSourceChoicesArray.push(dbSourceChoiceObject)
        }
        return dbSourceChoicesArray
    }
    
    //----------------------------------------------------------------------------------------------------------
    private async buildEnvironmentChoices(envChoice: EnvironmentChoice) {
        const environmentChoice = envChoice
        const choices: string[] = []
        for (let hostName in this.environments) {
            choices.push(hostName)
        }
        environmentChoice.choices = choices
        return environmentChoice
    }
    
    //----------------------------------------------------------------------------------------------------------
    private async buildQuestions() {
        const envSourceChoice = await this.buildEnvironmentChoices(environmentSourceChoice)
        const envTargetChoice = await this.buildEnvironmentChoices(environmentTargetChoice)
        const dbSourceChoicesArray = await this.buildDbSourceChoicesQuestion()
        const suggestedQuestions = []
        suggestedQuestions.push(envSourceChoice)
        for (let i = 0; i < dbSourceChoicesArray.length; i++) {
            suggestedQuestions.push(dbSourceChoicesArray[i])
        }    
        suggestedQuestions.push(envTargetChoice)
        suggestedQuestions.push(dbTargetChoice)
        suggestedQuestions.push(useLastCreateTableScripts)
        return suggestedQuestions
    }
    
    //----------------------------------------------------------------------------------------------------------
    private async validateAnswers(answers: Answers)
    {
        const envTarget = answers.environmentTarget
        const dbTarget  = answers.dbNameTarget
        if (this.databases[envTarget].includes(dbTarget)) {
            showError(`The chosen DB target ${dbTarget} already exists !`)
            return false
        }
    
        if (!Utils.onlyLettersAndNumbers(dbTarget)) {
            showError(`The chosen targetted DB ${dbTarget} target must contain only letters and numbers !`)
            return false
        }
        
        if (await this.dbHandler.dbTargetExists(envTarget, dbTarget)) {
            showError(`The chosen targetted DB ${dbTarget} already exists. Choose another name !`)
            return false
        }

        const sqlEngineTarget = await this.dbHandler.getSqlEngine(envTarget)
        if (!['mysql', 'memsql'].includes(sqlEngineTarget)) {
            showError(`The targetted DB ${dbTarget} is not a 'MySQL' or 'MemSql Database'`)
            return false
        }
        return true
    }
    
    //----------------------------------------------------------------------------------------------------------
    private async inquirerPrompt()
    {
        const suggestedQuestions = await this.buildQuestions()
        this.answers = await inquirer.prompt(suggestedQuestions)
        const validAnswers = await this.validateAnswers(this.answers)
        if (!validAnswers) {
            await this.inquirerPrompt()
        }
        return
    }
    

    //----------------------------------------------------------------------------------------------------------
    public async run() {
        showTitleAndBanner()
        await this.setEnvironments()
        await this.inquirerPrompt()
        showSuccess('********** Database migrated successfully !! **********')
        process.exit(1)
    } 
}    

export default Runner