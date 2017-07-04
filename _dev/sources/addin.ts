import GroupsBuilder from "./groupsBuilder";
import SecurityClearancesBuilder from "./securityClearancesBuilder";
import ReportsBuilder from "./reportsBuilder";
import RulesBuilder from "./rulesBuilder";
import DistributionListsBuilder from "./distributionListsBuilder";
import {IMiscData, MiscBuilder} from "./miscBuilder";
import {downloadDataAsFile, mergeUnique, IEntity, mergeUniqueEntities, getUniqueEntities, getEntitiesIds, together, resolvedPromise} from "./utils";
import Waiting from "./waiting";

interface Geotab {
    addin: {
        registrationConfig: Function
    };
}

interface IImportData {
    groups: any[];
    reports: any[];
    rules: any[];
    distributionLists: any[];
    devices: any[];
    users: any[];
    zoneTypes: any[];
    zones: any[];
    workTimes: any[];
    workHolidays: any[];
    securityGroups: any[];
    diagnostics: any[];
    customMaps: any[];
    misc: IMiscData;
    notificationTemplates: any[];
}
interface IDependencies {
    groups?: string[];
    reports?: string[];
    rules?: string[];
    distributionLists?: string[];
    devices?: string[];
    users?: string[];
    zoneTypes?: string[];
    zones?: string[];
    workTimes?: string[];
    workHolidays?: string[];
    securityGroups?: string[];
    diagnostics?: string[];
    customMaps?: string[];
    notificationTemplates?: string[];
}

declare const geotab: Geotab;

class Addin {
    private api;
    private groupsBuilder: GroupsBuilder;
    private securityClearancesBuilder: SecurityClearancesBuilder;
    private reportsBuilder: ReportsBuilder;
    private rulesBuilder: RulesBuilder;
    private distributionListsBuilder: DistributionListsBuilder;
    private miscBuilder: MiscBuilder;
    private exportBtn: HTMLElement = document.getElementById("exportButton");
    private waiting: Waiting;
    private currentTask;
    private data: IImportData = {
        groups: [],
        reports: [],
        rules: [],
        distributionLists: [],
        devices: [],
        users: [],
        zoneTypes: [],
        zones: [],
        workTimes: [],
        workHolidays: [],
        securityGroups: [],
        customMaps: [],
        diagnostics: [],
        misc: null,
        notificationTemplates: []
    };

    constructor (api) {
        this.api = api;
        this.groupsBuilder = new GroupsBuilder(api);
        this.securityClearancesBuilder = new SecurityClearancesBuilder(api);
        this.reportsBuilder = new ReportsBuilder(api);
        this.rulesBuilder = new RulesBuilder(api);
        this.distributionListsBuilder = new DistributionListsBuilder(api);
        this.miscBuilder = new MiscBuilder(api);
        this.waiting = new Waiting();
    }

    exportData = () => {
        this.toggleWaiting(true);
        this.reportsBuilder.getData().then((reportsData) => {
            this.data.reports = reportsData;
            console.log(this.data);
            downloadDataAsFile(JSON.stringify(this.data), "export.json");
        }).catch((e) => {
            alert("Can't export data.\nPlease try again later.");
            console.error(e);
        }).finally(() => this.toggleWaiting());
    };

    private combineDependencies (...allDependencies: IDependencies[]): IDependencies {
        let total = {
            groups: [],
            reports: [],
            rules: [],
            devices: [],
            users: [],
            zoneTypes: [],
            zones: [],
            workTimes: [],
            workHolidays: [],
            securityGroups: [],
            diagnostics: [],
            customMaps: [],
            notificationTemplates: []
        };
        return Object.keys(total).reduce((dependencies, dependencyName: string) => {
            dependencies[dependencyName] = mergeUnique(dependencies[dependencyName], ...allDependencies.map((entityDependencies) => entityDependencies[dependencyName]));
            return dependencies;
        }, total);
    };

