import { red, green, cyan } from 'kleur';
import figlet from 'figlet';
import logSymbols from 'log-symbols';

//----------------------------------------------------------------------------------------------------------
export enum ConsoleMessage {
    TITLE = 'DB Migration Tool',
    BANNER = 'Tool to create new DB based on old DB. \n',
    ERROR = 'ERROR: ',
    SUCCESS = 'SUCCESS: ',
    INFO = 'INFO: ',
    START_GENERATING = 'Start generating the DB...',
}

const newLine = '\n';

//----------------------------------------------------------------------------------------------------------
export const showTitleAndBanner = (): void => {
    console.log(cyan(figlet.textSync(ConsoleMessage.TITLE, { horizontalLayout: 'full' })));
    console.info(cyan(ConsoleMessage.BANNER));
}

//----------------------------------------------------------------------------------------------------------
export const showError = (message: string | Error): void => {
    console.error(red(ConsoleMessage.ERROR) + message);
}

//----------------------------------------------------------------------------------------------------------
export const showSuccess = (message: string): void => {
    console.log(green(ConsoleMessage.SUCCESS) + message + newLine);
}

//----------------------------------------------------------------------------------------------------------
export const showSuccessWithLogSymbol = (message: string): void => {
    console.log(logSymbols.success, green(ConsoleMessage.SUCCESS) + message + newLine);
}

//----------------------------------------------------------------------------------------------------------
export const showInfo = (message: string): void => {
    console.info(cyan(ConsoleMessage.INFO) + message + newLine);
}
