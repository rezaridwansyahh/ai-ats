import getDb from '../../config/postgres.js';
import { slugify } from '../../shared/utils/slugify.js';

class CompanyModel {
  async findById(id) {
    const company = await getDb().query(`SELECT * FROM core_company WHERE id = $1`, [id]);
    return company.rows[0];
  }

  // Public career page lookup (/careers/:slug) — only ever needs the active
  // tenant's own public-facing fields, but returning the full row is fine
  // since nothing sensitive lives on core_company.
  async findBySlug(slug) {
    const result = await getDb().query(`SELECT * FROM core_company WHERE slug = $1`, [slug]);
    return result.rows[0];
  }

  // Same shape as findAll's per-row headcount, but for a single tenant —
  // used by the Super Admin company detail page.
  async findByIdWithUserCount(id) {
    const result = await getDb().query(`
      SELECT c.*, COUNT(u.id)::int AS user_count
      FROM core_company c
      LEFT JOIN master_users u ON u.company_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);
    return result.rows[0];
  }

  // Platform-admin view: every tenant plus a cheap headcount, for the
  // Super Admin dashboard/companies list — never scoped by company_id.
  async findAll() {
    const result = await getDb().query(`
      SELECT c.*, COUNT(u.id)::int AS user_count
      FROM core_company c
      LEFT JOIN master_users u ON u.company_id = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);
    return result.rows;
  }

  async create({ name, description, email, website, logo_url }) {
    const baseSlug = slugify(name) || 'company';
    let slug = baseSlug;
    let attempt = 0;

    // Retry with a numeric suffix on the rare chance two names slugify the
    // same way (the UNIQUE constraint is the real guard; this just avoids
    // bubbling a raw constraint-violation error for the common case).
    for (;;) {
      try {
        const result = await getDb().query(
          `INSERT INTO core_company (name, slug, description, email, website, logo_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [name, slug, description ?? null, email ?? null, website ?? null, logo_url ?? null]
        );
        return result.rows[0];
      } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('slug') && attempt < 5) {
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
          continue;
        }
        throw err;
      }
    }
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return await this.findById(id);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const result = await getDb().query(
      `UPDATE core_company SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...Object.values(fields), id]
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`DELETE FROM core_company WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }
}

export default new CompanyModel();
