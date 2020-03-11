(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var groupsBuilder_1 = require("./groupsBuilder");
var securityClearancesBuilder_1 = require("./securityClearancesBuilder");
var reportsBuilder_1 = require("./reportsBuilder");
var rulesBuilder_1 = require("./rulesBuilder");
var distributionListsBuilder_1 = require("./distributionListsBuilder");
var miscBuilder_1 = require("./miscBuilder");
var utils_1 = require("./utils");
var waiting_1 = require("./waiting");
var userBuilder_1 = require("./userBuilder");
var zoneBuilder_1 = require("./zoneBuilder");
var Addin = /** @class */ (function () {
    //initialize addin 
    function Addin(api) {
        var _this = this;
        this.exportBtn = document.getElementById("exportButton");
        this.saveBtn = document.getElementById("saveButton");
        this.exportAllAddinsCheckbox = document.getElementById("export_all_addins_checkbox");
        this.exportAllUsersCheckbox = document.getElementById("export_all_users_checkbox");
        this.exportAllZonesCheckbox = document.getElementById("export_all_zones_checkbox");
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
            notificationTemplates: []
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
        //if the includeThisAddin checkbox is changed we enter here
        this.toggleThisAddinIncluded = function (e) {
            var isChecked = !!e.target && !!e.target.checked;
            var addinsBlock = document.getElementById("exportedAddins");
            var addinsData = _this.miscBuilder.getAddinsData(!isChecked);
            _this.showEntityMessage(addinsBlock, addinsData.length, "addin");
            _this.data.misc.addins = addinsData;
        };
        //Brett: exports the data
        this.exportData = function () {
            _this.toggleWaiting(true);
            return _this.reportsBuilder.getData().then(function (reportsData) {
                _this.data.reports = reportsData;
                console.log(_this.data);
                utils_1.downloadDataAsFile(JSON.stringify(_this.data), "export.json");
            })["catch"](function (e) {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            })["finally"](function () { return _this.toggleWaiting(); });
        };
        this.saveChanges = function () {
            _this.render();
            _this.exportBtn.disabled = false;
        };
        this.checkBoxValueChanged = function () {
            _this.exportBtn.disabled = true;
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1["default"](api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1["default"](api);
        this.reportsBuilder = new reportsBuilder_1["default"](api);
        this.rulesBuilder = new rulesBuilder_1["default"](api);
        this.distributionListsBuilder = new distributionListsBuilder_1["default"](api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        this.userBuilder = new userBuilder_1.UserBuilder(api);
        this.zoneBuilder = new zoneBuilder_1.ZoneBuilder(api);
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
            dependencies[dependencyName] = utils_1.mergeUnique.apply(void 0, [dependencies[dependencyName]].concat(allDependencies.map(function (entityDependencies) { return entityDependencies[dependencyName]; })));
            return dependencies;
        }, total);
    };
    Addin.prototype.addNewGroups = function (groups, data) {
        if (!groups || !groups.length) {
            return utils_1.resolvedPromise();
        }
        var groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = utils_1.getUniqueEntities(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = utils_1.mergeUniqueEntities(data.groups, groupsData);
        data.users = utils_1.mergeUniqueEntities(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: utils_1.getEntitiesIds(newGroupsUsers) }, data);
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
        data.customMaps = utils_1.mergeUniqueEntities(data.customMaps, customMapsData);
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
        data.notificationTemplates = utils_1.mergeUniqueEntities(data.notificationTemplates, notificationTemplatesData);
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
                diagnostics: "Diagnostic"
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
            return _this.addNewGroups(entitiesList.groups, data).then(function () {
                _this.addNewCustomMaps(entitiesList.customMaps, data);
                _this.addNewNotificationTemplates(entitiesList.notificationTemplates, data);
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
                                if (entityType === "workHolidays" && (!item.holidayGroup || entitiesList.workHolidays.indexOf(item.holidayGroup.groupId) === -1)) {
                                    return false;
                                }
                                else if (entityType === "securityGroups") {
                                    if (entitiesList.securityGroups.indexOf(item.id) > -1) {
                                        result[entityType] = result[entityType].concat(_this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups, items));
                                        return result;
                                    }
                                    return false;
                                }
                                else if (entityType === "users") {
                                    item.userAuthenticationType = "BasicAuthentication";
                                }
                                var entityDependencies = _this.getEntityDependencies(item, entityType);
                                newDependencies = _this.applyToEntities(entityDependencies, newDependencies, function (result, entityId, entityType) {
                                    !result[entityType] && (result[entityType] = []);
                                    result[entityType] = utils_1.mergeUnique(result[entityType], [entityId]);
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
                                data[entityType] = utils_1.mergeUniqueEntities(data[entityType], exportedData[entityType]);
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
    Addin.prototype.render = function () {
        var _this = this;
        this.data.users = [];
        this.data.zones = [];
        this.setAddinsToNull();
        //wire up the dom
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), 
        // exportAllAddinsCheckbox: HTMLInputElement = document.getElementById("export_all_addins_checkbox") as HTMLInputElement,
        // thisAddinBlock: HTMLElement = document.getElementById("includeThisAddin"),
        // thisAddinIncludedCheckbox: HTMLElement = document.querySelector("#includeThisAddin > input"),
        mapBlockDescription = document.querySelector("#exportedMap > .description"), usersBlock = document.getElementById("exportedUsers"), 
        // exportAllUsersCheckbox: HTMLInputElement = document.getElementById("export_all_users_checkbox") as HTMLInputElement,
        zonesBlock = document.getElementById("exportedZones");
        // exportAllZonesCheckbox: HTMLInputElement = document.getElementById("export_all_zones_checkbox") as HTMLInputElement;
        //wire up the export button event
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllUsersCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        //wire up the includeThisAddin checkbox event
        // thisAddinIncludedCheckbox.addEventListener("change", this.toggleThisAddinIncluded, false);
        this.toggleWaiting(true);
        return utils_1.together([
            //loads the groups. This is where users are added if they are linked to a group
            this.groupsBuilder.fetch(),
            //loads the security groups (security clearance in user admin in MyG)
            this.securityClearancesBuilder.fetch(),
            //report loader...seems obsolete to me
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            //misc = system settings
            this.miscBuilder.fetch(),
            this.userBuilder.fetch(),
            this.zoneBuilder.fetch()
        ]).then(function (results) {
            var reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            _this.data.groups = results[0];
            _this.data.securityGroups = results[1];
            _this.data.reports = results[2];
            _this.data.rules = results[3];
            _this.data.distributionLists = _this.distributionListsBuilder.getRulesDistributionLists(_this.data.rules.map(function (rule) { return rule.id; }));
            _this.data.misc = results[5];
            customMap = _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(reportsDependencies, rulesDependencies, distributionListsDependencies);
            if (_this.exportAllUsersCheckbox.checked == true) {
                //sets exported users equal to all database users
                _this.data.users = results[6];
            }
            if (_this.exportAllZonesCheckbox.checked == true) {
                //sets exported zones to all database zones
                _this.data.zones = results[7];
            }
            if (_this.exportAllAddinsCheckbox.checked == false) {
                //sets exported addins equal to none/empty array
                _this.setAddinsToNull();
            }
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            var mapProvider = _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            // this.data.zones.length
            _this.showEntityMessage(groupsBlock, _this.data.groups.length - 1, "group");
            _this.showEntityMessage(securityClearancesBlock, _this.data.securityGroups.length, "security clearance");
            _this.showEntityMessage(rulesBlock, _this.data.rules.length, "rule");
            _this.showEntityMessage(reportsBlock, _this.reportsBuilder.getCustomizedReportsQty(), "report");
            _this.showEntityMessage(dashboardsBlock, _this.reportsBuilder.getDashboardsQty(), "dashboard");
            mapProvider && (mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider));
            _this.showEntityMessage(addinsBlock, _this.data.misc.addins.length, "addin");
            // this.miscBuilder.isThisAddinIncluded() && thisAddinBlock.classList.remove("hidden");
            _this.showEntityMessage(usersBlock, _this.data.users.length, "user");
            _this.showEntityMessage(zonesBlock, _this.data.zones.length, "zone");
            //this displays all the data/objects in the console
            console.log(_this.data);
        })["catch"](function (e) {
            console.error(e);
            alert("Can't get config to export");
        })["finally"](function () { return _this.toggleWaiting(); });
    };
    Addin.prototype.setAddinsToNull = function () {
        if ((this.data.misc != null) || (this.data.misc != undefined)) {
            this.data.misc.addins = [];
        }
    };
    Addin.prototype.unload = function () {
        this.abortCurrentTask();
        this.groupsBuilder.unload();
        this.securityClearancesBuilder.unload();
        this.reportsBuilder.unload();
        this.rulesBuilder.unload();
        this.distributionListsBuilder.unload();
        this.miscBuilder.unload();
        this.exportBtn.removeEventListener("click", this.exportData, false);
        this.saveBtn.removeEventListener("click", this.saveChanges, false);
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
        },
        blur: function () {
            addin.unload();
        }
    };
};
},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./userBuilder":8,"./utils":9,"./waiting":10,"./zoneBuilder":11}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
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
            var id, type, userId = recipient.user.id;
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
            dependencies.rules = utils_1.mergeUnique(dependencies.rules, distributionList.rules.map(function (rule) { return rule.id; }));
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
            _this.distributionLists = utils_1.entityToDictionary(distributionLists);
            _this.notificationTemplates = utils_1.entityToDictionary(webTemplates.concat(emailTemplates).concat(textTemplates));
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
},{"./utils":9}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
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
        nodeLookup = Utils.entityToDictionary(groups, function (entity) {
            var newEntity = Utils.extend({}, entity);
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
            _this.currentTree = Utils.extend({}, _this.tree);
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
            var itemCopy = Utils.extend({}, item);
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
                    childCopy = Utils.extend({}, child);
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
},{"./utils":9}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
    //todo problem code...is this necessary?
    // private getAllowedAddins (allAddins: string[]) {
    //     return allAddins.filter(addin => {
    //         let addinConfig = JSON.parse(addin);
    //         return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(item => {
    //             let url = item.url;
    //             return url && url.indexOf("\/\/") > -1;
    //         });
    //     });
    // }
    MiscBuilder.prototype.getAllowedAddins = function (allAddins) {
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
                    return _this.isValidUrl(url);
                });
            }
            else {
                //Single line addin structure check
                return _this.isValidUrl(addinConfig.url);
            }
        });
    };
    //Tests a URL for double slash. Accepts a url as a string as a argument.
    //Returns true if the url contains a double slash //
    //Returns false if the url does not contain a double slash.
    MiscBuilder.prototype.isValidUrl = function (url) {
        if (url && url.indexOf("\/\/") > -1) {
            return true;
        }
        return false;
    };
    MiscBuilder.prototype.removeExportAddin = function (allAddins) {
        return allAddins.filter(function (addin) {
            return (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) <= 0);
        });
    };
    MiscBuilder.prototype.isCurrentAddin = function (addin) {
        return ((addin.indexOf("Registration config") > -1) ||
            (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    };
    //fills the Misc builder (system settings) with the relevant information
    MiscBuilder.prototype.fetch = function () {
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
            _this.purgeSettings = systemSettings.purgeSettings;
            _this.emailSenderFrom = systemSettings.emailSenderFrom;
            _this.customerClassification = systemSettings.customerClassification;
            _this.currentUser = currentUser;
            _this.customMapProviders = utils_1.entityToDictionary(systemSettings.customWebMapProviderList);
            _this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            // removed by Brett to include single line addin structures
            _this.addins = _this.getAllowedAddins(systemSettings.customerPages);
            //this.addins = this.removeExportAddin(systemSettings.customerPages);
            // this.addins = systemSettings.customerPages;
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed,
                addins: _this.addins,
                purgeSettings: _this.purgeSettings,
                emailSenderFrom: _this.emailSenderFrom,
                customerClassification: _this.customerClassification
            };
        });
        return this.currentTask;
    };
    MiscBuilder.prototype.getMapProviderType = function (mapProviderId) {
        return this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    };
    MiscBuilder.prototype.getMapProviderName = function (mapProviderId) {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    };
    MiscBuilder.prototype.getMapProviderData = function (mapProviderId) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    };
    MiscBuilder.prototype.isThisAddinIncluded = function () {
        return this.addins.some(this.isCurrentAddin);
    };
    MiscBuilder.prototype.getAddinsData = function (includeThisAddin) {
        var _this = this;
        if (includeThisAddin === void 0) { includeThisAddin = false; }
        return !includeThisAddin ? this.addins.filter(function (addin) { return !_this.isCurrentAddin(addin); }) : this.addins;
    };
    MiscBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return MiscBuilder;
}());
exports.MiscBuilder = MiscBuilder;
},{"./utils":9}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
var REPORT_TYPE_DASHBOAD = "Dashboard";
var ReportsBuilder = /** @class */ (function () {
    function ReportsBuilder(api) {
        this.api = api;
    }
    //GetReportSchedules is obsolete
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
            groups: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups = Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups));
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
},{"./utils":9}],6:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var APPLICATION_RULE_ID = "RuleApplicationExceptionId";
var RulesBuilder = /** @class */ (function () {
    function RulesBuilder(api) {
        this.api = api;
    }
    RulesBuilder.prototype.getRules = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "Rule"
            }, resolve, reject);
        });
    };
    RulesBuilder.prototype.structureRules = function (rules) {
        return utils_1.sortArrayOfEntities(rules, [["baseType", "desc"], "name"]);
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
            groups: [],
            diagnostics: []
        }, processDependencies = function (condition) {
            var id, type;
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
            dependencies.groups = utils_1.mergeUnique(dependencies.groups, rule.groups.map(function (group) { return group.id; }));
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
            _this.combinedRules = utils_1.entityToDictionary(switchedOnRules);
            delete (_this.combinedRules[APPLICATION_RULE_ID]);
            _this.structuredRules = _this.structureRules(Object.keys(_this.combinedRules).map(function (key) { return _this.combinedRules[key]; }));
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
},{"./utils":9}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
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
},{"./groupsBuilder":3,"./utils":9}],8:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all users to the export as an option
exports.__esModule = true;
var UserBuilder = /** @class */ (function () {
    function UserBuilder(api) {
        this.api = api;
    }
    UserBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the user builder with all users
    UserBuilder.prototype.fetch = function () {
        this.abortCurrentTask();
        this.currentTask = this.getUsers();
        return this.currentTask;
    };
    UserBuilder.prototype.getUsers = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "User"
            }, resolve, reject);
        });
    };
    UserBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return UserBuilder;
}());
exports.UserBuilder = UserBuilder;
},{}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
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
},{}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Waiting = /** @class */ (function () {
    function Waiting() {
        this.bodyEl = document.body;
    }
    Waiting.prototype.start = function (el, zIndex) {
        if (el === void 0) { el = this.bodyEl; }
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<div class='fader'></div><div class='spinner'></div>";
        el.parentNode.appendChild(this.waitingContainer);
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
},{}],11:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all zones to the export as an option
exports.__esModule = true;
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91c2VyQnVpbGRlci50cyIsInNvdXJjZXMvdXRpbHMudHMiLCJzb3VyY2VzL3dhaXRpbmcudHMiLCJzb3VyY2VzL3pvbmVCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxpREFBNEM7QUFDNUMseUVBQW9FO0FBQ3BFLG1EQUE4QztBQUM5QywrQ0FBMEM7QUFDMUMsdUVBQWtFO0FBQ2xFLDZDQUFxRDtBQUNyRCxpQ0FBb0o7QUFDcEoscUNBQWdDO0FBQ2hDLDZDQUEwQztBQUMxQyw2Q0FBMEM7QUE0QzFDO0lBK1NJLG1CQUFtQjtJQUNuQixlQUFhLEdBQUc7UUFBaEIsaUJBV0M7UUFqVGdCLGNBQVMsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqRSxZQUFPLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0QsNEJBQXVCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQXFCLENBQUM7UUFDdEgsMkJBQXNCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQXFCLENBQUM7UUFDcEgsMkJBQXNCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQXFCLENBQUM7UUFNcEgsU0FBSSxHQUFnQjtZQUNqQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxFQUFFO1lB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SUFJSSxxQkFBWSxHQUFHO1FBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVPLHNDQUFnQixHQUF4QjtRQUNJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLDJCQUFLLEdBQUw7UUFDSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUNsQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVPLDhCQUFRLEdBQWhCO1FBQUEsaUJBTUM7UUFMRyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDL0IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNqQixVQUFVLEVBQUUsTUFBTTthQUNyQixFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCw0QkFBTSxHQUFOO1FBQ0ksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0EvQkEsQUErQkMsSUFBQTtBQS9CWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcclxuaW1wb3J0IFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgZnJvbSBcIi4vc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlclwiO1xyXG5pbXBvcnQgUmVwb3J0c0J1aWxkZXIgZnJvbSBcIi4vcmVwb3J0c0J1aWxkZXJcIjtcclxuaW1wb3J0IFJ1bGVzQnVpbGRlciBmcm9tIFwiLi9ydWxlc0J1aWxkZXJcIjtcclxuaW1wb3J0IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciBmcm9tIFwiLi9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXJcIjtcclxuaW1wb3J0IHtJTWlzY0RhdGEsIE1pc2NCdWlsZGVyfSBmcm9tIFwiLi9taXNjQnVpbGRlclwiO1xyXG5pbXBvcnQge2Rvd25sb2FkRGF0YUFzRmlsZSwgbWVyZ2VVbmlxdWUsIElFbnRpdHksIG1lcmdlVW5pcXVlRW50aXRpZXMsIGdldFVuaXF1ZUVudGl0aWVzLCBnZXRFbnRpdGllc0lkcywgdG9nZXRoZXIsIHJlc29sdmVkUHJvbWlzZX0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IFdhaXRpbmcgZnJvbSBcIi4vd2FpdGluZ1wiO1xyXG5pbXBvcnQge1VzZXJCdWlsZGVyfSBmcm9tIFwiLi91c2VyQnVpbGRlclwiO1xyXG5pbXBvcnQge1pvbmVCdWlsZGVyfSBmcm9tIFwiLi96b25lQnVpbGRlclwiO1xyXG5cclxuaW50ZXJmYWNlIEdlb3RhYiB7XHJcbiAgICBhZGRpbjoge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbkNvbmZpZzogRnVuY3Rpb25cclxuICAgIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJSW1wb3J0RGF0YSB7XHJcbiAgICBncm91cHM6IGFueVtdO1xyXG4gICAgcmVwb3J0czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbiAgICBkaXN0cmlidXRpb25MaXN0czogYW55W107XHJcbiAgICBkZXZpY2VzOiBhbnlbXTtcclxuICAgIHVzZXJzOiBhbnlbXTtcclxuICAgIHpvbmVUeXBlczogYW55W107XHJcbiAgICB6b25lczogYW55W107XHJcbiAgICB3b3JrVGltZXM6IGFueVtdO1xyXG4gICAgd29ya0hvbGlkYXlzOiBhbnlbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzOiBhbnlbXTtcclxuICAgIGRpYWdub3N0aWNzOiBhbnlbXTtcclxuICAgIGN1c3RvbU1hcHM6IGFueVtdO1xyXG4gICAgbWlzYzogSU1pc2NEYXRhO1xyXG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcclxufVxyXG5pbnRlcmZhY2UgSURlcGVuZGVuY2llcyB7XHJcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcclxuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcclxuICAgIHJ1bGVzPzogc3RyaW5nW107XHJcbiAgICBkaXN0cmlidXRpb25MaXN0cz86IHN0cmluZ1tdO1xyXG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xyXG4gICAgdXNlcnM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xyXG4gICAgem9uZXM/OiBzdHJpbmdbXTtcclxuICAgIHdvcmtUaW1lcz86IHN0cmluZ1tdO1xyXG4gICAgd29ya0hvbGlkYXlzPzogc3RyaW5nW107XHJcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xyXG4gICAgZGlhZ25vc3RpY3M/OiBzdHJpbmdbXTtcclxuICAgIGN1c3RvbU1hcHM/OiBzdHJpbmdbXTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xyXG59XHJcblxyXG5kZWNsYXJlIGNvbnN0IGdlb3RhYjogR2VvdGFiO1xyXG5cclxuY2xhc3MgQWRkaW4ge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdyb3Vwc0J1aWxkZXI6IEdyb3Vwc0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXI6IFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlcG9ydHNCdWlsZGVyOiBSZXBvcnRzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcnVsZXNCdWlsZGVyOiBSdWxlc0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjogRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBtaXNjQnVpbGRlcjogTWlzY0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVzZXJCdWlsZGVyOiBVc2VyQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgem9uZUJ1aWxkZXI6IFpvbmVCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRCdG46IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRCdXR0b25cIik7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNhdmVCdG46IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlQnV0dG9uXCIpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxBZGRpbnNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF9hZGRpbnNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsVXNlcnNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF91c2Vyc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdhaXRpbmc6IFdhaXRpbmc7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgLy90ZW1wb3JhcnkgcGxhY2Vob2xkZXJzIGZvciB0aGUgb2JqZWN0cyBpbmRpY2F0ZWRcclxuICAgIHByaXZhdGUgdGVtcFVzZXJzOiBbXTtcclxuICAgIHByaXZhdGUgdGVtcFpvbmVzXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGE6IElJbXBvcnREYXRhID0ge1xyXG4gICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBbXSxcclxuICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcclxuICAgICAgICBjdXN0b21NYXBzOiBbXSxcclxuICAgICAgICBkaWFnbm9zdGljczogW10sXHJcbiAgICAgICAgbWlzYzogbnVsbCxcclxuICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgY29tYmluZURlcGVuZGVuY2llcyAoLi4uYWxsRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzW10pOiBJRGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgdG90YWwgPSB7XHJcbiAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgIHJlcG9ydHM6IFtdLFxyXG4gICAgICAgICAgICBydWxlczogW10sXHJcbiAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcclxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxyXG4gICAgICAgICAgICBkaWFnbm9zdGljczogW10sXHJcbiAgICAgICAgICAgIGN1c3RvbU1hcHM6IFtdLFxyXG4gICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModG90YWwpLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBkZXBlbmRlbmN5TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0gPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLCAuLi5hbGxEZXBlbmRlbmNpZXMubWFwKChlbnRpdHlEZXBlbmRlbmNpZXMpID0+IGVudGl0eURlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCB0b3RhbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdHcm91cHMgKGdyb3Vwczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBpZiAoIWdyb3VwcyB8fCAhZ3JvdXBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBncm91cHNEYXRhID0gdGhpcy5ncm91cHNCdWlsZGVyLmdldEdyb3Vwc0RhdGEoZ3JvdXBzLCB0cnVlKSxcclxuICAgICAgICAgICAgbmV3R3JvdXBzVXNlcnMgPSBnZXRVbmlxdWVFbnRpdGllcyh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3Vwc0RhdGEpLCBkYXRhLnVzZXJzKTtcclxuICAgICAgICBkYXRhLmdyb3VwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ncm91cHMsIGdyb3Vwc0RhdGEpO1xyXG4gICAgICAgIGRhdGEudXNlcnMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEudXNlcnMsIG5ld0dyb3Vwc1VzZXJzKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKHt1c2VyczogZ2V0RW50aXRpZXNJZHMobmV3R3JvdXBzVXNlcnMpfSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdDdXN0b21NYXBzIChjdXN0b21NYXBzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBpZiAoIWN1c3RvbU1hcHNJZHMgfHwgIWN1c3RvbU1hcHNJZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGN1c3RvbU1hcHNEYXRhID0gY3VzdG9tTWFwc0lkcy5yZWR1Y2UoKGRhdGEsIGN1c3RvbU1hcElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgbGV0IGN1c3RvbU1hcERhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YShjdXN0b21NYXBJZCk7XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcERhdGEgJiYgZGF0YS5wdXNoKGN1c3RvbU1hcERhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICAgICAgZGF0YS5jdXN0b21NYXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmN1c3RvbU1hcHMsIGN1c3RvbU1hcHNEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyAobm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBpZiAoIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcyB8fCAhbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhID0gbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLnJlZHVjZSgoZGF0YSwgdGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZURhdGEgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEodGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlRGF0YSAmJiBkYXRhLnB1c2godGVtcGxhdGVEYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgICAgIGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcywgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRFbnR5dGllc0lkcyAoZW50aXRpZXM6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcclxuICAgICAgICByZXR1cm4gZW50aXRpZXMucmVkdWNlKChyZXMsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlcy5wdXNoKGVudGl0eS5pZCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RW50aXR5RGVwZW5kZW5jaWVzIChlbnRpdHk6IElFbnRpdHksIGVudGl0eVR5cGUpIHtcclxuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XHJcbiAgICAgICAgc3dpdGNoIChlbnRpdHlUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkZXZpY2VzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eVtcIndvcmtUaW1lXCJdLmlkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya1RpbWVzID0gW2VudGl0eVtcIndvcmtUaW1lXCJdLmlkXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJjb21wYW55R3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJkcml2ZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJwcml2YXRlVXNlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInJlcG9ydEdyb3Vwc1wiXSkpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJzZWN1cml0eUdyb3Vwc1wiXSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiem9uZXNcIjpcclxuICAgICAgICAgICAgICAgIGxldCB6b25lVHlwZXMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInpvbmVUeXBlc1wiXSk7XHJcbiAgICAgICAgICAgICAgICB6b25lVHlwZXMubGVuZ3RoICYmIChlbnRpdHlEZXBlbmRlbmNpZXMuem9uZVR5cGVzID0gem9uZVR5cGVzKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIndvcmtUaW1lc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrSG9saWRheXMgPSBbZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWRdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbnRpdHlEZXBlbmRlbmNpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhcHBseVRvRW50aXRpZXMgKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcywgaW5pdGlhbFZhbHVlLCBmdW5jOiAocmVzdWx0LCBlbnRpdHksIGVudGl0eVR5cGU6IHN0cmluZywgZW50aXR5SW5kZXg6IG51bWJlciwgZW50aXR5VHlwZUluZGV4OiBudW1iZXIsIG92ZXJhbGxJbmRleDogbnVtYmVyKSA9PiBhbnkpIHtcclxuICAgICAgICBsZXQgb3ZlcmFsbEluZGV4ID0gMDtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZW50aXRpZXNMaXN0KS5yZWR1Y2UoKHJlc3VsdCwgZW50aXR5VHlwZSwgdHlwZUluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc0xpc3RbZW50aXR5VHlwZV0ucmVkdWNlKChyZXMsIGVudGl0eSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIG92ZXJhbGxJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMocmVzLCBlbnRpdHksIGVudGl0eVR5cGUsIGluZGV4LCB0eXBlSW5kZXgsIG92ZXJhbGxJbmRleCAtIDEpO1xyXG4gICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgIH0sIGluaXRpYWxWYWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNvbHZlRGVwZW5kZW5jaWVzIChkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgbGV0IGdldERhdGEgPSAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzKTogUHJvbWlzZTxJSW1wb3J0RGF0YT4gPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVudGl0eVJlcXVlc3RUeXBlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlczogXCJEZXZpY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnM6IFwiVXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFwiWm9uZVR5cGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZXM6IFwiWm9uZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFwiV29ya1RpbWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBcIldvcmtIb2xpZGF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBcIkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBcIkRpYWdub3N0aWNcIixcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdGllc0xpc3QsIHt9LCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZW50aXR5SWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgfHwgZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKFtcIkdldFwiLCByZXF1ZXN0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzICYmIGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5zZWN1cml0eUdyb3VwcyA9IFtbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLnNlY3VyaXR5R3JvdXBzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyAmJiBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLndvcmtIb2xpZGF5cyA9IFtbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLndvcmtIb2xpZGF5c1xyXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGROZXdHcm91cHMoZW50aXRpZXNMaXN0Lmdyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKGVudGl0aWVzTGlzdC5jdXN0b21NYXBzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyhlbnRpdGllc0xpc3Qubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0Lmdyb3VwcztcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0LmN1c3RvbU1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0RW50aXRpZXMgPSBPYmplY3Qua2V5cyhyZXF1ZXN0cyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c0FycmF5ID0gcmVxdWVzdEVudGl0aWVzLnJlZHVjZSgobGlzdCwgdHlwZSkgPT4gbGlzdC5jb25jYXQocmVxdWVzdHNbdHlwZV0pLCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdEVudGl0aWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHJlcXVlc3RzQXJyYXksIChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdHcm91cHMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhyZXF1ZXN0cywge30sIChyZXN1bHQsIHJlcXVlc3QsIGVudGl0eVR5cGUsIGVudGl0eUluZGV4LCBlbnRpdHlUeXBlSW5kZXgsIG92ZXJhbGxJbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVxdWVzdHNBcnJheS5sZW5ndGggPiAxID8gcmVzcG9uc2Vbb3ZlcmFsbEluZGV4XSA6IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtWzBdIHx8IGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiICYmICghaXRlbS5ob2xpZGF5R3JvdXAgfHwgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5pbmRleE9mKGl0ZW0uaG9saWRheUdyb3VwLmdyb3VwSWQpID09PSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMuaW5kZXhPZihpdGVtLmlkKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSByZXN1bHRbZW50aXR5VHlwZV0uY29uY2F0KHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRDdXN0b21Hcm91cHNEYXRhKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcywgaXRlbXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50aXR5VHlwZSA9PT0gXCJ1c2Vyc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udXNlckF1dGhlbnRpY2F0aW9uVHlwZSA9IFwiQmFzaWNBdXRoZW50aWNhdGlvblwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoaXRlbSwgZW50aXR5VHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXR5RGVwZW5kZW5jaWVzLCBuZXdEZXBlbmRlbmNpZXMsIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWUocmVzdWx0W2VudGl0eVR5cGVdLCBbZW50aXR5SWRdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHcm91cHMgPSBuZXdHcm91cHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5ncm91cHMgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBuZXdDdXN0b21NYXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5ncm91cHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSBPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLnJlZHVjZSgocmVzdWx0LCBkZXBlbmRlbmN5TmFtZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXRpZXMgPSBuZXdEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWQgPSAoZXhwb3J0ZWREYXRhW2RlcGVuZGVuY3lOYW1lXSB8fCBbXSkubWFwKGVudGl0eSA9PiBlbnRpdHkuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5mb3JFYWNoKGVudGl0eUlkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZC5pbmRleE9mKGVudGl0eUlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2RlcGVuZGVuY3lOYW1lXSAmJiAocmVzdWx0W2RlcGVuZGVuY3lOYW1lXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZGVwZW5kZW5jeU5hbWVdLnB1c2goZW50aXR5SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBJSW1wb3J0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJ1aWx0LWluIHNlY3VyaXR5IGdyb3Vwc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyAmJiAoZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzID0gZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzLnJlZHVjZSgocmVzdWx0LCBncm91cCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5pZC5pbmRleE9mKFwiR3JvdXBcIikgPT09IC0xICYmIHJlc3VsdC5wdXNoKGdyb3VwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3R3JvdXBzKG5ld0dyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhuZXdDdXN0b21NYXBzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXhwb3J0ZWREYXRhKS5mb3JFYWNoKChlbnRpdHlUeXBlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGFbZW50aXR5VHlwZV0sIGV4cG9ydGVkRGF0YVtlbnRpdHlUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKG5ld0RlcGVuZGVuY2llcywgZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGRlcGVuZGVuY2llcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZUV4cG9ydEJ1dHRvbiAoaXNEaXNhYmxlZDogYm9vbGVhbikge1xyXG4gICAgICAgICg8SFRNTElucHV0RWxlbWVudD50aGlzLmV4cG9ydEJ0bikuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlV2FpdGluZyA9IChpc1N0YXJ0ID0gZmFsc2UpID0+IHtcclxuICAgICAgICBpZiAoaXNTdGFydCkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0YXJ0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkaW5Db250YWluZXJcIikucGFyZW50RWxlbWVudCwgOTk5OSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24oZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL0JyZXR0IC0gZGlzcGxheXMgdGhlIG91dHB1dCBvbiB0aGUgcGFnZVxyXG4gICAgcHJpdmF0ZSBzaG93RW50aXR5TWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBxdHk6IG51bWJlciwgZW50aXR5TmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgIGlmIChxdHkpIHtcclxuICAgICAgICAgICAgcXR5ID4gMSAmJiAoZW50aXR5TmFtZSArPSBcInNcIik7XHJcbiAgICAgICAgICAgIGxldCBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGVcIikuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7cXVhbnRpdHl9XCIsIHF0eS50b1N0cmluZygpKS5yZXBsYWNlKFwie2VudGl0eX1cIiwgZW50aXR5TmFtZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBgWW91IGhhdmUgPHNwYW4gY2xhc3M9XCJib2xkXCI+bm90IGNvbmZpZ3VyZWQgYW55ICR7IGVudGl0eU5hbWUgfXM8L3NwYW4+LmA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlIGluY2x1ZGVUaGlzQWRkaW4gY2hlY2tib3ggaXMgY2hhbmdlZCB3ZSBlbnRlciBoZXJlXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVRoaXNBZGRpbkluY2x1ZGVkID0gKGU6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgbGV0IGlzQ2hlY2tlZCA9ICEhZS50YXJnZXQgJiYgISEoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICAgICAgbGV0IGFkZGluc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRBZGRpbnNcIik7XHJcbiAgICAgICAgbGV0IGFkZGluc0RhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldEFkZGluc0RhdGEoIWlzQ2hlY2tlZCk7XHJcbiAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgYWRkaW5zRGF0YS5sZW5ndGgsIFwiYWRkaW5cIik7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1pc2MuYWRkaW5zID0gYWRkaW5zRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICAvL2luaXRpYWxpemUgYWRkaW4gXHJcbiAgICBjb25zdHJ1Y3RvciAoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyID0gbmV3IEdyb3Vwc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgPSBuZXcgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIgPSBuZXcgUmVwb3J0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlciA9IG5ldyBSdWxlc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciA9IG5ldyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyID0gbmV3IE1pc2NCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy51c2VyQnVpbGRlciA9IG5ldyBVc2VyQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuem9uZUJ1aWxkZXIgPSBuZXcgWm9uZUJ1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLndhaXRpbmcgPSBuZXcgV2FpdGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQnJldHQ6IGV4cG9ydHMgdGhlIGRhdGFcclxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhdGEoKS50aGVuKChyZXBvcnRzRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xyXG4gICAgICAgICAgICBkb3dubG9hZERhdGFBc0ZpbGUoSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSwgXCJleHBvcnQuanNvblwiKTtcclxuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGV4cG9ydCBkYXRhLlxcblBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVDaGFuZ2VzID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrQm94VmFsdWVDaGFuZ2VkID0gKCkgPT4ge1xyXG4gICAgICAgICg8SFRNTElucHV0RWxlbWVudD50aGlzLmV4cG9ydEJ0bikuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnVzZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XHJcbiAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcclxuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxyXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTCxcclxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSxcclxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSxcclxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIiksXHJcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSxcclxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpLFxyXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpLFxyXG4gICAgICAgICAgICAvLyBleHBvcnRBbGxBZGRpbnNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF9hZGRpbnNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudCxcclxuICAgICAgICAgICAgLy8gdGhpc0FkZGluQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbmNsdWRlVGhpc0FkZGluXCIpLFxyXG4gICAgICAgICAgICAvLyB0aGlzQWRkaW5JbmNsdWRlZENoZWNrYm94OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjaW5jbHVkZVRoaXNBZGRpbiA+IGlucHV0XCIpLFxyXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgPiAuZGVzY3JpcHRpb25cIiksXHJcbiAgICAgICAgICAgIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxyXG4gICAgICAgICAgICAvLyBleHBvcnRBbGxVc2Vyc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3VzZXJzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQsXHJcbiAgICAgICAgICAgIHpvbmVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFpvbmVzXCIpO1xyXG4gICAgICAgICAgICAvLyBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICAgICAgLy93aXJlIHVwIHRoZSBleHBvcnQgYnV0dG9uIGV2ZW50XHJcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRBbGxVc2Vyc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgICAgICAvL3dpcmUgdXAgdGhlIGluY2x1ZGVUaGlzQWRkaW4gY2hlY2tib3ggZXZlbnRcclxuICAgICAgICAvLyB0aGlzQWRkaW5JbmNsdWRlZENoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy50b2dnbGVUaGlzQWRkaW5JbmNsdWRlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdG9nZXRoZXIoW1xyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBncm91cHMuIFRoaXMgaXMgd2hlcmUgdXNlcnMgYXJlIGFkZGVkIGlmIHRoZXkgYXJlIGxpbmtlZCB0byBhIGdyb3VwXHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBzZWN1cml0eSBncm91cHMgKHNlY3VyaXR5IGNsZWFyYW5jZSBpbiB1c2VyIGFkbWluIGluIE15RylcclxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIC8vcmVwb3J0IGxvYWRlci4uLnNlZW1zIG9ic29sZXRlIHRvIG1lXHJcbiAgICAgICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgLy9taXNjID0gc3lzdGVtIHNldHRpbmdzXHJcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy51c2VyQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICB0aGlzLnpvbmVCdWlsZGVyLmZldGNoKClcclxuICAgICAgICBdKS50aGVuKChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCByZXBvcnRzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgcnVsZXNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGN1c3RvbU1hcDtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmdyb3VwcyA9IHJlc3VsdHNbMF07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZWN1cml0eUdyb3VwcyA9IHJlc3VsdHNbMV07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZXBvcnRzID0gcmVzdWx0c1syXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJ1bGVzID0gcmVzdWx0c1szXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyh0aGlzLmRhdGEucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEubWlzYyA9IHJlc3VsdHNbNV07XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcCA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwICYmIHRoaXMuZGF0YS5jdXN0b21NYXBzLnB1c2goY3VzdG9tTWFwKTtcclxuICAgICAgICAgICAgcmVwb3J0c0RlcGVuZGVuY2llcyA9IHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5yZXBvcnRzKTtcclxuICAgICAgICAgICAgcnVsZXNEZXBlbmRlbmNpZXMgPSB0aGlzLnJ1bGVzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJ1bGVzKTtcclxuICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzKTtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHJlcG9ydHNEZXBlbmRlbmNpZXMsIHJ1bGVzRGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXhwb3J0QWxsVXNlcnNDaGVja2JveC5jaGVja2VkPT10cnVlKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0cyBleHBvcnRlZCB1c2VycyBlcXVhbCB0byBhbGwgZGF0YWJhc2UgdXNlcnNcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS51c2VycyA9IHJlc3VsdHNbNl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xyXG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHpvbmVzIHRvIGFsbCBkYXRhYmFzZSB6b25lc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gcmVzdWx0c1s3XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PWZhbHNlKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0cyBleHBvcnRlZCBhZGRpbnMgZXF1YWwgdG8gbm9uZS9lbXB0eSBhcnJheVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IG1hcFByb3ZpZGVyID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlck5hbWUodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xyXG4gICAgICAgICAgICAvLyB0aGlzLmRhdGEuem9uZXMubGVuZ3RoXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZ3JvdXBzQmxvY2ssIHRoaXMuZGF0YS5ncm91cHMubGVuZ3RoIC0gMSwgXCJncm91cFwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShzZWN1cml0eUNsZWFyYW5jZXNCbG9jaywgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzLmxlbmd0aCwgXCJzZWN1cml0eSBjbGVhcmFuY2VcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocnVsZXNCbG9jaywgdGhpcy5kYXRhLnJ1bGVzLmxlbmd0aCwgXCJydWxlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJlcG9ydHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXRDdXN0b21pemVkUmVwb3J0c1F0eSgpLCBcInJlcG9ydFwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShkYXNoYm9hcmRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGFzaGJvYXJkc1F0eSgpLCBcImRhc2hib2FyZFwiKTtcclxuICAgICAgICAgICAgbWFwUHJvdmlkZXIgJiYgKG1hcEJsb2NrRGVzY3JpcHRpb24uaW5uZXJIVE1MID0gbWFwTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7bWFwUHJvdmlkZXJ9XCIsIG1hcFByb3ZpZGVyKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoYWRkaW5zQmxvY2ssIHRoaXMuZGF0YS5taXNjLmFkZGlucy5sZW5ndGgsIFwiYWRkaW5cIik7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWlzY0J1aWxkZXIuaXNUaGlzQWRkaW5JbmNsdWRlZCgpICYmIHRoaXNBZGRpbkJsb2NrLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UodXNlcnNCbG9jaywgdGhpcy5kYXRhLnVzZXJzLmxlbmd0aCwgXCJ1c2VyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHpvbmVzQmxvY2ssIHRoaXMuZGF0YS56b25lcy5sZW5ndGgsIFwiem9uZVwiKTtcclxuICAgICAgICAgICAgLy90aGlzIGRpc3BsYXlzIGFsbCB0aGUgZGF0YS9vYmplY3RzIGluIHRoZSBjb25zb2xlXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBnZXQgY29uZmlnIHRvIGV4cG9ydFwiKTtcclxuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEFkZGluc1RvTnVsbCgpIHtcclxuICAgICAgICBpZiAoKHRoaXMuZGF0YS5taXNjICE9IG51bGwpIHx8ICh0aGlzLmRhdGEubWlzYyAhPSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCkge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnNhdmVCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBhZGRpbjogQWRkaW47XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpbml0aWFsaXplOiAoYXBpLCBzdGF0ZSwgY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgYWRkaW4gPSBuZXcgQWRkaW4oYXBpKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmx1cjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG4vL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXHJcbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcmVjaXBpZW50czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgcnVsZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0cztcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cclxuICAgIHByaXZhdGUgZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvbldlYlJlcXVlc3RUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChkaXN0cmlidXRpb25MaXN0cyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcclxuICAgICAgICAgICAgICAgIHVzZXJJZCAmJiBkZXBlbmRlbmNpZXMudXNlcnMuaW5kZXhPZih1c2VySWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXMudXNlcnMucHVzaCh1c2VySWQpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRNZXNzYWdlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0VG9TcGVlY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZ3JvdXBzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjaXBpZW50cy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgcmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ydWxlcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ydWxlcywgZGlzdHJpYnV0aW9uTGlzdC5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcclxuICAgICAgICAgICAgLnRoZW4oKFtkaXN0cmlidXRpb25MaXN0cywgd2ViVGVtcGxhdGVzLCBlbWFpbFRlbXBsYXRlcywgdGV4dFRlbXBsYXRlc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhICh0ZW1wbGF0ZUlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlcywgaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzW2lkXTtcclxuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgQ29sb3Ige1xyXG4gICAgcjogbnVtYmVyO1xyXG4gICAgZzogbnVtYmVyO1xyXG4gICAgYjogbnVtYmVyO1xyXG4gICAgYTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBDb2xvcjtcclxuICAgIHBhcmVudD86IElHcm91cDtcclxuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XHJcbiAgICB1c2VyPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcclxuICAgIHByb3RlY3RlZCBhcGk7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XHJcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCB0cmVlOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcclxuXHJcbiAgICBwcml2YXRlIHVzZXJzOiBhbnk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGZpbmRDaGlsZCAoY2hpbGRJZDogc3RyaW5nLCBjdXJyZW50SXRlbTogSUdyb3VwLCBvbkFsbExldmVsczogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwIHtcclxuICAgICAgICBsZXQgZm91bmRDaGlsZCA9IG51bGwsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY3VycmVudEl0ZW0uY2hpbGRyZW47XHJcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5pZCA9PT0gY2hpbGRJZCkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcclxuICAgICAgICAgICAgdXNlckhhc1ByaXZhdGVHcm91cCA9ICh1c2VyLCBncm91cElkKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VXNlciA9IHVzZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlkOiBncm91cElkLFxyXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUHJpdmF0ZVVzZXJHcm91cE5hbWVcIixcclxuICAgICAgICAgICAgcGFyZW50OiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbeyBpZDogZ3JvdXBJZCB9XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XHJcbiAgICAgICAgbGV0IG5vZGVMb29rdXAsXHJcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY2hpbGRyZW5baV0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbm9kZUxvb2t1cCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShncm91cHMsIGVudGl0eSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBVdGlscy5leHRlbmQoe30sIGVudGl0eSk7XHJcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIG5ld0VudGl0eS5jaGlsZHJlbiA9IG5ld0VudGl0eS5jaGlsZHJlbi5zbGljZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgICAgbm9kZUxvb2t1cFtrZXldICYmIHRyYXZlcnNlQ2hpbGRyZW4obm9kZUxvb2t1cFtrZXldKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZm91bmRJZHMgPSBbXSxcclxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQgPSBbXSxcclxuICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzID0gKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtQ29weSA9IFV0aWxzLmV4dGVuZCh7fSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5jaGlsZHJlbiAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xyXG4gICAgICAgICFub3RJbmNsdWRlQ2hpbGRyZW4gJiYgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRDaGlsZHJlbik7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XHJcbiAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IHRoaXMudHJlZX0sIHRydWUpIHx8IHRoaXMuZ2V0UHJpdmF0ZUdyb3VwRGF0YShncm91cElkKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZ3JvdXBzVHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShhbGxHcm91cHMpLFxyXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT4gXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3VwcywgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzOiBJR3JvdXBbXSkge1xyXG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VycywgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcclxuICAgIG1hcFByb3ZpZGVyOiB7XHJcbiAgICAgICAgdmFsdWU6IHN0cmluZztcclxuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xyXG4gICAgfTtcclxuICAgIGN1cnJlbnRVc2VyOiBhbnk7XHJcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcclxuICAgIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwdXJnZVNldHRpbmdzOiBhbnk7XHJcbiAgICBlbWFpbFNlbmRlckZyb206IHN0cmluZztcclxuICAgIGN1c3RvbWVyQ2xhc3NpZmljYXRpb246IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1pc2NCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXN0b21NYXBQcm92aWRlcnM7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcclxuICAgIHByaXZhdGUgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ7XHJcbiAgICBwcml2YXRlIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRNYXBQcm92aWRlcnMgPSB7XHJcbiAgICAgICAgR29vZ2xlTWFwczogXCJHb29nbGUgTWFwc1wiLFxyXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXHJcbiAgICAgICAgTWFwQm94OiBcIk1hcEJveFwiXHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBwdXJnZVNldHRpbmdzOiBhbnk7XHJcbiAgICBwcml2YXRlIGVtYWlsU2VuZGVyRnJvbTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjdXN0b21lckNsYXNzaWZpY2F0aW9uOiBzdHJpbmc7XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdG9kbyBwcm9ibGVtIGNvZGUuLi5pcyB0aGlzIG5lY2Vzc2FyeT9cclxuICAgIC8vIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xyXG4gICAgLy8gICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcclxuICAgIC8vICAgICAgICAgbGV0IGFkZGluQ29uZmlnID0gSlNPTi5wYXJzZShhZGRpbik7XHJcbiAgICAvLyAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeShpdGVtID0+IHtcclxuICAgIC8vICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcclxuICAgIC8vICAgICAgICAgICAgIHJldHVybiB1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMTtcclxuICAgIC8vICAgICAgICAgfSk7XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRBbGxvd2VkQWRkaW5zIChhbGxBZGRpbnM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgcmV0dXJuIGFsbEFkZGlucy5maWx0ZXIoYWRkaW4gPT4ge1xyXG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNDdXJyZW50QWRkaW4oYWRkaW4pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGFkZGluQ29uZmlnID0gSlNPTi5wYXJzZShhZGRpbik7XHJcbiAgICAgICAgICAgIGlmKGFkZGluQ29uZmlnLml0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAvL011bHRpIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVybCA9IGl0ZW0udXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRVcmwodXJsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9TaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRVcmwoYWRkaW5Db25maWcudXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vVGVzdHMgYSBVUkwgZm9yIGRvdWJsZSBzbGFzaC4gQWNjZXB0cyBhIHVybCBhcyBhIHN0cmluZyBhcyBhIGFyZ3VtZW50LlxyXG4gICAgLy9SZXR1cm5zIHRydWUgaWYgdGhlIHVybCBjb250YWlucyBhIGRvdWJsZSBzbGFzaCAvL1xyXG4gICAgLy9SZXR1cm5zIGZhbHNlIGlmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBhIGRvdWJsZSBzbGFzaC5cclxuICAgIHByaXZhdGUgaXNWYWxpZFVybCh1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICh1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZW1vdmVFeHBvcnRBZGRpbiAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIChhZGRpbi50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJyZWdpc3RyYXRpb25Db25maWdcIi50b0xvd2VyQ2FzZSgpKSA8PSAwKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlzQ3VycmVudEFkZGluIChhZGRpbjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuICgoYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMSl8fFxyXG4gICAgICAgIChhZGRpbi50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJyZWdpc3RyYXRpb25Db25maWdcIi50b0xvd2VyQ2FzZSgpKSA+IC0xKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9maWxscyB0aGUgTWlzYyBidWlsZGVyIChzeXN0ZW0gc2V0dGluZ3MpIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxJTWlzY0RhdGE+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXNlck5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJTeXN0ZW1TZXR0aW5nc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXHJcbiAgICAgICAgICAgICAgICBzeXN0ZW1TZXR0aW5ncyA9IHJlc3VsdFsxXVswXSB8fCByZXN1bHRbMV0sXHJcbiAgICAgICAgICAgICAgICB1c2VyTWFwUHJvdmlkZXJJZCA9IGN1cnJlbnRVc2VyLmRlZmF1bHRNYXBFbmdpbmUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXJJZCA9IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKHVzZXJNYXBQcm92aWRlcklkKSA9PT0gXCJjdXN0b21cIiA/IHVzZXJNYXBQcm92aWRlcklkIDogZGVmYXVsdE1hcFByb3ZpZGVySWQ7XHJcbiAgICAgICAgICAgIHRoaXMucHVyZ2VTZXR0aW5ncyA9IHN5c3RlbVNldHRpbmdzLnB1cmdlU2V0dGluZ3M7XHJcbiAgICAgICAgICAgIHRoaXMuZW1haWxTZW5kZXJGcm9tID0gc3lzdGVtU2V0dGluZ3MuZW1haWxTZW5kZXJGcm9tO1xyXG4gICAgICAgICAgICB0aGlzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb24gPSBzeXN0ZW1TZXR0aW5ncy5jdXN0b21lckNsYXNzaWZpY2F0aW9uO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gY3VycmVudFVzZXI7XHJcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZWQgYnkgQnJldHQgdG8gaW5jbHVkZSBzaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmVzXHJcbiAgICAgICAgICAgIHRoaXMuYWRkaW5zID0gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXMpO1xyXG4gICAgICAgICAgICAvL3RoaXMuYWRkaW5zID0gdGhpcy5yZW1vdmVFeHBvcnRBZGRpbihzeXN0ZW1TZXR0aW5ncy5jdXN0b21lclBhZ2VzKTtcclxuICAgICAgICAgICAgLy8gdGhpcy5hZGRpbnMgPSBzeXN0ZW1TZXR0aW5ncy5jdXN0b21lclBhZ2VzO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWFwUHJvdmlkZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZShtYXBQcm92aWRlcklkKVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyOiB0aGlzLmN1cnJlbnRVc2VyLFxyXG4gICAgICAgICAgICAgICAgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ6IHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQsXHJcbiAgICAgICAgICAgICAgICBhZGRpbnM6IHRoaXMuYWRkaW5zLFxyXG4gICAgICAgICAgICAgICAgcHVyZ2VTZXR0aW5nczogdGhpcy5wdXJnZVNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgZW1haWxTZW5kZXJGcm9tOiB0aGlzLmVtYWlsU2VuZGVyRnJvbSxcclxuICAgICAgICAgICAgICAgIGN1c3RvbWVyQ2xhc3NpZmljYXRpb246IHRoaXMuY3VzdG9tZXJDbGFzc2lmaWNhdGlvblxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyVHlwZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogVE1hcFByb3ZpZGVyVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSA/IFwiZGVmYXVsdFwiIDogXCJjdXN0b21cIjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlck5hbWUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgKHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSB8fCAodGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0ubmFtZSkgfHwgbWFwUHJvdmlkZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJEYXRhIChtYXBQcm92aWRlcklkOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXTtcclxuICAgIH1cclxuXHJcbiAgICBpc1RoaXNBZGRpbkluY2x1ZGVkICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRpbnMuc29tZSh0aGlzLmlzQ3VycmVudEFkZGluKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBZGRpbnNEYXRhIChpbmNsdWRlVGhpc0FkZGluID0gZmFsc2UpIHtcclxuICAgICAgICByZXR1cm4gIWluY2x1ZGVUaGlzQWRkaW4gPyB0aGlzLmFkZGlucy5maWx0ZXIoYWRkaW4gPT4gIXRoaXMuaXNDdXJyZW50QWRkaW4oYWRkaW4pKSA6IHRoaXMuYWRkaW5zO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmNvbnN0IFJFUE9SVF9UWVBFX0RBU0hCT0FEID0gXCJEYXNoYm9hcmRcIjtcclxuXHJcbmludGVyZmFjZSBJUmVwb3J0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBncm91cHM6IElHcm91cFtdO1xyXG4gICAgaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHM6IElHcm91cFtdO1xyXG4gICAgc2NvcGVHcm91cHM6IElHcm91cFtdO1xyXG4gICAgZGVzdGluYXRpb24/OiBzdHJpbmc7XHJcbiAgICB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlO1xyXG4gICAgbGFzdE1vZGlmaWVkVXNlcjtcclxuICAgIGFyZ3VtZW50czoge1xyXG4gICAgICAgIHJ1bGVzPzogYW55W107XHJcbiAgICAgICAgZGV2aWNlcz86IGFueVtdO1xyXG4gICAgICAgIHpvbmVUeXBlTGlzdD86IGFueVtdO1xyXG4gICAgICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG4gICAgfTtcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBjaGlsZHJlbjogSUdyb3VwW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJlcG9ydERlcGVuZGVuY2llcyB7XHJcbiAgICBkZXZpY2VzPzogc3RyaW5nW107XHJcbiAgICBydWxlcz86IHN0cmluZ1tdO1xyXG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XHJcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElSZXBvcnRUZW1wbGF0ZSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgaXNTeXN0ZW06IGJvb2xlYW47XHJcbiAgICByZXBvcnREYXRhU291cmNlOiBzdHJpbmc7XHJcbiAgICByZXBvcnRUZW1wbGF0ZVR5cGU6IHN0cmluZztcclxuICAgIHJlcG9ydHM6IElSZXBvcnRbXTtcclxuICAgIGJpbmFyeURhdGE/OiBzdHJpbmc7XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb3J0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBhbGxSZXBvcnRzOiBJUmVwb3J0W107XHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgcHJpdmF0ZSBkYXNoYm9hcmRzTGVuZ3RoOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGFsbFRlbXBsYXRlczogSVJlcG9ydFRlbXBsYXRlW107XHJcblxyXG4gICAgLy9HZXRSZXBvcnRTY2hlZHVsZXMgaXMgb2Jzb2xldGVcclxuICAgIHByaXZhdGUgZ2V0UmVwb3J0cyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgW1wiR2V0UmVwb3J0U2NoZWR1bGVzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBcImluY2x1ZGVUZW1wbGF0ZURldGFpbHNcIjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBcImFwcGx5VXNlckZpbHRlclwiOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXREYXNoYm9hcmRJdGVtc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZVJlcG9ydHMgKHJlcG9ydHMsIHRlbXBsYXRlcykge1xyXG4gICAgICAgIGxldCBmaW5kVGVtcGxhdGVSZXBvcnRzID0gKHRlbXBsYXRlSWQpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnRzLmZpbHRlcihyZXBvcnQgPT4gcmVwb3J0LnRlbXBsYXRlLmlkID09PSB0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gdGVtcGxhdGVzLnJlZHVjZSgocmVzLCB0ZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVSZXBvcnRzID0gZmluZFRlbXBsYXRlUmVwb3J0cyh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVwb3J0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlLnJlcG9ydHMgPSB0ZW1wbGF0ZVJlcG9ydHM7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlVGVtcGxhdGUgKG5ld1RlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlKSB7XHJcbiAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMuc29tZSgodGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUsIGluZGV4OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlRGF0YS5pZCA9PT0gbmV3VGVtcGxhdGVEYXRhLmlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlc1tpbmRleF0gPSBuZXdUZW1wbGF0ZURhdGE7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJlcG9ydHMoKVxyXG4gICAgICAgICAgICAudGhlbigoW3JlcG9ydHMsIHRlbXBsYXRlcywgZGFzaGJvYXJkSXRlbXNdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFJlcG9ydHMgPSByZXBvcnRzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXMgPSB0ZW1wbGF0ZXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhc2hib2FyZHNMZW5ndGggPSBkYXNoYm9hcmRJdGVtcyAmJiBkYXNoYm9hcmRJdGVtcy5sZW5ndGggPyBkYXNoYm9hcmRJdGVtcy5sZW5ndGggOiAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyhyZXBvcnRzLCB0ZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocmVwb3J0czogSVJlcG9ydFRlbXBsYXRlW10pOiBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgYWxsRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzID0ge1xyXG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgICAgICAgICBydWxlczogW10sXHJcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiByZXBvcnRzLnJlZHVjZSgocmVwb3J0c0RlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcywgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwb3J0cy5yZWR1Y2UoKHRlbXBsYXRlRGVwZW5kZWNpZXMsIHJlcG9ydCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcywgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0Lmdyb3VwcyksXHJcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwcyksIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzKSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuc2NvcGVHcm91cHMpKTtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLmRldmljZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzKSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnJ1bGVzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMucnVsZXMpIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzID0gVXRpbHMubWVyZ2VVbmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QpIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZURlcGVuZGVjaWVzO1xyXG4gICAgICAgICAgICB9LCByZXBvcnRzRGVwZW5kZW5jaWVzKTtcclxuICAgICAgICB9LCBhbGxEZXBlbmRlbmNpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREYXRhICgpOiBQcm9taXNlPElSZXBvcnRUZW1wbGF0ZVtdPiB7XHJcbiAgICAgICAgbGV0IHBvcnRpb25TaXplID0gMTUsXHJcbiAgICAgICAgICAgIHBvcnRpb25zID0gdGhpcy5hbGxUZW1wbGF0ZXMucmVkdWNlKChyZXF1ZXN0cywgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZS5pc1N5c3RlbSAmJiAhdGVtcGxhdGUuYmluYXJ5RGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3J0aW9uSW5kZXg6IG51bWJlciA9IHJlcXVlc3RzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0c1twb3J0aW9uSW5kZXhdIHx8IHJlcXVlc3RzW3BvcnRpb25JbmRleF0ubGVuZ3RoID49IHBvcnRpb25TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMucHVzaChbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcG9ydGlvbkluZGV4ICsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLnB1c2goW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdHM7XHJcbiAgICAgICAgICAgIH0sIFtdKSxcclxuICAgICAgICAgICAgdG90YWxSZXN1bHRzOiBhbnlbXVtdID0gW10sXHJcbiAgICAgICAgICAgIGdldFBvcnRpb25EYXRhID0gcG9ydGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHBvcnRpb24sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gcG9ydGlvbnMucmVkdWNlKChwcm9taXNlcywgcG9ydGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gZ2V0UG9ydGlvbkRhdGEocG9ydGlvbikpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cyA9IHRvdGFsUmVzdWx0cy5jb25jYXQocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zID0gZXJyb3JQb3J0aW9ucy5jb25jYXQocG9ydGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSwgVXRpbHMucmVzb2x2ZWRQcm9taXNlKFtdKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucy5sZW5ndGggJiYgY29uc29sZS53YXJuKGVycm9yUG9ydGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzLmZvckVhY2godGVtcGxhdGVEYXRhID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSA9IHRlbXBsYXRlRGF0YS5sZW5ndGggPyB0ZW1wbGF0ZURhdGFbMF0gOiB0ZW1wbGF0ZURhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHModGhpcy5hbGxSZXBvcnRzLCB0aGlzLmFsbFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkc1F0eSAoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXNoYm9hcmRzTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRDdXN0b21pemVkUmVwb3J0c1F0eSAoKTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgdGVtcGxhdGVzID0gW107XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmFsbFJlcG9ydHMuZmlsdGVyKChyZXBvcnQ6IElSZXBvcnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSByZXBvcnQudGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUV4aXN0czogYm9vbGVhbiA9IHRlbXBsYXRlcy5pbmRleE9mKHRlbXBsYXRlSWQpID4gLTEsXHJcbiAgICAgICAgICAgICAgICBpc0NvdW50OiBib29sZWFuID0gIXRlbXBsYXRlRXhpc3RzICYmIHJlcG9ydC5sYXN0TW9kaWZpZWRVc2VyICE9PSBcIk5vVXNlcklkXCI7XHJcbiAgICAgICAgICAgIGlzQ291bnQgJiYgdGVtcGxhdGVzLnB1c2godGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0NvdW50O1xyXG4gICAgICAgIH0pKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0IHsgc29ydEFycmF5T2ZFbnRpdGllcywgZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgSVJ1bGUge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGdyb3VwczogYW55W107XHJcbiAgICBjb25kaXRpb246IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUnVsZURlcGVuZGVuY2llcyB7XHJcbiAgICBkZXZpY2VzPzogYW55W107XHJcbiAgICB1c2Vycz86IGFueVtdO1xyXG4gICAgem9uZXM/OiBhbnlbXTtcclxuICAgIHpvbmVUeXBlcz86IGFueVtdO1xyXG4gICAgd29ya1RpbWVzPzogYW55W107XHJcbiAgICB3b3JrSG9saWRheXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM/OiBhbnlbXTtcclxuICAgIGRpYWdub3N0aWNzPzogYW55W107XHJcbn1cclxuXHJcbmNvbnN0IEFQUExJQ0FUSU9OX1JVTEVfSUQgPSBcIlJ1bGVBcHBsaWNhdGlvbkV4Y2VwdGlvbklkXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSdWxlc0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBjb21iaW5lZFJ1bGVzO1xyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUnVsZXM7XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRSdWxlcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSdWxlXCJcclxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZVJ1bGVzIChydWxlcykge1xyXG4gICAgICAgIHJldHVybiBzb3J0QXJyYXlPZkVudGl0aWVzKHJ1bGVzLCBbW1wiYmFzZVR5cGVcIiwgXCJkZXNjXCJdLCBcIm5hbWVcIl0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChydWxlcyk6IElSdWxlRGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzID0ge1xyXG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChjb25kaXRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpZCwgdHlwZTogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24uY29uZGl0aW9uVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSdWxlV29ya0hvdXJzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFmdGVyUnVsZVdvcmtIb3Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IChjb25kaXRpb24ud29ya1RpbWUgJiYgY29uZGl0aW9uLndvcmtUaW1lLmlkKSB8fCBjb25kaXRpb24ud29ya1RpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIndvcmtUaW1lc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRHJpdmVyXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRyaXZlciAmJiBjb25kaXRpb24uZHJpdmVyLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ1c2Vyc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRGV2aWNlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRldmljZSAmJiBjb25kaXRpb24uZGV2aWNlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkZXZpY2VzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbnRlcmluZ0FyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRXhpdGluZ0FyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiT3V0c2lkZUFyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSW5zaWRlQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLnpvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmUuaWQgfHwgY29uZGl0aW9uLnpvbmU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ6b25lc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZVR5cGUuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ6b25lVHlwZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRmlsdGVyU3RhdHVzRGF0YUJ5RGlhZ25vc3RpY1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBY3RpdmVPckluYWN0aXZlRmF1bHRcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRmF1bHRcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5kaWFnbm9zdGljKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kaWFnbm9zdGljLmlkIHx8IGNvbmRpdGlvbi5kaWFnbm9zdGljO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGlhZ25vc3RpY3NcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoZWNrQ29uZGl0aW9ucyA9IChwYXJlbnRDb25kaXRpb24sIGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMpOiBJUnVsZURlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29uZGl0aW9ucyA9IHBhcmVudENvbmRpdGlvbi5jaGlsZHJlbiB8fCBbXTtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMocGFyZW50Q29uZGl0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25kaXRpb25zLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBjb25kaXRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhjb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMoY29uZGl0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gcnVsZXMucmVkdWNlKChkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzLCBydWxlOiBJUnVsZSkgPT4ge1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMuZ3JvdXBzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLmdyb3VwcywgcnVsZS5ncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKSk7XHJcbiAgICAgICAgICAgIGlmIChydWxlLmNvbmRpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKHJ1bGUuY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSdWxlcygpXHJcbiAgICAgICAgICAgIC50aGVuKChzd2l0Y2hlZE9uUnVsZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRSdWxlcyA9IGVudGl0eVRvRGljdGlvbmFyeShzd2l0Y2hlZE9uUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlKHRoaXMuY29tYmluZWRSdWxlc1tBUFBMSUNBVElPTl9SVUxFX0lEXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSdWxlcyA9IHRoaXMuc3RydWN0dXJlUnVsZXMoT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAoa2V5ID0+IHRoaXMuY29tYmluZWRSdWxlc1trZXldKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UnVsZXNEYXRhIChydWxlc0lkczogc3RyaW5nW10pOiBJUnVsZVtdIHtcclxuICAgICAgICByZXR1cm4gcnVsZXNJZHMubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBleHRlbmRzIEdyb3Vwc0J1aWxkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgc3VwZXIoYXBpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFNlY3VyaXR5R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRTZWN1cml0eUdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKGdyb3VwcyA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IFV0aWxzLmV4dGVuZCh7fSwgdGhpcy50cmVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRoaXMudHJlZSkuZmlsdGVyKGdyb3VwID0+ICEhZ3JvdXAubmFtZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9O1xyXG59IiwiLy9hZGRlZCBieSBCcmV0dCB0byBtYW5hZ2UgYWRkaW5nIGFsbCB1c2VycyB0byB0aGUgZXhwb3J0IGFzIGFuIG9wdGlvblxyXG5cclxuZXhwb3J0IGNsYXNzIFVzZXJCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRVc2VycygpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRVc2VycyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJVc2VyXCJcclxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmludGVyZmFjZSBJQ2xhc3NDb250cm9sIHtcclxuICAgIGdldDogKCkgPT4gc3RyaW5nO1xyXG4gICAgc2V0OiAobmFtZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElFbnRpdHkge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG50eXBlIElTb3J0UHJvcGVydHkgPSBzdHJpbmcgfCBbc3RyaW5nLCBcImFzY1wiIHwgXCJkZXNjXCJdO1xyXG5cclxubGV0IGNsYXNzTmFtZUN0cmwgPSBmdW5jdGlvbiAoZWw6IEVsZW1lbnQpOiBJQ2xhc3NDb250cm9sIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSBcInN0cmluZ1wiID8gXCJjbGFzc05hbWVcIiA6IFwiYmFzZVZhbFwiO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsW3BhcmFtXSB8fCBcIlwiO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBlbFtwYXJhbV0gPSB0ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBpc1VzdWFsT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKS5pbmRleE9mKFwiT2JqZWN0XCIpICE9PSAtMTtcclxuICAgIH07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElIYXNoIHtcclxuICAgIFtpZDogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgaWYgKCFlbCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXHJcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpLFxyXG4gICAgICAgIG5ld0NsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjbGFzc0l0ZW0gPT4gY2xhc3NJdGVtICE9PSBuYW1lKTtcclxuICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChuZXdDbGFzc2VzLmpvaW4oXCIgXCIpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKTogdm9pZCB7XHJcbiAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcclxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIik7XHJcbiAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKG5hbWUpID09PSAtMSkge1xyXG4gICAgICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChjbGFzc2VzU3RyICsgXCIgXCIgKyBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzKGVsOiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGVsICYmIGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQoLi4uYXJnczogYW55W10pIHtcclxuICAgIHZhciBsZW5ndGggPSBhcmdzLmxlbmd0aCxcclxuICAgICAgICBzcmMsIHNyY0tleXMsIHNyY0F0dHIsXHJcbiAgICAgICAgZnVsbENvcHkgPSBmYWxzZSxcclxuICAgICAgICByZXNBdHRyLFxyXG4gICAgICAgIHJlcyA9IGFyZ3NbMF0sIGkgPSAxLCBqO1xyXG5cclxuICAgIGlmICh0eXBlb2YgcmVzID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgIGZ1bGxDb3B5ID0gcmVzO1xyXG4gICAgICAgIHJlcyA9IGFyZ3NbMV07XHJcbiAgICAgICAgaSsrO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKGkgIT09IGxlbmd0aCkge1xyXG4gICAgICAgIHNyYyA9IGFyZ3NbaV07XHJcbiAgICAgICAgc3JjS2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHNyY0tleXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgc3JjQXR0ciA9IHNyY1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgaWYgKGZ1bGxDb3B5ICYmIChpc1VzdWFsT2JqZWN0KHNyY0F0dHIpIHx8IEFycmF5LmlzQXJyYXkoc3JjQXR0cikpKSB7XHJcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXSA9IChpc1VzdWFsT2JqZWN0KHJlc0F0dHIpIHx8IEFycmF5LmlzQXJyYXkocmVzQXR0cikpID8gcmVzQXR0ciA6IChBcnJheS5pc0FycmF5KHNyY0F0dHIpID8gW10gOiB7fSk7XHJcbiAgICAgICAgICAgICAgICBleHRlbmQoZnVsbENvcHksIHJlc0F0dHIsIHNyY0F0dHIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzW3NyY0tleXNbal1dID0gc3JjW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlUb0RpY3Rpb25hcnkoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlDYWxsYmFjaz86IChlbnRpdHk6IGFueSkgPT4gYW55KTogSUhhc2gge1xyXG4gICAgdmFyIGVudGl0eSwgbyA9IHt9LCBpLFxyXG4gICAgICAgIGwgPSBlbnRpdGllcy5sZW5ndGg7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChlbnRpdGllc1tpXSkge1xyXG4gICAgICAgICAgICBlbnRpdHkgPSBlbnRpdGllc1tpXS5pZCA/IGVudGl0aWVzW2ldIDoge2lkOiBlbnRpdGllc1tpXX07XHJcbiAgICAgICAgICAgIG9bZW50aXR5LmlkXSA9IGVudGl0eUNhbGxiYWNrID8gZW50aXR5Q2FsbGJhY2soZW50aXR5KSA6IGVudGl0eTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRBcnJheU9mRW50aXRpZXMoZW50aXRpZXM6IGFueVtdLCBzb3J0aW5nRmllbGRzOiBJU29ydFByb3BlcnR5W10pOiBhbnlbXSB7XHJcbiAgICBsZXQgY29tcGFyYXRvciA9IChwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXM6IGFueVtdLCBpbmRleCA9IDApID0+IHtcclxuICAgICAgICBpZiAocHJvcGVydGllcy5sZW5ndGggPD0gaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBvcHRpb25zID0gcHJvcGVydGllc1tpbmRleF0sXHJcbiAgICAgICAgICAgIFtwcm9wZXJ0eSwgZGlyID0gXCJhc2NcIl0gPSBBcnJheS5pc0FycmF5KG9wdGlvbnMpID8gb3B0aW9ucyA6IFtvcHRpb25zXSxcclxuICAgICAgICAgICAgZGlyTXVsdGlwbGllcjogbnVtYmVyO1xyXG4gICAgICAgIGRpck11bHRpcGxpZXIgPSBkaXIgPT09IFwiYXNjXCIgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA+IG5leHRJdGVtW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gMSAqIGRpck11bHRpcGxpZXI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPCBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xICogZGlyTXVsdGlwbGllcjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXMsIGluZGV4ICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBlbnRpdGllcy5zb3J0KChwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlLCBzb3J0aW5nRmllbGRzKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZG93bmxvYWREYXRhQXNGaWxlKGRhdGE6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgbWltZVR5cGUgPSBcInRleHQvanNvblwiKSB7XHJcbiAgICBsZXQgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwge3R5cGU6IG1pbWVUeXBlfSksXHJcbiAgICAgICAgZWxlbTtcclxuICAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIHtcclxuICAgICAgICB3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZUJsb2IoYmxvYiwgZmlsZW5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIGVsZW0uaHJlZiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGVsZW0uZG93bmxvYWQgPSBmaWxlbmFtZTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgIGVsZW0uY2xpY2soKTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWVFbnRpdGllcyAoLi4uc291cmNlczogSUVudGl0eVtdW10pOiBJRW50aXR5W10ge1xyXG4gICAgbGV0IGFkZGVkSWRzOiBzdHJpbmdbXSA9IFtdLFxyXG4gICAgICAgIG1lcmdlZEl0ZW1zOiBJRW50aXR5W10gPSBbXTtcclxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4gc291cmNlLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5pZCAmJiBhZGRlZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICBhZGRlZElkcy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxuICAgIHJldHVybiBtZXJnZWRJdGVtcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVudGl0aWVzSWRzIChlbnRpdGllc0xpc3Q6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcclxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGVudGl0aWVzTGlzdCkgJiYgZW50aXRpZXNMaXN0LnJlZHVjZSgocmVzdWx0LCBlbnRpdHkpID0+IHtcclxuICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlc3VsdC5wdXNoKGVudGl0eS5pZCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sIFtdKSB8fCBbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlICguLi5zb3VyY2VzOiBzdHJpbmdbXVtdKTogc3RyaW5nW10ge1xyXG4gICAgbGV0IG1lcmdlZEl0ZW1zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XHJcbiAgICAgICAgQXJyYXkuaXNBcnJheShzb3VyY2UpICYmIHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICBpdGVtICYmIG1lcmdlZEl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xICYmIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBtZXJnZWRJdGVtcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXF1ZUVudGl0aWVzIChuZXdFbnRpdGllczogSUVudGl0eVtdLCBleGlzdGVkRW50aXRpZXM6IElFbnRpdHlbXSk6IElFbnRpdHlbXSB7XHJcbiAgICBsZXQgc2VsZWN0ZWRFbnRpdGllc0hhc2ggPSBlbnRpdHlUb0RpY3Rpb25hcnkoZXhpc3RlZEVudGl0aWVzKTtcclxuICAgIHJldHVybiBuZXdFbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgIXNlbGVjdGVkRW50aXRpZXNIYXNoW2VudGl0eS5pZF0gJiYgcmVzLnB1c2goZW50aXR5KTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSwgW10pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9nZXRoZXIocHJvbWlzZXM6IFByb21pc2U8YW55PltdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGxldCByZXN1bHRzID0gW10sXHJcbiAgICAgICAgcmVzdWx0c0NvdW50ID0gMDtcclxuICAgIHJlc3VsdHMubGVuZ3RoID0gcHJvbWlzZXMubGVuZ3RoO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBsZXQgcmVzb2x2ZUFsbCA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBwcm9taXNlcy5sZW5ndGggPyBwcm9taXNlcy5mb3JFYWNoKChwcm9taXNlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50Kys7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCA9PT0gcHJvbWlzZXMubGVuZ3RoICYmIHJlc29sdmVBbGwoKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlSW5kZXg6IGluZGV4XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkgOiByZXNvbHZlQWxsKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVkUHJvbWlzZTxUPiAodmFsPzogVCk6IFByb21pc2U8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KHJlc29sdmUgPT4gcmVzb2x2ZSh2YWwpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkgKGRhdGEpIHtcclxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXTtcclxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhaXRpbmcge1xyXG5cclxuICAgIHByaXZhdGUgd2FpdGluZ0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGJvZHlFbDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xyXG5cclxuICAgIHB1YmxpYyBzdGFydChlbDogSFRNTEVsZW1lbnQgPSB0aGlzLmJvZHlFbCwgekluZGV4PzogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGVsLm9mZnNldFBhcmVudCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwid2FpdGluZ1wiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J2ZhZGVyJz48L2Rpdj48ZGl2IGNsYXNzPSdzcGlubmVyJz48L2Rpdj5cIjtcclxuICAgICAgICBlbC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUud2lkdGggPSBlbC5vZmZzZXRXaWR0aCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS50b3AgPSBlbC5vZmZzZXRUb3AgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBlbC5vZmZzZXRMZWZ0ICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gICAgICAgIHR5cGVvZiB6SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS56SW5kZXggPSB6SW5kZXgudG9TdHJpbmcoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBzdG9wICgpIHtcclxuICAgICAgICBpZiAodGhpcy53YWl0aW5nQ29udGFpbmVyICYmIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSIsIi8vYWRkZWQgYnkgQnJldHQgdG8gbWFuYWdlIGFkZGluZyBhbGwgem9uZXMgdG8gdGhlIGV4cG9ydCBhcyBhbiBvcHRpb25cclxuXHJcbmV4cG9ydCBjbGFzcyBab25lQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZmlsbHMgdGhlIHVzZXIgYnVpbGRlciB3aXRoIGFsbCB1c2Vyc1xyXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0Wm9uZXMoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Wm9uZXMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiWm9uZVwiXHJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSJdfQ==
