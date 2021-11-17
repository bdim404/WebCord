import { appInfo } from "../modules/client";
import { AppConfig, WinStateKeeper } from "../modules/config";
import { app, BrowserWindow, Tray, net, nativeImage, ipcMain } from "electron";
import * as getMenu from '../modules/menu';
import { packageJson, discordFavicons } from '../../global';
import { discordContentSecurityPolicy } from '../modules/csp';
import l10n from "../../modules/l10n";
import { getUserAgent } from '../../modules/agent';
import { createHash } from 'crypto';
import { resolve } from "path";


const configData = new AppConfig();

export default function createMainWindow(startHidden: boolean, l10nStrings: l10n["client"]): BrowserWindow {

    // Some variable declarations

    let tray: Promise<Tray>;

    // Check the window state

    const mainWindowState = new WinStateKeeper('mainWindow');

    // Browser window

    const win = new BrowserWindow({
        title: app.getName(),
        minWidth: appInfo.minWinWidth,
        minHeight: appInfo.minWinHeight,
        height: mainWindowState.initState.height,
        width: mainWindowState.initState.width,
        backgroundColor: "#36393F",
        icon: appInfo.icon,
        show: false,
        webPreferences: {
            preload: app.getAppPath() + "/sources/app/renderer/preload/main.js",
            nodeIntegration: false,
            devTools: true, // Too usefull to be blocked.
        }
    });
    win.webContents.on('did-fail-load', (_event, errorCode) => {
        if (errorCode !== -106) return;
        win.loadFile(resolve(app.getAppPath(), 'sources/assets/web/html/404.html'));
        const retry = setInterval(() => {
            if (retry && net.isOnline()) {
                clearTimeout(retry);
                win.loadURL(appInfo.URL, { userAgent: getUserAgent(process.versions.chrome) });
            }
        }, 1000);
    });
    win.webContents.once('did-finish-load', () => {
        if (!startHidden) win.show();
        setTimeout(() => win.loadURL(appInfo.URL, { userAgent: getUserAgent(process.versions.chrome) }), 1500);
    });
    if (mainWindowState.initState.isMaximized) win.maximize();

    // CSP

    if (configData.get().csp.enabled) {
        win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [discordContentSecurityPolicy]
                }
            });
        });
    }

    win.webContents.session.webRequest.onBeforeRequest(
        {
            urls: [
                'https://discord.com/api/*/science',
                'https://discord.com/api/*/channels/*/typing',
                'https://discord.com/api/*/track'
            ]
        },
        (details, callback) => {

            const configData = (new AppConfig()).get();
            const cancel = configData.blockApi.science || configData.blockApi.typingIndicator;
            const url = new URL(details.url);

            if (cancel) console.debug('[API] Blocking ' + url.pathname);

            if (url.pathname.endsWith('/science') || url.pathname.endsWith('/track'))
                callback({ cancel: configData.blockApi.science });
            else if (url.pathname.endsWith('/typing'))
                callback({ cancel: configData.blockApi.typingIndicator });
            else
                callback({ cancel: false });

        },
    );

    // (Device) permissions check/request handlers:
    {
        type permissionObject = ReturnType<AppConfig["get"]>["permissions"]
        /** List of domains, urls or protocols accepted by permission handlers. */
        const trustedURLs = [
            appInfo.rootURL,
            'devtools://'
        ];
        win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
            let websiteURL: string;
            switch (permission) {
                case "display-capture":
                case "notifications":
                case "media":
                        if(Object.prototype.hasOwnProperty.call(configData.get().permissions, permission))
                            return (configData.get().permissions)[permission as keyof permissionObject]
                    break;
                default:
                    return false;
            }
            (webContents !== null && webContents.getURL() !== "") ? websiteURL = webContents.getURL() : websiteURL = requestingOrigin;
            // In some cases URL might be empty string, it should be denied then for that reason.
            if (websiteURL === "")
                return false;
            const originURL = new URL(websiteURL).origin;
            for (const secureURL of trustedURLs) {
                if (originURL.startsWith(secureURL)) {
                    return true;
                }
            }
            console.warn(`[${l10nStrings.dialog.common.warning.toLocaleUpperCase()}] ${l10nStrings.dialog.permission.check.denied}`, originURL, permission);
            return false;
        });
        win.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
            for (const secureURL of trustedURLs) {
                if (new URL(webContents.getURL()).origin !== new URL(secureURL).origin) {
                    return callback(false);
                }
                switch (permission) {
                    case "media":{
                        if(details.mediaTypes === undefined) break;
                        let callbackValue = true
                        for(const type of details.mediaTypes)
                            callbackValue = callbackValue &&
                                configData.get().permissions[type];
                        return callback(callbackValue);
                    }
                    case "display-capture":
                    case "notifications":
                    case "fullscreen":
                        return callback(configData.get().permissions[permission]);
                    default:
                        return callback(false);
                }
            }
            console.warn('[' + l10nStrings.dialog.common.warning.toLocaleUpperCase() + '] ' + l10nStrings.dialog.permission.request.denied, webContents.getURL(), permission);
            return callback(false);
        });
        win.webContents.session.setDevicePermissionHandler(() => false);
    }
    win.loadFile(resolve(app.getAppPath(), 'sources/assets/web/html/load.html'));
    win.setAutoHideMenuBar(configData.get().hideMenuBar);
    win.setMenuBarVisibility(!configData.get().hideMenuBar);
    // Add English to the spellchecker
    {
        let valid = true;
        const spellCheckerLanguages = [app.getLocale(), 'en-US'];
        if (app.getLocale() === 'en-US') valid = false;
        if (valid && process.platform !== 'darwin')
            for (const language in spellCheckerLanguages)
                if (!win.webContents.session.availableSpellCheckerLanguages.includes(language))
                    valid = false;
        if (valid) win.webContents.session.setSpellCheckerLanguages(spellCheckerLanguages);
    }

    // Keep window state

    mainWindowState.watchState(win);

    // Load all menus:

    getMenu.context(win);
    if (!configData.get().disableTray) tray = getMenu.tray(win);
    getMenu.bar(packageJson.repository.url, win);

    // "Red dot" icon feature
    let setFavicon: string | undefined;
    win.webContents.once('did-finish-load', () => {
        win.webContents.on('page-favicon-updated', async (_event, favicons) => {
            const t = await tray;
            // Convert from DataURL to RAW.
            const faviconRaw = nativeImage.createFromDataURL(favicons[0]).toBitmap();
            // Hash discord favicon.
            const faviconHash = createHash('sha1').update(faviconRaw).digest('hex');
            // Stop execution when icon is same as the one set.
            if (faviconHash === setFavicon) return;

            // Compare hashes.
            if (!configData.get().disableTray) switch (faviconHash) {
                case discordFavicons.default:
                case discordFavicons.unread[0]:
                case discordFavicons.unread[1]:
                    setFavicon = faviconHash;
                    t.setImage(appInfo.trayIcon);
                    win.flashFrame(false);
                    break;
                default:
                    setFavicon = faviconHash;
                    t.setImage(appInfo.trayPing);
                    win.flashFrame(true);
            }
        });
    });

    // Window Title

    win.on('page-title-updated', (event: Event, title: string) => {
        if (title === "Discord") {
            event.preventDefault();
            win.setTitle(app.getName());
        }
    });

    // Animate menu

    win.webContents.on('did-finish-load', () => {
        win.webContents.insertCSS(".sidebar-2K8pFh{ transition: width .1s cubic-bezier(0.4, 0, 0.2, 1);}");
    });

    // Inject desktop capturer
    ipcMain.on('api-exposed', (_event, api) => {
        const functionString = `
            navigator.mediaDevices.getDisplayMedia = async () => {
                return navigator.mediaDevices.getUserMedia(await window['${api}'].desktopCapturerPicker())
            }
        `;
        win.webContents.executeJavaScript(functionString + ';0');
    });

    // Apply settings that doesn't need app restart on change
    ipcMain.on('settings-config-modified', () => {
        const config = new AppConfig();
        // Menu bar
        if (!win.menuBarVisible !== config.get().hideMenuBar || win.autoHideMenuBar !== config.get().hideMenuBar) {
            win.setAutoHideMenuBar(config.get().hideMenuBar);
            win.setMenuBarVisibility(!config.get().hideMenuBar);
        }

    });
    return win;
}