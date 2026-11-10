import cookieModel from './cookie.model.js';
import BrowserPuppeteer from '../../shared/services/rpa/browser.js';
import { ContentFilterFinishReasonError } from 'openai/error';

class CookieService {
  async getCookie(account_id) {
    const cookie = await cookieModel.findByAccountId(account_id);

    return cookie;
  }

  async addCookies(account_id, cookies) {
    return await cookieModel.save(account_id, cookies);
  }
}

export default new CookieService();
