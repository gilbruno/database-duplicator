import { EnvironmentChoice } from "../types/inquirer"


let environmentSourceChoice: EnvironmentChoice = 
{
    type: 'list',
    name: 'environmentSource',
    message: 'Choose a source environment ?'
}

let dbSourceChoice = 
{
  type: 'list',
  name: 'dbNameSource', 
  message: 'What is the name of the DB source ?'
}

let environmentTargetChoice: EnvironmentChoice = 
{
    type: 'list',
    name: 'environmentTarget',
    message: 'Choose a target environment ?'
}

let dbTargetChoice = {
  type: 'input',
  name: 'dbNameTarget', 
  message: 'What is the name of the targetted DB ?'
}

let useLastCreateTableScripts = {
  type: 'confirm',
  name: 'useLastCreateTableScripts', 
  message: 'Do you want to use last "CREATE TABLE SCRIPTS" ?'
}


const questions = [environmentSourceChoice, dbTargetChoice]
  

export {questions, environmentSourceChoice, dbSourceChoice, environmentTargetChoice, dbTargetChoice, useLastCreateTableScripts}