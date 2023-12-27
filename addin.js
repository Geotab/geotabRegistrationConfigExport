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
                entityDependencies.groups = [...this.getGroupFilterGroups(entity.groupFilterCondition).values()];
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
        this.isLeafGroupFilterCondition = (groupFilterCondition) => {
            return !!groupFilterCondition.groupId;
        };
        this.getGroupFilterGroups = (groupFilterCondition, prevGroupIds = new Set()) => {
            if (!groupFilterCondition) {
                return prevGroupIds;
            }
            const groups = this.isLeafGroupFilterCondition(groupFilterCondition)
                ? new Set([...prevGroupIds, groupFilterCondition.groupId])
                : groupFilterCondition.groupFilterConditions.reduce((res, childGroupFilterCondition) => this.getGroupFilterGroups(childGroupFilterCondition, res), prevGroupIds);
            return groups;
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
exports.toArray = exports.resolvedPromise = exports.together = exports.getUniqueEntities = exports.mergeUnique = exports.getEntitiesIds = exports.mergeUniqueEntities = exports.downloadDataAsFile = exports.sortArrayOfEntities = exports.entityToDictionary = exports.extend = exports.hasClass = exports.addClass = exports.removeClass = void 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZEluQnVpbGRlci50cyIsInNvdXJjZXMvYWRkaW4udHMiLCJzb3VyY2VzL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci50cyIsInNvdXJjZXMvZ3JvdXBzQnVpbGRlci50cyIsInNvdXJjZXMvbWlzY0J1aWxkZXIudHMiLCJzb3VyY2VzL3JlcG9ydHNCdWlsZGVyLnRzIiwic291cmNlcy9ydWxlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3Njb3BlR3JvdXBGaWx0ZXIudHMiLCJzb3VyY2VzL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3V0aWxzLnRzIiwic291cmNlcy93YWl0aW5nLnRzIiwic291cmNlcy96b25lQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ29CQSxNQUFhLFlBQVk7SUFJckIsWUFBWSxHQUFHO1FBSVAsZUFBVSxHQUFHLENBQUMsSUFBZ0IsRUFBVyxFQUFFO1lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JELENBQUMsQ0FBQTtRQUVELHdFQUF3RTtRQUN4RSxvREFBb0Q7UUFDcEQsMkRBQTJEO1FBQ25ELGVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXpFLGtCQUFhLEdBQUcsQ0FBQyxJQUFnQixFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvSCxtQkFBYyxHQUFHLENBQUMsSUFBZ0IsRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFFN0Qsb0JBQWUsR0FBRyxDQUFDLElBQWdCLEVBQVcsRUFBRTtZQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQy9CLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsR0FBRyxDQUFBLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxLQUFLLENBQUEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2RSxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEdBQUcsQ0FBQSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsR0FBRyxDQUFBLElBQUksQ0FBQyxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxLQUFLLENBQUEsSUFBSSxDQUFDLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEdBQUcsQ0FBQSxDQUFDLENBQUM7WUFDckYsT0FBTyxVQUFVLElBQUksVUFBVSxJQUFJLFlBQVksSUFBSSxXQUFXLENBQUM7UUFDbkUsQ0FBQyxDQUFBO1FBRU8sZ0JBQVcsR0FBRyxDQUFDLElBQWdCLEVBQVcsRUFBRTtZQUNoRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JLLENBQUMsQ0FBQTtRQTNCRyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBNEJPLGNBQWMsQ0FBRSxLQUFhO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVPLGdCQUFnQjtRQUNwQixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxLQUFLO1FBQ0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDbkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxTQUFtQjtRQUN4QyxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDNUIsaURBQWlEO1lBQ2pELElBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFDN0I7Z0JBQ0ksT0FBTyxLQUFLLENBQUM7YUFDaEI7WUFDRCxJQUFJLFdBQVcsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLElBQUcsV0FBVyxDQUFDLEtBQUssRUFBRTtnQkFDbEIsa0NBQWtDO2dCQUNsQyxPQUFPLFdBQVcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDckYsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztvQkFDbkIsT0FBTyxXQUFXLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN4RyxDQUFDLENBQUMsQ0FBQzthQUNOO2lCQUNJO2dCQUNELG1DQUFtQztnQkFDbkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ3hDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sU0FBUztRQUNiLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRTthQUNuQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUVkLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFDO2dCQUMxQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2FBQ3ZDO2lCQUNHO2dCQUNBLE9BQU8sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2FBQ2pDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVPLFVBQVU7UUFDZCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUMzQixFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxlQUFlO1FBQ25CLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNqQixVQUFVLEVBQUUsT0FBTzthQUN0QixFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRTtZQUNwQixJQUFJLE1BQU0sR0FBYyxFQUFFLENBQUM7WUFDM0IsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFDO2dCQUN6QixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNuQiwrQ0FBK0M7b0JBQy9DLHFFQUFxRTtvQkFDckUsSUFBRyxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFDO3dCQUM1QixJQUFHLEtBQUssQ0FBQyxhQUFhLEVBQUM7NEJBQ25CLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQzs0QkFDM0IsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO3lCQUNuQjtxQkFDSjtvQkFDRCwrQ0FBK0M7b0JBQy9DLCtDQUErQzt5QkFDMUMsSUFBRyxLQUFLLENBQUMsYUFBYSxFQUFDO3dCQUN4QixLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztxQkFDL0I7b0JBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLENBQUMsQ0FBQyxDQUFDO2FBQ047WUFDRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxxQkFBcUI7UUFDekIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ2pCLFVBQVUsRUFBRSxnQkFBZ0I7YUFDL0IsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUU7WUFDcEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUF4SUQsb0NBd0lDOzs7O0FDNUpELHFDQUFxQztBQUNyQyx3Q0FBd0M7O0FBRXhDLG1EQUE0QztBQUM1QywyRUFBb0U7QUFDcEUscURBQThDO0FBQzlDLGlEQUEwQztBQUMxQyx5RUFBa0U7QUFDbEUsK0NBQXFEO0FBQ3JELG1DQUFvSjtBQUNwSix1Q0FBZ0M7QUFDaEMsNkNBQTZDO0FBQzdDLCtDQUEwQztBQUMxQyxpREFBNEM7QUFtRDVDLE1BQU0sS0FBSztJQXVDQyxtQkFBbUIsQ0FBRSxHQUFHLGVBQWdDO1FBQzVELElBQUksS0FBSyxHQUFHO1lBQ1IsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1lBQ1QsT0FBTyxFQUFFLEVBQUU7WUFDWCxLQUFLLEVBQUUsRUFBRTtZQUNULFNBQVMsRUFBRSxFQUFFO1lBQ2IsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLFlBQVksRUFBRSxFQUFFO1lBQ2hCLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLFdBQVcsRUFBRSxFQUFFO1lBQ2YsVUFBVSxFQUFFLEVBQUU7WUFDZCxxQkFBcUIsRUFBRSxFQUFFO1lBQ3pCLFlBQVksRUFBRSxFQUFFO1NBQ25CLENBQUM7UUFDRixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsWUFBWSxFQUFFLGNBQXNCLEVBQUUsRUFBRTtZQUN0RSxZQUFZLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBQSxtQkFBVyxFQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdKLE9BQU8sWUFBWSxDQUFDO1FBQ3hCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFTyxZQUFZLENBQUUsTUFBZ0IsRUFBRSxJQUFpQjtRQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUNoQixPQUFPLElBQUEsdUJBQWUsR0FBRSxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUMzRCxjQUFjLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6RyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEsMkJBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUEsMkJBQW1CLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM3RCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFBLHNCQUFjLEVBQUMsY0FBYyxDQUFDLEVBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRU8sZ0JBQWdCLENBQUUsYUFBdUIsRUFBRSxJQUFpQjtRQUNoRSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN6QyxPQUFPLEtBQUssQ0FBQztTQUNoQjtRQUNELElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFXLEVBQUUsV0FBbUIsRUFBRSxFQUFFO1lBQzNFLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDckUsYUFBYSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFBLDJCQUFtQixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVPLDJCQUEyQixDQUFFLHdCQUFrQyxFQUFFLElBQWlCO1FBQ3RGLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRTtZQUMvRCxPQUFPLEtBQUssQ0FBQztTQUNoQjtRQUNELElBQUkseUJBQXlCLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBVyxFQUFFLFVBQWtCLEVBQUUsRUFBRTtZQUNoRyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDekYsWUFBWSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUEsMkJBQW1CLEVBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLHlCQUF5QixDQUFDLENBQUM7SUFDNUcsQ0FBQztJQUVPLGNBQWMsQ0FBRSxRQUFtQjtRQUN2QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFhLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDN0MsTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0MsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDWCxDQUFDO0lBZ0JPLHFCQUFxQixDQUFFLE1BQWUsRUFBRSxVQUF1QjtRQUNuRSxJQUFJLGtCQUFrQixHQUFrQixFQUFFLENBQUM7UUFDM0MsUUFBUSxVQUFVLEVBQUU7WUFDaEIsS0FBSyxTQUFTO2dCQUNWLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0YsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRixNQUFNO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNLLGtCQUFrQixDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xGLGtCQUFrQixDQUFDLFVBQVUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELElBQUksTUFBTSxDQUFDLGlCQUFpQixFQUFFO29CQUMxQixrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsQ0FBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFFLENBQUE7aUJBQ3BFO2dCQUNELGtCQUFrQixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixNQUFNO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQy9ELGtCQUFrQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNO1lBQ1YsS0FBSyxXQUFXO2dCQUNaLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDdkcsTUFBTTtZQUNWLEtBQUssY0FBYztnQkFDZixrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBRSxNQUF1QixDQUFDLG9CQUFvQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDbkgsTUFBTTtZQUNWO2dCQUNJLE1BQU07U0FDYjtRQUNELE9BQU8sa0JBQWtCLENBQUM7SUFDOUIsQ0FBQztJQUVPLGVBQWUsQ0FBSyxZQUEyQixFQUFFLFlBQVksRUFBRSxJQUF3SDtRQUMzTCxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDckIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQVMsRUFBRSxVQUFrQixFQUFFLFNBQWlCLEVBQUUsRUFBRTtZQUN6RixPQUFPLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUM3RCxZQUFZLEVBQUUsQ0FBQztnQkFDZixPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQXlCLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUYsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFTyxtQkFBbUIsQ0FBRSxZQUEyQixFQUFFLElBQWlCO1FBQ3ZFLElBQUksT0FBTyxHQUFHLENBQUMsWUFBMkIsRUFBd0IsRUFBRTtZQUM1RCxJQUFJLGtCQUFrQixHQUFHO2dCQUNqQixPQUFPLEVBQUUsUUFBUTtnQkFDakIsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsU0FBUyxFQUFFLFVBQVU7Z0JBQ3JCLEtBQUssRUFBRSxNQUFNO2dCQUNiLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixZQUFZLEVBQUUsYUFBYTtnQkFDM0IsY0FBYyxFQUFFLE9BQU87Z0JBQ3ZCLFdBQVcsRUFBRSxZQUFZO2dCQUN6QixZQUFZLEVBQUUsYUFBYTtnQkFDM0IsWUFBWSxFQUFFLGFBQWE7YUFDOUIsRUFDRCxRQUFRLEdBQVEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRTtnQkFDcEYsSUFBSSxPQUFPLEdBQUc7b0JBQ1YsUUFBUSxFQUFFLGtCQUFrQixDQUFDLFVBQVUsQ0FBQztvQkFDeEMsTUFBTSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxRQUFRO3FCQUNmO2lCQUNKLENBQUM7Z0JBQ0YsSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDaEMsSUFBSSxVQUFVLEtBQUssY0FBYyxJQUFJLFVBQVUsS0FBSyxnQkFBZ0IsRUFBRTt3QkFDbEUsT0FBTyxNQUFNLENBQUM7cUJBQ2pCO29CQUNELENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUNqRCxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1lBRVAsSUFBSSxZQUFZLENBQUMsY0FBYyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO2dCQUNuRSxRQUFRLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUU7NEJBQy9CLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxjQUFjOzRCQUMzQyxNQUFNLEVBQUU7Z0NBQ0osRUFBRSxFQUFFLGlCQUFpQjs2QkFDeEI7eUJBQ0osQ0FBQyxDQUFDLENBQUM7YUFDUDtZQUNELElBQUksWUFBWSxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTtnQkFDL0QsUUFBUSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFOzRCQUM3QixRQUFRLEVBQUUsa0JBQWtCLENBQUMsWUFBWTt5QkFDNUMsQ0FBQyxDQUFDLENBQUM7YUFDUDtZQUVELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFVBQVUsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxZQUFZLENBQUMscUJBQXFCLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNqRixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUM7Z0JBQzNCLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBQztnQkFDL0IsT0FBTyxJQUFJLE9BQU8sQ0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFDdkMsYUFBYSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1RixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRTt3QkFDekIsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3hCO29CQUNELElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO3dCQUN2QyxJQUFJLFNBQVMsR0FBYSxFQUFFLEVBQ3hCLGFBQWEsR0FBYSxFQUFFLEVBQzVCLGVBQWUsR0FBa0IsRUFBRSxFQUNuQyxZQUFZLEdBQVEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsRUFBRTs0QkFDL0gsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDOzRCQUN6RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0NBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO2dDQUN2QixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQ0FDakQsSUFBSSxVQUFVLEtBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO29DQUN0SSxPQUFPLEtBQUssQ0FBQztpQ0FDaEI7Z0NBQ0QsSUFBSSxVQUFVLEtBQUssV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtvQ0FDN0MsT0FBTyxLQUFLLENBQUM7aUNBQ2hCO2dDQUNELElBQUksVUFBVSxLQUFLLGdCQUFnQixFQUFFO29DQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO3dDQUMzRCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxjQUFjLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7d0NBQ2pJLE9BQU8sTUFBTSxDQUFDO3FDQUNqQjtvQ0FDRCxPQUFPLEtBQUssQ0FBQztpQ0FDaEI7Z0NBQ0QsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dDQUN0RSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFO29DQUN6RyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQ0FDakQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUEsbUJBQVcsRUFBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29DQUNqRSxPQUFPLE1BQU0sQ0FBQztnQ0FDbEIsQ0FBQyxDQUFDLENBQUM7Z0NBQ0gsU0FBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDM0QsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDdkUsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDO2dDQUM5QixPQUFPLGVBQWUsQ0FBQyxVQUFVLENBQUM7Z0NBQ2xDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ2xDLENBQUMsQ0FBQyxDQUFDOzRCQUNILE9BQU8sTUFBTSxDQUFDO3dCQUNsQixDQUFDLENBQUMsQ0FBQzt3QkFDUCxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLEVBQUU7NEJBQzdFLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMsRUFDMUMsUUFBUSxHQUFHLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDN0UsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQ0FDeEIsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO29DQUNuQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQ0FDekQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQ0FDekM7NEJBQ0wsQ0FBQyxDQUFDLENBQUM7NEJBQ0gsT0FBTyxNQUFNLENBQUM7d0JBQ2xCLENBQUMsRUFBRSxFQUFpQixDQUFDLENBQUM7d0JBQ3RCLGtDQUFrQzt3QkFDbEMsWUFBWSxDQUFDLGNBQWMsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7NEJBQy9HLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3ZELE9BQU8sTUFBTSxDQUFDO3dCQUNsQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDUixJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtnQ0FDckQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUEsMkJBQW1CLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDOzRCQUN2RixDQUFDLENBQUMsQ0FBQzs0QkFDSCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsTUFBTSxFQUFFO2dDQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzZCQUM1RDtpQ0FBTTtnQ0FDSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7NkJBQ2pCO3dCQUNMLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDZixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUM7UUFDTixPQUFPLElBQUksT0FBTyxDQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ2hELE9BQU8sT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVPLGtCQUFrQixDQUFFLFVBQW1CO1FBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztJQUN6QyxDQUFDO0lBWUQseUNBQXlDO0lBQ2pDLGlCQUFpQixDQUFFLEtBQWtCLEVBQUUsR0FBVyxFQUFFLFVBQWtCO1FBQzFFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFnQixDQUFDO1FBQ2pFLElBQUksR0FBRyxFQUFFO1lBQ0wsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUMvQixJQUFJLHVCQUF1QixHQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQWlCLENBQUMsU0FBUyxDQUFDO1lBQzVHLE9BQU8sQ0FBQyxTQUFTLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3JIO2FBQU07WUFDSCxPQUFPLENBQUMsU0FBUyxHQUFHLGtEQUFtRCxVQUFXLFdBQVcsQ0FBQztTQUNqRztJQUNMLENBQUM7SUFFTyx5QkFBeUIsQ0FBRSxLQUFrQixFQUFFLFVBQW1CO1FBQ3RFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFnQixDQUFDO1FBQ2pFLElBQUksVUFBVSxFQUFFO1lBQ1osT0FBTyxDQUFDLFNBQVMsR0FBRyx1RUFBdUUsQ0FBQztTQUMvRjthQUFNO1lBQ0gsT0FBTyxDQUFDLFNBQVMsR0FBRywyRUFBMkUsQ0FBQztTQUNuRztJQUNMLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsWUFBYSxHQUFHO1FBaFVDLGNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBc0IsQ0FBQztRQUN6RSxZQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQXNCLENBQUM7UUFDckUsNEJBQXVCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQXFCLENBQUM7UUFDdEgsMkJBQXNCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQXFCLENBQUM7UUFDcEgsaUNBQTRCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsaUNBQWlDLENBQXFCLENBQUM7UUFHaEksU0FBSSxHQUFnQjtZQUNqQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxpQkFBaUIsRUFBRSxFQUFFO1lBQ3JCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixZQUFZLEVBQUUsRUFBRTtZQUNoQixjQUFjLEVBQUUsRUFBRTtZQUNsQixVQUFVLEVBQUUsRUFBRTtZQUNkLFdBQVcsRUFBRSxFQUFFO1lBQ2YsSUFBSSxFQUFFLElBQUk7WUFDVixNQUFNLEVBQUUsRUFBRTtZQUNWLHFCQUFxQixFQUFFLEVBQUU7WUFDekIsWUFBWSxFQUFFLEVBQUU7WUFDaEIsWUFBWSxFQUFFLEVBQUU7U0FDbkIsQ0FBQztRQW1FTSwrQkFBMEIsR0FBRyxDQUFDLG9CQUEyQyxFQUFxRCxFQUFFO1lBQ3BJLE9BQU8sQ0FBQyxDQUFFLG9CQUFrRCxDQUFDLE9BQU8sQ0FBQztRQUN6RSxDQUFDLENBQUE7UUFFTyx5QkFBb0IsR0FBRyxDQUFDLG9CQUE0QyxFQUFFLGVBQTRCLElBQUksR0FBRyxFQUFVLEVBQUUsRUFBRTtZQUMzSCxJQUFJLENBQUMsb0JBQW9CLEVBQUU7Z0JBQ3ZCLE9BQU8sWUFBWSxDQUFDO2FBQ3ZCO1lBQ0QsTUFBTSxNQUFNLEdBQWdCLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxvQkFBb0IsQ0FBQztnQkFDN0UsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzFELENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUseUJBQXlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNySyxPQUFPLE1BQU0sQ0FBQztRQUNsQixDQUFDLENBQUM7UUF1TGUsa0JBQWEsR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLEVBQUUsRUFBRTtZQUNqRCxJQUFJLE9BQU8sRUFBRTtnQkFDVCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQWlCLENBQUMsYUFBNEIsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNySDtpQkFBTTtnQkFDSCxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDdkI7UUFDTCxDQUFDLENBQUE7UUF1Q0QseUJBQXlCO1FBQ3pCLGVBQVUsR0FBRyxHQUFHLEVBQUU7WUFDZCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkIsSUFBQSwwQkFBa0IsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDWCxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztnQkFDckQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFBO1FBRUQsZ0JBQVcsR0FBRyxHQUFHLEVBQUU7WUFDZixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsQ0FBQyxDQUFBO1FBRUQseUJBQW9CLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUE7UUFqQ0csSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksdUJBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxtQ0FBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksd0JBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksc0JBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxrQ0FBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUkseUJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4QyxzRUFBc0U7UUFDdEUsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSx5QkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSwyQkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxpQkFBTyxFQUFFLENBQUM7SUFDakMsQ0FBQztJQXVCRCxnQkFBZ0I7UUFDWixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekYsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkcsQ0FBQztJQUVELE1BQU07UUFDRixzRUFBc0U7UUFDdEUsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDdEIsaUJBQWlCO1FBQ2pCLElBQUksa0JBQWtCLEdBQVksUUFBUSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBaUIsQ0FBQyxTQUFTLEVBQ3JHLFdBQVcsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBZ0IsRUFDbkYsdUJBQXVCLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQWdCLEVBQzNHLFVBQVUsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQWdCLEVBQ2pGLFlBQVksR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBZ0IsRUFDckYsZUFBZSxHQUFnQixRQUFRLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFnQixFQUMzRixXQUFXLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQWdCLEVBQ25GLG1CQUFtQixHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLDJCQUEyQixDQUFnQjtRQUNyRyxzRUFBc0U7UUFDdEUsVUFBVSxHQUFnQixRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBZ0IsRUFDakYsbUJBQW1CLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQWdCLENBQUM7UUFDdEcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixPQUFPLElBQUEsZ0JBQVEsRUFBQztZQUNaLCtFQUErRTtZQUMvRSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtZQUMxQixxRUFBcUU7WUFDckUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRTtZQUN0QyxzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7WUFDekIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRTtZQUNyQyx3QkFBd0I7WUFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLE9BQU8sQ0FBQztZQUNqRSxzRUFBc0U7WUFDdEUsNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFO1NBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNoQixJQUFJLG1CQUFrQyxFQUNsQyxpQkFBZ0MsRUFDaEMsNkJBQTRDLEVBQzVDLFlBQTJCLEVBQzNCLFNBQVMsQ0FBQztZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1SCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxRQUFlLEVBQUUsVUFBdUIsRUFBRSxFQUFFO2dCQUMvRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ25DLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQy9ELE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDcEQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDMUIsSUFBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxJQUFFLElBQUksRUFBQztnQkFDekMsSUFBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUM7b0JBQ1YsMkNBQTJDO29CQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQzNEO2FBQ0o7WUFDRCxJQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLElBQUUsSUFBSSxFQUFDO2dCQUMxQyxJQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQztvQkFDVixnREFBZ0Q7b0JBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQzt3QkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7cUJBQzVDO2lCQUNKO2FBQ0o7WUFDRCxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEcsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRCxtQkFBbUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdFLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkUsNkJBQTZCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0csWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1lBQ2pJLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTs7WUFDVCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdGLElBQUksV0FBVyxFQUFFO2dCQUNiLG1CQUFtQixDQUFDLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQzVGO1lBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFBLE1BQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLDBDQUFFLE1BQU0sS0FBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUUsc0VBQXNFO1lBQ3RFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsNEJBQTRCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0YsbURBQW1EO1lBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0YsSUFBSSxDQUFDLHNCQUFzQixDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUYsSUFBSSxDQUFDLDRCQUE0QixDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEcsQ0FBQztDQUNKO0FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsR0FBRztJQUM5QixJQUFJLEtBQVksQ0FBQztJQUVqQixPQUFPO1FBQ0gsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUNqQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkIsUUFBUSxFQUFFLENBQUM7UUFDZixDQUFDO1FBQ0QsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUNSLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFDRCxJQUFJLEVBQUUsR0FBRyxFQUFFO1lBQ1AsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25CLENBQUM7S0FDSixDQUFDO0FBQ04sQ0FBQyxDQUFDOzs7OztBQ3pqQkYsbUNBQXdEO0FBZXhELE1BQXFCLHdCQUF3QjtJQU16QyxZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsMkxBQTJMO0lBQ25MLHdCQUF3QjtRQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO2dCQUNmLENBQUMsS0FBSyxFQUFFO3dCQUNKLFVBQVUsRUFBRSxrQkFBa0I7cUJBQ2pDLENBQUM7Z0JBQ0YsQ0FBQyxvQ0FBb0MsRUFBRSxFQUFFLENBQUM7Z0JBQzFDLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxDQUFDLDhCQUE4QixFQUFFLEVBQUUsQ0FBQzthQUN2QyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFBQSxDQUFDO0lBRU0sZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBQUEsQ0FBQztJQUVLLGVBQWUsQ0FBRSxpQkFBaUI7UUFDckMsSUFBSSxZQUFZLEdBQWtDO1lBQzFDLEtBQUssRUFBRSxFQUFFO1lBQ1QsS0FBSyxFQUFFLEVBQUU7WUFDVCxNQUFNLEVBQUUsRUFBRTtZQUNWLHFCQUFxQixFQUFFLEVBQUU7U0FDNUIsRUFDRCxtQkFBbUIsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ2hDLElBQUksRUFBRSxHQUF1QixTQUFTLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQXVCLFNBQVMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMvQixNQUFNLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkYsUUFBUSxTQUFTLENBQUMsYUFBYSxFQUFFO2dCQUM3QixLQUFLLE9BQU8sQ0FBQztnQkFDYixLQUFLLFVBQVUsQ0FBQztnQkFDaEIsS0FBSyxnQkFBZ0IsQ0FBQztnQkFDdEIsS0FBSyxTQUFTLENBQUM7Z0JBQ2YsS0FBSyxhQUFhLENBQUM7Z0JBQ25CLEtBQUssd0JBQXdCLENBQUM7Z0JBQzlCLEtBQUssWUFBWSxDQUFDO2dCQUNsQixLQUFLLGNBQWM7b0JBQ2YsRUFBRSxHQUFHLFNBQVMsQ0FBQyxzQkFBc0IsSUFBSSxTQUFTLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDO29CQUM3RSxJQUFJLEdBQUcsdUJBQXVCLENBQUM7b0JBQy9CLE1BQU07Z0JBQ1YsS0FBSyxlQUFlO29CQUNoQixFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxHQUFHLFFBQVEsQ0FBQztvQkFDaEIsTUFBTTthQUNiO1lBQ0QsRUFBRSxJQUFJLElBQUksSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkYsQ0FBQyxFQUNELGVBQWUsR0FBRyxDQUFDLFVBQVUsRUFBRSxZQUEyQyxFQUFpQyxFQUFFO1lBQ3pHLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDakQsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQy9CLE9BQU8sWUFBWSxDQUFDO1lBQ3hCLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUM7UUFDTixPQUFPLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQTJDLEVBQUUsZ0JBQW1DLEVBQUUsRUFBRTtZQUNqSCxZQUFZLENBQUMsS0FBSyxHQUFHLElBQUEsbUJBQVcsRUFBQyxZQUFZLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRyxZQUFZLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMxRSxPQUFPLFlBQVksQ0FBQztRQUN4QixDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUFBLENBQUM7SUFFSyxLQUFLO1FBQ1IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUU7YUFDN0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxFQUFFLEVBQUU7WUFDdkUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUEsMEJBQWtCLEVBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxZQUFZLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzNHLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ2xDLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQ3BCLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUNQLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0lBQUEsQ0FBQztJQUVLLDJCQUEyQixDQUFFLFVBQWtCO1FBQ2xELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFBQSxDQUFDO0lBRUsseUJBQXlCLENBQUUsUUFBa0I7UUFDaEQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQXdCLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDL0UsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xGLE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUFBLENBQUM7SUFFSyxNQUFNO1FBQ1QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUFBLENBQUM7Q0FDTDtBQXZHRCwyQ0F1R0M7Ozs7O0FDdEhELHdDQUF3QztBQUN4QyxtQ0FBOEQ7QUFxQjlELE1BQXFCLGFBQWE7SUFVOUIsWUFBWSxHQUFRO1FBQ2hCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFRCxrREFBa0Q7SUFDMUMsU0FBUztRQUNiLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztvQkFDZixDQUFDLEtBQUssRUFBRTs0QkFDSixRQUFRLEVBQUUsT0FBTzt5QkFDcEIsQ0FBQztvQkFDRixDQUFDLEtBQUssRUFBRTs0QkFDSixRQUFRLEVBQUUsTUFBTTt5QkFDbkIsQ0FBQztpQkFDTCxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUFBLENBQUM7SUFFTSxTQUFTLENBQUUsT0FBZSxFQUFFLFdBQStCLEVBQUUsY0FBdUIsS0FBSztRQUM3RixJQUFJLFVBQVUsR0FBa0IsSUFBSSxFQUNoQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUNwQyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUMzQyxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQixJQUFJLEtBQUssQ0FBQyxFQUFFLEtBQUssT0FBTyxFQUFFO2dCQUN0QixVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUNuQixPQUFPLFVBQVUsQ0FBQzthQUNyQjtpQkFBTTtnQkFDSCxJQUFJLFdBQVcsRUFBRTtvQkFDYixVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUN6RCxPQUFPLFVBQVUsQ0FBQztpQkFDckI7cUJBQU07b0JBQ0gsT0FBTyxLQUFLLENBQUM7aUJBQ2hCO2FBQ0o7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sVUFBVSxDQUFDO0lBQ3RCLENBQUM7SUFBQSxDQUFDO0lBRU0sdUJBQXVCLENBQUUsT0FBZTtRQUM1QyxJQUFJLFVBQVUsR0FBRyxJQUFJLEVBQ2pCLG1CQUFtQixHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBVyxFQUFFO1lBQzdDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxLQUFLLENBQUMsRUFBRSxLQUFLLE9BQU8sRUFBRTtvQkFDdEIsT0FBTyxJQUFJLENBQUM7aUJBQ2Y7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQztRQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25CLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUNwQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixPQUFPLElBQUksQ0FBQzthQUNmO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLFVBQVUsQ0FBQztJQUN0QixDQUFDO0lBQUEsQ0FBQztJQUVNLG1CQUFtQixDQUFFLE9BQWU7UUFDeEMsT0FBTztZQUNILEVBQUUsRUFBRSxPQUFPO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUM7WUFDM0MsUUFBUSxFQUFFLEVBQUU7WUFDWixJQUFJLEVBQUUsc0JBQXNCO1lBQzVCLE1BQU0sRUFBRTtnQkFDSixFQUFFLEVBQUUsb0JBQW9CO2dCQUN4QixRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQzthQUM5QjtTQUNKLENBQUM7SUFDTixDQUFDO0lBQUEsQ0FBQztJQUVRLGdCQUFnQixDQUFFLE1BQWdCO1FBQ3hDLElBQUksVUFBVSxFQUNWLGdCQUFnQixHQUFHLFVBQVUsSUFBSTtZQUM3QixJQUFJLFFBQWtCLEVBQ2xCLEVBQVUsQ0FBQztZQUVmLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRXpCLElBQUksUUFBUSxFQUFFO2dCQUNWLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbEQsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBRXBCLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFO3dCQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO3dCQUMvQixPQUFPLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDekI7b0JBQ0QsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0QzthQUNKO1FBQ0wsQ0FBQyxDQUFDO1FBRU4sVUFBVSxHQUFHLElBQUEsMEJBQWtCLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQzdDLElBQUksU0FBUyxHQUFHLElBQUEsY0FBTSxFQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3BCLFNBQVMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNuRDtZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbEMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNyQyxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFBQSxDQUFDO0lBRVEsZ0JBQWdCO1FBQ3RCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBQUEsQ0FBQztJQUVGLHVEQUF1RDtJQUNoRCxLQUFLO1FBQ1IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO2FBQzlCLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQU0sRUFBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUFBLENBQUM7SUFFSyxvQkFBb0IsQ0FBRSxNQUFnQixFQUFFLHFCQUE4QixLQUFLO1FBQzlFLElBQUksUUFBUSxHQUFhLEVBQUUsRUFDdkIsV0FBVyxHQUFhLEVBQUUsRUFDMUIsZUFBZSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxRQUFRLEdBQUcsSUFBQSxjQUFNLEVBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3JCLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDaEM7WUFDRCxRQUFRLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdELFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNwRixJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNsQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUMxQjtRQUNMLENBQUMsRUFDRCxnQkFBZ0IsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3hCLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7b0JBQzVCLElBQUksU0FBUyxDQUFDO29CQUNkLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7d0JBQ25DLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUMzQjtvQkFDRCxTQUFTLEdBQUcsSUFBQSxjQUFNLEVBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM5QixTQUFTLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN6RSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3BHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7d0JBQ25DLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzVCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUMzQjtnQkFDTCxDQUFDLENBQUMsQ0FBQzthQUNOO1FBQ0wsQ0FBQyxDQUFDO1FBRU4sTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoQyxDQUFDLGtCQUFrQixJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxPQUFPLFdBQVcsQ0FBQztJQUN2QixDQUFDO0lBQUEsQ0FBQztJQUVLLGFBQWEsQ0FBRSxRQUFrQixFQUFFLHFCQUE4QixLQUFLO1FBQ3pFLElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUN0RyxDQUFDO1FBQ0YsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDckUsQ0FBQztJQUFBLENBQUM7SUFFSyxtQkFBbUIsQ0FBRSxRQUFrQixFQUFFLFNBQW1CO1FBQy9ELElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFDN0MsVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQ3ZHLENBQUM7UUFDTixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUFBLENBQUM7SUFFSyxxQkFBcUIsQ0FBQyxNQUFnQjtRQUN6QyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFnQixFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzdDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGVBQWUsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDWCxDQUFDO0lBQUEsQ0FBQztJQUVLLE1BQU07UUFDVCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBQUEsQ0FBQztDQUNMO0FBbk5ELGdDQW1OQzs7Ozs7O0FDek9ELG1DQUE2QztBQXFCN0MsTUFBYSxXQUFXO0lBWVosZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsWUFBWSxHQUFHO1FBWEUsd0JBQW1CLEdBQUc7WUFDbkMsVUFBVSxFQUFFLGFBQWE7WUFDekIsSUFBSSxFQUFFLFdBQVc7WUFDakIsTUFBTSxFQUFFLFFBQVE7U0FDbkIsQ0FBQztRQVFFLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFRCx3RUFBd0U7SUFDeEUsS0FBSyxDQUFFLGtCQUEyQjtRQUM5QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQy9DLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ2hDLElBQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO29CQUNYLENBQUMsS0FBSyxFQUFFOzRCQUNKLFFBQVEsRUFBRSxNQUFNOzRCQUNoQixNQUFNLEVBQUU7Z0NBQ0osSUFBSSxFQUFFLFFBQVE7NkJBQ2pCO3lCQUNKLENBQUM7b0JBQ0YsQ0FBQyxLQUFLLEVBQUU7NEJBQ0osUUFBUSxFQUFFLGdCQUFnQjt5QkFDN0IsQ0FBQztpQkFDTCxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQVcsRUFBRSxFQUFFO1lBQ3BCLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQ3ZDLGNBQWMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUMxQyxpQkFBaUIsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLEVBQ2hELG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxXQUFXLEVBQ2pELGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztZQUN2SCxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUMvQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsdUJBQXVCLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFDO1lBQ2pFLElBQUksTUFBTSxHQUFjO2dCQUNwQixXQUFXLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLGFBQWE7b0JBQ3BCLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDO2lCQUMvQztnQkFDRCxNQUFNLEVBQUUsRUFBRTtnQkFDVixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7Z0JBQzdCLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7YUFDeEQsQ0FBQztZQUNGLElBQUksa0JBQWtCLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDO2dCQUN4RCxNQUFNLENBQUMsc0JBQXNCLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFDO2dCQUN0RSxNQUFNLENBQUMsNkJBQTZCLEdBQUcsY0FBYyxDQUFDLHlCQUF5QixDQUFDO2dCQUNoRixNQUFNLENBQUMsMEJBQTBCLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFDO2dCQUMxRSxNQUFNLENBQUMsa0NBQWtDLEdBQUcsY0FBYyxDQUFDLDhCQUE4QixDQUFDO2FBQzdGO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVELGtCQUFrQixDQUFFLGFBQXFCO1FBQ3JDLE9BQU8sQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUM1RixDQUFDO0lBRUQsa0JBQWtCLENBQUUsYUFBcUI7UUFDckMsT0FBTyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDO0lBQ2xMLENBQUM7SUFFRCxrQkFBa0IsQ0FBRSxhQUFxQjtRQUNyQyxPQUFPLGFBQWEsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUFyRkQsa0NBcUZDOzs7OztBQ3hHRCx5REFBbUY7QUFDbkYsaUNBQWlDO0FBRWpDLE1BQU0sb0JBQW9CLEdBQUcsV0FBVyxDQUFDO0FBMkN6QyxNQUFxQixjQUFjO0lBUXZCLFVBQVU7UUFDZCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO2dCQUNmLENBQUMsb0JBQW9CLEVBQUU7d0JBQ25CLHdCQUF3QixFQUFFLElBQUk7d0JBQzlCLGlCQUFpQixFQUFFLEtBQUs7cUJBQzNCLENBQUM7Z0JBQ0YsQ0FBQyxLQUFLLEVBQUU7d0JBQ0osVUFBVSxFQUFFLGdCQUFnQjt3QkFDNUIsUUFBUSxFQUFFOzRCQUNOLGlCQUFpQixFQUFFLEtBQUs7eUJBQzNCO3FCQUNKLENBQUM7Z0JBQ0YsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUM7YUFDNUIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8seUJBQXlCLENBQUUsT0FBd0I7UUFDdkQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFO2dCQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFO3dCQUNiLFVBQVUsRUFBRSxhQUFhO3dCQUN6QixRQUFRLEVBQUU7NEJBQ04sRUFBRSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO3lCQUNqQztxQkFDSixDQUFDLENBQUMsQ0FBQTthQUNOO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDLEVBQUUsRUFBVyxDQUFDLENBQUM7UUFDaEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbEIsT0FBTyxDQUFDLE9BQW9CLENBQUMsQ0FBQztnQkFDOUIsT0FBTzthQUNWO1lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBbUMsRUFBRSxFQUFFO2dCQUNqRSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDckYsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3RFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN6Qix1Q0FDTyxNQUFNLEtBQ1QsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixJQUFJLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFDL0Y7Z0JBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNSLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLGdCQUFnQixDQUFFLE9BQU8sRUFBRSxTQUFTO1FBQ3hDLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUNqQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxVQUFVLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUM7UUFDTixPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDdEMsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLEVBQUUsRUFDeEIsZUFBZSxHQUFHLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RELElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRTtnQkFDeEIsUUFBUSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7Z0JBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdEI7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTyxnQkFBZ0I7UUFDcEIsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFTyxjQUFjLENBQUUsZUFBZ0M7UUFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUE2QixFQUFFLEtBQWEsRUFBRSxFQUFFO1lBQ3BFLElBQUksWUFBWSxDQUFDLEVBQUUsS0FBSyxlQUFlLENBQUMsRUFBRSxFQUFFO2dCQUN4QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLGVBQWUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUM7YUFDZjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFlBQVksR0FBRztRQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFTSxLQUFLO1FBQ1IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFO2FBQy9CLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUN6QixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQzFFLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUMsRUFBRSxFQUFFO1lBQzNDLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1lBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBQzlCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ2xDLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQ3BCLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUNQLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0lBRU0sZUFBZSxDQUFFLE9BQTBCO1FBQzlDLElBQUksZUFBZSxHQUF3QjtZQUNuQyxPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixNQUFNLEVBQUUsRUFBRTtZQUNWLEtBQUssRUFBRSxFQUFFO1NBQ1osQ0FBQztRQUNOLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLG1CQUF3QyxFQUFFLFFBQXlCLEVBQUUsRUFBRTtZQUMxRixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzNELG1CQUFtQixDQUFDLE1BQU07b0JBQ3RCLEtBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUM1QyxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFDbkMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsRUFDckQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsK0JBQStCLENBQUMsRUFDNUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQ3hDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGdCQUFnQixJQUFJLElBQUEsNkNBQTBCLEVBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckksbUJBQW1CLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQ3pDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsb0JBQW9CLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdkgsbUJBQW1CLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuTCxtQkFBbUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzNLLG1CQUFtQixDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUM3QyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ25KLE9BQU8sbUJBQW1CLENBQUM7WUFDL0IsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDNUIsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFTSxPQUFPO1FBQ1YsSUFBSSxXQUFXLEdBQUcsRUFBRSxFQUNoQixRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFlLEVBQUUsUUFBeUIsRUFBRSxFQUFFO1lBQy9FLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtnQkFDNUMsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sSUFBSSxXQUFXLEVBQUU7b0JBQzFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xCLFlBQVksRUFBRyxDQUFDO2lCQUNsQjtnQkFDRCxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFO3dCQUNoQyxVQUFVLEVBQUUsZ0JBQWdCO3dCQUM1QixRQUFRLEVBQUU7NEJBQ04sRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFOzRCQUNmLGlCQUFpQixFQUFFLElBQUk7eUJBQzFCO3FCQUNKLENBQUMsQ0FBQyxDQUFDO2FBQ1A7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNwQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ04sWUFBWSxHQUFZLEVBQUUsRUFDMUIsY0FBYyxHQUFHLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sSUFBSSxPQUFPLENBQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLEVBQ0QsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUV2QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDakQsT0FBTyxRQUFRO2lCQUNWLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDUCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ0gsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUNKLENBQUM7UUFDVixDQUFDLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUM1QixJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1AsYUFBYSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3BELFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksUUFBUSxHQUFvQixZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztnQkFDckYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbkYsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDbEMsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDcEIsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNWLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFTSxnQkFBZ0I7UUFDbkIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7SUFDakMsQ0FBQztJQUVNLHVCQUF1QjtRQUMxQixJQUFJLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBZSxFQUFFLEVBQUU7WUFDL0MsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQy9CLGNBQWMsR0FBWSxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUM1RCxPQUFPLEdBQVksQ0FBQyxjQUFjLElBQUksTUFBTSxDQUFDLGdCQUFnQixLQUFLLFVBQVUsQ0FBQztZQUNqRixPQUFPLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0QyxPQUFPLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFTSxNQUFNO1FBQ1QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBbk5ELGlDQW1OQzs7Ozs7QUNuUUQsd0NBQXdDO0FBQ3hDLGtDQUFrQztBQUNsQyxtQ0FBK0U7QUFtQi9FLE1BQU0sbUJBQW1CLEdBQUcsNEJBQTRCLENBQUM7QUFFekQsTUFBcUIsWUFBWTtJQUtyQix3QkFBd0IsQ0FBRSxJQUFXO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2xFLENBQUM7SUFFTyxRQUFRO1FBQ1osT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztnQkFDZixDQUFDLEtBQUssRUFBRTt3QkFDSixVQUFVLEVBQUUsTUFBTTtxQkFDckIsQ0FBQztnQkFDRixDQUFDLEtBQUssRUFBRTt3QkFDSixRQUFRLEVBQUUsTUFBTTt3QkFDaEIsTUFBTSxFQUFFOzRCQUNKLFFBQVEsRUFBRSx3QkFBd0I7eUJBQ3JDO3FCQUNKLENBQUM7YUFDTCxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQXFCLEVBQUUsRUFBRTtnQkFDM0QsOEtBQThLO2dCQUM5SywrSEFBK0g7Z0JBQy9ILE1BQU0sYUFBYSxHQUFHLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQWdDLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQzlGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNoRSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO29CQUN2QyxPQUFPLEdBQUcsQ0FBQztnQkFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ1AsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDL0IsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlELE1BQU0seUJBQXlCLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQ25FLE9BQU8seUJBQXlCLENBQUMsQ0FBQyxpQ0FBTSxJQUFJLEtBQUUsTUFBTSxFQUFFLHlCQUF5QixJQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzdGLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDUCxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxjQUFjLENBQUUsS0FBSztRQUN6QixPQUFPLElBQUEsMkJBQW1CLEVBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRU8sZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsWUFBWSxHQUFHO1FBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVNLGVBQWUsQ0FBRSxLQUFjO1FBQ2xDLElBQUksWUFBWSxHQUFzQjtZQUM5QixPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1lBQ1QsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLFNBQVMsRUFBRSxFQUFFO1lBQ2IsWUFBWSxFQUFFLEVBQUU7WUFDaEIsTUFBTSxFQUFFLEVBQUU7WUFDVixXQUFXLEVBQUUsRUFBRTtZQUNmLGNBQWMsRUFBRSxFQUFFO1NBQ3JCLEVBQ0QsbUJBQW1CLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNoQyxJQUFJLEVBQUUsR0FBdUIsU0FBUyxDQUFDO1lBQ3ZDLElBQUksSUFBSSxHQUF1QixTQUFTLENBQUM7WUFDekMsUUFBUSxTQUFTLENBQUMsYUFBYSxFQUFFO2dCQUM3QixLQUFLLGVBQWUsQ0FBQztnQkFDckIsS0FBSyxvQkFBb0I7b0JBQ3JCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDO29CQUN6RSxJQUFJLEdBQUcsV0FBVyxDQUFDO29CQUNuQixNQUFNO2dCQUNWLEtBQUssUUFBUTtvQkFDVCxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxHQUFHLE9BQU8sQ0FBQztvQkFDZixNQUFNO2dCQUNWLEtBQUssUUFBUTtvQkFDVCxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxHQUFHLFNBQVMsQ0FBQztvQkFDakIsTUFBTTtnQkFDVixLQUFLLGNBQWMsQ0FBQztnQkFDcEIsS0FBSyxhQUFhLENBQUM7Z0JBQ25CLEtBQUssYUFBYSxDQUFDO2dCQUNuQixLQUFLLFlBQVk7b0JBQ2IsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO3dCQUNoQixFQUFFLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQzt3QkFDekMsSUFBSSxHQUFHLE9BQU8sQ0FBQztxQkFDbEI7eUJBQU07d0JBQ0gsRUFBRSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUMzQixJQUFJLEdBQUcsV0FBVyxDQUFDO3FCQUN0QjtvQkFDRCxNQUFNO2dCQUNWLEtBQUssOEJBQThCLENBQUM7Z0JBQ3BDLEtBQUssdUJBQXVCLENBQUM7Z0JBQzdCLEtBQUssT0FBTztvQkFDUixJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7d0JBQ3RCLEVBQUUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDO3dCQUNyRCxJQUFJLEdBQUcsYUFBYSxDQUFDO3FCQUN4QjtvQkFDRCxNQUFNO2dCQUNWO29CQUNJLE1BQU07YUFDYjtZQUNELEVBQUUsSUFBSSxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsRUFDRCxlQUFlLEdBQUcsQ0FBQyxlQUFlLEVBQUUsWUFBK0IsRUFBcUIsRUFBRTtZQUN0RixJQUFJLFVBQVUsR0FBRyxlQUFlLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztZQUNoRCxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNyQyxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ2pELElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTtvQkFDcEIsWUFBWSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQzNEO2dCQUNELG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQixPQUFPLFlBQVksQ0FBQztZQUN4QixDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDO1FBQ04sT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsWUFBK0IsRUFBRSxJQUFXLEVBQUUsRUFBRTtZQUNqRSxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUEsbUJBQVcsRUFBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0YsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNoQixZQUFZLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDaEU7WUFDRCxPQUFPLFlBQVksQ0FBQztRQUN4QixDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVNLEtBQUs7UUFDUixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7YUFDN0IsSUFBSSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFBLDBCQUFrQixFQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3pELE9BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUNoRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVNLFlBQVksQ0FBRSxRQUFrQjtRQUNuQyxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVNLE1BQU07UUFDVCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUFuSkQsK0JBbUpDOzs7O0FDMUtELHdDQUF3Qzs7O0FBc0JqQyxNQUFNLHVCQUF1QixHQUFHLENBQUMsRUFBVSxFQUFFLEdBQUcsRUFBOEIsRUFBRTtJQUNuRixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osUUFBUSxFQUFFLGFBQWE7WUFDdkIsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO1NBQ2pCLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3hCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBUFksUUFBQSx1QkFBdUIsMkJBT25DO0FBRU0sTUFBTSxhQUFhLEdBQUcsQ0FBTyxJQUE2QyxFQUFpQyxFQUFFLENBQUMsSUFBSSxJQUFLLElBQThCLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztBQUF2SyxRQUFBLGFBQWEsaUJBQTBKO0FBRTdLLE1BQU0sMEJBQTBCLEdBQUcsQ0FBQyxLQUE4QyxFQUFFLEVBQUU7SUFDekYsSUFBSSxRQUFRLEdBQWEsRUFBRSxDQUFDO0lBQzVCLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBMEIsRUFBRSxVQUFVLEVBQWlCLEVBQWUsRUFBRTtRQUN6RixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDeEQsSUFBSSxJQUFBLHFCQUFhLEVBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzFCLE9BQU8sV0FBVyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUN0QztZQUNELElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDM0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRCxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2hCLENBQUMsQ0FBQztJQUNGLE9BQU8sSUFBQSxxQkFBYSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDL0UsQ0FBQyxDQUFDO0FBZFcsUUFBQSwwQkFBMEIsOEJBY3JDOzs7OztBQy9DRix3Q0FBd0M7QUFDeEMsbURBQTRDO0FBQzVDLGlDQUFpQztBQUVqQyxNQUFxQix5QkFBMEIsU0FBUSx1QkFBYTtJQUVoRSxZQUFZLEdBQVE7UUFDaEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUVPLGlCQUFpQjtRQUNyQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDYixRQUFRLEVBQUUsT0FBTztvQkFDakIsTUFBTSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxpQkFBaUI7cUJBQ3hCO2lCQUNKLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQUEsQ0FBQztJQUVLLEtBQUs7UUFDUixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRTthQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDWCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5RSxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUFBLENBQUM7Q0FDTDtBQWxDRCw0Q0FrQ0M7Ozs7OztBQ3RDRCx3Q0FBd0M7QUFheEMsSUFBSSxhQUFhLEdBQUcsVUFBVSxFQUFXO0lBQ2pDLElBQUksS0FBSyxHQUFHLE9BQU8sRUFBRSxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ3ZFLE9BQU87UUFDSCxHQUFHLEVBQUU7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUNELEdBQUcsRUFBRSxVQUFVLElBQUk7WUFDZixFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7S0FDSixDQUFDO0FBQ04sQ0FBQyxFQUNELGFBQWEsR0FBRyxVQUFVLEdBQUc7SUFDekIsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLENBQUMsQ0FBQztBQU1OLFNBQWdCLFdBQVcsQ0FBQyxFQUFXLEVBQUUsSUFBWTtJQUNqRCxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ0wsT0FBTztLQUNWO0lBQ0QsSUFBSSxVQUFVLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUNwQyxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFDL0IsVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDakUsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQVJELGtDQVFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJO0lBQzdCLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDTCxPQUFPO0tBQ1Y7SUFDRCxJQUFJLFVBQVUsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQ3BDLE9BQU8sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUM5QixhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDbEQ7QUFDTCxDQUFDO0FBVEQsNEJBU0M7QUFFRCxTQUFnQixRQUFRLENBQUMsRUFBVyxFQUFFLFNBQWlCO0lBQ25ELE9BQU8sRUFBRSxJQUFJLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBZ0IsTUFBTSxDQUFDLEdBQUcsSUFBVztJQUNqQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUNwQixHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFDckIsUUFBUSxHQUFHLEtBQUssRUFDaEIsT0FBTyxFQUNQLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFNUIsSUFBSSxPQUFPLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDMUIsUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUNmLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZCxDQUFDLEVBQUUsQ0FBQztLQUNQO0lBQ0QsT0FBTyxDQUFDLEtBQUssTUFBTSxFQUFFO1FBQ2pCLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZCxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDakMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLFFBQVEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hFLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUgsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0gsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNyQztTQUNKO1FBQ0QsQ0FBQyxFQUFFLENBQUM7S0FDUDtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQTVCRCx3QkE0QkM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxRQUFlLEVBQUUsY0FBcUM7SUFDckYsSUFBSSxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQ2pCLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBRXhCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BCLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2IsTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7WUFDMUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQ25FO0tBQ0o7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFYRCxnREFXQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLFFBQWUsRUFBRSxhQUE4QjtJQUMvRSxJQUFJLFVBQVUsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsVUFBaUIsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEVBQUU7UUFDbEUsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLEtBQUssRUFBRTtZQUM1QixPQUFPLENBQUMsQ0FBQztTQUNaO1FBQ0QsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUMzQixDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUN0RSxhQUFxQixDQUFDO1FBQzFCLGFBQWEsR0FBRyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN6QyxPQUFPLENBQUMsR0FBRyxhQUFhLENBQUM7U0FDNUI7YUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDaEQsT0FBTyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUM7U0FDN0I7YUFBTTtZQUNILE9BQU8sVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNoRTtJQUNMLENBQUMsQ0FBQztJQUNGLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsRUFBRTtRQUNoRCxPQUFPLFVBQVUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXBCRCxrREFvQkM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxRQUFRLEdBQUcsV0FBVztJQUNyRixJQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDLEVBQ3pDLElBQUksQ0FBQztJQUNULElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxQyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNiLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFURCxnREFTQztBQUVELFNBQWdCLG1CQUFtQixDQUFFLEdBQUcsT0FBb0I7SUFDeEQsSUFBSSxRQUFRLEdBQWEsRUFBRSxFQUN2QixXQUFXLEdBQWMsRUFBRSxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzVDLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDckQsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkIsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQjtJQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDSixPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDO0FBVkQsa0RBVUM7QUFFRCxTQUFnQixjQUFjLENBQUUsWUFBdUI7SUFDbkQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFnQixFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ25GLE1BQU0sSUFBSSxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDakIsQ0FBQztBQUxELHdDQUtDO0FBRUQsU0FBZ0IsV0FBVyxDQUFFLEdBQUcsT0FBbUI7SUFDL0MsSUFBSSxXQUFXLEdBQWEsRUFBRSxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDckIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNDLElBQUksSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUFSRCxrQ0FRQztBQUVELFNBQWdCLGlCQUFpQixDQUFFLFdBQXNCLEVBQUUsZUFBMEI7SUFDakYsSUFBSSxvQkFBb0IsR0FBRyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFjLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDakQsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNYLENBQUM7QUFORCw4Q0FNQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxRQUF3QjtJQUM3QyxJQUFJLE9BQU8sR0FBVSxFQUFFLEVBQ25CLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDckIsT0FBTyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbkMsSUFBSSxVQUFVLEdBQUcsR0FBRyxFQUFFO1lBQ2xCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQztRQUNGLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNwQixZQUFZLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUN4QixZQUFZLEtBQUssUUFBUSxDQUFDLE1BQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZixNQUFNLENBQUM7b0JBQ0gsS0FBSyxFQUFFLEtBQUs7b0JBQ1osWUFBWSxFQUFFLEtBQUs7aUJBQ3RCLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXJCRCw0QkFxQkM7QUFFRCxTQUFnQixlQUFlLENBQUssR0FBTztJQUN2QyxPQUFPLElBQUksT0FBTyxDQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELDBDQUVDO0FBRUQsU0FBZ0IsT0FBTyxDQUFFLElBQUk7SUFDekIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUZELDBCQUVDOzs7OztBQ3ZNRCxNQUFxQixPQUFPO0lBQTVCO1FBR1ksV0FBTSxHQUFnQixRQUFRLENBQUMsSUFBSSxDQUFDO0lBeUJoRCxDQUFDO0lBdkJVLEtBQUssQ0FBQyxLQUFrQixJQUFJLENBQUMsTUFBTSxFQUFFLE1BQWU7O1FBQ3ZELElBQUksRUFBRSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUU7WUFDMUIsT0FBTyxLQUFLLENBQUM7U0FDaEI7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUM1QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBQ3pGLE1BQUEsRUFBRSxDQUFDLFVBQVUsMENBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUNsRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMxRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUM1RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDOUMsT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUFBLENBQUM7SUFFSyxJQUFJO1FBQ1AsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRTtZQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN2RTtJQUNMLENBQUM7SUFBQSxDQUFDO0NBQ0w7QUE1QkQsMEJBNEJDOzs7O0FDNUJELHNFQUFzRTs7O0FBRXRFLE1BQWEsV0FBVztJQUlwQixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRU8sZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLEtBQUs7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUNsQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVPLFFBQVE7UUFDWixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDakIsVUFBVSxFQUFFLE1BQU07YUFDckIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDSjtBQS9CRCxrQ0ErQkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbnRlcmZhY2UgSUFkZGluSXRlbSB7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgbWVudUlkPzogc3RyaW5nO1xuICAgIGZpbGVzPzogYW55O1xuICAgIHBhZ2U/OiBzdHJpbmc7XG4gICAgY2xpY2s/OiBzdHJpbmc7XG4gICAgYnV0dG9uTmFtZT86IHN0cmluZztcbiAgICBtYXBTY3JpcHQ/OiB7XG4gICAgICAgIHNyYz86IHN0cmluZztcbiAgICAgICAgc3R5bGU/OiBzdHJpbmc7XG4gICAgICAgIHVybD86IHN0cmluZztcbiAgICB9XG59XG5cbmludGVyZmFjZSBJQWRkaW4gZXh0ZW5kcyBJQWRkaW5JdGVtIHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGl0ZW1zPzogSUFkZGluSXRlbVtdO1xufVxuXG5leHBvcnQgY2xhc3MgQWRkSW5CdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNNZW51SXRlbSA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgIHJldHVybiAhaXRlbS51cmwgJiYgISFpdGVtLnBhdGggJiYgISFpdGVtLm1lbnVJZDtcbiAgICB9XG5cbiAgICAvL1Rlc3RzIGEgVVJMIGZvciBkb3VibGUgc2xhc2guIEFjY2VwdHMgYSB1cmwgYXMgYSBzdHJpbmcgYXMgYSBhcmd1bWVudC5cbiAgICAvL1JldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIGNvbnRhaW5zIGEgZG91YmxlIHNsYXNoIC8vXG4gICAgLy9SZXR1cm5zIGZhbHNlIGlmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBhIGRvdWJsZSBzbGFzaC5cbiAgICBwcml2YXRlIGlzVmFsaWRVcmwgPSAodXJsOiBzdHJpbmcpOiBib29sZWFuID0+ICEhdXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTE7XG5cbiAgICBwcml2YXRlIGlzVmFsaWRCdXR0b24gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmJ1dHRvbk5hbWUgJiYgISFpdGVtLnBhZ2UgJiYgISFpdGVtLmNsaWNrICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLmNsaWNrKTtcblxuICAgIHByaXZhdGUgaXNFbWJlZGRlZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmZpbGVzO1xuXG4gICAgcHJpdmF0ZSBpc1ZhbGlkTWFwQWRkaW4gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICBjb25zdCBzY3JpcHRzID0gaXRlbS5tYXBTY3JpcHQ7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTcmMgPSAhc2NyaXB0cz8uc3JjIHx8IHRoaXMuaXNWYWxpZFVybChzY3JpcHRzLnNyYyk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTdHlsZSA9ICFzY3JpcHRzPy5zdHlsZSB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy5zdHlsZSk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRIdG1sID0gIXNjcmlwdHM/LnVybCB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy51cmwpO1xuICAgICAgICBjb25zdCBoYXNTY3JpcHRzID0gISFzY3JpcHRzICYmICghIXNjcmlwdHM/LnNyYyB8fCAhc2NyaXB0cz8uc3R5bGUgfHwgIXNjcmlwdHM/LnVybCk7XG4gICAgICAgIHJldHVybiBoYXNTY3JpcHRzICYmIGlzVmFsaWRTcmMgJiYgaXNWYWxpZFN0eWxlICYmIGlzVmFsaWRIdG1sO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNWYWxpZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0VtYmVkZGVkSXRlbShpdGVtKSB8fCB0aGlzLmlzTWVudUl0ZW0oaXRlbSkgfHwgdGhpcy5pc1ZhbGlkQnV0dG9uKGl0ZW0pIHx8IHRoaXMuaXNWYWxpZE1hcEFkZGluKGl0ZW0pIHx8ICghIWl0ZW0udXJsICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLnVybCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICgoYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMSl8fFxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIGFkZGluIGJ1aWxkZXIgd2l0aCBhbGwgYWRkaW5zXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRBZGRJbnMoKVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWRkaW5Db25maWc6IElBZGRpbiA9IEpTT04ucGFyc2UoYWRkaW4pO1xuICAgICAgICAgICAgaWYoYWRkaW5Db25maWcuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAvL011bHRpIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXJsID0gaXRlbS51cmw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeSh0aGlzLmlzVmFsaWRJdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vU2luZ2xlIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZEl0ZW0oYWRkaW5Db25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFkZElucyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0VmVyc2lvbigpXG4gICAgICAgIC50aGVuKCh2ZXJzaW9uKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBpZiggdmVyc2lvbi5zcGxpdChcIi5cIiwgMSkgPCA4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tU3lzdGVtU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJvbUFkZEluQXBpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFZlcnNpb24gKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0VmVyc2lvblwiLCB7XG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21BZGRJbkFwaSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJBZGRJblwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGFkZElucyA6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHJlc3VsdCkpe1xuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2goYWRkSW4gPT4ge1xuICAgICAgICAgICAgICAgIC8vIE5ldyBBcGkgcmV0dXJucyBjb25maWd1cmF0aW9uIGZvciBBbGwgQWRkaW5zXG4gICAgICAgICAgICAgICAgLy8gSWYgaXQgaGFzIFVybCB0aGVuIHdlIGRvbid0IG5lZWQgdGhlIGNvbmZpZ3VyYXRpb24gcGFydCBmb3IgZXhwb3J0XG4gICAgICAgICAgICAgICAgaWYoYWRkSW4udXJsICYmIGFkZEluLnVybCAhPSBcIlwiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoYWRkSW4uY29uZmlndXJhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYWRkSW4uY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhZGRJbi5pZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyB1cmwgYnV0IHdlIGhhdmUgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIFdlIHdpbGwga2VlcCB3aGF0J3MgaW5zaWRlIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZihhZGRJbi5jb25maWd1cmF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW4gPSBhZGRJbi5jb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRJbnMucHVzaChKU09OLnN0cmluZ2lmeShhZGRJbikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhhZGRJbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21TeXN0ZW1TZXR0aW5ncyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJTeXN0ZW1TZXR0aW5nc1wiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhyZXN1bHRbMF0uY3VzdG9tZXJQYWdlcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9hZGRpbi5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XG5pbXBvcnQgUmVwb3J0c0J1aWxkZXIgZnJvbSBcIi4vcmVwb3J0c0J1aWxkZXJcIjtcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xuaW1wb3J0IHtJTWlzY0RhdGEsIE1pc2NCdWlsZGVyfSBmcm9tIFwiLi9taXNjQnVpbGRlclwiO1xuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XG4vLyBpbXBvcnQge1VzZXJCdWlsZGVyfSBmcm9tIFwiLi91c2VyQnVpbGRlclwiO1xuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcbmltcG9ydCB7QWRkSW5CdWlsZGVyfSBmcm9tIFwiLi9hZGRJbkJ1aWxkZXJcIjtcblxuaW50ZXJmYWNlIEdlb3RhYiB7XG4gICAgYWRkaW46IHtcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxuICAgIH07XG59XG5cbmludGVyZmFjZSBJSW1wb3J0RGF0YSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICByZXBvcnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xuICAgIGRpYWdub3N0aWNzOiBhbnlbXTtcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcbiAgICBtaXNjOiBJTWlzY0RhdGEgfCBudWxsO1xuICAgIGFkZGluczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBjZXJ0aWZpY2F0ZXM6IGFueVtdO1xuICAgIGdyb3VwRmlsdGVycz86IGFueVtdO1xufVxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcbiAgICBydWxlcz86IHN0cmluZ1tdO1xuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xuICAgIHVzZXJzPzogc3RyaW5nW107XG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XG4gICAgem9uZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xuICAgIGNlcnRpZmljYXRlcz86IHN0cmluZ1tdO1xuICAgIGdyb3VwRmlsdGVycz86IHN0cmluZ1tdO1xufVxuXG50eXBlIFRFbnRpdHlUeXBlID0ga2V5b2YgSUltcG9ydERhdGE7XG5cbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XG5cbmNsYXNzIEFkZGluIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdyb3Vwc0J1aWxkZXI6IEdyb3Vwc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcnVsZXNCdWlsZGVyOiBSdWxlc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFkZEluQnVpbGRlcjogQWRkSW5CdWlsZGVyO1xuICAgIC8vIHByaXZhdGUgcmVhZG9ubHkgdXNlckJ1aWxkZXI6IFVzZXJCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgem9uZUJ1aWxkZXI6IFpvbmVCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRCdXR0b25cIikgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzYXZlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlQnV0dG9uXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfYWRkaW5zX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfc3lzdGVtX3NldHRpbmdzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3YWl0aW5nOiBXYWl0aW5nO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBJSW1wb3J0RGF0YSA9IHtcbiAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgcmVwb3J0czogW10sXG4gICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHM6IFtdLFxuICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICB6b25lczogW10sXG4gICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgIHdvcmtIb2xpZGF5czogW10sXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgbWlzYzogbnVsbCxcbiAgICAgICAgYWRkaW5zOiBbXSxcbiAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXSxcbiAgICAgICAgY2VydGlmaWNhdGVzOiBbXSxcbiAgICAgICAgZ3JvdXBGaWx0ZXJzOiBbXVxuICAgIH07XG5cbiAgICBwcml2YXRlIGNvbWJpbmVEZXBlbmRlbmNpZXMgKC4uLmFsbERlcGVuZGVuY2llczogSURlcGVuZGVuY2llc1tdKTogSURlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCB0b3RhbCA9IHtcbiAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICByZXBvcnRzOiBbXSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdLFxuICAgICAgICAgICAgZ3JvdXBGaWx0ZXJzOiBbXVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModG90YWwpLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBkZXBlbmRlbmN5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSwgLi4uYWxsRGVwZW5kZW5jaWVzLm1hcCgoZW50aXR5RGVwZW5kZW5jaWVzKSA9PiBlbnRpdHlEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdKSk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCB0b3RhbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdHcm91cHMgKGdyb3Vwczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxuICAgICAgICAgICAgbmV3R3JvdXBzVXNlcnMgPSBnZXRVbmlxdWVFbnRpdGllcyh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3Vwc0RhdGEpLCBkYXRhLnVzZXJzKTtcbiAgICAgICAgZGF0YS5ncm91cHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuZ3JvdXBzLCBncm91cHNEYXRhKTtcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKHt1c2VyczogZ2V0RW50aXRpZXNJZHMobmV3R3JvdXBzVXNlcnMpfSwgZGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdDdXN0b21NYXBzIChjdXN0b21NYXBzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgaWYgKCFjdXN0b21NYXBzSWRzIHx8ICFjdXN0b21NYXBzSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXN0b21NYXBzRGF0YSA9IGN1c3RvbU1hcHNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgbGV0IGN1c3RvbU1hcERhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YShjdXN0b21NYXBJZCk7XG4gICAgICAgICAgICBjdXN0b21NYXBEYXRhICYmIGRhdGEucHVzaChjdXN0b21NYXBEYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9LCBbXSk7XG4gICAgICAgIGRhdGEuY3VzdG9tTWFwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5jdXN0b21NYXBzLCBjdXN0b21NYXBzRGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMgKG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgdGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVEYXRhID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sIFtdKTtcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gZW50aXRpZXMucmVkdWNlKChyZXM6IHN0cmluZ1tdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzTGVhZkdyb3VwRmlsdGVyQ29uZGl0aW9uID0gKGdyb3VwRmlsdGVyQ29uZGl0aW9uOiBUR3JvdXBGaWx0ZXJDb25kaXRpb24pOiBncm91cEZpbHRlckNvbmRpdGlvbiBpcyBJTGVhZkdyb3VwRmlsdGVyQ29uZGl0aW9uID0+IHtcbiAgICAgICAgcmV0dXJuICEhKGdyb3VwRmlsdGVyQ29uZGl0aW9uIGFzIElMZWFmR3JvdXBGaWx0ZXJDb25kaXRpb24pLmdyb3VwSWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRHcm91cEZpbHRlckdyb3VwcyA9IChncm91cEZpbHRlckNvbmRpdGlvbj86IFRHcm91cEZpbHRlckNvbmRpdGlvbiwgcHJldkdyb3VwSWRzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpKSA9PiB7XG4gICAgICAgIGlmICghZ3JvdXBGaWx0ZXJDb25kaXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2R3JvdXBJZHM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ3JvdXBzOiBTZXQ8c3RyaW5nPiA9IHRoaXMuaXNMZWFmR3JvdXBGaWx0ZXJDb25kaXRpb24oZ3JvdXBGaWx0ZXJDb25kaXRpb24pXG4gICAgICAgICAgICA/IG5ldyBTZXQoWy4uLnByZXZHcm91cElkcywgZ3JvdXBGaWx0ZXJDb25kaXRpb24uZ3JvdXBJZF0pXG4gICAgICAgICAgICA6IGdyb3VwRmlsdGVyQ29uZGl0aW9uLmdyb3VwRmlsdGVyQ29uZGl0aW9ucy5yZWR1Y2UoKHJlcywgY2hpbGRHcm91cEZpbHRlckNvbmRpdGlvbikgPT4gdGhpcy5nZXRHcm91cEZpbHRlckdyb3VwcyhjaGlsZEdyb3VwRmlsdGVyQ29uZGl0aW9uLCByZXMpLCBwcmV2R3JvdXBJZHMpO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldEVudGl0eURlcGVuZGVuY2llcyAoZW50aXR5OiBJRW50aXR5LCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSkge1xuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XG4gICAgICAgIHN3aXRjaCAoZW50aXR5VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImRldmljZXNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtUaW1lcyA9IFtlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiY29tcGFueUdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiZHJpdmVyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicHJpdmF0ZVVzZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJyZXBvcnRHcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuc2VjdXJpdHlHcm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInNlY3VyaXR5R3JvdXBzXCJdKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcbiAgICAgICAgICAgICAgICBpZiAoZW50aXR5Lmlzc3VlckNlcnRpZmljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jZXJ0aWZpY2F0ZXMgPSBbIGVudGl0eS5pc3N1ZXJDZXJ0aWZpY2F0ZS5pZCBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cEZpbHRlcnMgPSB0aGlzLmdldEVudHl0aWVzSWRzKFtlbnRpdHlbXCJhY2Nlc3NHcm91cEZpbHRlclwiXV0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInpvbmVzXCI6XG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcbiAgICAgICAgICAgICAgICB6b25lVHlwZXMubGVuZ3RoICYmIChlbnRpdHlEZXBlbmRlbmNpZXMuem9uZVR5cGVzID0gem9uZVR5cGVzKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIndvcmtUaW1lc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya0hvbGlkYXlzID0gW2VudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZ3JvdXBGaWx0ZXJzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IFsuLi50aGlzLmdldEdyb3VwRmlsdGVyR3JvdXBzKChlbnRpdHkgYXMgSUdyb3VwRmlsdGVyKS5ncm91cEZpbHRlckNvbmRpdGlvbikudmFsdWVzKCldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW50aXR5RGVwZW5kZW5jaWVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXBwbHlUb0VudGl0aWVzIDxUPihlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMsIGluaXRpYWxWYWx1ZSwgZnVuYzogKHJlc3VsdCwgZW50aXR5LCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSwgZW50aXR5SW5kZXg6IG51bWJlciwgZW50aXR5VHlwZUluZGV4OiBudW1iZXIsIG92ZXJhbGxJbmRleDogbnVtYmVyKSA9PiBUKSB7XG4gICAgICAgIGxldCBvdmVyYWxsSW5kZXggPSAwO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZW50aXRpZXNMaXN0KS5yZWR1Y2UoKHJlc3VsdDogVCwgZW50aXR5VHlwZTogc3RyaW5nLCB0eXBlSW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzTGlzdFtlbnRpdHlUeXBlXS5yZWR1Y2UoKHJlczogVCwgZW50aXR5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIG92ZXJhbGxJbmRleCsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jKHJlcywgZW50aXR5LCBlbnRpdHlUeXBlIGFzIFRFbnRpdHlUeXBlLCBpbmRleCwgdHlwZUluZGV4LCBvdmVyYWxsSW5kZXggLSAxKTtcbiAgICAgICAgICAgIH0sIHJlc3VsdCk7XG4gICAgICAgIH0sIGluaXRpYWxWYWx1ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNvbHZlRGVwZW5kZW5jaWVzIChkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGxldCBnZXREYXRhID0gKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcyk6IFByb21pc2U8SUltcG9ydERhdGE+ID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgZW50aXR5UmVxdWVzdFR5cGVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlczogXCJEZXZpY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJzOiBcIlVzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVUeXBlczogXCJab25lVHlwZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZXM6IFwiWm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya1RpbWVzOiBcIldvcmtUaW1lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFwiV29ya0hvbGlkYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBcIkdyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogXCJEaWFnbm9zdGljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZXJ0aWZpY2F0ZXM6IFwiQ2VydGlmaWNhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwRmlsdGVyczogXCJHcm91cEZpbHRlclwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdGllc0xpc3QsIHt9LCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGVudGl0eUlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiB8fCBlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKFtcIkdldFwiLCByZXF1ZXN0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgJiYgZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5zZWN1cml0eUdyb3VwcyA9IFtbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy5zZWN1cml0eUdyb3VwcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1dXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgJiYgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMud29ya0hvbGlkYXlzID0gW1tcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLndvcmtIb2xpZGF5c1xuICAgICAgICAgICAgICAgICAgICB9XV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTmV3R3JvdXBzKGVudGl0aWVzTGlzdC5ncm91cHMgfHwgW10sIGRhdGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMoZW50aXRpZXNMaXN0LmN1c3RvbU1hcHMgfHwgW10sIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyhlbnRpdGllc0xpc3Qubm90aWZpY2F0aW9uVGVtcGxhdGVzIHx8IFtdLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuY3VzdG9tTWFwcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdEVudGl0aWVzID0gT2JqZWN0LmtleXMocmVxdWVzdHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzQXJyYXkgPSByZXF1ZXN0RW50aXRpZXMucmVkdWNlKChsaXN0LCB0eXBlKSA9PiBsaXN0LmNvbmNhdChyZXF1ZXN0c1t0eXBlXSksIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdEVudGl0aWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHJlcXVlc3RzQXJyYXksIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3R3JvdXBzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwczogc3RyaW5nW10gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhyZXF1ZXN0cywge30sIChyZXN1bHQsIHJlcXVlc3QsIGVudGl0eVR5cGUsIGVudGl0eUluZGV4LCBlbnRpdHlUeXBlSW5kZXgsIG92ZXJhbGxJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHJlcXVlc3RzQXJyYXkubGVuZ3RoID4gMSA/IHJlc3BvbnNlW292ZXJhbGxJbmRleF0gOiByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtWzBdIHx8IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgJiYgKCFpdGVtLmhvbGlkYXlHcm91cCB8fCAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyB8fCBbXSkuaW5kZXhPZihpdGVtLmhvbGlkYXlHcm91cC5ncm91cElkKSA9PT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya1RpbWVzXCIgJiYgIWl0ZW0uZGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzIHx8IFtdKS5pbmRleE9mKGl0ZW0uaWQpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSByZXN1bHRbZW50aXR5VHlwZV0uY29uY2F0KHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRDdXN0b21Hcm91cHNEYXRhKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyB8fCBbXSwgaXRlbXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXMgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhpdGVtLCBlbnRpdHlUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXR5RGVwZW5kZW5jaWVzLCBuZXdEZXBlbmRlbmNpZXMsIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZShyZXN1bHRbZW50aXR5VHlwZV0sIFtlbnRpdHlJZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dyb3VwcyA9IG5ld0dyb3Vwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmdyb3VwcyB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBuZXdDdXN0b21NYXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5yZWR1Y2UoKHJlc3VsdCwgZGVwZW5kZW5jeU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdGllcyA9IG5ld0RlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWQgPSAoZXhwb3J0ZWREYXRhW2RlcGVuZGVuY3lOYW1lXSB8fCBbXSkubWFwKGVudGl0eSA9PiBlbnRpdHkuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMuZm9yRWFjaChlbnRpdHlJZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkLmluZGV4T2YoZW50aXR5SWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2RlcGVuZGVuY3lOYW1lXSAmJiAocmVzdWx0W2RlcGVuZGVuY3lOYW1lXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2RlcGVuZGVuY3lOYW1lXS5wdXNoKGVudGl0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHt9IGFzIElJbXBvcnREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJ1aWx0LWluIHNlY3VyaXR5IGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgJiYgKGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyA9IGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3Vwcy5yZWR1Y2UoKHJlc3VsdCwgZ3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwLmlkLmluZGV4T2YoXCJHcm91cFwiKSA9PT0gLTEgJiYgcmVzdWx0LnB1c2goZ3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdHcm91cHMobmV3R3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhuZXdDdXN0b21NYXBzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGV4cG9ydGVkRGF0YSkuZm9yRWFjaCgoZW50aXR5VHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YVtlbnRpdHlUeXBlXSwgZXhwb3J0ZWREYXRhW2VudGl0eVR5cGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMobmV3RGVwZW5kZW5jaWVzLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGRlcGVuZGVuY2llcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b2dnbGVFeHBvcnRCdXR0b24gKGlzRGlzYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlV2FpdGluZyA9IChpc1N0YXJ0ID0gZmFsc2UpID0+IHtcbiAgICAgICAgaWYgKGlzU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0YXJ0KChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZGluQ29udGFpbmVyXCIpIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50IGFzIEhUTUxFbGVtZW50LCA5OTk5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL0JyZXR0IC0gZGlzcGxheXMgdGhlIG91dHB1dCBvbiB0aGUgcGFnZVxuICAgIHByaXZhdGUgc2hvd0VudGl0eU1lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgcXR5OiBudW1iZXIsIGVudGl0eU5hbWU6IHN0cmluZykge1xuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChxdHkpIHtcbiAgICAgICAgICAgIHF0eSA+IDEgJiYgKGVudGl0eU5hbWUgKz0gXCJzXCIpO1xuICAgICAgICAgICAgbGV0IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGVcIikgYXMgSFRNTEVsZW1lbnQpLmlubmVySFRNTDtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcIntxdWFudGl0eX1cIiwgcXR5LnRvU3RyaW5nKCkpLnJlcGxhY2UoXCJ7ZW50aXR5fVwiLCBlbnRpdHlOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gYFlvdSBoYXZlIDxzcGFuIGNsYXNzPVwiYm9sZFwiPm5vdCBjb25maWd1cmVkIGFueSAkeyBlbnRpdHlOYW1lIH1zPC9zcGFuPi5gO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIGlzSW5jbHVkZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoaXNJbmNsdWRlZCkge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+dG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+bm90IHRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vaW5pdGlhbGl6ZSBhZGRpblxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlciA9IG5ldyBHcm91cHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIgPSBuZXcgUmVwb3J0c0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIgPSBuZXcgUnVsZXNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyID0gbmV3IE1pc2NCdWlsZGVyKGFwaSk7XG4gICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cbiAgICAgICAgLy8gdGhpcy51c2VyQnVpbGRlciA9IG5ldyBVc2VyQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnpvbmVCdWlsZGVyID0gbmV3IFpvbmVCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuYWRkSW5CdWlsZGVyID0gbmV3IEFkZEluQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLndhaXRpbmcgPSBuZXcgV2FpdGluZygpO1xuICAgIH1cblxuICAgIC8vQnJldHQ6IGV4cG9ydHMgdGhlIGRhdGFcbiAgICBleHBvcnREYXRhID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhdGEoKS50aGVuKChyZXBvcnRzRGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXBvcnRzRGF0YTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG4gICAgICAgICAgICBkb3dubG9hZERhdGFBc0ZpbGUoSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSwgXCJleHBvcnQuanNvblwiKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZXhwb3J0IGRhdGEuXFxuUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICBzYXZlQ2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBjaGVja0JveFZhbHVlQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XG4gICAgfVxuXG4gICAgYWRkRXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xuICAgICAgICB0aGlzLnNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAvLyB0aGlzLmRhdGEudXNlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XG4gICAgICAgIHRoaXMuZGF0YS5hZGRpbnMgPSBbXTtcbiAgICAgICAgLy93aXJlIHVwIHRoZSBkb21cbiAgICAgICAgbGV0IG1hcE1lc3NhZ2VUZW1wbGF0ZTogc3RyaW5nID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpIGFzIEhUTUxFbGVtZW50KS5pbm5lckhUTUwsXG4gICAgICAgICAgICBncm91cHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkR3JvdXBzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHJ1bGVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJ1bGVzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgcmVwb3J0c0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSZXBvcnRzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIG1hcEJsb2NrRGVzY3JpcHRpb246IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNleHBvcnRlZE1hcCAuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAvLyB1c2Vyc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRVc2Vyc1wiKSxcbiAgICAgICAgICAgIHpvbmVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFpvbmVzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3NCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydFN5c3RlbVNldHRpbmdzXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XG4gICAgICAgIHJldHVybiB0b2dldGhlcihbXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBncm91cHMuIFRoaXMgaXMgd2hlcmUgdXNlcnMgYXJlIGFkZGVkIGlmIHRoZXkgYXJlIGxpbmtlZCB0byBhIGdyb3VwXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vbG9hZHMgdGhlIHNlY3VyaXR5IGdyb3VwcyAoc2VjdXJpdHkgY2xlYXJhbmNlIGluIHVzZXIgYWRtaW4gaW4gTXlHKVxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAvL3JlcG9ydCBsb2FkZXIuLi5zZWVtcyBvYnNvbGV0ZSB0byBtZVxuICAgICAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAvL21pc2MgPSBzeXN0ZW0gc2V0dGluZ3NcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2godGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpLFxuICAgICAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAgICAgLy8gdGhpcy51c2VyQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy56b25lQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIuZmV0Y2goKVxuICAgICAgICBdKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVwb3J0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXG4gICAgICAgICAgICAgICAgY3VzdG9tTWFwO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmdyb3VwcyA9IHJlc3VsdHNbMF07XG4gICAgICAgICAgICB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMgPSByZXN1bHRzWzFdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXN1bHRzWzJdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJ1bGVzID0gcmVzdWx0c1szXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHModGhpcy5kYXRhLnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjID0gcmVzdWx0c1s1XTtcbiAgICAgICAgICAgIGxldCBnZXREZXBlbmRlbmNpZXMgPSAoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXAgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhlbnRpdHksIGVudGl0eVR5cGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHJlcywgZW50aXR5RGVwKTtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IHpvbmVEZXBlbmRlbmNpZXMgPSB7fTtcbiAgICAgICAgICAgIGlmKHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5jaGVja2VkPT10cnVlKXtcbiAgICAgICAgICAgICAgICBpZihyZXN1bHRzWzZdKXtcbiAgICAgICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHpvbmVzIHRvIGFsbCBkYXRhYmFzZSB6b25lc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSByZXN1bHRzWzZdO1xuICAgICAgICAgICAgICAgICAgICB6b25lRGVwZW5kZW5jaWVzID0gZ2V0RGVwZW5kZW5jaWVzKHJlc3VsdHNbNl0sIFwiem9uZXNcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5jaGVja2VkPT10cnVlKXtcbiAgICAgICAgICAgICAgICBpZihyZXN1bHRzWzddKXtcbiAgICAgICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIGFkZGlucyBlcXVhbCB0byBub25lL2VtcHR5IGFycmF5XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5hZGRpbnMgPSByZXN1bHRzWzddO1xuICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmRhdGEubWlzYyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSB0aGlzLmRhdGEuYWRkaW5zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VzdG9tTWFwID0gdGhpcy5kYXRhLm1pc2MgJiYgdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xuICAgICAgICAgICAgY3VzdG9tTWFwICYmIHRoaXMuZGF0YS5jdXN0b21NYXBzLnB1c2goY3VzdG9tTWFwKTtcbiAgICAgICAgICAgIHJlcG9ydHNEZXBlbmRlbmNpZXMgPSB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucmVwb3J0cyk7XG4gICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llcyA9IHRoaXMucnVsZXNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucnVsZXMpO1xuICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzKTtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IHRoaXMuY29tYmluZURlcGVuZGVuY2llcyh6b25lRGVwZW5kZW5jaWVzLCByZXBvcnRzRGVwZW5kZW5jaWVzLCBydWxlc0RlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXMsIHRoaXMuZGF0YSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1hcFByb3ZpZGVyID0gdGhpcy5kYXRhLm1pc2MgJiYgdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlck5hbWUodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShncm91cHNCbG9jaywgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGggLSAxLCBcImdyb3VwXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShzZWN1cml0eUNsZWFyYW5jZXNCbG9jaywgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzLmxlbmd0aCwgXCJzZWN1cml0eSBjbGVhcmFuY2VcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJ1bGVzQmxvY2ssIHRoaXMuZGF0YS5ydWxlcy5sZW5ndGgsIFwicnVsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocmVwb3J0c0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5KCksIFwicmVwb3J0XCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShkYXNoYm9hcmRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGFzaGJvYXJkc1F0eSgpLCBcImRhc2hib2FyZFwiKTtcbiAgICAgICAgICAgIGlmIChtYXBQcm92aWRlcikge1xuICAgICAgICAgICAgICAgIG1hcEJsb2NrRGVzY3JpcHRpb24uaW5uZXJIVE1MID0gbWFwTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7bWFwUHJvdmlkZXJ9XCIsIG1hcFByb3ZpZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoYWRkaW5zQmxvY2ssIHRoaXMuZGF0YS5hZGRpbnM/Lmxlbmd0aCB8fCAwLCBcImFkZGluXCIpO1xuICAgICAgICAgICAgLy8gdGhpcy5zaG93RW50aXR5TWVzc2FnZSh1c2Vyc0Jsb2NrLCB0aGlzLmRhdGEudXNlcnMubGVuZ3RoLCBcInVzZXJcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHpvbmVzQmxvY2ssIHRoaXMuZGF0YS56b25lcy5sZW5ndGgsIFwiem9uZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd1N5c3RlbVNldHRpbmdzTWVzc2FnZShzeXN0ZW1TZXR0aW5nc0Jsb2NrLCB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guY2hlY2tlZCk7XG4gICAgICAgICAgICAvL3RoaXMgZGlzcGxheXMgYWxsIHRoZSBkYXRhL29iamVjdHMgaW4gdGhlIGNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBnZXQgY29uZmlnIHRvIGV4cG9ydFwiKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuYWRkSW5CdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICB9XG59XG5cbmdlb3RhYi5hZGRpbi5yZWdpc3RyYXRpb25Db25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGFkZGluOiBBZGRpbjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGluaXRpYWxpemU6IChhcGksIHN0YXRlLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICAgICAgYWRkaW4gPSBuZXcgQWRkaW4oYXBpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XG4gICAgICAgICAgICBhZGRpbi5yZW5kZXIoKTtcbiAgICAgICAgICAgIGFkZGluLmFkZEV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmx1cjogKCkgPT4ge1xuICAgICAgICAgICAgYWRkaW4udW5sb2FkKCk7XG4gICAgICAgIH1cbiAgICB9O1xufTsiLCJpbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCBleHRlbmRzIElOYW1lZEVudGl0eSB7XG4gICAgcmVjaXBpZW50czogYW55W107XG4gICAgcnVsZXM6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcbiAgICBydWxlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgZGlzdHJpYnV0aW9uTGlzdHM6IFJlY29yZDxzdHJpbmcsIElEaXN0cmlidXRpb25MaXN0PjtcbiAgICBwcml2YXRlIG5vdGlmaWNhdGlvblRlbXBsYXRlcztcblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXG4gICAgcHJpdmF0ZSBnZXREaXN0cmlidXRpb25MaXN0c0RhdGEgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uV2ViUmVxdWVzdFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvblRleHRUZW1wbGF0ZXNcIiwge31dXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKGRpc3RyaWJ1dGlvbkxpc3RzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcklkID0gcmVjaXBpZW50LnVzZXIuaWQ7XG4gICAgICAgICAgICAgICAgdXNlcklkICYmIGRlcGVuZGVuY2llcy51c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xICYmIGRlcGVuZGVuY2llcy51c2Vycy5wdXNoKHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW1haWxcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1BvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nT25seVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dE1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIldlYlJlcXVlc3RcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIm5vdGlmaWNhdGlvblRlbXBsYXRlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ncm91cCAmJiByZWNpcGllbnQuZ3JvdXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJncm91cHNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrUmVjaXBpZW50cyA9IChyZWNpcGllbnRzLCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWNpcGllbnRzLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCByZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZGlzdHJpYnV0aW9uTGlzdHMucmVkdWNlKChkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0OiBJRGlzdHJpYnV0aW9uTGlzdCkgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnJ1bGVzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLnJ1bGVzLCBkaXN0cmlidXRpb25MaXN0LnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSgpXG4gICAgICAgICAgICAudGhlbigoW2Rpc3RyaWJ1dGlvbkxpc3RzLCB3ZWJUZW1wbGF0ZXMsIGVtYWlsVGVtcGxhdGVzLCB0ZXh0VGVtcGxhdGVzXSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHdlYlRlbXBsYXRlcy5jb25jYXQoZW1haWxUZW1wbGF0ZXMpLmNvbmNhdCh0ZXh0VGVtcGxhdGVzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEgKHRlbXBsYXRlSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kaXN0cmlidXRpb25MaXN0cykucmVkdWNlKChyZXM6IElEaXN0cmlidXRpb25MaXN0W10sIGlkKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNbaWRdO1xuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSwgZXh0ZW5kLCBJRW50aXR5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW50ZXJmYWNlIENvbG9yIHtcbiAgICByOiBudW1iZXI7XG4gICAgZzogbnVtYmVyO1xuICAgIGI6IG51bWJlcjtcbiAgICBhOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdyb3VwIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGNvbG9yPzogQ29sb3I7XG4gICAgcGFyZW50PzogSUdyb3VwO1xuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XG4gICAgdXNlcj86IGFueTtcbn1cblxuaW50ZXJmYWNlIElOZXdHcm91cCBleHRlbmRzIE9taXQ8SUdyb3VwLCBcImlkXCI+IHtcbiAgICBpZDogbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JvdXBzQnVpbGRlciB7XG4gICAgcHJvdGVjdGVkIGFwaTtcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XG4gICAgcHJvdGVjdGVkIGdyb3VwczogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIHRyZWU6IElHcm91cFtdO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcblxuICAgIHByaXZhdGUgdXNlcnM6IGFueTtcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcbiAgICBwcml2YXRlIGdldEdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIlxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIlxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZmluZENoaWxkIChjaGlsZElkOiBzdHJpbmcsIGN1cnJlbnRJdGVtOiBJTmV3R3JvdXAgfCBJR3JvdXAsIG9uQWxsTGV2ZWxzOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXAgfCBudWxsIHtcbiAgICAgICAgbGV0IGZvdW5kQ2hpbGQ6IElHcm91cCB8IG51bGwgPSBudWxsLFxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjdXJyZW50SXRlbS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xuICAgICAgICAgICAgaWYgKGNoaWxkLmlkID09PSBjaGlsZElkKSB7XG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IHRoaXMuZmluZENoaWxkKGNoaWxkSWQsIGNoaWxkLCBvbkFsbExldmVscyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBsZXQgb3V0cHV0VXNlciA9IG51bGwsXG4gICAgICAgICAgICB1c2VySGFzUHJpdmF0ZUdyb3VwID0gKHVzZXIsIGdyb3VwSWQpOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwLmlkID09PSBncm91cElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJIYXNQcml2YXRlR3JvdXAodXNlciwgZ3JvdXBJZCkpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRVc2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgbmFtZTogXCJQcml2YXRlVXNlckdyb3VwTmFtZVwiLFxuICAgICAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBQcml2YXRlVXNlcklkXCIsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IGlkOiBncm91cElkIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RlY3RlZCBjcmVhdGVHcm91cHNUcmVlIChncm91cHM6IElHcm91cFtdKTogYW55W10ge1xuICAgICAgICBsZXQgbm9kZUxvb2t1cCxcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbjogSUdyb3VwW10sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJpbmc7XG5cbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjaGlsZHJlbltpXS5pZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVMb29rdXBbaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXSA9IG5vZGVMb29rdXBbaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBub2RlTG9va3VwID0gZW50aXR5VG9EaWN0aW9uYXJ5KGdyb3VwcywgZW50aXR5ID0+IHtcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBleHRlbmQoe30sIGVudGl0eSk7XG4gICAgICAgICAgICBpZiAobmV3RW50aXR5LmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgbmV3RW50aXR5LmNoaWxkcmVuID0gbmV3RW50aXR5LmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3RW50aXR5O1xuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBub2RlTG9va3VwW2tleV0gJiYgdHJhdmVyc2VDaGlsZHJlbihub2RlTG9va3VwW2tleV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobm9kZUxvb2t1cCkubWFwKGtleSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXG4gICAgICAgICAgICAudGhlbigoW2dyb3VwcywgdXNlcnNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBleHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGZvdW5kSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQ6IElHcm91cFtdID0gW10sXG4gICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMgPSAoaXRlbTogSUdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1Db3B5ID0gZXh0ZW5kKHt9LCBpdGVtKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMoaXRlbS5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvcHkucGFyZW50ID0gaXRlbS5wYXJlbnQgPyB7aWQ6IGl0ZW0ucGFyZW50LmlkLCBuYW1lOiBpdGVtLnBhcmVudC5uYW1lfSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZENvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkgPSBleHRlbmQoe30sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5wYXJlbnQgPSBjaGlsZENvcHkucGFyZW50ID8ge2lkOiBjaGlsZENvcHkucGFyZW50LmlkLCBuYW1lOiBjaGlsZENvcHkucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRQYXJlbnRzKTtcbiAgICAgICAgIW5vdEluY2x1ZGVDaGlsZHJlbiAmJiBncm91cHMuZm9yRWFjaChtYWtlRmxhdENoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogdGhpcy50cmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIG5vdEluY2x1ZGVDaGlsZHJlbik7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRDdXN0b21Hcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIGFsbEdyb3VwczogSUdyb3VwW10pOiBJR3JvdXBbXSB7XG4gICAgICAgIGxldCBncm91cHNUcmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGFsbEdyb3VwcyksXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT5cbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHM6IElHcm91cFtdKSB7XG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VyczogSUVudGl0eVtdLCBncm91cCkgPT4ge1xuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XG4gICAgICAgICAgICByZXR1cm4gdXNlcnM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9O1xuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH07XG59IiwiaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBUTWFwUHJvdmlkZXJUeXBlID0gXCJkZWZhdWx0XCIgfCBcImFkZGl0aW9uYWxcIiB8IFwiY3VzdG9tXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcbiAgICBtYXBQcm92aWRlcjoge1xuICAgICAgICB2YWx1ZTogc3RyaW5nO1xuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xuICAgIH07XG4gICAgY3VycmVudFVzZXI6IGFueTtcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcbiAgICBhZGRpbnM6IHN0cmluZ1tdO1xuICAgIHB1cmdlU2V0dGluZ3M/OiBhbnk7XG4gICAgZW1haWxTZW5kZXJGcm9tPzogc3RyaW5nO1xuICAgIGN1c3RvbWVyQ2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gICAgaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkPzogYm9vbGVhbjtcbiAgICBpc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkPzogYm9vbGVhbjtcbn1cblxuXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VzdG9tTWFwUHJvdmlkZXJzO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcbiAgICBwcml2YXRlIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdE1hcFByb3ZpZGVycyA9IHtcbiAgICAgICAgR29vZ2xlTWFwczogXCJHb29nbGUgTWFwc1wiLFxuICAgICAgICBIZXJlOiBcIkhFUkUgTWFwc1wiLFxuICAgICAgICBNYXBCb3g6IFwiTWFwQm94XCJcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIE1pc2MgYnVpbGRlciAoc3lzdGVtIHNldHRpbmdzKSB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxuICAgIGZldGNoIChpbmNsdWRlU3lzU2V0dGluZ3M6IGJvb2xlYW4pOiBQcm9taXNlPElNaXNjRGF0YT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VyTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJTeXN0ZW1TZXR0aW5nc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgY3VycmVudFVzZXIgPSByZXN1bHRbMF1bMF0gfHwgcmVzdWx0WzBdLFxuICAgICAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzID0gcmVzdWx0WzFdWzBdIHx8IHJlc3VsdFsxXSxcbiAgICAgICAgICAgICAgICB1c2VyTWFwUHJvdmlkZXJJZCA9IGN1cnJlbnRVc2VyLmRlZmF1bHRNYXBFbmdpbmUsXG4gICAgICAgICAgICAgICAgZGVmYXVsdE1hcFByb3ZpZGVySWQgPSBzeXN0ZW1TZXR0aW5ncy5tYXBQcm92aWRlcixcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcklkID0gdGhpcy5nZXRNYXBQcm92aWRlclR5cGUodXNlck1hcFByb3ZpZGVySWQpID09PSBcImN1c3RvbVwiID8gdXNlck1hcFByb3ZpZGVySWQgOiBkZWZhdWx0TWFwUHJvdmlkZXJJZDtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXIgPSBjdXJyZW50VXNlcjtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XG4gICAgICAgICAgICB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dVbnNpZ25lZEFkZEluO1xuICAgICAgICAgICAgbGV0IG91dHB1dDogSU1pc2NEYXRhID0ge1xuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZShtYXBQcm92aWRlcklkKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWRkaW5zOiBbXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50VXNlcjogdGhpcy5jdXJyZW50VXNlcixcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpbmNsdWRlU3lzU2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVyZ2VTZXR0aW5ncyA9IHN5c3RlbVNldHRpbmdzLnB1cmdlU2V0dGluZ3M7XG4gICAgICAgICAgICAgICAgb3V0cHV0LmVtYWlsU2VuZGVyRnJvbSA9IHN5c3RlbVNldHRpbmdzLmVtYWlsU2VuZGVyRnJvbTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbiA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb247XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzTWFya2V0cGxhY2VQdXJjaGFzZXNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dNYXJrZXRwbGFjZVB1cmNoYXNlcztcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Jlc2VsbGVyQXV0b0xvZ2luO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyVHlwZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogVE1hcFByb3ZpZGVyVHlwZSB7XG4gICAgICAgIHJldHVybiAhbWFwUHJvdmlkZXJJZCB8fCB0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gPyBcImRlZmF1bHRcIiA6IFwiY3VzdG9tXCI7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJOYW1lIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbXBvcnQgeyBJR3JvdXAgfSBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgeyBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcywgSVNjb3BlR3JvdXBGaWx0ZXIgfSBmcm9tIFwiLi9zY29wZUdyb3VwRmlsdGVyXCI7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuXG5jb25zdCBSRVBPUlRfVFlQRV9EQVNIQk9BRCA9IFwiRGFzaGJvYXJkXCI7XG5cbmludGVyZmFjZSBJU2VydmVyUmVwb3J0IGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cHM6IElHcm91cFtdO1xuICAgIGluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwczogSUdyb3VwW107XG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XG4gICAgaW5kaXZpZHVhbFJlY2lwaWVudHM6IElJZEVudGl0eVtdO1xuICAgIHNjb3BlR3JvdXBzOiBJR3JvdXBbXTtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSUlkRW50aXR5O1xuICAgIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XG4gICAgbGFzdE1vZGlmaWVkVXNlcjtcbiAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcbiAgICAgICAgZGV2aWNlcz86IGFueVtdO1xuICAgICAgICB6b25lVHlwZUxpc3Q/OiBhbnlbXTtcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG4gICAgfTtcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuaW50ZXJmYWNlIElSZXBvcnQgZXh0ZW5kcyBJU2VydmVyUmVwb3J0IHtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSVNjb3BlR3JvdXBGaWx0ZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcG9ydERlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogc3RyaW5nW107XG4gICAgcnVsZXM6IHN0cmluZ1tdO1xuICAgIHpvbmVUeXBlczogc3RyaW5nW107XG4gICAgZ3JvdXBzOiBzdHJpbmdbXTtcbiAgICB1c2Vyczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBJUmVwb3J0VGVtcGxhdGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcbiAgICByZXBvcnREYXRhU291cmNlOiBzdHJpbmc7XG4gICAgcmVwb3J0VGVtcGxhdGVUeXBlOiBzdHJpbmc7XG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xuICAgIGJpbmFyeURhdGE/OiBzdHJpbmc7XG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgYWxsUmVwb3J0czogSVJlcG9ydFtdO1xuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgcHJpdmF0ZSBkYXNoYm9hcmRzTGVuZ3RoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBhbGxUZW1wbGF0ZXM6IElSZXBvcnRUZW1wbGF0ZVtdO1xuXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xuICAgICAgICAgICAgICAgICAgICBcImluY2x1ZGVUZW1wbGF0ZURldGFpbHNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXREYXNoYm9hcmRJdGVtc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVTY29wZUdyb3VwRmlsdGVycyAocmVwb3J0czogSVNlcnZlclJlcG9ydFtdKTogUHJvbWlzZTxJUmVwb3J0W10+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdHMgPSByZXBvcnRzLnJlZHVjZSgocmVzLCByZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiByZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZCkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuaWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10gYXMgYW55W10pO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXF1ZXN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcG9ydHMgYXMgSVJlcG9ydFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHMsIChncm91cEZpbHRlcnM6IElTY29wZUdyb3VwRmlsdGVyW11bXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVucGFja2VkRmlsdGVyID0gZ3JvdXBGaWx0ZXJzLm1hcChpdGVtID0+IEFycmF5LmlzQXJyYXkoaXRlbSkgPyBpdGVtWzBdIDogaXRlbSlcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZUdyb3VwRmlsdGVySGFzaCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShlbnBhY2tlZEZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXBvcnRzLm1hcChyZXBvcnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ucmVwb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVHcm91cEZpbHRlcjogcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIgJiYgc2NvcGVHcm91cEZpbHRlckhhc2hbcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuaWRdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSZXBvcnRzIChyZXBvcnRzLCB0ZW1wbGF0ZXMpIHtcbiAgICAgICAgbGV0IGZpbmRUZW1wbGF0ZVJlcG9ydHMgPSAodGVtcGxhdGVJZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnRzLmZpbHRlcihyZXBvcnQgPT4gcmVwb3J0LnRlbXBsYXRlLmlkID09PSB0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZXMucmVkdWNlKChyZXMsIHRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVwb3J0cyA9IGZpbmRUZW1wbGF0ZVJlcG9ydHModGVtcGxhdGVJZCk7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZXBvcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLnJlcG9ydHMgPSB0ZW1wbGF0ZVJlcG9ydHM7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlVGVtcGxhdGUgKG5ld1RlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlKSB7XG4gICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzLnNvbWUoKHRlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLmlkID09PSBuZXdUZW1wbGF0ZURhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlc1tpbmRleF0gPSBuZXdUZW1wbGF0ZURhdGE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSZXBvcnRzKClcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgLi4ucmVzdF0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW3RoaXMucG9wdWxhdGVTY29wZUdyb3VwRmlsdGVycyhyZXBvcnRzKSwgLi4ucmVzdF0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCB0ZW1wbGF0ZXMsIGRhc2hib2FyZEl0ZW1zXSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYWxsUmVwb3J0cyA9IHJlcG9ydHM7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMgPSB0ZW1wbGF0ZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRzTGVuZ3RoID0gZGFzaGJvYXJkSXRlbXMgJiYgZGFzaGJvYXJkSXRlbXMubGVuZ3RoID8gZGFzaGJvYXJkSXRlbXMubGVuZ3RoIDogMDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHJlcG9ydHMsIHRlbXBsYXRlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocmVwb3J0czogSVJlcG9ydFRlbXBsYXRlW10pOiBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IGFsbERlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJlcG9ydHMucmVkdWNlKChyZXBvcnRzRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwb3J0cy5yZWR1Y2UoKHRlbXBsYXRlRGVwZW5kZWNpZXMsIHJlcG9ydCkgPT4ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzID1cbiAgICAgICAgICAgICAgICAgICAgVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMsXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5ncm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzKSxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuc2NvcGVHcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcyhyZXBvcnQuc2NvcGVHcm91cEZpbHRlci5ncm91cEZpbHRlckNvbmRpdGlvbikgfHwgW10pKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnVzZXJzID0gVXRpbHMubWVyZ2VVbmlxdWUoXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMudXNlcnMsIHJlcG9ydC5pbmRpdmlkdWFsUmVjaXBpZW50cyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5kaXZpZHVhbFJlY2lwaWVudHMpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMucnVsZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5ydWxlcykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzID0gVXRpbHMubWVyZ2VVbmlxdWUoXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0ICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0KSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGVwZW5kZWNpZXM7XG4gICAgICAgICAgICB9LCByZXBvcnRzRGVwZW5kZW5jaWVzKTtcbiAgICAgICAgfSwgYWxsRGVwZW5kZW5jaWVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGF0YSAoKTogUHJvbWlzZTxJUmVwb3J0VGVtcGxhdGVbXT4ge1xuICAgICAgICBsZXQgcG9ydGlvblNpemUgPSAxNSxcbiAgICAgICAgICAgIHBvcnRpb25zID0gdGhpcy5hbGxUZW1wbGF0ZXMucmVkdWNlKChyZXF1ZXN0czogYW55W10sIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlLmlzU3lzdGVtICYmICF0ZW1wbGF0ZS5iaW5hcnlEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3J0aW9uSW5kZXg6IG51bWJlciA9IHJlcXVlc3RzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdHNbcG9ydGlvbkluZGV4XSB8fCByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLmxlbmd0aCA+PSBwb3J0aW9uU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5wdXNoKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9ydGlvbkluZGV4ICsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW3BvcnRpb25JbmRleF0ucHVzaChbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RzO1xuICAgICAgICAgICAgfSwgW10pLFxuICAgICAgICAgICAgdG90YWxSZXN1bHRzOiBhbnlbXVtdID0gW10sXG4gICAgICAgICAgICBnZXRQb3J0aW9uRGF0YSA9IHBvcnRpb24gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHBvcnRpb24sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IFtdO1xuXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gcG9ydGlvbnMucmVkdWNlKChwcm9taXNlcywgcG9ydGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlc1xuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRQb3J0aW9uRGF0YShwb3J0aW9uKSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMgPSB0b3RhbFJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zID0gZXJyb3JQb3J0aW9ucy5jb25jYXQocG9ydGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sIFV0aWxzLnJlc29sdmVkUHJvbWlzZShbXSkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucy5sZW5ndGggJiYgY29uc29sZS53YXJuKGVycm9yUG9ydGlvbnMpO1xuICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cy5mb3JFYWNoKHRlbXBsYXRlRGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlID0gdGVtcGxhdGVEYXRhLmxlbmd0aCA/IHRlbXBsYXRlRGF0YVswXSA6IHRlbXBsYXRlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyh0aGlzLmFsbFJlcG9ydHMsIHRoaXMuYWxsVGVtcGxhdGVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkc1F0eSAoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFzaGJvYXJkc0xlbmd0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkgKCk6IG51bWJlciB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHJldHVybiAodGhpcy5hbGxSZXBvcnRzLmZpbHRlcigocmVwb3J0OiBJUmVwb3J0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHJlcG9ydC50ZW1wbGF0ZS5pZCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUV4aXN0czogYm9vbGVhbiA9IHRlbXBsYXRlcy5pbmRleE9mKHRlbXBsYXRlSWQpID4gLTEsXG4gICAgICAgICAgICAgICAgaXNDb3VudDogYm9vbGVhbiA9ICF0ZW1wbGF0ZUV4aXN0cyAmJiByZXBvcnQubGFzdE1vZGlmaWVkVXNlciAhPT0gXCJOb1VzZXJJZFwiO1xuICAgICAgICAgICAgaXNDb3VudCAmJiB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIHJldHVybiBpc0NvdW50O1xuICAgICAgICB9KSkubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiYWRkaW4uZC50c1wiLz5cbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgSVJ1bGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwczogYW55W107XG4gICAgY29uZGl0aW9uOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lczogYW55W107XG4gICAgem9uZVR5cGVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xufVxuXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSdWxlc0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjb21iaW5lZFJ1bGVzO1xuXG4gICAgcHJpdmF0ZSBnZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcgKHJ1bGU6IElSdWxlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERlcGVuZGVuY2llcyhbcnVsZV0pLmRpYWdub3N0aWNzLnNvcnQoKS5qb2luKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRSdWxlcyAoKTogUHJvbWlzZTxJUnVsZVtdPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSdWxlXCJcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJSdWxlXCIsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZVR5cGU6IFwiUm91dGVCYXNlZE1hdGVyaWFsTWdtdFwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgXSwgKFthbGxSdWxlcywgbWF0ZXJpYWxNYW5hZ2VtZW50UnVsZXNdOiBbSVJ1bGVbXSwgSVJ1bGVbXV0pID0+IHtcbiAgICAgICAgICAgICAgICAvLyBUbyBnZXQgY29ycmVjdCBTZXJ2aWNlIGdyb3VwcyB3ZSBuZWVkIHRvIHVwZGF0ZSBtYXRlcmlhbCBtYW5hZ2VtZW50IHN0b2NrIHJ1bGVzJyBncm91cHMgZnJvbSBncm91cHMgcHJvcGVydHkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgcnVsZSB3aXRoIFJvdXRlQmFzZWRNYXRlcmlhbE1nbXQgYmFzZVR5cGVcbiAgICAgICAgICAgICAgICAvLyBUaGUgb25seSBwb3NzaWJsZSBtZXRob2Qgbm93IHRvIG1hdGNoIFN0b2NrIHJ1bGUgYW5kIHJ1bGUgd2l0aCBSb3V0ZUJhc2VkTWF0ZXJpYWxNZ210IGJhc2VUeXBlIGlzIHRvIG1hdGNoIHRoZWlyIGRpYWdub3N0aWNzXG4gICAgICAgICAgICAgICAgY29uc3QgbW1SdWxlc0dyb3VwcyA9IG1hdGVyaWFsTWFuYWdlbWVudFJ1bGVzLnJlZHVjZSgocmVzOiBSZWNvcmQ8c3RyaW5nLCBJSWRFbnRpdHlbXT4sIG1tUnVsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtbVJ1bGVEaWFnbm9zdGljcyA9IHRoaXMuZ2V0UnVsZURpYWdub3N0aWNzU3RyaW5nKG1tUnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc1ttbVJ1bGVEaWFnbm9zdGljc10gPSBtbVJ1bGUuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShhbGxSdWxlcy5tYXAocnVsZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1tUnVsZURpYWdub3N0aWNzID0gdGhpcy5nZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcocnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvcnJlc3BvbmRpbmdNTVJ1bGVHcm91cHMgPSBtbVJ1bGVzR3JvdXBzW21tUnVsZURpYWdub3N0aWNzXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvcnJlc3BvbmRpbmdNTVJ1bGVHcm91cHMgPyB7IC4uLnJ1bGUsIGdyb3VwczogY29ycmVzcG9uZGluZ01NUnVsZUdyb3VwcyB9IDogcnVsZTtcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XG4gICAgICAgIHJldHVybiBzb3J0QXJyYXlPZkVudGl0aWVzKHJ1bGVzLCBbW1wiYmFzZVR5cGVcIiwgXCJkZXNjXCJdLCBcIm5hbWVcIl0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChydWxlczogSVJ1bGVbXSk6IElSdWxlRGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB0eXBlOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24uY29uZGl0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IChjb25kaXRpb24ud29ya1RpbWUgJiYgY29uZGl0aW9uLndvcmtUaW1lLmlkKSB8fCBjb25kaXRpb24ud29ya1RpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRHJpdmVyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkZXZpY2VzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRXhpdGluZ0FyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLnpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBY3RpdmVPckluYWN0aXZlRmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kaWFnbm9zdGljLmlkIHx8IGNvbmRpdGlvbi5kaWFnbm9zdGljO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrQ29uZGl0aW9ucyA9IChwYXJlbnRDb25kaXRpb24sIGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMpOiBJUnVsZURlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25kaXRpb25zLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBjb25kaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMuZ3JvdXBzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLmdyb3VwcywgcnVsZS5ncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKSk7XG4gICAgICAgICAgICBpZiAocnVsZS5jb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UnVsZXMoKVxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRSdWxlcyA9IGVudGl0eVRvRGljdGlvbmFyeShzd2l0Y2hlZE9uUnVsZXMpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSh0aGlzLmNvbWJpbmVkUnVsZXNbQVBQTElDQVRJT05fUlVMRV9JRF0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xuICAgICAgICByZXR1cm4gcnVsZXNJZHMubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cblxuY29uc3QgZW51bSBSZWxhdGlvbk9wZXJhdG9yIHtcbiAgICBcIkFORFwiID0gXCJBbmRcIixcbiAgICBcIk9SXCIgPSBcIk9yXCJcbn1cblxuaW50ZXJmYWNlIElPdXRwdXRJZEVudGl0eSB7XG4gICAgZ3JvdXBJZDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQgZXh0ZW5kcyBJT3V0cHV0SWRFbnRpdHkgPSBJT3V0cHV0SWRFbnRpdHk+IHtcbiAgICByZWxhdGlvbjogUmVsYXRpb25PcGVyYXRvcjtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbnM6IChUIHwgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQ+KVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTY29wZUdyb3VwRmlsdGVyIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbjogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5O1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29tbWVudD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGdldFNjb3BlR3JvdXBGaWx0ZXJCeUlkID0gKGlkOiBzdHJpbmcsIGFwaSk6IFByb21pc2U8SVNjb3BlR3JvdXBGaWx0ZXI+ID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBhcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgc2VhcmNoOiB7IGlkIH1cbiAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IGlzRmlsdGVyU3RhdGUgPSA8VCwgVT4oaXRlbTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KTogaXRlbSBpcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgPT4gaXRlbSAmJiAoaXRlbSBhcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQpLnJlbGF0aW9uICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcyA9IChzdGF0ZTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KSA9PiB7XG4gICAgbGV0IGdyb3VwSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHByb2Nlc3NJdGVtID0gKGl0ZW06SUdyb3VwTGlzdFN0YXRlT3V0cHV0LCBwcmV2UmVzID0gW10gYXMgSUlkRW50aXR5W10pOiBJSWRFbnRpdHlbXSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmdyb3VwRmlsdGVyQ29uZGl0aW9ucy5yZWR1Y2UoKHJlcywgY2hpbGRJdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNGaWx0ZXJTdGF0ZShjaGlsZEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJdGVtKGNoaWxkSXRlbSwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpZCA9IGNoaWxkSXRlbS5ncm91cElkO1xuICAgICAgICAgICAgZ3JvdXBJZHMuaW5kZXhPZihpZCkgPT09IC0xICYmIHJlcy5wdXNoKHsgaWQgfSk7XG4gICAgICAgICAgICBncm91cElkcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIHByZXZSZXMpO1xuICAgIH07XG4gICAgcmV0dXJuIGlzRmlsdGVyU3RhdGUoc3RhdGUpID8gcHJvY2Vzc0l0ZW0oc3RhdGUpIDogW3sgaWQ6IHN0YXRlLmdyb3VwSWQgfV07XG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBleHRlbmRzIEdyb3Vwc0J1aWxkZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoYXBpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFNlY3VyaXR5R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRTZWN1cml0eUdyb3VwcygpXG4gICAgICAgICAgICAudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xuICAgIGdldDogKCkgPT4gc3RyaW5nO1xuICAgIHNldDogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG50eXBlIElTb3J0UHJvcGVydHkgPSBzdHJpbmcgfCBbc3RyaW5nLCBcImFzY1wiIHwgXCJkZXNjXCJdO1xuXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xuICAgICAgICB2YXIgcGFyYW0gPSB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSBcInN0cmluZ1wiID8gXCJjbGFzc05hbWVcIiA6IFwiYmFzZVZhbFwiO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsW3BhcmFtXSB8fCBcIlwiO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgICAgICBlbFtwYXJhbV0gPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgaXNVc3VhbE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xuICAgIFtpZDogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXG4gICAgICAgIG5ld0NsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjbGFzc0l0ZW0gPT4gY2xhc3NJdGVtICE9PSBuYW1lKTtcbiAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQobmV3Q2xhc3Nlcy5qb2luKFwiIFwiKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIik7XG4gICAgaWYgKGNsYXNzZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzKGVsOiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlbCAmJiBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKS5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxuICAgICAgICBzcmMsIHNyY0tleXMsIHNyY0F0dHIsXG4gICAgICAgIGZ1bGxDb3B5ID0gZmFsc2UsXG4gICAgICAgIHJlc0F0dHIsXG4gICAgICAgIHJlcyA9IGFyZ3NbMF0sIGkgPSAxLCBqO1xuXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZ1bGxDb3B5ID0gcmVzO1xuICAgICAgICByZXMgPSBhcmdzWzFdO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIHdoaWxlIChpICE9PSBsZW5ndGgpIHtcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcbiAgICAgICAgc3JjS2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBzcmNLZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgaWYgKGZ1bGxDb3B5ICYmIChpc1VzdWFsT2JqZWN0KHNyY0F0dHIpIHx8IEFycmF5LmlzQXJyYXkoc3JjQXR0cikpKSB7XG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcbiAgICAgICAgICAgICAgICBleHRlbmQoZnVsbENvcHksIHJlc0F0dHIsIHNyY0F0dHIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW50aXR5VG9EaWN0aW9uYXJ5KGVudGl0aWVzOiBhbnlbXSwgZW50aXR5Q2FsbGJhY2s/OiAoZW50aXR5OiBhbnkpID0+IGFueSk6IElIYXNoIHtcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXG4gICAgICAgIGwgPSBlbnRpdGllcy5sZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChlbnRpdGllc1tpXSkge1xuICAgICAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV0uaWQgPyBlbnRpdGllc1tpXSA6IHtpZDogZW50aXRpZXNbaV19O1xuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcbiAgICBsZXQgY29tcGFyYXRvciA9IChwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXM6IGFueVtdLCBpbmRleCA9IDApID0+IHtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3B0aW9ucyA9IHByb3BlcnRpZXNbaW5kZXhdLFxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxuICAgICAgICAgICAgZGlyTXVsdGlwbGllcjogbnVtYmVyO1xuICAgICAgICBkaXJNdWx0aXBsaWVyID0gZGlyID09PSBcImFzY1wiID8gMSA6IC0xO1xuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gMSAqIGRpck11bHRpcGxpZXI7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldkl0ZW1bcHJvcGVydHldIDwgbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzLCBpbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gZW50aXRpZXMuc29ydCgocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZG93bmxvYWREYXRhQXNGaWxlKGRhdGE6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgbWltZVR5cGUgPSBcInRleHQvanNvblwiKSB7XG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiBtaW1lVHlwZX0pLFxuICAgICAgICBlbGVtO1xuICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgZWxlbS5jbGljaygpO1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XG4gICAgbGV0IGFkZGVkSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICBtZXJnZWRJdGVtczogSUVudGl0eVtdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5pZCAmJiBhZGRlZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xuICAgICAgICAgICAgYWRkZWRJZHMucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGVudGl0aWVzTGlzdCkgJiYgZW50aXRpZXNMaXN0LnJlZHVjZSgocmVzdWx0OiBzdHJpbmdbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBbXSkgfHwgW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZSAoLi4uc291cmNlczogc3RyaW5nW11bXSk6IHN0cmluZ1tdIHtcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSAmJiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcbiAgICBsZXQgc2VsZWN0ZWRFbnRpdGllc0hhc2ggPSBlbnRpdHlUb0RpY3Rpb25hcnkoZXhpc3RlZEVudGl0aWVzKTtcbiAgICByZXR1cm4gbmV3RW50aXRpZXMucmVkdWNlKChyZXM6IElFbnRpdHlbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgICFzZWxlY3RlZEVudGl0aWVzSGFzaFtlbnRpdHkuaWRdICYmIHJlcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSwgW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZXRoZXIocHJvbWlzZXM6IFByb21pc2U8YW55PltdKTogUHJvbWlzZTxhbnk+IHtcbiAgICBsZXQgcmVzdWx0czogYW55W10gPSBbXSxcbiAgICAgICAgcmVzdWx0c0NvdW50ID0gMDtcbiAgICByZXN1bHRzLmxlbmd0aCA9IHByb21pc2VzLmxlbmd0aDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgcmVzb2x2ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICB9O1xuICAgICAgICBwcm9taXNlcy5sZW5ndGggPyBwcm9taXNlcy5mb3JFYWNoKChwcm9taXNlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQgPT09IHByb21pc2VzLmxlbmd0aCAmJiByZXNvbHZlQWxsKCk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVkUHJvbWlzZTxUPiAodmFsPzogVCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPihyZXNvbHZlID0+IHJlc29sdmUodmFsKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChkYXRhKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhaXRpbmcge1xuXG4gICAgcHJpdmF0ZSB3YWl0aW5nQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGJvZHlFbDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgcHVibGljIHN0YXJ0KGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuYm9keUVsLCB6SW5kZXg/OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKGVsLm9mZnNldFBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5jbGFzc05hbWUgPSBcIndhaXRpbmdcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nZmFkZXInPjwvZGl2PjxkaXYgY2xhc3M9J3NwaW5uZXInPjwvZGl2PlwiO1xuICAgICAgICBlbC5wYXJlbnROb2RlPy5hcHBlbmRDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLndpZHRoID0gZWwub2Zmc2V0V2lkdGggKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS50b3AgPSBlbC5vZmZzZXRUb3AgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gZWwub2Zmc2V0TGVmdCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIHR5cGVvZiB6SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS56SW5kZXggPSB6SW5kZXgudG9TdHJpbmcoKSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBzdG9wICgpIHtcbiAgICAgICAgaWYgKHRoaXMud2FpdGluZ0NvbnRhaW5lciAmJiB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgIH07XG59IiwiLy9hZGRlZCBieSBCcmV0dCB0byBtYW5hZ2UgYWRkaW5nIGFsbCB6b25lcyB0byB0aGUgZXhwb3J0IGFzIGFuIG9wdGlvblxuXG5leHBvcnQgY2xhc3MgWm9uZUJ1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRab25lcygpXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Wm9uZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiWm9uZVwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59Il19
