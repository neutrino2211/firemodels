// import ora from "ora";
const ora = require("ora");
import * as color from "colors";

const green = color.green;
const red = color.red;
const bold = color.bold

export type Test = {runner: () => boolean | Promise<boolean>, name: string, description: string};
export class TestGroup {
    name: string = "";
    tests: Test[] = []

    constructor(name?: string, tests?: Test[]) {
        this.name = name || "";
        this.tests = this.tests || tests;
    }

    add(test: Test): TestGroup {
        this.tests.push(test);
        return this;
    }
};

export function createTest(name: string, description: string, runner: () => boolean | Promise<boolean>): Test {
    return {
        runner,
        name,
        description
    }
};

export class TestRunner {
    private tests: TestGroup[] = [];
    private defaultTestGroup: TestGroup = new TestGroup("Tests")
    constructor(private files?: boolean) {};

    private async testGroup(group: TestGroup) {
        const groupSpinner = ora(bold(group.name));
        console.log()
        let aTestFailed =  false;
        for (let test of group.tests) {
            const old_log = console.log;
            let s = "";
            console.log = (...data) => {
                s += data.map(d => JSON.stringify(d, undefined, "\t")).join(" ") + "\n";
            }
            const spinner = ora(`${bold(green(test.name))}: ${bold(test.description)}`);
            spinner.start()
            let r;
            const timer = Date.now()
            try { 
                r = test.runner();

                if (r["then"]) r = await r;
            } catch (e) {
                spinner.text = `${bold(red(test.name))}: ${bold(test.description)} (${Date.now() - timer}ms)`
                spinner.fail()
                aTestFailed = true;
                old_log(`Error: ${e}`)
                console.error(e)
                break
            }

            if (r) {
                spinner.text = `${bold(green(test.name))}: ${bold(test.description)} (${Date.now() - timer}ms)`;
                spinner.succeed()
            } else {
                spinner.text = `${bold(red(test.name))}: ${bold(test.description)} (${Date.now() - timer}ms)`
                spinner.fail()
                aTestFailed = true;
            };

            console.log = old_log;
            console.log(s);
        }
        groupSpinner.start();
        (aTestFailed ? groupSpinner.fail() : groupSpinner.succeed())
    }

    test(test: string | Test): TestRunner {
        const t = typeof test;
        if (this.files && t == "string") {
            import(test as any).then((mod: Test) => {
                this.defaultTestGroup.tests.push(mod);
            });
        } else if (!this.files && t == "object") {
            this.defaultTestGroup.tests.push(test as Test)
        } else {
            throw new Error(`Can't not use a(n) ${t} test while the files variable is ${this.files}`);
        }

        return this
    }

    group(group: TestGroup): TestRunner {
        this.tests.push(group);
        return this;
    }

    async execute(group?: string) {

        if(group) {
            const groups = group.split(":");
            for (const group of this.tests) {
                if (groups.indexOf(group.name) > -1) await this.testGroup(group);
            }
            return
        }

        if (this.defaultTestGroup.tests.length > 0) {
            await this.testGroup(this.defaultTestGroup);
        } else {
            for (const group of this.tests) {
                await this.testGroup(group);
            }
        }
    }
}