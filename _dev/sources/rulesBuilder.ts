/// <reference path="../bluebird.d.ts"/>
import {sortArrayOfEntities, entityToDictionary, mergeUnique} from "./utils";

interface IRule {
    id: string;
    groups: any[];
    condition: any;
}

export interface IRuleDependencies {
    devices?: any[];
    users?: any[];
    zones?: any[];
    zoneTypes?: any[];
    workTimes?: any[];
    workHolidays?: any[];
    groups?: any[];
    securityGroups?: any[];
    diagnostics?: any[];
}

const APPLICATION_RULE_ID = "RuleApplicationExceptionId";

export default class RulesBuilder {
    private api;
    private currentTask;
    private combinedRules;
    private structuredRules;

    constructor(api) {
        this.api = api;
    }

    private getRules (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "Rule",
            }, resolve, reject);
        });
    };

    private structureRules (rules) {
        return sortArrayOfEntities(rules, [["baseType", "desc"], "name"]);
    };

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    public getDependencies (rules): IRuleDependencies {
        let dependencies = {
                devices: [],
                users: [],
                zones: [],
                zoneTypes: [],
                workTimes: [],
                groups: [],
                diagnostics: []
            },
            processDependencies = (condition) => {
                let id, type: string;
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
                        } else {
                            id = condition.zoneType.id;
                            type = "zoneTypes";
                        }
                        break;
                    case "FilterStatusDataByDiagnostic":
                        id = condition.diagnostic.id || condition.diagnostic;
                        type = "diagnostics";
                        break;
                }
                id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
            },
            checkConditions = (parentCondition, dependencies: IRuleDependencies): IRuleDependencies => {
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
        return rules.reduce((dependencies: IRuleDependencies, rule: IRule) => {
            dependencies.groups = mergeUnique(dependencies.groups, rule.groups.map(group => group.id));
            dependencies = checkConditions(rule.condition, dependencies);
            return dependencies;
        }, dependencies);
    };

    public fetch(): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then((switchedOnRules) => {
                this.combinedRules = entityToDictionary(switchedOnRules);
                delete(this.combinedRules[APPLICATION_RULE_ID]);
                this.structuredRules = this.structureRules(Object.keys(this.combinedRules).map(key => this.combinedRules[key]));
                return Object.keys(this.combinedRules).map(ruleId => this.combinedRules[ruleId]);
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    };

    public getRulesData (rulesIds: string[]): IRule[] {
        return rulesIds.map(ruleId => this.combinedRules[ruleId]);
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}