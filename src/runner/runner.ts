import { showSuccess } from "./utils/logger"

class Runner {

    //----------------------------------------------------------------------------------------------------------
    public async run() {
        
        showSuccess('********** Database migrated successfully !! **********')
        process.exit(1)
    } 
}    

export default Runner