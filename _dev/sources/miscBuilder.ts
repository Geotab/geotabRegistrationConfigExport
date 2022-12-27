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
    purgeSettings?: any;
    emailSenderFrom?: string;
    customerClassification?: string;
    isMarketplacePurchasesAllowed?: boolean;
    isResellerAutoLoginAllowed?: boolean;
    isThirdPartyMarketplaceAppsAllowed?: boolean;
}

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

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
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

    private getAllowedAddins (allAddins: string[]) {
        return allAddins.filter(addin => {
            //removes the current addin - registration config
            if(this.isCurrentAddin(addin))
            {
                return false;
            }
            let addinConfig: IAddin = JSON.parse(addin);
            if(addinConfig.items) {
                //Multi line addin structure check
                return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(this.isValidItem);
            }
            else {
                //Single line addin structure check
                return this.isValidItem(addinConfig);
            }
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
    fetch (includeSysSettings: boolean): Promise<IMiscData> {
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
        }).then((result: any) => {
            let currentUser = result[0][0] || result[0],
                systemSettings = result[1][0] || result[1],
                userMapProviderId = currentUser.defaultMapEngine,
                defaultMapProviderId = systemSettings.mapProvider,
                mapProviderId = this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            this.currentUser = currentUser;
            this.customMapProviders = entityToDictionary(systemSettings.customWebMapProviderList);
            this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            this.addins = this.getAllowedAddins(systemSettings.customerPages);
            let output: IMiscData = {
                mapProvider: {
                    value: mapProviderId,
                    type: this.getMapProviderType(mapProviderId)
                },
                currentUser: this.currentUser,
                isUnsignedAddinsAllowed: this.isUnsignedAddinsAllowed,
                addins: this.addins
            };
            if (includeSysSettings) {
                output.purgeSettings = systemSettings.purgeSettings;
                output.emailSenderFrom = systemSettings.emailSenderFrom;
                output.customerClassification = systemSettings.customerClassification;
                output.isMarketplacePurchasesAllowed = systemSettings.allowMarketplacePurchases;
                output.isResellerAutoLoginAllowed = systemSettings.allowResellerAutoLogin;
                output.isThirdPartyMarketplaceAppsAllowed = systemSettings.allowThirdPartyMarketplaceApps;
            }
            return output;
        });
        return this.currentTask;
    }

    getMapProviderType (mapProviderId: string): TMapProviderType {
        return !mapProviderId || this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    }

    getMapProviderName (mapProviderId: string): string {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    }

    getMapProviderData (mapProviderId: string) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    }

    getAddinsData (includeThisAddin = false) {
        return !includeThisAddin ? this.addins.filter(addin => !this.isCurrentAddin(addin)) : this.addins;
    }

    unload (): void {
        this.abortCurrentTask();
    }
}