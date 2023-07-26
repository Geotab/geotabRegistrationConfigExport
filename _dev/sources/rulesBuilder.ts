/// <reference path="../bluebird.d.ts"/>
/// <reference path="addin.d.ts"/>
import { sortArrayOfEntities, entityToDictionary, mergeUnique } from "./utils";

interface IRule extends IIdEntity {
    groups: any[];
    condition: any;
}

export interface IRuleDependencies {
    devices: any[];
    users: any[];
    zones: any[];
    zoneTypes: any[];
    workTimes: any[];
    workHolidays: any[];
    groups: any[];
    securityGroups: any[];
    diagnostics: any[];
}

const APPLICATION_RULE_ID = "RuleApplicationExceptionId";

export default class RulesBuilder {
    private readonly api;
    private currentTask;
    private combinedRules;

    private getRuleDiagnosticsString (rule: IRule) {
        return this.getDependencies([rule]).diagnostics.sort().join();
    }

    private getRules (): Promise<IRule[]> {
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
            ], ([allRules, materialManagementRules]: [IRule[], IRule[]]) => {
                // To get correct Service groups we need to update material management stock rules' groups from groups property of the corresponding rule with RouteBasedMaterialMgmt baseType
                // The only possible method now to match Stock rule and rule with RouteBasedMaterialMgmt baseType is to match their diagnostics
                const mmRulesGroups = materialManagementRules.reduce((res: Record<string, IIdEntity[]>, mmRule) => {
                    const mmRuleDiagnostics = this.getRuleDiagnosticsString(mmRule);
                    res[mmRuleDiagnostics] = mmRule.groups;
                    return res;
                }, {});
                return resolve(allRules.map(rule => {
                    const mmRuleDiagnostics = this.getRuleDiagnosticsString(rule);
                    const correspondingMMRuleGroups = mmRulesGroups[mmRuleDiagnostics];
                    return correspondingMMRuleGroups ? { ...rule, groups: correspondingMMRuleGroups } : rule;
                }))
            }, reject);
        });
    }

    private structureRules (rules) {
        return sortArrayOfEntities(rules, [["baseType", "desc"], "name"]);
    }

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    constructor(api) {
        this.api = api;
    }

    public getDependencies (rules: IRule[]): IRuleDependencies {
        let dependencies: IRuleDependencies = {
                devices: [],
                users: [],
                zones: [],
                zoneTypes: [],
                workTimes: [],
                workHolidays: [],
                groups: [],
                diagnostics: [],
                securityGroups: []
            },
            processDependencies = (condition) => {
                let id: string | undefined = undefined;
                let type: string | undefined = undefined;
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
            if (rule.condition) {
                dependencies = checkConditions(rule.condition, dependencies);
            }
            return dependencies;
        }, dependencies);
    }

    public fetch(): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then((switchedOnRules) => {
                this.combinedRules = entityToDictionary(switchedOnRules);
                delete(this.combinedRules[APPLICATION_RULE_ID]);
                return Object.keys(this.combinedRules).map(ruleId => this.combinedRules[ruleId]);
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    }

    public getRulesData (rulesIds: string[]): IRule[] {
        return rulesIds.map(ruleId => this.combinedRules[ruleId]);
    }

    public unload (): void {
        this.abortCurrentTask();
    }
}