    private addNewGroups (groups: string[], data: IImportData): Promise<any> {
        if (!groups || !groups.length) {
            return resolvedPromise();
        }
        let groupsData = this.groupsBuilder.getGroupsData(groups, true),
            newGroupsUsers = getUniqueEntities(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = mergeUniqueEntities(data.groups, groupsData);
        data.users = mergeUniqueEntities(data.users, newGroupsUsers);
        return this.resolveDependencies({users: getEntitiesIds(newGroupsUsers)}, data);
    };

    private addNewCustomMaps (customMapsIds: string[], data: IImportData) {
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        let customMapsData = customMapsIds.reduce((data, customMapId: string) => {
            let customMapData = this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = mergeUniqueEntities(data.customMaps, customMapsData);
    };

    private addNewNotificationTemplates (notificationTemplatesIds: string[], data: IImportData) {
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        let notificationTemplatesData = notificationTemplatesIds.reduce((data, templateId: string) => {
            let templateData = this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = mergeUniqueEntities(data.notificationTemplates, notificationTemplatesData);
    };

    private getEntytiesIds (entities: IEntity[]): string[] {
        return entities.reduce((res, entity) => {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    };

    private getEntityDependencies (entity: IEntity, entityType) {
        let entityDependencies: IDependencies = {};
        switch (entityType) {
            case "devices":
                entityDependencies.groups = this.getEntytiesIds(entity["groups"].concat(entity["autoGroups"]));
                entity["workTime"].id && (entityDependencies.workTimes = [entity["workTime"].id]);
                break;
            case "users":
                entityDependencies.groups = this.getEntytiesIds(entity["companyGroups"].concat(entity["driverGroups"]).concat(entity["privateUserGroups"]).concat(entity["reportGroups"]));
                entityDependencies.securityGroups = this.getEntytiesIds(entity["securityGroups"]);
                entityDependencies.customMaps = [entity["defaultMapEngine"]];
                break;
            case "zones":
                let zoneTypes = this.getEntytiesIds(entity["zoneTypes"]);
                zoneTypes.length && (entityDependencies.zoneTypes = zoneTypes);
                entityDependencies.groups = this.getEntytiesIds(entity["groups"]);
                break;
            case "workTimes":
                entity["holidayGroup"].groupId && (entityDependencies.workHolidays = [entity["holidayGroup"].groupId]);
                break;
        }
        return entityDependencies;
    };

    private applyToEntities (entitiesList: IDependencies, initialValue, func: (result, entity, entityType: string, entityIndex: number, entityTypeIndex: number, overallIndex: number) => any) {
        let overallIndex = 0;
        return Object.keys(entitiesList).reduce((result, entityType, typeIndex) => {
            return entitiesList[entityType].reduce((result, entity, index) => {
                overallIndex++;
                return func(result, entity, entityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    };

    private resolveDependencies (dependencies: IDependencies, data: IImportData) {
        let getData = (entitiesList: IDependencies): Promise<{}> => {
                let entityRequestTypes = {
                        devices: "Device",
                        users: "User",
                        zoneTypes: "ZoneType",
                        zones: "Zone",
                        workTimes: "WorkTime",
                        workHolidays: "WorkHoliday",
                        securityGroups: "Group",
                        diagnostics: "Diagnostic",
                    },
                    requests: any = this.applyToEntities(entitiesList, {}, (result, entityId, entityType) => {
                        let request = {
                            typeName: entityRequestTypes[entityType],
                            search: {
                                id: entityId
                            }
                        };
                        if (entityRequestTypes[entityType]) {
                            if (entityType === "workHolidays" || entityType === "securityGroups") {
                                return result;
                            }
                            !result[entityType] && (result[entityType] = []);
                            result[entityType].push(["Get", request]);
                        }
                        return result;
                    });

                if (entitiesList.securityGroups && entitiesList.securityGroups.length) {
                    requests.securityGroups = [["Get", {
                        typeName: entityRequestTypes.securityGroups,
                        search: {
                            id: "GroupSecurityId"
                        }
                    }]];
                }
                if (entitiesList.workHolidays && entitiesList.workHolidays.length) {
                    requests.workHolidays = [["Get", {
                        typeName: entityRequestTypes.workHolidays
                    }]];
                }

                return this.addNewGroups(entitiesList.groups, data).then(() => {
                    this.addNewCustomMaps(entitiesList.customMaps, data);
                    this.addNewNotificationTemplates(entitiesList.notificationTemplates, data);
                    delete entitiesList.groups;
                    delete entitiesList.customMaps;
                    return new Promise((resolve, reject) => {
                        let requestEntities = Object.keys(requests),
                            requestsArray = requestEntities.reduce((list, type) => list.concat(requests[type]), []);
                        if (!requestEntities.length) {
                            return resolve(data);
                        }
                        this.api.multiCall(requestsArray, (response) => {
                                let newGroups = [],
                                    newCustomMaps = [],
                                    newDependencies: IDependencies = {},
                                    exportedData: any = this.applyToEntities(requests, {}, (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) => {
                                        let items = requestsArray.length > 1 ? response[overallIndex] : response;
                                        items.forEach((item) => {
                                            item = item[0] || item;
                                            !result[entityType] && (result[entityType] = []);
                                            if (entityType === "workHolidays" && (!item.holidayGroup || entitiesList.workHolidays.indexOf(item.holidayGroup.groupId) === -1)) {
                                                return false;
                                            } else if (entityType === "securityGroups") {
                                                if (entitiesList.securityGroups.indexOf(item.id) > -1) {
                                                    result[entityType] = result[entityType].concat(this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups, items));
                                                    return result;
                                                }
                                                return false;
                                            } else if (entityType === "users") {
                                                item.userAuthenticationType = "BasicAuthentication";
                                            }
                                            let entityDependencies = this.getEntityDependencies(item, entityType);
                                            newDependencies = this.applyToEntities(entityDependencies, newDependencies, (result, entityId, entityType) => {
                                                !result[entityType] && (result[entityType] = []);
                                                result[entityType] = mergeUnique(result[entityType], [entityId]);
                                                return result;
                                            });
                                            newGroups = newGroups.concat(newDependencies.groups || []);
                                            newCustomMaps = newCustomMaps.concat(newDependencies.customMaps || []);
                                            delete newDependencies.groups;
                                            delete newDependencies.customMaps;
                                            result[entityType].push(item);
                                        });
                                        return result;
                                    });
                                newDependencies = Object.keys(newDependencies).reduce((result, dependencyName) => {
                                    let entities = newDependencies[dependencyName],
                                        exported = (exportedData[dependencyName] || []).map(entity => entity.id);
                                    entities.forEach(entityId => {
                                        if (exported.indexOf(entityId) === -1) {
                                            !result[dependencyName] && (result[dependencyName] = []);
                                            result[dependencyName].push(entityId);
                                        }
                                    });
                                    return result;
                                }, {});
                                // Remove built-in security groups
                                exportedData.securityGroups && (exportedData.securityGroups = exportedData.securityGroups.reduce((result, group) => {
                                    group.id.indexOf("Group") === -1 && result.push(group);
                                    return result;
                                }, []));
                                this.addNewGroups(newGroups, data).then(() => {
                                    this.addNewCustomMaps(newCustomMaps, data);
                                    Object.keys(exportedData).forEach((entityType: string) => {
                                        data[entityType] = mergeUniqueEntities(data[entityType], exportedData[entityType]);
                                    });
                                    if (Object.keys(newDependencies).length) {
                                        resolve(this.resolveDependencies(newDependencies, data));
                                    } else {
                                        resolve(data);
                                    }
                                });
                            }, reject);
                    });
                });
            };
        return new Promise((resolve, reject) => {
            return getData(dependencies).then(resolve).catch(reject);
        });
    };

    private abortCurrentTask (): void {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    private toggleExportButton (isDisabled: boolean): void {
        (<HTMLInputElement>this.exportBtn).disabled = isDisabled;
    };

    private toggleWaiting = (isStart: boolean = false): void => {
        if (isStart === false) {
            this.toggleExportButton(false);
            this.waiting.stop();
        } else {
            this.toggleExportButton(true);
            this.waiting.start(document.getElementById("addinContainer").parentElement, 9999);
        }
    };

    public render (): void {
        let hasItemsMessageTemplate: string = document.getElementById("hasItemsMessageTemplate").innerHTML,
            mapMessageTemplate: string = document.getElementById("mapMessageTemplate").innerHTML,
            groupsBlock: HTMLElement = document.getElementById("exportedGroups"),
            securityClearancesBlock: HTMLElement = document.getElementById("exportedSecurityClearances"),
            rulesBlock: HTMLElement = document.getElementById("exportedRules"),
            reportsBlock: HTMLElement = document.getElementById("exportedReports"),
            dashboardsBlock: HTMLElement = document.getElementById("exportedDashboards"),
            addinsBlock: HTMLElement = document.getElementById("exportedAddins"),
            mapBlockDescription: HTMLElement = <HTMLElement>document.querySelector("#exportedMap > .description"),
            showEntityMessage = (block: HTMLElement, qty: number, entityName: string): void => {
                if (qty) {
                    qty > 1 && (entityName += "s");
                    block.querySelector(".description").innerHTML = hasItemsMessageTemplate.replace("{quantity}", <any>qty).replace("{entity}", entityName);
                }
            };
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.toggleWaiting(true);
        together([
            this.groupsBuilder.fetch(),
            this.securityClearancesBuilder.fetch(),
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            this.miscBuilder.fetch()
        ]).then((results) => {
            let reportsDependencies: IDependencies,
                rulesDependencies: IDependencies,
                distributionListsDependencies: IDependencies,
                dependencies: IDependencies,
                customMap;
            this.data.groups = [];
            this.data.securityGroups = results[1];
            this.data.reports = results[2];
            this.data.rules = results[3];
            this.data.distributionLists = this.distributionListsBuilder.getRulesDistributionLists(this.data.rules.map(rule => rule.id));
            this.data.misc = results[5];
            customMap = this.miscBuilder.getMapProviderData(this.data.misc.mapProvider.value);
            customMap && this.data.customMaps.push(customMap);
            reportsDependencies = this.reportsBuilder.getDependencies(this.data.reports);
            rulesDependencies = this.rulesBuilder.getDependencies(this.data.rules);
            distributionListsDependencies = this.distributionListsBuilder.getDependencies(this.data.distributionLists);
            dependencies = this.combineDependencies(reportsDependencies, rulesDependencies, distributionListsDependencies);
            return this.resolveDependencies(dependencies, this.data);
        }).then(() => {
            let mapProvider = this.miscBuilder.getMapProviderName(this.data.misc.mapProvider.value);
            showEntityMessage(groupsBlock, this.data.groups.length - 1, "group");
            showEntityMessage(securityClearancesBlock, this.data.securityGroups.length, "security clearance");
            showEntityMessage(rulesBlock, this.data.rules.length, "rule");
            showEntityMessage(reportsBlock, this.reportsBuilder.getCustomizedReportsQty(), "report");
            showEntityMessage(dashboardsBlock, this.reportsBuilder.getDashboardsQty(), "dashboard");
            mapProvider && (mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider));
            showEntityMessage(addinsBlock, this.data.misc.addins.length, "addin");
            console.log(this.data);
        }).catch((e) => {
            console.error(e);
            alert("Can't get config to export");
        }).finally(() => this.toggleWaiting());
    };

    public unload () {
        this.abortCurrentTask();
        this.groupsBuilder.unload();
        this.securityClearancesBuilder.unload();
        this.reportsBuilder.unload();
        this.rulesBuilder.unload();
        this.distributionListsBuilder.unload();
        this.miscBuilder.unload();
        this.exportBtn.removeEventListener("click", this.exportData, false);
    };
}

geotab.addin.registrationConfig = function () {
    let addin: Addin;

    return {
        initialize: (api, state, callback) => {
            addin = new Addin(api);
            callback();
        },
        focus: () => {
            addin.render();
        },
        blur: () => {
            addin.unload();
        }
    };
};