interface IAddinItem {
    url?: string;
    path?: string;
    menuId?: string;
    files?: any;
    page?: string;
    click?: string;
    buttonName?: string;
    mapScript?: {
        src?: string;
        style?: string;
        url?: string;
    }
}

interface IAddin extends IAddinItem {
    name?: string;
    items?: IAddinItem[];
}

export class AddInBuilder {
    private readonly api;
    private currentTask;

    constructor(api) {
        this.api = api;
    }

    private isMenuItem = (item: IAddinItem): boolean => {
        return !item.url && !!item.path && !!item.menuId;
    }

    //Tests a URL for double slash. Accepts a url as a string as a argument.
    //Returns true if the url contains a double slash //
    //Returns false if the url does not contain a double slash.
    private isValidUrl = (url: string): boolean => !!url && url.indexOf("\/\/") > -1;

    private isValidButton = (item: IAddinItem): boolean => !!item.buttonName && !!item.page && !!item.click && this.isValidUrl(item.click);

    private isEmbeddedItem = (item: IAddinItem): boolean => !!item.files;

    private isValidMapAddin = (item: IAddinItem): boolean => {
        const scripts = item.mapScript;
        const isValidSrc = !scripts?.src || this.isValidUrl(scripts.src);
        const isValidStyle = !scripts?.style || this.isValidUrl(scripts.style);
        const isValidHtml = !scripts?.url || this.isValidUrl(scripts.url);
        const hasScripts = !!scripts && (!!scripts?.src || !scripts?.style || !scripts?.url);
        return hasScripts && isValidSrc && isValidStyle && isValidHtml;
    }

    private isValidItem = (item: IAddinItem): boolean => {
        return this.isEmbeddedItem(item) || this.isMenuItem(item) || this.isValidButton(item) || this.isValidMapAddin(item) || (!!item.url && this.isValidUrl(item.url));
    }

    private isCurrentAddin (addin: string) {
        return ((addin.indexOf("Registration config") > -1)||
        (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    }

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    //fills the addin builder with all addins
    fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getAddIns()
        return this.currentTask;
    }

    private getAllowedAddins(allAddins: string[]) {
        return allAddins.filter(addin => {
            //removes the current addin - registration config
            if(this.isCurrentAddin(addin))
            {
                return false;
            }
            let addinConfig: IAddin = JSON.parse(addin);
            if(addinConfig.items) {
                //Multi line addin structure check
                return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(item => {
                    let url = item.url;
                    return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(this.isValidItem);
                });
            }
            else {
                //Single line addin structure check
                return this.isValidItem(addinConfig);
            }
        });
    }

    private getAddIns (): Promise<any> {
        this.currentTask = this.getVersion()
        .then((version) =>
        {
            if( version.split(".", 1) < 8){
                return this.getFromSystemSettings();
            }
            else{
                return this.getFromAddInApi();
            }
        });
        return this.currentTask;
    }

    private getVersion (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("GetVersion", {
            }, resolve, reject);
        });
    }

    private getFromAddInApi (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "AddIn"
            }, resolve, reject);
        }).then((result: any) => {
            let addIns : string[] = [];
            if(Array.isArray(result)){
            result.forEach(addIn => {
                // New Api returns configuration for All Addins
                // If it has Url then we don't need the configuration part for export
                if(addIn.url && addIn.url != ""){
                    if(addIn.configuration){
                        delete addIn.configuration;
                        delete addIn.id;
                    }
                }
                // if there is no url but we have configuration
                // We will keep what's inside the configuration
                else if(addIn.configuration){
                    addIn = addIn.configuration;
                }
                addIns.push(JSON.stringify(addIn));
                });
            }
            return this.getAllowedAddins(addIns);
        });
    }

    private getFromSystemSettings (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "SystemSettings"
            }, resolve, reject);
        }).then((result: any) => {
            return this.getAllowedAddins(result[0].customerPages);
        });
    }

    unload (): void {
        this.abortCurrentTask();
    }
}