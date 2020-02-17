//added by Brett to manage adding all users to the export as an option

export class UserBuilder {
    private readonly api;
    private currentTask;

    constructor(api) {
        this.api = api;
    }

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    //fills the user builder with all users
    fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getUsers()
        return this.currentTask;
    }

    private getUsers (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "User"
            }, resolve, reject);
        });
    }

    unload (): void {
        this.abortCurrentTask();
    }
}