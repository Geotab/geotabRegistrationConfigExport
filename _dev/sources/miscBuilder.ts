import { entityToDictionary } from "./utils";

type TMapProviderType = "default" | "additional" | "custom";

export interface IMiscData {
    mapProvider: {
        value: string;
        type: TMapProviderType;
    };
    currentUser: any;
    isUnsignedAddinsAllowed: boolean;
    addins: string[];
    purgeSettings: any;
    emailSenderFrom: string;
    customerClassification: string;
}

export class MiscBuilder {
    private readonly api;
    private customMapProviders;
    private currentTask;
    private currentUser;
    private isUnsignedAddinsAllowed;
    private addins: string[];
    private readonly defaultMapProviders = {
        GoogleMaps: "Google Maps",
        Here: "HERE Maps",
        MapBox: "MapBox"
    };
    private purgeSettings: any;
    private emailSenderFrom: string;
    private customerClassification: string;

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    //todo problem code...is this necessary?
    // private getAllowedAddins (allAddins: string[]) {
    //     return allAddins.filter(addin => {
    //         let addinConfig = JSON.parse(addin);
    //         return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(item => {
    //             let url = item.url;
    //             return url && url.indexOf("\/\/") > -1;
    //         });
    //     });
    // }

    private getAllowedAddins (allAddins: string[]) {
        return allAddins.filter(addin => {
            //removes the current addin - registration config
            if(this.isCurrentAddin(addin))
            {
                return false;
            }
            let addinConfig = JSON.parse(addin);
            if(addinConfig.items) {
                //Multi line addin structure check
                return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(item => {
                    let url = item.url;
                    return this.isValidUrl(url);
                });
            }
            else {
                //Single line addin structure check
                return this.isValidUrl(addinConfig.url);
            }
        });
    }

    //Tests a URL for double slash. Accepts a url as a string as a argument.
    //Returns true if the url contains a double slash //
    //Returns false if the url does not contain a double slash.
    private isValidUrl(url: string): boolean {
        if (url && url.indexOf("\/\/") > -1)
        {
            return true;
        }
        return false;
    }

    private removeExportAddin (allAddins: string[]) {
        return allAddins.filter(addin => {
            return (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) <= 0);
        });
    }

    private isCurrentAddin (addin: string) {
        return ((addin.indexOf("Registration config") > -1)||
        (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    }

    constructor(api) {
        this.api = api;
    }

    //fills the Misc builder (system settings) with the relevant information
    fetch (): Promise<IMiscData> {
        this.abortCurrentTask();
        this.currentTask = new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                let userName = sessionData.userName;
                this.api.multiCall([
                        ["Get", {
                            typeName: "User",
                            search: {
                                name: userName
                            }
                        }],
                        ["Get", {
                            typeName: "SystemSettings"
                        }]
                    ], resolve, reject);
            });
        }).then((result) => {
            let currentUser = result[0][0] || result[0],
                systemSettings = result[1][0] || result[1],
                userMapProviderId = currentUser.defaultMapEngine,
                defaultMapProviderId = systemSettings.mapProvider,
                mapProviderId = this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            this.purgeSettings = systemSettings.purgeSettings;
            this.emailSenderFrom = systemSettings.emailSenderFrom;
            this.customerClassification = systemSettings.customerClassification;
            this.currentUser = currentUser;
            this.customMapProviders = entityToDictionary(systemSettings.customWebMapProviderList);
            this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            // removed by Brett to include single line addin structures
            this.addins = this.getAllowedAddins(systemSettings.customerPages);
            //this.addins = this.removeExportAddin(systemSettings.customerPages);
            // this.addins = systemSettings.customerPages;
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: this.getMapProviderType(mapProviderId)
                },
                currentUser: this.currentUser,
                isUnsignedAddinsAllowed: this.isUnsignedAddinsAllowed,
                addins: this.addins,
                purgeSettings: this.purgeSettings,
                emailSenderFrom: this.emailSenderFrom,
                customerClassification: this.customerClassification
            };
        });
        return this.currentTask;
    }

    getMapProviderType (mapProviderId: string): TMapProviderType {
        return this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    }

    getMapProviderName (mapProviderId: string): string {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    }

    getMapProviderData (mapProviderId: string) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    }

    isThisAddinIncluded () {
        return this.addins.some(this.isCurrentAddin);
    }

    getAddinsData (includeThisAddin = false) {
        return !includeThisAddin ? this.addins.filter(addin => !this.isCurrentAddin(addin)) : this.addins;
    }

    unload (): void {
        this.abortCurrentTask();
    }
}