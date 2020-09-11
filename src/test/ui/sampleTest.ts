import { ActivityBar, VSBrowser} from "vscode-extension-tester";
import { DialogHandler } from "vscode-extension-tester-native";
import { expect } from "chai";
import { rmdirSync, mkdir, readdirSync } from "fs";
import * as path from "path";

describe("Sample browser basic tests", () => {
    let browser: VSBrowser;
    let activityBar: ActivityBar;
    let samplePath: string;

    before(async () => {
        activityBar = new ActivityBar();
        browser = VSBrowser.instance;
        samplePath = path.join(process.cwd(), 'test-data', 'sample_dir');

        mkdir(samplePath, {recursive: true}, (err: any) => {
            if (err) { throw err; }
        });
    });

    it("Sample plugin should be available", async () => {
        const sampleBrowser = await activityBar
            .getViewControl("Intel oneAPI")
            .wait();
        expect(sampleBrowser).not.undefined;
    });

    it("Create Vector Add sample", async function () {
        this.timeout(62000);

        const view = await activityBar
            .getViewControl("Intel oneAPI")
            .openView();

        const content = await view.getContent().wait();
        const sections = await content.getSections();
        const section = sections[0]; // Get top section

        await browser.driver.wait(async () => {
            const items = await section.getVisibleItems();
            return items.length > 0;
        }, 40000);

        await section.expand();
        const itemGetStart = await section.findItem('Get Started');
        await itemGetStart?.select();
        const itemVectorAdd = await section.findItem('Vector Add');
        await itemVectorAdd?.select();

        const menu = await itemVectorAdd?.openContextMenu();

        await menu?.select('Create');
        const dialog = await DialogHandler.getOpenDialog();
        await dialog.selectPath(samplePath);
        await dialog.confirm();

        await browser.driver.sleep(1000);
        expect(readdirSync(samplePath).length).to.not.equal(0);
    });

    after(() => {
        rmdirSync(samplePath, { recursive: true });
    });
});
