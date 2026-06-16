import { multiCall } from "./utils";

interface IClientSettings {
    id: string;
    pinnedMenuItems: any[];
}

export class ClientSettingsBuilder {
    private readonly api;
    private abortController: { abort?: () => void } = {};

    constructor(api) {
        this.api = api;
    }

    fetch(userIds: string[]): Promise<IClientSettings[]> {
        if (!userIds.length) {
            return Promise.resolve([]);
        }
        const calls: [string, any][] = userIds.map((id) => [
            "Get",
            {
                typeName: "ClientSettings",
                search: { id }
            }
        ]);
        this.abortController = {};
        const promise = multiCall(this.api, calls).then((results) => {
            return results.reduce(
                (acc: IClientSettings[], result: any[], index: number) => {
                    const settings = Array.isArray(result) ? result[0] : result;
                    const pinnedMenuItems: any[] = settings?.pinnedMenuItems ?? [];
                    if (pinnedMenuItems.length > 0) {
                        acc.push({ id: userIds[index], pinnedMenuItems });
                    }
                    return acc;
                },
                [],
            );
        });
        return promise;
    }

    unload(): void {
        this.abortController.abort && this.abortController.abort();
        this.abortController = {};
    }
}
