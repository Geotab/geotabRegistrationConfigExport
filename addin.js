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
            const isValidSrc = !(scripts === null || scripts === void 0 ? void 0 : scripts.src) || this.isValidUrl(scripts.src);
            const isValidStyle = !(scripts === null || scripts === void 0 ? void 0 : scripts.style) || this.isValidUrl(scripts.style);
            const isValidHtml = !(scripts === null || scripts === void 0 ? void 0 : scripts.url) || this.isValidUrl(scripts.url);
            const hasScripts = !!scripts && (!!(scripts === null || scripts === void 0 ? void 0 : scripts.src) || !(scripts === null || scripts === void 0 ? void 0 : scripts.style) || !(scripts === null || scripts === void 0 ? void 0 : scripts.url));
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
                    this.api.multiCall(requestsArray, (response) => {
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
            if (zonesQty > 10000) {
                alert("The number of zones in the database exceeds 10,000. Exporting all zones may take a long time and could potentially time out. We turned off the 'Export All Zones' option to prevent this.");
                this.exportAllZonesCheckbox.checked = false;
                this.exportAllZonesCheckbox.disabled = true;
            }
            return (0, utils_1.together)([
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
            var _a;
            let mapProvider = this.data.misc && this.miscBuilder.getMapProviderName(this.data.misc.mapProvider.value);
            this.showEntityMessage(groupsBlock, this.data.groups.length - 1, "group");
            this.showEntityMessage(securityClearancesBlock, this.data.securityGroups.length, "security clearance");
            this.showEntityMessage(rulesBlock, this.data.rules.length, "rule");
            this.showEntityMessage(reportsBlock, this.reportsBuilder.getCustomizedReportsQty(), "report");
            this.showEntityMessage(dashboardsBlock, this.reportsBuilder.getDashboardsQty(), "dashboard");
            if (mapProvider) {
                mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider);
            }
            this.showEntityMessage(addinsBlock, ((_a = this.data.addins) === null || _a === void 0 ? void 0 : _a.length) || 0, "addin");
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
        return new Promise((resolve, reject) => {
            this.api.multiCall([
                ["Get", {
                        "typeName": "DistributionList",
                    }],
                ["GetNotificationWebRequestTemplates", {}],
                ["GetNotificationEmailTemplates", {}],
                ["GetNotificationTextTemplates", {}]
            ], resolve, reject);
        });
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
                this.api.multiCall([
                    ["Get", {
                            typeName: "Group"
                        }],
                    ["Get", {
                            typeName: "User"
                        }]
                ], resolve, reject);
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
const REPORT_TYPE_DASHBOAD = "Dashboard";
class ReportsBuilder {
    getReports() {
        return new Promise((resolve, reject) => {
            this.api.multiCall([
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
            ], resolve, reject);
        });
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
            this.api.multiCall(requests, (groupFilters) => {
                const enpackedFilter = groupFilters.map(item => Array.isArray(item) ? item[0] : item);
                const scopeGroupFilterHash = Utils.entityToDictionary(enpackedFilter);
                resolve(reports.map(report => {
                    return Object.assign(Object.assign({}, report), { scopeGroupFilter: report.scopeGroupFilter && scopeGroupFilterHash[report.scopeGroupFilter.id] });
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
            return new Promise((resolve, reject) => {
                this.api.multiCall(portion, resolve, reject);
            });
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
        return new Promise((resolve, reject) => {
            this.api.multiCall([
                ["Get", {
                        "typeName": "Rule"
                    }],
                ["Get", {
                        typeName: "Rule",
                        search: {
                            baseType: "RouteBasedMaterialMgmt"
                        }
                    }]
            ], ([allRules, materialManagementRules]) => {
                // To get correct Service groups we need to update material management stock rules' groups from groups property of the corresponding rule with RouteBasedMaterialMgmt baseType
                // The only possible method now to match Stock rule and rule with RouteBasedMaterialMgmt baseType is to match their diagnostics
                const mmRulesGroups = materialManagementRules.reduce((res, mmRule) => {
                    const mmRuleDiagnostics = this.getRuleDiagnosticsString(mmRule);
                    res[mmRuleDiagnostics] = mmRule.groups;
                    return res;
                }, {});
                return resolve(allRules.map(rule => {
                    const mmRuleDiagnostics = this.getRuleDiagnosticsString(rule);
                    const correspondingMMRuleGroups = mmRulesGroups[mmRuleDiagnostics];
                    return correspondingMMRuleGroups ? Object.assign(Object.assign({}, rule), { groups: correspondingMMRuleGroups }) : rule;
                }));
            }, reject);
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
exports.getGroupFilterGroups = void 0;
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

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Waiting {
    constructor() {
        this.bodyEl = document.body;
    }
    start(el = this.bodyEl, zIndex) {
        var _a;
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
        (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(this.waitingContainer);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZEluQnVpbGRlci50cyIsInNvdXJjZXMvYWRkaW4udHMiLCJzb3VyY2VzL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci50cyIsInNvdXJjZXMvZ3JvdXBzQnVpbGRlci50cyIsInNvdXJjZXMvbWlzY0J1aWxkZXIudHMiLCJzb3VyY2VzL3JlcG9ydHNCdWlsZGVyLnRzIiwic291cmNlcy9ydWxlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3Njb3BlR3JvdXBGaWx0ZXIudHMiLCJzb3VyY2VzL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3V0aWxzLnRzIiwic291cmNlcy93YWl0aW5nLnRzIiwic291cmNlcy96b25lQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ29CQSxNQUFhLFlBQVk7SUFJckIsWUFBWSxHQUFHO1FBSVAsZUFBVSxHQUFHLENBQUMsSUFBZ0IsRUFBVyxFQUFFO1lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JELENBQUMsQ0FBQTtRQUVELHdFQUF3RTtRQUN4RSxvREFBb0Q7UUFDcEQsMkRBQTJEO1FBQ25ELGVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXpFLGtCQUFhLEdBQUcsQ0FBQyxJQUFnQixFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFD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RTtZQUNWLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBbERELGtDQWtEQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImludGVyZmFjZSBJQWRkaW5JdGVtIHtcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICBtZW51SWQ/OiBzdHJpbmc7XG4gICAgZmlsZXM/OiBhbnk7XG4gICAgcGFnZT86IHN0cmluZztcbiAgICBjbGljaz86IHN0cmluZztcbiAgICBidXR0b25OYW1lPzogc3RyaW5nO1xuICAgIG1hcFNjcmlwdD86IHtcbiAgICAgICAgc3JjPzogc3RyaW5nO1xuICAgICAgICBzdHlsZT86IHN0cmluZztcbiAgICAgICAgdXJsPzogc3RyaW5nO1xuICAgIH1cbn1cblxuaW50ZXJmYWNlIElBZGRpbiBleHRlbmRzIElBZGRpbkl0ZW0ge1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgaXRlbXM/OiBJQWRkaW5JdGVtW107XG59XG5cbmV4cG9ydCBjbGFzcyBBZGRJbkJ1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc01lbnVJdGVtID0gKGl0ZW06IElBZGRpbkl0ZW0pOiBib29sZWFuID0+IHtcbiAgICAgICAgcmV0dXJuICFpdGVtLnVybCAmJiAhIWl0ZW0ucGF0aCAmJiAhIWl0ZW0ubWVudUlkO1xuICAgIH1cblxuICAgIC8vVGVzdHMgYSBVUkwgZm9yIGRvdWJsZSBzbGFzaC4gQWNjZXB0cyBhIHVybCBhcyBhIHN0cmluZyBhcyBhIGFyZ3VtZW50LlxuICAgIC8vUmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgY29udGFpbnMgYSBkb3VibGUgc2xhc2ggLy9cbiAgICAvL1JldHVybnMgZmFsc2UgaWYgdGhlIHVybCBkb2VzIG5vdCBjb250YWluIGEgZG91YmxlIHNsYXNoLlxuICAgIHByaXZhdGUgaXNWYWxpZFVybCA9ICh1cmw6IHN0cmluZyk6IGJvb2xlYW4gPT4gISF1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMTtcblxuICAgIHByaXZhdGUgaXNWYWxpZEJ1dHRvbiA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiAhIWl0ZW0uYnV0dG9uTmFtZSAmJiAhIWl0ZW0ucGFnZSAmJiAhIWl0ZW0uY2xpY2sgJiYgdGhpcy5pc1ZhbGlkVXJsKGl0ZW0uY2xpY2spO1xuXG4gICAgcHJpdmF0ZSBpc0VtYmVkZGVkSXRlbSA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiAhIWl0ZW0uZmlsZXM7XG5cbiAgICBwcml2YXRlIGlzVmFsaWRNYXBBZGRpbiA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgIGNvbnN0IHNjcmlwdHMgPSBpdGVtLm1hcFNjcmlwdDtcbiAgICAgICAgY29uc3QgaXNWYWxpZFNyYyA9ICFzY3JpcHRzPy5zcmMgfHwgdGhpcy5pc1ZhbGlkVXJsKHNjcmlwdHMuc3JjKTtcbiAgICAgICAgY29uc3QgaXNWYWxpZFN0eWxlID0gIXNjcmlwdHM/LnN0eWxlIHx8IHRoaXMuaXNWYWxpZFVybChzY3JpcHRzLnN0eWxlKTtcbiAgICAgICAgY29uc3QgaXNWYWxpZEh0bWwgPSAhc2NyaXB0cz8udXJsIHx8IHRoaXMuaXNWYWxpZFVybChzY3JpcHRzLnVybCk7XG4gICAgICAgIGNvbnN0IGhhc1NjcmlwdHMgPSAhIXNjcmlwdHMgJiYgKCEhc2NyaXB0cz8uc3JjIHx8ICFzY3JpcHRzPy5zdHlsZSB8fCAhc2NyaXB0cz8udXJsKTtcbiAgICAgICAgcmV0dXJuIGhhc1NjcmlwdHMgJiYgaXNWYWxpZFNyYyAmJiBpc1ZhbGlkU3R5bGUgJiYgaXNWYWxpZEh0bWw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc1ZhbGlkSXRlbSA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzRW1iZWRkZWRJdGVtKGl0ZW0pIHx8IHRoaXMuaXNNZW51SXRlbShpdGVtKSB8fCB0aGlzLmlzVmFsaWRCdXR0b24oaXRlbSkgfHwgdGhpcy5pc1ZhbGlkTWFwQWRkaW4oaXRlbSkgfHwgKCEhaXRlbS51cmwgJiYgdGhpcy5pc1ZhbGlkVXJsKGl0ZW0udXJsKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0N1cnJlbnRBZGRpbiAoYWRkaW46IHN0cmluZykge1xuICAgICAgICByZXR1cm4gKChhZGRpbi5pbmRleE9mKFwiUmVnaXN0cmF0aW9uIGNvbmZpZ1wiKSA+IC0xKXx8XG4gICAgICAgIChhZGRpbi50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJyZWdpc3RyYXRpb25Db25maWdcIi50b0xvd2VyQ2FzZSgpKSA+IC0xKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgYWRkaW4gYnVpbGRlciB3aXRoIGFsbCBhZGRpbnNcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEFkZElucygpXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyhhbGxBZGRpbnM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcbiAgICAgICAgICAgIC8vcmVtb3ZlcyB0aGUgY3VycmVudCBhZGRpbiAtIHJlZ2lzdHJhdGlvbiBjb25maWdcbiAgICAgICAgICAgIGlmKHRoaXMuaXNDdXJyZW50QWRkaW4oYWRkaW4pKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBhZGRpbkNvbmZpZzogSUFkZGluID0gSlNPTi5wYXJzZShhZGRpbik7XG4gICAgICAgICAgICBpZihhZGRpbkNvbmZpZy5pdGVtcykge1xuICAgICAgICAgICAgICAgIC8vTXVsdGkgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KHRoaXMuaXNWYWxpZEl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy9TaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkSXRlbShhZGRpbkNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QWRkSW5zICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRWZXJzaW9uKClcbiAgICAgICAgLnRoZW4oKHZlcnNpb24pID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKCB2ZXJzaW9uLnNwbGl0KFwiLlwiLCAxKSA8IDgpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEZyb21TeXN0ZW1TZXR0aW5ncygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tQWRkSW5BcGkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0VmVyc2lvbiAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRWZXJzaW9uXCIsIHtcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RnJvbUFkZEluQXBpICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkFkZEluXCJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgYWRkSW5zIDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkocmVzdWx0KSl7XG4gICAgICAgICAgICByZXN1bHQuZm9yRWFjaChhZGRJbiA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTmV3IEFwaSByZXR1cm5zIGNvbmZpZ3VyYXRpb24gZm9yIEFsbCBBZGRpbnNcbiAgICAgICAgICAgICAgICAvLyBJZiBpdCBoYXMgVXJsIHRoZW4gd2UgZG9uJ3QgbmVlZCB0aGUgY29uZmlndXJhdGlvbiBwYXJ0IGZvciBleHBvcnRcbiAgICAgICAgICAgICAgICBpZihhZGRJbi51cmwgJiYgYWRkSW4udXJsICE9IFwiXCIpe1xuICAgICAgICAgICAgICAgICAgICBpZihhZGRJbi5jb25maWd1cmF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhZGRJbi5jb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFkZEluLmlkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHVybCBidXQgd2UgaGF2ZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2lsbCBrZWVwIHdoYXQncyBpbnNpZGUgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICBlbHNlIGlmKGFkZEluLmNvbmZpZ3VyYXRpb24pe1xuICAgICAgICAgICAgICAgICAgICBhZGRJbiA9IGFkZEluLmNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFkZElucy5wdXNoKEpTT04uc3RyaW5naWZ5KGFkZEluKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKGFkZElucyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RnJvbVN5c3RlbVNldHRpbmdzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlN5c3RlbVNldHRpbmdzXCJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHJlc3VsdFswXS5jdXN0b21lclBhZ2VzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2FkZGluLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5cbmltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcbmltcG9ydCBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGZyb20gXCIuL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXJcIjtcbmltcG9ydCBSZXBvcnRzQnVpbGRlciBmcm9tIFwiLi9yZXBvcnRzQnVpbGRlclwiO1xuaW1wb3J0IFJ1bGVzQnVpbGRlciBmcm9tIFwiLi9ydWxlc0J1aWxkZXJcIjtcbmltcG9ydCBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgZnJvbSBcIi4vZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyXCI7XG5pbXBvcnQge0lNaXNjRGF0YSwgTWlzY0J1aWxkZXJ9IGZyb20gXCIuL21pc2NCdWlsZGVyXCI7XG5pbXBvcnQge2Rvd25sb2FkRGF0YUFzRmlsZSwgbWVyZ2VVbmlxdWUsIElFbnRpdHksIG1lcmdlVW5pcXVlRW50aXRpZXMsIGdldFVuaXF1ZUVudGl0aWVzLCBnZXRFbnRpdGllc0lkcywgdG9nZXRoZXIsIHJlc29sdmVkUHJvbWlzZSwgZ2V0R3JvdXBGaWx0ZXJHcm91cHN9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XG4vLyBpbXBvcnQge1VzZXJCdWlsZGVyfSBmcm9tIFwiLi91c2VyQnVpbGRlclwiO1xuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcbmltcG9ydCB7QWRkSW5CdWlsZGVyfSBmcm9tIFwiLi9hZGRJbkJ1aWxkZXJcIjtcblxuaW50ZXJmYWNlIEdlb3RhYiB7XG4gICAgYWRkaW46IHtcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxuICAgIH07XG59XG5cbmludGVyZmFjZSBJSW1wb3J0RGF0YSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICByZXBvcnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xuICAgIGRpYWdub3N0aWNzOiBhbnlbXTtcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcbiAgICBtaXNjOiBJTWlzY0RhdGEgfCBudWxsO1xuICAgIGFkZGluczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBjZXJ0aWZpY2F0ZXM6IGFueVtdO1xuICAgIGdyb3VwRmlsdGVycz86IGFueVtdO1xufVxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcbiAgICBydWxlcz86IHN0cmluZ1tdO1xuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xuICAgIHVzZXJzPzogc3RyaW5nW107XG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XG4gICAgem9uZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xuICAgIGNlcnRpZmljYXRlcz86IHN0cmluZ1tdO1xuICAgIGdyb3VwRmlsdGVycz86IHN0cmluZ1tdO1xufVxuXG50eXBlIFRFbnRpdHlUeXBlID0ga2V5b2YgSUltcG9ydERhdGE7XG5cbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XG5cbmNsYXNzIEFkZGluIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdyb3Vwc0J1aWxkZXI6IEdyb3Vwc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcnVsZXNCdWlsZGVyOiBSdWxlc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFkZEluQnVpbGRlcjogQWRkSW5CdWlsZGVyO1xuICAgIC8vIHByaXZhdGUgcmVhZG9ubHkgdXNlckJ1aWxkZXI6IFVzZXJCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgem9uZUJ1aWxkZXI6IFpvbmVCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRCdXR0b25cIikgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzYXZlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlQnV0dG9uXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfYWRkaW5zX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfc3lzdGVtX3NldHRpbmdzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3YWl0aW5nOiBXYWl0aW5nO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBJSW1wb3J0RGF0YSA9IHtcbiAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgcmVwb3J0czogW10sXG4gICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHM6IFtdLFxuICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICB6b25lczogW10sXG4gICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgIHdvcmtIb2xpZGF5czogW10sXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgbWlzYzogbnVsbCxcbiAgICAgICAgYWRkaW5zOiBbXSxcbiAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXSxcbiAgICAgICAgY2VydGlmaWNhdGVzOiBbXSxcbiAgICAgICAgZ3JvdXBGaWx0ZXJzOiBbXVxuICAgIH07XG5cbiAgICBwcml2YXRlIGNvbWJpbmVEZXBlbmRlbmNpZXMgKC4uLmFsbERlcGVuZGVuY2llczogSURlcGVuZGVuY2llc1tdKTogSURlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCB0b3RhbCA9IHtcbiAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICByZXBvcnRzOiBbXSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdLFxuICAgICAgICAgICAgZ3JvdXBGaWx0ZXJzOiBbXVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModG90YWwpLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBkZXBlbmRlbmN5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSwgLi4uYWxsRGVwZW5kZW5jaWVzLm1hcCgoZW50aXR5RGVwZW5kZW5jaWVzKSA9PiBlbnRpdHlEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdKSk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCB0b3RhbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdHcm91cHMgKGdyb3Vwczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxuICAgICAgICAgICAgbmV3R3JvdXBzVXNlcnMgPSBnZXRVbmlxdWVFbnRpdGllcyh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3Vwc0RhdGEpLCBkYXRhLnVzZXJzKTtcbiAgICAgICAgZGF0YS5ncm91cHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuZ3JvdXBzLCBncm91cHNEYXRhKTtcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKHt1c2VyczogZ2V0RW50aXRpZXNJZHMobmV3R3JvdXBzVXNlcnMpfSwgZGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdDdXN0b21NYXBzIChjdXN0b21NYXBzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgaWYgKCFjdXN0b21NYXBzSWRzIHx8ICFjdXN0b21NYXBzSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXN0b21NYXBzRGF0YSA9IGN1c3RvbU1hcHNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgbGV0IGN1c3RvbU1hcERhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YShjdXN0b21NYXBJZCk7XG4gICAgICAgICAgICBjdXN0b21NYXBEYXRhICYmIGRhdGEucHVzaChjdXN0b21NYXBEYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9LCBbXSk7XG4gICAgICAgIGRhdGEuY3VzdG9tTWFwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5jdXN0b21NYXBzLCBjdXN0b21NYXBzRGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMgKG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgdGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVEYXRhID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sIFtdKTtcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gZW50aXRpZXMucmVkdWNlKChyZXM6IHN0cmluZ1tdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEVudGl0eURlcGVuZGVuY2llcyAoZW50aXR5OiBJRW50aXR5LCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSkge1xuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XG4gICAgICAgIHN3aXRjaCAoZW50aXR5VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImRldmljZXNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtUaW1lcyA9IFtlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiY29tcGFueUdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiZHJpdmVyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicHJpdmF0ZVVzZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJyZXBvcnRHcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuc2VjdXJpdHlHcm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInNlY3VyaXR5R3JvdXBzXCJdKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcbiAgICAgICAgICAgICAgICBpZiAoZW50aXR5Lmlzc3VlckNlcnRpZmljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jZXJ0aWZpY2F0ZXMgPSBbIGVudGl0eS5pc3N1ZXJDZXJ0aWZpY2F0ZS5pZCBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cEZpbHRlcnMgPSB0aGlzLmdldEVudHl0aWVzSWRzKFtlbnRpdHlbXCJhY2Nlc3NHcm91cEZpbHRlclwiXV0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInpvbmVzXCI6XG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcbiAgICAgICAgICAgICAgICB6b25lVHlwZXMubGVuZ3RoICYmIChlbnRpdHlEZXBlbmRlbmNpZXMuem9uZVR5cGVzID0gem9uZVR5cGVzKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIndvcmtUaW1lc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya0hvbGlkYXlzID0gW2VudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZ3JvdXBGaWx0ZXJzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IFsuLi5nZXRHcm91cEZpbHRlckdyb3VwcygoZW50aXR5IGFzIElHcm91cEZpbHRlcikuZ3JvdXBGaWx0ZXJDb25kaXRpb24pLnZhbHVlcygpXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVudGl0eURlcGVuZGVuY2llcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFwcGx5VG9FbnRpdGllcyA8VD4oZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzLCBpbml0aWFsVmFsdWUsIGZ1bmM6IChyZXN1bHQsIGVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUsIGVudGl0eUluZGV4OiBudW1iZXIsIGVudGl0eVR5cGVJbmRleDogbnVtYmVyLCBvdmVyYWxsSW5kZXg6IG51bWJlcikgPT4gVCkge1xuICAgICAgICBsZXQgb3ZlcmFsbEluZGV4ID0gMDtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVudGl0aWVzTGlzdCkucmVkdWNlKChyZXN1bHQ6IFQsIGVudGl0eVR5cGU6IHN0cmluZywgdHlwZUluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc0xpc3RbZW50aXR5VHlwZV0ucmVkdWNlKChyZXM6IFQsIGVudGl0eSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBvdmVyYWxsSW5kZXgrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYyhyZXMsIGVudGl0eSwgZW50aXR5VHlwZSBhcyBURW50aXR5VHlwZSwgaW5kZXgsIHR5cGVJbmRleCwgb3ZlcmFsbEluZGV4IC0gMSk7XG4gICAgICAgICAgICB9LCByZXN1bHQpO1xuICAgICAgICB9LCBpbml0aWFsVmFsdWUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVzb2x2ZURlcGVuZGVuY2llcyAoZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xuICAgICAgICBsZXQgZ2V0RGF0YSA9IChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMpOiBQcm9taXNlPElJbXBvcnREYXRhPiA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGVudGl0eVJlcXVlc3RUeXBlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZXM6IFwiRGV2aWNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogXCJVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFwiWm9uZVR5cGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVzOiBcIlpvbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtUaW1lczogXCJXb3JrVGltZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBcIldvcmtIb2xpZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogXCJHcm91cFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFwiRGlhZ25vc3RpY1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VydGlmaWNhdGVzOiBcIkNlcnRpZmljYXRlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cEZpbHRlcnM6IFwiR3JvdXBGaWx0ZXJcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0czogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXRpZXNMaXN0LCB7fSwgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBlbnRpdHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgfHwgZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChbXCJHZXRcIiwgcmVxdWVzdF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzICYmIGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMuc2VjdXJpdHlHcm91cHMgPSBbW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMuc2VjdXJpdHlHcm91cHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzICYmIGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLndvcmtIb2xpZGF5cyA9IFtbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy53b3JrSG9saWRheXNcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0dyb3VwcyhlbnRpdGllc0xpc3QuZ3JvdXBzIHx8IFtdLCBkYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKGVudGl0aWVzTGlzdC5jdXN0b21NYXBzIHx8IFtdLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMoZW50aXRpZXNMaXN0Lm5vdGlmaWNhdGlvblRlbXBsYXRlcyB8fCBbXSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0LmN1c3RvbU1hcHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RFbnRpdGllcyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c0FycmF5ID0gcmVxdWVzdEVudGl0aWVzLnJlZHVjZSgobGlzdCwgdHlwZSkgPT4gbGlzdC5jb25jYXQocmVxdWVzdHNbdHlwZV0pLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RFbnRpdGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0c0FycmF5LCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0dyb3Vwczogc3RyaW5nW10gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YTogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMocmVxdWVzdHMsIHt9LCAocmVzdWx0LCByZXF1ZXN0LCBlbnRpdHlUeXBlLCBlbnRpdHlJbmRleCwgZW50aXR5VHlwZUluZGV4LCBvdmVyYWxsSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSByZXF1ZXN0c0FycmF5Lmxlbmd0aCA+IDEgPyByZXNwb25zZVtvdmVyYWxsSW5kZXhdIDogcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbVswXSB8fCBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiICYmICghaXRlbS5ob2xpZGF5R3JvdXAgfHwgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgfHwgW10pLmluZGV4T2YoaXRlbS5ob2xpZGF5R3JvdXAuZ3JvdXBJZCkgPT09IC0xKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtUaW1lc1wiICYmICFpdGVtLmRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyB8fCBbXSkuaW5kZXhPZihpdGVtLmlkKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gcmVzdWx0W2VudGl0eVR5cGVdLmNvbmNhdCh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0Q3VzdG9tR3JvdXBzRGF0YShlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgfHwgW10sIGl0ZW1zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoaXRlbSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0eURlcGVuZGVuY2llcywgbmV3RGVwZW5kZW5jaWVzLCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWUocmVzdWx0W2VudGl0eVR5cGVdLCBbZW50aXR5SWRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHcm91cHMgPSBuZXdHcm91cHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5ncm91cHMgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gbmV3Q3VzdG9tTWFwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykucmVkdWNlKChyZXN1bHQsIGRlcGVuZGVuY3lOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXRpZXMgPSBuZXdEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkID0gKGV4cG9ydGVkRGF0YVtkZXBlbmRlbmN5TmFtZV0gfHwgW10pLm1hcChlbnRpdHkgPT4gZW50aXR5LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLmZvckVhY2goZW50aXR5SWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZC5pbmRleE9mKGVudGl0eUlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gJiYgKHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0ucHVzaChlbnRpdHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBJSW1wb3J0RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBidWlsdC1pbiBzZWN1cml0eSBncm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzICYmIChleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgPSBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMucmVkdWNlKChyZXN1bHQsIGdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5pZC5pbmRleE9mKFwiR3JvdXBcIikgPT09IC0xICYmIHJlc3VsdC5wdXNoKGdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3R3JvdXBzKG5ld0dyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMobmV3Q3VzdG9tTWFwcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhleHBvcnRlZERhdGEpLmZvckVhY2goKGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGFbZW50aXR5VHlwZV0sIGV4cG9ydGVkRGF0YVtlbnRpdHlUeXBlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKG5ld0RlcGVuZGVuY2llcywgZGF0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShkZXBlbmRlbmNpZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdG9nZ2xlRXhwb3J0QnV0dG9uIChpc0Rpc2FibGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVdhaXRpbmcgPSAoaXNTdGFydCA9IGZhbHNlKSA9PiB7XG4gICAgICAgIGlmIChpc1N0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdGFydCgoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRpbkNvbnRhaW5lclwiKSBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCwgOTk5OSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbihmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RvcCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9CcmV0dCAtIGRpc3BsYXlzIHRoZSBvdXRwdXQgb24gdGhlIHBhZ2VcbiAgICBwcml2YXRlIHNob3dFbnRpdHlNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIHF0eTogbnVtYmVyLCBlbnRpdHlOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAocXR5KSB7XG4gICAgICAgICAgICBxdHkgPiAxICYmIChlbnRpdHlOYW1lICs9IFwic1wiKTtcbiAgICAgICAgICAgIGxldCBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlXCIpIGFzIEhUTUxFbGVtZW50KS5pbm5lckhUTUw7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7cXVhbnRpdHl9XCIsIHF0eS50b1N0cmluZygpKS5yZXBsYWNlKFwie2VudGl0eX1cIiwgZW50aXR5TmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGBZb3UgaGF2ZSA8c3BhbiBjbGFzcz1cImJvbGRcIj5ub3QgY29uZmlndXJlZCBhbnkgJHsgZW50aXR5TmFtZSB9czwvc3Bhbj4uYDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1N5c3RlbVNldHRpbmdzTWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBpc0luY2x1ZGVkOiBib29sZWFuKSB7XG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPnRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPm5vdCB0byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL2luaXRpYWxpemUgYWRkaW5cbiAgICBjb25zdHJ1Y3RvciAoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgPSBuZXcgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyID0gbmV3IFJlcG9ydHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciA9IG5ldyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlciA9IG5ldyBNaXNjQnVpbGRlcihhcGkpO1xuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgIC8vIHRoaXMudXNlckJ1aWxkZXIgPSBuZXcgVXNlckJ1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy56b25lQnVpbGRlciA9IG5ldyBab25lQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLmFkZEluQnVpbGRlciA9IG5ldyBBZGRJbkJ1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy53YWl0aW5nID0gbmV3IFdhaXRpbmcoKTtcbiAgICB9XG5cbiAgICAvL0JyZXR0OiBleHBvcnRzIHRoZSBkYXRhXG4gICAgZXhwb3J0RGF0YSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXRhKCkudGhlbigocmVwb3J0c0RhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZXBvcnRzID0gcmVwb3J0c0RhdGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xuICAgICAgICAgICAgZG93bmxvYWREYXRhQXNGaWxlKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSksIFwiZXhwb3J0Lmpzb25cIik7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGV4cG9ydCBkYXRhLlxcblBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XG4gICAgfVxuXG4gICAgc2F2ZUNoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgY2hlY2tCb3hWYWx1ZUNoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xuICAgIH1cblxuICAgIGFkZEV2ZW50SGFuZGxlcnMoKSB7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHJlbmRlciAoKSB7XG4gICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cbiAgICAgICAgLy8gdGhpcy5kYXRhLnVzZXJzID0gW107XG4gICAgICAgIHRoaXMuZGF0YS56b25lcyA9IFtdO1xuICAgICAgICB0aGlzLmRhdGEuYWRkaW5zID0gW107XG4gICAgICAgIC8vd2lyZSB1cCB0aGUgZG9tXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcE1lc3NhZ2VUZW1wbGF0ZVwiKSBhcyBIVE1MRWxlbWVudCkuaW5uZXJIVE1MLFxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRTZWN1cml0eUNsZWFyYW5jZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBydWxlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSdWxlc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIGRhc2hib2FyZHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkRGFzaGJvYXJkc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIGFkZGluc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRBZGRpbnNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgLy8gdXNlcnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkVXNlcnNcIiksXG4gICAgICAgICAgICB6b25lc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRab25lc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRTeXN0ZW1TZXR0aW5nc1wiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xuICAgICAgICBjb25zdCB6b25lc1F0eVByb21pc2UgPSB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guY2hlY2tlZD09dHJ1ZSA/IHRoaXMuem9uZUJ1aWxkZXIuZ2V0UXR5KCkgOiBQcm9taXNlLnJlc29sdmUoMCk7XG4gICAgICAgIHJldHVybiB6b25lc1F0eVByb21pc2UudGhlbigoem9uZXNRdHkpID0+IHtcbiAgICAgICAgICAgIGlmICh6b25lc1F0eSA+IDEwMDAwKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJUaGUgbnVtYmVyIG9mIHpvbmVzIGluIHRoZSBkYXRhYmFzZSBleGNlZWRzIDEwLDAwMC4gRXhwb3J0aW5nIGFsbCB6b25lcyBtYXkgdGFrZSBhIGxvbmcgdGltZSBhbmQgY291bGQgcG90ZW50aWFsbHkgdGltZSBvdXQuIFdlIHR1cm5lZCBvZmYgdGhlICdFeHBvcnQgQWxsIFpvbmVzJyBvcHRpb24gdG8gcHJldmVudCB0aGlzLlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2godGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpLFxuICAgICAgICAgICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cbiAgICAgICAgICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAgICAgdGhpcy56b25lQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5CdWlsZGVyLmZldGNoKClcbiAgICAgICAgICAgIF0pXG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGxldCByZXBvcnRzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZWN1cml0eUdyb3VwcyA9IHJlc3VsdHNbMV07XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyh0aGlzLmRhdGEucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcCA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGVudGl0eSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMocmVzLCBlbnRpdHlEZXApO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgem9uZURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbNl0pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgem9uZXMgdG8gYWxsIGRhdGFiYXNlIHpvbmVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS56b25lcyA9IHJlc3VsdHNbNl07XG4gICAgICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s2XSwgXCJ6b25lc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbN10pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgYWRkaW5zIGVxdWFsIHRvIG5vbmUvZW1wdHkgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFkZGlucyA9IHJlc3VsdHNbN107XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuZGF0YS5taXNjKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IHRoaXMuZGF0YS5hZGRpbnM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICBjdXN0b21NYXAgJiYgdGhpcy5kYXRhLmN1c3RvbU1hcHMucHVzaChjdXN0b21NYXApO1xuICAgICAgICAgICAgcmVwb3J0c0RlcGVuZGVuY2llcyA9IHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5yZXBvcnRzKTtcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XG4gICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHpvbmVEZXBlbmRlbmNpZXMsIHJlcG9ydHNEZXBlbmRlbmNpZXMsIHJ1bGVzRGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWFwUHJvdmlkZXIgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyTmFtZSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrLCB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMubGVuZ3RoLCBcInNlY3VyaXR5IGNsZWFyYW5jZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocnVsZXNCbG9jaywgdGhpcy5kYXRhLnJ1bGVzLmxlbmd0aCwgXCJydWxlXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGRhc2hib2FyZHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXNoYm9hcmRzUXR5KCksIFwiZGFzaGJvYXJkXCIpO1xuICAgICAgICAgICAgaWYgKG1hcFByb3ZpZGVyKSB7XG4gICAgICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgdGhpcy5kYXRhLmFkZGlucz8ubGVuZ3RoIHx8IDAsIFwiYWRkaW5cIik7XG4gICAgICAgICAgICAvLyB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHVzZXJzQmxvY2ssIHRoaXMuZGF0YS51c2Vycy5sZW5ndGgsIFwidXNlclwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoem9uZXNCbG9jaywgdGhpcy5kYXRhLnpvbmVzLmxlbmd0aCwgXCJ6b25lXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlKHN5c3RlbVNldHRpbmdzQmxvY2ssIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKTtcbiAgICAgICAgICAgIC8vdGhpcyBkaXNwbGF5cyBhbGwgdGhlIGRhdGEvb2JqZWN0cyBpbiB0aGUgY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGdldCBjb25maWcgdG8gZXhwb3J0XCIpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCkge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgIH1cbn1cblxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYWRkaW46IEFkZGluO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICBhZGRpbiA9IG5ldyBBZGRpbihhcGkpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9jdXM6ICgpID0+IHtcbiAgICAgICAgICAgIGFkZGluLmFkZEV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmx1cjogKCkgPT4ge1xuICAgICAgICAgICAgYWRkaW4udW5sb2FkKCk7XG4gICAgICAgIH1cbiAgICB9O1xufTsiLCJpbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCBleHRlbmRzIElOYW1lZEVudGl0eSB7XG4gICAgcmVjaXBpZW50czogYW55W107XG4gICAgcnVsZXM6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcbiAgICBydWxlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgZGlzdHJpYnV0aW9uTGlzdHM6IFJlY29yZDxzdHJpbmcsIElEaXN0cmlidXRpb25MaXN0PjtcbiAgICBwcml2YXRlIG5vdGlmaWNhdGlvblRlbXBsYXRlcztcblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXG4gICAgcHJpdmF0ZSBnZXREaXN0cmlidXRpb25MaXN0c0RhdGEgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uV2ViUmVxdWVzdFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvblRleHRUZW1wbGF0ZXNcIiwge31dXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKGRpc3RyaWJ1dGlvbkxpc3RzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcklkID0gcmVjaXBpZW50LnVzZXIuaWQ7XG4gICAgICAgICAgICAgICAgdXNlcklkICYmIGRlcGVuZGVuY2llcy51c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xICYmIGRlcGVuZGVuY2llcy51c2Vycy5wdXNoKHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW1haWxcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1BvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nT25seVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dE1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIldlYlJlcXVlc3RcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIm5vdGlmaWNhdGlvblRlbXBsYXRlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ncm91cCAmJiByZWNpcGllbnQuZ3JvdXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJncm91cHNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrUmVjaXBpZW50cyA9IChyZWNpcGllbnRzLCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWNpcGllbnRzLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCByZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZGlzdHJpYnV0aW9uTGlzdHMucmVkdWNlKChkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0OiBJRGlzdHJpYnV0aW9uTGlzdCkgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnJ1bGVzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLnJ1bGVzLCBkaXN0cmlidXRpb25MaXN0LnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSgpXG4gICAgICAgICAgICAudGhlbigoW2Rpc3RyaWJ1dGlvbkxpc3RzLCB3ZWJUZW1wbGF0ZXMsIGVtYWlsVGVtcGxhdGVzLCB0ZXh0VGVtcGxhdGVzXSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHdlYlRlbXBsYXRlcy5jb25jYXQoZW1haWxUZW1wbGF0ZXMpLmNvbmNhdCh0ZXh0VGVtcGxhdGVzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEgKHRlbXBsYXRlSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kaXN0cmlidXRpb25MaXN0cykucmVkdWNlKChyZXM6IElEaXN0cmlidXRpb25MaXN0W10sIGlkKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNbaWRdO1xuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSwgZXh0ZW5kLCBJRW50aXR5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW50ZXJmYWNlIENvbG9yIHtcbiAgICByOiBudW1iZXI7XG4gICAgZzogbnVtYmVyO1xuICAgIGI6IG51bWJlcjtcbiAgICBhOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdyb3VwIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGNvbG9yPzogQ29sb3I7XG4gICAgcGFyZW50PzogSUdyb3VwO1xuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XG4gICAgdXNlcj86IGFueTtcbn1cblxuaW50ZXJmYWNlIElOZXdHcm91cCBleHRlbmRzIE9taXQ8SUdyb3VwLCBcImlkXCI+IHtcbiAgICBpZDogbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JvdXBzQnVpbGRlciB7XG4gICAgcHJvdGVjdGVkIGFwaTtcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XG4gICAgcHJvdGVjdGVkIGdyb3VwczogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIHRyZWU6IElHcm91cFtdO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcblxuICAgIHByaXZhdGUgdXNlcnM6IGFueTtcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcbiAgICBwcml2YXRlIGdldEdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIlxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIlxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZmluZENoaWxkIChjaGlsZElkOiBzdHJpbmcsIGN1cnJlbnRJdGVtOiBJTmV3R3JvdXAgfCBJR3JvdXAsIG9uQWxsTGV2ZWxzOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXAgfCBudWxsIHtcbiAgICAgICAgbGV0IGZvdW5kQ2hpbGQ6IElHcm91cCB8IG51bGwgPSBudWxsLFxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjdXJyZW50SXRlbS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xuICAgICAgICAgICAgaWYgKGNoaWxkLmlkID09PSBjaGlsZElkKSB7XG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IHRoaXMuZmluZENoaWxkKGNoaWxkSWQsIGNoaWxkLCBvbkFsbExldmVscyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBsZXQgb3V0cHV0VXNlciA9IG51bGwsXG4gICAgICAgICAgICB1c2VySGFzUHJpdmF0ZUdyb3VwID0gKHVzZXIsIGdyb3VwSWQpOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwLmlkID09PSBncm91cElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJIYXNQcml2YXRlR3JvdXAodXNlciwgZ3JvdXBJZCkpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRVc2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgbmFtZTogXCJQcml2YXRlVXNlckdyb3VwTmFtZVwiLFxuICAgICAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBQcml2YXRlVXNlcklkXCIsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IGlkOiBncm91cElkIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RlY3RlZCBjcmVhdGVHcm91cHNUcmVlIChncm91cHM6IElHcm91cFtdKTogYW55W10ge1xuICAgICAgICBsZXQgbm9kZUxvb2t1cCxcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbjogSUdyb3VwW10sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJpbmc7XG5cbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjaGlsZHJlbltpXS5pZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVMb29rdXBbaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXSA9IG5vZGVMb29rdXBbaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBub2RlTG9va3VwID0gZW50aXR5VG9EaWN0aW9uYXJ5KGdyb3VwcywgZW50aXR5ID0+IHtcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBleHRlbmQoe30sIGVudGl0eSk7XG4gICAgICAgICAgICBpZiAobmV3RW50aXR5LmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgbmV3RW50aXR5LmNoaWxkcmVuID0gbmV3RW50aXR5LmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3RW50aXR5O1xuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBub2RlTG9va3VwW2tleV0gJiYgdHJhdmVyc2VDaGlsZHJlbihub2RlTG9va3VwW2tleV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobm9kZUxvb2t1cCkubWFwKGtleSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXG4gICAgICAgICAgICAudGhlbigoW2dyb3VwcywgdXNlcnNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBleHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGZvdW5kSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQ6IElHcm91cFtdID0gW10sXG4gICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMgPSAoaXRlbTogSUdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1Db3B5ID0gZXh0ZW5kKHt9LCBpdGVtKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMoaXRlbS5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvcHkucGFyZW50ID0gaXRlbS5wYXJlbnQgPyB7aWQ6IGl0ZW0ucGFyZW50LmlkLCBuYW1lOiBpdGVtLnBhcmVudC5uYW1lfSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZENvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkgPSBleHRlbmQoe30sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5wYXJlbnQgPSBjaGlsZENvcHkucGFyZW50ID8ge2lkOiBjaGlsZENvcHkucGFyZW50LmlkLCBuYW1lOiBjaGlsZENvcHkucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRQYXJlbnRzKTtcbiAgICAgICAgIW5vdEluY2x1ZGVDaGlsZHJlbiAmJiBncm91cHMuZm9yRWFjaChtYWtlRmxhdENoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogdGhpcy50cmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIG5vdEluY2x1ZGVDaGlsZHJlbik7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRDdXN0b21Hcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIGFsbEdyb3VwczogSUdyb3VwW10pOiBJR3JvdXBbXSB7XG4gICAgICAgIGxldCBncm91cHNUcmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGFsbEdyb3VwcyksXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT5cbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHM6IElHcm91cFtdKSB7XG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VyczogSUVudGl0eVtdLCBncm91cCkgPT4ge1xuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XG4gICAgICAgICAgICByZXR1cm4gdXNlcnM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9O1xuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH07XG59IiwiaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBUTWFwUHJvdmlkZXJUeXBlID0gXCJkZWZhdWx0XCIgfCBcImFkZGl0aW9uYWxcIiB8IFwiY3VzdG9tXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcbiAgICBtYXBQcm92aWRlcjoge1xuICAgICAgICB2YWx1ZTogc3RyaW5nO1xuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xuICAgIH07XG4gICAgY3VycmVudFVzZXI6IGFueTtcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcbiAgICBhZGRpbnM6IHN0cmluZ1tdO1xuICAgIHB1cmdlU2V0dGluZ3M/OiBhbnk7XG4gICAgZW1haWxTZW5kZXJGcm9tPzogc3RyaW5nO1xuICAgIGN1c3RvbWVyQ2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gICAgaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkPzogYm9vbGVhbjtcbiAgICBpc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkPzogYm9vbGVhbjtcbn1cblxuXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VzdG9tTWFwUHJvdmlkZXJzO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcbiAgICBwcml2YXRlIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdE1hcFByb3ZpZGVycyA9IHtcbiAgICAgICAgR29vZ2xlTWFwczogXCJHb29nbGUgTWFwc1wiLFxuICAgICAgICBIZXJlOiBcIkhFUkUgTWFwc1wiLFxuICAgICAgICBNYXBCb3g6IFwiTWFwQm94XCJcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIE1pc2MgYnVpbGRlciAoc3lzdGVtIHNldHRpbmdzKSB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxuICAgIGZldGNoIChpbmNsdWRlU3lzU2V0dGluZ3M6IGJvb2xlYW4pOiBQcm9taXNlPElNaXNjRGF0YT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VyTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJTeXN0ZW1TZXR0aW5nc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgY3VycmVudFVzZXIgPSByZXN1bHRbMF1bMF0gfHwgcmVzdWx0WzBdLFxuICAgICAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzID0gcmVzdWx0WzFdWzBdIHx8IHJlc3VsdFsxXSxcbiAgICAgICAgICAgICAgICB1c2VyTWFwUHJvdmlkZXJJZCA9IGN1cnJlbnRVc2VyLmRlZmF1bHRNYXBFbmdpbmUsXG4gICAgICAgICAgICAgICAgZGVmYXVsdE1hcFByb3ZpZGVySWQgPSBzeXN0ZW1TZXR0aW5ncy5tYXBQcm92aWRlcixcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcklkID0gdGhpcy5nZXRNYXBQcm92aWRlclR5cGUodXNlck1hcFByb3ZpZGVySWQpID09PSBcImN1c3RvbVwiID8gdXNlck1hcFByb3ZpZGVySWQgOiBkZWZhdWx0TWFwUHJvdmlkZXJJZDtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXIgPSBjdXJyZW50VXNlcjtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XG4gICAgICAgICAgICB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dVbnNpZ25lZEFkZEluO1xuICAgICAgICAgICAgbGV0IG91dHB1dDogSU1pc2NEYXRhID0ge1xuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZShtYXBQcm92aWRlcklkKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWRkaW5zOiBbXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50VXNlcjogdGhpcy5jdXJyZW50VXNlcixcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpbmNsdWRlU3lzU2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVyZ2VTZXR0aW5ncyA9IHN5c3RlbVNldHRpbmdzLnB1cmdlU2V0dGluZ3M7XG4gICAgICAgICAgICAgICAgb3V0cHV0LmVtYWlsU2VuZGVyRnJvbSA9IHN5c3RlbVNldHRpbmdzLmVtYWlsU2VuZGVyRnJvbTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbiA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb247XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzTWFya2V0cGxhY2VQdXJjaGFzZXNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dNYXJrZXRwbGFjZVB1cmNoYXNlcztcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Jlc2VsbGVyQXV0b0xvZ2luO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyVHlwZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogVE1hcFByb3ZpZGVyVHlwZSB7XG4gICAgICAgIHJldHVybiAhbWFwUHJvdmlkZXJJZCB8fCB0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gPyBcImRlZmF1bHRcIiA6IFwiY3VzdG9tXCI7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJOYW1lIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbXBvcnQgeyBJR3JvdXAgfSBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgeyBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcywgSVNjb3BlR3JvdXBGaWx0ZXIgfSBmcm9tIFwiLi9zY29wZUdyb3VwRmlsdGVyXCI7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuXG5jb25zdCBSRVBPUlRfVFlQRV9EQVNIQk9BRCA9IFwiRGFzaGJvYXJkXCI7XG5cbmludGVyZmFjZSBJU2VydmVyUmVwb3J0IGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cHM6IElHcm91cFtdO1xuICAgIGluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwczogSUdyb3VwW107XG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XG4gICAgaW5kaXZpZHVhbFJlY2lwaWVudHM6IElJZEVudGl0eVtdO1xuICAgIHNjb3BlR3JvdXBzOiBJR3JvdXBbXTtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSUlkRW50aXR5O1xuICAgIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XG4gICAgbGFzdE1vZGlmaWVkVXNlcjtcbiAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcbiAgICAgICAgZGV2aWNlcz86IGFueVtdO1xuICAgICAgICB6b25lVHlwZUxpc3Q/OiBhbnlbXTtcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG4gICAgfTtcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuaW50ZXJmYWNlIElSZXBvcnQgZXh0ZW5kcyBJU2VydmVyUmVwb3J0IHtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSVNjb3BlR3JvdXBGaWx0ZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcG9ydERlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogc3RyaW5nW107XG4gICAgcnVsZXM6IHN0cmluZ1tdO1xuICAgIHpvbmVUeXBlczogc3RyaW5nW107XG4gICAgZ3JvdXBzOiBzdHJpbmdbXTtcbiAgICB1c2Vyczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBJUmVwb3J0VGVtcGxhdGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcbiAgICByZXBvcnREYXRhU291cmNlOiBzdHJpbmc7XG4gICAgcmVwb3J0VGVtcGxhdGVUeXBlOiBzdHJpbmc7XG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xuICAgIGJpbmFyeURhdGE/OiBzdHJpbmc7XG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgYWxsUmVwb3J0czogSVJlcG9ydFtdO1xuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgcHJpdmF0ZSBkYXNoYm9hcmRzTGVuZ3RoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBhbGxUZW1wbGF0ZXM6IElSZXBvcnRUZW1wbGF0ZVtdO1xuXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xuICAgICAgICAgICAgICAgICAgICBcImluY2x1ZGVUZW1wbGF0ZURldGFpbHNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXREYXNoYm9hcmRJdGVtc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVTY29wZUdyb3VwRmlsdGVycyAocmVwb3J0czogSVNlcnZlclJlcG9ydFtdKTogUHJvbWlzZTxJUmVwb3J0W10+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdHMgPSByZXBvcnRzLnJlZHVjZSgocmVzLCByZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiByZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZCkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuaWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10gYXMgYW55W10pO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXF1ZXN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcG9ydHMgYXMgSVJlcG9ydFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHMsIChncm91cEZpbHRlcnM6IElTY29wZUdyb3VwRmlsdGVyW11bXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVucGFja2VkRmlsdGVyID0gZ3JvdXBGaWx0ZXJzLm1hcChpdGVtID0+IEFycmF5LmlzQXJyYXkoaXRlbSkgPyBpdGVtWzBdIDogaXRlbSlcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZUdyb3VwRmlsdGVySGFzaCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShlbnBhY2tlZEZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXBvcnRzLm1hcChyZXBvcnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ucmVwb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVHcm91cEZpbHRlcjogcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIgJiYgc2NvcGVHcm91cEZpbHRlckhhc2hbcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuaWRdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSZXBvcnRzIChyZXBvcnRzLCB0ZW1wbGF0ZXMpIHtcbiAgICAgICAgbGV0IGZpbmRUZW1wbGF0ZVJlcG9ydHMgPSAodGVtcGxhdGVJZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnRzLmZpbHRlcihyZXBvcnQgPT4gcmVwb3J0LnRlbXBsYXRlLmlkID09PSB0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZXMucmVkdWNlKChyZXMsIHRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVwb3J0cyA9IGZpbmRUZW1wbGF0ZVJlcG9ydHModGVtcGxhdGVJZCk7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZXBvcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLnJlcG9ydHMgPSB0ZW1wbGF0ZVJlcG9ydHM7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlVGVtcGxhdGUgKG5ld1RlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlKSB7XG4gICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzLnNvbWUoKHRlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLmlkID09PSBuZXdUZW1wbGF0ZURhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlc1tpbmRleF0gPSBuZXdUZW1wbGF0ZURhdGE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSZXBvcnRzKClcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgLi4ucmVzdF0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW3RoaXMucG9wdWxhdGVTY29wZUdyb3VwRmlsdGVycyhyZXBvcnRzKSwgLi4ucmVzdF0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCB0ZW1wbGF0ZXMsIGRhc2hib2FyZEl0ZW1zXSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYWxsUmVwb3J0cyA9IHJlcG9ydHM7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMgPSB0ZW1wbGF0ZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRzTGVuZ3RoID0gZGFzaGJvYXJkSXRlbXMgJiYgZGFzaGJvYXJkSXRlbXMubGVuZ3RoID8gZGFzaGJvYXJkSXRlbXMubGVuZ3RoIDogMDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHJlcG9ydHMsIHRlbXBsYXRlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocmVwb3J0czogSVJlcG9ydFRlbXBsYXRlW10pOiBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IGFsbERlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJlcG9ydHMucmVkdWNlKChyZXBvcnRzRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwb3J0cy5yZWR1Y2UoKHRlbXBsYXRlRGVwZW5kZWNpZXMsIHJlcG9ydCkgPT4ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzID1cbiAgICAgICAgICAgICAgICAgICAgVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMsXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5ncm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzKSxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuc2NvcGVHcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcyhyZXBvcnQuc2NvcGVHcm91cEZpbHRlci5ncm91cEZpbHRlckNvbmRpdGlvbikgfHwgW10pKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnVzZXJzID0gVXRpbHMubWVyZ2VVbmlxdWUoXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMudXNlcnMsIHJlcG9ydC5pbmRpdmlkdWFsUmVjaXBpZW50cyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5kaXZpZHVhbFJlY2lwaWVudHMpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMucnVsZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5ydWxlcykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzID0gVXRpbHMubWVyZ2VVbmlxdWUoXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0ICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0KSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGVwZW5kZWNpZXM7XG4gICAgICAgICAgICB9LCByZXBvcnRzRGVwZW5kZW5jaWVzKTtcbiAgICAgICAgfSwgYWxsRGVwZW5kZW5jaWVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGF0YSAoKTogUHJvbWlzZTxJUmVwb3J0VGVtcGxhdGVbXT4ge1xuICAgICAgICBsZXQgcG9ydGlvblNpemUgPSAxNSxcbiAgICAgICAgICAgIHBvcnRpb25zID0gdGhpcy5hbGxUZW1wbGF0ZXMucmVkdWNlKChyZXF1ZXN0czogYW55W10sIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlLmlzU3lzdGVtICYmICF0ZW1wbGF0ZS5iaW5hcnlEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3J0aW9uSW5kZXg6IG51bWJlciA9IHJlcXVlc3RzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdHNbcG9ydGlvbkluZGV4XSB8fCByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLmxlbmd0aCA+PSBwb3J0aW9uU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5wdXNoKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9ydGlvbkluZGV4ICsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW3BvcnRpb25JbmRleF0ucHVzaChbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RzO1xuICAgICAgICAgICAgfSwgW10pLFxuICAgICAgICAgICAgdG90YWxSZXN1bHRzOiBhbnlbXVtdID0gW10sXG4gICAgICAgICAgICBnZXRQb3J0aW9uRGF0YSA9IHBvcnRpb24gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHBvcnRpb24sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IFtdO1xuXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gcG9ydGlvbnMucmVkdWNlKChwcm9taXNlcywgcG9ydGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlc1xuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRQb3J0aW9uRGF0YShwb3J0aW9uKSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMgPSB0b3RhbFJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zID0gZXJyb3JQb3J0aW9ucy5jb25jYXQocG9ydGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sIFV0aWxzLnJlc29sdmVkUHJvbWlzZShbXSkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucy5sZW5ndGggJiYgY29uc29sZS53YXJuKGVycm9yUG9ydGlvbnMpO1xuICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cy5mb3JFYWNoKHRlbXBsYXRlRGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlID0gdGVtcGxhdGVEYXRhLmxlbmd0aCA/IHRlbXBsYXRlRGF0YVswXSA6IHRlbXBsYXRlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyh0aGlzLmFsbFJlcG9ydHMsIHRoaXMuYWxsVGVtcGxhdGVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkc1F0eSAoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFzaGJvYXJkc0xlbmd0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkgKCk6IG51bWJlciB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHJldHVybiAodGhpcy5hbGxSZXBvcnRzLmZpbHRlcigocmVwb3J0OiBJUmVwb3J0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHJlcG9ydC50ZW1wbGF0ZS5pZCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUV4aXN0czogYm9vbGVhbiA9IHRlbXBsYXRlcy5pbmRleE9mKHRlbXBsYXRlSWQpID4gLTEsXG4gICAgICAgICAgICAgICAgaXNDb3VudDogYm9vbGVhbiA9ICF0ZW1wbGF0ZUV4aXN0cyAmJiByZXBvcnQubGFzdE1vZGlmaWVkVXNlciAhPT0gXCJOb1VzZXJJZFwiO1xuICAgICAgICAgICAgaXNDb3VudCAmJiB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIHJldHVybiBpc0NvdW50O1xuICAgICAgICB9KSkubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiYWRkaW4uZC50c1wiLz5cbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgSVJ1bGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwczogYW55W107XG4gICAgY29uZGl0aW9uOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lczogYW55W107XG4gICAgem9uZVR5cGVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xufVxuXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSdWxlc0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjb21iaW5lZFJ1bGVzO1xuXG4gICAgcHJpdmF0ZSBnZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcgKHJ1bGU6IElSdWxlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERlcGVuZGVuY2llcyhbcnVsZV0pLmRpYWdub3N0aWNzLnNvcnQoKS5qb2luKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRSdWxlcyAoKTogUHJvbWlzZTxJUnVsZVtdPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSdWxlXCJcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJSdWxlXCIsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZVR5cGU6IFwiUm91dGVCYXNlZE1hdGVyaWFsTWdtdFwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgXSwgKFthbGxSdWxlcywgbWF0ZXJpYWxNYW5hZ2VtZW50UnVsZXNdOiBbSVJ1bGVbXSwgSVJ1bGVbXV0pID0+IHtcbiAgICAgICAgICAgICAgICAvLyBUbyBnZXQgY29ycmVjdCBTZXJ2aWNlIGdyb3VwcyB3ZSBuZWVkIHRvIHVwZGF0ZSBtYXRlcmlhbCBtYW5hZ2VtZW50IHN0b2NrIHJ1bGVzJyBncm91cHMgZnJvbSBncm91cHMgcHJvcGVydHkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgcnVsZSB3aXRoIFJvdXRlQmFzZWRNYXRlcmlhbE1nbXQgYmFzZVR5cGVcbiAgICAgICAgICAgICAgICAvLyBUaGUgb25seSBwb3NzaWJsZSBtZXRob2Qgbm93IHRvIG1hdGNoIFN0b2NrIHJ1bGUgYW5kIHJ1bGUgd2l0aCBSb3V0ZUJhc2VkTWF0ZXJpYWxNZ210IGJhc2VUeXBlIGlzIHRvIG1hdGNoIHRoZWlyIGRpYWdub3N0aWNzXG4gICAgICAgICAgICAgICAgY29uc3QgbW1SdWxlc0dyb3VwcyA9IG1hdGVyaWFsTWFuYWdlbWVudFJ1bGVzLnJlZHVjZSgocmVzOiBSZWNvcmQ8c3RyaW5nLCBJSWRFbnRpdHlbXT4sIG1tUnVsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtbVJ1bGVEaWFnbm9zdGljcyA9IHRoaXMuZ2V0UnVsZURpYWdub3N0aWNzU3RyaW5nKG1tUnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc1ttbVJ1bGVEaWFnbm9zdGljc10gPSBtbVJ1bGUuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShhbGxSdWxlcy5tYXAocnVsZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1tUnVsZURpYWdub3N0aWNzID0gdGhpcy5nZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcocnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvcnJlc3BvbmRpbmdNTVJ1bGVHcm91cHMgPSBtbVJ1bGVzR3JvdXBzW21tUnVsZURpYWdub3N0aWNzXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvcnJlc3BvbmRpbmdNTVJ1bGVHcm91cHMgPyB7IC4uLnJ1bGUsIGdyb3VwczogY29ycmVzcG9uZGluZ01NUnVsZUdyb3VwcyB9IDogcnVsZTtcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XG4gICAgICAgIHJldHVybiBzb3J0QXJyYXlPZkVudGl0aWVzKHJ1bGVzLCBbW1wiYmFzZVR5cGVcIiwgXCJkZXNjXCJdLCBcIm5hbWVcIl0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChydWxlczogSVJ1bGVbXSk6IElSdWxlRGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB0eXBlOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24uY29uZGl0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IChjb25kaXRpb24ud29ya1RpbWUgJiYgY29uZGl0aW9uLndvcmtUaW1lLmlkKSB8fCBjb25kaXRpb24ud29ya1RpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRHJpdmVyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkZXZpY2VzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRXhpdGluZ0FyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLnpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBY3RpdmVPckluYWN0aXZlRmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kaWFnbm9zdGljLmlkIHx8IGNvbmRpdGlvbi5kaWFnbm9zdGljO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrQ29uZGl0aW9ucyA9IChwYXJlbnRDb25kaXRpb24sIGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMpOiBJUnVsZURlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25kaXRpb25zLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBjb25kaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMuZ3JvdXBzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLmdyb3VwcywgcnVsZS5ncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKSk7XG4gICAgICAgICAgICBpZiAocnVsZS5jb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UnVsZXMoKVxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRSdWxlcyA9IGVudGl0eVRvRGljdGlvbmFyeShzd2l0Y2hlZE9uUnVsZXMpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSh0aGlzLmNvbWJpbmVkUnVsZXNbQVBQTElDQVRJT05fUlVMRV9JRF0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xuICAgICAgICByZXR1cm4gcnVsZXNJZHMubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cblxuY29uc3QgZW51bSBSZWxhdGlvbk9wZXJhdG9yIHtcbiAgICBcIkFORFwiID0gXCJBbmRcIixcbiAgICBcIk9SXCIgPSBcIk9yXCJcbn1cblxuaW50ZXJmYWNlIElPdXRwdXRJZEVudGl0eSB7XG4gICAgZ3JvdXBJZDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQgZXh0ZW5kcyBJT3V0cHV0SWRFbnRpdHkgPSBJT3V0cHV0SWRFbnRpdHk+IHtcbiAgICByZWxhdGlvbjogUmVsYXRpb25PcGVyYXRvcjtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbnM6IChUIHwgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQ+KVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTY29wZUdyb3VwRmlsdGVyIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbjogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5O1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29tbWVudD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGdldFNjb3BlR3JvdXBGaWx0ZXJCeUlkID0gKGlkOiBzdHJpbmcsIGFwaSk6IFByb21pc2U8SVNjb3BlR3JvdXBGaWx0ZXI+ID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBhcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgc2VhcmNoOiB7IGlkIH1cbiAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IGlzRmlsdGVyU3RhdGUgPSA8VCwgVT4oaXRlbTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KTogaXRlbSBpcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgPT4gaXRlbSAmJiAoaXRlbSBhcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQpLnJlbGF0aW9uICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcyA9IChzdGF0ZTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KSA9PiB7XG4gICAgbGV0IGdyb3VwSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHByb2Nlc3NJdGVtID0gKGl0ZW06SUdyb3VwTGlzdFN0YXRlT3V0cHV0LCBwcmV2UmVzID0gW10gYXMgSUlkRW50aXR5W10pOiBJSWRFbnRpdHlbXSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmdyb3VwRmlsdGVyQ29uZGl0aW9ucy5yZWR1Y2UoKHJlcywgY2hpbGRJdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNGaWx0ZXJTdGF0ZShjaGlsZEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJdGVtKGNoaWxkSXRlbSwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpZCA9IGNoaWxkSXRlbS5ncm91cElkO1xuICAgICAgICAgICAgZ3JvdXBJZHMuaW5kZXhPZihpZCkgPT09IC0xICYmIHJlcy5wdXNoKHsgaWQgfSk7XG4gICAgICAgICAgICBncm91cElkcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIHByZXZSZXMpO1xuICAgIH07XG4gICAgcmV0dXJuIGlzRmlsdGVyU3RhdGUoc3RhdGUpID8gcHJvY2Vzc0l0ZW0oc3RhdGUpIDogW3sgaWQ6IHN0YXRlLmdyb3VwSWQgfV07XG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBleHRlbmRzIEdyb3Vwc0J1aWxkZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoYXBpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFNlY3VyaXR5R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRTZWN1cml0eUdyb3VwcygpXG4gICAgICAgICAgICAudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xuICAgIGdldDogKCkgPT4gc3RyaW5nO1xuICAgIHNldDogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG50eXBlIElTb3J0UHJvcGVydHkgPSBzdHJpbmcgfCBbc3RyaW5nLCBcImFzY1wiIHwgXCJkZXNjXCJdO1xuXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xuICAgICAgICB2YXIgcGFyYW0gPSB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSBcInN0cmluZ1wiID8gXCJjbGFzc05hbWVcIiA6IFwiYmFzZVZhbFwiO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsW3BhcmFtXSB8fCBcIlwiO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgICAgICBlbFtwYXJhbV0gPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgaXNVc3VhbE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xuICAgIFtpZDogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXG4gICAgICAgIG5ld0NsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjbGFzc0l0ZW0gPT4gY2xhc3NJdGVtICE9PSBuYW1lKTtcbiAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQobmV3Q2xhc3Nlcy5qb2luKFwiIFwiKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIik7XG4gICAgaWYgKGNsYXNzZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzKGVsOiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlbCAmJiBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKS5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxuICAgICAgICBzcmMsIHNyY0tleXMsIHNyY0F0dHIsXG4gICAgICAgIGZ1bGxDb3B5ID0gZmFsc2UsXG4gICAgICAgIHJlc0F0dHIsXG4gICAgICAgIHJlcyA9IGFyZ3NbMF0sIGkgPSAxLCBqO1xuXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZ1bGxDb3B5ID0gcmVzO1xuICAgICAgICByZXMgPSBhcmdzWzFdO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIHdoaWxlIChpICE9PSBsZW5ndGgpIHtcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcbiAgICAgICAgc3JjS2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBzcmNLZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgaWYgKGZ1bGxDb3B5ICYmIChpc1VzdWFsT2JqZWN0KHNyY0F0dHIpIHx8IEFycmF5LmlzQXJyYXkoc3JjQXR0cikpKSB7XG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcbiAgICAgICAgICAgICAgICBleHRlbmQoZnVsbENvcHksIHJlc0F0dHIsIHNyY0F0dHIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW50aXR5VG9EaWN0aW9uYXJ5KGVudGl0aWVzOiBhbnlbXSwgZW50aXR5Q2FsbGJhY2s/OiAoZW50aXR5OiBhbnkpID0+IGFueSk6IElIYXNoIHtcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXG4gICAgICAgIGwgPSBlbnRpdGllcy5sZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChlbnRpdGllc1tpXSkge1xuICAgICAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV0uaWQgPyBlbnRpdGllc1tpXSA6IHtpZDogZW50aXRpZXNbaV19O1xuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcbiAgICBsZXQgY29tcGFyYXRvciA9IChwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXM6IGFueVtdLCBpbmRleCA9IDApID0+IHtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3B0aW9ucyA9IHByb3BlcnRpZXNbaW5kZXhdLFxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxuICAgICAgICAgICAgZGlyTXVsdGlwbGllcjogbnVtYmVyO1xuICAgICAgICBkaXJNdWx0aXBsaWVyID0gZGlyID09PSBcImFzY1wiID8gMSA6IC0xO1xuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gMSAqIGRpck11bHRpcGxpZXI7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldkl0ZW1bcHJvcGVydHldIDwgbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzLCBpbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gZW50aXRpZXMuc29ydCgocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZG93bmxvYWREYXRhQXNGaWxlKGRhdGE6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgbWltZVR5cGUgPSBcInRleHQvanNvblwiKSB7XG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiBtaW1lVHlwZX0pLFxuICAgICAgICBlbGVtO1xuICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgZWxlbS5jbGljaygpO1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XG4gICAgbGV0IGFkZGVkSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICBtZXJnZWRJdGVtczogSUVudGl0eVtdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5pZCAmJiBhZGRlZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xuICAgICAgICAgICAgYWRkZWRJZHMucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGVudGl0aWVzTGlzdCkgJiYgZW50aXRpZXNMaXN0LnJlZHVjZSgocmVzdWx0OiBzdHJpbmdbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBbXSkgfHwgW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZSAoLi4uc291cmNlczogc3RyaW5nW11bXSk6IHN0cmluZ1tdIHtcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSAmJiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcbiAgICBsZXQgc2VsZWN0ZWRFbnRpdGllc0hhc2ggPSBlbnRpdHlUb0RpY3Rpb25hcnkoZXhpc3RlZEVudGl0aWVzKTtcbiAgICByZXR1cm4gbmV3RW50aXRpZXMucmVkdWNlKChyZXM6IElFbnRpdHlbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgICFzZWxlY3RlZEVudGl0aWVzSGFzaFtlbnRpdHkuaWRdICYmIHJlcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSwgW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZXRoZXIocHJvbWlzZXM6IFByb21pc2U8YW55PltdKTogUHJvbWlzZTxhbnk+IHtcbiAgICBsZXQgcmVzdWx0czogYW55W10gPSBbXSxcbiAgICAgICAgcmVzdWx0c0NvdW50ID0gMDtcbiAgICByZXN1bHRzLmxlbmd0aCA9IHByb21pc2VzLmxlbmd0aDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgcmVzb2x2ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICB9O1xuICAgICAgICBwcm9taXNlcy5sZW5ndGggPyBwcm9taXNlcy5mb3JFYWNoKChwcm9taXNlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQgPT09IHByb21pc2VzLmxlbmd0aCAmJiByZXNvbHZlQWxsKCk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVkUHJvbWlzZTxUPiAodmFsPzogVCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPihyZXNvbHZlID0+IHJlc29sdmUodmFsKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChkYXRhKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xufVxuXG5jb25zdCBpc0xlYWZHcm91cEZpbHRlckNvbmRpdGlvbiA9IChncm91cEZpbHRlckNvbmRpdGlvbjogVEdyb3VwRmlsdGVyQ29uZGl0aW9uKTogZ3JvdXBGaWx0ZXJDb25kaXRpb24gaXMgSUxlYWZHcm91cEZpbHRlckNvbmRpdGlvbiA9PiB7XG4gICAgcmV0dXJuICEhKGdyb3VwRmlsdGVyQ29uZGl0aW9uIGFzIElMZWFmR3JvdXBGaWx0ZXJDb25kaXRpb24pLmdyb3VwSWQ7XG59XG5cbmV4cG9ydCBjb25zdCBnZXRHcm91cEZpbHRlckdyb3VwcyA9IChncm91cEZpbHRlckNvbmRpdGlvbj86IFRHcm91cEZpbHRlckNvbmRpdGlvbiwgcHJldkdyb3VwSWRzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpKSA9PiB7XG4gICAgaWYgKCFncm91cEZpbHRlckNvbmRpdGlvbikge1xuICAgICAgICByZXR1cm4gcHJldkdyb3VwSWRzO1xuICAgIH1cbiAgICBjb25zdCBncm91cHM6IFNldDxzdHJpbmc+ID0gaXNMZWFmR3JvdXBGaWx0ZXJDb25kaXRpb24oZ3JvdXBGaWx0ZXJDb25kaXRpb24pXG4gICAgICAgID8gbmV3IFNldChbLi4ucHJldkdyb3VwSWRzLCBncm91cEZpbHRlckNvbmRpdGlvbi5ncm91cElkXSlcbiAgICAgICAgOiBncm91cEZpbHRlckNvbmRpdGlvbi5ncm91cEZpbHRlckNvbmRpdGlvbnMucmVkdWNlKChyZXMsIGNoaWxkR3JvdXBGaWx0ZXJDb25kaXRpb24pID0+IGdldEdyb3VwRmlsdGVyR3JvdXBzKGNoaWxkR3JvdXBGaWx0ZXJDb25kaXRpb24sIHJlcyksIHByZXZHcm91cElkcyk7XG4gICAgcmV0dXJuIGdyb3Vwcztcbn07IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2FpdGluZyB7XG5cbiAgICBwcml2YXRlIHdhaXRpbmdDb250YWluZXI6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgYm9keUVsOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICBwdWJsaWMgc3RhcnQoZWw6IEhUTUxFbGVtZW50ID0gdGhpcy5ib2R5RWwsIHpJbmRleD86IG51bWJlcikge1xuICAgICAgICBpZiAoZWwub2Zmc2V0UGFyZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwiZXJjLXdhaXRpbmdcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJlcmMtd2FpdGluZ19fb3ZlcmxheVwiPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImVyYy13YWl0aW5nX19zcGlubmVyLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJlcmMtd2FpdGluZ19fc3Bpbm5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgNjQgNjRcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkZWZzPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD1cInNwaW5uZXJHcmFkaWVudFwiIHgxPVwiMFwiIHkxPVwiMFwiIHgyPVwiMVwiIHkyPVwiMFwiIGdyYWRpZW50VW5pdHM9XCJvYmplY3RCb3VuZGluZ0JveFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCIwJVwiIHN0b3AtY29sb3I9XCJ2YXIoLS1lcmMtY29sb3ItcHJpbWFyeSlcIiBzdG9wLW9wYWNpdHk9XCIxXCI+PC9zdG9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCIzMy4zMyVcIiBzdG9wLWNvbG9yPVwidmFyKC0tZXJjLWNvbG9yLXByaW1hcnkpXCIgc3RvcC1vcGFjaXR5PVwiMC44XCI+PC9zdG9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCI1MCVcIiBzdG9wLWNvbG9yPVwidmFyKC0tZXJjLWNvbG9yLXByaW1hcnkpXCIgc3RvcC1vcGFjaXR5PVwiMC41XCI+PC9zdG9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCI2Ni42NyVcIiBzdG9wLWNvbG9yPVwidmFyKC0tZXJjLWNvbG9yLXByaW1hcnkpXCIgc3RvcC1vcGFjaXR5PVwiMC4yXCI+PC9zdG9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cInZhcigtLWVyYy1jb2xvci1wcmltYXJ5KVwiIHN0b3Atb3BhY2l0eT1cIjBcIj48L3N0b3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saW5lYXJHcmFkaWVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGVmcz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGNsYXNzPVwiZXJjLXdhaXRpbmdfX3NwaW5uZXItYW5pbWF0aW9uXCIgc3Ryb2tlPVwidXJsKCNzcGlubmVyR3JhZGllbnQpXCIgc3Ryb2tlLXdpZHRoPVwiNlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBkPVwiTSAzMiA0IEEgMjggMjggMCAxIDEgMzIgNjAgQSAyOCAyOCAwIDEgMSAzMiA0IFpcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgICAgIGVsLnBhcmVudE5vZGU/LmFwcGVuZENoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XG5cbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUud2lkdGggPSBlbC5vZmZzZXRXaWR0aCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGVsLm9mZnNldEhlaWdodCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnRvcCA9IGVsLm9mZnNldFRvcCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBlbC5vZmZzZXRMZWZ0ICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgdHlwZW9mIHpJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAodGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHpJbmRleC50b1N0cmluZygpKTtcbiAgICB9O1xuXG4gICAgcHVibGljIHN0b3AgKCkge1xuICAgICAgICBpZiAodGhpcy53YWl0aW5nQ29udGFpbmVyICYmIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn0iLCIvL2FkZGVkIGJ5IEJyZXR0IHRvIG1hbmFnZSBhZGRpbmcgYWxsIHpvbmVzIHRvIHRoZSBleHBvcnQgYXMgYW4gb3B0aW9uXG5cbmV4cG9ydCBjbGFzcyBab25lQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgZ2V0Wm9uZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiWm9uZVwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFpvbmVzUXR5ICgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldENvdW50T2ZcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJab25lXCJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRab25lcygpXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIGdldFF0eSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFpvbmVzUXR5KClcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iXX0=
