import {
  Plugin,
  showMessage,
  Dialog, //TODO: not using SvelteDialog, use this one instead
  Menu,
  getFrontend,
  IModel,

} from "siyuan";
import "@/index.scss";

import { SettingUtils } from "./libs/setting-utils";
import { svelteDialog } from "./libs/dialog";

const STORAGE_NAME = "menu-config";

export default class PluginSample extends Plugin {
  customTab: () => IModel;
  private isMobile: boolean;
  private settingUtils: SettingUtils;

  async onload() {
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    console.log("loading plugin-sample", this.i18n);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
    });

    // this.loadData(STORAGE_NAME);
    this.settingUtils.load();

    this.settingUtils.addItem({
      key: "customCssForMarketplaceMobileView",
      value: "",
      type: "textarea",
      title: "Custom CSS for Marketplace Mobile View",
      description: "Input description",
    });
    // this.settingUtils.addItem({
    //   key: "ifShowTopBarIconOnDesktopView",
    //   value: true,
    //   type: "checkbox",
    //   title: "Show top bar icon on desktop view",
    //   description: "Check description",
    // });

    this.settingUtils.addItem({
      key: "Hint",
      value: "",
      type: "hint",
      title: this.i18n.hintTitle,
      description: this.i18n.hintDesc,
    });

    try {
      this.settingUtils.load();
    } catch (error) {
      console.error(
        "Error loading settings storage, probably empty config json:",
        error
      );
    }

    console.log(this.settingUtils.get("ifShowTopBarIconOnDesktopView"));

    const topBarElement = this.addTopBar({
      icon: "iconBazaar",
      title: "Marketplace",
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          // 如果被隐藏，则使用更多按钮
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
      },
    });
  }

  onLayoutReady() {}

  async onunload() {}

  uninstall() {}

  private showMarketplace() {
    svelteDialog({
      title: `SiYuan Marketplace`,
      width: this.isMobile ? "100vw" : "50vw",
      height: this.isMobile ? "100vh" : "80vh",
      constructor: (container: HTMLElement) => {
        // div for iframe
        const iframeContainer = document.createElement("div");
        iframeContainer.style.cssText =
          "width: 100%; height: 100%; overflow: hidden;";

        const iframe = document.createElement("iframe");
        iframe.src = "http://127.0.0.1:6806/stage/build/desktop/"; //TODO: try to fetch the instance port
        iframe.style.cssText = "width: 100%; height: 100%; border: none;";

        iframe.onload = () => {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;

          // injefct css
          const customStyle = document.createElement("style");
          customStyle.textContent = `
                        /* the setting dialog*/
                        div[data-key="dialog-setting"] .b3-dialog__container {
                            width: 100vw !important;
                            height: 100vh !important;
                            max-width: 1280px !important;
                        }

                        /* the side bar of setting dialog*/
                        .b3-tab-bar.b3-list.b3-list--background{
                            display: none !important;
                        }

                        /* card opt: layout*/
                        .b3-card {
                            display: flex;
                            flex-direction: column;
                        }

                        .b3-card__img {
                            display: none !important;
                        }

                        .fn__flex-1 {
                            display: inline-block;
                            vertical-align: top;
                        }

                        .b3-card__actions {
                            margin-top: 10px;
                            display: flex;
                            justify-content: flex-end;
                        }

                        .item__main {
                            display: none !important;
                        }
                    `;

          customStyle.textContent += this.settingUtils.get(
            "customCssForMarketplaceMobileView"
          );
          iframeDoc.head.appendChild(customStyle);

          // i know i know this is a work around, idk how to trigger the setting dialog
          const clickSequence = async () => { // go settings
            try {
              const workspaceBtn = await waitForElement(
                iframeDoc,
                "#barWorkspace"
              );
              workspaceBtn.click();
              console.log("Clicked workspace button");

              const configBtn = await waitForElement(
                iframeDoc,
                'button[data-id="config"]'
              );
              configBtn.click();
              console.log("Clicked config button");

              const bazaarLi = await waitForElement(
                iframeDoc,
                'li[data-name="bazaar"]'
              );
              bazaarLi.click();
              console.log("Clicked bazaar li");
            } catch (error) {
              console.error("Error during click sequence:", error);
            }
          };

          // wait for element appear helper
          const waitForElement = (
            doc: Document,
            selector: string,
            timeout = 5000
          ): Promise<HTMLElement> => {
            return new Promise((resolve, reject) => {
              const element = doc.querySelector(selector);
              if (element) {
                resolve(element as HTMLElement);
                return;
              }

              const observer = new MutationObserver(() => {
                const element = doc.querySelector(selector);
                if (element) {
                  observer.disconnect();
                  resolve(element as HTMLElement);
                }
              });

              observer.observe(doc.body, {
                childList: true,
                subtree: true,
              });

              setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for element: ${selector}`));
              }, timeout);
            });
          };

          // i know i know this is a work around, idk how to trigger the setting dialog
          clickSequence();
        };

        // append
        iframeContainer.appendChild(iframe);
        container.appendChild(iframeContainer);

        return null; //this is a work around, this will pop out a err but harmless, idk how to use SvelteDialog
      },
    });
  }

  private showDesktopView() {
    svelteDialog({
      title: `SiYuan Desktop View`,
      width: this.isMobile ? "100vw" : "50vw",
      height: this.isMobile ? "100vh" : "80vh",
      constructor: (container: HTMLElement) => {
        const iframeContainer = document.createElement("div");
        iframeContainer.style.cssText =
          "width: 100%; height: 100%; overflow: hidden;";

        const iframe = document.createElement("iframe");
        iframe.src = "http://127.0.0.1:6806/stage/build/desktop/";
        iframe.style.cssText = "width: 100%; height: 100%; border: none;";

        // append
        iframeContainer.appendChild(iframe);
        container.appendChild(iframeContainer);

        return null; //this is a work around, this will pop out a err but harmless, idk how to use SvelteDialog
      },
    });
  }

  private showMobileView() {
    svelteDialog({
      title: `SiYuan Mobile View`,
      width: this.isMobile ? "100vw" : "50vw",
      height: this.isMobile ? "100vh" : "80vh",
      constructor: (container: HTMLElement) => {
        const iframeContainer = document.createElement("div");
        iframeContainer.style.cssText =
          "width: 100%; height: 100%; overflow: hidden;";

        const iframe = document.createElement("iframe");
        iframe.src = "http://127.0.0.1:6806/stage/build/mobile/";
        iframe.style.cssText = "width: 100%; height: 100%; border: none;";

        // append
        iframeContainer.appendChild(iframe);
        container.appendChild(iframeContainer);

        return null; //this is a work around, this will pop out a err but harmless, idk how to use SvelteDialog
      },
    });
  }

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("topBarSample", () => {
      console.log(this.i18n.byeMenu);
    });
    menu.addItem({
      icon: "iconBazaar",
      label: "Marketplace",
      click: () => {
        this.showMarketplace();
      },
    });

    menu.addItem({
      icon: "iconDock", // sorry too lazy to do svg
      label: "Desktop View",
      click: () => {
        this.showDesktopView();
      },
    });

    menu.addItem({
      icon: "iconLayout", // sorry too lazy to do svg
      label: "Mobile View",
      click: () => {
        this.showMobileView();
      },
    });

    menu.addSeparator();

    menu.addItem({
      icon: "iconBug",
      label:
        "not sure if close dialog would clean up things, better reload after you use these things",
      type: "readonly",
    });
    menu.addItem({
      icon: "iconRefresh",
      label: "Reload",
      click: () => {
        window.location.reload();
      },
    });

    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
}
