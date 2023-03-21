type Answer = {
    dbNameSource: string,
    dbNameTarget: string,
    environmentSource: string,
    environmentTarget: string,
    useLastCreateTableScripts: boolean
}

type EnvironmentChoice = {
    type:string,
    name: string,
    message: string,
    choices?: string[]

}

export {Answer, EnvironmentChoice}