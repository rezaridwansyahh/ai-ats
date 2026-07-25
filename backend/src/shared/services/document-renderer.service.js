import puppeteer from 'puppeteer';
import HTMLtoDOCX from 'html-to-docx';

export const OFFER_LETTER_TEMPLATE_TEXT = `
Jakarta, «date»
No. «letter_number»

«name»
«address_1»
«address_2»
«Phone_number»

Letter of Offer

Dear «nick_name»,

We are pleased to offer you an employment with «company_name» (hereafter called "the Company") based on the terms and conditions specified below.

Position
You shall be designated as an «job_tittle» (Internal Title and Grade: «Internal_job_tittle»/ «job_grade»). During your service period, the Company reserves the right to transfer you to any other department or subsidiary Company within the Group.

Commencement Date
You shall start work with the Company on «joining_date»

Work Location
Your working location is Jakarta, and if necessary, elsewhere either in the principal and its branch office of the Company within the Republic of Indonesia and/or overseas.

Working Hours
Normal working hours shall be forty (40) hours per week, exclusive of Lunch Break. You shall observe the following official working hour:
Monday-Friday 08:00 hrs – 17:00 hrs
Lunch Break 12:00 hrs – 13:00 hrs
Working hours shall be subject to revision at the discretion of the Company.

Employment Status
We offer you as a permanent position upon the completion of 6 (six) months contractual. A separate Employment Contract will be arranged upon your acceptance of this offer. During the contract period, either party reserves the right to terminate the contract by giving to the other 1 (one) month notice in written or 1 (one) month's salary in-lieu of notice.

Salary
You will be paid a monthly net Basic Salary of IDR «basic_salary_» («basic_salary_in_words») which is subject to 2% statutory deduction i.e. employee contribution for Jamsostek Program. Your salary shall be paid at the last working day of the respective month and will be calculated in pro-rate in the event incompleted full month working days in your first month with the Company.
You are to keep your salary package strictly confidential at all times. The Company reserves the right to take disciplinary action against any person found to be in breach of this confidentiality obligation.

Car Allowance
You are eligible for a net monthly Car Allowance of IDR «car_allowance» («car_allowance_in_words») which may be revised at the Company's sole discretion.

Variable Pay Program
On top of Basic Salary you are also eligible for a potential annual variable pay which the actual payment will be based on actual company performance as well as individual performance.

Annual Wages Supplement/AWS (Religious Feast Day Allowance/THR)
An AWS equivalent to one (1) month of your basic salary or part thereof if you have less than twelve (12) months of first year continuous service (pro-rated) shall be paid on the Employee's Religious Feast Day or on other days stipulated in the Company policy / Union Agreement.

JAMSOSTEK Contribution
Your contributions to Jamsostek Program will be deducted from your salary each month and the Company will bear the mandatory employer's Jamsostek contribution.

Benefit Programs
Based on your position and grade you will be entitled for the Company standard benefits.

Confidentiality
You shall treat as confidential all information obtained during the course of fulfilling your employment with «company_name».

Company Assets
You shall treat and take care of Company's asset assigned to you.

Outside Employment
You shall not engage in any trade, business or paid occupation outside the Company without prior written consent.

Intellectual Property Right
You agree that all Intellectual Property created in the course of your employment belong to the Company.

General Conditions of Service & Termination of Employment
Your service with the Company will at all times be governed by prevailing Company policies and guidelines.

Termination of Employment
Termination can be effected either by the employee or by the Company giving to the other 1 month's notice in writing or 1 month's salary in-lieu of notice, or part thereof.
All employment benefits shall cease after the last day of service.

If you accept the above terms and conditions of employment, please confirm your acceptance by signing in the space below.

Yours sincerely,
«company_name»


«name»
«position»

I «name» National ID/Passport/Driving License No «NoKTP» have read and understood the above terms and conditions of employment and hereby agree to accept the Company's offer.

______________________________    ___________________
Signature                          Date

Attachment
Conflict of Interest declaration Form
Information Security Policy for Workplace
Code of Conduct – Global Business Standards
Collective Labor Agreement
`.trim();

export async function renderHtmlToPdf(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <html><head><meta charset="utf-8"><style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; padding: 40px; line-height: 1.5; }
        h2 { font-size: 13pt; margin-top: 18px; }
        p { margin: 6px 0; }
      </style></head><body>${html}</body></html>
    `, { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

export async function renderHtmlToDocx(html) {
  const buffer = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });
  return buffer;
}