export default class SeekJobMapper {
  static normalizeAll(scrapedList, type) {
    if (!Array.isArray(scrapedList)) return [];
    return scrapedList.map((scraped) => this.normalize(scraped, type));
  }

  static normalize(scraped, type) {
    const salaryInfo = this.extractSalary(scraped.kisaran_upah);

    return {
      job_title: scraped.job_title,
      job_desc: scraped.job_desc || '',
      job_location: scraped.lokasi || scraped.location || null,
      work_option: this.mapWorkOption(scraped.opsi_tempat_kerja),
      work_type: this.mapWorkType(scraped.jenis_pekerjaan),
      status: this.mapStatusFromType(type),
      candidate_count: scraped.candidate_count ?? null,
      additional: { type: "scraped" },
      seek_id: scraped.seek_id?.toString() || scraped.id_iklan || null,
      currency: salaryInfo.currency,
      pay_type: this.mapPayType(scraped.jenis_pembayaran),
      pay_min: salaryInfo.payMin,
      pay_max: salaryInfo.payMax,
      pay_display: salaryInfo.payDisplay,
      created_date_seek: scraped.dibuat || scraped.created_date || null,
      created_by: scraped.created_by || null
    };
  }

  // Status comes from which bucket we scraped (Seek's own ?type=open/expired page
  // filter), not from a "status" field in the scraped modal — that field never
  // actually exists in the jobInformation panel's data, so deriving it from scraped
  // text was silently always falling back to 'Running' for every job.
  static mapStatusFromType(type) {
    if (type === 'expired') return 'Expired';
    return 'Active'; // 'open' bucket
  }

  static mapWorkOption(option) {
    if (!option) return null;

    const o = option.toLowerCase();

    if (o.includes('kantor') || o.includes('on-site') || o.includes('onsite')) return 'On-site';
    if (o.includes('hibrid') || o.includes('hybrid'))  return 'Hybrid';
    if (o.includes('jarak jauh') || o.includes('remote')) return 'Remote';

    return null;
  }

  static mapWorkType(type) {
    if (!type) return null;

    const t = type.toLowerCase();

    if (t.includes('purna')) return 'Full-time';
    if (t.includes('paruh')) return 'Part-time';
    if (t.includes('kontrak')) return 'Contract';
    if (t.includes('biasa')) return 'Casual';

    return null;
  }

  static mapPayType(payType) {
    if (!payType) return null;

    const p = payType.toLowerCase();

    if (p.includes('jam')) return 'Hourly';
    if (p.includes('bulan')) return 'Monthly';
    if (p.includes('tahun')) return 'Annually';

    return null;
  }

  static extractSalary(text) {
    if (!text) {
      return { currency: null, payMin: null, payMax: null, payDisplay: null };
    }

    const lower = text.toLowerCase();

    const payDisplay = lower.includes('tersembunyi') ? 'Hide' : 'Show';

    const currencyMatch = text.match(/(AUD|HKD|IDR|MYR|NZD|PHP|SGD|THB|USD)/i);
    const currency = currencyMatch ? currencyMatch[1].toUpperCase() : null;

    let payMin = null;
    let payMax = null;

    const rangeMatchM = text.match(
      /(?:[A-Z]{3}\s*)?(\d+(?:\.\d+)?)\s*M\s*[–\-]\s*(?:[A-Z]{3}\s*)?(\d+(?:\.\d+)?)\s*M/i
    );

    if (rangeMatchM) {
      payMin = Math.round(parseFloat(rangeMatchM[1]) * 1_000_000);
      payMax = Math.round(parseFloat(rangeMatchM[2]) * 1_000_000);
    } else {
      const rangeMatchRaw = text.match(
        /(?:[A-Z]{3}\s*)?([\d.,]+)\s*[–\-]\s*(?:[A-Z]{3}\s*)?([\d.,]+)/i
      );

      if (rangeMatchRaw) {
        const min = parseFloat(rangeMatchRaw[1].replace(/[.,]/g, ''));
        const max = parseFloat(rangeMatchRaw[2].replace(/[.,]/g, ''));

        if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) {
          payMin = Math.round(min);
          payMax = Math.round(max);
        }
      }
    }

    return { currency, payMin, payMax, payDisplay };
  }
}