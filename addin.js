(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.AddInBuilder = void 0;
var AddInBuilder = /** @class */ (function () {
    function AddInBuilder(api) {
        var _this = this;
        this.isMenuItem = function (item) {
            return !item.url && !!item.path && !!item.menuId;
        };
        //Tests a URL for double slash. Accepts a url as a string as a argument.
        //Returns true if the url contains a double slash //
        //Returns false if the url does not contain a double slash.
        this.isValidUrl = function (url) { return !!url && url.indexOf("\/\/") > -1; };
        this.isValidButton = function (item) { return !!item.buttonName && !!item.page && !!item.click && _this.isValidUrl(item.click); };
        this.isEmbeddedItem = function (item) { return !!item.files; };
        this.isValidMapAddin = function (item) {
            var scripts = item.mapScript;
            var isValidSrc = !(scripts === null || scripts === void 0 ? void 0 : scripts.src) || _this.isValidUrl(scripts.src);
            var isValidStyle = !(scripts === null || scripts === void 0 ? void 0 : scripts.style) || _this.isValidUrl(scripts.style);
            var isValidHtml = !(scripts === null || scripts === void 0 ? void 0 : scripts.url) || _this.isValidUrl(scripts.url);
            var hasScripts = !!scripts && (!!(scripts === null || scripts === void 0 ? void 0 : scripts.src) || !(scripts === null || scripts === void 0 ? void 0 : scripts.style) || !(scripts === null || scripts === void 0 ? void 0 : scripts.url));
            return hasScripts && isValidSrc && isValidStyle && isValidHtml;
        };
        this.isValidItem = function (item) {
            return _this.isEmbeddedItem(item) || _this.isMenuItem(item) || _this.isValidButton(item) || _this.isValidMapAddin(item) || (!!item.url && _this.isValidUrl(item.url));
        };
        this.api = api;
    }
    AddInBuilder.prototype.isCurrentAddin = function (addin) {
        return ((addin.indexOf("Registration config") > -1) ||
            (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    };
    AddInBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the addin builder with all addins
    AddInBuilder.prototype.fetch = function () {
        this.abortCurrentTask();
        this.currentTask = this.getAddIns();
        return this.currentTask;
    };
    AddInBuilder.prototype.getAllowedAddins = function (allAddins) {
        var _this = this;
        return allAddins.filter(function (addin) {
            //removes the current addin - registration config
            if (_this.isCurrentAddin(addin)) {
                return false;
            }
            var addinConfig = JSON.parse(addin);
            if (addinConfig.items) {
                //Multi line addin structure check
                return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(function (item) {
                    var url = item.url;
                    return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(_this.isValidItem);
                });
            }
            else {
                //Single line addin structure check
                return _this.isValidItem(addinConfig);
            }
        });
    };
    AddInBuilder.prototype.getAddIns = function () {
        var _this = this;
        this.currentTask = this.getVersion()
            .then(function (version) {
            if (version.split(".", 1) < 8) {
                return _this.getFromSystemSettings();
            }
            else {
                return _this.getFromAddInApi();
            }
        });
        return this.currentTask;
    };
    AddInBuilder.prototype.getVersion = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("GetVersion", {}, resolve, reject);
        });
    };
    AddInBuilder.prototype.getFromAddInApi = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "AddIn"
            }, resolve, reject);
        }).then(function (result) {
            var addIns = [];
            if (Array.isArray(result)) {
                result.forEach(function (addIn) {
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
            return _this.getAllowedAddins(addIns);
        });
    };
    AddInBuilder.prototype.getFromSystemSettings = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "SystemSettings"
            }, resolve, reject);
        }).then(function (result) {
            return _this.getAllowedAddins(result[0].customerPages);
        });
    };
    AddInBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return AddInBuilder;
}());
exports.AddInBuilder = AddInBuilder;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="./addin.d.ts" />
/// <reference path="../bluebird.d.ts"/>
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var groupsBuilder_1 = require("./groupsBuilder");
var securityClearancesBuilder_1 = require("./securityClearancesBuilder");
var reportsBuilder_1 = require("./reportsBuilder");
var rulesBuilder_1 = require("./rulesBuilder");
var distributionListsBuilder_1 = require("./distributionListsBuilder");
var miscBuilder_1 = require("./miscBuilder");
var utils_1 = require("./utils");
var waiting_1 = require("./waiting");
// import {UserBuilder} from "./userBuilder";
var zoneBuilder_1 = require("./zoneBuilder");
var addInBuilder_1 = require("./addInBuilder");
var Addin = /** @class */ (function () {
    //initialize addin
    function Addin(api) {
        var _this = this;
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
            certificates: []
        };
        this.toggleWaiting = function (isStart) {
            if (isStart === void 0) { isStart = false; }
            if (isStart) {
                _this.toggleExportButton(true);
                _this.waiting.start(document.getElementById("addinContainer").parentElement, 9999);
            }
            else {
                _this.toggleExportButton(false);
                _this.waiting.stop();
            }
        };
        //Brett: exports the data
        this.exportData = function () {
            _this.toggleWaiting(true);
            return _this.reportsBuilder.getData().then(function (reportsData) {
                _this.data.reports = reportsData;
                console.log(_this.data);
                (0, utils_1.downloadDataAsFile)(JSON.stringify(_this.data), "export.json");
            })["catch"](function (e) {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            })["finally"](function () { return _this.toggleWaiting(); });
        };
        this.saveChanges = function () {
            _this.render();
        };
        this.checkBoxValueChanged = function () {
            _this.toggleExportButton(true);
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1["default"](api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1["default"](api);
        this.reportsBuilder = new reportsBuilder_1["default"](api);
        this.rulesBuilder = new rulesBuilder_1["default"](api);
        this.distributionListsBuilder = new distributionListsBuilder_1["default"](api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.userBuilder = new UserBuilder(api);
        this.zoneBuilder = new zoneBuilder_1.ZoneBuilder(api);
        this.addInBuilder = new addInBuilder_1.AddInBuilder(api);
        this.waiting = new waiting_1["default"]();
    }
    Addin.prototype.combineDependencies = function () {
        var allDependencies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            allDependencies[_i] = arguments[_i];
        }
        var total = {
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
        return Object.keys(total).reduce(function (dependencies, dependencyName) {
            dependencies[dependencyName] = utils_1.mergeUnique.apply(void 0, __spreadArray([dependencies[dependencyName]], allDependencies.map(function (entityDependencies) { return entityDependencies[dependencyName]; }), false));
            return dependencies;
        }, total);
    };
    Addin.prototype.addNewGroups = function (groups, data) {
        if (!groups.length) {
            return (0, utils_1.resolvedPromise)();
        }
        var groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = (0, utils_1.getUniqueEntities)(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = (0, utils_1.mergeUniqueEntities)(data.groups, groupsData);
        data.users = (0, utils_1.mergeUniqueEntities)(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: (0, utils_1.getEntitiesIds)(newGroupsUsers) }, data);
    };
    Addin.prototype.addNewCustomMaps = function (customMapsIds, data) {
        var _this = this;
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        var customMapsData = customMapsIds.reduce(function (data, customMapId) {
            var customMapData = _this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = (0, utils_1.mergeUniqueEntities)(data.customMaps, customMapsData);
    };
    Addin.prototype.addNewNotificationTemplates = function (notificationTemplatesIds, data) {
        var _this = this;
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        var notificationTemplatesData = notificationTemplatesIds.reduce(function (data, templateId) {
            var templateData = _this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = (0, utils_1.mergeUniqueEntities)(data.notificationTemplates, notificationTemplatesData);
    };
    Addin.prototype.getEntytiesIds = function (entities) {
        return entities.reduce(function (res, entity) {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    };
    Addin.prototype.getEntityDependencies = function (entity, entityType) {
        var entityDependencies = {};
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
                break;
            case "zones":
                var zoneTypes = this.getEntytiesIds(entity["zoneTypes"]);
                zoneTypes.length && (entityDependencies.zoneTypes = zoneTypes);
                entityDependencies.groups = this.getEntytiesIds(entity["groups"]);
                break;
            case "workTimes":
                entity["holidayGroup"].groupId && (entityDependencies.workHolidays = [entity["holidayGroup"].groupId]);
                break;
            default:
                break;
        }
        return entityDependencies;
    };
    Addin.prototype.applyToEntities = function (entitiesList, initialValue, func) {
        var overallIndex = 0;
        return Object.keys(entitiesList).reduce(function (result, entityType, typeIndex) {
            return entitiesList[entityType].reduce(function (res, entity, index) {
                overallIndex++;
                return func(res, entity, entityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    };
    Addin.prototype.resolveDependencies = function (dependencies, data) {
        var _this = this;
        var getData = function (entitiesList) {
            var entityRequestTypes = {
                devices: "Device",
                users: "User",
                zoneTypes: "ZoneType",
                zones: "Zone",
                workTimes: "WorkTime",
                workHolidays: "WorkHoliday",
                securityGroups: "Group",
                diagnostics: "Diagnostic",
                certificates: "Certificate"
            }, requests = _this.applyToEntities(entitiesList, {}, function (result, entityId, entityType) {
                var request = {
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
            return _this.addNewGroups(entitiesList.groups || [], data).then(function () {
                _this.addNewCustomMaps(entitiesList.customMaps || [], data);
                _this.addNewNotificationTemplates(entitiesList.notificationTemplates || [], data);
                delete entitiesList.groups;
                delete entitiesList.customMaps;
                return new Promise(function (resolve, reject) {
                    var requestEntities = Object.keys(requests), requestsArray = requestEntities.reduce(function (list, type) { return list.concat(requests[type]); }, []);
                    if (!requestEntities.length) {
                        return resolve(data);
                    }
                    _this.api.multiCall(requestsArray, function (response) {
                        var newGroups = [], newCustomMaps = [], newDependencies = {}, exportedData = _this.applyToEntities(requests, {}, function (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) {
                            var items = requestsArray.length > 1 ? response[overallIndex] : response;
                            items.forEach(function (item) {
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
                                        result[entityType] = result[entityType].concat(_this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups || [], items));
                                        return result;
                                    }
                                    return false;
                                }
                                var entityDependencies = _this.getEntityDependencies(item, entityType);
                                newDependencies = _this.applyToEntities(entityDependencies, newDependencies, function (result, entityId, entityType) {
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
                        newDependencies = Object.keys(newDependencies).reduce(function (result, dependencyName) {
                            var entities = newDependencies[dependencyName], exported = (exportedData[dependencyName] || []).map(function (entity) { return entity.id; });
                            entities.forEach(function (entityId) {
                                if (exported.indexOf(entityId) === -1) {
                                    !result[dependencyName] && (result[dependencyName] = []);
                                    result[dependencyName].push(entityId);
                                }
                            });
                            return result;
                        }, {});
                        // Remove built-in security groups
                        exportedData.securityGroups && (exportedData.securityGroups = exportedData.securityGroups.reduce(function (result, group) {
                            group.id.indexOf("Group") === -1 && result.push(group);
                            return result;
                        }, []));
                        _this.addNewGroups(newGroups, data).then(function () {
                            _this.addNewCustomMaps(newCustomMaps, data);
                            Object.keys(exportedData).forEach(function (entityType) {
                                data[entityType] = (0, utils_1.mergeUniqueEntities)(data[entityType], exportedData[entityType]);
                            });
                            if (Object.keys(newDependencies).length) {
                                resolve(_this.resolveDependencies(newDependencies, data));
                            }
                            else {
                                resolve(data);
                            }
                        }, reject);
                    }, reject);
                });
            });
        };
        return new Promise(function (resolve, reject) {
            return getData(dependencies).then(resolve)["catch"](reject);
        });
    };
    Addin.prototype.abortCurrentTask = function () {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    Addin.prototype.toggleExportButton = function (isDisabled) {
        this.exportBtn.disabled = isDisabled;
    };
    //Brett - displays the output on the page
    Addin.prototype.showEntityMessage = function (block, qty, entityName) {
        var blockEl = block.querySelector(".description");
        if (qty) {
            qty > 1 && (entityName += "s");
            var hasItemsMessageTemplate = document.getElementById("hasItemsMessageTemplate").innerHTML;
            blockEl.innerHTML = hasItemsMessageTemplate.replace("{quantity}", qty.toString()).replace("{entity}", entityName);
        }
        else {
            blockEl.innerHTML = "You have <span class=\"bold\">not configured any " + entityName + "s</span>.";
        }
    };
    Addin.prototype.showSystemSettingsMessage = function (block, isIncluded) {
        var blockEl = block.querySelector(".description");
        if (isIncluded) {
            blockEl.innerHTML = "You have chosen <span class='bold'>to include</span> system settings.";
        }
        else {
            blockEl.innerHTML = "You have chosen <span class='bold'>not to include</span> system settings.";
        }
    };
    Addin.prototype.addEventHandlers = function () {
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
    };
    Addin.prototype.render = function () {
        var _this = this;
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.data.users = [];
        this.data.zones = [];
        this.data.addins = [];
        //wire up the dom
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), mapBlockDescription = document.querySelector("#exportedMap .description"), 
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
        ]).then(function (results) {
            var reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            _this.data.groups = results[0];
            _this.data.securityGroups = results[1];
            _this.data.reports = results[2];
            _this.data.rules = results[3];
            _this.data.distributionLists = _this.distributionListsBuilder.getRulesDistributionLists(_this.data.rules.map(function (rule) { return rule.id; }));
            _this.data.misc = results[5];
            var getDependencies = function (entities, entityType) {
                return entities.reduce(function (res, entity) {
                    var entityDep = _this.getEntityDependencies(entity, entityType);
                    return _this.combineDependencies(res, entityDep);
                }, {});
            };
            var zoneDependencies = {};
            if (_this.exportAllZonesCheckbox.checked == true) {
                if (results[6]) {
                    //sets exported zones to all database zones
                    _this.data.zones = results[6];
                    zoneDependencies = getDependencies(results[6], "zones");
                }
            }
            if (_this.exportAllAddinsCheckbox.checked == true) {
                if (results[7]) {
                    //sets exported addins equal to none/empty array
                    _this.data.addins = results[7];
                    if (_this.data.misc) {
                        _this.data.misc.addins = _this.data.addins;
                    }
                }
            }
            customMap = _this.data.misc && _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(zoneDependencies, reportsDependencies, rulesDependencies, distributionListsDependencies);
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            var _a;
            var mapProvider = _this.data.misc && _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            _this.showEntityMessage(groupsBlock, _this.data.groups.length - 1, "group");
            _this.showEntityMessage(securityClearancesBlock, _this.data.securityGroups.length, "security clearance");
            _this.showEntityMessage(rulesBlock, _this.data.rules.length, "rule");
            _this.showEntityMessage(reportsBlock, _this.reportsBuilder.getCustomizedReportsQty(), "report");
            _this.showEntityMessage(dashboardsBlock, _this.reportsBuilder.getDashboardsQty(), "dashboard");
            if (mapProvider) {
                mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider);
            }
            _this.showEntityMessage(addinsBlock, ((_a = _this.data.addins) === null || _a === void 0 ? void 0 : _a.length) || 0, "addin");
            // this.showEntityMessage(usersBlock, this.data.users.length, "user");
            _this.showEntityMessage(zonesBlock, _this.data.zones.length, "zone");
            _this.showSystemSettingsMessage(systemSettingsBlock, _this.exportSystemSettingsCheckbox.checked);
            //this displays all the data/objects in the console
            console.log(_this.data);
        })["catch"](function (e) {
            console.error(e);
            alert("Can't get config to export");
        })["finally"](function () { return _this.toggleWaiting(); });
    };
    Addin.prototype.unload = function () {
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
    };
    return Addin;
}());
geotab.addin.registrationConfig = function () {
    var addin;
    return {
        initialize: function (api, state, callback) {
            addin = new Addin(api);
            callback();
        },
        focus: function () {
            addin.render();
            addin.addEventHandlers();
        },
        blur: function () {
            addin.unload();
        }
    };
};

},{"./addInBuilder":1,"./distributionListsBuilder":3,"./groupsBuilder":4,"./miscBuilder":5,"./reportsBuilder":6,"./rulesBuilder":7,"./securityClearancesBuilder":9,"./utils":10,"./waiting":11,"./zoneBuilder":12}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var DistributionListsBuilder = /** @class */ (function () {
    function DistributionListsBuilder(api) {
        this.api = api;
    }
    //A distribution list links a set of Rule(s) to a set of Recipient(s). When a Rule is violated each related Recipient will receive a notification of the kind defined by its RecipientType.
    DistributionListsBuilder.prototype.getDistributionListsData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
                ["Get", {
                        "typeName": "DistributionList"
                    }],
                ["GetNotificationWebRequestTemplates", {}],
                ["GetNotificationEmailTemplates", {}],
                ["GetNotificationTextTemplates", {}]
            ], resolve, reject);
        });
    };
    ;
    DistributionListsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    DistributionListsBuilder.prototype.getDependencies = function (distributionLists) {
        var dependencies = {
            rules: [],
            users: [],
            groups: [],
            notificationTemplates: []
        }, processDependencies = function (recipient) {
            var id = undefined;
            var type = undefined;
            var userId = recipient.user.id;
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
        }, checkRecipients = function (recipients, dependencies) {
            return recipients.reduce(function (dependencies, recipient) {
                processDependencies(recipient);
                return dependencies;
            }, dependencies);
        };
        return distributionLists.reduce(function (dependencies, distributionList) {
            dependencies.rules = (0, utils_1.mergeUnique)(dependencies.rules, distributionList.rules.map(function (rule) { return rule.id; }));
            dependencies = checkRecipients(distributionList.recipients, dependencies);
            return dependencies;
        }, dependencies);
    };
    ;
    DistributionListsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getDistributionListsData()
            .then(function (_a) {
            var distributionLists = _a[0], webTemplates = _a[1], emailTemplates = _a[2], textTemplates = _a[3];
            _this.distributionLists = (0, utils_1.entityToDictionary)(distributionLists);
            _this.notificationTemplates = (0, utils_1.entityToDictionary)(webTemplates.concat(emailTemplates).concat(textTemplates));
            return _this.distributionLists;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    DistributionListsBuilder.prototype.getNotificationTemplateData = function (templateId) {
        return this.notificationTemplates[templateId];
    };
    ;
    DistributionListsBuilder.prototype.getRulesDistributionLists = function (rulesIds) {
        var _this = this;
        return Object.keys(this.distributionLists).reduce(function (res, id) {
            var list = _this.distributionLists[id];
            list.rules.some(function (listRule) { return rulesIds.indexOf(listRule.id) > -1; }) && res.push(list);
            return res;
        }, []);
    };
    ;
    DistributionListsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return DistributionListsBuilder;
}());
exports["default"] = DistributionListsBuilder;

},{"./utils":10}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var GroupsBuilder = /** @class */ (function () {
    function GroupsBuilder(api) {
        this.api = api;
    }
    //gets the groups associated with the current user
    GroupsBuilder.prototype.getGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.currentUserName = sessionData.userName;
                _this.api.multiCall([
                    ["Get", {
                            typeName: "Group"
                        }],
                    ["Get", {
                            typeName: "User"
                        }]
                ], resolve, reject);
            });
        });
    };
    ;
    GroupsBuilder.prototype.findChild = function (childId, currentItem, onAllLevels) {
        var _this = this;
        if (onAllLevels === void 0) { onAllLevels = false; }
        var foundChild = null, children = currentItem.children;
        if (!childId || !children || !children.length) {
            return null;
        }
        children.some(function (child) {
            if (child.id === childId) {
                foundChild = child;
                return foundChild;
            }
            else {
                if (onAllLevels) {
                    foundChild = _this.findChild(childId, child, onAllLevels);
                    return foundChild;
                }
                else {
                    return false;
                }
            }
        });
        return foundChild;
    };
    ;
    GroupsBuilder.prototype.getUserByPrivateGroupId = function (groupId) {
        var outputUser = null, userHasPrivateGroup = function (user, groupId) {
            return user.privateUserGroups.some(function (group) {
                if (group.id === groupId) {
                    return true;
                }
            });
        };
        this.users.some(function (user) {
            if (userHasPrivateGroup(user, groupId)) {
                outputUser = user;
                return true;
            }
        });
        return outputUser;
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupData = function (groupId) {
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
    };
    ;
    GroupsBuilder.prototype.createGroupsTree = function (groups) {
        var nodeLookup, traverseChildren = function (node) {
            var children, id;
            children = node.children;
            if (children) {
                for (var i = 0, ii = children.length; i < ii; i += 1) {
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
        nodeLookup = (0, utils_1.entityToDictionary)(groups, function (entity) {
            var newEntity = (0, utils_1.extend)({}, entity);
            if (newEntity.children) {
                newEntity.children = newEntity.children.slice();
            }
            return newEntity;
        });
        Object.keys(nodeLookup).forEach(function (key) {
            nodeLookup[key] && traverseChildren(nodeLookup[key]);
        });
        return Object.keys(nodeLookup).map(function (key) {
            return nodeLookup[key];
        });
    };
    ;
    GroupsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    //fills the group builder with the relevant information
    GroupsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getGroups()
            .then(function (_a) {
            var groups = _a[0], users = _a[1];
            _this.groups = groups;
            _this.users = users;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = (0, utils_1.extend)({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree);
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    GroupsBuilder.prototype.createFlatGroupsList = function (groups, notIncludeChildren) {
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var foundIds = [], groupsToAdd = [], makeFlatParents = function (item) {
            var itemCopy = (0, utils_1.extend)({}, item);
            if (item && item.parent) {
                makeFlatParents(item.parent);
            }
            itemCopy.children = itemCopy.children.map(function (child) { return child.id; });
            itemCopy.parent = item.parent ? { id: item.parent.id, name: item.parent.name } : null;
            if (foundIds.indexOf(item.id) === -1) {
                groupsToAdd.push(itemCopy);
                foundIds.push(item.id);
            }
        }, makeFlatChildren = function (item) {
            if (item && item.children && item.children.length) {
                item.children.forEach(function (child) {
                    var childCopy;
                    if (foundIds.indexOf(child.id) === -1) {
                        makeFlatChildren(child);
                    }
                    childCopy = (0, utils_1.extend)({}, child);
                    childCopy.children = childCopy.children.map(function (childInner) { return childInner.id; });
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
    };
    ;
    GroupsBuilder.prototype.getGroupsData = function (groupIds, notIncludeChildren) {
        var _this = this;
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: _this.tree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, notIncludeChildren);
    };
    ;
    GroupsBuilder.prototype.getCustomGroupsData = function (groupIds, allGroups) {
        var _this = this;
        var groupsTree = this.createGroupsTree(allGroups), treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: groupsTree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, true);
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupsUsers = function (groups) {
        var _this = this;
        return groups.reduce(function (users, group) {
            group.user && group.user.name !== _this.currentUserName && users.push(group.user);
            return users;
        }, []);
    };
    ;
    GroupsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return GroupsBuilder;
}());
exports["default"] = GroupsBuilder;

},{"./utils":10}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.MiscBuilder = void 0;
var utils_1 = require("./utils");
var MiscBuilder = /** @class */ (function () {
    function MiscBuilder(api) {
        this.defaultMapProviders = {
            GoogleMaps: "Google Maps",
            Here: "HERE Maps",
            MapBox: "MapBox"
        };
        this.api = api;
    }
    MiscBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the Misc builder (system settings) with the relevant information
    MiscBuilder.prototype.fetch = function (includeSysSettings) {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                var userName = sessionData.userName;
                _this.api.multiCall([
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
        }).then(function (result) {
            var currentUser = result[0][0] || result[0], systemSettings = result[1][0] || result[1], userMapProviderId = currentUser.defaultMapEngine, defaultMapProviderId = systemSettings.mapProvider, mapProviderId = _this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            _this.currentUser = currentUser;
            _this.customMapProviders = (0, utils_1.entityToDictionary)(systemSettings.customWebMapProviderList);
            _this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            var output = {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                addins: [],
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed
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
    };
    MiscBuilder.prototype.getMapProviderType = function (mapProviderId) {
        return !mapProviderId || this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    };
    MiscBuilder.prototype.getMapProviderName = function (mapProviderId) {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    };
    MiscBuilder.prototype.getMapProviderData = function (mapProviderId) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    };
    MiscBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return MiscBuilder;
}());
exports.MiscBuilder = MiscBuilder;

},{"./utils":10}],6:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var scopeGroupFilter_1 = require("./scopeGroupFilter");
var Utils = require("./utils");
var REPORT_TYPE_DASHBOAD = "Dashboard";
var ReportsBuilder = /** @class */ (function () {
    function ReportsBuilder(api) {
        this.api = api;
    }
    ReportsBuilder.prototype.getReports = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
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
    };
    ReportsBuilder.prototype.populateScopeGroupFilters = function (reports) {
        var _this = this;
        var requests = reports.reduce(function (res, report) {
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
        return new Promise(function (resolve, reject) {
            if (!requests.length) {
                resolve(reports);
                return;
            }
            _this.api.multiCall(requests, function (groupFilters) {
                var enpackedFilter = groupFilters.map(function (item) { return Array.isArray(item) ? item[0] : item; });
                var scopeGroupFilterHash = Utils.entityToDictionary(enpackedFilter);
                resolve(reports.map(function (report) {
                    return __assign(__assign({}, report), { scopeGroupFilter: report.scopeGroupFilter && scopeGroupFilterHash[report.scopeGroupFilter.id] });
                }));
            }, reject);
        });
    };
    ReportsBuilder.prototype.structureReports = function (reports, templates) {
        var findTemplateReports = function (templateId) {
            return reports.filter(function (report) { return report.template.id === templateId; });
        };
        return templates.reduce(function (res, template) {
            var templateId = template.id, templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    };
    ReportsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ReportsBuilder.prototype.updateTemplate = function (newTemplateData) {
        var _this = this;
        this.allTemplates.some(function (templateData, index) {
            if (templateData.id === newTemplateData.id) {
                _this.allTemplates[index] = newTemplateData;
                return true;
            }
            return false;
        });
    };
    ReportsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(function (_a) {
            var reports = _a[0], rest = _a.slice(1);
            return Promise.all(__spreadArray([_this.populateScopeGroupFilters(reports)], rest, true));
        })
            .then(function (_a) {
            var reports = _a[0], templates = _a[1], dashboardItems = _a[2];
            _this.allReports = reports;
            _this.allTemplates = templates;
            _this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
            _this.structuredReports = _this.structureReports(reports, templates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDependencies = function (reports) {
        var allDependencies = {
            devices: [],
            rules: [],
            zoneTypes: [],
            groups: [],
            users: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups =
                    Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups), Utils.getEntitiesIds(report.scopeGroupFilter && (0, scopeGroupFilter_1.getFilterStateUniqueGroups)(report.scopeGroupFilter.groupFilterCondition) || []));
                templateDependecies.users = Utils.mergeUnique(templateDependecies.users, report.individualRecipients && Utils.getEntitiesIds(report.individualRecipients) || []);
                templateDependecies.devices = Utils.mergeUnique(templateDependecies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                templateDependecies.rules = Utils.mergeUnique(templateDependecies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                templateDependecies.zoneTypes = Utils.mergeUnique(templateDependecies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return templateDependecies;
            }, reportsDependencies);
        }, allDependencies);
    };
    ReportsBuilder.prototype.getData = function () {
        var _this = this;
        var portionSize = 15, portions = this.allTemplates.reduce(function (requests, template) {
            if (!template.isSystem && !template.binaryData) {
                var portionIndex = requests.length - 1;
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
        }, []), totalResults = [], getPortionData = function (portion) {
            return new Promise(function (resolve, reject) {
                _this.api.multiCall(portion, resolve, reject);
            });
        }, errorPortions = [];
        this.abortCurrentTask();
        this.currentTask = portions.reduce(function (promises, portion) {
            return promises
                .then(function () { return getPortionData(portion); })
                .then(function (result) {
                totalResults = totalResults.concat(result);
            }, function (e) {
                errorPortions = errorPortions.concat(portion);
                console.error(e);
            });
        }, Utils.resolvedPromise([]))
            .then(function () {
            errorPortions.length && console.warn(errorPortions);
            totalResults.forEach(function (templateData) {
                var template = templateData.length ? templateData[0] : templateData;
                _this.updateTemplate(template);
            });
            _this.structuredReports = _this.structureReports(_this.allReports, _this.allTemplates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDashboardsQty = function () {
        return this.dashboardsLength;
    };
    ReportsBuilder.prototype.getCustomizedReportsQty = function () {
        var templates = [];
        return (this.allReports.filter(function (report) {
            var templateId = report.template.id, templateExists = templates.indexOf(templateId) > -1, isCount = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    };
    ReportsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return ReportsBuilder;
}());
exports["default"] = ReportsBuilder;

},{"./scopeGroupFilter":8,"./utils":10}],7:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
/// <reference path="addin.d.ts"/>
var utils_1 = require("./utils");
var APPLICATION_RULE_ID = "RuleApplicationExceptionId";
var RulesBuilder = /** @class */ (function () {
    function RulesBuilder(api) {
        this.api = api;
    }
    RulesBuilder.prototype.getRuleDiagnosticsString = function (rule) {
        return this.getDependencies([rule]).diagnostics.sort().join();
    };
    RulesBuilder.prototype.getRules = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
                ["Get", {
                        "typeName": "Rule"
                    }],
                ["Get", {
                        typeName: "Rule",
                        search: {
                            baseType: "RouteBasedMaterialMgmt"
                        }
                    }]
            ], function (_a) {
                var allRules = _a[0], materialManagementRules = _a[1];
                // To get correct Service groups we need to update material management stock rules' groups from groups property of the corresponding rule with RouteBasedMaterialMgmt baseType
                // The only possible method now to match Stock rule and rule with RouteBasedMaterialMgmt baseType is to match their diagnostics
                var mmRulesGroups = materialManagementRules.reduce(function (res, mmRule) {
                    var mmRuleDiagnostics = _this.getRuleDiagnosticsString(mmRule);
                    res[mmRuleDiagnostics] = mmRule.groups;
                    return res;
                }, {});
                debugger;
                return resolve(allRules.map(function (rule) {
                    var mmRuleDiagnostics = _this.getRuleDiagnosticsString(rule);
                    var correspondingMMRuleGroups = mmRulesGroups[mmRuleDiagnostics];
                    return correspondingMMRuleGroups ? __assign(__assign({}, rule), { groups: correspondingMMRuleGroups }) : rule;
                }));
            }, reject);
        });
    };
    RulesBuilder.prototype.structureRules = function (rules) {
        return (0, utils_1.sortArrayOfEntities)(rules, [["baseType", "desc"], "name"]);
    };
    RulesBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    RulesBuilder.prototype.getDependencies = function (rules) {
        var dependencies = {
            devices: [],
            users: [],
            zones: [],
            zoneTypes: [],
            workTimes: [],
            workHolidays: [],
            groups: [],
            diagnostics: [],
            securityGroups: []
        }, processDependencies = function (condition) {
            var id = undefined;
            var type = undefined;
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
        }, checkConditions = function (parentCondition, dependencies) {
            var conditions = parentCondition.children || [];
            processDependencies(parentCondition);
            return conditions.reduce(function (dependencies, condition) {
                if (condition.children) {
                    dependencies = checkConditions(condition, dependencies);
                }
                processDependencies(condition);
                return dependencies;
            }, dependencies);
        };
        return rules.reduce(function (dependencies, rule) {
            dependencies.groups = (0, utils_1.mergeUnique)(dependencies.groups, rule.groups.map(function (group) { return group.id; }));
            if (rule.condition) {
                dependencies = checkConditions(rule.condition, dependencies);
            }
            return dependencies;
        }, dependencies);
    };
    RulesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then(function (switchedOnRules) {
            _this.combinedRules = (0, utils_1.entityToDictionary)(switchedOnRules);
            delete (_this.combinedRules[APPLICATION_RULE_ID]);
            return Object.keys(_this.combinedRules).map(function (ruleId) { return _this.combinedRules[ruleId]; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    RulesBuilder.prototype.getRulesData = function (rulesIds) {
        var _this = this;
        return rulesIds.map(function (ruleId) { return _this.combinedRules[ruleId]; });
    };
    RulesBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return RulesBuilder;
}());
exports["default"] = RulesBuilder;

},{"./utils":10}],8:[function(require,module,exports){
"use strict";
/// <reference path="../bluebird.d.ts"/>
exports.__esModule = true;
exports.getFilterStateUniqueGroups = exports.isFilterState = exports.getScopeGroupFilterById = void 0;
var getScopeGroupFilterById = function (id, api) {
    return new Promise(function (resolve, reject) {
        api.call("Get", {
            typeName: "GroupFilter",
            search: { id: id }
        }, resolve, reject);
    });
};
exports.getScopeGroupFilterById = getScopeGroupFilterById;
var isFilterState = function (item) { return item && item.relation !== undefined; };
exports.isFilterState = isFilterState;
var getFilterStateUniqueGroups = function (state) {
    var groupIds = [];
    var processItem = function (item, prevRes) {
        if (prevRes === void 0) { prevRes = []; }
        return item.groupFilterConditions.reduce(function (res, childItem) {
            if ((0, exports.isFilterState)(childItem)) {
                return processItem(childItem, res);
            }
            var id = childItem.groupId;
            groupIds.indexOf(id) === -1 && res.push({ id: id });
            groupIds.push(id);
            return res;
        }, prevRes);
    };
    return (0, exports.isFilterState)(state) ? processItem(state) : [{ id: state.groupId }];
};
exports.getFilterStateUniqueGroups = getFilterStateUniqueGroups;

},{}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var groupsBuilder_1 = require("./groupsBuilder");
var Utils = require("./utils");
var SecurityClearancesBuilder = /** @class */ (function (_super) {
    __extends(SecurityClearancesBuilder, _super);
    function SecurityClearancesBuilder(api) {
        return _super.call(this, api) || this;
    }
    SecurityClearancesBuilder.prototype.getSecurityGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.api.call("Get", {
                    typeName: "Group",
                    search: {
                        id: "GroupSecurityId"
                    }
                }, resolve, reject);
            });
        });
    };
    ;
    SecurityClearancesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getSecurityGroups()
            .then(function (groups) {
            _this.groups = groups;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = Utils.extend({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree).filter(function (group) { return !!group.name; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    return SecurityClearancesBuilder;
}(groupsBuilder_1["default"]));
exports["default"] = SecurityClearancesBuilder;

},{"./groupsBuilder":4,"./utils":10}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.toArray = exports.resolvedPromise = exports.together = exports.getUniqueEntities = exports.mergeUnique = exports.getEntitiesIds = exports.mergeUniqueEntities = exports.downloadDataAsFile = exports.sortArrayOfEntities = exports.entityToDictionary = exports.extend = exports.hasClass = exports.addClass = exports.removeClass = void 0;
/// <reference path="../bluebird.d.ts"/>
var classNameCtrl = function (el) {
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
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" "), newClasses = classes.filter(function (classItem) { return classItem !== name; });
    classNameCtrl(el).set(newClasses.join(" "));
}
exports.removeClass = removeClass;
function addClass(el, name) {
    if (!el) {
        return;
    }
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}
exports.addClass = addClass;
function hasClass(el, className) {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}
exports.hasClass = hasClass;
function extend() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
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
    var comparator = function (prevItem, nextItem, properties, index) {
        if (index === void 0) { index = 0; }
        if (properties.length <= index) {
            return 0;
        }
        var options = properties[index], _a = Array.isArray(options) ? options : [options], property = _a[0], _b = _a[1], dir = _b === void 0 ? "asc" : _b, dirMultiplier;
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
    return entities.sort(function (prevTemplate, nextTemplate) {
        return comparator(prevTemplate, nextTemplate, sortingFields);
    });
}
exports.sortArrayOfEntities = sortArrayOfEntities;
function downloadDataAsFile(data, filename, mimeType) {
    if (mimeType === void 0) { mimeType = "text/json"; }
    var blob = new Blob([data], { type: mimeType }), elem;
    elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}
exports.downloadDataAsFile = downloadDataAsFile;
function mergeUniqueEntities() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var addedIds = [], mergedItems = [];
    sources.forEach(function (source) { return source.forEach(function (item) {
        if (item && item.id && addedIds.indexOf(item.id) === -1) {
            addedIds.push(item.id);
            mergedItems.push(item);
        }
    }); });
    return mergedItems;
}
exports.mergeUniqueEntities = mergeUniqueEntities;
function getEntitiesIds(entitiesList) {
    return Array.isArray(entitiesList) && entitiesList.reduce(function (result, entity) {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}
exports.getEntitiesIds = getEntitiesIds;
function mergeUnique() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var mergedItems = [];
    sources.forEach(function (source) {
        Array.isArray(source) && source.forEach(function (item) {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}
exports.mergeUnique = mergeUnique;
function getUniqueEntities(newEntities, existedEntities) {
    var selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce(function (res, entity) {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}
exports.getUniqueEntities = getUniqueEntities;
function together(promises) {
    var results = [], resultsCount = 0;
    results.length = promises.length;
    return new Promise(function (resolve, reject) {
        var resolveAll = function () {
            return resolve(results);
        };
        promises.length ? promises.forEach(function (promise, index) {
            promise.then(function (result) {
                resultsCount++;
                results[index] = result;
                resultsCount === promises.length && resolveAll();
            })["catch"](function (error) {
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
    return new Promise(function (resolve) { return resolve(val); });
}
exports.resolvedPromise = resolvedPromise;
function toArray(data) {
    return Array.isArray(data) ? data : [data];
}
exports.toArray = toArray;

},{}],11:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Waiting = /** @class */ (function () {
    function Waiting() {
        this.bodyEl = document.body;
    }
    Waiting.prototype.start = function (el, zIndex) {
        var _a;
        if (el === void 0) { el = this.bodyEl; }
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
    };
    ;
    Waiting.prototype.stop = function () {
        if (this.waitingContainer && this.waitingContainer.parentNode) {
            this.waitingContainer.parentNode.removeChild(this.waitingContainer);
        }
    };
    ;
    return Waiting;
}());
exports["default"] = Waiting;

},{}],12:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all zones to the export as an option
exports.__esModule = true;
exports.ZoneBuilder = void 0;
var ZoneBuilder = /** @class */ (function () {
    function ZoneBuilder(api) {
        this.api = api;
    }
    ZoneBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the user builder with all users
    ZoneBuilder.prototype.fetch = function () {
        this.abortCurrentTask();
        this.currentTask = this.getZones();
        return this.currentTask;
    };
    ZoneBuilder.prototype.getZones = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    };
    ZoneBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return ZoneBuilder;
}());
exports.ZoneBuilder = ZoneBuilder;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZEluQnVpbGRlci50cyIsInNvdXJjZXMvYWRkaW4udHMiLCJzb3VyY2VzL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci50cyIsInNvdXJjZXMvZ3JvdXBzQnVpbGRlci50cyIsInNvdXJjZXMvbWlzY0J1aWxkZXIudHMiLCJzb3VyY2VzL3JlcG9ydHNCdWlsZGVyLnRzIiwic291cmNlcy9ydWxlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3Njb3BlR3JvdXBGaWx0ZXIudHMiLCJzb3VyY2VzL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudHMiLCJzb3VyY2VzL3V0aWxzLnRzIiwic291cmNlcy93YWl0aW5nLnRzIiwic291cmNlcy96b25lQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ29CQTtJQUlJLHNCQUFZLEdBQUc7UUFBZixpQkFFQztRQUVPLGVBQVUsR0FBRyxVQUFDLElBQWdCO1lBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JELENBQUMsQ0FBQTtRQUVELHdFQUF3RTtRQUN4RSxvREFBb0Q7UUFDcEQsMkRBQTJEO1FBQ25ELGVBQVUsR0FBRyxVQUFDLEdBQVcsSUFBYyxPQUFBLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBakMsQ0FBaUMsQ0FBQztRQUV6RSxrQkFBYSxHQUFHLFVBQUMsSUFBZ0IsSUFBYyxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxD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O0lBQzVCLENBQUM7SUFDTCxrQkFBQztBQUFELENBL0JBLEFBK0JDLElBQUE7QUEvQlksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbnRlcmZhY2UgSUFkZGluSXRlbSB7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgbWVudUlkPzogc3RyaW5nO1xuICAgIGZpbGVzPzogYW55O1xuICAgIHBhZ2U/OiBzdHJpbmc7XG4gICAgY2xpY2s/OiBzdHJpbmc7XG4gICAgYnV0dG9uTmFtZT86IHN0cmluZztcbiAgICBtYXBTY3JpcHQ/OiB7XG4gICAgICAgIHNyYz86IHN0cmluZztcbiAgICAgICAgc3R5bGU/OiBzdHJpbmc7XG4gICAgICAgIHVybD86IHN0cmluZztcbiAgICB9XG59XG5cbmludGVyZmFjZSBJQWRkaW4gZXh0ZW5kcyBJQWRkaW5JdGVtIHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGl0ZW1zPzogSUFkZGluSXRlbVtdO1xufVxuXG5leHBvcnQgY2xhc3MgQWRkSW5CdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNNZW51SXRlbSA9IChpdGVtOiBJQWRkaW5JdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgIHJldHVybiAhaXRlbS51cmwgJiYgISFpdGVtLnBhdGggJiYgISFpdGVtLm1lbnVJZDtcbiAgICB9XG5cbiAgICAvL1Rlc3RzIGEgVVJMIGZvciBkb3VibGUgc2xhc2guIEFjY2VwdHMgYSB1cmwgYXMgYSBzdHJpbmcgYXMgYSBhcmd1bWVudC5cbiAgICAvL1JldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIGNvbnRhaW5zIGEgZG91YmxlIHNsYXNoIC8vXG4gICAgLy9SZXR1cm5zIGZhbHNlIGlmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBhIGRvdWJsZSBzbGFzaC5cbiAgICBwcml2YXRlIGlzVmFsaWRVcmwgPSAodXJsOiBzdHJpbmcpOiBib29sZWFuID0+ICEhdXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTE7XG5cbiAgICBwcml2YXRlIGlzVmFsaWRCdXR0b24gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmJ1dHRvbk5hbWUgJiYgISFpdGVtLnBhZ2UgJiYgISFpdGVtLmNsaWNrICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLmNsaWNrKTtcblxuICAgIHByaXZhdGUgaXNFbWJlZGRlZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4gISFpdGVtLmZpbGVzO1xuXG4gICAgcHJpdmF0ZSBpc1ZhbGlkTWFwQWRkaW4gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICBjb25zdCBzY3JpcHRzID0gaXRlbS5tYXBTY3JpcHQ7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTcmMgPSAhc2NyaXB0cz8uc3JjIHx8IHRoaXMuaXNWYWxpZFVybChzY3JpcHRzLnNyYyk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRTdHlsZSA9ICFzY3JpcHRzPy5zdHlsZSB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy5zdHlsZSk7XG4gICAgICAgIGNvbnN0IGlzVmFsaWRIdG1sID0gIXNjcmlwdHM/LnVybCB8fCB0aGlzLmlzVmFsaWRVcmwoc2NyaXB0cy51cmwpO1xuICAgICAgICBjb25zdCBoYXNTY3JpcHRzID0gISFzY3JpcHRzICYmICghIXNjcmlwdHM/LnNyYyB8fCAhc2NyaXB0cz8uc3R5bGUgfHwgIXNjcmlwdHM/LnVybCk7XG4gICAgICAgIHJldHVybiBoYXNTY3JpcHRzICYmIGlzVmFsaWRTcmMgJiYgaXNWYWxpZFN0eWxlICYmIGlzVmFsaWRIdG1sO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNWYWxpZEl0ZW0gPSAoaXRlbTogSUFkZGluSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0VtYmVkZGVkSXRlbShpdGVtKSB8fCB0aGlzLmlzTWVudUl0ZW0oaXRlbSkgfHwgdGhpcy5pc1ZhbGlkQnV0dG9uKGl0ZW0pIHx8IHRoaXMuaXNWYWxpZE1hcEFkZGluKGl0ZW0pIHx8ICghIWl0ZW0udXJsICYmIHRoaXMuaXNWYWxpZFVybChpdGVtLnVybCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICgoYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMSl8fFxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIGFkZGluIGJ1aWxkZXIgd2l0aCBhbGwgYWRkaW5zXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRBZGRJbnMoKVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWRkaW5Db25maWc6IElBZGRpbiA9IEpTT04ucGFyc2UoYWRkaW4pO1xuICAgICAgICAgICAgaWYoYWRkaW5Db25maWcuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAvL011bHRpIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXJsID0gaXRlbS51cmw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeSh0aGlzLmlzVmFsaWRJdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vU2luZ2xlIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZEl0ZW0oYWRkaW5Db25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFkZElucyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0VmVyc2lvbigpXG4gICAgICAgIC50aGVuKCh2ZXJzaW9uKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBpZiggdmVyc2lvbi5zcGxpdChcIi5cIiwgMSkgPCA4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tU3lzdGVtU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJvbUFkZEluQXBpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFZlcnNpb24gKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0VmVyc2lvblwiLCB7XG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21BZGRJbkFwaSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJBZGRJblwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGFkZElucyA6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHJlc3VsdCkpe1xuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2goYWRkSW4gPT4ge1xuICAgICAgICAgICAgICAgIC8vIE5ldyBBcGkgcmV0dXJucyBjb25maWd1cmF0aW9uIGZvciBBbGwgQWRkaW5zXG4gICAgICAgICAgICAgICAgLy8gSWYgaXQgaGFzIFVybCB0aGVuIHdlIGRvbid0IG5lZWQgdGhlIGNvbmZpZ3VyYXRpb24gcGFydCBmb3IgZXhwb3J0XG4gICAgICAgICAgICAgICAgaWYoYWRkSW4udXJsICYmIGFkZEluLnVybCAhPSBcIlwiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoYWRkSW4uY29uZmlndXJhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYWRkSW4uY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhZGRJbi5pZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyB1cmwgYnV0IHdlIGhhdmUgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIFdlIHdpbGwga2VlcCB3aGF0J3MgaW5zaWRlIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZihhZGRJbi5jb25maWd1cmF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW4gPSBhZGRJbi5jb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRJbnMucHVzaChKU09OLnN0cmluZ2lmeShhZGRJbikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhhZGRJbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZyb21TeXN0ZW1TZXR0aW5ncyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJTeXN0ZW1TZXR0aW5nc1wiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhyZXN1bHRbMF0uY3VzdG9tZXJQYWdlcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9hZGRpbi5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XG5pbXBvcnQgUmVwb3J0c0J1aWxkZXIgZnJvbSBcIi4vcmVwb3J0c0J1aWxkZXJcIjtcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xuaW1wb3J0IHtJTWlzY0RhdGEsIE1pc2NCdWlsZGVyfSBmcm9tIFwiLi9taXNjQnVpbGRlclwiO1xuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XG4vLyBpbXBvcnQge1VzZXJCdWlsZGVyfSBmcm9tIFwiLi91c2VyQnVpbGRlclwiO1xuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcbmltcG9ydCB7QWRkSW5CdWlsZGVyfSBmcm9tIFwiLi9hZGRJbkJ1aWxkZXJcIjtcblxuaW50ZXJmYWNlIEdlb3RhYiB7XG4gICAgYWRkaW46IHtcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxuICAgIH07XG59XG5cbmludGVyZmFjZSBJSW1wb3J0RGF0YSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICByZXBvcnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xuICAgIGRpYWdub3N0aWNzOiBhbnlbXTtcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcbiAgICBtaXNjOiBJTWlzY0RhdGEgfCBudWxsO1xuICAgIGFkZGluczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBjZXJ0aWZpY2F0ZXM6IGFueVtdO1xufVxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcbiAgICBydWxlcz86IHN0cmluZ1tdO1xuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xuICAgIHVzZXJzPzogc3RyaW5nW107XG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XG4gICAgem9uZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xuICAgIGNlcnRpZmljYXRlcz86IHN0cmluZ1tdO1xufVxuXG50eXBlIFRFbnRpdHlUeXBlID0ga2V5b2YgSUltcG9ydERhdGE7XG5cbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XG5cbmNsYXNzIEFkZGluIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdyb3Vwc0J1aWxkZXI6IEdyb3Vwc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcnVsZXNCdWlsZGVyOiBSdWxlc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFkZEluQnVpbGRlcjogQWRkSW5CdWlsZGVyO1xuICAgIC8vIHByaXZhdGUgcmVhZG9ubHkgdXNlckJ1aWxkZXI6IFVzZXJCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgem9uZUJ1aWxkZXI6IFpvbmVCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRCdXR0b25cIikgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzYXZlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlQnV0dG9uXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfYWRkaW5zX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfc3lzdGVtX3NldHRpbmdzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3YWl0aW5nOiBXYWl0aW5nO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBJSW1wb3J0RGF0YSA9IHtcbiAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgcmVwb3J0czogW10sXG4gICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHM6IFtdLFxuICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICB6b25lczogW10sXG4gICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgIHdvcmtIb2xpZGF5czogW10sXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgbWlzYzogbnVsbCxcbiAgICAgICAgYWRkaW5zOiBbXSxcbiAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXSxcbiAgICAgICAgY2VydGlmaWNhdGVzOiBbXVxuICAgIH07XG5cbiAgICBwcml2YXRlIGNvbWJpbmVEZXBlbmRlbmNpZXMgKC4uLmFsbERlcGVuZGVuY2llczogSURlcGVuZGVuY2llc1tdKTogSURlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCB0b3RhbCA9IHtcbiAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICByZXBvcnRzOiBbXSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXG4gICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0b3RhbCkucmVkdWNlKChkZXBlbmRlbmNpZXMsIGRlcGVuZGVuY3lOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0gPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLCAuLi5hbGxEZXBlbmRlbmNpZXMubWFwKChlbnRpdHlEZXBlbmRlbmNpZXMpID0+IGVudGl0eURlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0pKTtcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIHRvdGFsKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZE5ld0dyb3VwcyAoZ3JvdXBzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZ3JvdXBzRGF0YSA9IHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRHcm91cHNEYXRhKGdyb3VwcywgdHJ1ZSksXG4gICAgICAgICAgICBuZXdHcm91cHNVc2VycyA9IGdldFVuaXF1ZUVudGl0aWVzKHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzRGF0YSksIGRhdGEudXNlcnMpO1xuICAgICAgICBkYXRhLmdyb3VwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ncm91cHMsIGdyb3Vwc0RhdGEpO1xuICAgICAgICBkYXRhLnVzZXJzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLnVzZXJzLCBuZXdHcm91cHNVc2Vycyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoe3VzZXJzOiBnZXRFbnRpdGllc0lkcyhuZXdHcm91cHNVc2Vycyl9LCBkYXRhKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZE5ld0N1c3RvbU1hcHMgKGN1c3RvbU1hcHNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xuICAgICAgICBpZiAoIWN1c3RvbU1hcHNJZHMgfHwgIWN1c3RvbU1hcHNJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1c3RvbU1hcHNEYXRhID0gY3VzdG9tTWFwc0lkcy5yZWR1Y2UoKGRhdGE6IGFueVtdLCBjdXN0b21NYXBJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBsZXQgY3VzdG9tTWFwRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKGN1c3RvbU1hcElkKTtcbiAgICAgICAgICAgIGN1c3RvbU1hcERhdGEgJiYgZGF0YS5wdXNoKGN1c3RvbU1hcERhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sIFtdKTtcbiAgICAgICAgZGF0YS5jdXN0b21NYXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmN1c3RvbU1hcHMsIGN1c3RvbU1hcHNEYXRhKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyAobm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgaWYgKCFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMgfHwgIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSA9IG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5yZWR1Y2UoKGRhdGE6IGFueVtdLCB0ZW1wbGF0ZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZURhdGEgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEodGVtcGxhdGVJZCk7XG4gICAgICAgICAgICB0ZW1wbGF0ZURhdGEgJiYgZGF0YS5wdXNoKHRlbXBsYXRlRGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfSwgW10pO1xuICAgICAgICBkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RW50eXRpZXNJZHMgKGVudGl0aWVzOiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlczogc3RyaW5nW10sIGVudGl0eSkgPT4ge1xuICAgICAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXMucHVzaChlbnRpdHkuaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RW50aXR5RGVwZW5kZW5jaWVzIChlbnRpdHk6IElFbnRpdHksIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlKSB7XG4gICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fTtcbiAgICAgICAgc3dpdGNoIChlbnRpdHlUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiZGV2aWNlc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiYXV0b0dyb3Vwc1wiXSkpO1xuICAgICAgICAgICAgICAgIGVudGl0eVtcIndvcmtUaW1lXCJdLmlkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya1RpbWVzID0gW2VudGl0eVtcIndvcmtUaW1lXCJdLmlkXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidXNlcnNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJjb21wYW55R3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJkcml2ZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJwcml2YXRlVXNlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInJlcG9ydEdyb3Vwc1wiXSkpO1xuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5zZWN1cml0eUdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wic2VjdXJpdHlHcm91cHNcIl0pO1xuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jdXN0b21NYXBzID0gW2VudGl0eVtcImRlZmF1bHRNYXBFbmdpbmVcIl1dO1xuICAgICAgICAgICAgICAgIGlmIChlbnRpdHkuaXNzdWVyQ2VydGlmaWNhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmNlcnRpZmljYXRlcyA9IFsgZW50aXR5Lmlzc3VlckNlcnRpZmljYXRlLmlkIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiem9uZXNcIjpcbiAgICAgICAgICAgICAgICBsZXQgem9uZVR5cGVzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJ6b25lVHlwZXNcIl0pO1xuICAgICAgICAgICAgICAgIHpvbmVUeXBlcy5sZW5ndGggJiYgKGVudGl0eURlcGVuZGVuY2llcy56b25lVHlwZXMgPSB6b25lVHlwZXMpO1xuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwid29ya1RpbWVzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrSG9saWRheXMgPSBbZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWRdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVudGl0eURlcGVuZGVuY2llcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFwcGx5VG9FbnRpdGllcyA8VD4oZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzLCBpbml0aWFsVmFsdWUsIGZ1bmM6IChyZXN1bHQsIGVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUsIGVudGl0eUluZGV4OiBudW1iZXIsIGVudGl0eVR5cGVJbmRleDogbnVtYmVyLCBvdmVyYWxsSW5kZXg6IG51bWJlcikgPT4gVCkge1xuICAgICAgICBsZXQgb3ZlcmFsbEluZGV4ID0gMDtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVudGl0aWVzTGlzdCkucmVkdWNlKChyZXN1bHQ6IFQsIGVudGl0eVR5cGU6IHN0cmluZywgdHlwZUluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc0xpc3RbZW50aXR5VHlwZV0ucmVkdWNlKChyZXM6IFQsIGVudGl0eSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBvdmVyYWxsSW5kZXgrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYyhyZXMsIGVudGl0eSwgZW50aXR5VHlwZSBhcyBURW50aXR5VHlwZSwgaW5kZXgsIHR5cGVJbmRleCwgb3ZlcmFsbEluZGV4IC0gMSk7XG4gICAgICAgICAgICB9LCByZXN1bHQpO1xuICAgICAgICB9LCBpbml0aWFsVmFsdWUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVzb2x2ZURlcGVuZGVuY2llcyAoZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xuICAgICAgICBsZXQgZ2V0RGF0YSA9IChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMpOiBQcm9taXNlPElJbXBvcnREYXRhPiA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGVudGl0eVJlcXVlc3RUeXBlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZXM6IFwiRGV2aWNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogXCJVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFwiWm9uZVR5cGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVzOiBcIlpvbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtUaW1lczogXCJXb3JrVGltZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBcIldvcmtIb2xpZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogXCJHcm91cFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFwiRGlhZ25vc3RpY1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VydGlmaWNhdGVzOiBcIkNlcnRpZmljYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0aWVzTGlzdCwge30sIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZW50aXR5SWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiIHx8IGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goW1wiR2V0XCIsIHJlcXVlc3RdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyAmJiBlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnNlY3VyaXR5R3JvdXBzID0gW1tcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLnNlY3VyaXR5R3JvdXBzLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyAmJiBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy53b3JrSG9saWRheXMgPSBbW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMud29ya0hvbGlkYXlzXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGROZXdHcm91cHMoZW50aXRpZXNMaXN0Lmdyb3VwcyB8fCBbXSwgZGF0YSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhlbnRpdGllc0xpc3QuY3VzdG9tTWFwcyB8fCBbXSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzKGVudGl0aWVzTGlzdC5ub3RpZmljYXRpb25UZW1wbGF0ZXMgfHwgW10sIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0Lmdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5jdXN0b21NYXBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0RW50aXRpZXMgPSBPYmplY3Qua2V5cyhyZXF1ZXN0cyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNBcnJheSA9IHJlcXVlc3RFbnRpdGllcy5yZWR1Y2UoKGxpc3QsIHR5cGUpID0+IGxpc3QuY29uY2F0KHJlcXVlc3RzW3R5cGVdKSwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0RW50aXRpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHNBcnJheSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdHcm91cHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGE6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKHJlcXVlc3RzLCB7fSwgKHJlc3VsdCwgcmVxdWVzdCwgZW50aXR5VHlwZSwgZW50aXR5SW5kZXgsIGVudGl0eVR5cGVJbmRleCwgb3ZlcmFsbEluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVxdWVzdHNBcnJheS5sZW5ndGggPiAxID8gcmVzcG9uc2Vbb3ZlcmFsbEluZGV4XSA6IHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1bMF0gfHwgaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiAmJiAoIWl0ZW0uaG9saWRheUdyb3VwIHx8IChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzIHx8IFtdKS5pbmRleE9mKGl0ZW0uaG9saWRheUdyb3VwLmdyb3VwSWQpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrVGltZXNcIiAmJiAhaXRlbS5kZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgfHwgW10pLmluZGV4T2YoaXRlbS5pZCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IHJlc3VsdFtlbnRpdHlUeXBlXS5jb25jYXQodGhpcy5ncm91cHNCdWlsZGVyLmdldEN1c3RvbUdyb3Vwc0RhdGEoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzIHx8IFtdLCBpdGVtcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llcyA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGl0ZW0sIGVudGl0eVR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdHlEZXBlbmRlbmNpZXMsIG5ld0RlcGVuZGVuY2llcywgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlKHJlc3VsdFtlbnRpdHlUeXBlXSwgW2VudGl0eUlkXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3R3JvdXBzID0gbmV3R3JvdXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IG5ld0N1c3RvbU1hcHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSBPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLnJlZHVjZSgocmVzdWx0LCBkZXBlbmRlbmN5TmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0aWVzID0gbmV3RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZCA9IChleHBvcnRlZERhdGFbZGVwZW5kZW5jeU5hbWVdIHx8IFtdKS5tYXAoZW50aXR5ID0+IGVudGl0eS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5mb3JFYWNoKGVudGl0eUlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWQuaW5kZXhPZihlbnRpdHlJZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZGVwZW5kZW5jeU5hbWVdICYmIChyZXN1bHRbZGVwZW5kZW5jeU5hbWVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZGVwZW5kZW5jeU5hbWVdLnB1c2goZW50aXR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge30gYXMgSUltcG9ydERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYnVpbHQtaW4gc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyAmJiAoZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzID0gZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzLnJlZHVjZSgocmVzdWx0LCBncm91cCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuaWQuaW5kZXhPZihcIkdyb3VwXCIpID09PSAtMSAmJiByZXN1bHQucHVzaChncm91cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0dyb3VwcyhuZXdHcm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKG5ld0N1c3RvbU1hcHMsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXhwb3J0ZWREYXRhKS5mb3JFYWNoKChlbnRpdHlUeXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhW2VudGl0eVR5cGVdLCBleHBvcnRlZERhdGFbZW50aXR5VHlwZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhuZXdEZXBlbmRlbmNpZXMsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZGVwZW5kZW5jaWVzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZUV4cG9ydEJ1dHRvbiAoaXNEaXNhYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b2dnbGVXYWl0aW5nID0gKGlzU3RhcnQgPSBmYWxzZSkgPT4ge1xuICAgICAgICBpZiAoaXNTdGFydCkge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RhcnQoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkaW5Db250YWluZXJcIikgYXMgSFRNTEVsZW1lbnQpLnBhcmVudEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIDk5OTkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24oZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vQnJldHQgLSBkaXNwbGF5cyB0aGUgb3V0cHV0IG9uIHRoZSBwYWdlXG4gICAgcHJpdmF0ZSBzaG93RW50aXR5TWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBxdHk6IG51bWJlciwgZW50aXR5TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKHF0eSkge1xuICAgICAgICAgICAgcXR5ID4gMSAmJiAoZW50aXR5TmFtZSArPSBcInNcIik7XG4gICAgICAgICAgICBsZXQgaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZVwiKSBhcyBIVE1MRWxlbWVudCkuaW5uZXJIVE1MO1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie3F1YW50aXR5fVwiLCBxdHkudG9TdHJpbmcoKSkucmVwbGFjZShcIntlbnRpdHl9XCIsIGVudGl0eU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBgWW91IGhhdmUgPHNwYW4gY2xhc3M9XCJib2xkXCI+bm90IGNvbmZpZ3VyZWQgYW55ICR7IGVudGl0eU5hbWUgfXM8L3NwYW4+LmA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dTeXN0ZW1TZXR0aW5nc01lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgaXNJbmNsdWRlZDogYm9vbGVhbikge1xuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChpc0luY2x1ZGVkKSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz50byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz5ub3QgdG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9pbml0aWFsaXplIGFkZGluXG4gICAgY29uc3RydWN0b3IgKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyID0gbmV3IEdyb3Vwc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyID0gbmV3IFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlciA9IG5ldyBSdWxlc0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgPSBuZXcgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcbiAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyID0gbmV3IFVzZXJCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuem9uZUJ1aWxkZXIgPSBuZXcgWm9uZUJ1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIgPSBuZXcgQWRkSW5CdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMud2FpdGluZyA9IG5ldyBXYWl0aW5nKCk7XG4gICAgfVxuXG4gICAgLy9CcmV0dDogZXhwb3J0cyB0aGUgZGF0YVxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGF0YSgpLnRoZW4oKHJlcG9ydHNEYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgICAgIGRvd25sb2FkRGF0YUFzRmlsZShKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpLCBcImV4cG9ydC5qc29uXCIpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBleHBvcnQgZGF0YS5cXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xuICAgIH1cblxuICAgIHNhdmVDaGFuZ2VzID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIGNoZWNrQm94VmFsdWVDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcbiAgICB9XG5cbiAgICBhZGRFdmVudEhhbmRsZXJzKCkge1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZW5kZXIgKCkge1xuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgIC8vIHRoaXMuZGF0YS51c2VycyA9IFtdO1xuICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZGlucyA9IFtdO1xuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxuICAgICAgICBsZXQgbWFwTWVzc2FnZVRlbXBsYXRlOiBzdHJpbmcgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBNZXNzYWdlVGVtcGxhdGVcIikgYXMgSFRNTEVsZW1lbnQpLmlubmVySFRNTCxcbiAgICAgICAgICAgIGdyb3Vwc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRHcm91cHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBzZWN1cml0eUNsZWFyYW5jZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkU2VjdXJpdHlDbGVhcmFuY2VzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICByZXBvcnRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJlcG9ydHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBkYXNoYm9hcmRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZERhc2hib2FyZHNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2V4cG9ydGVkTWFwIC5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIC8vIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxuICAgICAgICAgICAgem9uZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkWm9uZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBzeXN0ZW1TZXR0aW5nc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0U3lzdGVtU2V0dGluZ3NcIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcbiAgICAgICAgICAgIC8vbG9hZHMgdGhlIGdyb3Vwcy4gVGhpcyBpcyB3aGVyZSB1c2VycyBhcmUgYWRkZWQgaWYgdGhleSBhcmUgbGlua2VkIHRvIGEgZ3JvdXBcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgc2VjdXJpdHkgZ3JvdXBzIChzZWN1cml0eSBjbGVhcmFuY2UgaW4gdXNlciBhZG1pbiBpbiBNeUcpXG4gICAgICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vcmVwb3J0IGxvYWRlci4uLnNlZW1zIG9ic29sZXRlIHRvIG1lXG4gICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vbWlzYyA9IHN5c3RlbSBzZXR0aW5nc1xuICAgICAgICAgICAgdGhpcy5taXNjQnVpbGRlci5mZXRjaCh0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guY2hlY2tlZCksXG4gICAgICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnpvbmVCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLmFkZEluQnVpbGRlci5mZXRjaCgpXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGxldCByZXBvcnRzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZWN1cml0eUdyb3VwcyA9IHJlc3VsdHNbMV07XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyh0aGlzLmRhdGEucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcCA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGVudGl0eSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMocmVzLCBlbnRpdHlEZXApO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgem9uZURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbNl0pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgem9uZXMgdG8gYWxsIGRhdGFiYXNlIHpvbmVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS56b25lcyA9IHJlc3VsdHNbNl07XG4gICAgICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s2XSwgXCJ6b25lc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbN10pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgYWRkaW5zIGVxdWFsIHRvIG5vbmUvZW1wdHkgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFkZGlucyA9IHJlc3VsdHNbN107XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuZGF0YS5taXNjKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IHRoaXMuZGF0YS5hZGRpbnM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICBjdXN0b21NYXAgJiYgdGhpcy5kYXRhLmN1c3RvbU1hcHMucHVzaChjdXN0b21NYXApO1xuICAgICAgICAgICAgcmVwb3J0c0RlcGVuZGVuY2llcyA9IHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5yZXBvcnRzKTtcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XG4gICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHpvbmVEZXBlbmRlbmNpZXMsIHJlcG9ydHNEZXBlbmRlbmNpZXMsIHJ1bGVzRGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWFwUHJvdmlkZXIgPSB0aGlzLmRhdGEubWlzYyAmJiB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyTmFtZSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrLCB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMubGVuZ3RoLCBcInNlY3VyaXR5IGNsZWFyYW5jZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocnVsZXNCbG9jaywgdGhpcy5kYXRhLnJ1bGVzLmxlbmd0aCwgXCJydWxlXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGRhc2hib2FyZHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXNoYm9hcmRzUXR5KCksIFwiZGFzaGJvYXJkXCIpO1xuICAgICAgICAgICAgaWYgKG1hcFByb3ZpZGVyKSB7XG4gICAgICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgdGhpcy5kYXRhLmFkZGlucz8ubGVuZ3RoIHx8IDAsIFwiYWRkaW5cIik7XG4gICAgICAgICAgICAvLyB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHVzZXJzQmxvY2ssIHRoaXMuZGF0YS51c2Vycy5sZW5ndGgsIFwidXNlclwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoem9uZXNCbG9jaywgdGhpcy5kYXRhLnpvbmVzLmxlbmd0aCwgXCJ6b25lXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlKHN5c3RlbVNldHRpbmdzQmxvY2ssIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKTtcbiAgICAgICAgICAgIC8vdGhpcyBkaXNwbGF5cyBhbGwgdGhlIGRhdGEvb2JqZWN0cyBpbiB0aGUgY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGdldCBjb25maWcgdG8gZXhwb3J0XCIpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCkge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5hZGRJbkJ1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgIH1cbn1cblxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYWRkaW46IEFkZGluO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICBhZGRpbiA9IG5ldyBBZGRpbihhcGkpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9jdXM6ICgpID0+IHtcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xuICAgICAgICAgICAgYWRkaW4uYWRkRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB9LFxuICAgICAgICBibHVyOiAoKSA9PiB7XG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcbiAgICAgICAgfVxuICAgIH07XG59OyIsImltcG9ydCB7ZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZX0gZnJvbSBcIi4vdXRpbHNcIjtcblxuLy9BIGRpc3RyaWJ1dGlvbiBsaXN0IGxpbmtzIGEgc2V0IG9mIFJ1bGUocykgdG8gYSBzZXQgb2YgUmVjaXBpZW50KHMpLiBXaGVuIGEgUnVsZSBpcyB2aW9sYXRlZCBlYWNoIHJlbGF0ZWQgUmVjaXBpZW50IHdpbGwgcmVjZWl2ZSBhIG5vdGlmaWNhdGlvbiBvZiB0aGUga2luZCBkZWZpbmVkIGJ5IGl0cyBSZWNpcGllbnRUeXBlLlxuaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0IGV4dGVuZHMgSU5hbWVkRW50aXR5IHtcbiAgICByZWNpcGllbnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgIHJ1bGVzOiBhbnlbXTtcbiAgICB1c2VyczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xuICAgIHByaXZhdGUgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0czogUmVjb3JkPHN0cmluZywgSURpc3RyaWJ1dGlvbkxpc3Q+O1xuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbiAgICBwcml2YXRlIGdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkRpc3RyaWJ1dGlvbkxpc3RcIixcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25XZWJSZXF1ZXN0VGVtcGxhdGVzXCIsIHt9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25FbWFpbFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAoZGlzdHJpYnV0aW9uTGlzdHMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChyZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcbiAgICAgICAgICAgICAgICB1c2VySWQgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLmluZGV4T2YodXNlcklkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLnB1c2godXNlcklkKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlY2lwaWVudC5yZWNpcGllbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nUG9wdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1VyZ2VudFBvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0TWVzc2FnZVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoQWxsb3dEZWxheVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlICYmIHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFzc2lnblRvR3JvdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImdyb3Vwc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY2lwaWVudHMucmVkdWNlKChkZXBlbmRlbmNpZXMsIHJlY2lwaWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHJlY2lwaWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMucnVsZXMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMucnVsZXMsIGRpc3RyaWJ1dGlvbkxpc3QucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tSZWNpcGllbnRzKGRpc3RyaWJ1dGlvbkxpc3QucmVjaXBpZW50cywgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcbiAgICAgICAgICAgIC50aGVuKChbZGlzdHJpYnV0aW9uTGlzdHMsIHdlYlRlbXBsYXRlcywgZW1haWxUZW1wbGF0ZXMsIHRleHRUZW1wbGF0ZXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0cyA9IGVudGl0eVRvRGljdGlvbmFyeShkaXN0cmlidXRpb25MaXN0cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaXN0cmlidXRpb25MaXN0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSAodGVtcGxhdGVJZDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzW3RlbXBsYXRlSWRdO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyAocnVsZXNJZHM6IHN0cmluZ1tdKTogSURpc3RyaWJ1dGlvbkxpc3RbXSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlczogSURpc3RyaWJ1dGlvbkxpc3RbXSwgaWQpID0+IHtcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c1tpZF07XG4gICAgICAgICAgICBsaXN0LnJ1bGVzLnNvbWUobGlzdFJ1bGUgPT4gcnVsZXNJZHMuaW5kZXhPZihsaXN0UnVsZS5pZCkgPiAtMSkgJiYgcmVzLnB1c2gobGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5LCBleHRlbmQsIElFbnRpdHkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgQ29sb3Ige1xuICAgIHI6IG51bWJlcjtcbiAgICBnOiBudW1iZXI7XG4gICAgYjogbnVtYmVyO1xuICAgIGE6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR3JvdXAgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29sb3I/OiBDb2xvcjtcbiAgICBwYXJlbnQ/OiBJR3JvdXA7XG4gICAgY2hpbGRyZW4/OiBJR3JvdXBbXTtcbiAgICB1c2VyPzogYW55O1xufVxuXG5pbnRlcmZhY2UgSU5ld0dyb3VwIGV4dGVuZHMgT21pdDxJR3JvdXAsIFwiaWRcIj4ge1xuICAgIGlkOiBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcbiAgICBwcm90ZWN0ZWQgYXBpO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VGFzaztcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcbiAgICBwcm90ZWN0ZWQgdHJlZTogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUcmVlO1xuXG4gICAgcHJpdmF0ZSB1c2VyczogYW55O1xuICAgIHByaXZhdGUgY3VycmVudFVzZXJOYW1lOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL2dldHMgdGhlIGdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdXNlclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXG4gICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBmaW5kQ2hpbGQgKGNoaWxkSWQ6IHN0cmluZywgY3VycmVudEl0ZW06IElOZXdHcm91cCB8IElHcm91cCwgb25BbGxMZXZlbHM6IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cCB8IG51bGwge1xuICAgICAgICBsZXQgZm91bmRDaGlsZDogSUdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGN1cnJlbnRJdGVtLmNoaWxkcmVuO1xuICAgICAgICBpZiAoIWNoaWxkSWQgfHwgIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG4gICAgICAgICAgICBpZiAoY2hpbGQuaWQgPT09IGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbkFsbExldmVscykge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQgKGdyb3VwSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcbiAgICAgICAgICAgIHVzZXJIYXNQcml2YXRlR3JvdXAgPSAodXNlciwgZ3JvdXBJZCk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyLnByaXZhdGVVc2VyR3JvdXBzLnNvbWUoZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB0aGlzLnVzZXJzLnNvbWUodXNlciA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xuICAgICAgICAgICAgICAgIG91dHB1dFVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG91dHB1dFVzZXI7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0UHJpdmF0ZUdyb3VwRGF0YSAoZ3JvdXBJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVzZXI6IHRoaXMuZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQoZ3JvdXBJZCksXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBuYW1lOiBcIlByaXZhdGVVc2VyR3JvdXBOYW1lXCIsXG4gICAgICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW3sgaWQ6IGdyb3VwSWQgfV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XG4gICAgICAgIGxldCBub2RlTG9va3VwLFxuICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHN0cmluZztcblxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNoaWxkcmVuW2ldLmlkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldID0gbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXS5wYXJlbnQgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG5vZGVMb29rdXAgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZ3JvdXBzLCBlbnRpdHkgPT4ge1xuICAgICAgICAgICAgbGV0IG5ld0VudGl0eSA9IGV4dGVuZCh7fSwgZW50aXR5KTtcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBuZXdFbnRpdHkuY2hpbGRyZW4gPSBuZXdFbnRpdHkuY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIG5vZGVMb29rdXBba2V5XSAmJiB0cmF2ZXJzZUNoaWxkcmVuKG5vZGVMb29rdXBba2V5XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgIHJldHVybiBub2RlTG9va3VwW2tleV07XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH07XG5cbiAgICAvL2ZpbGxzIHRoZSBncm91cCBidWlsZGVyIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0R3JvdXBzKClcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJzID0gdXNlcnM7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IGV4dGVuZCh7fSwgdGhpcy50cmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH07XG5cbiAgICBwdWJsaWMgY3JlYXRlRmxhdEdyb3Vwc0xpc3QgKGdyb3VwczogSUdyb3VwW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgZm91bmRJZHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICBncm91cHNUb0FkZDogSUdyb3VwW10gPSBbXSxcbiAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyA9IChpdGVtOiBJR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaXRlbUNvcHkgPSBleHRlbmQoe30sIGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LmNoaWxkcmVuID0gaXRlbUNvcHkuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChpdGVtQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uY2hpbGRyZW4gJiYgaXRlbS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weSA9IGV4dGVuZCh7fSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LmNoaWxkcmVuID0gY2hpbGRDb3B5LmNoaWxkcmVuLm1hcChjaGlsZElubmVyID0+IGNoaWxkSW5uZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goY2hpbGRDb3B5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xuICAgICAgICAhbm90SW5jbHVkZUNoaWxkcmVuICYmIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0Q2hpbGRyZW4pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzVG9BZGQ7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRHcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XG4gICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiB0aGlzLnRyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGdyb3Vwc1RyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoYWxsR3JvdXBzKSxcbiAgICAgICAgICAgIHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IGdyb3Vwc1RyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIHRydWUpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3VwczogSUdyb3VwW10pIHtcbiAgICAgICAgcmV0dXJuIGdyb3Vwcy5yZWR1Y2UoKHVzZXJzOiBJRW50aXR5W10sIGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBncm91cC51c2VyICYmIGdyb3VwLnVzZXIubmFtZSAhPT0gdGhpcy5jdXJyZW50VXNlck5hbWUgJiYgdXNlcnMucHVzaChncm91cC51c2VyKTtcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCJpbXBvcnQgeyBlbnRpdHlUb0RpY3Rpb25hcnkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcblxuZXhwb3J0IGludGVyZmFjZSBJTWlzY0RhdGEge1xuICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgICAgIHR5cGU6IFRNYXBQcm92aWRlclR5cGU7XG4gICAgfTtcbiAgICBjdXJyZW50VXNlcjogYW55O1xuICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiBib29sZWFuO1xuICAgIGFkZGluczogc3RyaW5nW107XG4gICAgcHVyZ2VTZXR0aW5ncz86IGFueTtcbiAgICBlbWFpbFNlbmRlckZyb20/OiBzdHJpbmc7XG4gICAgY3VzdG9tZXJDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgICBpc01hcmtldHBsYWNlUHVyY2hhc2VzQWxsb3dlZD86IGJvb2xlYW47XG4gICAgaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQ/OiBib29sZWFuO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBNaXNjQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXN0b21NYXBQcm92aWRlcnM7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyO1xuICAgIHByaXZhdGUgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0TWFwUHJvdmlkZXJzID0ge1xuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXG4gICAgICAgIE1hcEJveDogXCJNYXBCb3hcIlxuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgTWlzYyBidWlsZGVyIChzeXN0ZW0gc2V0dGluZ3MpIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgZmV0Y2ggKGluY2x1ZGVTeXNTZXR0aW5nczogYm9vbGVhbik6IFByb21pc2U8SU1pc2NEYXRhPiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlN5c3RlbVNldHRpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXG4gICAgICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3MgPSByZXN1bHRbMV1bMF0gfHwgcmVzdWx0WzFdLFxuICAgICAgICAgICAgICAgIHVzZXJNYXBQcm92aWRlcklkID0gY3VycmVudFVzZXIuZGVmYXVsdE1hcEVuZ2luZSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVySWQgPSB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZSh1c2VyTWFwUHJvdmlkZXJJZCkgPT09IFwiY3VzdG9tXCIgPyB1c2VyTWFwUHJvdmlkZXJJZCA6IGRlZmF1bHRNYXBQcm92aWRlcklkO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgdGhpcy5jdXN0b21NYXBQcm92aWRlcnMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3lzdGVtU2V0dGluZ3MuY3VzdG9tV2ViTWFwUHJvdmlkZXJMaXN0KTtcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XG4gICAgICAgICAgICBsZXQgb3V0cHV0OiBJTWlzY0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hcFByb3ZpZGVySWQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhZGRpbnM6IFtdLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyOiB0aGlzLmN1cnJlbnRVc2VyLFxuICAgICAgICAgICAgICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGluY2x1ZGVTeXNTZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXJnZVNldHRpbmdzID0gc3lzdGVtU2V0dGluZ3MucHVyZ2VTZXR0aW5ncztcbiAgICAgICAgICAgICAgICBvdXRwdXQuZW1haWxTZW5kZXJGcm9tID0gc3lzdGVtU2V0dGluZ3MuZW1haWxTZW5kZXJGcm9tO1xuICAgICAgICAgICAgICAgIG91dHB1dC5jdXN0b21lckNsYXNzaWZpY2F0aW9uID0gc3lzdGVtU2V0dGluZ3MuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbjtcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd01hcmtldHBsYWNlUHVyY2hhc2VzO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc1Jlc2VsbGVyQXV0b0xvZ2luQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93UmVzZWxsZXJBdXRvTG9naW47XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJUeXBlIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBUTWFwUHJvdmlkZXJUeXBlIHtcbiAgICAgICAgcmV0dXJuICFtYXBQcm92aWRlcklkIHx8IHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSA/IFwiZGVmYXVsdFwiIDogXCJjdXN0b21cIjtcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlck5hbWUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmICh0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gfHwgKHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdLm5hbWUpIHx8IG1hcFByb3ZpZGVySWQpO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyRGF0YSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IElHcm91cCB9IGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcbmltcG9ydCB7IGdldEZpbHRlclN0YXRlVW5pcXVlR3JvdXBzLCBJU2NvcGVHcm91cEZpbHRlciB9IGZyb20gXCIuL3Njb3BlR3JvdXBGaWx0ZXJcIjtcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XG5cbmNvbnN0IFJFUE9SVF9UWVBFX0RBU0hCT0FEID0gXCJEYXNoYm9hcmRcIjtcblxuaW50ZXJmYWNlIElTZXJ2ZXJSZXBvcnQgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwczogSUdyb3VwW107XG4gICAgaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzOiBJR3JvdXBbXTtcbiAgICBpbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzOiBJR3JvdXBbXTtcbiAgICBpbmRpdmlkdWFsUmVjaXBpZW50czogSUlkRW50aXR5W107XG4gICAgc2NvcGVHcm91cHM6IElHcm91cFtdO1xuICAgIHNjb3BlR3JvdXBGaWx0ZXI/OiBJSWRFbnRpdHk7XG4gICAgZGVzdGluYXRpb24/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZTtcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xuICAgIGFyZ3VtZW50czoge1xuICAgICAgICBydWxlcz86IGFueVtdO1xuICAgICAgICBkZXZpY2VzPzogYW55W107XG4gICAgICAgIHpvbmVUeXBlTGlzdD86IGFueVtdO1xuICAgICAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbiAgICB9O1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG5pbnRlcmZhY2UgSVJlcG9ydCBleHRlbmRzIElTZXJ2ZXJSZXBvcnQge1xuICAgIHNjb3BlR3JvdXBGaWx0ZXI/OiBJU2NvcGVHcm91cEZpbHRlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcbiAgICBkZXZpY2VzOiBzdHJpbmdbXTtcbiAgICBydWxlczogc3RyaW5nW107XG4gICAgem9uZVR5cGVzOiBzdHJpbmdbXTtcbiAgICBncm91cHM6IHN0cmluZ1tdO1xuICAgIHVzZXJzOiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIElSZXBvcnRUZW1wbGF0ZSBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGlzU3lzdGVtOiBib29sZWFuO1xuICAgIHJlcG9ydERhdGFTb3VyY2U6IHN0cmluZztcbiAgICByZXBvcnRUZW1wbGF0ZVR5cGU6IHN0cmluZztcbiAgICByZXBvcnRzOiBJUmVwb3J0W107XG4gICAgYmluYXJ5RGF0YT86IHN0cmluZztcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb3J0c0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBhbGxSZXBvcnRzOiBJUmVwb3J0W107XG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICBwcml2YXRlIGRhc2hib2FyZHNMZW5ndGg6IG51bWJlcjtcbiAgICBwcml2YXRlIGFsbFRlbXBsYXRlczogSVJlcG9ydFRlbXBsYXRlW107XG5cbiAgICBwcml2YXRlIGdldFJlcG9ydHMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFJlcG9ydFNjaGVkdWxlc1wiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiaW5jbHVkZVRlbXBsYXRlRGV0YWlsc1wiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcImFwcGx5VXNlckZpbHRlclwiOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldERhc2hib2FyZEl0ZW1zXCIsIHt9XVxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwb3B1bGF0ZVNjb3BlR3JvdXBGaWx0ZXJzIChyZXBvcnRzOiBJU2VydmVyUmVwb3J0W10pOiBQcm9taXNlPElSZXBvcnRbXT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0cyA9IHJlcG9ydHMucmVkdWNlKChyZXMsIHJlcG9ydCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyICYmIHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyLmlkKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkdyb3VwRmlsdGVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiByZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSBhcyBhbnlbXSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlcXVlc3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVwb3J0cyBhcyBJUmVwb3J0W10pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0cywgKGdyb3VwRmlsdGVyczogSVNjb3BlR3JvdXBGaWx0ZXJbXVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5wYWNrZWRGaWx0ZXIgPSBncm91cEZpbHRlcnMubWFwKGl0ZW0gPT4gQXJyYXkuaXNBcnJheShpdGVtKSA/IGl0ZW1bMF0gOiBpdGVtKVxuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlR3JvdXBGaWx0ZXJIYXNoID0gVXRpbHMuZW50aXR5VG9EaWN0aW9uYXJ5KGVucGFja2VkRmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcG9ydHMubWFwKHJlcG9ydCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5yZXBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZUdyb3VwRmlsdGVyOiByZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiBzY29wZUdyb3VwRmlsdGVySGFzaFtyZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZF1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0cnVjdHVyZVJlcG9ydHMgKHJlcG9ydHMsIHRlbXBsYXRlcykge1xuICAgICAgICBsZXQgZmluZFRlbXBsYXRlUmVwb3J0cyA9ICh0ZW1wbGF0ZUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydHMuZmlsdGVyKHJlcG9ydCA9PiByZXBvcnQudGVtcGxhdGUuaWQgPT09IHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlcy5yZWR1Y2UoKHJlcywgdGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gdGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVSZXBvcnRzID0gZmluZFRlbXBsYXRlUmVwb3J0cyh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlcG9ydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucmVwb3J0cyA9IHRlbXBsYXRlUmVwb3J0cztcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVUZW1wbGF0ZSAobmV3VGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUpIHtcbiAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMuc29tZSgodGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEuaWQgPT09IG5ld1RlbXBsYXRlRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzW2luZGV4XSA9IG5ld1RlbXBsYXRlRGF0YTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJlcG9ydHMoKVxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCAuLi5yZXN0XSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbdGhpcy5wb3B1bGF0ZVNjb3BlR3JvdXBGaWx0ZXJzKHJlcG9ydHMpLCAuLi5yZXN0XSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoW3JlcG9ydHMsIHRlbXBsYXRlcywgZGFzaGJvYXJkSXRlbXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcbiAgICAgICAgICAgICAgICB0aGlzLmRhc2hib2FyZHNMZW5ndGggPSBkYXNoYm9hcmRJdGVtcyAmJiBkYXNoYm9hcmRJdGVtcy5sZW5ndGggPyBkYXNoYm9hcmRJdGVtcy5sZW5ndGggOiAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgYWxsRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMgPVxuICAgICAgICAgICAgICAgICAgICBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0Lmdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyICYmIGdldEZpbHRlclN0YXRlVW5pcXVlR3JvdXBzKHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyLmdyb3VwRmlsdGVyQ29uZGl0aW9uKSB8fCBbXSkpO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMudXNlcnMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy51c2VycywgcmVwb3J0LmluZGl2aWR1YWxSZWNpcGllbnRzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmRpdmlkdWFsUmVjaXBpZW50cykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLmRldmljZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xuICAgICAgICB9LCBhbGxEZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXRhICgpOiBQcm9taXNlPElSZXBvcnRUZW1wbGF0ZVtdPiB7XG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzOiBhbnlbXSwgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0c1twb3J0aW9uSW5kZXhdIHx8IHJlcXVlc3RzW3BvcnRpb25JbmRleF0ubGVuZ3RoID49IHBvcnRpb25TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdHM7XG4gICAgICAgICAgICB9LCBbXSksXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcbiAgICAgICAgICAgIGdldFBvcnRpb25EYXRhID0gcG9ydGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XG5cbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cyA9IHRvdGFsUmVzdWx0cy5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSwgVXRpbHMucmVzb2x2ZWRQcm9taXNlKFtdKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XG4gICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzLmZvckVhY2godGVtcGxhdGVEYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXNoYm9hcmRzTGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXN0b21pemVkUmVwb3J0c1F0eSAoKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgcmV0dXJuICh0aGlzLmFsbFJlcG9ydHMuZmlsdGVyKChyZXBvcnQ6IElSZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcbiAgICAgICAgICAgICAgICBpc0NvdW50OiBib29sZWFuID0gIXRlbXBsYXRlRXhpc3RzICYmIHJlcG9ydC5sYXN0TW9kaWZpZWRVc2VyICE9PSBcIk5vVXNlcklkXCI7XG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XG4gICAgICAgIH0pKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJhZGRpbi5kLnRzXCIvPlxuaW1wb3J0IHsgc29ydEFycmF5T2ZFbnRpdGllcywgZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmludGVyZmFjZSBJUnVsZSBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBjb25kaXRpb246IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUnVsZURlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHdvcmtUaW1lczogYW55W107XG4gICAgd29ya0hvbGlkYXlzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xuICAgIHNlY3VyaXR5R3JvdXBzOiBhbnlbXTtcbiAgICBkaWFnbm9zdGljczogYW55W107XG59XG5cbmNvbnN0IEFQUExJQ0FUSU9OX1JVTEVfSUQgPSBcIlJ1bGVBcHBsaWNhdGlvbkV4Y2VwdGlvbklkXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XG5cbiAgICBwcml2YXRlIGdldFJ1bGVEaWFnbm9zdGljc1N0cmluZyAocnVsZTogSVJ1bGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGVwZW5kZW5jaWVzKFtydWxlXSkuZGlhZ25vc3RpY3Muc29ydCgpLmpvaW4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPElSdWxlW10+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlJ1bGVcIixcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlVHlwZTogXCJSb3V0ZUJhc2VkTWF0ZXJpYWxNZ210XCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICBdLCAoW2FsbFJ1bGVzLCBtYXRlcmlhbE1hbmFnZW1lbnRSdWxlc106IFtJUnVsZVtdLCBJUnVsZVtdXSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRvIGdldCBjb3JyZWN0IFNlcnZpY2UgZ3JvdXBzIHdlIG5lZWQgdG8gdXBkYXRlIG1hdGVyaWFsIG1hbmFnZW1lbnQgc3RvY2sgcnVsZXMnIGdyb3VwcyBmcm9tIGdyb3VwcyBwcm9wZXJ0eSBvZiB0aGUgY29ycmVzcG9uZGluZyBydWxlIHdpdGggUm91dGVCYXNlZE1hdGVyaWFsTWdtdCBiYXNlVHlwZVxuICAgICAgICAgICAgICAgIC8vIFRoZSBvbmx5IHBvc3NpYmxlIG1ldGhvZCBub3cgdG8gbWF0Y2ggU3RvY2sgcnVsZSBhbmQgcnVsZSB3aXRoIFJvdXRlQmFzZWRNYXRlcmlhbE1nbXQgYmFzZVR5cGUgaXMgdG8gbWF0Y2ggdGhlaXIgZGlhZ25vc3RpY3NcbiAgICAgICAgICAgICAgICBjb25zdCBtbVJ1bGVzR3JvdXBzID0gbWF0ZXJpYWxNYW5hZ2VtZW50UnVsZXMucmVkdWNlKChyZXM6IFJlY29yZDxzdHJpbmcsIElJZEVudGl0eVtdPiwgbW1SdWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1tUnVsZURpYWdub3N0aWNzID0gdGhpcy5nZXRSdWxlRGlhZ25vc3RpY3NTdHJpbmcobW1SdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzW21tUnVsZURpYWdub3N0aWNzXSA9IG1tUnVsZS5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoYWxsUnVsZXMubWFwKHJ1bGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtbVJ1bGVEaWFnbm9zdGljcyA9IHRoaXMuZ2V0UnVsZURpYWdub3N0aWNzU3RyaW5nKHJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3JyZXNwb25kaW5nTU1SdWxlR3JvdXBzID0gbW1SdWxlc0dyb3Vwc1ttbVJ1bGVEaWFnbm9zdGljc107XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb3JyZXNwb25kaW5nTU1SdWxlR3JvdXBzID8geyAuLi5ydWxlLCBncm91cHM6IGNvcnJlc3BvbmRpbmdNTVJ1bGVHcm91cHMgfSA6IHJ1bGU7XG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0cnVjdHVyZVJ1bGVzIChydWxlcykge1xuICAgICAgICByZXR1cm4gc29ydEFycmF5T2ZFbnRpdGllcyhydWxlcywgW1tcImJhc2VUeXBlXCIsIFwiZGVzY1wiXSwgXCJuYW1lXCJdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocnVsZXM6IElSdWxlW10pOiBJUnVsZURlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lczogW10sXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxuICAgICAgICAgICAgICAgIHdvcmtIb2xpZGF5czogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogW10sXG4gICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChjb25kaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29uZGl0aW9uLmNvbmRpdGlvblR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJ1bGVXb3JrSG91cnNcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFmdGVyUnVsZVdvcmtIb3Vyc1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAoY29uZGl0aW9uLndvcmtUaW1lICYmIGNvbmRpdGlvbi53b3JrVGltZS5pZCkgfHwgY29uZGl0aW9uLndvcmtUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwid29ya1RpbWVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRyaXZlclwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZHJpdmVyICYmIGNvbmRpdGlvbi5kcml2ZXIuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ1c2Vyc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEZXZpY2VcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRldmljZSAmJiBjb25kaXRpb24uZGV2aWNlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGV2aWNlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbnRlcmluZ0FyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkV4aXRpbmdBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJPdXRzaWRlQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSW5zaWRlQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi56b25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZS5pZCB8fCBjb25kaXRpb24uem9uZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ6b25lc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lVHlwZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ6b25lVHlwZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRmlsdGVyU3RhdHVzRGF0YUJ5RGlhZ25vc3RpY1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWN0aXZlT3JJbmFjdGl2ZUZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5kaWFnbm9zdGljKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGlhZ25vc3RpYy5pZCB8fCBjb25kaXRpb24uZGlhZ25vc3RpYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkaWFnbm9zdGljc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGVja0NvbmRpdGlvbnMgPSAocGFyZW50Q29uZGl0aW9uLCBkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzKTogSVJ1bGVEZXBlbmRlbmNpZXMgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb25kaXRpb25zID0gcGFyZW50Q29uZGl0aW9uLmNoaWxkcmVuIHx8IFtdO1xuICAgICAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMocGFyZW50Q29uZGl0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgY29uZGl0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhjb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhjb25kaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcnVsZXMucmVkdWNlKChkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzLCBydWxlOiBJUnVsZSkgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLmdyb3VwcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ncm91cHMsIHJ1bGUuZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCkpO1xuICAgICAgICAgICAgaWYgKHJ1bGUuY29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKHJ1bGUuY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJ1bGVzKClcbiAgICAgICAgICAgIC50aGVuKChzd2l0Y2hlZE9uUnVsZXMpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkUnVsZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3dpdGNoZWRPblJ1bGVzKTtcbiAgICAgICAgICAgICAgICBkZWxldGUodGhpcy5jb21iaW5lZFJ1bGVzW0FQUExJQ0FUSU9OX1JVTEVfSURdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UnVsZXNEYXRhIChydWxlc0lkczogc3RyaW5nW10pOiBJUnVsZVtdIHtcbiAgICAgICAgcmV0dXJuIHJ1bGVzSWRzLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5cbmNvbnN0IGVudW0gUmVsYXRpb25PcGVyYXRvciB7XG4gICAgXCJBTkRcIiA9IFwiQW5kXCIsXG4gICAgXCJPUlwiID0gXCJPclwiXG59XG5cbmludGVyZmFjZSBJT3V0cHV0SWRFbnRpdHkge1xuICAgIGdyb3VwSWQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIElHcm91cExpc3RTdGF0ZU91dHB1dDxUIGV4dGVuZHMgSU91dHB1dElkRW50aXR5ID0gSU91dHB1dElkRW50aXR5PiB7XG4gICAgcmVsYXRpb246IFJlbGF0aW9uT3BlcmF0b3I7XG4gICAgZ3JvdXBGaWx0ZXJDb25kaXRpb25zOiAoVCB8IElHcm91cExpc3RTdGF0ZU91dHB1dDxUPilbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU2NvcGVHcm91cEZpbHRlciBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgZ3JvdXBGaWx0ZXJDb25kaXRpb246IElHcm91cExpc3RTdGF0ZU91dHB1dCB8IElPdXRwdXRJZEVudGl0eTtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGNvbW1lbnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBnZXRTY29wZUdyb3VwRmlsdGVyQnlJZCA9IChpZDogc3RyaW5nLCBhcGkpOiBQcm9taXNlPElTY29wZUdyb3VwRmlsdGVyPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBGaWx0ZXJcIixcbiAgICAgICAgICAgIHNlYXJjaDogeyBpZCB9XG4gICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCBpc0ZpbHRlclN0YXRlID0gPFQsIFU+KGl0ZW06IElHcm91cExpc3RTdGF0ZU91dHB1dCB8IElPdXRwdXRJZEVudGl0eSk6IGl0ZW0gaXMgSUdyb3VwTGlzdFN0YXRlT3V0cHV0ID0+IGl0ZW0gJiYgKGl0ZW0gYXMgSUdyb3VwTGlzdFN0YXRlT3V0cHV0KS5yZWxhdGlvbiAhPT0gdW5kZWZpbmVkO1xuXG5leHBvcnQgY29uc3QgZ2V0RmlsdGVyU3RhdGVVbmlxdWVHcm91cHMgPSAoc3RhdGU6IElHcm91cExpc3RTdGF0ZU91dHB1dCB8IElPdXRwdXRJZEVudGl0eSkgPT4ge1xuICAgIGxldCBncm91cElkczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBwcm9jZXNzSXRlbSA9IChpdGVtOklHcm91cExpc3RTdGF0ZU91dHB1dCwgcHJldlJlcyA9IFtdIGFzIElJZEVudGl0eVtdKTogSUlkRW50aXR5W10gPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5ncm91cEZpbHRlckNvbmRpdGlvbnMucmVkdWNlKChyZXMsIGNoaWxkSXRlbSkgPT4ge1xuICAgICAgICAgICAgaWYgKGlzRmlsdGVyU3RhdGUoY2hpbGRJdGVtKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSXRlbShjaGlsZEl0ZW0sIHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgaWQgPSBjaGlsZEl0ZW0uZ3JvdXBJZDtcbiAgICAgICAgICAgIGdyb3VwSWRzLmluZGV4T2YoaWQpID09PSAtMSAmJiByZXMucHVzaCh7IGlkIH0pO1xuICAgICAgICAgICAgZ3JvdXBJZHMucHVzaChpZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBwcmV2UmVzKTtcbiAgICB9O1xuICAgIHJldHVybiBpc0ZpbHRlclN0YXRlKHN0YXRlKSA/IHByb2Nlc3NJdGVtKHN0YXRlKSA6IFt7IGlkOiBzdGF0ZS5ncm91cElkIH1dO1xufTsiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgZXh0ZW5kcyBHcm91cHNCdWlsZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XG4gICAgICAgIHN1cGVyKGFwaSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTZWN1cml0eUdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0U2VjdXJpdHlHcm91cHMoKVxuICAgICAgICAgICAgLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoZ3JvdXBzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRoaXMudHJlZSkuZmlsdGVyKGdyb3VwID0+ICEhZ3JvdXAubmFtZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfTtcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmludGVyZmFjZSBJQ2xhc3NDb250cm9sIHtcbiAgICBnZXQ6ICgpID0+IHN0cmluZztcbiAgICBzZXQ6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUVudGl0eSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxudHlwZSBJU29ydFByb3BlcnR5ID0gc3RyaW5nIHwgW3N0cmluZywgXCJhc2NcIiB8IFwiZGVzY1wiXTtcblxubGV0IGNsYXNzTmFtZUN0cmwgPSBmdW5jdGlvbiAoZWw6IEVsZW1lbnQpOiBJQ2xhc3NDb250cm9sIHtcbiAgICAgICAgdmFyIHBhcmFtID0gdHlwZW9mIGVsLmNsYXNzTmFtZSA9PT0gXCJzdHJpbmdcIiA/IFwiY2xhc3NOYW1lXCIgOiBcImJhc2VWYWxcIjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbFtwYXJhbV0gfHwgXCJcIjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgZWxbcGFyYW1dID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGlzVXN1YWxPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKS5pbmRleE9mKFwiT2JqZWN0XCIpICE9PSAtMTtcbiAgICB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIElIYXNoIHtcbiAgICBbaWQ6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsOiBFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIWVsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpLFxuICAgICAgICBuZXdDbGFzc2VzID0gY2xhc3Nlcy5maWx0ZXIoY2xhc3NJdGVtID0+IGNsYXNzSXRlbSAhPT0gbmFtZSk7XG4gICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KG5ld0NsYXNzZXMuam9pbihcIiBcIikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpOiB2b2lkIHtcbiAgICBpZiAoIWVsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpO1xuICAgIGlmIChjbGFzc2VzLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XG4gICAgICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChjbGFzc2VzU3RyICsgXCIgXCIgKyBuYW1lKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzcyhlbDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZWwgJiYgY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCkuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCguLi5hcmdzOiBhbnlbXSkge1xuICAgIHZhciBsZW5ndGggPSBhcmdzLmxlbmd0aCxcbiAgICAgICAgc3JjLCBzcmNLZXlzLCBzcmNBdHRyLFxuICAgICAgICBmdWxsQ29weSA9IGZhbHNlLFxuICAgICAgICByZXNBdHRyLFxuICAgICAgICByZXMgPSBhcmdzWzBdLCBpID0gMSwgajtcblxuICAgIGlmICh0eXBlb2YgcmVzID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICBmdWxsQ29weSA9IHJlcztcbiAgICAgICAgcmVzID0gYXJnc1sxXTtcbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICB3aGlsZSAoaSAhPT0gbGVuZ3RoKSB7XG4gICAgICAgIHNyYyA9IGFyZ3NbaV07XG4gICAgICAgIHNyY0tleXMgPSBPYmplY3Qua2V5cyhzcmMpO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgc3JjS2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgc3JjQXR0ciA9IHNyY1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgIGlmIChmdWxsQ29weSAmJiAoaXNVc3VhbE9iamVjdChzcmNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHNyY0F0dHIpKSkge1xuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXSA9IChpc1VzdWFsT2JqZWN0KHJlc0F0dHIpIHx8IEFycmF5LmlzQXJyYXkocmVzQXR0cikpID8gcmVzQXR0ciA6IChBcnJheS5pc0FycmF5KHNyY0F0dHIpID8gW10gOiB7fSk7XG4gICAgICAgICAgICAgICAgZXh0ZW5kKGZ1bGxDb3B5LCByZXNBdHRyLCBzcmNBdHRyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzW3NyY0tleXNbal1dID0gc3JjW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudGl0eVRvRGljdGlvbmFyeShlbnRpdGllczogYW55W10sIGVudGl0eUNhbGxiYWNrPzogKGVudGl0eTogYW55KSA9PiBhbnkpOiBJSGFzaCB7XG4gICAgdmFyIGVudGl0eSwgbyA9IHt9LCBpLFxuICAgICAgICBsID0gZW50aXRpZXMubGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoZW50aXRpZXNbaV0pIHtcbiAgICAgICAgICAgIGVudGl0eSA9IGVudGl0aWVzW2ldLmlkID8gZW50aXRpZXNbaV0gOiB7aWQ6IGVudGl0aWVzW2ldfTtcbiAgICAgICAgICAgIG9bZW50aXR5LmlkXSA9IGVudGl0eUNhbGxiYWNrID8gZW50aXR5Q2FsbGJhY2soZW50aXR5KSA6IGVudGl0eTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRBcnJheU9mRW50aXRpZXMoZW50aXRpZXM6IGFueVtdLCBzb3J0aW5nRmllbGRzOiBJU29ydFByb3BlcnR5W10pOiBhbnlbXSB7XG4gICAgbGV0IGNvbXBhcmF0b3IgPSAocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzOiBhbnlbXSwgaW5kZXggPSAwKSA9PiB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA8PSBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzW2luZGV4XSxcbiAgICAgICAgICAgIFtwcm9wZXJ0eSwgZGlyID0gXCJhc2NcIl0gPSBBcnJheS5pc0FycmF5KG9wdGlvbnMpID8gb3B0aW9ucyA6IFtvcHRpb25zXSxcbiAgICAgICAgICAgIGRpck11bHRpcGxpZXI6IG51bWJlcjtcbiAgICAgICAgZGlyTXVsdGlwbGllciA9IGRpciA9PT0gXCJhc2NcIiA/IDEgOiAtMTtcbiAgICAgICAgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA+IG5leHRJdGVtW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgcmV0dXJuIDEgKiBkaXJNdWx0aXBsaWVyO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA8IG5leHRJdGVtW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xICogZGlyTXVsdGlwbGllcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllcywgaW5kZXggKyAxKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIGVudGl0aWVzLnNvcnQoKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlKSA9PiB7XG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlLCBzb3J0aW5nRmllbGRzKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvd25sb2FkRGF0YUFzRmlsZShkYXRhOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcsIG1pbWVUeXBlID0gXCJ0ZXh0L2pzb25cIikge1xuICAgIGxldCBibG9iID0gbmV3IEJsb2IoW2RhdGFdLCB7dHlwZTogbWltZVR5cGV9KSxcbiAgICAgICAgZWxlbTtcbiAgICBlbGVtID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGVsZW0uaHJlZiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGVsZW0uZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIGVsZW0uY2xpY2soKTtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGVsZW0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWVFbnRpdGllcyAoLi4uc291cmNlczogSUVudGl0eVtdW10pOiBJRW50aXR5W10ge1xuICAgIGxldCBhZGRlZElkczogc3RyaW5nW10gPSBbXSxcbiAgICAgICAgbWVyZ2VkSXRlbXM6IElFbnRpdHlbXSA9IFtdO1xuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4gc291cmNlLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0uaWQgJiYgYWRkZWRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGFkZGVkSWRzLnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgfSkpO1xuICAgIHJldHVybiBtZXJnZWRJdGVtcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVudGl0aWVzSWRzIChlbnRpdGllc0xpc3Q6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShlbnRpdGllc0xpc3QpICYmIGVudGl0aWVzTGlzdC5yZWR1Y2UoKHJlc3VsdDogc3RyaW5nW10sIGVudGl0eSkgPT4ge1xuICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlc3VsdC5wdXNoKGVudGl0eS5pZCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgW10pIHx8IFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWUgKC4uLnNvdXJjZXM6IHN0cmluZ1tdW10pOiBzdHJpbmdbXSB7XG4gICAgbGV0IG1lcmdlZEl0ZW1zOiBzdHJpbmdbXSA9IFtdO1xuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xuICAgICAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgJiYgc291cmNlLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBpdGVtICYmIG1lcmdlZEl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xICYmIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBtZXJnZWRJdGVtcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXF1ZUVudGl0aWVzIChuZXdFbnRpdGllczogSUVudGl0eVtdLCBleGlzdGVkRW50aXRpZXM6IElFbnRpdHlbXSk6IElFbnRpdHlbXSB7XG4gICAgbGV0IHNlbGVjdGVkRW50aXRpZXNIYXNoID0gZW50aXR5VG9EaWN0aW9uYXJ5KGV4aXN0ZWRFbnRpdGllcyk7XG4gICAgcmV0dXJuIG5ld0VudGl0aWVzLnJlZHVjZSgocmVzOiBJRW50aXR5W10sIGVudGl0eSkgPT4ge1xuICAgICAgICAhc2VsZWN0ZWRFbnRpdGllc0hhc2hbZW50aXR5LmlkXSAmJiByZXMucHVzaChlbnRpdHkpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sIFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2V0aGVyKHByb21pc2VzOiBQcm9taXNlPGFueT5bXSk6IFByb21pc2U8YW55PiB7XG4gICAgbGV0IHJlc3VsdHM6IGFueVtdID0gW10sXG4gICAgICAgIHJlc3VsdHNDb3VudCA9IDA7XG4gICAgcmVzdWx0cy5sZW5ndGggPSBwcm9taXNlcy5sZW5ndGg7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IHJlc29sdmVBbGwgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcHJvbWlzZXMubGVuZ3RoID8gcHJvbWlzZXMuZm9yRWFjaCgocHJvbWlzZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50Kys7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50ID09PSBwcm9taXNlcy5sZW5ndGggJiYgcmVzb2x2ZUFsbCgpO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlSW5kZXg6IGluZGV4XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkgOiByZXNvbHZlQWxsKCk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlZFByb21pc2U8VD4gKHZhbD86IFQpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VD4ocmVzb2x2ZSA9PiByZXNvbHZlKHZhbCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheSAoZGF0YSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXTtcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBXYWl0aW5nIHtcblxuICAgIHByaXZhdGUgd2FpdGluZ0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBib2R5RWw6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgIHB1YmxpYyBzdGFydChlbDogSFRNTEVsZW1lbnQgPSB0aGlzLmJvZHlFbCwgekluZGV4PzogbnVtYmVyKSB7XG4gICAgICAgIGlmIChlbC5vZmZzZXRQYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuY2xhc3NOYW1lID0gXCJ3YWl0aW5nXCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J2ZhZGVyJz48L2Rpdj48ZGl2IGNsYXNzPSdzcGlubmVyJz48L2Rpdj5cIjtcbiAgICAgICAgZWwucGFyZW50Tm9kZT8uYXBwZW5kQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGVsLm9mZnNldFdpZHRoICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUudG9wID0gZWwub2Zmc2V0VG9wICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUubGVmdCA9IGVsLm9mZnNldExlZnQgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB0eXBlb2YgekluZGV4ID09PSBcIm51bWJlclwiICYmICh0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuekluZGV4ID0gekluZGV4LnRvU3RyaW5nKCkpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgc3RvcCAoKSB7XG4gICAgICAgIGlmICh0aGlzLndhaXRpbmdDb250YWluZXIgJiYgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICB9O1xufSIsIi8vYWRkZWQgYnkgQnJldHQgdG8gbWFuYWdlIGFkZGluZyBhbGwgem9uZXMgdG8gdGhlIGV4cG9ydCBhcyBhbiBvcHRpb25cblxuZXhwb3J0IGNsYXNzIFpvbmVCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vZmlsbHMgdGhlIHVzZXIgYnVpbGRlciB3aXRoIGFsbCB1c2Vyc1xuICAgIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0Wm9uZXMoKVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFpvbmVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlpvbmVcIlxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSJdfQ==
