/// <reference path="./addin.d.ts" />
/// <reference path="../bluebird.d.ts"/>

import GroupsBuilder from "./groupsBuilder";
import SecurityClearancesBuilder from "./securityClearancesBuilder";
import ReportsBuilder from "./reportsBuilder";
import RulesBuilder from "./rulesBuilder";
import DistributionListsBuilder from "./distributionListsBuilder";
import {IMiscData, MiscBuilder} from "./miscBuilder";
import {downloadDataAsFile, mergeUnique, IEntity, mergeUniqueEntities, getUniqueEntities, getEntitiesIds, together, resolvedPromise, getGroupFilterGroups, multiCall} from "./utils";
import Waiting from "./waiting";
// import {UserBuilder} from "./userBuilder";
import {ZoneBuilder} from "./zoneBuilder";
import {AddInBuilder} from "./addInBuilder";

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
    misc: IMiscData | null;
    addins: any[];
    notificationTemplates: any[];
    certificates: any[];
    groupFilters?: any[];
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
    certificates?: string[];
    groupFilters?: string[];
}

type TEntityType = keyof IImportData;

declare const geotab: Geotab;

class Addin {
    private readonly api;
    private readonly groupsBuilder: GroupsBuilder;
    private readonly securityClearancesBuilder: SecurityClearancesBuilder;
    private readonly reportsBuilder: ReportsBuilder;
    private readonly rulesBuilder: RulesBuilder;
    private readonly distributionListsBuilder: DistributionListsBuilder;
    private readonly miscBuilder: MiscBuilder;
    private readonly addInBuilder: AddInBuilder;
    // private readonly userBuilder: UserBuilder;
    private readonly zoneBuilder: ZoneBuilder;
    private readonly exportBtn = document.getElementById("exportButton") as HTMLButtonElement;
    private readonly saveBtn = document.getElementById("saveButton") as HTMLButtonElement;
    private readonly exportAllAddinsCheckbox: HTMLInputElement = document.getElementById("export_all_addins_checkbox") as HTMLInputElement;
    private readonly exportAllZonesCheckbox: HTMLInputElement = document.getElementById("export_all_zones_checkbox") as HTMLInputElement;
    private readonly exportSystemSettingsCheckbox: HTMLInputElement = document.getElementById("export_system_settings_checkbox") as HTMLInputElement;
    private readonly waiting: Waiting;
    private currentTask;
    private readonly data: IImportData = {
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
        addins: [],
        notificationTemplates: [],
        certificates: [],
        groupFilters: []
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
            notificationTemplates: [],
            groupFilters: []
        };
        return Object.keys(total).reduce((dependencies, dependencyName: string) => {
            dependencies[dependencyName] = mergeUnique(dependencies[dependencyName], ...allDependencies.map((entityDependencies) => entityDependencies[dependencyName]));
            return dependencies;
        }, total);
    }

    private addNewGroups (groups: string[], data: IImportData): Promise<any> {
        if (!groups.length) {
            return resolvedPromise();
        }
        let groupsData = this.groupsBuilder.getGroupsData(groups, true),
            newGroupsUsers = getUniqueEntities(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = mergeUniqueEntities(data.groups, groupsData);
        data.users = mergeUniqueEntities(data.users, newGroupsUsers);
        return this.resolveDependencies({users: getEntitiesIds(newGroupsUsers)}, data);
    }

    private addNewCustomMaps (customMapsIds: string[], data: IImportData) {
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        let customMapsData = customMapsIds.reduce((data: any[], customMapId: string) => {
            let customMapData = this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = mergeUniqueEntities(data.customMaps, customMapsData);
    }

    private addNewNotificationTemplates (notificationTemplatesIds: string[], data: IImportData) {
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        let notificationTemplatesData = notificationTemplatesIds.reduce((data: any[], templateId: string) => {
            let templateData = this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = mergeUniqueEntities(data.notificationTemplates, notificationTemplatesData);
    }

    private getEntytiesIds (entities: IEntity[]): string[] {
        return entities.reduce((res: string[], entity) => {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    }

    private getEntityDependencies (entity: IEntity, entityType: TEntityType) {
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
                if (entity.issuerCertificate) {
                    entityDependencies.certificates = [ entity.issuerCertificate.id ]
                }
                entityDependencies.groupFilters = this.getEntytiesIds([entity["accessGroupFilter"]]);
                break;
            case "zones":
                let zoneTypes = this.getEntytiesIds(entity["zoneTypes"]);
                zoneTypes.length && (entityDependencies.zoneTypes = zoneTypes);
                entityDependencies.groups = this.getEntytiesIds(entity["groups"]);
                break;
            case "workTimes":
                entity["holidayGroup"].groupId && (entityDependencies.workHolidays = [entity["holidayGroup"].groupId]);
                break;
            case "groupFilters":
                entityDependencies.groups = [...getGroupFilterGroups((entity as IGroupFilter).groupFilterCondition).values()];
                break;
            default:
                break;
        }
        return entityDependencies;
    }

    private applyToEntities <T>(entitiesList: IDependencies, initialValue, func: (result, entity, entityType: TEntityType, entityIndex: number, entityTypeIndex: number, overallIndex: number) => T) {
        let overallIndex = 0;
        return Object.keys(entitiesList).reduce((result: T, entityType: string, typeIndex: number) => {
            return entitiesList[entityType].reduce((res: T, entity, index) => {
                overallIndex++;
                return func(res, entity, entityType as TEntityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    }

    private resolveDependencies (dependencies: IDependencies, data: IImportData) {
        let getData = (entitiesList: IDependencies): Promise<IImportData> => {
                let entityRequestTypes = {
                        devices: "Device",
                        users: "User",
                        zoneTypes: "ZoneType",
                        zones: "Zone",
                        workTimes: "WorkTime",
                        workHolidays: "WorkHoliday",
                        securityGroups: "Group",
                        diagnostics: "Diagnostic",
                        certificates: "Certificate",
                        groupFilters: "GroupFilter"
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

                return this.addNewGroups(entitiesList.groups || [], data).then(() => {
                    this.addNewCustomMaps(entitiesList.customMaps || [], data);
                    this.addNewNotificationTemplates(entitiesList.notificationTemplates || [], data);
                    delete entitiesList.groups;
                    delete entitiesList.customMaps;
                    return new Promise<IImportData>((resolve, reject) => {
                        let requestEntities = Object.keys(requests),
                            requestsArray = requestEntities.reduce((list, type) => list.concat(requests[type]), []);
                        if (!requestEntities.length) {
                            return resolve(data);
                        }
                        multiCall(this.api, requestsArray)
                            .then((response) => {
                                let newGroups: string[] = [],
                                    newCustomMaps: string[] = [],
                                    newDependencies: IDependencies = {},
                                    exportedData: any = this.applyToEntities(requests, {}, (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) => {
                                        let items = requestsArray.length > 1 ? response[overallIndex] : response;
                                        items.forEach((item) => {
                                            item = item[0] || item;
                                            !result[entityType] && (result[entityType] = []);
                                            if (entityType === "workHolidays" && (!item.holidayGroup || (entitiesList.workHolidays || []).indexOf(item.holidayGroup.groupId) === -1)) {
                                                return false;
                                            }
                                            if (entityType === "workTimes" && !item.details) {
                                                return false;
                                            }
                                            if (entityType === "securityGroups") {
                                                if ((entitiesList.securityGroups || []).indexOf(item.id) > -1) {
                                                    result[entityType] = result[entityType].concat(this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups || [], items));
                                                    return result;
                                                }
                                                return false;
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
                                }, {} as IImportData);
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
                                }, reject);
                            }, reject);
                    });
                });
            };
        return new Promise<IImportData>((resolve, reject) => {
            return getData(dependencies).then(resolve).catch(reject);
        });
    }

    private abortCurrentTask () {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    private toggleExportButton (isDisabled: boolean) {
        this.exportBtn.disabled = isDisabled;
    }

    private readonly toggleWaiting = (isStart = false) => {
        if (isStart) {
            this.toggleExportButton(true);
            this.waiting.start((document.getElementById("addinContainer") as HTMLElement).parentElement as HTMLElement, 9999);
        } else {
            this.toggleExportButton(false);
            this.waiting.stop();
        }
    }

    //Brett - displays the output on the page
    private showEntityMessage (block: HTMLElement, qty: number, entityName: string) {
        let blockEl = block.querySelector(".description") as HTMLElement;
        if (qty) {
            qty > 1 && (entityName += "s");
            let hasItemsMessageTemplate = (document.getElementById("hasItemsMessageTemplate") as HTMLElement).innerHTML;
            blockEl.innerHTML = hasItemsMessageTemplate.replace("{quantity}", qty.toString()).replace("{entity}", entityName);
        } else {
            blockEl.innerHTML = `You have <span class="bold">not configured any ${ entityName }s</span>.`;
        }
    }

    private showSystemSettingsMessage (block: HTMLElement, isIncluded: boolean) {
        let blockEl = block.querySelector(".description") as HTMLElement;
        if (isIncluded) {
            blockEl.innerHTML = "You have chosen <span class='bold'>to include</span> system settings.";
        } else {
            blockEl.innerHTML = "You have chosen <span class='bold'>not to include</span> system settings.";
        }
    }

    //initialize addin
    constructor (api) {
        this.api = api;
        this.groupsBuilder = new GroupsBuilder(api);
        this.securityClearancesBuilder = new SecurityClearancesBuilder(api);
        this.reportsBuilder = new ReportsBuilder(api);
        this.rulesBuilder = new RulesBuilder(api);
        this.distributionListsBuilder = new DistributionListsBuilder(api);
        this.miscBuilder = new MiscBuilder(api);
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.userBuilder = new UserBuilder(api);
        this.zoneBuilder = new ZoneBuilder(api);
        this.addInBuilder = new AddInBuilder(api);
        this.waiting = new Waiting();
    }

    //Brett: exports the data
    exportData = () => {
        this.toggleWaiting(true);
        return this.reportsBuilder.getData().then((reportsData) => {
            this.data.reports = reportsData;
            console.log(this.data);
            downloadDataAsFile(JSON.stringify(this.data), "export.json");
        }).catch((e) => {
            alert("Can't export data.\nPlease try again later.");
            console.error(e);
        }).finally(() => this.toggleWaiting());
    }

    saveChanges = () => {
        this.render();
    }

    checkBoxValueChanged = () => {
        this.toggleExportButton(true);
    }

    addEventHandlers() {
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
    }

    render () {
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.data.users = [];
        this.data.zones = [];
        this.data.addins = [];
        //wire up the dom
        let mapMessageTemplate: string = (document.getElementById("mapMessageTemplate") as HTMLElement).innerHTML,
            groupsBlock: HTMLElement = document.getElementById("exportedGroups") as HTMLElement,
            securityClearancesBlock: HTMLElement = document.getElementById("exportedSecurityClearances") as HTMLElement,
            rulesBlock: HTMLElement = document.getElementById("exportedRules") as HTMLElement,
            reportsBlock: HTMLElement = document.getElementById("exportedReports") as HTMLElement,
            dashboardsBlock: HTMLElement = document.getElementById("exportedDashboards") as HTMLElement,
            addinsBlock: HTMLElement = document.getElementById("exportedAddins") as HTMLElement,
            mapBlockDescription: HTMLElement = document.querySelector("#exportedMap .description") as HTMLElement,
            // usersBlock: HTMLElement = document.getElementById("exportedUsers"),
            zonesBlock: HTMLElement = document.getElementById("exportedZones") as HTMLElement,
            systemSettingsBlock: HTMLElement = document.getElementById("exportSystemSettings") as HTMLElement;
        this.toggleWaiting(true);
        const zonesQtyPromise = this.exportAllZonesCheckbox.checked==true ? this.zoneBuilder.getQty() : Promise.resolve(0);
        return zonesQtyPromise.then((zonesQty) => {
            const maxZonesQty = 5000;
            if (zonesQty > maxZonesQty) {
                alert(`The number of zones in the database exceeds ${maxZonesQty}. Exporting all zones may take a long time and could potentially time out. We turned off the 'Export All Zones' option to prevent this.`);
                this.exportAllZonesCheckbox.checked = false;
                this.exportAllZonesCheckbox.disabled = true;
            }
            // const start = performance.mark("start");
            return Promise.all([
                this.groupsBuilder.fetch(),
                this.securityClearancesBuilder.fetch(),
                this.reportsBuilder.fetch(),
                this.rulesBuilder.fetch(),
                this.distributionListsBuilder.fetch(),
                this.miscBuilder.fetch(this.exportSystemSettingsCheckbox.checked),
                //TODO: Brett - left here as I will be introducing the user fetch soon
                // this.userBuilder.fetch(),
                this.zoneBuilder.fetch(),
                this.addInBuilder.fetch()
            ])
        }).then((results) => {
            let reportsDependencies: IDependencies,
                rulesDependencies: IDependencies,
                distributionListsDependencies: IDependencies,
                dependencies: IDependencies,
                customMap;
            this.data.groups = results[0];
            this.data.securityGroups = results[1];
            this.data.reports = results[2];
            this.data.rules = results[3];
            this.data.distributionLists = this.distributionListsBuilder.getRulesDistributionLists(this.data.rules.map(rule => rule.id));
            this.data.misc = results[5];
            let getDependencies = (entities: any[], entityType: TEntityType) => {
                return entities.reduce((res, entity) => {
                    let entityDep = this.getEntityDependencies(entity, entityType);
                    return this.combineDependencies(res, entityDep);
                }, {});
            };
            let zoneDependencies = {};
            if(this.exportAllZonesCheckbox.checked==true){
                if(results[6]){
                    //sets exported zones to all database zones
                    this.data.zones = results[6];
                    zoneDependencies = getDependencies(results[6], "zones");
                }
            }
            if(this.exportAllAddinsCheckbox.checked==true){
                if(results[7]){
                    //sets exported addins equal to none/empty array
                    this.data.addins = results[7];
                    if(this.data.misc){
                        this.data.misc.addins = this.data.addins;
                    }
                }
            }
            customMap = this.data.misc && this.miscBuilder.getMapProviderData(this.data.misc.mapProvider.value);
            customMap && this.data.customMaps.push(customMap);
            reportsDependencies = this.reportsBuilder.getDependencies(this.data.reports);
            rulesDependencies = this.rulesBuilder.getDependencies(this.data.rules);
            distributionListsDependencies = this.distributionListsBuilder.getDependencies(this.data.distributionLists);
            dependencies = this.combineDependencies(zoneDependencies, reportsDependencies, rulesDependencies, distributionListsDependencies);
            return this.resolveDependencies(dependencies, this.data);
        }).then(() => {
            // performance.mark("end");
            // performance.measure("resolveDependencies", "start", "end");
            // console.log(performance.getEntriesByName("resolveDependencies"));
            let mapProvider = this.data.misc && this.miscBuilder.getMapProviderName(this.data.misc.mapProvider.value);
            this.showEntityMessage(groupsBlock, this.data.groups.length - 1, "group");
            this.showEntityMessage(securityClearancesBlock, this.data.securityGroups.length, "security clearance");
            this.showEntityMessage(rulesBlock, this.data.rules.length, "rule");
            this.showEntityMessage(reportsBlock, this.reportsBuilder.getCustomizedReportsQty(), "report");
            this.showEntityMessage(dashboardsBlock, this.reportsBuilder.getDashboardsQty(), "dashboard");
            if (mapProvider) {
                mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider);
            }
            this.showEntityMessage(addinsBlock, this.data.addins?.length || 0, "addin");
            // this.showEntityMessage(usersBlock, this.data.users.length, "user");
            this.showEntityMessage(zonesBlock, this.data.zones.length, "zone");
            this.showSystemSettingsMessage(systemSettingsBlock, this.exportSystemSettingsCheckbox.checked);
            //this displays all the data/objects in the console
            console.log(this.data);
        }).catch((e) => {
            console.error(e);
            alert("Can't get config to export");
        }).finally(() => this.toggleWaiting());
    }

    unload () {
        this.abortCurrentTask();
        this.groupsBuilder.unload();
        this.securityClearancesBuilder.unload();
        this.reportsBuilder.unload();
        this.rulesBuilder.unload();
        this.distributionListsBuilder.unload();
        this.miscBuilder.unload();
        this.addInBuilder.unload();
        this.exportBtn.removeEventListener("click", this.exportData, false);
        this.saveBtn.removeEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
    }
}

geotab.addin.registrationConfig = function () {
    let addin: Addin;

    return {
        initialize: (api, state, callback) => {
            addin = new Addin(api);
            callback();
        },
        focus: () => {
            addin.addEventHandlers();
        },
        blur: () => {
            addin.unload();
        }
    };
};