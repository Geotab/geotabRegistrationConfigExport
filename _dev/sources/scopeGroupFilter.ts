/// <reference path="../bluebird.d.ts"/>

const enum RelationOperator {
    "AND" = "And",
    "OR" = "Or"
}

interface IOutputIdEntity {
    groupId: string;
}

interface IGroupListStateOutput<T extends IOutputIdEntity = IOutputIdEntity> {
    relation: RelationOperator;
    groupFilterConditions: (T | IGroupListStateOutput<T>)[];
}

export interface IScopeGroupFilter extends IIdEntity {
    groupFilterCondition: IGroupListStateOutput | IOutputIdEntity;
    name?: string;
    comment?: string;
}

export const getScopeGroupFilterById = (id: string, api): Promise<IScopeGroupFilter> => {
    return new Promise((resolve, reject) => {
        api.call("Get", {
            typeName: "GroupFilter",
            search: { id }
        }, resolve, reject);
    });
}

export const isFilterState = <T, U>(item: IGroupListStateOutput | IOutputIdEntity): item is IGroupListStateOutput => item && (item as IGroupListStateOutput).relation !== undefined;

export const getFilterStateUniqueGroups = (state: IGroupListStateOutput | IOutputIdEntity) => {
    let groupIds: string[] = [];
    const processItem = (item:IGroupListStateOutput, prevRes = [] as IIdEntity[]): IIdEntity[] => {
        return item.groupFilterConditions.reduce((res, childItem) => {
            if (isFilterState(childItem)) {
                return processItem(childItem, res);
            }
            let id = childItem.groupId;
            groupIds.indexOf(id) === -1 && res.push({ id });
            groupIds.push(id);
            return res;
        }, prevRes);
    };
    return isFilterState(state) ? processItem(state) : [{ id: state.groupId }];
};