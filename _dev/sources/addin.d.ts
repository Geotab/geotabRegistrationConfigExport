interface IIdEntity {
    id: string;
}

interface INamedEntity extends IIdEntity {
    name: string;
}

interface ILeafGroupFilterCondition extends IIdEntity {
    groupId: string;
}

interface IBranchFilterCondition extends IIdEntity {
    groupFilterConditions: (IBranchFilterCondition | ILeafGroupFilterCondition)[];
}

type TGroupFilterCondition = IBranchFilterCondition | ILeafGroupFilterCondition;
interface IGroupFilter extends INamedEntity {
    groupFilterCondition: TGroupFilterCondition;
}