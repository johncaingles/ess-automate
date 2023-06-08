import 'dotenv/config';
import puppeteer from 'puppeteer';
import moment from 'moment';

const getTargetDates = () => {
  var dateArray = [];
  var startDate = moment(process.env.FROM_DATE, 'MM/DD/YYYY');
  var stopDate = moment(process.env.TO_DATE, 'MM/DD/YYYY');

  let currentDate = startDate;
  while (currentDate <= stopDate) {
    if(![0,6].includes(currentDate.day())) {
      dateArray.push( moment(currentDate).format('MM/DD/YYYY') ) 
    };
    currentDate = moment(currentDate).add(1, 'days');
  }
  return dateArray;
}

const waitAndClick = async (selector, page) => {
    await page.waitForSelector(selector);
    await page.click(selector);
}

const waitLoading = async (page) => {
  await page.waitForSelector('.ext-el-mask', {visible: true});
  await page.waitForSelector('.ext-el-mask', {hidden: true});
}

const clearField = async (selector, page) => {
  await page.focus(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
}

const fillUpAndSubmitForm = async (page, date) => {
  // Client
  const clientName = 'Work from Home';
  await page.type('::-p-text(Please Select...)', clientName[0], {delay: 1000})
  await waitAndClick('.x-combo-list-item::-p-text(Work from Home)', page)
  // Clear Date
  await clearField('input[name=Date]', page);
  const timesheetInputs = {
    'input[name=Date]': date,
    'input[name=TimeIn]': '8:00 AM',
    'input[name=TimeOut]': '5:00 PM',
    'textarea[name=Comment]': '917v work',
  }
  for (let key in timesheetInputs) {
    await page.type(key, timesheetInputs[key])
    await page.keyboard.press('Tab');
  }
  // Click Save
  await page.click('#maintenance-save');
  await waitAndClick('button::-p-text(Yes)', page)
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, timeout: 60000});
  const page = await browser.newPage();

  await page.goto('https://aws-ess3.payroll.ph/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // LOGIN
  const creds = {
    '#loginClientCode': process.env.CLIENT_CODE,
    '#loginEmployeeCode': process.env.EMPLOYEE_CODE,
    '#loginPassword': process.env.PASSWORD,
  }
  for (let key in creds) {
    await page.waitForSelector(key);
    await page.type(key, creds[key])
  }
  await page.click('input[value=Login]');
  await waitAndClick('::-p-text(OB Filing)', page);
  
  await waitLoading(page);
  for(const date of getTargetDates()) {
    await waitAndClick('::-p-text(New)', page);
    await fillUpAndSubmitForm(page, date);
    await waitLoading(page);
  }

  await browser.close();
})();