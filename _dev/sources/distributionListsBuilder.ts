/// <reference path="../bluebird.d.ts"/>
import {entityToDictionary, mergeUnique} from "./utils";

//A distribution list links a set of Rule(s) to a set of Recipient(s). When a Rule is violated each related Recipient will receive a notification of the kind defined by its RecipientType.
interface IDistributionList {
    id: string;
    name: string;
    recipients: any[];
    rules: any[];
}

export interface IDistributionListDependencies {
    rules: any[];
    users: any[];
    notificationTemplates: any[];
    groups: any[];
}

export default class DistributionListsBuilder {
    private api;
    private currentTask;
    private distributionLists: Record<string, IDistributionList>;
    private notificationTemplates;

    constructor(api) {
        this.api = api;
    }

    //A distribution list links a set of Rule(s) to a set of Recipient(s). When a Rule is violated each related Recipient will receive a notification of the kind defined by its RecipientType.
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

    public getDependencies (distributionLists): IDistributionListDependencies {
        let dependencies: IDistributionListDependencies = {
                rules: [],
                users: [],
                groups: [],
                notificationTemplates: []
            },
            processDependencies = (recipient) => {
                let id: string | undefined = undefined;
                let type: string | undefined = undefined;
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
                this.distributionLists = entityToDictionary(distributionLists);
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
        return Object.keys(this.distributionLists).reduce((res: IDistributionList[], id) => {
            let list = this.distributionLists[id];
            list.rules.some(listRule => rulesIds.indexOf(listRule.id) > -1) && res.push(list);
            return res;
        }, []);
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}