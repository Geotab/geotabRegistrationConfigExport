(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddInBuilder = void 0;
class AddInBuilder {
    constructor(api) {
        this.isMenuItem = (item) => {
            return !item.url && !!item.path && !!item.menuId;
        };
        //Tests a URL for double slash. Accepts a url as a string as a argument.
        //Returns true if the url contains a double slash //
        //Returns false if the url does not contain a double slash.
        this.isValidUrl = (url) => !!url && url.indexOf("\/\/") > -1;
        this.isValidButton = (item) => !!item.buttonName && !!item.page && !!item.click && this.isValidUrl(item.click);
        this.isEmbeddedItem = (item) => !!item.files;
        this.isValidMapAddin = (item) => {
            const scripts = item.mapScript;
            const isValidSrc = !scripts?.src || this.isValidUrl(scripts.src);
            const isValidStyle = !scripts?.style || this.isValidUrl(scripts.style);
            const isValidHtml = !scripts?.url || this.isValidUrl(scripts.url);
            const hasScripts = !!scripts && (!!scripts?.src || !scripts?.style || !scripts?.url);
            return hasScripts && isValidSrc && isValidStyle && isValidHtml;
        };
        this.isValidItem = (item) => {
            return this.isEmbeddedItem(item) || this.isMenuItem(item) || this.isValidButton(item) || this.isValidMapAddin(item) || (!!item.url && this.isValidUrl(item.url));
        };
        this.api = api;
    }
    isCurrentAddin(addin) {
        return ((addin.indexOf("Registration config") > -1) ||
            (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    }
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    //fills the addin builder with all addins
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getAddIns();
        return this.currentTask;
    }
    getAllowedAddins(allAddins) {
        return allAddins.filter(addin => {
            //removes the current addin - registration config
            if (this.isCurrentAddin(addin)) {
                return false;
            }
            let addinConfig = JSON.parse(addin);
            if (addinConfig.items) {
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
    getAddIns() {
        this.currentTask = this.getVersion()
            .then((version) => {
            if (version.split(".", 1) < 8) {
                return this.getFromSystemSettings();
            }
            else {
                return this.getFromAddInApi();
            }
        });
        return this.currentTask;
    }
    getVersion() {
        return new Promise((resolve, reject) => {
            this.api.call("GetVersion", {}, resolve, reject);
        });
    }
    getFromAddInApi() {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "AddIn"
            }, resolve, reject);
        }).then((result) => {
            let addIns = [];
            if (Array.isArray(result)) {
                result.forEach(addIn => {
                    // New Api returns configuration for All Addins
                    // If it has Url then we don't need the configuration part for export
                    if (addIn.url && addIn.url != "") {
                        if (addIn.configuration) {
                            delete addIn.configuration;
                            delete addIn.id;
                        }
                    }
                    // if there is no url but we have configuration
                    // We will keep what's inside the configuration
                    else if (addIn.configuration) {
                        addIn = addIn.configuration;
                    }
                    addIns.push(JSON.stringify(addIn));
                });
            }
            return this.getAllowedAddins(addIns);
        });
    }
    getFromSystemSettings() {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "SystemSettings"
            }, resolve, reject);
        }).then((result) => {
            return this.getAllowedAddins(result[0].customerPages);
        });
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.AddInBuilder = AddInBuilder;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="./addin.d.ts" />
/// <reference path="../bluebird.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const groupsBuilder_1 = require("./groupsBuilder");
const securityClearancesBuilder_1 = require("./securityClearancesBuilder");
const reportsBuilder_1 = require("./reportsBuilder");
const rulesBuilder_1 = require("./rulesBuilder");
const distributionListsBuilder_1 = require("./distributionListsBuilder");
const miscBuilder_1 = require("./miscBuilder");
const utils_1 = require("./utils");
const waiting_1 = require("./waiting");
// import {UserBuilder} from "./userBuilder";
const zoneBuilder_1 = require("./zoneBuilder");
const addInBuilder_1 = require("./addInBuilder");
class Addin {
    combineDependencies(...allDependencies) {
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
        return Object.keys(total).reduce((dependencies, dependencyName) => {
            dependencies[dependencyName] = (0, utils_1.mergeUnique)(dependencies[dependencyName], ...allDependencies.map((entityDependencies) => entityDependencies[dependencyName]));
            return dependencies;
        }, total);
    }
    addNewGroups(groups, data) {
        if (!groups.length) {
            return (0, utils_1.resolvedPromise)();
        }
        let groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = (0, utils_1.getUniqueEntities)(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = (0, utils_1.mergeUniqueEntities)(data.groups, groupsData);
        data.users = (0, utils_1.mergeUniqueEntities)(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: (0, utils_1.getEntitiesIds)(newGroupsUsers) }, data);
    }
    addNewCustomMaps(customMapsIds, data) {
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        let customMapsData = customMapsIds.reduce((data, customMapId) => {
            let customMapData = this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = (0, utils_1.mergeUniqueEntities)(data.customMaps, customMapsData);
    }
    addNewNotificationTemplates(notificationTemplatesIds, data) {
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        let notificationTemplatesData = notificationTemplatesIds.reduce((data, templateId) => {
            let templateData = this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = (0, utils_1.mergeUniqueEntities)(data.notificationTemplates, notificationTemplatesData);
    }
    getEntytiesIds(entities) {
        return entities.reduce((res, entity) => {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    }
    getEntityDependencies(entity, entityType) {
        let entityDependencies = {};
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
                    entityDependencies.certificates = [entity.issuerCertificate.id];
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
                entityDependencies.groups = [...(0, utils_1.getGroupFilterGroups)(entity.groupFilterCondition).values()];
                break;
            default:
                break;
        }
        return entityDependencies;
    }
    applyToEntities(entitiesList, initialValue, func) {
        let overallIndex = 0;
        return Object.keys(entitiesList).reduce((result, entityType, typeIndex) => {
            return entitiesList[entityType].reduce((res, entity, index) => {
                overallIndex++;
                return func(res, entity, entityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    }
    resolveDependencies(dependencies, data) {
        let getData = (entitiesList) => {
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
            }, requests = this.applyToEntities(entitiesList, {}, (result, entityId, entityType) => {
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
                return new Promise((resolve, reject) => {
                    let requestEntities = Object.keys(requests), requestsArray = requestEntities.reduce((list, type) => list.concat(requests[type]), []);
                    if (!requestEntities.length) {
                        return resolve(data);
                    }
                    (0, utils_1.multiCall)(this.api, requestsArray)
                        .then((response) => {
                        let newGroups = [], newCustomMaps = [], newDependencies = {}, exportedData = this.applyToEntities(requests, {}, (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) => {
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
                                    result[entityType] = (0, utils_1.mergeUnique)(result[entityType], [entityId]);
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
                            let entities = newDependencies[dependencyName], exported = (exportedData[dependencyName] || []).map(entity => entity.id);
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
                            Object.keys(exportedData).forEach((entityType) => {
                                data[entityType] = (0, utils_1.mergeUniqueEntities)(data[entityType], exportedData[entityType]);
                            });
                            if (Object.keys(newDependencies).length) {
                                resolve(this.resolveDependencies(newDependencies, data));
                            }
                            else {
                                resolve(data);
                            }
                        }, reject);
                    }, reject);
                });
            });
        };
        return new Promise((resolve, reject) => {
            return getData(dependencies).then(resolve).catch(reject);
        });
    }
    abortCurrentTask() {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    toggleExportButton(isDisabled) {
        this.exportBtn.disabled = isDisabled;
    }
    //Brett - displays the output on the page
    showEntityMessage(block, qty, entityName) {
        let blockEl = block.querySelector(".description");
        if (qty) {
            qty > 1 && (entityName += "s");
            let hasItemsMessageTemplate = document.getElementById("hasItemsMessageTemplate").innerHTML;
            blockEl.innerHTML = hasItemsMessageTemplate.replace("{quantity}", qty.toString()).replace("{entity}", entityName);
        }
        else {
            blockEl.innerHTML = `You have <span class="bold">not configured any ${entityName}s</span>.`;
        }
    }
    showSystemSettingsMessage(block, isIncluded) {
        let blockEl = block.querySelector(".description");
        if (isIncluded) {
            blockEl.innerHTML = "You have chosen <span class='bold'>to include</span> system settings.";
        }
        else {
            blockEl.innerHTML = "You have chosen <span class='bold'>not to include</span> system settings.";
        }
    }
    //initialize addin
    constructor(api) {
        this.exportBtn = document.getElementById("exportButton");
        this.saveBtn = document.getElementById("saveButton");
        this.exportAllAddinsCheckbox = document.getElementById("export_all_addins_checkbox");
        this.exportAllZonesCheckbox = document.getElementById("export_all_zones_checkbox");
        this.exportSystemSettingsCheckbox = document.getElementById("export_system_settings_checkbox");
        this.data = {
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
        this.toggleWaiting = (isStart = false) => {
            if (isStart) {
                this.toggleExportButton(true);
                this.waiting.start(document.getElementById("addinContainer").parentElement, 9999);
            }
            else {
                this.toggleExportButton(false);
                this.waiting.stop();
            }
        };
        //Brett: exports the data
        this.exportData = () => {
            this.toggleWaiting(true);
            return this.reportsBuilder.getData().then((reportsData) => {
                this.data.reports = reportsData;
                console.log(this.data);
                (0, utils_1.downloadDataAsFile)(JSON.stringify(this.data), "export.json");
            }).catch((e) => {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            }).finally(() => this.toggleWaiting());
        };
        this.saveChanges = () => {
            this.render();
        };
        this.checkBoxValueChanged = () => {
            this.toggleExportButton(true);
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1.default(api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1.default(api);
        this.reportsBuilder = new reportsBuilder_1.default(api);
        this.rulesBuilder = new rulesBuilder_1.default(api);
        this.distributionListsBuilder = new distributionListsBuilder_1.default(api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.userBuilder = new UserBuilder(api);
        this.zoneBuilder = new zoneBuilder_1.ZoneBuilder(api);
        this.addInBuilder = new addInBuilder_1.AddInBuilder(api);
        this.waiting = new waiting_1.default();
    }
    addEventHandlers() {
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
    }
    render() {
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.data.users = [];
        this.data.zones = [];
        this.data.addins = [];
        //wire up the dom
        let mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), mapBlockDescription = document.querySelector("#exportedMap .description"), 
        // usersBlock: HTMLElement = document.getElementById("exportedUsers"),
        zonesBlock = document.getElementById("exportedZones"), systemSettingsBlock = document.getElementById("exportSystemSettings");
        this.toggleWaiting(true);
        const zonesQtyPromise = this.exportAllZonesCheckbox.checked == true ? this.zoneBuilder.getQty() : Promise.resolve(0);
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
            ]);
        }).then((results) => {
            let reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            this.data.groups = results[0];
            this.data.securityGroups = results[1];
            this.data.reports = results[2];
            this.data.rules = results[3];
            this.data.distributionLists = this.distributionListsBuilder.getRulesDistributionLists(this.data.rules.map(rule => rule.id));
            this.data.misc = results[5];
            let getDependencies = (entities, entityType) => {
                return entities.reduce((res, entity) => {
                    let entityDep = this.getEntityDependencies(entity, entityType);
                    return this.combineDependencies(res, entityDep);
                }, {});
            };
            let zoneDependencies = {};
            if (this.exportAllZonesCheckbox.checked == true) {
                if (results[6]) {
                    //sets exported zones to all database zones
                    this.data.zones = results[6];
                    zoneDependencies = getDependencies(results[6], "zones");
                }
            }
            if (this.exportAllAddinsCheckbox.checked == true) {
                if (results[7]) {
                    //sets exported addins equal to none/empty array
                    this.data.addins = results[7];
                    if (this.data.misc) {
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
    unload() {
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
    let addin;
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

},{"./addInBuilder":1,"./distributionListsBuilder":3,"./groupsBuilder":4,"./miscBuilder":5,"./reportsBuilder":6,"./rulesBuilder":7,"./securityClearancesBuilder":9,"./utils":10,"./waiting":11,"./zoneBuilder":12}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class DistributionListsBuilder {
    constructor(api) {
        this.api = api;
    }
    //A distribution list links a set of Rule(s) to a set of Recipient(s). When a Rule is violated each related Recipient will receive a notification of the kind defined by its RecipientType.
    getDistributionListsData() {
        const requests = [
            ["Get", {
                    "typeName": "DistributionList",
                }],
            ["GetNotificationWebRequestTemplates", {}],
            ["GetNotificationEmailTemplates", {}],
            ["GetNotificationTextTemplates", {}]
        ];
        return (0, utils_1.multiCall)(this.api, requests);
    }
    ;
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    ;
    getDependencies(distributionLists) {
        let dependencies = {
            rules: [],
            users: [],
            groups: [],
            notificationTemplates: []
        }, processDependencies = (recipient) => {
            let id = undefined;
            let type = undefined;
            let userId = recipient.user.id;
            userId && dependencies.users.indexOf(userId) === -1 && dependencies.users.push(userId);
            switch (recipient.recipientType) {
                case "Email":
                case "LogPopup":
                case "LogUrgentPopup":
                case "LogOnly":
                case "TextMessage":
                case "TextToSpeechAllowDelay":
                case "WebRequest":
                case "TextToSpeech":
                    id = recipient.notificationBinaryFile && recipient.notificationBinaryFile.id;
                    type = "notificationTemplates";
                    break;
                case "AssignToGroup":
                    id = recipient.group && recipient.group.id;
                    type = "groups";
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkRecipients = (recipients, dependencies) => {
            return recipients.reduce((dependencies, recipient) => {
                processDependencies(recipient);
                return dependencies;
            }, dependencies);
        };
        return distributionLists.reduce((dependencies, distributionList) => {
            dependencies.rules = (0, utils_1.mergeUnique)(dependencies.rules, distributionList.rules.map(rule => rule.id));
            dependencies = checkRecipients(distributionList.recipients, dependencies);
            return dependencies;
        }, dependencies);
    }
    ;
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getDistributionListsData()
            .then(([distributionLists, webTemplates, emailTemplates, textTemplates]) => {
            this.distributionLists = (0, utils_1.entityToDictionary)(distributionLists);
            this.notificationTemplates = (0, utils_1.entityToDictionary)(webTemplates.concat(emailTemplates).concat(textTemplates));
            return this.distributionLists;
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    ;
    getNotificationTemplateData(templateId) {
        return this.notificationTemplates[templateId];
    }
    ;
    getRulesDistributionLists(rulesIds) {
        return Object.keys(this.distributionLists).reduce((res, id) => {
            let list = this.distributionLists[id];
            list.rules.some(listRule => rulesIds.indexOf(listRule.id) > -1) && res.push(list);
            return res;
        }, []);
    }
    ;
    unload() {
        this.abortCurrentTask();
    }
    ;
}
exports.default = DistributionListsBuilder;

},{"./utils":10}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../bluebird.d.ts"/>
const utils_1 = require("./utils");
class GroupsBuilder {
    constructor(api) {
        this.api = api;
    }
    //gets the groups associated with the current user
    getGroups() {
        return new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                this.currentUserName = sessionData.userName;
                const requests = [["Get", {
                            typeName: "Group"
                        }],
                    ["Get", {
                            typeName: "User"
                        }]];
                return Promise.all(requests.map(request => {
                    return new Promise((resolve, reject) => {
                        this.api.call(...request, resolve, reject);
                    });
                })).then(resolve, reject);
            });
        });
    }
    ;
    findChild(childId, currentItem, onAllLevels = false) {
        let foundChild = null, children = currentItem.children;
        if (!childId || !children || !children.length) {
            return null;
        }
        children.some(child => {
            if (child.id === childId) {
                foundChild = child;
                return foundChild;
            }
            else {
                if (onAllLevels) {
                    foundChild = this.findChild(childId, child, onAllLevels);
                    return foundChild;
                }
                else {
                    return false;
                }
            }
        });
        return foundChild;
    }
    ;
    getUserByPrivateGroupId(groupId) {
        let outputUser = null, userHasPrivateGroup = (user, groupId) => {
            return user.privateUserGroups.some(group => {
                if (group.id === groupId) {
                    return true;
                }
            });
        };
        this.users.some(user => {
            if (userHasPrivateGroup(user, groupId)) {
                outputUser = user;
                return true;
            }
        });
        return outputUser;
    }
    ;
    getPrivateGroupData(groupId) {
        return {
            id: groupId,
            user: this.getUserByPrivateGroupId(groupId),
            children: [],
            name: "PrivateUserGroupName",
            parent: {
                id: "GroupPrivateUserId",
                children: [{ id: groupId }]
            }
        };
    }
    ;
    createGroupsTree(groups) {
        let nodeLookup, traverseChildren = function (node) {
            let children, id;
            children = node.children;
            if (children) {
                for (let i = 0, ii = children.length; i < ii; i += 1) {
                    id = children[i].id;
                    if (nodeLookup[id]) {
                        node.children[i] = nodeLookup[id];
                        node.children[i].parent = node;
                        delete nodeLookup[id];
                    }
                    traverseChildren(node.children[i]);
                }
            }
        };
        nodeLookup = (0, utils_1.entityToDictionary)(groups, entity => {
            let newEntity = (0, utils_1.extend)({}, entity);
            if (newEntity.children) {
                newEntity.children = newEntity.children.slice();
            }
            return newEntity;
        });
        Object.keys(nodeLookup).forEach(key => {
            nodeLookup[key] && traverseChildren(nodeLookup[key]);
        });
        return Object.keys(nodeLookup).map(key => {
            return nodeLookup[key];
        });
    }
    ;
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    ;
    //fills the group builder with the relevant information
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getGroups()
            .then(([groups, users]) => {
            this.groups = groups;
            this.users = users;
            this.tree = this.createGroupsTree(groups);
            this.currentTree = (0, utils_1.extend)({}, this.tree);
            return this.createFlatGroupsList(this.tree);
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    ;
    createFlatGroupsList(groups, notIncludeChildren = false) {
        let foundIds = [], groupsToAdd = [], makeFlatParents = (item) => {
            let itemCopy = (0, utils_1.extend)({}, item);
            if (item && item.parent) {
                makeFlatParents(item.parent);
            }
            itemCopy.children = itemCopy.children.map(child => child.id);
            itemCopy.parent = item.parent ? { id: item.parent.id, name: item.parent.name } : null;
            if (foundIds.indexOf(item.id) === -1) {
                groupsToAdd.push(itemCopy);
                foundIds.push(item.id);
            }
        }, makeFlatChildren = (item) => {
            if (item && item.children && item.children.length) {
                item.children.forEach((child) => {
                    let childCopy;
                    if (foundIds.indexOf(child.id) === -1) {
                        makeFlatChildren(child);
                    }
                    childCopy = (0, utils_1.extend)({}, child);
                    childCopy.children = childCopy.children.map(childInner => childInner.id);
                    childCopy.parent = childCopy.parent ? { id: childCopy.parent.id, name: childCopy.parent.name } : null;
                    if (foundIds.indexOf(child.id) === -1) {
                        groupsToAdd.push(childCopy);
                        foundIds.push(child.id);
                    }
                });
            }
        };
        groups.forEach(makeFlatParents);
        !notIncludeChildren && groups.forEach(makeFlatChildren);
        return groupsToAdd;
    }
    ;
    getGroupsData(groupIds, notIncludeChildren = false) {
        let treeGroups = groupIds.map(groupId => this.findChild(groupId, { id: null, children: this.tree }, true) || this.getPrivateGroupData(groupId));
        return this.createFlatGroupsList(treeGroups, notIncludeChildren);
    }
    ;
    getCustomGroupsData(groupIds, allGroups) {
        let groupsTree = this.createGroupsTree(allGroups), treeGroups = groupIds.map(groupId => this.findChild(groupId, { id: null, children: groupsTree }, true) || this.getPrivateGroupData(groupId));
        return this.createFlatGroupsList(treeGroups, true);
    }
    ;
    getPrivateGroupsUsers(groups) {
        return groups.reduce((users, group) => {
            group.user && group.user.name !== this.currentUserName && users.push(group.user);
            return users;
        }, []);
    }
    ;
    unload() {
        this.abortCurrentTask();
    }
    ;
}
exports.default = GroupsBuilder;

},{"./utils":10}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscBuilder = void 0;
const utils_1 = require("./utils");
class MiscBuilder {
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    constructor(api) {
        this.defaultMapProviders = {
            GoogleMaps: "Google Maps",
            Here: "HERE Maps",
            MapBox: "MapBox"
        };
        this.api = api;
    }
    //fills the Misc builder (system settings) with the relevant information
    fetch(includeSysSettings) {
        this.abortCurrentTask();
        this.currentTask = new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                let userName = sessionData.userName;
                const requests = [
                    ["Get", {
                            typeName: "User",
                            search: {
                                name: userName
                            }
                        }],
                    ["Get", {
                            typeName: "SystemSettings"
                        }]
                ];
                return (0, utils_1.multiCall)(this.api, requests).then(resolve, reject);
            });
        }).then((result) => {
            let currentUser = result[0][0] || result[0], systemSettings = result[1][0] || result[1], userMapProviderId = currentUser.defaultMapEngine, defaultMapProviderId = systemSettings.mapProvider, mapProviderId = this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            this.currentUser = currentUser;
            this.customMapProviders = (0, utils_1.entityToDictionary)(systemSettings.customWebMapProviderList);
            this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            let output = {
                mapProvider: {
                    value: mapProviderId,
                    type: this.getMapProviderType(mapProviderId)
                },
                addins: [],
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
    getMapProviderType(mapProviderId) {
        return !mapProviderId || this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    }
    getMapProviderName(mapProviderId) {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    }
    getMapProviderData(mapProviderId) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.MiscBuilder = MiscBuilder;

},{"./utils":10}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scopeGroupFilter_1 = require("./scopeGroupFilter");
const Utils = require("./utils");
const utils_1 = require("./utils");
const REPORT_TYPE_DASHBOAD = "Dashboard";
class ReportsBuilder {
    getReports() {
        return (0, utils_1.multiCall)(this.api, [
            ["GetReportSchedules", {
                    "includeTemplateDetails": true,
                    "applyUserFilter": false
                }],
            ["Get", {
                    "typeName": "ReportTemplate",
                    "search": {
                        includeBinaryData: false
                    }
                }],
            ["GetDashboardItems", {}]
        ]);
    }
    populateScopeGroupFilters(reports) {
        const requests = reports.reduce((res, report) => {
            if (report.scopeGroupFilter && report.scopeGroupFilter.id) {
                res.push(["Get", {
                        "typeName": "GroupFilter",
                        "search": {
                            id: report.scopeGroupFilter.id
                        }
                    }]);
            }
            return res;
        }, []);
        return new Promise((resolve, reject) => {
            if (!requests.length) {
                resolve(reports);
                return;
            }
            (0, utils_1.multiCall)(this.api, requests).then((groupFilters) => {
                const enpackedFilter = groupFilters.map(item => Array.isArray(item) ? item[0] : item);
                const scopeGroupFilterHash = Utils.entityToDictionary(enpackedFilter);
                resolve(reports.map(report => {
                    return {
                        ...report,
                        scopeGroupFilter: report.scopeGroupFilter && scopeGroupFilterHash[report.scopeGroupFilter.id]
                    };
                }));
            }, reject);
        });
    }
    structureReports(reports, templates) {
        let findTemplateReports = (templateId) => {
            return reports.filter(report => report.template.id === templateId);
        };
        return templates.reduce((res, template) => {
            let templateId = template.id, templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    }
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    updateTemplate(newTemplateData) {
        this.allTemplates.some((templateData, index) => {
            if (templateData.id === newTemplateData.id) {
                this.allTemplates[index] = newTemplateData;
                return true;
            }
            return false;
        });
    }
    constructor(api) {
        this.api = api;
    }
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(([reports, ...rest]) => {
            return Promise.all([this.populateScopeGroupFilters(reports), ...rest]);
        })
            .then(([reports, templates, dashboardItems]) => {
            this.allReports = reports;
            this.allTemplates = templates;
            this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
            this.structuredReports = this.structureReports(reports, templates);
            return this.structuredReports;
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    getDependencies(reports) {
        let allDependencies = {
            devices: [],
            rules: [],
            zoneTypes: [],
            groups: [],
            users: []
        };
        return reports.reduce((reportsDependencies, template) => {
            return template.reports.reduce((templateDependecies, report) => {
                templateDependecies.groups =
                    Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups), Utils.getEntitiesIds(report.scopeGroupFilter && (0, scopeGroupFilter_1.getFilterStateUniqueGroups)(report.scopeGroupFilter.groupFilterCondition) || []));
                templateDependecies.users = Utils.mergeUnique(templateDependecies.users, report.individualRecipients && Utils.getEntitiesIds(report.individualRecipients) || []);
                templateDependecies.devices = Utils.mergeUnique(templateDependecies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                templateDependecies.rules = Utils.mergeUnique(templateDependecies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                templateDependecies.zoneTypes = Utils.mergeUnique(templateDependecies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return templateDependecies;
            }, reportsDependencies);
        }, allDependencies);
    }
    getData() {
        let portionSize = 15, portions = this.allTemplates.reduce((requests, template) => {
            if (!template.isSystem && !template.binaryData) {
                let portionIndex = requests.length - 1;
                if (!requests[portionIndex] || requests[portionIndex].length >= portionSize) {
                    requests.push([]);
                    portionIndex++;
                }
                requests[portionIndex].push(["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            id: template.id,
                            includeBinaryData: true
                        }
                    }]);
            }
            return requests;
        }, []), totalResults = [], getPortionData = portion => {
            return (0, utils_1.multiCall)(this.api, portion);
        }, errorPortions = [];
        this.abortCurrentTask();
        this.currentTask = portions.reduce((promises, portion) => {
            return promises
                .then(() => getPortionData(portion))
                .then(result => {
                totalResults = totalResults.concat(result);
            }, e => {
                errorPortions = errorPortions.concat(portion);
                console.error(e);
            });
        }, Utils.resolvedPromise([]))
            .then(() => {
            errorPortions.length && console.warn(errorPortions);
            totalResults.forEach(templateData => {
                let template = templateData.length ? templateData[0] : templateData;
                this.updateTemplate(template);
            });
            this.structuredReports = this.structureReports(this.allReports, this.allTemplates);
            return this.structuredReports;
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    getDashboardsQty() {
        return this.dashboardsLength;
    }
    getCustomizedReportsQty() {
        let templates = [];
        return (this.allReports.filter((report) => {
            let templateId = report.template.id, templateExists = templates.indexOf(templateId) > -1, isCount = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.default = ReportsBuilder;

},{"./scopeGroupFilter":8,"./utils":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../bluebird.d.ts"/>
/// <reference path="addin.d.ts"/>
const utils_1 = require("./utils");
const APPLICATION_RULE_ID = "RuleApplicationExceptionId";
class RulesBuilder {
    getRuleDiagnosticsString(rule) {
        return this.getDependencies([rule]).diagnostics.sort().join();
    }
    getRules() {
        return (0, utils_1.multiCall)(this.api, [
            ["Get", {
                    "typeName": "Rule"
                }],
            ["Get", {
                    typeName: "Rule",
                    search: {
                        baseType: "RouteBasedMaterialMgmt"
                    }
                }]
        ]).then(([allRules, materialManagementRules]) => {
            // To get correct Service groups we need to update material management stock rules' groups from groups property of the corresponding rule with RouteBasedMaterialMgmt baseType
            // The only possible method now to match Stock rule and rule with RouteBasedMaterialMgmt baseType is to match their diagnostics
            const mmRulesGroups = materialManagementRules.reduce((res, mmRule) => {
                const mmRuleDiagnostics = this.getRuleDiagnosticsString(mmRule);
                res[mmRuleDiagnostics] = mmRule.groups;
                return res;
            }, {});
            return allRules.map(rule => {
                const mmRuleDiagnostics = this.getRuleDiagnosticsString(rule);
                const correspondingMMRuleGroups = mmRulesGroups[mmRuleDiagnostics];
                return correspondingMMRuleGroups ? { ...rule, groups: correspondingMMRuleGroups } : rule;
            });
        });
    }
    structureRules(rules) {
        return (0, utils_1.sortArrayOfEntities)(rules, [["baseType", "desc"], "name"]);
    }
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    constructor(api) {
        this.api = api;
    }
    getDependencies(rules) {
        let dependencies = {
            devices: [],
            users: [],
            zones: [],
            zoneTypes: [],
            workTimes: [],
            workHolidays: [],
            groups: [],
            diagnostics: [],
            securityGroups: []
        }, processDependencies = (condition) => {
            let id = undefined;
            let type = undefined;
            switch (condition.conditionType) {
                case "RuleWorkHours":
                case "AfterRuleWorkHours":
                    id = (condition.workTime && condition.workTime.id) || condition.workTime;
                    type = "workTimes";
                    break;
                case "Driver":
                    id = condition.driver && condition.driver.id;
                    type = "users";
                    break;
                case "Device":
                    id = condition.device && condition.device.id;
                    type = "devices";
                    break;
                case "EnteringArea":
                case "ExitingArea":
                case "OutsideArea":
                case "InsideArea":
                    if (condition.zone) {
                        id = condition.zone.id || condition.zone;
                        type = "zones";
                    }
                    else {
                        id = condition.zoneType.id;
                        type = "zoneTypes";
                    }
                    break;
                case "FilterStatusDataByDiagnostic":
                case "ActiveOrInactiveFault":
                case "Fault":
                    if (condition.diagnostic) {
                        id = condition.diagnostic.id || condition.diagnostic;
                        type = "diagnostics";
                    }
                    break;
                default:
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkConditions = (parentCondition, dependencies) => {
            let conditions = parentCondition.children || [];
            processDependencies(parentCondition);
            return conditions.reduce((dependencies, condition) => {
                if (condition.children) {
                    dependencies = checkConditions(condition, dependencies);
                }
                processDependencies(condition);
                return dependencies;
            }, dependencies);
        };
        return rules.reduce((dependencies, rule) => {
            dependencies.groups = (0, utils_1.mergeUnique)(dependencies.groups, rule.groups.map(group => group.id));
            if (rule.condition) {
                dependencies = checkConditions(rule.condition, dependencies);
            }
            return dependencies;
        }, dependencies);
    }
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then((switchedOnRules) => {
            this.combinedRules = (0, utils_1.entityToDictionary)(switchedOnRules);
            delete (this.combinedRules[APPLICATION_RULE_ID]);
            return Object.keys(this.combinedRules).map(ruleId => this.combinedRules[ruleId]);
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    getRulesData(rulesIds) {
        return rulesIds.map(ruleId => this.combinedRules[ruleId]);
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.default = RulesBuilder;

},{"./utils":10}],8:[function(require,module,exports){
"use strict";
/// <reference path="../bluebird.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterStateUniqueGroups = exports.isFilterState = exports.getScopeGroupFilterById = void 0;
const getScopeGroupFilterById = (id, api) => {
    return new Promise((resolve, reject) => {
        api.call("Get", {
            typeName: "GroupFilter",
            search: { id }
        }, resolve, reject);
    });
};
exports.getScopeGroupFilterById = getScopeGroupFilterById;
const isFilterState = (item) => item && item.relation !== undefined;
exports.isFilterState = isFilterState;
const getFilterStateUniqueGroups = (state) => {
    let groupIds = [];
    const processItem = (item, prevRes = []) => {
        return item.groupFilterConditions.reduce((res, childItem) => {
            if ((0, exports.isFilterState)(childItem)) {
                return processItem(childItem, res);
            }
            let id = childItem.groupId;
            groupIds.indexOf(id) === -1 && res.push({ id });
            groupIds.push(id);
            return res;
        }, prevRes);
    };
    return (0, exports.isFilterState)(state) ? processItem(state) : [{ id: state.groupId }];
};
exports.getFilterStateUniqueGroups = getFilterStateUniqueGroups;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../bluebird.d.ts"/>
const groupsBuilder_1 = require("./groupsBuilder");
const Utils = require("./utils");
class SecurityClearancesBuilder extends groupsBuilder_1.default {
    constructor(api) {
        super(api);
    }
    getSecurityGroups() {
        return new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                this.api.call("Get", {
                    typeName: "Group",
                    search: {
                        id: "GroupSecurityId"
                    }
                }, resolve, reject);
            });
        });
    }
    ;
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getSecurityGroups()
            .then(groups => {
            this.groups = groups;
            this.tree = this.createGroupsTree(groups);
            this.currentTree = Utils.extend({}, this.tree);
            return this.createFlatGroupsList(this.tree).filter(group => !!group.name);
        })
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    ;
}
exports.default = SecurityClearancesBuilder;

},{"./groupsBuilder":4,"./utils":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiCall = exports.getGroupFilterGroups = void 0;
exports.removeClass = removeClass;
exports.addClass = addClass;
exports.hasClass = hasClass;
exports.extend = extend;
exports.entityToDictionary = entityToDictionary;
exports.sortArrayOfEntities = sortArrayOfEntities;
exports.downloadDataAsFile = downloadDataAsFile;
exports.mergeUniqueEntities = mergeUniqueEntities;
exports.getEntitiesIds = getEntitiesIds;
exports.mergeUnique = mergeUnique;
exports.getUniqueEntities = getUniqueEntities;
exports.together = together;
exports.resolvedPromise = resolvedPromise;
exports.toArray = toArray;
/// <reference path="../bluebird.d.ts"/>
let classNameCtrl = function (el) {
    var param = typeof el.className === "string" ? "className" : "baseVal";
    return {
        get: function () {
            return el[param] || "";
        },
        set: function (text) {
            el[param] = text;
        }
    };
}, isUsualObject = function (obj) {
    return Object.prototype.toString.call(obj).indexOf("Object") !== -1;
};
function removeClass(el, name) {
    if (!el) {
        return;
    }
    let classesStr = classNameCtrl(el).get(), classes = classesStr.split(" "), newClasses = classes.filter(classItem => classItem !== name);
    classNameCtrl(el).set(newClasses.join(" "));
}
function addClass(el, name) {
    if (!el) {
        return;
    }
    let classesStr = classNameCtrl(el).get(), classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}
function hasClass(el, className) {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}
function extend(...args) {
    var length = args.length, src, srcKeys, srcAttr, fullCopy = false, resAttr, res = args[0], i = 1, j;
    if (typeof res === "boolean") {
        fullCopy = res;
        res = args[1];
        i++;
    }
    while (i !== length) {
        src = args[i];
        srcKeys = Object.keys(src);
        for (j = 0; j < srcKeys.length; j++) {
            srcAttr = src[srcKeys[j]];
            if (fullCopy && (isUsualObject(srcAttr) || Array.isArray(srcAttr))) {
                resAttr = res[srcKeys[j]];
                resAttr = res[srcKeys[j]] = (isUsualObject(resAttr) || Array.isArray(resAttr)) ? resAttr : (Array.isArray(srcAttr) ? [] : {});
                extend(fullCopy, resAttr, srcAttr);
            }
            else {
                res[srcKeys[j]] = src[srcKeys[j]];
            }
        }
        i++;
    }
    return res;
}
function entityToDictionary(entities, entityCallback) {
    var entity, o = {}, i, l = entities.length;
    for (i = 0; i < l; i++) {
        if (entities[i]) {
            entity = entities[i].id ? entities[i] : { id: entities[i] };
            o[entity.id] = entityCallback ? entityCallback(entity) : entity;
        }
    }
    return o;
}
function sortArrayOfEntities(entities, sortingFields) {
    let comparator = (prevItem, nextItem, properties, index = 0) => {
        if (properties.length <= index) {
            return 0;
        }
        let options = properties[index], [property, dir = "asc"] = Array.isArray(options) ? options : [options], dirMultiplier;
        dirMultiplier = dir === "asc" ? 1 : -1;
        if (prevItem[property] > nextItem[property]) {
            return 1 * dirMultiplier;
        }
        else if (prevItem[property] < nextItem[property]) {
            return -1 * dirMultiplier;
        }
        else {
            return comparator(prevItem, nextItem, properties, index + 1);
        }
    };
    return entities.sort((prevTemplate, nextTemplate) => {
        return comparator(prevTemplate, nextTemplate, sortingFields);
    });
}
function downloadDataAsFile(data, filename, mimeType = "text/json") {
    let blob = new Blob([data], { type: mimeType }), elem;
    elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}
function mergeUniqueEntities(...sources) {
    let addedIds = [], mergedItems = [];
    sources.forEach(source => source.forEach(item => {
        if (item && item.id && addedIds.indexOf(item.id) === -1) {
            addedIds.push(item.id);
            mergedItems.push(item);
        }
    }));
    return mergedItems;
}
function getEntitiesIds(entitiesList) {
    return Array.isArray(entitiesList) && entitiesList.reduce((result, entity) => {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}
function mergeUnique(...sources) {
    let mergedItems = [];
    sources.forEach(source => {
        Array.isArray(source) && source.forEach(item => {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}
function getUniqueEntities(newEntities, existedEntities) {
    let selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce((res, entity) => {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}
function together(promises) {
    let results = [], resultsCount = 0;
    results.length = promises.length;
    return new Promise((resolve, reject) => {
        let resolveAll = () => {
            return resolve(results);
        };
        promises.length ? promises.forEach((promise, index) => {
            promise.then((result) => {
                resultsCount++;
                results[index] = result;
                resultsCount === promises.length && resolveAll();
            }).catch((error) => {
                reject({
                    error: error,
                    promiseIndex: index
                });
            });
        }) : resolveAll();
    });
}
function resolvedPromise(val) {
    return new Promise(resolve => resolve(val));
}
function toArray(data) {
    return Array.isArray(data) ? data : [data];
}
const isLeafGroupFilterCondition = (groupFilterCondition) => {
    return !!groupFilterCondition.groupId;
};
const getGroupFilterGroups = (groupFilterCondition, prevGroupIds = new Set()) => {
    if (!groupFilterCondition) {
        return prevGroupIds;
    }
    const groups = isLeafGroupFilterCondition(groupFilterCondition)
        ? new Set([...prevGroupIds, groupFilterCondition.groupId])
        : groupFilterCondition.groupFilterConditions.reduce((res, childGroupFilterCondition) => (0, exports.getGroupFilterGroups)(childGroupFilterCondition, res), prevGroupIds);
    return groups;
};
exports.getGroupFilterGroups = getGroupFilterGroups;
const multiCall = (api, calls) => {
    const chunkSize = 7;
    const chunks = [];
    for (let i = 0; i < calls.length; i += chunkSize) {
        chunks.push(calls.slice(i, i + chunkSize));
    }
    return Promise.all(chunks.map(chunk => new Promise((resolve, reject) => api.multiCall(chunk, resolve, reject)))).then(results => results.flat());
    // return Promise.all(calls.map(params => {
    //     return new Promise((resolve, reject) => {
    //         api.call(...params, resolve, reject);
    //     });
    // }));
    // return api.multiCall(calls);
};
exports.multiCall = multiCall;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Waiting {
    constructor() {
        this.bodyEl = document.body;
    }
    start(el = this.bodyEl, zIndex) {
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "erc-waiting";
        this.waitingContainer.innerHTML = `
            <div class="erc-waiting__overlay"></div>
            <div class="erc-waiting__spinner-container">
                <div class="erc-waiting__spinner">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="spinnerGradient" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                                <stop offset="0%" stop-color="var(--erc-color-primary)" stop-opacity="1"></stop>
                                <stop offset="33.33%" stop-color="var(--erc-color-primary)" stop-opacity="0.8"></stop>
                                <stop offset="50%" stop-color="var(--erc-color-primary)" stop-opacity="0.5"></stop>
                                <stop offset="66.67%" stop-color="var(--erc-color-primary)" stop-opacity="0.2"></stop>
                                <stop offset="100%" stop-color="var(--erc-color-primary)" stop-opacity="0"></stop>
                            </linearGradient>
                        </defs>
                        <path class="erc-waiting__spinner-animation" stroke="url(#spinnerGradient)" stroke-width="6" stroke-linecap="round" d="M 32 4 A 28 28 0 1 1 32 60 A 28 28 0 1 1 32 4 Z"></path>
                    </svg>
                </div>
            </div>
        `;
        el.parentNode?.appendChild(this.waitingContainer);
        this.waitingContainer.style.position = "absolute";
        this.waitingContainer.style.width = el.offsetWidth + "px";
        this.waitingContainer.style.height = el.offsetHeight + "px";
        this.waitingContainer.style.top = el.offsetTop + "px";
        this.waitingContainer.style.left = el.offsetLeft + "px";
        this.waitingContainer.style.display = "block";
        typeof zIndex === "number" && (this.waitingContainer.style.zIndex = zIndex.toString());
    }
    ;
    stop() {
        if (this.waitingContainer && this.waitingContainer.parentNode) {
            this.waitingContainer.parentNode.removeChild(this.waitingContainer);
        }
    }
    ;
}
exports.default = Waiting;

},{}],12:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all zones to the export as an option
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneBuilder = void 0;
class ZoneBuilder {
    constructor(api) {
        this.api = api;
    }
    abortCurrentTask() {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }
    getZones() {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    }
    getZonesQty() {
        return new Promise((resolve, reject) => {
            this.api.call("GetCountOf", {
                "typeName": "Zone"
            }).then(resolve, reject);
        });
    }
    //fills the user builder with all users
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getZones();
        return this.currentTask;
    }
    getQty() {
        this.abortCurrentTask();
        this.currentTask = this.getZonesQty()
            .catch(console.error)
            .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.ZoneBuilder = ZoneBuilder;

},{}]},{},[2])
