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
        return (0, utils_1.together)([
            //loads the groups. This is where users are added if they are linked to a group
            this.groupsBuilder.fetch(),
            //loads the security groups (security clearance in user admin in MyG)
            this.securityClearancesBuilder.fetch(),
            //report loader...seems obsolete to me
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            //misc = system settings
            this.miscBuilder.fetch(this.exportSystemSettingsCheckbox.checked),
            //TODO: Brett - left here as I will be introducing the user fetch soon
            // this.userBuilder.fetch(),
            this.zoneBuilder.fetch(),
            this.addInBuilder.fetch()
        ]).then((results) => {
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
            addin.render();
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
exports.getGroupFilterGroups = exports.toArray = exports.resolvedPromise = exports.together = exports.getUniqueEntities = exports.mergeUnique = exports.getEntitiesIds = exports.mergeUniqueEntities = exports.downloadDataAsFile = exports.sortArrayOfEntities = exports.entityToDictionary = exports.extend = exports.hasClass = exports.addClass = exports.removeClass = void 0;
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
exports.removeClass = removeClass;
function addClass(el, name) {
    if (!el) {
        return;
    }
    let classesStr = classNameCtrl(el).get(), classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}
exports.addClass = addClass;
function hasClass(el, className) {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}
exports.hasClass = hasClass;
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
exports.extend = extend;
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
exports.entityToDictionary = entityToDictionary;
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
exports.sortArrayOfEntities = sortArrayOfEntities;
function downloadDataAsFile(data, filename, mimeType = "text/json") {
    let blob = new Blob([data], { type: mimeType }), elem;
    elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}
exports.downloadDataAsFile = downloadDataAsFile;
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
exports.mergeUniqueEntities = mergeUniqueEntities;
function getEntitiesIds(entitiesList) {
    return Array.isArray(entitiesList) && entitiesList.reduce((result, entity) => {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}
exports.getEntitiesIds = getEntitiesIds;
function mergeUnique(...sources) {
    let mergedItems = [];
    sources.forEach(source => {
        Array.isArray(source) && source.forEach(item => {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}
exports.mergeUnique = mergeUnique;
function getUniqueEntities(newEntities, existedEntities) {
    let selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce((res, entity) => {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}
exports.getUniqueEntities = getUniqueEntities;
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
exports.together = together;
function resolvedPromise(val) {
    return new Promise(resolve => resolve(val));
}
exports.resolvedPromise = resolvedPromise;
function toArray(data) {
    return Array.isArray(data) ? data : [data];
}
exports.toArray = toArray;
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
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<div class='fader'></div><div class='spinner'></div>";
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
    //fills the user builder with all users
    fetch() {
        this.abortCurrentTask();
        this.currentTask = this.getZones();
        return this.currentTask;
    }
    getZones() {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    }
    unload() {
        this.abortCurrentTask();
    }
}
exports.ZoneBuilder = ZoneBuilder;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZEluQnVpbGRlci50cyIsInNvdXJjZXMvYWRkaW4udHMiLCJzb3VyY2VzL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci50cyIsInNvdXJjZXMvZ3JvdXBzQnVpbGRlci50cyIsInNvdXJjZXMvbWlzY0J1aWxkZXIudHMiLCJzb3VyY2VzL3JlcG9ydHNCdWlsZGVyLnRzIiwic291cmNlcy9ydWxlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3Njb3BlR3JvdXBGaWx0ZXIudHMiLCJzb3VyY2VzL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3V0aWxzLnRzIiwic291cmNlcy93YWl0aW5nLnRzIiwic291cmNlcy96b25lQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ29CQSxNQUFhLFlBQVk7SUFJckIsWUFBWSxHQUFHO1FBSVAsZUFBVSxHQUFHLENBQUMsSUFBZ0IsRUFBVyxFQUFFO1lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JELENBQUMsQ0FBQTtRQUVELHdFQUF3RTtRQUN4RSxvREFBb0Q7UUFDcEQsMkRBQTJEO1FBQ25ELGVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXpFLGtCQUFhLEdBQUcsQ0FBQyxJQUFnQixFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFD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QUFXLENBQUM7SUFDNUIsQ0FBQztJQUVPLFFBQVE7UUFDWixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDakIsVUFBVSxFQUFFLE1BQU07YUFDckIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDSjtBQS9CRCxrQ0ErQkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbnRlcmZhY2UgSUFkZGluSXRlbSB7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgbWVudUlkPzogc3RyaW5nO1xuICAgIGZpbGVzPzogYW55O1xuICAgIHBhZ2U/OiBzdHJpbmc7XG4gICAgY2xpY2s/OiBzdHJpbmc7XG4gICAgYnV0dG9uTmFtZT86IHN0cmluZztcbiAgICBtYXBTY3JpcHQ/OiB7XG4gICAgICAgIHNyYz86IHN0cmluZztcbiAgICAgICAgc3R5bGU/OiBzdHJpbmc7XG4gICAgICAgIHVybD86IHN0cmluZztcbiAgICB9XG59XG5cbmludGVyZmFjZSBJQWRkaW4gZXh0ZW5kcyBJQWRkaW5JdGVtIHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGl0ZW1zPzogSUFkZGluSXRlbVtdO1xufVxuXG5leHBvcnQgY2xhc3MgQWRkSW5CdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNNZW51SXRlbSA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgIHJldHVybiAhaXRlbS51cmwgJiYgISFpdGVtLnBhdGggJiYgISFpdGVtLm1lbnVJZDtcbiAgICB9XG5cbiAgICAvL1Rlc3RzIGEgVVJMIGZvciBkb3VibGUgc2xhc2guIEFjY2VwdHMgYSB1cmwgYXMgYSBzdHJpbmcgYXMgYSBhcmd1bWVudC5cbiAgICAvL1JldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIGNvbnRhaW5zIGEgZG91YmxlIHNsYXNoIC8vXG4gICAgLy9SZXR1cm5zIGZhbHNlIGlmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBhIGRvdWJsZSBzbGFzaC5cbiAgICBwcml2YXRlIGlzVmFsaWRVcmwgPSAodXJsOiBzdHJpbmcpOiBib29sZWFuID0+ICEhdXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTE7XG5cbiAgICBwcml2YXRlIGlzVmFsaWRCdXR0b24gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmJ1dHRvbk5hbWUgJiYgISFpdGVtLnBhZ2UgJiYgISFpdGVtLmNsaWNrICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLmNsaWNrKTtcblxuICAgIHByaXZhdGUgaXNFbWJlZGRlZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmZpbGVzO1xuXG4gICAgcHJpdmF0ZSBpc1ZhbGlkTWFwQWRkaW4gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICBjb25zdCBzY3JpcHRzID0gaXRlbS5tYXBTY3JpcHQ7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTcmMgPSAhc2NyaXB0cz8uc3JjIHx8IHRoaXMuaXNWYWxpZFVybChzY3JpcHRzLnNyYyk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTdHlsZSA9ICFzY3JpcHRzPy5zdHlsZSB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy5zdHlsZSk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRIdG1sID0gIXNjcmlwdHM/LnVybCB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy51cmwpO1xuICAgICAgICBjb25zdCBoYXNTY3JpcHRzID0gISFzY3JpcHRzICYmICghIXNjcmlwdHM/LnNyYyB8fCAhc2NyaXB0cz8uc3R5bGUgfHwgIXNjcmlwdHM/LnVybCk7XG4gICAgICAgIHJldHVybiBoYXNTY3JpcHRzICYmIGlzVmFsaWRTcmMgJiYgaXNWYWxpZFN0eWxlICYmIGlzVmFsaWRIdG1sO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNWYWxpZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0VtYmVkZGVkSXRlbShpdGVtKSB8fCB0aGlzLmlzTWVudUl0ZW0oaXRlbSkgfHwgdGhpcy5pc1ZhbGlkQnV0dG9uKGl0ZW0pIHx8IHRoaXMuaXNWYWxpZE1hcEFkZGluKGl0ZW0pIHx8ICghIWl0ZW0udXJsICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLnVybCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICgoYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMSl8fFxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIGFkZGluIGJ1aWxkZXIgd2l0aCBhbGwgYWRkaW5zXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRBZGRJbnMoKVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWRkaW5Db25maWc6IElBZGRpbiA9IEpTT04ucGFyc2UoYWRkaW4pO1xuICAgICAgICAgICAgaWYoYWRkaW5Db25maWcuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAvL011bHRpIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXJsID0gaXRlbS51cmw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeSh0aGlzLmlzVmFsaWRJdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vU2luZ2xlIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZEl0ZW0oYWRkaW5Db25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFkZElucyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0VmVyc2lvbigpXG4gICAgICAgIC50aGVuKCh2ZXJzaW9uKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBpZiggdmVyc2lvbi5zcGxpdChcIi5cIiwgMSkgPCA4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tU3lzdGVtU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJvbUFkZEluQXBpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFZlcnNpb24gKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0VmVyc2lvblwiLCB7XG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21BZGRJbkFwaSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJBZGRJblwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGFkZElucyA6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHJlc3VsdCkpe1xuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2goYWRkSW4gPT4ge1xuICAgICAgICAgICAgICAgIC8vIE5ldyBBcGkgcmV0dXJucyBjb25maWd1cmF0aW9uIGZvciBBbGwgQWRkaW5zXG4gICAgICAgICAgICAgICAgLy8gSWYgaXQgaGFzIFVybCB0aGVuIHdlIGRvbid0IG5lZWQgdGhlIGNvbmZpZ3VyYXRpb24gcGFydCBmb3IgZXhwb3J0XG4gICAgICAgICAgICAgICAgaWYoYWRkSW4udXJsICYmIGFkZEluLnVybCAhPSBcIlwiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoYWRkSW4uY29uZmlndXJhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYWRkSW4uY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhZGRJbi5pZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyB1cmwgYnV0IHdlIGhhdmUgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIFdlIHdpbGwga2VlcCB3aGF0J3MgaW5zaWRlIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZihhZGRJbi5jb25maWd1cmF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW4gPSBhZGRJbi5jb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRJbnMucHVzaChKU09OLnN0cmluZ2lmeShhZGRJbikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhhZGRJbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21TeXN0ZW1TZXR0aW5ncyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJTeXN0ZW1TZXR0aW5nc1wiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhyZXN1bHRbMF0uY3VzdG9tZXJQYWdlcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9hZGRpbi5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XG5pbXBvcnQgUmVwb3J0c0J1aWxkZXIgZnJvbSBcIi4vcmVwb3J0c0J1aWxkZXJcIjtcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xuaW1wb3J0IHtJTWlzY0RhdGEsIE1pc2NCdWlsZGVyfSBmcm9tIFwiLi9taXNjQnVpbGRlclwiO1xuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2UsIGdldEdyb3VwRmlsdGVyR3JvdXBzfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IFdhaXRpbmcgZnJvbSBcIi4vd2FpdGluZ1wiO1xuLy8gaW1wb3J0IHtVc2VyQnVpbGRlcn0gZnJvbSBcIi4vdXNlckJ1aWxkZXJcIjtcbmltcG9ydCB7Wm9uZUJ1aWxkZXJ9IGZyb20gXCIuL3pvbmVCdWlsZGVyXCI7XG5pbXBvcnQge0FkZEluQnVpbGRlcn0gZnJvbSBcIi4vYWRkSW5CdWlsZGVyXCI7XG5cbmludGVyZmFjZSBHZW90YWIge1xuICAgIGFkZGluOiB7XG4gICAgICAgIHJlZ2lzdHJhdGlvbkNvbmZpZzogRnVuY3Rpb25cbiAgICB9O1xufVxuXG5pbnRlcmZhY2UgSUltcG9ydERhdGEge1xuICAgIGdyb3VwczogYW55W107XG4gICAgcmVwb3J0czogYW55W107XG4gICAgcnVsZXM6IGFueVtdO1xuICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBhbnlbXTtcbiAgICBkZXZpY2VzOiBhbnlbXTtcbiAgICB1c2VyczogYW55W107XG4gICAgem9uZVR5cGVzOiBhbnlbXTtcbiAgICB6b25lczogYW55W107XG4gICAgd29ya1RpbWVzOiBhbnlbXTtcbiAgICB3b3JrSG9saWRheXM6IGFueVtdO1xuICAgIHNlY3VyaXR5R3JvdXBzOiBhbnlbXTtcbiAgICBkaWFnbm9zdGljczogYW55W107XG4gICAgY3VzdG9tTWFwczogYW55W107XG4gICAgbWlzYzogSU1pc2NEYXRhIHwgbnVsbDtcbiAgICBhZGRpbnM6IGFueVtdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XG4gICAgY2VydGlmaWNhdGVzOiBhbnlbXTtcbiAgICBncm91cEZpbHRlcnM/OiBhbnlbXTtcbn1cbmludGVyZmFjZSBJRGVwZW5kZW5jaWVzIHtcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcbiAgICByZXBvcnRzPzogc3RyaW5nW107XG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcbiAgICBkaXN0cmlidXRpb25MaXN0cz86IHN0cmluZ1tdO1xuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcbiAgICB1c2Vycz86IHN0cmluZ1tdO1xuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xuICAgIHpvbmVzPzogc3RyaW5nW107XG4gICAgd29ya1RpbWVzPzogc3RyaW5nW107XG4gICAgd29ya0hvbGlkYXlzPzogc3RyaW5nW107XG4gICAgc2VjdXJpdHlHcm91cHM/OiBzdHJpbmdbXTtcbiAgICBkaWFnbm9zdGljcz86IHN0cmluZ1tdO1xuICAgIGN1c3RvbU1hcHM/OiBzdHJpbmdbXTtcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBzdHJpbmdbXTtcbiAgICBjZXJ0aWZpY2F0ZXM/OiBzdHJpbmdbXTtcbiAgICBncm91cEZpbHRlcnM/OiBzdHJpbmdbXTtcbn1cblxudHlwZSBURW50aXR5VHlwZSA9IGtleW9mIElJbXBvcnREYXRhO1xuXG5kZWNsYXJlIGNvbnN0IGdlb3RhYjogR2VvdGFiO1xuXG5jbGFzcyBBZGRpbiB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBncm91cHNCdWlsZGVyOiBHcm91cHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjogU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlcG9ydHNCdWlsZGVyOiBSZXBvcnRzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bGVzQnVpbGRlcjogUnVsZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyOiBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBtaXNjQnVpbGRlcjogTWlzY0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhZGRJbkJ1aWxkZXI6IEFkZEluQnVpbGRlcjtcbiAgICAvLyBwcml2YXRlIHJlYWRvbmx5IHVzZXJCdWlsZGVyOiBVc2VyQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHpvbmVCdWlsZGVyOiBab25lQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0QnV0dG9uXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc2F2ZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUJ1dHRvblwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbEFkZGluc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX2FkZGluc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsWm9uZXNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF96b25lc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X3N5c3RlbV9zZXR0aW5nc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogV2FpdGluZztcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogSUltcG9ydERhdGEgPSB7XG4gICAgICAgIGdyb3VwczogW10sXG4gICAgICAgIHJlcG9ydHM6IFtdLFxuICAgICAgICBydWxlczogW10sXG4gICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBbXSxcbiAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgIHVzZXJzOiBbXSxcbiAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgem9uZXM6IFtdLFxuICAgICAgICB3b3JrVGltZXM6IFtdLFxuICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXG4gICAgICAgIGN1c3RvbU1hcHM6IFtdLFxuICAgICAgICBkaWFnbm9zdGljczogW10sXG4gICAgICAgIG1pc2M6IG51bGwsXG4gICAgICAgIGFkZGluczogW10sXG4gICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW10sXG4gICAgICAgIGNlcnRpZmljYXRlczogW10sXG4gICAgICAgIGdyb3VwRmlsdGVyczogW11cbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBjb21iaW5lRGVwZW5kZW5jaWVzICguLi5hbGxEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXNbXSk6IElEZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgdG90YWwgPSB7XG4gICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgcmVwb3J0czogW10sXG4gICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgIHVzZXJzOiBbXSxcbiAgICAgICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgICAgICB6b25lczogW10sXG4gICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxuICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgICAgIGN1c3RvbU1hcHM6IFtdLFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXSxcbiAgICAgICAgICAgIGdyb3VwRmlsdGVyczogW11cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRvdGFsKS5yZWR1Y2UoKGRlcGVuZGVuY2llcywgZGVwZW5kZW5jeU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sIC4uLmFsbERlcGVuZGVuY2llcy5tYXAoKGVudGl0eURlcGVuZGVuY2llcykgPT4gZW50aXR5RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSkpO1xuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgfSwgdG90YWwpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3R3JvdXBzIChncm91cHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZ3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBncm91cHNEYXRhID0gdGhpcy5ncm91cHNCdWlsZGVyLmdldEdyb3Vwc0RhdGEoZ3JvdXBzLCB0cnVlKSxcbiAgICAgICAgICAgIG5ld0dyb3Vwc1VzZXJzID0gZ2V0VW5pcXVlRW50aXRpZXModGhpcy5ncm91cHNCdWlsZGVyLmdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHNEYXRhKSwgZGF0YS51c2Vycyk7XG4gICAgICAgIGRhdGEuZ3JvdXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmdyb3VwcywgZ3JvdXBzRGF0YSk7XG4gICAgICAgIGRhdGEudXNlcnMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEudXNlcnMsIG5ld0dyb3Vwc1VzZXJzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyh7dXNlcnM6IGdldEVudGl0aWVzSWRzKG5ld0dyb3Vwc1VzZXJzKX0sIGRhdGEpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3Q3VzdG9tTWFwcyAoY3VzdG9tTWFwc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGlmICghY3VzdG9tTWFwc0lkcyB8fCAhY3VzdG9tTWFwc0lkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VzdG9tTWFwc0RhdGEgPSBjdXN0b21NYXBzSWRzLnJlZHVjZSgoZGF0YTogYW55W10sIGN1c3RvbU1hcElkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGxldCBjdXN0b21NYXBEYXRhID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEoY3VzdG9tTWFwSWQpO1xuICAgICAgICAgICAgY3VzdG9tTWFwRGF0YSAmJiBkYXRhLnB1c2goY3VzdG9tTWFwRGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfSwgW10pO1xuICAgICAgICBkYXRhLmN1c3RvbU1hcHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuY3VzdG9tTWFwcywgY3VzdG9tTWFwc0RhdGEpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzIChub3RpZmljYXRpb25UZW1wbGF0ZXNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xuICAgICAgICBpZiAoIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcyB8fCAhbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhID0gbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLnJlZHVjZSgoZGF0YTogYW55W10sIHRlbXBsYXRlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlRGF0YSA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIHRlbXBsYXRlRGF0YSAmJiBkYXRhLnB1c2godGVtcGxhdGVEYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9LCBbXSk7XG4gICAgICAgIGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcywgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRFbnR5dGllc0lkcyAoZW50aXRpZXM6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzOiBzdHJpbmdbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlcy5wdXNoKGVudGl0eS5pZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRFbnRpdHlEZXBlbmRlbmNpZXMgKGVudGl0eTogSUVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUpIHtcbiAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICBzd2l0Y2ggKGVudGl0eVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZXZpY2VzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJhdXRvR3JvdXBzXCJdKSk7XG4gICAgICAgICAgICAgICAgZW50aXR5W1wid29ya1RpbWVcIl0uaWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrVGltZXMgPSBbZW50aXR5W1wid29ya1RpbWVcIl0uaWRdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1c2Vyc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImNvbXBhbnlHcm91cHNcIl0uY29uY2F0KGVudGl0eVtcImRyaXZlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInByaXZhdGVVc2VyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicmVwb3J0R3JvdXBzXCJdKSk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJzZWN1cml0eUdyb3Vwc1wiXSk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgPSBbZW50aXR5W1wiZGVmYXVsdE1hcEVuZ2luZVwiXV07XG4gICAgICAgICAgICAgICAgaWYgKGVudGl0eS5pc3N1ZXJDZXJ0aWZpY2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY2VydGlmaWNhdGVzID0gWyBlbnRpdHkuaXNzdWVyQ2VydGlmaWNhdGUuaWQgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBGaWx0ZXJzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhbZW50aXR5W1wiYWNjZXNzR3JvdXBGaWx0ZXJcIl1dKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ6b25lc1wiOlxuICAgICAgICAgICAgICAgIGxldCB6b25lVHlwZXMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInpvbmVUeXBlc1wiXSk7XG4gICAgICAgICAgICAgICAgem9uZVR5cGVzLmxlbmd0aCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLnpvbmVUeXBlcyA9IHpvbmVUeXBlcyk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ3b3JrVGltZXNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtIb2xpZGF5cyA9IFtlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImdyb3VwRmlsdGVyc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSBbLi4uZ2V0R3JvdXBGaWx0ZXJHcm91cHMoKGVudGl0eSBhcyBJR3JvdXBGaWx0ZXIpLmdyb3VwRmlsdGVyQ29uZGl0aW9uKS52YWx1ZXMoKV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnRpdHlEZXBlbmRlbmNpZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhcHBseVRvRW50aXRpZXMgPFQ+KGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcywgaW5pdGlhbFZhbHVlLCBmdW5jOiAocmVzdWx0LCBlbnRpdHksIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlLCBlbnRpdHlJbmRleDogbnVtYmVyLCBlbnRpdHlUeXBlSW5kZXg6IG51bWJlciwgb3ZlcmFsbEluZGV4OiBudW1iZXIpID0+IFQpIHtcbiAgICAgICAgbGV0IG92ZXJhbGxJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlbnRpdGllc0xpc3QpLnJlZHVjZSgocmVzdWx0OiBULCBlbnRpdHlUeXBlOiBzdHJpbmcsIHR5cGVJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNMaXN0W2VudGl0eVR5cGVdLnJlZHVjZSgocmVzOiBULCBlbnRpdHksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgb3ZlcmFsbEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMocmVzLCBlbnRpdHksIGVudGl0eVR5cGUgYXMgVEVudGl0eVR5cGUsIGluZGV4LCB0eXBlSW5kZXgsIG92ZXJhbGxJbmRleCAtIDEpO1xuICAgICAgICAgICAgfSwgcmVzdWx0KTtcbiAgICAgICAgfSwgaW5pdGlhbFZhbHVlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc29sdmVEZXBlbmRlbmNpZXMgKGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcywgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgbGV0IGdldERhdGEgPSAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzKTogUHJvbWlzZTxJSW1wb3J0RGF0YT4gPT4ge1xuICAgICAgICAgICAgICAgIGxldCBlbnRpdHlSZXF1ZXN0VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBcIkRldmljZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnM6IFwiVXNlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZVR5cGVzOiBcIlpvbmVUeXBlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lczogXCJab25lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFwiV29ya1RpbWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtIb2xpZGF5czogXCJXb3JrSG9saWRheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFwiR3JvdXBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBcIkRpYWdub3N0aWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlcnRpZmljYXRlczogXCJDZXJ0aWZpY2F0ZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBGaWx0ZXJzOiBcIkdyb3VwRmlsdGVyXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0aWVzTGlzdCwge30sIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZW50aXR5SWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiIHx8IGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goW1wiR2V0XCIsIHJlcXVlc3RdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyAmJiBlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnNlY3VyaXR5R3JvdXBzID0gW1tcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLnNlY3VyaXR5R3JvdXBzLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyAmJiBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy53b3JrSG9saWRheXMgPSBbW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMud29ya0hvbGlkYXlzXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGROZXdHcm91cHMoZW50aXRpZXNMaXN0Lmdyb3VwcyB8fCBbXSwgZGF0YSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhlbnRpdGllc0xpc3QuY3VzdG9tTWFwcyB8fCBbXSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzKGVudGl0aWVzTGlzdC5ub3RpZmljYXRpb25UZW1wbGF0ZXMgfHwgW10sIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0Lmdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5jdXN0b21NYXBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0RW50aXRpZXMgPSBPYmplY3Qua2V5cyhyZXF1ZXN0cyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNBcnJheSA9IHJlcXVlc3RFbnRpdGllcy5yZWR1Y2UoKGxpc3QsIHR5cGUpID0+IGxpc3QuY29uY2F0KHJlcXVlc3RzW3R5cGVdKSwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0RW50aXRpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHNBcnJheSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdHcm91cHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGE6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKHJlcXVlc3RzLCB7fSwgKHJlc3VsdCwgcmVxdWVzdCwgZW50aXR5VHlwZSwgZW50aXR5SW5kZXgsIGVudGl0eVR5cGVJbmRleCwgb3ZlcmFsbEluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVxdWVzdHNBcnJheS5sZW5ndGggPiAxID8gcmVzcG9uc2Vbb3ZlcmFsbEluZGV4XSA6IHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1bMF0gfHwgaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiAmJiAoIWl0ZW0uaG9saWRheUdyb3VwIHx8IChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzIHx8IFtdKS5pbmRleE9mKGl0ZW0uaG9saWRheUdyb3VwLmdyb3VwSWQpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrVGltZXNcIiAmJiAhaXRlbS5kZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgfHwgW10pLmluZGV4T2YoaXRlbS5pZCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IHJlc3VsdFtlbnRpdHlUeXBlXS5jb25jYXQodGhpcy5ncm91cHNCdWlsZGVyLmdldEN1c3RvbUdyb3Vwc0RhdGEoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzIHx8IFtdLCBpdGVtcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llcyA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGl0ZW0sIGVudGl0eVR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdHlEZXBlbmRlbmNpZXMsIG5ld0RlcGVuZGVuY2llcywgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlKHJlc3VsdFtlbnRpdHlUeXBlXSwgW2VudGl0eUlkXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3R3JvdXBzID0gbmV3R3JvdXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IG5ld0N1c3RvbU1hcHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSBPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLnJlZHVjZSgocmVzdWx0LCBkZXBlbmRlbmN5TmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0aWVzID0gbmV3RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZCA9IChleHBvcnRlZERhdGFbZGVwZW5kZW5jeU5hbWVdIHx8IFtdKS5tYXAoZW50aXR5ID0+IGVudGl0eS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5mb3JFYWNoKGVudGl0eUlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWQuaW5kZXhPZihlbnRpdHlJZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZGVwZW5kZW5jeU5hbWVdICYmIChyZXN1bHRbZGVwZW5kZW5jeU5hbWVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZGVwZW5kZW5jeU5hbWVdLnB1c2goZW50aXR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge30gYXMgSUltcG9ydERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYnVpbHQtaW4gc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyAmJiAoZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzID0gZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzLnJlZHVjZSgocmVzdWx0LCBncm91cCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuaWQuaW5kZXhPZihcIkdyb3VwXCIpID09PSAtMSAmJiByZXN1bHQucHVzaChncm91cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0dyb3VwcyhuZXdHcm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKG5ld0N1c3RvbU1hcHMsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXhwb3J0ZWREYXRhKS5mb3JFYWNoKChlbnRpdHlUeXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhW2VudGl0eVR5cGVdLCBleHBvcnRlZERhdGFbZW50aXR5VHlwZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhuZXdEZXBlbmRlbmNpZXMsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZGVwZW5kZW5jaWVzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZUV4cG9ydEJ1dHRvbiAoaXNEaXNhYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b2dnbGVXYWl0aW5nID0gKGlzU3RhcnQgPSBmYWxzZSkgPT4ge1xuICAgICAgICBpZiAoaXNTdGFydCkge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RhcnQoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkaW5Db250YWluZXJcIikgYXMgSFRNTEVsZW1lbnQpLnBhcmVudEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIDk5OTkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24oZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vQnJldHQgLSBkaXNwbGF5cyB0aGUgb3V0cHV0IG9uIHRoZSBwYWdlXG4gICAgcHJpdmF0ZSBzaG93RW50aXR5TWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBxdHk6IG51bWJlciwgZW50aXR5TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKHF0eSkge1xuICAgICAgICAgICAgcXR5ID4gMSAmJiAoZW50aXR5TmFtZSArPSBcInNcIik7XG4gICAgICAgICAgICBsZXQgaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZVwiKSBhcyBIVE1MRWxlbWVudCkuaW5uZXJIVE1MO1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie3F1YW50aXR5fVwiLCBxdHkudG9TdHJpbmcoKSkucmVwbGFjZShcIntlbnRpdHl9XCIsIGVudGl0eU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBgWW91IGhhdmUgPHNwYW4gY2xhc3M9XCJib2xkXCI+bm90IGNvbmZpZ3VyZWQgYW55ICR7IGVudGl0eU5hbWUgfXM8L3NwYW4+LmA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dTeXN0ZW1TZXR0aW5nc01lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgaXNJbmNsdWRlZDogYm9vbGVhbikge1xuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChpc0luY2x1ZGVkKSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz50byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz5ub3QgdG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9pbml0aWFsaXplIGFkZGluXG4gICAgY29uc3RydWN0b3IgKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyID0gbmV3IEdyb3Vwc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyID0gbmV3IFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlciA9IG5ldyBSdWxlc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgPSBuZXcgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcbiAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyID0gbmV3IFVzZXJCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuem9uZUJ1aWxkZXIgPSBuZXcgWm9uZUJ1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIgPSBuZXcgQWRkSW5CdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMud2FpdGluZyA9IG5ldyBXYWl0aW5nKCk7XG4gICAgfVxuXG4gICAgLy9CcmV0dDogZXhwb3J0cyB0aGUgZGF0YVxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGF0YSgpLnRoZW4oKHJlcG9ydHNEYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgICAgIGRvd25sb2FkRGF0YUFzRmlsZShKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpLCBcImV4cG9ydC5qc29uXCIpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBleHBvcnQgZGF0YS5cXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xuICAgIH1cblxuICAgIHNhdmVDaGFuZ2VzID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIGNoZWNrQm94VmFsdWVDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcbiAgICB9XG5cbiAgICBhZGRFdmVudEhhbmRsZXJzKCkge1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZW5kZXIgKCkge1xuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgIC8vIHRoaXMuZGF0YS51c2VycyA9IFtdO1xuICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZGlucyA9IFtdO1xuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxuICAgICAgICBsZXQgbWFwTWVzc2FnZVRlbXBsYXRlOiBzdHJpbmcgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBNZXNzYWdlVGVtcGxhdGVcIikgYXMgSFRNTEVsZW1lbnQpLmlubmVySFRNTCxcbiAgICAgICAgICAgIGdyb3Vwc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRHcm91cHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBzZWN1cml0eUNsZWFyYW5jZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkU2VjdXJpdHlDbGVhcmFuY2VzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICByZXBvcnRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJlcG9ydHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBkYXNoYm9hcmRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZERhc2hib2FyZHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2V4cG9ydGVkTWFwIC5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIC8vIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxuICAgICAgICAgICAgem9uZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkWm9uZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBzeXN0ZW1TZXR0aW5nc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0U3lzdGVtU2V0dGluZ3NcIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcbiAgICAgICAgICAgIC8vbG9hZHMgdGhlIGdyb3Vwcy4gVGhpcyBpcyB3aGVyZSB1c2VycyBhcmUgYWRkZWQgaWYgdGhleSBhcmUgbGlua2VkIHRvIGEgZ3JvdXBcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgc2VjdXJpdHkgZ3JvdXBzIChzZWN1cml0eSBjbGVhcmFuY2UgaW4gdXNlciBhZG1pbiBpbiBNeUcpXG4gICAgICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vcmVwb3J0IGxvYWRlci4uLnNlZW1zIG9ic29sZXRlIHRvIG1lXG4gICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vbWlzYyA9IHN5c3RlbSBzZXR0aW5nc1xuICAgICAgICAgICAgdGhpcy5taXNjQnVpbGRlci5mZXRjaCh0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guY2hlY2tlZCksXG4gICAgICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnpvbmVCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLmFkZEluQnVpbGRlci5mZXRjaCgpXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGxldCByZXBvcnRzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZWN1cml0eUdyb3VwcyA9IHJlc3VsdHNbMV07XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyh0aGlzLmRhdGEucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcCA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGVudGl0eSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMocmVzLCBlbnRpdHlEZXApO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgem9uZURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbNl0pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgem9uZXMgdG8gYWxsIGRhdGFiYXNlIHpvbmVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS56b25lcyA9IHJlc3VsdHNbNl07XG4gICAgICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s2XSwgXCJ6b25lc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbN10pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgYWRkaW5zIGVxdWFsIHRvIG5vbmUvZW1wdHkgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFkZGlucyA9IHJlc3VsdHNbN107XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuZGF0YS5taXNjKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IHRoaXMuZGF0YS5hZGRpbnM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICBjdXN0b21NYXAgJiYgdGhpcy5kYXRhLmN1c3RvbU1hcHMucHVzaChjdXN0b21NYXApO1xuICAgICAgICAgICAgcmVwb3J0c0RlcGVuZGVuY2llcyA9IHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5yZXBvcnRzKTtcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XG4gICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHpvbmVEZXBlbmRlbmNpZXMsIHJlcG9ydHNEZXBlbmRlbmNpZXMsIHJ1bGVzRGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWFwUHJvdmlkZXIgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyTmFtZSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrLCB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMubGVuZ3RoLCBcInNlY3VyaXR5IGNsZWFyYW5jZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocnVsZXNCbG9jaywgdGhpcy5kYXRhLnJ1bGVzLmxlbmd0aCwgXCJydWxlXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGRhc2hib2FyZHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXNoYm9hcmRzUXR5KCksIFwiZGFzaGJvYXJkXCIpO1xuICAgICAgICAgICAgaWYgKG1hcFByb3ZpZGVyKSB7XG4gICAgICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgdGhpcy5kYXRhLmFkZGlucz8ubGVuZ3RoIHx8IDAsIFwiYWRkaW5cIik7XG4gICAgICAgICAgICAvLyB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHVzZXJzQmxvY2ssIHRoaXMuZGF0YS51c2Vycy5sZW5ndGgsIFwidXNlclwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoem9uZXNCbG9jaywgdGhpcy5kYXRhLnpvbmVzLmxlbmd0aCwgXCJ6b25lXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlKHN5c3RlbVNldHRpbmdzQmxvY2ssIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKTtcbiAgICAgICAgICAgIC8vdGhpcyBkaXNwbGF5cyBhbGwgdGhlIGRhdGEvb2JqZWN0cyBpbiB0aGUgY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGdldCBjb25maWcgdG8gZXhwb3J0XCIpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCkge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgIH1cbn1cblxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYWRkaW46IEFkZGluO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICBhZGRpbiA9IG5ldyBBZGRpbihhcGkpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9jdXM6ICgpID0+IHtcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xuICAgICAgICAgICAgYWRkaW4uYWRkRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB9LFxuICAgICAgICBibHVyOiAoKSA9PiB7XG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcbiAgICAgICAgfVxuICAgIH07XG59OyIsImltcG9ydCB7ZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZX0gZnJvbSBcIi4vdXRpbHNcIjtcblxuLy9BIGRpc3RyaWJ1dGlvbiBsaXN0IGxpbmtzIGEgc2V0IG9mIFJ1bGUocykgdG8gYSBzZXQgb2YgUmVjaXBpZW50KHMpLiBXaGVuIGEgUnVsZSBpcyB2aW9sYXRlZCBlYWNoIHJlbGF0ZWQgUmVjaXBpZW50IHdpbGwgcmVjZWl2ZSBhIG5vdGlmaWNhdGlvbiBvZiB0aGUga2luZCBkZWZpbmVkIGJ5IGl0cyBSZWNpcGllbnRUeXBlLlxuaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0IGV4dGVuZHMgSU5hbWVkRW50aXR5IHtcbiAgICByZWNpcGllbnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgIHJ1bGVzOiBhbnlbXTtcbiAgICB1c2VyczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xuICAgIHByaXZhdGUgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0czogUmVjb3JkPHN0cmluZywgSURpc3RyaWJ1dGlvbkxpc3Q+O1xuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbiAgICBwcml2YXRlIGdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkRpc3RyaWJ1dGlvbkxpc3RcIixcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25XZWJSZXF1ZXN0VGVtcGxhdGVzXCIsIHt9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25FbWFpbFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAoZGlzdHJpYnV0aW9uTGlzdHMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChyZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcbiAgICAgICAgICAgICAgICB1c2VySWQgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLmluZGV4T2YodXNlcklkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLnB1c2godXNlcklkKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlY2lwaWVudC5yZWNpcGllbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nUG9wdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1VyZ2VudFBvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0TWVzc2FnZVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoQWxsb3dEZWxheVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlICYmIHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFzc2lnblRvR3JvdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImdyb3Vwc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY2lwaWVudHMucmVkdWNlKChkZXBlbmRlbmNpZXMsIHJlY2lwaWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHJlY2lwaWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMucnVsZXMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMucnVsZXMsIGRpc3RyaWJ1dGlvbkxpc3QucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tSZWNpcGllbnRzKGRpc3RyaWJ1dGlvbkxpc3QucmVjaXBpZW50cywgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcbiAgICAgICAgICAgIC50aGVuKChbZGlzdHJpYnV0aW9uTGlzdHMsIHdlYlRlbXBsYXRlcywgZW1haWxUZW1wbGF0ZXMsIHRleHRUZW1wbGF0ZXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0cyA9IGVudGl0eVRvRGljdGlvbmFyeShkaXN0cmlidXRpb25MaXN0cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaXN0cmlidXRpb25MaXN0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSAodGVtcGxhdGVJZDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzW3RlbXBsYXRlSWRdO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyAocnVsZXNJZHM6IHN0cmluZ1tdKTogSURpc3RyaWJ1dGlvbkxpc3RbXSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlczogSURpc3RyaWJ1dGlvbkxpc3RbXSwgaWQpID0+IHtcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c1tpZF07XG4gICAgICAgICAgICBsaXN0LnJ1bGVzLnNvbWUobGlzdFJ1bGUgPT4gcnVsZXNJZHMuaW5kZXhPZihsaXN0UnVsZS5pZCkgPiAtMSkgJiYgcmVzLnB1c2gobGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5LCBleHRlbmQsIElFbnRpdHkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgQ29sb3Ige1xuICAgIHI6IG51bWJlcjtcbiAgICBnOiBudW1iZXI7XG4gICAgYjogbnVtYmVyO1xuICAgIGE6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR3JvdXAgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29sb3I/OiBDb2xvcjtcbiAgICBwYXJlbnQ/OiBJR3JvdXA7XG4gICAgY2hpbGRyZW4/OiBJR3JvdXBbXTtcbiAgICB1c2VyPzogYW55O1xufVxuXG5pbnRlcmZhY2UgSU5ld0dyb3VwIGV4dGVuZHMgT21pdDxJR3JvdXAsIFwiaWRcIj4ge1xuICAgIGlkOiBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcbiAgICBwcm90ZWN0ZWQgYXBpO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VGFzaztcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcbiAgICBwcm90ZWN0ZWQgdHJlZTogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUcmVlO1xuXG4gICAgcHJpdmF0ZSB1c2VyczogYW55O1xuICAgIHByaXZhdGUgY3VycmVudFVzZXJOYW1lOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL2dldHMgdGhlIGdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdXNlclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXG4gICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBmaW5kQ2hpbGQgKGNoaWxkSWQ6IHN0cmluZywgY3VycmVudEl0ZW06IElOZXdHcm91cCB8IElHcm91cCwgb25BbGxMZXZlbHM6IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cCB8IG51bGwge1xuICAgICAgICBsZXQgZm91bmRDaGlsZDogSUdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGN1cnJlbnRJdGVtLmNoaWxkcmVuO1xuICAgICAgICBpZiAoIWNoaWxkSWQgfHwgIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG4gICAgICAgICAgICBpZiAoY2hpbGQuaWQgPT09IGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbkFsbExldmVscykge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQgKGdyb3VwSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcbiAgICAgICAgICAgIHVzZXJIYXNQcml2YXRlR3JvdXAgPSAodXNlciwgZ3JvdXBJZCk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyLnByaXZhdGVVc2VyR3JvdXBzLnNvbWUoZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB0aGlzLnVzZXJzLnNvbWUodXNlciA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xuICAgICAgICAgICAgICAgIG91dHB1dFVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG91dHB1dFVzZXI7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0UHJpdmF0ZUdyb3VwRGF0YSAoZ3JvdXBJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVzZXI6IHRoaXMuZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQoZ3JvdXBJZCksXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBuYW1lOiBcIlByaXZhdGVVc2VyR3JvdXBOYW1lXCIsXG4gICAgICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW3sgaWQ6IGdyb3VwSWQgfV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XG4gICAgICAgIGxldCBub2RlTG9va3VwLFxuICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHN0cmluZztcblxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNoaWxkcmVuW2ldLmlkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldID0gbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXS5wYXJlbnQgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG5vZGVMb29rdXAgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZ3JvdXBzLCBlbnRpdHkgPT4ge1xuICAgICAgICAgICAgbGV0IG5ld0VudGl0eSA9IGV4dGVuZCh7fSwgZW50aXR5KTtcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBuZXdFbnRpdHkuY2hpbGRyZW4gPSBuZXdFbnRpdHkuY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIG5vZGVMb29rdXBba2V5XSAmJiB0cmF2ZXJzZUNoaWxkcmVuKG5vZGVMb29rdXBba2V5XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgIHJldHVybiBub2RlTG9va3VwW2tleV07XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH07XG5cbiAgICAvL2ZpbGxzIHRoZSBncm91cCBidWlsZGVyIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0R3JvdXBzKClcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJzID0gdXNlcnM7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IGV4dGVuZCh7fSwgdGhpcy50cmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH07XG5cbiAgICBwdWJsaWMgY3JlYXRlRmxhdEdyb3Vwc0xpc3QgKGdyb3VwczogSUdyb3VwW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgZm91bmRJZHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICBncm91cHNUb0FkZDogSUdyb3VwW10gPSBbXSxcbiAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyA9IChpdGVtOiBJR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaXRlbUNvcHkgPSBleHRlbmQoe30sIGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LmNoaWxkcmVuID0gaXRlbUNvcHkuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChpdGVtQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uY2hpbGRyZW4gJiYgaXRlbS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weSA9IGV4dGVuZCh7fSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LmNoaWxkcmVuID0gY2hpbGRDb3B5LmNoaWxkcmVuLm1hcChjaGlsZElubmVyID0+IGNoaWxkSW5uZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goY2hpbGRDb3B5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xuICAgICAgICAhbm90SW5jbHVkZUNoaWxkcmVuICYmIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0Q2hpbGRyZW4pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzVG9BZGQ7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRHcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XG4gICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiB0aGlzLnRyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGdyb3Vwc1RyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoYWxsR3JvdXBzKSxcbiAgICAgICAgICAgIHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IGdyb3Vwc1RyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIHRydWUpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3VwczogSUdyb3VwW10pIHtcbiAgICAgICAgcmV0dXJuIGdyb3Vwcy5yZWR1Y2UoKHVzZXJzOiBJRW50aXR5W10sIGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBncm91cC51c2VyICYmIGdyb3VwLnVzZXIubmFtZSAhPT0gdGhpcy5jdXJyZW50VXNlck5hbWUgJiYgdXNlcnMucHVzaChncm91cC51c2VyKTtcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCJpbXBvcnQgeyBlbnRpdHlUb0RpY3Rpb25hcnkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcblxuZXhwb3J0IGludGVyZmFjZSBJTWlzY0RhdGEge1xuICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgICAgIHR5cGU6IFRNYXBQcm92aWRlclR5cGU7XG4gICAgfTtcbiAgICBjdXJyZW50VXNlcjogYW55O1xuICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiBib29sZWFuO1xuICAgIGFkZGluczogc3RyaW5nW107XG4gICAgcHVyZ2VTZXR0aW5ncz86IGFueTtcbiAgICBlbWFpbFNlbmRlckZyb20/OiBzdHJpbmc7XG4gICAgY3VzdG9tZXJDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgICBpc01hcmtldHBsYWNlUHVyY2hhc2VzQWxsb3dlZD86IGJvb2xlYW47XG4gICAgaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQ/OiBib29sZWFuO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBNaXNjQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXN0b21NYXBQcm92aWRlcnM7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyO1xuICAgIHByaXZhdGUgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0TWFwUHJvdmlkZXJzID0ge1xuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXG4gICAgICAgIE1hcEJveDogXCJNYXBCb3hcIlxuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgTWlzYyBidWlsZGVyIChzeXN0ZW0gc2V0dGluZ3MpIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgZmV0Y2ggKGluY2x1ZGVTeXNTZXR0aW5nczogYm9vbGVhbik6IFByb21pc2U8SU1pc2NEYXRhPiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlN5c3RlbVNldHRpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXG4gICAgICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3MgPSByZXN1bHRbMV1bMF0gfHwgcmVzdWx0WzFdLFxuICAgICAgICAgICAgICAgIHVzZXJNYXBQcm92aWRlcklkID0gY3VycmVudFVzZXIuZGVmYXVsdE1hcEVuZ2luZSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVySWQgPSB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZSh1c2VyTWFwUHJvdmlkZXJJZCkgPT09IFwiY3VzdG9tXCIgPyB1c2VyTWFwUHJvdmlkZXJJZCA6IGRlZmF1bHRNYXBQcm92aWRlcklkO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgdGhpcy5jdXN0b21NYXBQcm92aWRlcnMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3lzdGVtU2V0dGluZ3MuY3VzdG9tV2ViTWFwUHJvdmlkZXJMaXN0KTtcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XG4gICAgICAgICAgICBsZXQgb3V0cHV0OiBJTWlzY0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hcFByb3ZpZGVySWQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhZGRpbnM6IFtdLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyOiB0aGlzLmN1cnJlbnRVc2VyLFxuICAgICAgICAgICAgICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGluY2x1ZGVTeXNTZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXJnZVNldHRpbmdzID0gc3lzdGVtU2V0dGluZ3MucHVyZ2VTZXR0aW5ncztcbiAgICAgICAgICAgICAgICBvdXRwdXQuZW1haWxTZW5kZXJGcm9tID0gc3lzdGVtU2V0dGluZ3MuZW1haWxTZW5kZXJGcm9tO1xuICAgICAgICAgICAgICAgIG91dHB1dC5jdXN0b21lckNsYXNzaWZpY2F0aW9uID0gc3lzdGVtU2V0dGluZ3MuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbjtcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd01hcmtldHBsYWNlUHVyY2hhc2VzO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc1Jlc2VsbGVyQXV0b0xvZ2luQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93UmVzZWxsZXJBdXRvTG9naW47XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJUeXBlIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBUTWFwUHJvdmlkZXJUeXBlIHtcbiAgICAgICAgcmV0dXJuICFtYXBQcm92aWRlcklkIHx8IHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSA/IFwiZGVmYXVsdFwiIDogXCJjdXN0b21cIjtcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlck5hbWUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmICh0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gfHwgKHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdLm5hbWUpIHx8IG1hcFByb3ZpZGVySWQpO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyRGF0YSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IElHcm91cCB9IGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcbmltcG9ydCB7IGdldEZpbHRlclN0YXRlVW5pcXVlR3JvdXBzLCBJU2NvcGVHcm91cEZpbHRlciB9IGZyb20gXCIuL3Njb3BlR3JvdXBGaWx0ZXJcIjtcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XG5cbmNvbnN0IFJFUE9SVF9UWVBFX0RBU0hCT0FEID0gXCJEYXNoYm9hcmRcIjtcblxuaW50ZXJmYWNlIElTZXJ2ZXJSZXBvcnQgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwczogSUdyb3VwW107XG4gICAgaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzOiBJR3JvdXBbXTtcbiAgICBpbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzOiBJR3JvdXBbXTtcbiAgICBpbmRpdmlkdWFsUmVjaXBpZW50czogSUlkRW50aXR5W107XG4gICAgc2NvcGVHcm91cHM6IElHcm91cFtdO1xuICAgIHNjb3BlR3JvdXBGaWx0ZXI/OiBJSWRFbnRpdHk7XG4gICAgZGVzdGluYXRpb24/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZTtcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xuICAgIGFyZ3VtZW50czoge1xuICAgICAgICBydWxlcz86IGFueVtdO1xuICAgICAgICBkZXZpY2VzPzogYW55W107XG4gICAgICAgIHpvbmVUeXBlTGlzdD86IGFueVtdO1xuICAgICAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbiAgICB9O1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG5pbnRlcmZhY2UgSVJlcG9ydCBleHRlbmRzIElTZXJ2ZXJSZXBvcnQge1xuICAgIHNjb3BlR3JvdXBGaWx0ZXI/OiBJU2NvcGVHcm91cEZpbHRlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcbiAgICBkZXZpY2VzOiBzdHJpbmdbXTtcbiAgICBydWxlczogc3RyaW5nW107XG4gICAgem9uZVR5cGVzOiBzdHJpbmdbXTtcbiAgICBncm91cHM6IHN0cmluZ1tdO1xuICAgIHVzZXJzOiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIElSZXBvcnRUZW1wbGF0ZSBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGlzU3lzdGVtOiBib29sZWFuO1xuICAgIHJlcG9ydERhdGFTb3VyY2U6IHN0cmluZztcbiAgICByZXBvcnRUZW1wbGF0ZVR5cGU6IHN0cmluZztcbiAgICByZXBvcnRzOiBJUmVwb3J0W107XG4gICAgYmluYXJ5RGF0YT86IHN0cmluZztcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb3J0c0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBhbGxSZXBvcnRzOiBJUmVwb3J0W107XG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICBwcml2YXRlIGRhc2hib2FyZHNMZW5ndGg6IG51bWJlcjtcbiAgICBwcml2YXRlIGFsbFRlbXBsYXRlczogSVJlcG9ydFRlbXBsYXRlW107XG5cbiAgICBwcml2YXRlIGdldFJlcG9ydHMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFJlcG9ydFNjaGVkdWxlc1wiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiaW5jbHVkZVRlbXBsYXRlRGV0YWlsc1wiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcImFwcGx5VXNlckZpbHRlclwiOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldERhc2hib2FyZEl0ZW1zXCIsIHt9XVxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwb3B1bGF0ZVNjb3BlR3JvdXBGaWx0ZXJzIChyZXBvcnRzOiBJU2VydmVyUmVwb3J0W10pOiBQcm9taXNlPElSZXBvcnRbXT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0cyA9IHJlcG9ydHMucmVkdWNlKChyZXMsIHJlcG9ydCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyICYmIHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyLmlkKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkdyb3VwRmlsdGVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiByZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSBhcyBhbnlbXSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlcXVlc3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVwb3J0cyBhcyBJUmVwb3J0W10pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0cywgKGdyb3VwRmlsdGVyczogSVNjb3BlR3JvdXBGaWx0ZXJbXVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5wYWNrZWRGaWx0ZXIgPSBncm91cEZpbHRlcnMubWFwKGl0ZW0gPT4gQXJyYXkuaXNBcnJheShpdGVtKSA/IGl0ZW1bMF0gOiBpdGVtKVxuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlR3JvdXBGaWx0ZXJIYXNoID0gVXRpbHMuZW50aXR5VG9EaWN0aW9uYXJ5KGVucGFja2VkRmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcG9ydHMubWFwKHJlcG9ydCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5yZXBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZUdyb3VwRmlsdGVyOiByZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiBzY29wZUdyb3VwRmlsdGVySGFzaFtyZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZF1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0cnVjdHVyZVJlcG9ydHMgKHJlcG9ydHMsIHRlbXBsYXRlcykge1xuICAgICAgICBsZXQgZmluZFRlbXBsYXRlUmVwb3J0cyA9ICh0ZW1wbGF0ZUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydHMuZmlsdGVyKHJlcG9ydCA9PiByZXBvcnQudGVtcGxhdGUuaWQgPT09IHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlcy5yZWR1Y2UoKHJlcywgdGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gdGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVSZXBvcnRzID0gZmluZFRlbXBsYXRlUmVwb3J0cyh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlcG9ydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucmVwb3J0cyA9IHRlbXBsYXRlUmVwb3J0cztcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVUZW1wbGF0ZSAobmV3VGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUpIHtcbiAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMuc29tZSgodGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEuaWQgPT09IG5ld1RlbXBsYXRlRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzW2luZGV4XSA9IG5ld1RlbXBsYXRlRGF0YTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJlcG9ydHMoKVxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCAuLi5yZXN0XSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbdGhpcy5wb3B1bGF0ZVNjb3BlR3JvdXBGaWx0ZXJzKHJlcG9ydHMpLCAuLi5yZXN0XSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoW3JlcG9ydHMsIHRlbXBsYXRlcywgZGFzaGJvYXJkSXRlbXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcbiAgICAgICAgICAgICAgICB0aGlzLmRhc2hib2FyZHNMZW5ndGggPSBkYXNoYm9hcmRJdGVtcyAmJiBkYXNoYm9hcmRJdGVtcy5sZW5ndGggPyBkYXNoYm9hcmRJdGVtcy5sZW5ndGggOiAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgYWxsRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMgPVxuICAgICAgICAgICAgICAgICAgICBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0Lmdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyICYmIGdldEZpbHRlclN0YXRlVW5pcXVlR3JvdXBzKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyLmdyb3VwRmlsdGVyQ29uZGl0aW9uKSB8fCBbXSkpO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMudXNlcnMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy51c2VycywgcmVwb3J0LmluZGl2aWR1YWxSZWNpcGllbnRzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmRpdmlkdWFsUmVjaXBpZW50cykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLmRldmljZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xuICAgICAgICB9LCBhbGxEZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXRhICgpOiBQcm9taXNlPElSZXBvcnRUZW1wbGF0ZVtdPiB7XG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzOiBhbnlbXSwgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0c1twb3J0aW9uSW5kZXhdIHx8IHJlcXVlc3RzW3BvcnRpb25JbmRleF0ubGVuZ3RoID49IHBvcnRpb25TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdHM7XG4gICAgICAgICAgICB9LCBbXSksXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcbiAgICAgICAgICAgIGdldFBvcnRpb25EYXRhID0gcG9ydGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XG5cbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cyA9IHRvdGFsUmVzdWx0cy5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSwgVXRpbHMucmVzb2x2ZWRQcm9taXNlKFtdKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XG4gICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzLmZvckVhY2godGVtcGxhdGVEYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXNoYm9hcmRzTGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXN0b21pemVkUmVwb3J0c1F0eSAoKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgcmV0dXJuICh0aGlzLmFsbFJlcG9ydHMuZmlsdGVyKChyZXBvcnQ6IElSZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcbiAgICAgICAgICAgICAgICBpc0NvdW50OiBib29sZWFuID0gIXRlbXBsYXRlRXhpc3RzICYmIHJlcG9ydC5sYXN0TW9kaWZpZWRVc2VyICE9PSBcIk5vVXNlcklkXCI7XG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XG4gICAgICAgIH0pKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJhZGRpbi5kLnRzXCIvPlxuaW1wb3J0IHsgc29ydEFycmF5T2ZFbnRpdGllcywgZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmludGVyZmFjZSBJUnVsZSBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBjb25kaXRpb246IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUnVsZURlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHdvcmtUaW1lczogYW55W107XG4gICAgd29ya0hvbGlkYXlzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xuICAgIHNlY3VyaXR5R3JvdXBzOiBhbnlbXTtcbiAgICBkaWFnbm9zdGljczogYW55W107XG59XG5cbmNvbnN0IEFQUExJQ0FUSU9OX1JVTEVfSUQgPSBcIlJ1bGVBcHBsaWNhdGlvbkV4Y2VwdGlvbklkXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XG5cbiAgICBwcml2YXRlIGdldFJ1bGVEaWFnbm9zdGljc1N0cmluZyAocnVsZTogSVJ1bGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGVwZW5kZW5jaWVzKFtydWxlXSkuZGlhZ25vc3RpY3Muc29ydCgpLmpvaW4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPElSdWxlW10+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlJ1bGVcIixcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlVHlwZTogXCJSb3V0ZUJhc2VkTWF0ZXJpYWxNZ210XCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICBdLCAoW2FsbFJ1bGVzLCBtYXRlcmlhbE1hbmFnZW1lbnRSdWxlc106IFtJUnVsZVtdLCBJUnVsZVtdXSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRvIGdldCBjb3JyZWN0IFNlcnZpY2UgZ3JvdXBzIHdlIG5lZWQgdG8gdXBkYXRlIG1hdGVyaWFsIG1hbmFnZW1lbnQgc3RvY2sgcnVsZXMnIGdyb3VwcyBmcm9tIGdyb3VwcyBwcm9wZXJ0eSBvZiB0aGUgY29ycmVzcG9uZGluZyBydWxlIHdpdGggUm91dGVCYXNlZE1hdGVyaWFsTWdtdCBiYXNlVHlwZVxuICAgICAgICAgICAgICAgIC8vIFRoZSBvbmx5IHBvc3NpYmxlIG1ldGhvZCBub3cgdG8gbWF0Y2ggU3RvY2sgcnVsZSBhbmQgcnVsZSB3aXRoIFJvdXRlQmFzZWRNYXRlcmlhbE1nbXQgYmFzZVR5cGUgaXMgdG8gbWF0Y2ggdGhlaXIgZGlhZ25vc3RpY3NcbiAgICAgICAgICAgICAgICBjb25zdCBtbVJ1bGVzR3JvdXBzID0gbWF0ZXJpYWxNYW5hZ2VtZW50UnVsZXMucmVkdWNlKChyZXM6IFJlY29yZDxzdHJpbmcsIElJZEVudGl0eVtdPiwgbW1SdWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1tUnVsZURpYWdub3N0aWNzID0gdGhpcy5nZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcobW1SdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzW21tUnVsZURpYWdub3N0aWNzXSA9IG1tUnVsZS5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGFsbFJ1bGVzLm1hcChydWxlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW1SdWxlRGlhZ25vc3RpY3MgPSB0aGlzLmdldFJ1bGVEaWFnbm9zdGljc1N0cmluZyhydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29ycmVzcG9uZGluZ01NUnVsZUdyb3VwcyA9IG1tUnVsZXNHcm91cHNbbW1SdWxlRGlhZ25vc3RpY3NdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29ycmVzcG9uZGluZ01NUnVsZUdyb3VwcyA/IHsgLi4ucnVsZSwgZ3JvdXBzOiBjb3JyZXNwb25kaW5nTU1SdWxlR3JvdXBzIH0gOiBydWxlO1xuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSdWxlcyAocnVsZXMpIHtcbiAgICAgICAgcmV0dXJuIHNvcnRBcnJheU9mRW50aXRpZXMocnVsZXMsIFtbXCJiYXNlVHlwZVwiLCBcImRlc2NcIl0sIFwibmFtZVwiXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJ1bGVzOiBJUnVsZVtdKTogSVJ1bGVEZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICAgICAgem9uZXM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcbiAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAoY29uZGl0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbmRpdGlvbi5jb25kaXRpb25UeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSdWxlV29ya0hvdXJzXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBZnRlclJ1bGVXb3JrSG91cnNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gKGNvbmRpdGlvbi53b3JrVGltZSAmJiBjb25kaXRpb24ud29ya1RpbWUuaWQpIHx8IGNvbmRpdGlvbi53b3JrVGltZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIndvcmtUaW1lc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEcml2ZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRyaXZlciAmJiBjb25kaXRpb24uZHJpdmVyLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwidXNlcnNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRGV2aWNlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kZXZpY2UgJiYgY29uZGl0aW9uLmRldmljZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRldmljZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW50ZXJpbmdBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFeGl0aW5nQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiT3V0c2lkZUFyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkluc2lkZUFyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uem9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmUuaWQgfHwgY29uZGl0aW9uLnpvbmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZVR5cGUuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZVR5cGVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZpbHRlclN0YXR1c0RhdGFCeURpYWdub3N0aWNcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFjdGl2ZU9ySW5hY3RpdmVGYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uZGlhZ25vc3RpYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRpYWdub3N0aWMuaWQgfHwgY29uZGl0aW9uLmRpYWdub3N0aWM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGlhZ25vc3RpY3NcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hlY2tDb25kaXRpb25zID0gKHBhcmVudENvbmRpdGlvbiwgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyk6IElSdWxlRGVwZW5kZW5jaWVzID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29uZGl0aW9ucyA9IHBhcmVudENvbmRpdGlvbi5jaGlsZHJlbiB8fCBbXTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHBhcmVudENvbmRpdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnMucmVkdWNlKChkZXBlbmRlbmNpZXMsIGNvbmRpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMoY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMoY29uZGl0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJ1bGVzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcywgcnVsZTogSVJ1bGUpID0+IHtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ncm91cHMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMuZ3JvdXBzLCBydWxlLmdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpKTtcbiAgICAgICAgICAgIGlmIChydWxlLmNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhydWxlLmNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSdWxlcygpXG4gICAgICAgICAgICAudGhlbigoc3dpdGNoZWRPblJ1bGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21iaW5lZFJ1bGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN3aXRjaGVkT25SdWxlcyk7XG4gICAgICAgICAgICAgICAgZGVsZXRlKHRoaXMuY29tYmluZWRSdWxlc1tBUFBMSUNBVElPTl9SVUxFX0lEXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJ1bGVzRGF0YSAocnVsZXNJZHM6IHN0cmluZ1tdKTogSVJ1bGVbXSB7XG4gICAgICAgIHJldHVybiBydWxlc0lkcy5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuXG5jb25zdCBlbnVtIFJlbGF0aW9uT3BlcmF0b3Ige1xuICAgIFwiQU5EXCIgPSBcIkFuZFwiLFxuICAgIFwiT1JcIiA9IFwiT3JcIlxufVxuXG5pbnRlcmZhY2UgSU91dHB1dElkRW50aXR5IHtcbiAgICBncm91cElkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJR3JvdXBMaXN0U3RhdGVPdXRwdXQ8VCBleHRlbmRzIElPdXRwdXRJZEVudGl0eSA9IElPdXRwdXRJZEVudGl0eT4ge1xuICAgIHJlbGF0aW9uOiBSZWxhdGlvbk9wZXJhdG9yO1xuICAgIGdyb3VwRmlsdGVyQ29uZGl0aW9uczogKFQgfCBJR3JvdXBMaXN0U3RhdGVPdXRwdXQ8VD4pW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNjb3BlR3JvdXBGaWx0ZXIgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwRmlsdGVyQ29uZGl0aW9uOiBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgfCBJT3V0cHV0SWRFbnRpdHk7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICBjb21tZW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgZ2V0U2NvcGVHcm91cEZpbHRlckJ5SWQgPSAoaWQ6IHN0cmluZywgYXBpKTogUHJvbWlzZTxJU2NvcGVHcm91cEZpbHRlcj4gPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwRmlsdGVyXCIsXG4gICAgICAgICAgICBzZWFyY2g6IHsgaWQgfVxuICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgY29uc3QgaXNGaWx0ZXJTdGF0ZSA9IDxULCBVPihpdGVtOiBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgfCBJT3V0cHV0SWRFbnRpdHkpOiBpdGVtIGlzIElHcm91cExpc3RTdGF0ZU91dHB1dCA9PiBpdGVtICYmIChpdGVtIGFzIElHcm91cExpc3RTdGF0ZU91dHB1dCkucmVsYXRpb24gIT09IHVuZGVmaW5lZDtcblxuZXhwb3J0IGNvbnN0IGdldEZpbHRlclN0YXRlVW5pcXVlR3JvdXBzID0gKHN0YXRlOiBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgfCBJT3V0cHV0SWRFbnRpdHkpID0+IHtcbiAgICBsZXQgZ3JvdXBJZHM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcHJvY2Vzc0l0ZW0gPSAoaXRlbTpJR3JvdXBMaXN0U3RhdGVPdXRwdXQsIHByZXZSZXMgPSBbXSBhcyBJSWRFbnRpdHlbXSk6IElJZEVudGl0eVtdID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uZ3JvdXBGaWx0ZXJDb25kaXRpb25zLnJlZHVjZSgocmVzLCBjaGlsZEl0ZW0pID0+IHtcbiAgICAgICAgICAgIGlmIChpc0ZpbHRlclN0YXRlKGNoaWxkSXRlbSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc0l0ZW0oY2hpbGRJdGVtLCByZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGlkID0gY2hpbGRJdGVtLmdyb3VwSWQ7XG4gICAgICAgICAgICBncm91cElkcy5pbmRleE9mKGlkKSA9PT0gLTEgJiYgcmVzLnB1c2goeyBpZCB9KTtcbiAgICAgICAgICAgIGdyb3VwSWRzLnB1c2goaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgcHJldlJlcyk7XG4gICAgfTtcbiAgICByZXR1cm4gaXNGaWx0ZXJTdGF0ZShzdGF0ZSkgPyBwcm9jZXNzSXRlbShzdGF0ZSkgOiBbeyBpZDogc3RhdGUuZ3JvdXBJZCB9XTtcbn07IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGV4dGVuZHMgR3JvdXBzQnVpbGRlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xuICAgICAgICBzdXBlcihhcGkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U2VjdXJpdHlHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFNlY3VyaXR5R3JvdXBzKClcbiAgICAgICAgICAgIC50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IFV0aWxzLmV4dGVuZCh7fSwgdGhpcy50cmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpLmZpbHRlcihncm91cCA9PiAhIWdyb3VwLm5hbWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH07XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbnRlcmZhY2UgSUNsYXNzQ29udHJvbCB7XG4gICAgZ2V0OiAoKSA9PiBzdHJpbmc7XG4gICAgc2V0OiAobmFtZTogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFbnRpdHkge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbnR5cGUgSVNvcnRQcm9wZXJ0eSA9IHN0cmluZyB8IFtzdHJpbmcsIFwiYXNjXCIgfCBcImRlc2NcIl07XG5cbmxldCBjbGFzc05hbWVDdHJsID0gZnVuY3Rpb24gKGVsOiBFbGVtZW50KTogSUNsYXNzQ29udHJvbCB7XG4gICAgICAgIHZhciBwYXJhbSA9IHR5cGVvZiBlbC5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgPyBcImNsYXNzTmFtZVwiIDogXCJiYXNlVmFsXCI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxbcGFyYW1dIHx8IFwiXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgICAgIGVsW3BhcmFtXSA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBpc1VzdWFsT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuaW5kZXhPZihcIk9iamVjdFwiKSAhPT0gLTE7XG4gICAgfTtcblxuZXhwb3J0IGludGVyZmFjZSBJSGFzaCB7XG4gICAgW2lkOiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbDogRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKSxcbiAgICAgICAgbmV3Q2xhc3NlcyA9IGNsYXNzZXMuZmlsdGVyKGNsYXNzSXRlbSA9PiBjbGFzc0l0ZW0gIT09IG5hbWUpO1xuICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChuZXdDbGFzc2VzLmpvaW4oXCIgXCIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKTogdm9pZCB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKTtcbiAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKG5hbWUpID09PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQoY2xhc3Nlc1N0ciArIFwiIFwiICsgbmFtZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3MoZWw6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGVsICYmIGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQoLi4uYXJnczogYW55W10pIHtcbiAgICB2YXIgbGVuZ3RoID0gYXJncy5sZW5ndGgsXG4gICAgICAgIHNyYywgc3JjS2V5cywgc3JjQXR0cixcbiAgICAgICAgZnVsbENvcHkgPSBmYWxzZSxcbiAgICAgICAgcmVzQXR0cixcbiAgICAgICAgcmVzID0gYXJnc1swXSwgaSA9IDEsIGo7XG5cbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgZnVsbENvcHkgPSByZXM7XG4gICAgICAgIHJlcyA9IGFyZ3NbMV07XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgd2hpbGUgKGkgIT09IGxlbmd0aCkge1xuICAgICAgICBzcmMgPSBhcmdzW2ldO1xuICAgICAgICBzcmNLZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHNyY0tleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHNyY0F0dHIgPSBzcmNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICBpZiAoZnVsbENvcHkgJiYgKGlzVXN1YWxPYmplY3Qoc3JjQXR0cikgfHwgQXJyYXkuaXNBcnJheShzcmNBdHRyKSkpIHtcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV0gPSAoaXNVc3VhbE9iamVjdChyZXNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHJlc0F0dHIpKSA/IHJlc0F0dHIgOiAoQXJyYXkuaXNBcnJheShzcmNBdHRyKSA/IFtdIDoge30pO1xuICAgICAgICAgICAgICAgIGV4dGVuZChmdWxsQ29weSwgcmVzQXR0ciwgc3JjQXR0cik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc1tzcmNLZXlzW2pdXSA9IHNyY1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlUb0RpY3Rpb25hcnkoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlDYWxsYmFjaz86IChlbnRpdHk6IGFueSkgPT4gYW55KTogSUhhc2gge1xuICAgIHZhciBlbnRpdHksIG8gPSB7fSwgaSxcbiAgICAgICAgbCA9IGVudGl0aWVzLmxlbmd0aDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGVudGl0aWVzW2ldKSB7XG4gICAgICAgICAgICBlbnRpdHkgPSBlbnRpdGllc1tpXS5pZCA/IGVudGl0aWVzW2ldIDoge2lkOiBlbnRpdGllc1tpXX07XG4gICAgICAgICAgICBvW2VudGl0eS5pZF0gPSBlbnRpdHlDYWxsYmFjayA/IGVudGl0eUNhbGxiYWNrKGVudGl0eSkgOiBlbnRpdHk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG87XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0QXJyYXlPZkVudGl0aWVzKGVudGl0aWVzOiBhbnlbXSwgc29ydGluZ0ZpZWxkczogSVNvcnRQcm9wZXJ0eVtdKTogYW55W10ge1xuICAgIGxldCBjb21wYXJhdG9yID0gKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllczogYW55W10sIGluZGV4ID0gMCkgPT4ge1xuICAgICAgICBpZiAocHJvcGVydGllcy5sZW5ndGggPD0gaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvcHRpb25zID0gcHJvcGVydGllc1tpbmRleF0sXG4gICAgICAgICAgICBbcHJvcGVydHksIGRpciA9IFwiYXNjXCJdID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc10sXG4gICAgICAgICAgICBkaXJNdWx0aXBsaWVyOiBudW1iZXI7XG4gICAgICAgIGRpck11bHRpcGxpZXIgPSBkaXIgPT09IFwiYXNjXCIgPyAxIDogLTE7XG4gICAgICAgIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPiBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgIHJldHVybiAxICogZGlyTXVsdGlwbGllcjtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPCBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgIHJldHVybiAtMSAqIGRpck11bHRpcGxpZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXMsIGluZGV4ICsgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBlbnRpdGllcy5zb3J0KChwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSwgc29ydGluZ0ZpZWxkcyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb3dubG9hZERhdGFBc0ZpbGUoZGF0YTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBtaW1lVHlwZSA9IFwidGV4dC9qc29uXCIpIHtcbiAgICBsZXQgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwge3R5cGU6IG1pbWVUeXBlfSksXG4gICAgICAgIGVsZW07XG4gICAgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBlbGVtLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICBlbGVtLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICBlbGVtLmNsaWNrKCk7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlRW50aXRpZXMgKC4uLnNvdXJjZXM6IElFbnRpdHlbXVtdKTogSUVudGl0eVtdIHtcbiAgICBsZXQgYWRkZWRJZHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgIG1lcmdlZEl0ZW1zOiBJRW50aXR5W10gPSBbXTtcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmlkICYmIGFkZGVkSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICBhZGRlZElkcy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgIH0pKTtcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnRpdGllc0lkcyAoZW50aXRpZXNMaXN0OiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZW50aXRpZXNMaXN0KSAmJiBlbnRpdGllc0xpc3QucmVkdWNlKChyZXN1bHQ6IHN0cmluZ1tdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXN1bHQucHVzaChlbnRpdHkuaWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIFtdKSB8fCBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlICguLi5zb3VyY2VzOiBzdHJpbmdbXVtdKTogc3RyaW5nW10ge1xuICAgIGxldCBtZXJnZWRJdGVtczogc3RyaW5nW10gPSBbXTtcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHtcbiAgICAgICAgQXJyYXkuaXNBcnJheShzb3VyY2UpICYmIHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaXRlbSAmJiBtZXJnZWRJdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSAmJiBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFbnRpdGllcyAobmV3RW50aXRpZXM6IElFbnRpdHlbXSwgZXhpc3RlZEVudGl0aWVzOiBJRW50aXR5W10pOiBJRW50aXR5W10ge1xuICAgIGxldCBzZWxlY3RlZEVudGl0aWVzSGFzaCA9IGVudGl0eVRvRGljdGlvbmFyeShleGlzdGVkRW50aXRpZXMpO1xuICAgIHJldHVybiBuZXdFbnRpdGllcy5yZWR1Y2UoKHJlczogSUVudGl0eVtdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgIXNlbGVjdGVkRW50aXRpZXNIYXNoW2VudGl0eS5pZF0gJiYgcmVzLnB1c2goZW50aXR5KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LCBbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2dldGhlcihwcm9taXNlczogUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPGFueT4ge1xuICAgIGxldCByZXN1bHRzOiBhbnlbXSA9IFtdLFxuICAgICAgICByZXN1bHRzQ291bnQgPSAwO1xuICAgIHJlc3VsdHMubGVuZ3RoID0gcHJvbWlzZXMubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCByZXNvbHZlQWxsID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgIH07XG4gICAgICAgIHByb21pc2VzLmxlbmd0aCA/IHByb21pc2VzLmZvckVhY2goKHByb21pc2UsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCsrO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCA9PT0gcHJvbWlzZXMubGVuZ3RoICYmIHJlc29sdmVBbGwoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZUluZGV4OiBpbmRleFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pIDogcmVzb2x2ZUFsbCgpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZWRQcm9taXNlPFQ+ICh2YWw/OiBUKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KHJlc29sdmUgPT4gcmVzb2x2ZSh2YWwpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkgKGRhdGEpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbZGF0YV07XG59XG5cbmNvbnN0IGlzTGVhZkdyb3VwRmlsdGVyQ29uZGl0aW9uID0gKGdyb3VwRmlsdGVyQ29uZGl0aW9uOiBUR3JvdXBGaWx0ZXJDb25kaXRpb24pOiBncm91cEZpbHRlckNvbmRpdGlvbiBpcyBJTGVhZkdyb3VwRmlsdGVyQ29uZGl0aW9uID0+IHtcbiAgICByZXR1cm4gISEoZ3JvdXBGaWx0ZXJDb25kaXRpb24gYXMgSUxlYWZHcm91cEZpbHRlckNvbmRpdGlvbikuZ3JvdXBJZDtcbn1cblxuZXhwb3J0IGNvbnN0IGdldEdyb3VwRmlsdGVyR3JvdXBzID0gKGdyb3VwRmlsdGVyQ29uZGl0aW9uPzogVEdyb3VwRmlsdGVyQ29uZGl0aW9uLCBwcmV2R3JvdXBJZHM6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCkpID0+IHtcbiAgICBpZiAoIWdyb3VwRmlsdGVyQ29uZGl0aW9uKSB7XG4gICAgICAgIHJldHVybiBwcmV2R3JvdXBJZHM7XG4gICAgfVxuICAgIGNvbnN0IGdyb3VwczogU2V0PHN0cmluZz4gPSBpc0xlYWZHcm91cEZpbHRlckNvbmRpdGlvbihncm91cEZpbHRlckNvbmRpdGlvbilcbiAgICAgICAgPyBuZXcgU2V0KFsuLi5wcmV2R3JvdXBJZHMsIGdyb3VwRmlsdGVyQ29uZGl0aW9uLmdyb3VwSWRdKVxuICAgICAgICA6IGdyb3VwRmlsdGVyQ29uZGl0aW9uLmdyb3VwRmlsdGVyQ29uZGl0aW9ucy5yZWR1Y2UoKHJlcywgY2hpbGRHcm91cEZpbHRlckNvbmRpdGlvbikgPT4gZ2V0R3JvdXBGaWx0ZXJHcm91cHMoY2hpbGRHcm91cEZpbHRlckNvbmRpdGlvbiwgcmVzKSwgcHJldkdyb3VwSWRzKTtcbiAgICByZXR1cm4gZ3JvdXBzO1xufTsiLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBXYWl0aW5nIHtcblxuICAgIHByaXZhdGUgd2FpdGluZ0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBib2R5RWw6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgIHB1YmxpYyBzdGFydChlbDogSFRNTEVsZW1lbnQgPSB0aGlzLmJvZHlFbCwgekluZGV4PzogbnVtYmVyKSB7XG4gICAgICAgIGlmIChlbC5vZmZzZXRQYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuY2xhc3NOYW1lID0gXCJ3YWl0aW5nXCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J2ZhZGVyJz48L2Rpdj48ZGl2IGNsYXNzPSdzcGlubmVyJz48L2Rpdj5cIjtcbiAgICAgICAgZWwucGFyZW50Tm9kZT8uYXBwZW5kQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGVsLm9mZnNldFdpZHRoICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUudG9wID0gZWwub2Zmc2V0VG9wICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUubGVmdCA9IGVsLm9mZnNldExlZnQgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB0eXBlb2YgekluZGV4ID09PSBcIm51bWJlclwiICYmICh0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuekluZGV4ID0gekluZGV4LnRvU3RyaW5nKCkpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgc3RvcCAoKSB7XG4gICAgICAgIGlmICh0aGlzLndhaXRpbmdDb250YWluZXIgJiYgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICB9O1xufSIsIi8vYWRkZWQgYnkgQnJldHQgdG8gbWFuYWdlIGFkZGluZyBhbGwgem9uZXMgdG8gdGhlIGV4cG9ydCBhcyBhbiBvcHRpb25cblxuZXhwb3J0IGNsYXNzIFpvbmVCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIHVzZXIgYnVpbGRlciB3aXRoIGFsbCB1c2Vyc1xuICAgIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0Wm9uZXMoKVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFpvbmVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlpvbmVcIlxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSJdfQ==
