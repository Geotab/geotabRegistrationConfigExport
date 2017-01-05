/// <reference path="../bluebird.d.ts"/>
import {entityToDictionary, mergeUnique} from "./utils";

interface IDistributionList {
    id: string;
    name: string;
    recipients: any[];
    rules: any[];
}

export interface IDistributionListDependencies {
    rules?: any[];
    users?: any[];
    notificationTemplates?: any[];
    groups?: any[];
}

const AVAILABLE_RECIPIENT_TYPES = [
    "AssignToGroup",
    "BeepTenTimesRapidly",
    "BeepTenTimesRapidlyAllowDelay",
    "BeepThreeTimes",
    "BeepThreeTimesAllowDelay",
    "BeepThreeTimesRapidly",
    "BeepThreeTimesRapidlyAllowDelay",
    "ChangeStatus",
    "Email",
    "LogOnly",
    "LogPopup",
    "LogUrgentPopup",
    "TextMessage",
    "TextToSpeech",
    "TextToSpeechAllowDelay",
    "WebRequest"
];

export default class DistributionListsBuilder {
    private api;
    private currentTask;
    private distributionLists;
    private notificationTemplates;

    constructor(api) {
        this.api = api;
    }

    private getDistributionListsData (): Promise<any> {
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
    };

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    // Remove recipients that are not in allowed recipients list
    private filterRecipients (distributionLists: IDistributionList[]) {
        return distributionLists.map((listItem: IDistributionList) => {
            listItem.recipients = listItem.recipients.filter((recipient) => AVAILABLE_RECIPIENT_TYPES.indexOf(recipient.recipientType) > -1);
            return listItem;
        });
    }

    public getDependencies (distributionLists): IDistributionListDependencies {
        let dependencies: IDistributionListDependencies = {
                rules: [],
                users: [],
                groups: [],
                notificationTemplates: []
            },
            processDependencies = (recipient) => {
                let id, type: string,
                    userId = recipient.user.id;
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
            },
            checkRecipients = (recipients, dependencies: IDistributionListDependencies): IDistributionListDependencies => {
                return recipients.reduce((dependencies, recipient) => {
                    processDependencies(recipient);
                    return dependencies;
                }, dependencies);
            };
        return distributionLists.reduce((dependencies: IDistributionListDependencies, distributionList: IDistributionList) => {
            dependencies.rules = mergeUnique(dependencies.rules, distributionList.rules.map(rule => rule.id));
            dependencies = checkRecipients(distributionList.recipients, dependencies);
            return dependencies;
        }, dependencies);
    };

    public fetch(): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getDistributionListsData()
            .then(([distributionLists, webTemplates, emailTemplates, textTemplates]) => {
                this.distributionLists = entityToDictionary(this.filterRecipients(distributionLists));
                this.notificationTemplates = entityToDictionary(webTemplates.concat(emailTemplates).concat(textTemplates));
                return this.distributionLists;
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    };

    public getNotificationTemplateData (templateId: string): any {
        return this.notificationTemplates[templateId];
    };

    public getRulesDistributionLists (rulesIds: string[]): IDistributionList[] {
        return Object.keys(this.distributionLists).reduce((res, id) => {
            let list = this.distributionLists[id];
            list.rules.some(listRule => rulesIds.indexOf(listRule.id) > -1) && res.push(list);
            return res;
        }, []);
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}