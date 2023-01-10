import { entityToDictionary } from "./utils";

type TMapProviderType = "default" | "additional" | "custom";

export interface IMiscData {
    mapProvider: {
        value: string;
        type: TMapProviderType;
    };
    currentUser: any;
    isUnsignedAddinsAllowed: boolean;
    purgeSettings?: any;
    emailSenderFrom?: string;
    customerClassification?: string;
    isMarketplacePurchasesAllowed?: boolean;
    isResellerAutoLoginAllowed?: boolean;
    isThirdPartyMarketplaceAppsAllowed?: boolean;
}


export class MiscBuilder {
    private readonly api;
    private customMapProviders;
    private currentTask;
    private currentUser;
    private isUnsignedAddinsAllowed;
    private readonly defaultMapProviders = {
        GoogleMaps: "Google Maps",
        Here: "HERE Maps",
        MapBox: "MapBox"
    };

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
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
            let output: IMiscData = {
                mapProvider: {
                    value: mapProviderId,
                    type: this.getMapProviderType(mapProviderId)
                },
                currentUser: this.currentUser,
                isUnsignedAddinsAllowed: this.isUnsignedAddinsAllowed
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

    unload (): void {
        this.abortCurrentTask();
    }
}