import {entityToDictionary} from "./utils";

type TMapProviderType = "default" | "additional" | "custom";

export interface IMiscData {
    mapProvider: {
        value: string;
        type: TMapProviderType;
    };
    currentUser: any;
    isUnsignedAddinsAllowed: boolean;
    addins: string[];
}

export class MiscBuilder {
    private api;
    private customMapProviders;
    private currentTask;
    private currentUser;
    private isUnsignedAddinsAllowed;
    private addins;
    private defaultMapProviders = {
        GoogleMaps: "Google Maps",
        Here: "HERE Maps",
        MapBox: "MapBox"
    };

    constructor(api) {
        this.api = api;
    }

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    private getAllowedAddins (allAddins: string[]): string[] {
        return allAddins.filter(addin => {
            let addinConfig = JSON.parse(addin);
            return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(item => {
                let url = item.url;
                return url && url.indexOf("\/\/") > -1;
            });
        });
    };

    public fetch (): Promise<IMiscData> {
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
                            typeName: "SystemSettings",
                        }]
                    ], resolve, reject);
            });
        }).then((result) => {
            let currentUser = result[0][0] || result[0],
                systemSettings = result[1][0] || result[1],
                userMapProviderId = currentUser.defaultMapEngine,
                defaultMapProviderId = systemSettings.mapProvider,
                mapProviderId = this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            this.currentUser = currentUser;
            this.customMapProviders = entityToDictionary(systemSettings.customWebMapProviderList);
            this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            this.addins = this.getAllowedAddins(systemSettings.customerPages);
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: this.getMapProviderType(mapProviderId),
                },
                currentUser: this.currentUser,
                isUnsignedAddinsAllowed: this.isUnsignedAddinsAllowed,
                addins: this.addins
            };
        });
        return this.currentTask;
    };

    public getMapProviderType (mapProviderId: string): TMapProviderType {
        return this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    };

    public getMapProviderName (mapProviderId: string): string {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    };

    public getMapProviderData (mapProviderId: string): any {
        return mapProviderId && this.customMapProviders[mapProviderId];
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}