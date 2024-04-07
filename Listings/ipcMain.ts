//Es wird der Inter-Process Communication teil vom Main-Komponent dargestellt!

ipcMain.on('LOGIN', async (): Promise<void> => {
    const authWindow = this.createWindow('auth', this.authWindowOptions);
    this.authResult = await this.authProvider.login(authWindow);
    authWindow.close();

    if(this.authResult.access_token) {
        this.storeHelper.setSession(this.authResult);
        const username = await this.graph.getUserName(this.authResult.access_token);

        this.mainWindow.webContents.send('SUCCESS_LOGIN', username);
        this.isLoggedIn = true;

        this.continuousTokenUpdate(this.authResult.refresh_token);
    }
    else console.error(`Couldn't found AccessToken after login!`);
});

ipcMain.on('LOGOUT', async (): Promise<void> => {
    this.isLoggedIn = false;
    if(this.authResult.access_token) {
        clearInterval(this.options.refreshInterval);
        this.storeHelper.clearSession();
        this.storeHelper.clearConfig();
        setTimeout(() => {
            this.mainWindow.webContents.send('INTERNAL_UPDATE', []);
        }, 300);
        this.mainWindow.webContents.send('SUCCESS_LOGOUT');
    }
});

ipcMain.on('LOADED', async (): Promise<void> => {
    const session = this.storeHelper.getSession();
    if (session) {
        this.authResult = session;
        if (this.authResult.refresh_token) {
            let username;
            try {
                this.authResult = await this.authProvider.getNewToken(this.authResult.refresh_token);
                this.continuousTokenUpdate(this.authResult.refresh_token);
                username = await this.graph.getUserName(this.authResult.access_token);
                this.mainWindow.webContents.send('SUCCESS_LOGIN', username);
                this.isLoggedIn = true;
            } catch (e) {
                console.warn(`Sign in again!`, e);
            }
        }
        else console.error(`Couldn't found RefreshToken after loading the application!`);
    }


    this.config = this.storeHelper.getConfig();

    if (this.config) {
        this.mainWindow.webContents.send('CONFIG_UPDATE', this.config);
    }
});

ipcMain.on('CHANGE_SCREEN', (event, screenState): void => {
    this.mainWindow.webContents.send('UPDATE_SCREEN', screenState);
});


ipcMain.on('EXIT', (event): void => {
    this.storeHelper.setSession(this.authResult);
    this.app.quit();
});