//Es wird lediglich der Logik-Loop der Main-Komponent dargestellt!

setInterval(async (): Promise<void> => {
  if (!this.isLoggedIn) return;

  const ianaTimeZones = this.findIana(this.options.windowsTimeZone);
  const startDate = this.moment.tz(ianaTimeZones![0].valueOf()).utc();
  const events = await this.graph.getUserDayCalendar(this.authResult, ianaTimeZones![0].valueOf(), startDate);
  const currentDate = new Date;
  const filteredEvents = [];
  let configEvent: any = null;

  for(const event of events) {
    const eventStartDate = new Date(event.start.dateTime);
    const eventEndDate = new Date(event.end.dateTime);
    if(eventStartDate.getDay() === currentDate.getDay()) {
      const preTime = this.moment(eventStartDate).subtract(30, 'm').toDate();
      const pastTime = this.moment(eventEndDate).add(30, 'm').toDate();
      const body = event.body.content.toString().replace(/(&nbsp;)/ig, ' ')
      if((currentDate > preTime) && (currentDate < pastTime)) {
        //SETTING NAME
        const nameFilter = /(?:\$\$NAME(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const name = nameFilter.exec(body);
        const nameOutput: string = name ? name[3] : '';
        //SETTING COMPANY
        const companyFilter = /(?:\$\$COMPANY(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const company = companyFilter.exec(body);
        const companyOutput: string = company ? company[3] : '';
        //SETTING RESPONSIBLE
        const contactFilter = /(?:\$\$CONTACT(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const contact = contactFilter.exec(body);
        let contactOutput: string = contact ? contact[3] : '';
        //SETTING INFO-TEXT
        const infoFilter = /(?:\$\$INFO(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const info = infoFilter.exec(body);
        let infoOutput: string = info ? info[3] : '';
        //SETTING EFFECT
        const animatedFilter = /\$\$ANIMATED/;
        const animated = animatedFilter.exec(body);
        let animatedOutput: boolean = animated !== null;
        //SETTING LOCATION
        const roomOutput = event?.location.displayName || '';
        //SETTING SUBJECT
        const subjectOutput = event?.subject || '';
        //SETTING ATTENDEES
        const attendeesOutput = event?.attendees || '';
        //SETTING BACKGROUND IMAGE
        const bgFilter = /(?:\$\$BACKGROUND(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const bg = bgFilter.exec(body);
        let bgOutput: string = bg ? `url('${bg[3]}` : 'url(\'public/images/skyline-ez.PNG';
        filteredEvents.push({
          subject: subjectOutput,
          guestName: nameOutput,
          guestCompany: companyOutput,
          attendees: attendeesOutput,
          guestResponsible: contactOutput,
          location: roomOutput,
          background: bgOutput,
          info: infoOutput,
          animated: animatedOutput,
          start: event.start.dateTime,
          end: event.end.dateTime
        });
      }
      else if(eventStartDate.getHours() === 0) {
        //SETTING BACKGROUND IMAGE
        const bgFilter = /(?:\$\$BACKGROUND(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const bg = bgFilter.exec(body);
        let bgOutput: string = bg ? `url('${bg[3]}` : 'url(\'public/images/skyline-ez.PNG';
        //SETTING MOTTO OF THE DAY
        const tickerFilter = /(?:\$\$TICKER(\s)*=(\s)*)(.*?)(?=\n|\$\$)/gs;
        const ticker = tickerFilter.exec(body);
        let tickerOutput = ticker ? ticker[3] : undefined;
        tickerOutput += '‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ '; // for additional whitespace after the string
        configEvent = {
          background: bgOutput,
          ticker: tickerOutput,
        };
        this.storeHelper.setConfig(configEvent);
        this.mainWindow.webContents.send('CONFIG_UPDATE', configEvent);
      }
    }
  }
  this.mainWindow.webContents.send('INTERNAL_UPDATE', filteredEvents);
}, this.options.intervals.updateEvents);

this.app.on('window-all-closed', () => {
  this.storeHelper.setSession(this.authResult);
  this.app.quit();
});